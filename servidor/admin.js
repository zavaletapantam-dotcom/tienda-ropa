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
  const MES = "strftime('%Y-%m', 'now', '-5 hours')";
  const [hoy, semana, mes, pend, rec, cli, top, cons, bajo, dias, stock, fisico, menor, mayor] = await env.DB.batch([
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
    vendidos: top.results, consultados: cons.results, bajo: bajo.results, dias: dias.results, stock: uno(stock),
    fisico: uno(fisico), ganancia: { minorista: uno(menor), mayorista: uno(mayor) },
  });
}

/* ---------- Pedidos ---------- */

const PEDIDO_SQL = `SELECT p.id, p.codigo, p.creado, p.origen, p.estado, p.procesado, a.nombre AS procesado_por, p.cliente_id,
    COALESCE(p.nombre, c.nombre) AS nombre, c.email, p.celular, p.entrega, p.distrito, p.direccion, p.referencia, p.destino, p.agencia,
    p.subtotal, p.descuento, p.envio, p.total, p.precio_pendiente, p.origen_stock
  FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id LEFT JOIN admins a ON a.id = p.procesado_por`;
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

/* ---------- Productos, precios y stock ---------- */

/* GET /api/admin/inventario → todos los productos con su stock por color y talla */
export async function inventario({ env, request }) {
  await adminDe(env, request);
  const [prod, vars] = await env.DB.batch([
    env.DB.prepare("SELECT slug, nombre, base, estilo, linea, cat, orden, precio, precio_antes, costo, precio_mayor, estado, actualizado FROM productos ORDER BY orden"),
    env.DB.prepare("SELECT slug, color, talla, stock, fisico, actualizado, fisico_actualizado FROM variantes ORDER BY slug, orden"),
  ]);
  const porSlug = {};
  for (const v of vars.results) (porSlug[v.slug] ||= []).push({ color: v.color, talla: v.talla, stock: v.stock, fisico: v.fisico, actualizado: iso(v.actualizado), fisico_actualizado: iso(v.fisico_actualizado) });
  return json({ ok: true, productos: prod.results.map(p => ({ ...p, actualizado: iso(p.actualizado), variantes: porSlug[p.slug] || [] })) });
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

/* ---------- Stock físico: entradas y salidas del almacén ---------- */

const redondear = n => Math.round(n * 100) / 100;
const MOTIVOS_SALIDA = ["merma", "danado", "devolucion", "otro"];
const claveDe = i => `${i.slug}|${i.color}|${i.talla}`;
async function variantesDe(env, claves) {
  return (await env.DB.prepare(`SELECT v.slug, v.color, v.talla, v.stock, v.fisico, p.nombre, p.costo FROM variantes v JOIN productos p ON p.slug = v.slug
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
