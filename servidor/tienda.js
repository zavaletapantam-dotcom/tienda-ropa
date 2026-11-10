/* =========================================================
   Rutas públicas de la tienda: catálogo, sesión, pedidos, cuenta del cliente y Libro de Reclamaciones
   ========================================================= */
import { ErrorHttp, json, leerJson, texto, leerSesion, cerrarSesion, limitar, ipDe, catalogo, config, iso, COOKIE, borrarCookie } from "./util.js";

const googleListo = env => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const r2 = n => Math.round(n * 100) / 100;

/* GET /api/inicio → catálogo (precios, estado y stock) + sesión del cliente, en una sola llamada */
export async function inicio({ env, request }) {
  const [cat, cliente] = await Promise.all([catalogo(env), clienteActual(env, request)]);
  const s = { google: googleListo(env), cliente };
  return json(`{"c":${cat},"s":${JSON.stringify(s)}}`);
}

async function clienteActual(env, request) {
  const ses = await leerSesion(env, request, "cliente");
  if (!ses) return null;
  const c = await env.DB.prepare("SELECT nombre, email, foto, promos FROM clientes WHERE id = ?").bind(ses.id).first();
  return c ? { nombre: c.nombre, email: c.email, foto: c.foto, promos: !!c.promos } : null;
}

/* POST /api/pedidos → guarda el pedido que el cliente envía por WhatsApp (queda "pendiente").
   Los precios salen de la base, nunca del navegador. */
export async function crearPedido({ env, request }) {
  await limitar(env, "pedido:" + ipDe(request), 30, 60);
  const b = await leerJson(request);
  const codigo = String(b.codigo || "");
  if (!/^MS[A-HJ-NP-Z2-9]{6}$/.test(codigo)) throw new ErrorHttp(400, "codigo_invalido");
  const origen = b.origen;
  if (!["carrito", "producto", "pack"].includes(origen)) throw new ErrorHttp(400, "origen_invalido");

  // Prendas: se juntan las repetidas (misma prenda, color y talla)
  const cant = new Map();
  for (const it of (Array.isArray(b.items) ? b.items : []).slice(0, 40)) {
    const k = [it.slug, it.color, it.talla].map(x => String(x ?? "")).join("|"), n = Math.trunc(+it.cantidad);
    if (!(n >= 1 && n <= 20)) throw new ErrorHttp(400, "cantidad_invalida");
    cant.set(k, Math.min(20, (cant.get(k) || 0) + n));
  }
  if (!cant.size) throw new ErrorHttp(400, "sin_prendas");
  const claves = [...cant.keys()];
  const filas = (await env.DB.prepare(`SELECT v.slug, v.color, v.talla, p.nombre, p.precio FROM variantes v JOIN productos p ON p.slug = v.slug
      WHERE v.slug || '|' || v.color || '|' || v.talla IN (${claves.map(() => "?").join(", ")})`).bind(...claves).all()).results;
  if (filas.length !== claves.length) throw new ErrorHttp(400, "prenda_no_existe");

  const cfg = await config(env);
  let subtotal = 0, pendiente = 0;
  const items = filas.map(f => {
    const n = cant.get([f.slug, f.color, f.talla].join("|"));
    if (f.precio == null) pendiente = 1; else subtotal += f.precio * n;
    return { ...f, cantidad: n };
  });
  subtotal = r2(subtotal);
  const descuento = origen === "pack" && items.length === cfg.packPasos && items.every(i => i.cantidad === 1) ? r2(subtotal * cfg.packDescuento) : 0;

  // Datos de entrega (solo los pide el carrito)
  const d = origen === "carrito" && b.datos && typeof b.datos === "object" ? b.datos : {};
  const entrega = ["domicilio", "recojo", "provincia"].includes(d.entrega) ? d.entrega : null;
  if (origen === "carrito" && (!entrega || !texto(d.nombre))) throw new ErrorHttp(400, "faltan_datos");
  const envio = entrega === "domicilio" ? (subtotal >= cfg.gratisDesde ? 0 : cfg.envio) : entrega === "recojo" ? 0 : null;
  const total = r2(subtotal - descuento + (envio || 0));
  const destino = entrega === "provincia" ? [d.distP, d.prov, d.dep].map(x => texto(x, 60)).filter(Boolean).join(", ") || null : null;
  const agencia = entrega === "provincia" ? texto(d.agencia, 150) || (texto(d.agenciaAlt, 150) ? "Sin agencia cerca, prefiere: " + texto(d.agenciaAlt, 150) : null) : null;

  const ses = await leerSesion(env, request, "cliente");
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO pedidos (codigo, origen, cliente_id, nombre, celular, entrega, distrito, direccion, referencia, destino, agencia,
          subtotal, descuento, envio, total, precio_pendiente) VALUES (?, ?, (SELECT id FROM clientes WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(codigo, origen, ses ? ses.id : null, texto(d.nombre, 120), texto(d.celular, 30), entrega,
          entrega === "domicilio" ? texto(d.distrito, 60) : null, entrega === "domicilio" ? texto(d.direccion, 200) : null,
          entrega === "domicilio" ? texto(d.referencia, 200) : null, destino, agencia, subtotal, descuento, envio, total, pendiente),
      ...items.map(i => env.DB.prepare(`INSERT INTO pedido_items (pedido_id, slug, nombre, color, talla, cantidad, precio)
          VALUES ((SELECT id FROM pedidos WHERE codigo = ?), ?, ?, ?, ?, ?, ?)`).bind(codigo, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio)),
    ]);
  } catch (e) {
    // El mismo pedido enviado dos veces (doble toque o reintento): ya está guardado
    if (/UNIQUE/i.test(String(e.message))) return json({ ok: true, codigo, repetido: true });
    throw e;
  }
  return json({ ok: true, codigo, total });
}

/* ---------- Cuenta del cliente ---------- */
async function clienteObligatorio(env, request) {
  const ses = await leerSesion(env, request, "cliente");
  if (!ses) throw new ErrorHttp(401, "sin_sesion");
  return ses;
}

/* GET /api/cuenta → sus datos y su historial de pedidos */
export async function cuenta({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  const [cli, peds, items, tot] = await env.DB.batch([
    env.DB.prepare("SELECT nombre, email, foto, promos, creado FROM clientes WHERE id = ?").bind(ses.id),
    env.DB.prepare("SELECT id, codigo, creado, estado, origen, subtotal, descuento, envio, total, precio_pendiente FROM pedidos WHERE cliente_id = ? ORDER BY creado DESC LIMIT 100").bind(ses.id),
    env.DB.prepare("SELECT i.pedido_id, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio FROM pedido_items i JOIN pedidos p ON p.id = i.pedido_id WHERE p.cliente_id = ? ORDER BY i.id").bind(ses.id),
    env.DB.prepare("SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS n FROM pedidos WHERE cliente_id = ? AND estado = 'procede'").bind(ses.id),
  ]);
  const c = cli.results[0];
  if (!c) throw new ErrorHttp(401, "sin_sesion");
  const porPedido = {};
  for (const i of items.results) (porPedido[i.pedido_id] ||= []).push({ slug: i.slug, nombre: i.nombre, color: i.color, talla: i.talla, cantidad: i.cantidad, precio: i.precio });
  return json({
    ok: true,
    cliente: { nombre: c.nombre, email: c.email, foto: c.foto, promos: !!c.promos, desde: iso(c.creado) },
    compras: { total: tot.results[0].total, pedidos: tot.results[0].n },
    pedidos: peds.results.map(p => ({ codigo: p.codigo, fecha: iso(p.creado), estado: p.estado, origen: p.origen, subtotal: p.subtotal, descuento: p.descuento, envio: p.envio, total: p.total, consultar: !!p.precio_pendiente, items: porPedido[p.id] || [] })),
  });
}

/* PATCH /api/cuenta → { promos: true | false } */
export async function cambiarCuenta({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  const b = await leerJson(request);
  if (typeof b.promos !== "boolean") throw new ErrorHttp(400, "datos_invalidos");
  await env.DB.prepare("UPDATE clientes SET promos = ?, promos_fecha = datetime('now') WHERE id = ?").bind(b.promos ? 1 : 0, ses.id).run();
  return json({ ok: true, promos: b.promos });
}

/* DELETE /api/cuenta → elimina la cuenta: se borran sus datos y su historial deja de estar ligado a la persona.
   Las ventas quedan en la tienda de forma anónima (qué prenda, talla, cantidad, monto y fecha), sin nombre ni contacto. */
export async function eliminarCuenta({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  await env.DB.batch([
    env.DB.prepare(`UPDATE pedidos SET cliente_id = NULL, nombre = NULL, celular = NULL, direccion = NULL, referencia = NULL, destino = NULL, agencia = NULL
        WHERE cliente_id = ?`).bind(ses.id),
    env.DB.prepare("DELETE FROM sesiones WHERE tipo = 'cliente' AND usuario_id = ?").bind(ses.id),
    env.DB.prepare("DELETE FROM clientes WHERE id = ?").bind(ses.id),
  ]);
  return json({ ok: true }, 200, { "set-cookie": borrarCookie(COOKIE.cliente) });
}

/* POST /api/auth/salir → cierra la sesión del cliente */
export async function salirCliente({ env, request }) {
  const ses = await leerSesion(env, request, "cliente");
  if (ses) await cerrarSesion(env, ses.token);
  return json({ ok: true }, 200, { "set-cookie": borrarCookie(COOKIE.cliente) });
}

/* ---------- Libro de Reclamaciones ---------- */
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
/* POST /api/reclamos → registra la hoja con su número correlativo del año (AAAA-000001) */
export async function crearReclamo({ env, request }) {
  await limitar(env, "reclamo:" + ipDe(request), 5, 60);
  const b = await leerJson(request);
  const v = {
    tipo: b.tipo, nombre: texto(b.nombre, 120), documento_tipo: b.documento_tipo, documento: texto(b.documento, 20),
    domicilio: texto(b.domicilio, 200), telefono: texto(b.telefono, 30), email: texto(b.email, 254), menor: b.menor === true ? 1 : 0,
    apoderado: texto(b.apoderado, 160), bien: b.bien, monto: b.monto === "" || b.monto == null ? null : +b.monto,
    descripcion: texto(b.descripcion, 300), pedido_codigo: texto(b.pedido_codigo, 20), detalle: texto(b.detalle, 2500), pedido_consumidor: texto(b.pedido_consumidor, 1200),
  };
  const malos = [];
  if (!["reclamo", "queja"].includes(v.tipo)) malos.push("tipo");
  if (!["producto", "servicio"].includes(v.bien)) malos.push("bien");
  if (!["DNI", "CE", "Pasaporte", "RUC"].includes(v.documento_tipo)) malos.push("documento_tipo");
  ["nombre", "documento", "domicilio", "telefono", "descripcion", "detalle", "pedido_consumidor"].forEach(k => { if (!v[k]) malos.push(k); });
  if (!v.email || !EMAIL.test(v.email)) malos.push("email");
  if (v.menor && !v.apoderado) malos.push("apoderado");
  if (v.monto != null && !(v.monto >= 0 && v.monto < 1e7)) malos.push("monto");
  if (malos.length) throw new ErrorHttp(400, "faltan_datos", { campos: malos });

  const r = await env.DB.prepare(`INSERT INTO reclamos (numero, tipo, nombre, documento_tipo, documento, domicilio, telefono, email, menor, apoderado,
        bien, monto, descripcion, pedido_codigo, detalle, pedido_consumidor)
      VALUES ((SELECT strftime('%Y', 'now', '-5 hours') || '-' || printf('%06d', COALESCE(MAX(CAST(substr(numero, 6) AS INTEGER)), 0) + 1)
               FROM reclamos WHERE numero LIKE strftime('%Y', 'now', '-5 hours') || '-%'),
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING numero, creado`)
    .bind(v.tipo, v.nombre, v.documento_tipo, v.documento, v.domicilio, v.telefono, v.email, v.menor, v.menor ? v.apoderado : null,
      v.bien, v.monto, v.descripcion, v.pedido_codigo, v.detalle, v.pedido_consumidor).first();
  return json({ ok: true, numero: r.numero, fecha: iso(r.creado) });
}
