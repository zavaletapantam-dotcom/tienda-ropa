/* =========================================================
   Utilidades del servidor (Cloudflare Pages Functions + D1)
   ========================================================= */

export class ErrorHttp extends Error {
  constructor(status, codigo, extra = {}) { super(codigo); this.status = status; this.codigo = codigo; this.extra = extra; }
}

export const json = (data, status = 200, headers = {}) =>
  new Response(typeof data === "string" ? data : JSON.stringify(data), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export async function leerJson(request, max = 30000) {
  const t = await request.text();
  if (t.length > max) throw new ErrorHttp(413, "muy_grande");
  try { const v = JSON.parse(t || "{}"); if (v && typeof v === "object") return v; } catch (_) {}
  throw new ErrorHttp(400, "datos_invalidos");
}

/* Texto limpio y con largo máximo; null si queda vacío */
export const texto = (v, max = 200) => {
  if (v == null) return null;
  const s = String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
  return s || null;
};

/* Cumpleaños "MM-DD" (solo día y mes; el 29 de febrero vale). Devuelve null si no es una fecha real. */
const DIAS_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const cumpleValido = v => {
  const m = /^(\d{2})-(\d{2})$/.exec(String(v ?? ""));
  if (!m) return null;
  const mes = +m[1], dia = +m[2];
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= DIAS_MES[mes - 1] ? `${m[1]}-${m[2]}` : null;
};

/* ---------- Cupones de los Puntos MAISON ---------- */
const LETRAS_CUPON = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const codigoCupon = () => "MC" + Array.from(crypto.getRandomValues(new Uint8Array(6)), x => LETRAS_CUPON[x % 32]).join("");
export const CUPON_RE = /^MC[A-HJ-NP-Z2-9]{6}$/;
/* Qué hace un cupón en un pedido (la misma regla en el carrito, al guardar el pedido y al editarlo en el panel):
   monto → descuenta hasta ese monto de las prendas · porcentaje → ese % de las prendas (después de otros descuentos)
   envio → envío gratis, solo para envío a domicilio cuando se cobra envío.
   Devuelve { desc, envio } o null si en ese pedido el cupón no sirve. */
export function efectoCupon(c, { subtotal, descuento = 0, entrega, envio }) {
  const r2 = n => Math.round(n * 100) / 100;
  if (c.tipo === "envio") return entrega === "domicilio" && envio > 0 ? { desc: 0, envio: 0 } : null;
  const base = Math.max(0, r2(subtotal - descuento));
  const desc = c.tipo === "monto" ? Math.min(+c.valor, base) : c.tipo === "porcentaje" ? r2((base * +c.valor) / 100) : 0;
  return desc > 0 ? { desc: r2(desc), envio } : null;
}

/* ---------- Cookies (siempre HttpOnly + Secure) ---------- */
export const COOKIE = { admin: "__Host-ms_admin", cliente: "__Host-ms_cliente", oauth: "__Host-ms_oauth" };
export const leerCookies = request => Object.fromEntries((request.headers.get("cookie") || "").split(/;\s*/).filter(Boolean).map(c => {
  const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
}));
export const cookie = (nombre, valor, { maxAge, sameSite = "Lax" } = {}) =>
  `${nombre}=${encodeURIComponent(valor)}; Path=/; HttpOnly; Secure; SameSite=${sameSite}${maxAge != null ? `; Max-Age=${maxAge}` : ""}`;
export const borrarCookie = (nombre, sameSite = "Lax") => cookie(nombre, "", { maxAge: 0, sameSite });

/* ---------- Azar, resúmenes y contraseñas ---------- */
const enc = new TextEncoder();
export const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const desdeB64url = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
export const aleatorio = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
export async function sha256(s) {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const ITERACIONES = 100000; // máximo que permite PBKDF2 en Cloudflare
export async function cifrarClave(clave, sal = crypto.getRandomValues(new Uint8Array(16)), iter = ITERACIONES) {
  const k = await crypto.subtle.importKey("raw", enc.encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iter }, k, 256);
  return `pbkdf2$${iter}$${b64url(sal)}$${b64url(bits)}`;
}
export async function verificarClave(clave, guardada) {
  const [tipo, iter, sal] = String(guardada).split("$");
  if (tipo !== "pbkdf2") return false;
  const nueva = await cifrarClave(clave, desdeB64url(sal), +iter);
  if (nueva.length !== guardada.length) return false;
  let d = 0; for (let i = 0; i < nueva.length; i++) d |= nueva.charCodeAt(i) ^ guardada.charCodeAt(i);
  return d === 0;
}

/* ---------- Sesiones: en la base solo queda el resumen SHA-256 del token ---------- */
export async function crearSesion(env, tipo, usuarioId, horas) {
  const token = aleatorio(32);
  await env.DB.prepare("INSERT INTO sesiones (token, tipo, usuario_id, expira) VALUES (?, ?, ?, datetime('now', ?))")
    .bind(await sha256(token), tipo, usuarioId, `+${horas} hours`).run();
  if (Math.random() < 0.05) await env.DB.prepare("DELETE FROM sesiones WHERE expira < datetime('now')").run();
  return token;
}
export async function leerSesion(env, request, tipo) {
  const t = leerCookies(request)[COOKIE[tipo]];
  if (!t) return null;
  const r = await env.DB.prepare("SELECT usuario_id FROM sesiones WHERE token = ? AND tipo = ? AND expira > datetime('now')")
    .bind(await sha256(t), tipo).first();
  return r ? { id: r.usuario_id, token: t } : null;
}
export async function cerrarSesion(env, token) {
  if (token) await env.DB.prepare("DELETE FROM sesiones WHERE token = ?").bind(await sha256(token)).run();
}

/* ---------- Límite de envíos por IP (pedidos, reclamos, accesos) ---------- */
export const ipDe = request => request.headers.get("cf-connecting-ip") || "sin-ip";
export async function limitar(env, clave, max, minutos) {
  const r = await env.DB.prepare(`INSERT INTO limites (clave, cuenta, expira) VALUES (?, 1, datetime('now', ?))
      ON CONFLICT(clave) DO UPDATE SET
        cuenta = CASE WHEN limites.expira < datetime('now') THEN 1 ELSE limites.cuenta + 1 END,
        expira = CASE WHEN limites.expira < datetime('now') THEN excluded.expira ELSE limites.expira END
      RETURNING cuenta`).bind(clave, `+${minutos} minutes`).first();
  if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM limites WHERE expira < datetime('now')").run();
  if (r.cuenta > max) throw new ErrorHttp(429, "demasiados_intentos");
}

/* ---------- Catálogo para la página: precios, estado y stock cargado ---------- */
/* Se arma una vez y se guarda; cualquier cambio de productos o stock sube catalogo_ver (disparadores) y se rearma. */
export async function catalogo(env) {
  const g = await env.DB.prepare(`SELECT (SELECT valor FROM ajustes WHERE clave = 'catalogo_ver') AS ver,
      (SELECT valor FROM ajustes WHERE clave = 'catalogo_hecho') AS hecho, (SELECT valor FROM ajustes WHERE clave = 'catalogo') AS json`).first();
  if (g && g.json && g.hecho === g.ver) return g.json;
  const [ver, prod, vars, ocu] = await env.DB.batch([
    env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'catalogo_ver'"),
    env.DB.prepare("SELECT slug, precio, precio_antes, estado FROM productos"),
    env.DB.prepare("SELECT slug, color, talla, stock FROM variantes WHERE stock IS NOT NULL"),
    env.DB.prepare("SELECT slug, color FROM colores_ocultos"),
  ]);
  const v = ver.results[0]?.valor || "0", out = { v, p: {} };
  for (const r of prod.results) out.p[r.slug] = { precio: r.precio, antes: r.precio_antes, estado: r.estado, stock: {} };
  for (const r of vars.results) { const s = out.p[r.slug]; if (s) (s.stock[r.color] ||= {})[r.talla] = r.stock; }
  // Colores apagados en el panel (Stock): la página no los muestra
  for (const r of ocu.results) { const s = out.p[r.slug]; if (s) (s.ocultos ||= []).push(r.color); }
  const txt = JSON.stringify(out);
  // Solo se guarda si nadie cambió nada mientras se armaba (si cambió, el siguiente lo rearma)
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO ajustes (clave, valor) SELECT 'catalogo', ? WHERE (SELECT valor FROM ajustes WHERE clave = 'catalogo_ver') = ?
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`).bind(txt, v),
    env.DB.prepare(`INSERT INTO ajustes (clave, valor) SELECT 'catalogo_hecho', ? WHERE (SELECT valor FROM ajustes WHERE clave = 'catalogo_ver') = ?
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`).bind(v, v),
  ]);
  return txt;
}

/* Contexto de un cambio de stock: lo lee el disparador que llena el historial (va dentro del mismo batch) */
export const ctxStock = (env, motivo, { pedido = null, admin = null, costo = null, proveedor = null, nota = null } = {}) => [
  env.DB.prepare(`INSERT INTO ajustes (clave, valor) VALUES ('ctx_motivo', ?), ('ctx_pedido', ?), ('ctx_admin', ?), ('ctx_costo', ?), ('ctx_proveedor', ?), ('ctx_nota', ?)
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`)
    .bind(motivo, pedido == null ? null : String(pedido), admin == null ? null : String(admin), costo == null ? null : String(costo), proveedor, nota),
];
export const ctxFin = env => [env.DB.prepare("DELETE FROM ajustes WHERE clave IN ('ctx_motivo', 'ctx_pedido', 'ctx_admin', 'ctx_costo', 'ctx_proveedor', 'ctx_nota')")];

/* Máximo de puntos que se pueden usar en un pedido (un cupón por pedido: ninguna recompensa puede costar más).
   Se cambia en el panel → Recompensas. Si nunca se cambió: 500. */
export const TOPE_PUNTOS_INICIAL = 500;
export async function topePuntos(env) {
  const r = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'puntos_tope'").first();
  const n = r ? Math.trunc(+r.valor) : 0;
  return n >= 1 ? n : TOPE_PUNTOS_INICIAL;
}

export async function config(env) {
  const r = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'config'").first();
  return r ? JSON.parse(r.valor) : { envio: 10, gratisDesde: 200, packDescuento: 0.2, packPasos: 3 };
}

/* Fecha de la base (UTC "AAAA-MM-DD HH:MM:SS") → ISO para el navegador */
export const iso = f => (f ? f.replace(" ", "T") + "Z" : null);
