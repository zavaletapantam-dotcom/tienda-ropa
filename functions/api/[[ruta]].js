/* =========================================================
   API de MAISON: todas las rutas /api/... pasan por aquí
   El código de cada ruta está en /servidor (tienda, google y admin).
   ========================================================= */
import { json, ErrorHttp } from "../../servidor/util.js";
import * as tienda from "../../servidor/tienda.js";
import * as google from "../../servidor/google.js";
import * as admin from "../../servidor/admin.js";

const RUTAS = [
  ["GET", "/api/inicio", tienda.inicio],
  ["POST", "/api/pedidos", tienda.crearPedido],
  ["POST", "/api/reclamos", tienda.crearReclamo],
  ["GET", "/api/cuenta", tienda.cuenta],
  ["PATCH", "/api/cuenta", tienda.cambiarCuenta],
  ["DELETE", "/api/cuenta", tienda.eliminarCuenta],
  ["GET", "/api/auth/google", google.empezar],
  ["GET", "/api/auth/google/callback", google.volver],
  ["POST", "/api/auth/salir", tienda.salirCliente],

  ["POST", "/api/admin/entrar", admin.entrar],
  ["POST", "/api/admin/salir", admin.salir],
  ["GET", "/api/admin/yo", admin.yo],
  ["POST", "/api/admin/invitacion", admin.invitacion],
  ["POST", "/api/admin/activar", admin.activar],
  ["GET", "/api/admin/resumen", admin.resumen],
  ["GET", "/api/admin/pedidos", admin.pedidos],
  ["POST", /^\/api\/admin\/pedidos\/(MS[A-Z0-9]{6})$/, admin.procesarPedido],
  ["GET", "/api/admin/inventario", admin.inventario],
  ["POST", "/api/admin/stock", admin.guardarStock],
  ["POST", /^\/api\/admin\/productos\/([a-z0-9-]+)$/, admin.guardarProducto],
  ["GET", "/api/admin/movimientos", admin.movimientos],
  ["POST", "/api/admin/fisico", admin.movimientoFisico],
  ["GET", "/api/admin/mayor", admin.ventasMayor],
  ["POST", "/api/admin/mayor", admin.crearVentaMayor],
  ["GET", "/api/admin/clientes", admin.clientes],
  ["GET", "/api/admin/reclamos", admin.reclamos],
  ["POST", /^\/api\/admin\/reclamos\/(\d{4}-\d{6})$/, admin.responderReclamo],
];

export async function onRequest(ctx) {
  const { request } = ctx, url = new URL(request.url);
  // Cambios (POST, PATCH, DELETE) solo desde la propia tienda; los del panel y la cuenta además llevan la cabecera x-maison
  if (request.method !== "GET") {
    const origen = request.headers.get("origin");
    if (origen && origen !== url.origin) return json({ ok: false, error: "origen_no_permitido" }, 403);
    if ((url.pathname.startsWith("/api/admin/") || url.pathname === "/api/cuenta") && request.headers.get("x-maison") !== "1")
      return json({ ok: false, error: "origen_no_permitido" }, 403);
  }
  if (!ctx.env.DB) return json({ ok: false, error: "sin_base" }, 503);
  for (const [metodo, ruta, fn] of RUTAS) {
    const m = typeof ruta === "string" ? (url.pathname === ruta ? [] : null) : url.pathname.match(ruta);
    if (!m) continue;
    if (metodo !== request.method) continue;
    try {
      return await fn({ ...ctx, url, params: m.slice(1) });
    } catch (e) {
      if (e instanceof ErrorHttp) return json({ ok: false, error: e.codigo, ...e.extra }, e.status);
      console.error(url.pathname, e && e.stack || e);
      return json({ ok: false, error: "error_interno" }, 500);
    }
  }
  return json({ ok: false, error: "no_existe" }, 404);
}
