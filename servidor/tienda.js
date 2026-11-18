/* =========================================================
   Rutas públicas de la tienda: catálogo, sesión, pedidos, cuenta del cliente y Libro de Reclamaciones
   ========================================================= */
import { ErrorHttp, json, leerJson, texto, leerSesion, cerrarSesion, limitar, ipDe, catalogo, config, iso, COOKIE, borrarCookie, cumpleValido,
  aleatorio, codigoCupon, CUPON_RE, efectoCupon, topePuntos } from "./util.js";

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
   Los precios salen de la base, nunca del navegador.
   cupon (opcional, solo desde el carrito y con la cuenta abierta): código de un cupón activo del cliente. Si ya no sirve,
   el pedido se guarda igual, sin descuento, y queda anotado el código para que el panel lo vea. */
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
  const destino = entrega === "provincia" ? [d.distP, d.prov, d.dep].map(x => texto(x, 60)).filter(Boolean).join(", ") || null : null;
  const agencia = entrega === "provincia" ? texto(d.agencia, 150) || (texto(d.agenciaAlt, 150) ? "Sin agencia cerca, prefiere: " + texto(d.agenciaAlt, 150) : null) : null;

  const ses = await leerSesion(env, request, "cliente");
  // El mismo pedido enviado dos veces (doble toque o reintento): ya está guardado
  if (await env.DB.prepare("SELECT 1 FROM pedidos WHERE codigo = ?").bind(codigo).first()) return json({ ok: true, codigo, repetido: true });

  // Cupón de los Puntos MAISON: solo en el carrito y con la cuenta abierta
  const codCupon = origen === "carrito" && ses && CUPON_RE.test(String(b.cupon || "")) ? b.cupon : null;
  let cupon = null;
  if (codCupon) {
    const c = await env.DB.prepare("SELECT id, nombre, tipo, valor FROM cupones WHERE codigo = ? AND cliente_id = ? AND estado = 'activo'").bind(codCupon, ses.id).first();
    const ef = c && efectoCupon(c, { subtotal, descuento, entrega, envio });
    if (ef) cupon = { ...c, ...ef };
  }

  const guardar = cup => {
    const desc = r2(descuento + (cup ? cup.desc : 0)), env_ = cup ? cup.envio : envio;
    const total = r2(subtotal - desc + (env_ || 0));
    return env.DB.batch([
      env.DB.prepare(`INSERT INTO pedidos (codigo, origen, cliente_id, nombre, celular, entrega, distrito, direccion, referencia, destino, agencia,
          subtotal, descuento, envio, total, precio_pendiente, cupon_id, cupon_codigo, cupon_nombre, cupon_tipo, cupon_valor, cupon_desc)
          VALUES (?, ?, (SELECT id FROM clientes WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(codigo, origen, ses ? ses.id : null, texto(d.nombre, 120), texto(d.celular, 30), entrega,
          entrega === "domicilio" ? texto(d.distrito, 60) : null, entrega === "domicilio" ? texto(d.direccion, 200) : null,
          entrega === "domicilio" ? texto(d.referencia, 200) : null, destino, agencia, subtotal, desc, env_, total, pendiente,
          cup ? cup.id : null, codCupon, cup ? cup.nombre : null, cup ? cup.tipo : null, cup ? cup.valor : null, cup ? cup.desc : 0),
      ...items.map(i => env.DB.prepare(`INSERT INTO pedido_items (pedido_id, slug, nombre, color, talla, cantidad, precio)
          VALUES ((SELECT id FROM pedidos WHERE codigo = ?), ?, ?, ?, ?, ?, ?)`).bind(codigo, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio)),
    ]).then(() => total);
  };
  let total;
  try {
    total = await guardar(cupon);
  } catch (e) {
    const m = String(e.message);
    if (/UNIQUE/i.test(m)) return json({ ok: true, codigo, repetido: true });
    // El cupón se usó o se anuló justo ahora: el pedido se guarda igual, sin el descuento
    if (cupon && /CUPON_NO_DISPONIBLE/.test(m)) {
      try { total = await guardar(null); } catch (e2) { if (/UNIQUE/i.test(String(e2.message))) return json({ ok: true, codigo, repetido: true }); throw e2; }
      cupon = null;
    } else throw e;
  }
  return json({ ok: true, codigo, total, ...(codCupon ? { cupon: cupon ? "aplicado" : "no_disponible" } : {}) });
}

/* ---------- Cuenta del cliente ---------- */
async function clienteObligatorio(env, request) {
  const ses = await leerSesion(env, request, "cliente");
  if (!ses) throw new ErrorHttp(401, "sin_sesion");
  return ses;
}

/* GET /api/cuenta → sus datos, su historial de pedidos, sus Puntos MAISON, las recompensas y sus cupones.
   Los pedidos que la tienda cancela en el panel no se muestran al cliente: solo ve los que están en confirmación o confirmados. */
export async function cuenta({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  const tope = await topePuntos(env);
  const [cli, peds, items, tot, pts, recs, cups] = await env.DB.batch([
    env.DB.prepare("SELECT nombre, email, foto, promos, cumple, creado FROM clientes WHERE id = ?").bind(ses.id),
    env.DB.prepare(`SELECT p.id, p.codigo, p.creado, p.estado, p.origen, p.subtotal, p.descuento, p.envio, p.total, p.precio_pendiente,
        p.cupon_nombre, p.cupon_tipo, p.cupon_desc, (SELECT cantidad FROM puntos WHERE pedido_id = p.id AND motivo = 'pedido') AS puntos
      FROM pedidos p WHERE p.cliente_id = ? AND p.estado <> 'cancelado' ORDER BY p.creado DESC LIMIT 100`).bind(ses.id),
    env.DB.prepare("SELECT i.pedido_id, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio FROM pedido_items i JOIN pedidos p ON p.id = i.pedido_id WHERE p.cliente_id = ? AND p.estado <> 'cancelado' ORDER BY i.id").bind(ses.id),
    env.DB.prepare("SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS n FROM pedidos WHERE cliente_id = ? AND estado = 'procede'").bind(ses.id),
    env.DB.prepare("SELECT COALESCE(SUM(cantidad), 0) AS saldo FROM puntos WHERE cliente_id = ?").bind(ses.id),
    env.DB.prepare("SELECT id, nombre, puntos, tipo, valor FROM recompensas WHERE activa = 1 AND puntos <= ? ORDER BY puntos, id").bind(tope),
    env.DB.prepare(`SELECT c.codigo, c.nombre, c.tipo, c.valor, c.estado, p.codigo AS pedido FROM cupones c LEFT JOIN pedidos p ON p.id = c.pedido_id
      WHERE c.cliente_id = ? AND c.estado IN ('activo', 'en_pedido') ORDER BY c.id`).bind(ses.id),
  ]);
  const c = cli.results[0];
  if (!c) throw new ErrorHttp(401, "sin_sesion");
  const porPedido = {};
  for (const i of items.results) (porPedido[i.pedido_id] ||= []).push({ slug: i.slug, nombre: i.nombre, color: i.color, talla: i.talla, cantidad: i.cantidad, precio: i.precio });
  return json({
    ok: true,
    cliente: { nombre: c.nombre, email: c.email, foto: c.foto, promos: !!c.promos, cumple: c.cumple || null, desde: iso(c.creado) },
    compras: { total: tot.results[0].total, pedidos: tot.results[0].n },
    puntos: pts.results[0].saldo,
    recompensas: recs.results,
    tope, // máximo de puntos por pedido
    cupones: cups.results,
    pedidos: peds.results.map(p => ({
      codigo: p.codigo, fecha: iso(p.creado), estado: p.estado, origen: p.origen, subtotal: p.subtotal, descuento: p.descuento, envio: p.envio, total: p.total,
      consultar: !!p.precio_pendiente, puntos: p.puntos || 0,
      cupon: p.cupon_tipo ? { nombre: p.cupon_nombre, tipo: p.cupon_tipo, desc: p.cupon_desc } : null,
      items: porPedido[p.id] || [],
    })),
  });
}

/* GET /api/cuenta/cupones → solo sus cupones listos para usar (para el carrito) */
export async function misCupones({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  const r = await env.DB.prepare("SELECT codigo, nombre, tipo, valor FROM cupones WHERE cliente_id = ? AND estado = 'activo' ORDER BY id").bind(ses.id).all();
  return json({ ok: true, cupones: r.results });
}

/* POST /api/cuenta/canjear { recompensa: id } → descuenta los puntos y le da un cupón para el carrito.
   La base no deja canjear si no le alcanzan los puntos (disparador puntos_sin_negativo). */
export async function canjear({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  await limitar(env, "canje:" + ses.id, 20, 60);
  const b = await leerJson(request);
  const rid = Math.trunc(+b.recompensa);
  if (!(rid > 0)) throw new ErrorHttp(400, "datos_invalidos");
  const tope = await topePuntos(env);
  let codigo;
  for (let intento = 0; intento < 3 && !codigo; intento++) {
    const cod = codigoCupon();
    try {
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO cupones (codigo, cliente_id, recompensa_id, nombre, tipo, valor, puntos)
            SELECT ?, ?, id, nombre, tipo, valor, puntos FROM recompensas
             WHERE id = ? AND activa = 1 AND puntos <= ? AND puntos <= COALESCE((SELECT SUM(cantidad) FROM puntos WHERE cliente_id = ?), 0)`).bind(cod, ses.id, rid, tope, ses.id),
        env.DB.prepare("INSERT INTO puntos (cliente_id, cantidad, motivo, cupon_id) SELECT cliente_id, -puntos, 'canje', id FROM cupones WHERE codigo = ?").bind(cod),
      ]);
      codigo = cod;
    } catch (e) {
      const m = String(e.message);
      if (/PUNTOS_INSUFICIENTES/.test(m)) throw new ErrorHttp(409, "puntos_insuficientes");
      if (!/UNIQUE/i.test(m)) throw e; // código repetido (rarísimo): se intenta con otro
    }
  }
  const [cup, rec, pts] = await env.DB.batch([
    env.DB.prepare("SELECT codigo, nombre, tipo, valor, puntos FROM cupones WHERE codigo = ? AND cliente_id = ?").bind(codigo || "", ses.id),
    env.DB.prepare("SELECT activa FROM recompensas WHERE id = ? AND puntos <= ?").bind(rid, tope),
    env.DB.prepare("SELECT COALESCE(SUM(cantidad), 0) AS saldo FROM puntos WHERE cliente_id = ?").bind(ses.id),
  ]);
  if (!cup.results[0]) {
    if (!rec.results[0] || !rec.results[0].activa) throw new ErrorHttp(404, "recompensa_no_disponible");
    throw new ErrorHttp(409, "puntos_insuficientes", { saldo: pts.results[0].saldo });
  }
  return json({ ok: true, cupon: cup.results[0], puntos: pts.results[0].saldo });
}

/* Foto de perfil: llega como imagen JPG, WebP o PNG en base64 (el celular ya la recortó y achicó a 400 × 400) */
const FOTO_MAX = 200000; // caracteres en base64 (≈150 KB)
function leerFoto(v) {
  const m = /^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(v || ""));
  if (!m || m[2].length > FOTO_MAX) throw new ErrorHttp(400, "foto_invalida");
  let cab;
  try { cab = Uint8Array.from(atob(m[2].slice(0, 24)), ch => ch.charCodeAt(0)); } catch (_) { throw new ErrorHttp(400, "foto_invalida"); }
  const es = (off, bytes) => bytes.every((x, i) => cab[off + i] === x);
  const ok = m[1] === "image/jpeg" ? es(0, [0xff, 0xd8, 0xff]) : m[1] === "image/png" ? es(0, [0x89, 0x50, 0x4e, 0x47]) : es(0, [0x52, 0x49, 0x46, 0x46]) && es(8, [0x57, 0x45, 0x42, 0x50]);
  if (!ok) throw new ErrorHttp(400, "foto_invalida");
  return { tipo: m[1], datos: m[2] };
}

/* PATCH /api/cuenta → { promos: true | false } · { cumple: "MM-DD" } · { nombre, foto } (cualquiera de los dos; foto null = quitarla)
   El cumpleaños se guarda una sola vez: después ya no se cambia desde la cuenta (así nadie lo mueve para cobrar un regalo dos veces).
   El correo no se cambia: es el de su cuenta de Google. */
export async function cambiarCuenta({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  const b = await leerJson(request, 250000);
  if ("cumple" in b) {
    const cumple = cumpleValido(b.cumple);
    if (!cumple) throw new ErrorHttp(400, "cumple_invalido");
    const r = await env.DB.prepare("UPDATE clientes SET cumple = ?, cumple_fecha = datetime('now') WHERE id = ? AND cumple IS NULL").bind(cumple, ses.id).run();
    if (!r.meta.changes) throw new ErrorHttp(409, "cumple_ya_guardado");
    return json({ ok: true, cumple });
  }
  if ("nombre" in b || "foto" in b) {
    await limitar(env, "perfil:" + ses.id, 30, 60);
    const sets = [], vals = [], antes = [];
    let nombre, foto;
    if ("nombre" in b) {
      nombre = texto(b.nombre, 60);
      if (!nombre || nombre.length < 2) throw new ErrorHttp(400, "nombre_invalido");
      sets.push("nombre = ?", "nombre_propio = 1"); vals.push(nombre);
    }
    if ("foto" in b) {
      antes.push(env.DB.prepare("DELETE FROM fotos_clientes WHERE cliente_id = ?").bind(ses.id));
      if (b.foto === null) { foto = null; sets.push("foto = NULL", "foto_propia = 1"); }
      else {
        const f = leerFoto(b.foto), token = aleatorio(18);
        antes.push(env.DB.prepare("INSERT INTO fotos_clientes (token, cliente_id, tipo, datos) VALUES (?, ?, ?, ?)").bind(token, ses.id, f.tipo, f.datos));
        foto = "/api/foto/" + token; sets.push("foto = ?", "foto_propia = 1"); vals.push(foto);
      }
    }
    await env.DB.batch([...antes, env.DB.prepare(`UPDATE clientes SET ${sets.join(", ")} WHERE id = ?`).bind(...vals, ses.id)]);
    return json({ ok: true, ...("nombre" in b ? { nombre } : {}), ...("foto" in b ? { foto } : {}) });
  }
  if (typeof b.promos !== "boolean") throw new ErrorHttp(400, "datos_invalidos");
  await env.DB.prepare("UPDATE clientes SET promos = ?, promos_fecha = datetime('now') WHERE id = ?").bind(b.promos ? 1 : 0, ses.id).run();
  return json({ ok: true, promos: b.promos });
}

/* GET /api/foto/:token → la foto de perfil que subió el cliente (el enlace cambia con cada foto nueva) */
export async function foto({ env, params }) {
  const f = await env.DB.prepare("SELECT tipo, datos FROM fotos_clientes WHERE token = ?").bind(params[0]).first();
  if (!f) return new Response("No existe", { status: 404, headers: { "cache-control": "no-store" } });
  const bin = Uint8Array.from(atob(f.datos), ch => ch.charCodeAt(0));
  return new Response(bin, { headers: { "content-type": f.tipo, "cache-control": "private, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}

/* DELETE /api/cuenta → elimina la cuenta: se borran sus datos, su foto, sus puntos y cupones, y su historial deja de estar ligado a la persona.
   Las ventas quedan en la tienda de forma anónima (qué prenda, talla, cantidad, monto y fecha), sin nombre ni contacto. */
export async function eliminarCuenta({ env, request }) {
  const ses = await clienteObligatorio(env, request);
  await env.DB.batch([
    env.DB.prepare(`UPDATE pedidos SET cliente_id = NULL, nombre = NULL, celular = NULL, direccion = NULL, referencia = NULL, destino = NULL, agencia = NULL, cupon_id = NULL
        WHERE cliente_id = ?`).bind(ses.id),
    env.DB.prepare("DELETE FROM puntos WHERE cliente_id = ?").bind(ses.id),
    env.DB.prepare("DELETE FROM cupones WHERE cliente_id = ?").bind(ses.id),
    env.DB.prepare("DELETE FROM fotos_clientes WHERE cliente_id = ?").bind(ses.id),
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
