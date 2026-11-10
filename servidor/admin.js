/* =========================================================
   Rutas del panel admin (/api/admin/...). Todas piden sesión de administrador, salvo entrar y activar.
   ========================================================= */
import {
  ErrorHttp, json, leerJson, texto, cifrarClave, verificarClave, sha256, crearSesion, leerSesion, cerrarSesion,
  limitar, ipDe, ctxStock, ctxFin, iso, cookie, borrarCookie, COOKIE,
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
  const venta = cond => `SELECT COALESCE(SUM(total), 0) AS monto, COUNT(*) AS n FROM pedidos WHERE estado = 'procede' AND ${cond}`;
  const [hoy, semana, mes, pend, rec, cli, top, cons, bajo, dias, stock] = await env.DB.batch([
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
        WHERE v.stock IS NOT NULL AND v.stock <= 2 AND p.estado <> 'oculto' ORDER BY v.stock, p.orden, v.orden LIMIT 12`),
    env.DB.prepare(`SELECT date(procesado, '-5 hours') AS dia, SUM(total) AS monto, COUNT(*) AS n FROM pedidos
        WHERE estado = 'procede' AND procesado >= datetime('now', '-15 days') GROUP BY dia`),
    env.DB.prepare("SELECT COUNT(*) AS tallas, COUNT(stock) AS cargadas, COALESCE(SUM(stock), 0) AS unidades FROM variantes"),
  ]);
  const uno = r => r.results[0];
  return json({
    ok: true,
    ventas: { hoy: uno(hoy), semana: uno(semana), mes: uno(mes) },
    pendientes: uno(pend), reclamos: uno(rec).n, clientes: uno(cli),
    vendidos: top.results, consultados: cons.results, bajo: bajo.results, dias: dias.results, stock: uno(stock),
  });
}

/* ---------- Pedidos ---------- */

const PEDIDO_SQL = `SELECT p.id, p.codigo, p.creado, p.origen, p.estado, p.procesado, a.nombre AS procesado_por, p.cliente_id,
    COALESCE(p.nombre, c.nombre) AS nombre, c.email, p.celular, p.entrega, p.distrito, p.direccion, p.referencia, p.destino, p.agencia,
    p.subtotal, p.descuento, p.envio, p.total, p.precio_pendiente
  FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id LEFT JOIN admins a ON a.id = p.procesado_por`;
async function conItems(env, pedidos) {
  if (!pedidos.length) return [];
  const ids = pedidos.map(p => p.id);
  const items = (await env.DB.prepare(`SELECT i.pedido_id, i.slug, i.nombre, i.color, i.talla, i.cantidad, i.precio, v.stock
      FROM pedido_items i LEFT JOIN variantes v ON v.slug = i.slug AND v.color = i.color AND v.talla = i.talla
      WHERE i.pedido_id IN (${ids.map(() => "?").join(", ")}) ORDER BY i.id`).bind(...ids).all()).results;
  return pedidos.map(p => ({
    codigo: p.codigo, fecha: iso(p.creado), origen: p.origen, estado: p.estado, procesado: iso(p.procesado), procesado_por: p.procesado_por,
    cliente: { registrado: p.cliente_id != null, nombre: p.nombre, email: p.email, celular: p.celular },
    entrega: { tipo: p.entrega, distrito: p.distrito, direccion: p.direccion, referencia: p.referencia, destino: p.destino, agencia: p.agencia },
    subtotal: p.subtotal, descuento: p.descuento, envio: p.envio, total: p.total, consultar: !!p.precio_pendiente,
    items: items.filter(i => i.pedido_id === p.id).map(({ pedido_id, ...i }) => i),
  }));
}

/* GET /api/admin/pedidos?estado=pendiente|procede|cancelado|todos&q=texto */
export async function pedidos({ env, request, url }) {
  await adminDe(env, request);
  const estado = url.searchParams.get("estado") || "pendiente", q = texto(url.searchParams.get("q"), 60);
  const w = [], b = [];
  if (["pendiente", "procede", "cancelado"].includes(estado)) { w.push("p.estado = ?"); b.push(estado); }
  if (q) { w.push("(p.codigo LIKE ? OR COALESCE(p.nombre, c.nombre, '') LIKE ? OR COALESCE(p.celular, '') LIKE ?)"); b.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const filas = (await env.DB.prepare(`${PEDIDO_SQL} ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY p.creado DESC LIMIT 150`).bind(...b).all()).results;
  const [cuenta] = await env.DB.batch([env.DB.prepare("SELECT estado, COUNT(*) AS n FROM pedidos GROUP BY estado")]);
  return json({ ok: true, pedidos: await conItems(env, filas), cuenta: Object.fromEntries(cuenta.results.map(r => [r.estado, r.n])) });
}

/* POST /api/admin/pedidos/:codigo { accion: "procede" | "cancelado" }
   SI PROCEDE → la base descuenta el stock de cada prenda (disparador pedido_procede) y lo anota en el historial.
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

  if (b.accion === "procede") {
    const faltan = (await env.DB.prepare(`SELECT i.nombre, i.color, i.talla, SUM(i.cantidad) AS pedido, v.stock FROM pedido_items i
        JOIN variantes v ON v.slug = i.slug AND v.color = i.color AND v.talla = i.talla
        WHERE i.pedido_id = ? AND v.stock IS NOT NULL GROUP BY i.slug, i.color, i.talla HAVING v.stock < SUM(i.cantidad)`).bind(p.id).all()).results;
    if (faltan.length) throw new ErrorHttp(409, "sin_stock", { faltan });
  }
  let res;
  try {
    res = await env.DB.batch([
      ...ctxStock(env, "venta", { pedido: p.id, admin: a.id }),
      env.DB.prepare("UPDATE pedidos SET estado = ?, procesado = datetime('now'), procesado_por = ? WHERE id = ? AND estado = 'pendiente'").bind(b.accion, a.id, p.id),
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

/* ---------- Productos, precios y stock ---------- */

/* GET /api/admin/inventario → todos los productos con su stock por color y talla */
export async function inventario({ env, request }) {
  await adminDe(env, request);
  const [prod, vars] = await env.DB.batch([
    env.DB.prepare("SELECT slug, nombre, base, estilo, linea, cat, orden, precio, precio_antes, estado, actualizado FROM productos ORDER BY orden"),
    env.DB.prepare("SELECT slug, color, talla, stock, actualizado FROM variantes ORDER BY slug, orden"),
  ]);
  const porSlug = {};
  for (const v of vars.results) (porSlug[v.slug] ||= []).push({ color: v.color, talla: v.talla, stock: v.stock, actualizado: iso(v.actualizado) });
  return json({ ok: true, productos: prod.results.map(p => ({ ...p, actualizado: iso(p.actualizado), variantes: porSlug[p.slug] || [] })) });
}

/* POST /api/admin/stock { cambios: [{ slug, color, talla, stock }] } — stock: número de 0 a 99999, o null para "sin cargar" */
export async function guardarStock({ env, request }) {
  const a = await adminDe(env, request);
  const b = await leerJson(request, 200000);
  const cambios = Array.isArray(b.cambios) ? b.cambios : [];
  if (!cambios.length || cambios.length > 600) throw new ErrorHttp(400, "datos_invalidos");
  for (const c of cambios) {
    if (c.stock !== null && !(Number.isInteger(c.stock) && c.stock >= 0 && c.stock <= 99999)) throw new ErrorHttp(400, "stock_invalido");
    if (![c.slug, c.color, c.talla].every(x => typeof x === "string" && x)) throw new ErrorHttp(400, "datos_invalidos");
  }
  const res = await env.DB.batch([
    ...ctxStock(env, "ajuste", { admin: a.id }),
    ...cambios.map(c => env.DB.prepare("UPDATE variantes SET stock = ?, actualizado = datetime('now') WHERE slug = ? AND color = ? AND talla = ? AND stock IS NOT ?")
      .bind(c.stock, c.slug, c.color, c.talla, c.stock)),
    ...ctxFin(env),
  ]);
  // meta.changes también cuenta lo que escriben los disparadores: se cuenta cada talla que sí cambió
  const guardados = res.slice(1, 1 + cambios.length).filter(r => r.meta.changes > 0).length;
  return json({ ok: true, guardados });
}

/* POST /api/admin/productos/:slug { precio, precio_antes, estado, todos }
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
  const p = await env.DB.prepare("SELECT slug, base FROM productos WHERE slug = ?").bind(slug).first();
  if (!p) throw new ErrorHttp(404, "no_existe");
  const r2 = n => (n == null ? null : Math.round(n * 100) / 100);
  const q = [env.DB.prepare("UPDATE productos SET precio = ?, precio_antes = ?, estado = ?, actualizado = datetime('now') WHERE slug = ?").bind(r2(precio), r2(antes), b.estado, slug)];
  if (b.todos === true && p.base)
    q.push(env.DB.prepare("UPDATE productos SET precio = ?, precio_antes = ?, actualizado = datetime('now') WHERE base = ? AND slug <> ?").bind(r2(precio), r2(antes), p.base, slug));
  if (b.todos === true && p.base) q.push(env.DB.prepare("SELECT COUNT(*) AS n FROM productos WHERE base = ?").bind(p.base));
  const res = await env.DB.batch(q);
  return json({ ok: true, cambiados: b.todos === true && p.base ? res[res.length - 1].results[0].n : 1 });
}

/* GET /api/admin/movimientos?slug= → historial de stock (los últimos 300) */
export async function movimientos({ env, request, url }) {
  await adminDe(env, request);
  const slug = texto(url.searchParams.get("slug"), 80);
  const r = await env.DB.prepare(`SELECT m.fecha, m.slug, p.nombre, m.color, m.talla, m.antes, m.despues, m.motivo, pe.codigo AS pedido, a.nombre AS admin
      FROM movimientos m LEFT JOIN productos p ON p.slug = m.slug LEFT JOIN pedidos pe ON pe.id = m.pedido_id LEFT JOIN admins a ON a.id = m.admin_id
      ${slug ? "WHERE m.slug = ?" : ""} ORDER BY m.id DESC LIMIT 300`).bind(...(slug ? [slug] : [])).all();
  return json({ ok: true, movimientos: r.results.map(m => ({ ...m, fecha: iso(m.fecha) })) });
}

/* ---------- Clientes ---------- */

/* GET /api/admin/clientes → clientes con cuenta, lo que compraron (pedidos que procedieron) y si aceptan promociones */
export async function clientes({ env, request }) {
  await adminDe(env, request);
  const r = await env.DB.prepare(`SELECT c.id, c.nombre, c.email, c.promos, c.creado, c.ultimo_acceso,
      COUNT(p.id) AS pedidos, COALESCE(SUM(p.total), 0) AS total, MAX(p.procesado) AS ultima_compra
    FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado = 'procede'
    GROUP BY c.id ORDER BY total DESC, c.creado DESC`).all();
  return json({ ok: true, clientes: r.results.map(c => ({ ...c, promos: !!c.promos, creado: iso(c.creado), ultimo_acceso: iso(c.ultimo_acceso), ultima_compra: iso(c.ultima_compra) })) });
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
