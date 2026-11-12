/* =========================================================
   Iniciar sesión con Google (OpenID Connect, flujo con código)
   Necesita GOOGLE_CLIENT_ID (variable) y GOOGLE_CLIENT_SECRET (secreto) en Cloudflare.
   ========================================================= */
import { aleatorio, cookie, borrarCookie, leerCookies, crearSesion, COOKIE } from "./util.js";

const DIAS_SESION = 30;
const redir = (url, cookies = []) => {
  const h = new Headers({ location: url, "cache-control": "no-store" });
  cookies.forEach(c => h.append("set-cookie", c));
  return new Response(null, { status: 302, headers: h });
};
/* Solo se vuelve a páginas de la misma tienda */
const volverSeguro = v => (typeof v === "string" && /^\/(?!\/)[\w\-./?=&%~+]*$/.test(v) ? v : "/");
const callback = url => `${url.origin}/api/auth/google/callback`;

/* GET /api/auth/google?acepto=1&promos=0|1&volver=/tienda
   acepto: el cliente marcó que acepta los Términos y la Política de privacidad (obligatorio)
   promos: el cliente marcó que quiere recibir promociones (opcional) */
export async function empezar({ env, url }) {
  const volver = volverSeguro(url.searchParams.get("volver"));
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return redir(`${volver}#cuenta=no-disponible`);
  if (url.searchParams.get("acepto") !== "1") return redir(`${volver}#cuenta=falta-aceptar`);
  const estado = aleatorio(24);
  const datos = btoa(JSON.stringify({ e: estado, p: url.searchParams.get("promos") === "1" ? 1 : 0, v: volver }));
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: callback(url), response_type: "code",
    scope: "openid email profile", state: estado, prompt: "select_account",
  });
  return redir(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, [cookie(COOKIE.oauth, datos, { maxAge: 600 })]);
}

/* GET /api/auth/google/callback?code=…&state=… */
export async function volver({ env, url, request }) {
  let datos = null;
  try { datos = JSON.parse(atob(leerCookies(request)[COOKIE.oauth] || "")); } catch (_) {}
  const destino = volverSeguro(datos && datos.v);
  const limpiar = borrarCookie(COOKIE.oauth);
  const error = motivo => redir(`${destino}#cuenta=${motivo}`, [limpiar]);
  if (!datos || !datos.e || url.searchParams.get("state") !== datos.e) {
    await anotar(env, "estado", { cookie: !!datos, state: !!url.searchParams.get("state") });
    return error("error");
  }
  if (url.searchParams.get("error")) {
    await anotar(env, "google", { error: url.searchParams.get("error") });
    return error("cancelado");
  }
  const code = url.searchParams.get("code");
  if (!code) { await anotar(env, "sin_codigo", {}); return error("error"); }

  // Cambia el código por la identidad del cliente (directo con Google, con el secreto de la app)
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: String(env.GOOGLE_CLIENT_SECRET || "").trim(), redirect_uri: callback(url), grant_type: "authorization_code" }),
  });
  if (!r.ok) {
    const b = await r.json().catch(() => ({}));
    await anotar(env, "token", { status: r.status, error: b.error, detalle: b.error_description, largo_secreto: String(env.GOOGLE_CLIENT_SECRET || "").trim().length });
    return error("error");
  }
  const t = await r.json();
  const id = leerIdToken(t.id_token);
  const ahora = Date.now() / 1000;
  if (!id || !["accounts.google.com", "https://accounts.google.com"].includes(id.iss) || id.aud !== env.GOOGLE_CLIENT_ID || !(id.exp > ahora) || !id.sub || !id.email || id.email_verified === false) {
    await anotar(env, "id_token", { leido: !!id, iss: id && id.iss, aud_ok: !!id && id.aud === env.GOOGLE_CLIENT_ID, vigente: !!id && id.exp > ahora, verificado: id && id.email_verified });
    return error("error");
  }

  const nombre = String(id.name || id.given_name || "").slice(0, 120) || null, foto = String(id.picture || "").slice(0, 500) || null;
  const existe = await env.DB.prepare("SELECT id FROM clientes WHERE google_id = ?").bind(id.sub).first();
  let clienteId;
  if (existe) {
    clienteId = existe.id;
    await env.DB.prepare(`UPDATE clientes SET email = ?, nombre = ?, foto = ?, ultimo_acceso = datetime('now')
        ${datos.p ? ", promos = 1, promos_fecha = datetime('now')" : ""} WHERE id = ?`).bind(id.email, nombre, foto, clienteId).run();
  } else {
    const n = await env.DB.prepare(`INSERT INTO clientes (google_id, email, nombre, foto, acepto, promos, promos_fecha, ultimo_acceso)
        VALUES (?, ?, ?, ?, datetime('now'), ?, CASE WHEN ? = 1 THEN datetime('now') END, datetime('now')) RETURNING id`)
      .bind(id.sub, id.email, nombre, foto, datos.p, datos.p).first();
    clienteId = n.id;
  }
  const token = await crearSesion(env, "cliente", clienteId, DIAS_SESION * 24);
  return redir(`${destino}#cuenta=${existe ? "hola" : "lista"}`, [limpiar, cookie(COOKIE.cliente, token, { maxAge: DIAS_SESION * 86400 })]);
}

/* Guarda el último motivo por el que falló un inicio de sesión (sin datos secretos) para poder revisarlo */
async function anotar(env, paso, detalle) {
  console.error("google:", paso, JSON.stringify(detalle));
  try {
    await env.DB.prepare("INSERT INTO ajustes (clave, valor) VALUES ('oauth_ultimo_error', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor")
      .bind(JSON.stringify({ fecha: new Date().toISOString(), paso, ...detalle })).run();
  } catch (_) {}
}

function leerIdToken(jwt) {
  try {
    const p = String(jwt).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p), c => c.charCodeAt(0))));
  } catch (_) { return null; }
}
