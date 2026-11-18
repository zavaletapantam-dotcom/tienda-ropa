/* =========================================================
   Rutas del panel admin (/api/admin/...). Todas piden sesión de administrador, salvo entrar y activar.
   ========================================================= */
import {
  ErrorHttp, json, leerJson, texto, cifrarClave, verificarClave, sha256, crearSesion, leerSesion, cerrarSesion,
  limitar, ipDe, ctxStock, ctxFin, iso, cookie, borrarCookie, COOKIE, config, cumpleValido, efectoCupon, topePuntos,
} from "./util.js";

const HORAS_SESION = 12;
const MAX_FALLOS = 5, MINUTOS_BLOQUEO = 15;
const HOY = "date('now', '-5 hours')"; // fecha de hoy en Perú

async function adminDe(env, request) {
  const ses = await leerSesion(env, request, "admin");
  if (!ses) throw new ErrorHttp(401, "sin_sesion");
  const a = await env.DB.prepare("SELECT id, usuario, nombre FROM admins WHERE id = ? AND activo = 1").bind(ses.id).first();
  if (!a) throw new ErrorHttp(401, "sin_sesion");
  return { ...a, token: ses.token };
}
const sesionCookie = token => cookie(COOKIE.admin, token, { maxAge: HORAS_SESION * 3600, sameSite: "Strict" });

/* ---------- Acceso ---------- */

/* POST /api/admin/entrar { usuario, clave } — 5 intentos fallidos seguidos bloquean ese usuario 15 minutos */
export async function entrar({ env, request }) {
  await limitar(env, "entrar:" + ipDe(request), 40, 15);
  const b = await leerJson(request);
  const usuario = (texto(b.usuario, 40) || "").toLowerCase(), clave = String(b.clave || "");
  if (!usuario || !clave) throw new ErrorHttp(400, "faltan_datos");
  const k = "admin:" + usuario;
  const bloq = await env.DB.prepare("SELECT CAST((julianday(hasta) - julianday('now')) * 1440 AS INTEGER) + 1 AS min FROM intentos WHERE clave = ? AND hasta > datetime('now')").bind(k).first();
  if (bloq) throw new ErrorHttp(429, "bloqueado", { minutos: bloq.min });
  const a = await env.DB.prepare("SELECT id, nombre, clave FROM admins WHERE usuario = ? AND activo = 1").bind(usuario).first();
  const ok = a ? await verificarClave(clave, a.clave) : (await cifrarClave(clave), false);
  if (!ok) {
    const r = await env.DB.prepare(`INSERT INTO intentos (clave, fallos) VALUES (?, 1)
        ON CONFLICT(clave) DO UPDATE SET fallos = CASE WHEN intentos.hasta IS NOT NULL THEN 1 ELSE intentos.fallos + 1 END, hasta = NULL
        RETURNING fallos`).bind(k).first();
    if (r.fallos >= MAX_FALLOS) {
      await env.DB.prepare("UPDATE intentos SET hasta = datetime('now', ?) WHERE clave = ?").bind(`+${MINUTOS_BLOQUEO} minutes`, k).run();
      throw new ErrorHttp(429, "bloqueado", { minutos: MINUTOS_BLOQUEO });
    }
    throw new ErrorHttp(401, "datos_incorrectos", { quedan: MAX_FALLOS - r.fallos });
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM intentos WHERE clave = ?").bind(k),
    env.DB.prepare("UPDATE admins SET ultimo_acceso = datetime('now') WHERE id = ?").bind(a.id),
  ]);
  const token = await crearSesion(env, "admin", a.id, HORAS_SESION);
  return json({ ok: true, nombre: a.nombre }, 200, { "set-cookie": sesionCookie(token) });
}

/* POST /api/admin/salir */
export async function salir({ env, request }) {
  const ses = await leerSesion(env, request, "admin");
  if (ses) await cerrarSesion(env, ses.token);
  return json({ ok: true }, 200, { "set-cookie": borrarCookie(COOKIE.admin, "Strict") });
}

/* GET /api/admin/yo */
export async function yo({ env, request }) {
  const a = await adminDe(env, request);
  return json({ ok: true, nombre: a.nombre, usuario: a.usuario });
}

/* POST /api/admin/invitacion { token } → para quién es el enlace de activación (si sigue vigente) */
export async function invitacion({ env, request }) {
  await limitar(env, "invitacion:" + ipDe(request), 30, 15);
  const b = await leerJson(request);
  const inv = await env.DB.prepare("SELECT nombre FROM invitaciones WHERE token = ? AND usada IS NULL AND expira > datetime('now')").bind(await sha256(String(b.token || ""))).first();
  if (!inv) throw new ErrorHttp(404, "enlace_vencido");
  return json({ ok: true, nombre: inv.nombre });
}

/* POST /api/admin/activar { token, usuario, clave } → crea el acceso; el enlace deja de servir */
export async function activar({ env, request }) {
  await limitar(env, "invitacion:" + ipDe(request), 30, 15);
  const b = await leerJson(request);
  const resumen = await sha256(String(b.token || ""));
  const inv = await env.DB.prepare("SELECT nombre FROM invitaciones WHERE token = ? AND usada IS NULL AND expira > datetime('now')").bind(resumen).first();
  if (!inv) throw new ErrorHttp(404, "enlace_vencido");
  const usuario = String(b.usuario || "").trim().toLowerCase(), clave = String(b.clave || "");
  const nombre = texto(b.nombre, 60) || inv.nombre; // el nombre con el que aparece en el panel y en el historial
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) throw new ErrorHttp(400, "usuario_invalido");
  if (clave.length < 10 || clave.length > 200) throw new ErrorHttp(400, "clave_corta");
  if (clave.toLowerCase().includes(usuario)) throw new ErrorHttp(400, "clave_con_usuario");
  if (await env.DB.prepare("SELECT 1 FROM admins WHERE usuario = ?").bind(usuario).first()) throw new ErrorHttp(409, "usuario_existe");
  const hash = await cifrarClave(clave);
  const [nuevo] = await env.DB.batch([
    env.DB.prepare("INSERT INTO admins (usuario, nombre, clave, ultimo_acceso) VALUES (?, ?, ?, datetime('now')) RETURNING id").bind(usuario, nombre, hash),
    env.DB.prepare("UPDATE invitaciones SET usada = datetime('now'), admin_id = (SELECT id FROM admins WHERE usuario = ?) WHERE token = ?").bind(usuario, resumen),
  ]);
  const token = await crearSesion(env, "admin", nuevo.results[0].id, HORAS_SESION);
  return json({ ok: true, nombre }, 200, { "set-cookie": sesionCookie(token) });
}

/* ---------- Resumen ---------- */

/* GET /api/admin/resumen → ventas, pendientes, lo más vendido y consultado, stock bajo (datos reales de la base) */
export async function resumen({ env, request }) {
  await adminDe(env, request);
  await purgarCancelados(env);
  const venta = cond => `SELECT COALESCE(SUM(total), 0) AS monto, COUNT(*) AS n FROM pedidos WHERE estado = 'procede' AND ${cond}`;
  const MES = "strftime('%Y-%m', 'now', '-5 hours')";
  const [hoy, semana, mes, pend, rec, cli, top, cons, bajo, stock, fisico, menor, mayor] = await env.DB.batch([
    env.DB.prepare(venta(`date(procesado, '-5 hours') = ${HOY}`)),
    env.DB.prepare(venta(`date(procesado, '-5 hours') >= date('now', '-5 hours', '-6 days')`)),
    env.DB.prepare(venta(`strftime('%Y-%m', procesado, '-5 hours') = strftime('%Y-%m', 'now', '-5 hours')`)),
    env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS monto FROM pedidos WHERE estado = 'pendiente'"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM reclamos WHERE estado = 'pendiente'"),
    env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(promos), 0) AS promos FROM clientes"),
    env.DB.prepare(`SELECT i.slug, i.nombre, SUM(i.cantidad) AS n, SUM(i.cantidad * COALESCE(i.precio, 0)) AS monto FROM pedido_items i JOIN pedidos p ON p.id = i.pedido_id
        WHERE p.estado = 'procede' AND p.procesado >= datetime('now', '-30 days') GROUP BY i.slug ORDER BY n DESC, monto DESC LIMIT 6`),
    env.DB.prepare(`SELECT i.slug, i.nombre, SUM(i.cantidad) AS n, COUNT(DISTINCT p.id) AS pedidos FROM pedido_items i JOIN pedidos p ON p.id = i.pedido_id
        WHERE p.creado >= datetime('now', '-30 days') GROUP BY i.slug ORDER BY n DESC LIMIT 6`),
    env.DB.prepare(`SELECT v.slug, p.nombre, v.color, v.talla, v.stock FROM variantes v JOIN productos p ON p.slug = v.slug
        WHERE v.stock IS NOT NULL AND v.stock <= 2 AND p.estado <> 'oculto'
          AND NOT EXISTS (SELECT 1 FROM colores_ocultos o WHERE o.slug = v.slug AND o.color = v.color)
        ORDER BY v.stock, p.orden, v.orden LIMIT 12`),
    env.DB.prepare("SELECT COUNT(*) AS tallas, COUNT(stock) AS cargadas, COALESCE(SUM(stock), 0) AS unidades FROM variantes"),
    // Inventario físico: unidades, valor (unidades × costo) y prendas con stock físico pero sin costo
    env.DB.prepare(`SELECT COUNT(v.fisico) AS cargadas, COALESCE(SUM(v.fisico), 0) AS unidades, COALESCE(SUM(v.fisico * p.costo), 0) AS valor,
        COUNT(DISTINCT CASE WHEN v.fisico > 0 AND p.costo IS NULL THEN p.slug END) AS sin_costo
      FROM variantes v JOIN productos p ON p.slug = v.slug`),
    // Ganancia del mes, minorista: venta de prendas (sin envío, menos descuentos de pack) frente a su costo del día
    env.DB.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(venta), 0) AS ventas, COALESCE(SUM(CASE WHEN sin_costo = 0 THEN venta END), 0) AS ventas_con_costo,
        COALESCE(SUM(CASE WHEN sin_costo = 0 THEN costo END), 0) AS costo, COALESCE(SUM(sin_costo > 0), 0) AS sin_costo
      FROM (SELECT p.id, SUM(i.precio * i.cantidad) - p.descuento AS venta, SUM(i.costo * i.cantidad) AS costo, SUM(i.costo IS NULL) AS sin_costo
            FROM pedidos p JOIN pedido_items i ON i.pedido_id = p.id
            WHERE p.estado = 'procede' AND strftime('%Y-%m', p.procesado, '-5 hours') = ${MES} GROUP BY p.id)`),
    // Ganancia del mes, mayorista
    env.DB.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(venta), 0) AS ventas, COALESCE(SUM(CASE WHEN sin_costo = 0 THEN venta END), 0) AS ventas_con_costo,
        COALESCE(SUM(CASE WHEN sin_costo = 0 THEN costo END), 0) AS costo, COALESCE(SUM(sin_costo > 0), 0) AS sin_costo
      FROM (SELECT v.id, SUM(i.precio * i.cantidad) AS venta, SUM(i.costo * i.cantidad) AS costo, SUM(i.costo IS NULL) AS sin_costo
            FROM ventas_mayor v JOIN ventas_mayor_items i ON i.venta_id = v.id
            WHERE strftime('%Y-%m', v.fecha, '-5 hours') = ${MES} GROUP BY v.id)`),
  ]);
  const uno = r => r.results[0];
  return json({
    ok: true,
    ventas: { hoy: uno(hoy), semana: uno(semana), mes: uno(mes) },
    pendientes: uno(pend), reclamos: uno(rec).n, clientes: uno(cli),
    vendidos: top.results, consultados: cons.results, bajo: bajo.results, stock: uno(stock),
    fisico: uno(fisico), ganancia: { minorista: uno(menor), mayorista: uno(mayor) },
  });
}

/* GET /api/admin/ventas?desde=AAAA-MM-DD&hasta=AAAA-MM-DD → ventas por día (hora de Perú) en ese rango, ambos días incluidos:
   pedidos confirmados de la tienda y ventas por mayor, por separado */
export async function ventasDias({ env, request }) {
  await adminDe(env, request);
  const u = new URL(request.url), desde = u.searchParams.get("desde") || "", hasta = u.searchParams.get("hasta") || "";
  const fecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!fecha.test(desde) || !fecha.test(hasta) || desde > hasta) throw new ErrorHttp(400, "datos_invalidos");
  if ((Date.parse(hasta) - Date.parse(desde)) / 86400e3 > 400) throw new ErrorHttp(400, "datos_invalidos");
  // Límites en UTC (Perú = UTC−5) para que la búsqueda use el índice de la fecha
  const ini = `datetime(?, '+5 hours')`, fin = `datetime(?, '+1 day', '+5 hours')`;
  const [tienda, mayor] = await env.DB.batch([
    env.DB.prepare(`SELECT date(procesado, '-5 hours') AS dia, SUM(total) AS monto, COUNT(*) AS n FROM pedidos
        WHERE estado = 'procede' AND procesado >= ${ini} AND procesado < ${fin} GROUP BY dia`).bind(desde, hasta),
    env.DB.prepare(`SELECT date(fecha, '-5 hours') AS dia, SUM(total) AS monto, COUNT(*) AS n FROM ventas_mayor
        WHERE fecha >= ${ini} AND fecha < ${fin} GROUP BY dia`).bind(desde, hasta),
  ]);
  return json({ ok: true, desde, hasta, tienda: tienda.results, mayor: mayor.results });
}

/* ---------- Pedidos ---------- */

/* Los pedidos CANCELADOS se borran para siempre a los 90 segundos de cancelarse (con sus prendas).
   Pages no tiene un reloj propio: se borran la siguiente vez que el panel pide los pedidos o el resumen
   (el panel lo hace solo cada 90 s y al terminar la cuenta regresiva). Si llevaban cupón, los puntos ya se devolvieron al cancelar. */
const SEG_BORRAR_CANCELADO = 90;
const purgarCancelados = env => env.DB.prepare(`DELETE FROM pedidos WHERE estado = 'cancelado'
    AND COALESCE(procesado, creado) <= datetime('now', '-${SEG_BORRAR_CANCELADO} seconds')`).run();

const PEDIDO_SQL = `SELECT p.id, p.codigo, p.creado, p.origen, p.estado, p.procesado, a.nombre AS procesado_por, p.cliente_id,
    COALESCE(p.nombre, c.nombre) AS nombre, c.email, p.celular, p.entrega, p.distrito, p.direccion, p.referencia, p.destino, p.agencia,
    p.subtotal, p.descuento, p.envio, p.total, p.precio_pendiente, p.origen_stock, p.editado, e.nombre AS editado_por,
    p.cupon_codigo, p.cupon_nombre, p.cupon_tipo, p.cupon_valor, p.cupon_desc,
    CASE WHEN p.estado = 'cancelado' THEN MAX(0, CAST(${SEG_BORRAR_CANCELADO} - (julianday('now') - julianday(COALESCE(p.procesado, p.creado))) * 86400 AS INTEGER)) END AS elimina_en,
    (SELECT cantidad FROM puntos WHERE pedido_id = p.id AND motivo = 'pedido') AS puntos_dados
  FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id LEFT JOIN admins a ON a.id = p.procesado_por LEFT JOIN admins e ON e.id = p.editado_por`;
async function conItems(env, pedidos) {
  if (!pedidos.length) return [];
  const ids = pedidos.map(p => p.id);
  const items = (await env.DB.prepare(`SELECT i.pedido_id, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio, i.costo, v.stock, v.fisico
      FROM pedido_items i LEFT JOIN variantes v ON v.slug = i.slug AND v.color = i.color AND v.talla = i.talla
      WHERE i.pedido_id IN (${ids.map(() => "?").join(", ")}) ORDER BY i.id`).bind(...ids).all()).results;
  return pedidos.map(p => ({
    codigo: p.codigo, fecha: iso(p.creado), origen: p.origen, estado: p.estado, procesado: iso(p.procesado), procesado_por: p.procesado_por,
    cliente: { registrado: p.cliente_id != null, nombre: p.nombre, email: p.email, celular: p.celular },
    entrega: { tipo: p.entrega, distrito: p.distrito, direccion: p.direccion, referencia: p.referencia, destino: p.destino, agencia: p.agencia },
    subtotal: p.subtotal, descuento: p.descuento, envio: p.envio, total: p.total, consultar: !!p.precio_pendiente, origen_stock: p.origen_stock,
    editado: iso(p.editado), editado_por: p.editado_por,
    elimina_en: p.elimina_en ?? null, // cancelado: segundos que faltan para que se borre solo
    // Cupón: aplicado (con su descuento) o "no_disponible" si el cliente lo quiso usar pero ya no servía
    cupon: !p.cupon_codigo ? null : p.cupon_tipo
      ? { codigo: p.cupon_codigo, nombre: p.cupon_nombre, tipo: p.cupon_tipo, valor: p.cupon_valor, desc: p.cupon_desc, aplicado: true }
      : { codigo: p.cupon_codigo, aplicado: false },
    // Puntos MAISON: los que dio al confirmarse, o los que dará si se confirma (solo clientes con cuenta)
    puntos: p.puntos_dados || 0,
    puntos_al_confirmar: p.cliente_id != null && p.estado === "pendiente" ? Math.max(0, Math.trunc(redondear(p.total - (p.envio || 0)))) : 0,
    items: items.filter(i => i.pedido_id === p.id).map(({ pedido_id, ...i }) => i),
  }));
}

/* GET /api/admin/pedidos?estado=pendiente|procede|cancelado|todos&q=texto */
export async function pedidos({ env, request, url }) {
  await adminDe(env, request);
  await purgarCancelados(env);
  const estado = url.searchParams.get("estado") || "pendiente", q = texto(url.searchParams.get("q"), 60);
  const w = [], b = [];
  if (["pendiente", "procede", "cancelado"].includes(estado)) { w.push("p.estado = ?"); b.push(estado); }
  if (q) { w.push("(p.codigo LIKE ? OR COALESCE(p.nombre, c.nombre, '') LIKE ? OR COALESCE(p.celular, '') LIKE ?)"); b.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const filas = (await env.DB.prepare(`${PEDIDO_SQL} ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY p.creado DESC LIMIT 150`).bind(...b).all()).results;
  const [cuenta] = await env.DB.batch([env.DB.prepare("SELECT estado, COUNT(*) AS n FROM pedidos GROUP BY estado")]);
  return json({ ok: true, pedidos: await conItems(env, filas), cuenta: Object.fromEntries(cuenta.results.map(r => [r.estado, r.n])) });
}

/* POST /api/admin/pedidos/:codigo { accion: "procede" | "cancelado", origen: "almacen" | "proveedor" }
   SI PROCEDE → la base descuenta el stock virtual de cada prenda y, si sale del ALMACÉN, también el físico
   (disparador pedido_procede); si lo envía el PROVEEDOR, solo el virtual. Todo queda en el historial.
   SI SE CANCELA → el stock no se toca.
   Si falta stock de alguna prenda, no se confirma nada y se avisa qué falta. */
export async function procesarPedido({ env, request, params }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request);
  const codigo = params[0];
  if (!["procede", "cancelado"].includes(b.accion)) throw new ErrorHttp(400, "accion_invalida");
  const p = await env.DB.prepare("SELECT id, estado FROM pedidos WHERE codigo = ?").bind(codigo).first();
  if (!p) throw new ErrorHttp(404, "no_existe");
  if (p.estado !== "pendiente") throw new ErrorHttp(409, "ya_procesado", { estado: p.estado });

  const origen = b.accion === "procede" ? b.origen : null;
  if (b.accion === "procede") {
    if (!["almacen", "proveedor"].includes(origen)) throw new ErrorHttp(400, "falta_origen");
    const faltan = (await env.DB.prepare(`SELECT i.nombre, i.color, i.talla, SUM(i.cantidad) AS pedido, v.stock FROM pedido_items i
        JOIN variantes v ON v.slug = i.slug AND v.color = i.color AND v.talla = i.talla
        WHERE i.pedido_id = ? AND v.stock IS NOT NULL GROUP BY i.slug, i.color, i.talla HAVING v.stock < SUM(i.cantidad)`).bind(p.id).all()).results;
    if (faltan.length) throw new ErrorHttp(409, "sin_stock", { faltan });
    // Del almacén: tiene que haber stock físico cargado y suficiente (sin cargar cuenta como 0)
    if (origen === "almacen") {
      const faltanF = (await env.DB.prepare(`SELECT i.nombre, i.color, i.talla, SUM(i.cantidad) AS pedido, COALESCE(v.fisico, 0) AS stock FROM pedido_items i
          JOIN variantes v ON v.slug = i.slug AND v.color = i.color AND v.talla = i.talla
          WHERE i.pedido_id = ? GROUP BY i.slug, i.color, i.talla HAVING COALESCE(v.fisico, 0) < SUM(i.cantidad)`).bind(p.id).all()).results;
      if (faltanF.length) throw new ErrorHttp(409, "sin_stock_fisico", { faltan: faltanF });
    }
  }
  let res;
  try {
    res = await env.DB.batch([
      ...ctxStock(env, "venta", { pedido: p.id, admin: a.id }),
      env.DB.prepare("UPDATE pedidos SET estado = ?, origen_stock = ?, procesado = datetime('now'), procesado_por = ? WHERE id = ? AND estado = 'pendiente'").bind(b.accion, origen, a.id, p.id),
      ...ctxFin(env),
    ]);
  } catch (e) {
    const m = String(e.message);
    if (/CHECK constraint/i.test(m)) throw new ErrorHttp(409, "sin_stock", { faltan: [] });
    if (/PEDIDO_YA_PROCESADO/.test(m)) throw new ErrorHttp(409, "ya_procesado");
    throw e;
  }
  if (!res[1].meta.changes) throw new ErrorHttp(409, "ya_procesado");
  const [pedido] = await conItems(env, (await env.DB.prepare(`${PEDIDO_SQL} WHERE p.id = ?`).bind(p.id).all()).results);
  return json({ ok: true, pedido });
}

/* POST /api/admin/pedidos/:codigo/eliminar → borra para siempre un pedido CANCELADO (con sus prendas), sin esperar los 90 segundos.
   Solo los cancelados: los pendientes y los confirmados no se pueden borrar. */
export async function eliminarPedido({ env, request, params }) {
  await adminDe(env, request);
  const p = await env.DB.prepare("SELECT estado FROM pedidos WHERE codigo = ?").bind(params[0]).first();
  if (!p) return json({ ok: true, ya: true }); // ya se había borrado solo
  if (p.estado !== "cancelado") throw new ErrorHttp(409, "solo_cancelados", { estado: p.estado });
  await env.DB.prepare("DELETE FROM pedidos WHERE codigo = ? AND estado = 'cancelado'").bind(params[0]).run();
  return json({ ok: true });
}

/* POST /api/admin/pedidos/:codigo/editar { items: [{ slug, color, talla, cantidad, precio }], descuento, envio, envio_manual }
   Solo pedidos POR CONFIRMAR: el stock todavía no se tocó, así que editar no mueve stock (se descuenta al confirmar).
   precio vacío = precio actual de la tienda · envío: se recalcula con las reglas de la tienda, salvo que se escriba a mano.
   descuento = descuento aparte del cupón. Si el pedido trae un cupón, su descuento se vuelve a calcular con las prendas nuevas
   (y el envío gratis del cupón se mantiene mientras el envío se calcule solo). */
export async function editarPedido({ env, request, params }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request, 60000);
  const p = await env.DB.prepare("SELECT id, estado, entrega, cupon_tipo, cupon_valor FROM pedidos WHERE codigo = ?").bind(params[0]).first();
  if (!p) throw new ErrorHttp(404, "no_existe");
  if (p.estado !== "pendiente") throw new ErrorHttp(409, "ya_procesado", { estado: p.estado });
  const lista = Array.isArray(b.items) ? b.items : [];
  if (!lista.length || lista.length > 40) throw new ErrorHttp(400, "sin_prendas");
  const vacio = v => v == null || v === "";
  for (const i of lista) {
    const ok = [i.slug, i.color, i.talla].every(x => typeof x === "string" && x) && Number.isInteger(+i.cantidad) && +i.cantidad >= 1 && +i.cantidad <= 20
      && (vacio(i.precio) || (+i.precio >= 0 && +i.precio < 100000));
    if (!ok) throw new ErrorHttp(400, "datos_invalidos");
  }
  const claves = [...new Set(lista.map(claveDe))], filas = await variantesDe(env, claves);
  if (filas.length !== claves.length) throw new ErrorHttp(400, "prenda_no_existe");
  const items = lista.map(i => {
    const f = filas.find(x => claveDe(x) === claveDe(i));
    return { slug: f.slug, nombre: f.nombre, color: f.color, talla: f.talla, cantidad: +i.cantidad, precio: vacio(i.precio) ? f.precio : redondear(+i.precio) };
  });
  const subtotal = redondear(items.reduce((s, i) => s + (i.precio || 0) * i.cantidad, 0));
  const descuento = vacio(b.descuento) ? 0 : redondear(+b.descuento);
  if (!(descuento >= 0 && descuento <= subtotal)) throw new ErrorHttp(400, "descuento_invalido");
  let envio;
  if (b.envio_manual === true) {
    envio = vacio(b.envio) ? null : redondear(+b.envio);
    if (envio !== null && !(envio >= 0 && envio < 10000)) throw new ErrorHttp(400, "envio_invalido");
  } else {
    const cfg = await config(env); // mismas reglas que el carrito: domicilio S/10 (gratis desde S/200), recojo gratis, provincia y sin datos: a coordinar
    envio = p.entrega === "domicilio" ? (subtotal >= cfg.gratisDesde || p.cupon_tipo === "envio" ? 0 : cfg.envio) : p.entrega === "recojo" ? 0 : null;
  }
  const ef = p.cupon_tipo === "monto" || p.cupon_tipo === "porcentaje" ? efectoCupon({ tipo: p.cupon_tipo, valor: p.cupon_valor }, { subtotal, descuento }) : null;
  const cuponDesc = ef ? ef.desc : 0, descTotal = redondear(descuento + cuponDesc);
  const total = redondear(subtotal - descTotal + (envio || 0));
  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM pedido_items WHERE pedido_id = ?").bind(p.id),
      ...items.map(i => env.DB.prepare("INSERT INTO pedido_items (pedido_id, slug, nombre, color, talla, cantidad, precio) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(p.id, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio)),
      env.DB.prepare(`UPDATE pedidos SET subtotal = ?, descuento = ?, cupon_desc = ?, envio = ?, total = ?, precio_pendiente = ?, editado = datetime('now'), editado_por = ?
          WHERE id = ?`).bind(subtotal, descTotal, cuponDesc, envio, total, items.some(i => i.precio == null) ? 1 : 0, a.id, p.id),
    ]);
  } catch (e) {
    // Si alguien lo confirmó o canceló justo ahora, la base no deja tocar sus prendas (disparadores items_solo_pendiente_*)
    if (/PEDIDO_YA_PROCESADO/.test(String(e.message))) throw new ErrorHttp(409, "ya_procesado");
    throw e;
  }
  const [pedido] = await conItems(env, (await env.DB.prepare(`${PEDIDO_SQL} WHERE p.id = ?`).bind(p.id).all()).results);
  return json({ ok: true, pedido });
}

/* ---------- Productos, precios y stock ---------- */

/* GET /api/admin/inventario → todos los productos con su stock por color y talla */
export async function inventario({ env, request }) {
  await adminDe(env, request);
  const [prod, vars, ocu] = await env.DB.batch([
    env.DB.prepare("SELECT slug, nombre, base, estilo, linea, cat, orden, precio, precio_antes, costo, precio_mayor, estado, actualizado FROM productos ORDER BY orden"),
    env.DB.prepare("SELECT slug, color, talla, stock, fisico, actualizado, fisico_actualizado FROM variantes ORDER BY slug, orden"),
    env.DB.prepare("SELECT slug, color FROM colores_ocultos"),
  ]);
  const porSlug = {}, ocultos = {};
  for (const v of vars.results) (porSlug[v.slug] ||= []).push({ color: v.color, talla: v.talla, stock: v.stock, fisico: v.fisico, actualizado: iso(v.actualizado), fisico_actualizado: iso(v.fisico_actualizado) });
  for (const o of ocu.results) (ocultos[o.slug] ||= []).push(o.color);
  return json({ ok: true, productos: prod.results.map(p => ({ ...p, actualizado: iso(p.actualizado), variantes: porSlug[p.slug] || [], ocultos: ocultos[p.slug] || [] })) });
}

/* POST /api/admin/colores { slug, color, visible } → enciende (true) o apaga (false) un color en la tienda.
   Apagado: el color no se ve ni se puede pedir en la página. Su stock no se toca y vuelve igual al encenderlo. */
export async function colorVisible({ env, request }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request);
  if (![b.slug, b.color].every(x => typeof x === "string" && x) || typeof b.visible !== "boolean") throw new ErrorHttp(400, "datos_invalidos");
  const existe = await env.DB.prepare("SELECT 1 AS si FROM variantes WHERE slug = ? AND color = ? LIMIT 1").bind(b.slug, b.color).first();
  if (!existe) throw new ErrorHttp(404, "prenda_no_existe");
  const [, lista] = await env.DB.batch([
    b.visible
      ? env.DB.prepare("DELETE FROM colores_ocultos WHERE slug = ? AND color = ?").bind(b.slug, b.color)
      : env.DB.prepare("INSERT INTO colores_ocultos (slug, color, admin_id) VALUES (?, ?, ?) ON CONFLICT(slug, color) DO NOTHING").bind(b.slug, b.color, a.id),
    env.DB.prepare("SELECT color FROM colores_ocultos WHERE slug = ?").bind(b.slug),
  ]);
  return json({ ok: true, visible: b.visible, ocultos: lista.results.map(r => r.color) });
}

/* POST /api/admin/stock { cambios: [{ slug, color, talla, stock?, fisico? }] } — número de 0 a 99999, o null para "sin cargar"
   stock = virtual (queda como "ajuste") · fisico = almacén (queda como "conteo") */
export async function guardarStock({ env, request }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request, 200000);
  const cambios = Array.isArray(b.cambios) ? b.cambios : [];
  if (!cambios.length || cambios.length > 600) throw new ErrorHttp(400, "datos_invalidos");
  const valido = v => v === null || (Number.isInteger(v) && v >= 0 && v <= 99999);
  for (const c of cambios) {
    if (!("stock" in c) && !("fisico" in c)) throw new ErrorHttp(400, "datos_invalidos");
    if (("stock" in c && !valido(c.stock)) || ("fisico" in c && !valido(c.fisico))) throw new ErrorHttp(400, "stock_invalido");
    if (![c.slug, c.color, c.talla].every(x => typeof x === "string" && x)) throw new ErrorHttp(400, "datos_invalidos");
  }
  const virt = cambios.filter(c => "stock" in c), fis = cambios.filter(c => "fisico" in c);
  const res = await env.DB.batch([
    ...ctxStock(env, "ajuste", { admin: a.id }),
    ...virt.map(c => env.DB.prepare("UPDATE variantes SET stock = ?, actualizado = datetime('now') WHERE slug = ? AND color = ? AND talla = ? AND stock IS NOT ?")
      .bind(c.stock, c.slug, c.color, c.talla, c.stock)),
    ...ctxStock(env, "conteo", { admin: a.id }),
    ...fis.map(c => env.DB.prepare("UPDATE variantes SET fisico = ?, fisico_actualizado = datetime('now') WHERE slug = ? AND color = ? AND talla = ? AND fisico IS NOT ?")
      .bind(c.fisico, c.slug, c.color, c.talla, c.fisico)),
    ...ctxFin(env),
  ]);
  // meta.changes también cuenta lo que escriben los disparadores: se cuenta cada talla que sí cambió
  const cambio = r => r.meta.changes > 0;
  const guardados = res.slice(1, 1 + virt.length).filter(cambio).length + res.slice(2 + virt.length, 2 + virt.length + fis.length).filter(cambio).length;
  return json({ ok: true, guardados });
}

/* POST /api/admin/productos/:slug { precio, precio_antes, costo, precio_mayor, estado, todos }
   costo = lo que le cuesta la prenda a MAISON · precio_mayor = precio de venta por mayor (solo panel)
   precio = lo que paga el cliente; precio_antes = precio tachado (null = sin descuento)
   todos: true → el precio se aplica también a los otros colores de la misma prenda (los polos separados por color) */
export async function guardarProducto({ env, request, params }) {
  await adminDe(env, request);
  const b = await leerJson(request);
  const slug = params[0];
  const precio = b.precio === null ? null : +b.precio, antes = b.precio_antes == null || b.precio_antes === "" ? null : +b.precio_antes;
  if (precio !== null && !(precio >= 0 && precio < 100000)) throw new ErrorHttp(400, "precio_invalido");
  if (antes !== null && !(antes > (precio || 0) && antes < 100000)) throw new ErrorHttp(400, "precio_antes_invalido");
  if (!["activo", "agotado", "oculto"].includes(b.estado)) throw new ErrorHttp(400, "estado_invalido");
  const opcional = v => (v == null || v === "" ? null : +v);
  const costo = opcional(b.costo), mayor = opcional(b.precio_mayor);
  if (costo !== null && !(costo >= 0 && costo < 100000)) throw new ErrorHttp(400, "costo_invalido");
  if (mayor !== null && !(mayor >= 0 && mayor < 100000)) throw new ErrorHttp(400, "precio_mayor_invalido");
  const p = await env.DB.prepare("SELECT slug, base FROM productos WHERE slug = ?").bind(slug).first();
  if (!p) throw new ErrorHttp(404, "no_existe");
  const r2 = n => (n == null ? null : Math.round(n * 100) / 100);
  const q = [env.DB.prepare("UPDATE productos SET precio = ?, precio_antes = ?, costo = ?, precio_mayor = ?, estado = ?, actualizado = datetime('now') WHERE slug = ?")
    .bind(r2(precio), r2(antes), r2(costo), r2(mayor), b.estado, slug)];
  if (b.todos === true && p.base)
    q.push(env.DB.prepare("UPDATE productos SET precio = ?, precio_antes = ?, costo = ?, precio_mayor = ?, actualizado = datetime('now') WHERE base = ? AND slug <> ?")
      .bind(r2(precio), r2(antes), r2(costo), r2(mayor), p.base, slug));
  if (b.todos === true && p.base) q.push(env.DB.prepare("SELECT COUNT(*) AS n FROM productos WHERE base = ?").bind(p.base));
  const res = await env.DB.batch(q);
  return json({ ok: true, cambiados: b.todos === true && p.base ? res[res.length - 1].results[0].n : 1 });
}

/* GET /api/admin/movimientos?tipo=virtual|fisico&slug= → historial de stock (los últimos 1000) */
export async function movimientos({ env, request, url }) {
  await adminDe(env, request);
  const slug = texto(url.searchParams.get("slug"), 80), tipo = url.searchParams.get("tipo");
  const w = [], b = [];
  if (["virtual", "fisico"].includes(tipo)) { w.push("m.tipo = ?"); b.push(tipo); }
  if (slug) { w.push("m.slug = ?"); b.push(slug); }
  const r = await env.DB.prepare(`SELECT m.tipo, m.fecha, m.slug, p.nombre, m.color, m.talla, m.antes, m.despues, m.motivo, m.costo_unitario, m.proveedor, m.nota,
        pe.codigo AS pedido, pe.origen_stock, a.nombre AS admin
      FROM movimientos m LEFT JOIN productos p ON p.slug = m.slug LEFT JOIN pedidos pe ON pe.id = m.pedido_id LEFT JOIN admins a ON a.id = m.admin_id
      ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY m.id DESC LIMIT 1000`).bind(...b).all();
  return json({ ok: true, movimientos: r.results.map(m => ({ ...m, fecha: iso(m.fecha) })) });
}

/* ---------- Clientes ---------- */

/* GET /api/admin/clientes → clientes con cuenta, lo que compraron (pedidos que procedieron), sus puntos y si aceptan promociones */
export async function clientes({ env, request }) {
  await adminDe(env, request);
  await purgarCancelados(env);
  const r = await env.DB.prepare(`SELECT c.id, c.nombre, c.email, c.promos, c.cumple, c.creado, c.ultimo_acceso,
      COUNT(p.id) AS pedidos, COALESCE(SUM(p.total), 0) AS total, MAX(p.procesado) AS ultima_compra,
      (SELECT COALESCE(SUM(cantidad), 0) FROM puntos WHERE cliente_id = c.id) AS puntos
    FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado = 'procede'
    GROUP BY c.id ORDER BY total DESC, c.creado DESC`).all();
  return json({ ok: true, clientes: r.results.map(c => ({ ...c, promos: !!c.promos, creado: iso(c.creado), ultimo_acceso: iso(c.ultimo_acceso), ultima_compra: iso(c.ultima_compra) })) });
}

/* ---------- Puntos MAISON: cada cliente, sus cupones y las recompensas ---------- */

const idCliente = params => { const id = Math.trunc(+params[0]); if (!(id > 0)) throw new ErrorHttp(404, "no_existe"); return id; };

/* GET /api/admin/clientes/:id → sus datos, su saldo de puntos, de dónde salen (historial) y sus cupones */
export async function cliente({ env, request, params }) {
  await adminDe(env, request);
  const id = idCliente(params);
  const [cli, saldo, mov, cups, comp] = await env.DB.batch([
    env.DB.prepare("SELECT id, nombre, email, foto, promos, cumple, cumple_fecha, creado, ultimo_acceso FROM clientes WHERE id = ?").bind(id),
    env.DB.prepare(`SELECT COALESCE(SUM(cantidad), 0) AS saldo, COALESCE(SUM(CASE WHEN motivo = 'pedido' THEN cantidad END), 0) AS ganados,
        COALESCE(-SUM(CASE WHEN motivo = 'canje' THEN cantidad END), 0) AS canjeados FROM puntos WHERE cliente_id = ?`).bind(id),
    env.DB.prepare(`SELECT m.cantidad, m.motivo, m.nota, m.creado, p.codigo AS pedido, c.codigo AS cupon, c.nombre AS cupon_nombre, a.nombre AS admin
        FROM puntos m LEFT JOIN pedidos p ON p.id = m.pedido_id LEFT JOIN cupones c ON c.id = m.cupon_id LEFT JOIN admins a ON a.id = m.admin_id
        WHERE m.cliente_id = ? ORDER BY m.id DESC LIMIT 300`).bind(id),
    env.DB.prepare(`SELECT c.codigo, c.nombre, c.tipo, c.valor, c.puntos, c.estado, c.creado, c.actualizado, p.codigo AS pedido
        FROM cupones c LEFT JOIN pedidos p ON p.id = c.pedido_id WHERE c.cliente_id = ? ORDER BY c.id DESC LIMIT 200`).bind(id),
    env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total FROM pedidos WHERE cliente_id = ? AND estado = 'procede'").bind(id),
  ]);
  const c = cli.results[0];
  if (!c) throw new ErrorHttp(404, "no_existe");
  return json({
    ok: true,
    cliente: { ...c, promos: !!c.promos, creado: iso(c.creado), ultimo_acceso: iso(c.ultimo_acceso), cumple_fecha: iso(c.cumple_fecha) },
    puntos: saldo.results[0], compras: comp.results[0],
    movimientos: mov.results.map(m => ({ ...m, creado: iso(m.creado) })),
    cupones: cups.results.map(x => ({ ...x, creado: iso(x.creado), actualizado: iso(x.actualizado) })),
  });
}

/* POST /api/admin/clientes/:id/puntos { cantidad: entero (+ suma, − resta), nota } → ajuste a mano, queda en su historial.
   No se puede dejar a nadie con puntos en negativo. */
export async function ajustarPuntos({ env, request, params }) {
  const a = await adminDe(env, request);
  const id = idCliente(params);
  const b = await leerJson(request);
  const cantidad = Number(b.cantidad), nota = texto(b.nota, 200);
  if (!Number.isInteger(cantidad) || cantidad === 0 || Math.abs(cantidad) > 100000) throw new ErrorHttp(400, "cantidad_invalida");
  if (!nota) throw new ErrorHttp(400, "falta_motivo");
  if (!(await env.DB.prepare("SELECT 1 FROM clientes WHERE id = ?").bind(id).first())) throw new ErrorHttp(404, "no_existe");
  try {
    await env.DB.prepare("INSERT INTO puntos (cliente_id, cantidad, motivo, nota, admin_id) VALUES (?, ?, 'ajuste', ?, ?)").bind(id, cantidad, nota, a.id).run();
  } catch (e) {
    if (/PUNTOS_INSUFICIENTES/.test(String(e.message))) throw new ErrorHttp(409, "puntos_insuficientes");
    throw e;
  }
  const s = await env.DB.prepare("SELECT COALESCE(SUM(cantidad), 0) AS saldo FROM puntos WHERE cliente_id = ?").bind(id).first();
  return json({ ok: true, saldo: s.saldo });
}

/* POST /api/admin/clientes/:id/cumple { cumple: "MM-DD" | null } → corrige (o borra) el cumpleaños del cliente */
export async function corregirCumple({ env, request, params }) {
  await adminDe(env, request);
  const id = idCliente(params);
  const b = await leerJson(request);
  const cumple = b.cumple === null || b.cumple === "" ? null : cumpleValido(b.cumple);
  if (b.cumple && !cumple) throw new ErrorHttp(400, "cumple_invalido");
  const r = await env.DB.prepare("UPDATE clientes SET cumple = ?, cumple_fecha = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END WHERE id = ?").bind(cumple, cumple, id).run();
  if (!r.meta.changes) throw new ErrorHttp(404, "no_existe");
  return json({ ok: true, cumple });
}

/* POST /api/admin/cupones/:codigo/anular { devolver: true | false } → anula un cupón que el cliente todavía no usó.
   devolver: le regresan los puntos que pagó por él. Un cupón que ya está en un pedido no se anula aquí: se cancela o edita ese pedido. */
export async function anularCupon({ env, request, params }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request);
  const c = await env.DB.prepare("SELECT id, estado, cliente_id, puntos FROM cupones WHERE codigo = ?").bind(params[0]).first();
  if (!c) throw new ErrorHttp(404, "no_existe");
  if (c.estado !== "activo") throw new ErrorHttp(409, "cupon_no_activo", { estado: c.estado });
  const res = await env.DB.batch([
    ...(b.devolver === true ? [env.DB.prepare(`INSERT INTO puntos (cliente_id, cantidad, motivo, cupon_id, nota, admin_id)
        SELECT cliente_id, puntos, 'devolucion', id, 'Cupón anulado', ? FROM cupones WHERE id = ? AND estado = 'activo'`).bind(a.id, c.id)] : []),
    env.DB.prepare("UPDATE cupones SET estado = 'anulado', actualizado = datetime('now') WHERE id = ? AND estado = 'activo'").bind(c.id),
  ]);
  if (!res[res.length - 1].meta.changes) throw new ErrorHttp(409, "cupon_no_activo");
  return json({ ok: true, devuelto: b.devolver === true ? c.puntos : 0 });
}

const TIPOS_RECOMPENSA = ["monto", "porcentaje", "envio"];
/* GET /api/admin/recompensas → todas (encendidas y apagadas) con cuántas veces se canjearon, y el máximo de puntos por pedido */
export async function recompensas({ env, request }) {
  await adminDe(env, request);
  const tope = await topePuntos(env);
  const [r, t] = await env.DB.batch([
    env.DB.prepare(`SELECT r.id, r.nombre, r.puntos, r.tipo, r.valor, r.activa, r.creado, r.actualizado,
        (SELECT COUNT(*) FROM cupones c WHERE c.recompensa_id = r.id) AS canjes,
        (SELECT COUNT(*) FROM cupones c WHERE c.recompensa_id = r.id AND c.estado = 'usado') AS usados
      FROM recompensas r ORDER BY r.activa DESC, r.puntos, r.id`),
    env.DB.prepare(`SELECT (SELECT COALESCE(SUM(cantidad), 0) FROM puntos) AS saldo,
        (SELECT COALESCE(SUM(cantidad), 0) FROM puntos WHERE motivo = 'pedido') AS ganados,
        (SELECT COUNT(*) FROM cupones WHERE estado = 'activo') AS cupones_activos`),
  ]);
  return json({ ok: true, tope, recompensas: r.results.map(x => ({ ...x, activa: !!x.activa, creado: iso(x.creado), actualizado: iso(x.actualizado) })), totales: t.results[0] });
}

/* POST /api/admin/recompensas (nueva) · /api/admin/recompensas/:id (editar) { nombre, puntos, tipo, valor, activa }
   Editar una recompensa no cambia los cupones que ya se canjearon. */
export async function guardarRecompensa({ env, request, params }) {
  await adminDe(env, request);
  const b = await leerJson(request);
  const id = params && params[0] ? Math.trunc(+params[0]) : null;
  const nombre = texto(b.nombre, 60), puntos = Number(b.puntos), tipo = b.tipo, activa = b.activa === false ? 0 : 1;
  const valor = tipo === "envio" ? 0 : Math.round(Number(b.valor) * 100) / 100;
  if (!nombre || nombre.length < 3) throw new ErrorHttp(400, "nombre_invalido");
  if (!Number.isInteger(puntos) || puntos < 1 || puntos > 100000) throw new ErrorHttp(400, "puntos_invalidos");
  if (!TIPOS_RECOMPENSA.includes(tipo)) throw new ErrorHttp(400, "tipo_invalido");
  if (tipo === "monto" && !(valor >= 1 && valor <= 10000)) throw new ErrorHttp(400, "valor_invalido");
  if (tipo === "porcentaje" && !(Number.isInteger(valor) && valor >= 1 && valor <= 90)) throw new ErrorHttp(400, "valor_invalido");
  // Una recompensa encendida no puede costar más que el máximo de puntos por pedido
  const tope = await topePuntos(env);
  if (activa && puntos > tope) throw new ErrorHttp(400, "supera_tope", { tope });
  if (id) {
    const r = await env.DB.prepare("UPDATE recompensas SET nombre = ?, puntos = ?, tipo = ?, valor = ?, activa = ?, actualizado = datetime('now') WHERE id = ?")
      .bind(nombre, puntos, tipo, valor, activa, id).run();
    if (!r.meta.changes) throw new ErrorHttp(404, "no_existe");
    return json({ ok: true, id });
  }
  const r = await env.DB.prepare("INSERT INTO recompensas (nombre, puntos, tipo, valor, activa) VALUES (?, ?, ?, ?, ?) RETURNING id").bind(nombre, puntos, tipo, valor, activa).first();
  return json({ ok: true, id: r.id });
}

/* POST /api/admin/puntos-tope { tope } → máximo de puntos que se pueden usar en un pedido.
   Las recompensas encendidas que cuesten más dejan de verse en la tienda (no se apagan solas); los cupones ya canjeados siguen sirviendo. */
export async function guardarTope({ env, request }) {
  await adminDe(env, request);
  const b = await leerJson(request);
  const tope = Number(b.tope);
  if (!Number.isInteger(tope) || tope < 1 || tope > 100000) throw new ErrorHttp(400, "tope_invalido");
  const [, fuera] = await env.DB.batch([
    env.DB.prepare("INSERT INTO ajustes (clave, valor) VALUES ('puntos_tope', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").bind(String(tope)),
    env.DB.prepare("SELECT COUNT(*) AS n FROM recompensas WHERE activa = 1 AND puntos > ?").bind(tope),
  ]);
  return json({ ok: true, tope, fuera: fuera.results[0].n });
}

/* ---------- Libro de Reclamaciones ---------- */

/* GET /api/admin/reclamos */
export async function reclamos({ env, request }) {
  await adminDe(env, request);
  const r = await env.DB.prepare(`SELECT r.*, a.nombre AS respondido_nombre FROM reclamos r LEFT JOIN admins a ON a.id = r.respondido_por ORDER BY r.id DESC LIMIT 300`).all();
  return json({ ok: true, reclamos: r.results.map(x => ({ ...x, menor: !!x.menor, creado: iso(x.creado), respondido: iso(x.respondido), respondido_por: x.respondido_nombre, respondido_nombre: undefined })) });
}

/* POST /api/admin/reclamos/:numero { respuesta } */
export async function responderReclamo({ env, request, params }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request);
  const respuesta = texto(b.respuesta, 4000);
  if (!respuesta) throw new ErrorHttp(400, "falta_respuesta");
  const r = await env.DB.prepare("UPDATE reclamos SET respuesta = ?, estado = 'respondido', respondido = datetime('now'), respondido_por = ? WHERE numero = ?")
    .bind(respuesta, a.id, params[0]).run();
  if (!r.meta.changes) throw new ErrorHttp(404, "no_existe");
  return json({ ok: true });
}

/* ---------- Stock físico: entradas y salidas del almacén ---------- */

const redondear = n => Math.round(n * 100) / 100;
const MOTIVOS_SALIDA = ["merma", "danado", "devolucion", "otro"];
const claveDe = i => `${i.slug}|${i.color}|${i.talla}`;
async function variantesDe(env, claves) {
  return (await env.DB.prepare(`SELECT v.slug, v.color, v.talla, v.stock, v.fisico, p.nombre, p.costo, p.precio FROM variantes v JOIN productos p ON p.slug = v.slug
      WHERE v.slug || '|' || v.color || '|' || v.talla IN (${claves.map(() => "?").join(", ")})`).bind(...claves).all()).results;
}
function leerItems(b, conPrecio) {
  const items = (Array.isArray(b.items) ? b.items : []).filter(i => i && +i.cantidad > 0);
  if (!items.length || items.length > 300) throw new ErrorHttp(400, "sin_prendas");
  for (const i of items) {
    const ok = [i.slug, i.color, i.talla].every(x => typeof x === "string" && x) && Number.isInteger(+i.cantidad) && +i.cantidad <= 9999
      && (!conPrecio || (+i.precio >= 0 && +i.precio < 100000 && i.precio !== "" && i.precio != null));
    if (!ok) throw new ErrorHttp(400, "datos_invalidos");
  }
  // Cantidad total por color y talla (la misma talla puede venir en dos líneas)
  const porVar = new Map();
  for (const i of items) porVar.set(claveDe(i), (porVar.get(claveDe(i)) || 0) + +i.cantidad);
  return { items, porVar };
}

/* POST /api/admin/fisico { tipo: "entrada" | "salida", motivo, items: [{ slug, color, talla, cantidad }], costo_unitario, proveedor, nota }
   entrada: suma al físico y guarda costo unitario y proveedor · salida: resta del físico (merma, danado, devolucion u otro) */
export async function movimientoFisico({ env, request }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request, 100000);
  const entrada = b.tipo === "entrada";
  if (!entrada && b.tipo !== "salida") throw new ErrorHttp(400, "tipo_invalido");
  const motivo = entrada ? "entrada" : b.motivo;
  if (!entrada && !MOTIVOS_SALIDA.includes(motivo)) throw new ErrorHttp(400, "motivo_invalido");
  const { porVar } = leerItems(b, false);
  const costo = b.costo_unitario == null || b.costo_unitario === "" ? null : +b.costo_unitario;
  if (costo !== null && !(costo >= 0 && costo < 100000)) throw new ErrorHttp(400, "costo_invalido");
  const claves = [...porVar.keys()], filas = await variantesDe(env, claves);
  if (filas.length !== claves.length) throw new ErrorHttp(400, "prenda_no_existe");
  if (!entrada) {
    const faltan = filas.filter(f => (f.fisico || 0) < porVar.get(claveDe(f)))
      .map(f => ({ nombre: f.nombre, color: f.color, talla: f.talla, pedido: porVar.get(claveDe(f)), stock: f.fisico || 0 }));
    if (faltan.length) throw new ErrorHttp(409, "sin_stock_fisico", { faltan });
  }
  const sql = entrada
    ? "UPDATE variantes SET fisico = COALESCE(fisico, 0) + ?, fisico_actualizado = datetime('now') WHERE slug = ? AND color = ? AND talla = ?"
    : "UPDATE variantes SET fisico = fisico - ?, fisico_actualizado = datetime('now') WHERE slug = ? AND color = ? AND talla = ?";
  try {
    await env.DB.batch([
      ...ctxStock(env, motivo, { admin: a.id, costo: entrada ? costo : null, proveedor: entrada ? texto(b.proveedor, 120) : null, nota: texto(b.nota, 300) }),
      ...claves.map(k => { const [s, c, t] = k.split("|"); return env.DB.prepare(sql).bind(porVar.get(k), s, c, t); }),
      ...ctxFin(env),
    ]);
  } catch (e) {
    if (/CHECK constraint/i.test(String(e.message))) throw new ErrorHttp(409, "sin_stock_fisico", { faltan: [] });
    throw e;
  }
  return json({ ok: true, unidades: [...porVar.values()].reduce((n, x) => n + x, 0) });
}

/* ---------- Ventas por mayor (registradas a mano en el panel) ---------- */

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codigoMayor = () => "VM" + Array.from(crypto.getRandomValues(new Uint8Array(6)), x => LETRAS[x % 32]).join("");

/* GET /api/admin/mayor → ventas por mayor (las últimas 300) con sus prendas, precio y costo del día */
export async function ventasMayor({ env, request }) {
  await adminDe(env, request);
  const [vs, its] = await env.DB.batch([
    env.DB.prepare(`SELECT v.id, v.codigo, v.fecha, v.cliente, v.celular, v.documento, v.nota, v.origen_stock, v.total, a.nombre AS admin
        FROM ventas_mayor v LEFT JOIN admins a ON a.id = v.admin_id ORDER BY v.id DESC LIMIT 300`),
    env.DB.prepare(`SELECT venta_id, slug, nombre, color, talla, cantidad, precio, costo FROM ventas_mayor_items
        WHERE venta_id IN (SELECT id FROM ventas_mayor ORDER BY id DESC LIMIT 300) ORDER BY id`),
  ]);
  return json({ ok: true, ventas: vs.results.map(v => ({ ...v, fecha: iso(v.fecha), items: its.results.filter(i => i.venta_id === v.id).map(({ venta_id, ...i }) => i) })) });
}

/* POST /api/admin/mayor { cliente, celular, documento, nota, origen: "almacen" | "proveedor", items: [{ slug, color, talla, cantidad, precio }] }
   Igual que un pedido que procede: descuenta el stock virtual y, si sale del almacén, también el físico.
   Guarda el costo de cada prenda del día para calcular la ganancia. */
export async function crearVentaMayor({ env, request }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request, 100000);
  if (!["almacen", "proveedor"].includes(b.origen)) throw new ErrorHttp(400, "falta_origen");
  const { items, porVar } = leerItems(b, true);
  const claves = [...porVar.keys()], filas = await variantesDe(env, claves);
  if (filas.length !== claves.length) throw new ErrorHttp(400, "prenda_no_existe");
  const fila = k => filas.find(f => claveDe(f) === k);
  const falta = (campo, alm) => filas.filter(f => (alm ? (f[campo] || 0) : f[campo]) != null && (alm ? (f[campo] || 0) : f[campo]) < porVar.get(claveDe(f)))
    .map(f => ({ nombre: f.nombre, color: f.color, talla: f.talla, pedido: porVar.get(claveDe(f)), stock: alm ? f[campo] || 0 : f[campo] }));
  const faltan = falta("stock", false);
  if (faltan.length) throw new ErrorHttp(409, "sin_stock", { faltan });
  if (b.origen === "almacen") { const f = falta("fisico", true); if (f.length) throw new ErrorHttp(409, "sin_stock_fisico", { faltan: f }); }

  const codigo = codigoMayor(), total = redondear(items.reduce((t, i) => t + +i.precio * +i.cantidad, 0));
  const update = (col, k) => { const [s, c, t] = k.split("|");
    return env.DB.prepare(`UPDATE variantes SET ${col} = ${col} - ?, ${col === "stock" ? "actualizado" : "fisico_actualizado"} = datetime('now')
        WHERE slug = ? AND color = ? AND talla = ? AND ${col} IS NOT NULL`).bind(porVar.get(k), s, c, t); };
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO ventas_mayor (codigo, cliente, celular, documento, nota, origen_stock, total, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(codigo, texto(b.cliente, 120), texto(b.celular, 30), texto(b.documento, 20), texto(b.nota, 300), b.origen, total, a.id),
      ...items.map(i => env.DB.prepare(`INSERT INTO ventas_mayor_items (venta_id, slug, nombre, color, talla, cantidad, precio, costo)
          VALUES ((SELECT id FROM ventas_mayor WHERE codigo = ?), ?, ?, ?, ?, ?, ?, ?)`)
        .bind(codigo, i.slug, fila(claveDe(i)).nombre, i.color, i.talla, +i.cantidad, redondear(+i.precio), fila(claveDe(i)).costo)),
      ...ctxStock(env, "venta_mayor", { admin: a.id, nota: codigo }),
      ...claves.map(k => update("stock", k)),
      ...(b.origen === "almacen" ? claves.map(k => update("fisico", k)) : []),
      ...ctxFin(env),
    ]);
  } catch (e) {
    if (/CHECK constraint/i.test(String(e.message))) throw new ErrorHttp(409, "sin_stock", { faltan: [] });
    throw e;
  }
  return json({ ok: true, codigo, total });
}
