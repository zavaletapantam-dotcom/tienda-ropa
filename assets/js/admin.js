/* =========================================================
   MAISON — panel admin (https://maison.pe/admin)
   Productos, colores, tallas y fotos: los mismos de la tienda (datos.js y fotos.js).
   Stock, precios, estado, pedidos, clientes y reclamos: la base de datos (API /api/admin).
   Lo que se guarda aquí se ve en la tienda en el momento.
   ========================================================= */
(() => {
"use strict";

const C = window.CONFIG, PRODUCTS = window.PRODUCTS, CATS = window.CATEGORIES, LINES = window.LINES || {}, FOTOS = window.FOTOS || {}, LOGO = window.MAISON_LOGO;
const PROD = Object.fromEntries(PRODUCTS.map(p => [p.slug, p]));
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const money = n => (n == null ? "—" : "S/" + Number(n).toFixed(2));
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const lineName = slug => { const l = LINES[slug]; return l ? l.collab || l.name : ""; };
const catName = slug => (CATS.find(c => c.slug === slug) || {}).name || "";

/* ---------- Fechas en hora de Perú ---------- */
const TZ = "America/Lima";
const fFecha = iso => (iso ? new Date(iso).toLocaleString("es-PE", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const fDia = iso => (iso ? new Date(iso).toLocaleDateString("es-PE", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }) : "—");
const diaLima = d => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
/* Libro de Reclamaciones: se responde en 15 días hábiles (lunes a viernes) desde que llegó */
function venceReclamo(iso) {
  const d = new Date(diaLima(new Date(iso)) + "T12:00:00Z");
  for (let n = 0; n < 15;) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w && w !== 6) n++; }
  return d;
}

/* ---------- Fotos (las mismas WebP de la tienda) ---------- */
const fotoKey = f => String(f).split("/").pop().replace(/\.[^.]+$/, "");
function fotoUrl(f, w = 200) {
  const m = FOTOS[fotoKey(f)]; if (!m) return "img/" + f;
  const ws = Object.keys(m.s).map(Number).sort((a, b) => a - b);
  return "img/" + m.s[ws.find(x => x >= w) || ws[ws.length - 1]];
}
function imgDe(slug, color) {
  const p = PROD[slug]; if (!p) return "";
  const c = (color && p.colors.find(x => x[0] === color)) || p.colors[0];
  return fotoUrl(c[2][0], 200);
}
const colorHex = (slug, color) => ((PROD[slug] && PROD[slug].colors.find(c => c[0] === color)) || [])[1] || "#ddd";

/* ---------- Logo MAISON (vector de marca.js) ---------- */
const [MX0, MY0, MX1, MY1] = LOGO.box.mark, [WX0, WY0, WX1, WY1] = LOGO.box.word, PAD = 24;
const VB = {
  stacked: [Math.min(MX0, WX0) - PAD, MY0 - PAD, Math.max(MX1, WX1) - Math.min(MX0, WX0) + PAD * 2, WY1 - MY0 + PAD * 2],
  word: [WX0 - PAD, WY0 - PAD, WX1 - WX0 + PAD * 2, WY1 - WY0 + PAD * 2],
};
function logoSVG(v) {
  const m = `<path class="logo-m" d="${LOGO.mark}" fill-rule="evenodd"/>`, l = LOGO.letters.map(d => `<path class="lt" d="${d}" fill-rule="evenodd"/>`).join("");
  return `<svg class="logo-svg" viewBox="${VB[v].join(" ")}" role="img" aria-label="MAISON">${v === "word" ? l : m + l}</svg>`;
}

/* ---------- Íconos ---------- */
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  resumen: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  pedidos: svg('<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  stock: svg('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>'),
  productos: svg('<path d="M3 12V3h9l9 9-9 9-9-9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  clientes: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>'),
  reclamos: svg('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5M9 7h7M9 11h5"/>'),
  salir: svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
  buscar: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  check: svg('<path d="m5 12 4.5 4.5L19 7"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  hist: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'),
  ref: svg('<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5"/>'),
  bajar: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/>'),
  print: svg('<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>'),
  wa: svg('<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/>'),
};

/* ---------- API ---------- */
const fallo = (codigo, data = {}) => Object.assign(new Error(codigo), { codigo, data });
let YO = null;
async function api(ruta, { method = "GET", body } = {}) {
  let r;
  try {
    r = await fetch("/api/admin/" + ruta, {
      method, credentials: "same-origin", cache: "no-store",
      headers: { "x-maison": "1", ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_) { throw fallo("sin_conexion"); }
  let j = {}; try { j = await r.json(); } catch (_) {}
  if (!r.ok || j.ok === false) {
    if (r.status === 401 && YO) { YO = null; pantallaEntrar("Tu sesión terminó. Vuelve a entrar."); }
    throw fallo(j.error || "error", j);
  }
  return j;
}
const MSG = {
  datos_incorrectos: "Usuario o contraseña incorrectos.",
  bloqueado: d => `Demasiados intentos. Vuelve a intentarlo en ${plural(d.minutos || 15, "minuto", "minutos")}.`,
  demasiados_intentos: "Demasiados intentos. Espera unos minutos.",
  enlace_vencido: "Este enlace ya se usó o venció. Pide uno nuevo.",
  usuario_invalido: "El usuario debe tener de 3 a 30 letras minúsculas o números (también punto o guion bajo).",
  clave_corta: "La contraseña debe tener al menos 10 caracteres.",
  clave_con_usuario: "La contraseña no puede contener tu usuario.",
  usuario_existe: "Ese usuario ya existe. Elige otro.",
  ya_procesado: "Este pedido ya fue procesado.",
  sin_conexion: "No hay conexión. Revisa tu internet.",
  precio_invalido: "Revisa el precio.",
  precio_antes_invalido: "El precio normal debe ser mayor que el precio final.",
  falta_respuesta: "Escribe la respuesta antes de guardar.",
  error: "No se pudo completar. Inténtalo de nuevo.",
};
const msg = e => { const m = MSG[e.codigo] || MSG.error; return typeof m === "function" ? m(e.data || {}) : m; };

/* ---------- Avisos y ventanas ---------- */
let toastT;
function toast(t) {
  const el = $("#toast"); if (!el) return;
  el.textContent = t; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 3200);
}
/* Ventana propia (nunca alert/confirm). acciones: [{ t, clase, v }] → devuelve el v del botón tocado (o null) */
function ventana({ titulo, html, acciones = [], ancho = false, alAbrir }) {
  return new Promise(resolve => {
    const d = document.createElement("div");
    d.className = "dlg" + (ancho ? " dlg--ancho" : "");
    d.innerHTML = `<div class="dlg__bg"></div><div class="dlg__box" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <button class="dlg__x" type="button" aria-label="Cerrar">${I.x}</button><h2>${esc(titulo)}</h2><div class="dlg__body">${html}</div>
      ${acciones.length ? `<div class="dlg__acts">${acciones.map((a, i) => `<button type="button" class="btn ${a.clase || ""}" data-i="${i}">${a.t}</button>`).join("")}</div>` : ""}</div>`;
    document.body.append(d);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    requestAnimationFrame(() => d.classList.add("open"));
    const cerrar = v => {
      d.classList.remove("open"); document.body.style.overflow = prev;
      removeEventListener("keydown", esc_); setTimeout(() => d.remove(), 300); resolve(v);
    };
    const esc_ = e => { if (e.key === "Escape") cerrar(null); };
    addEventListener("keydown", esc_);
    $(".dlg__bg", d).addEventListener("click", () => cerrar(null));
    $(".dlg__x", d).addEventListener("click", () => cerrar(null));
    $$(".dlg__acts button", d).forEach(b => b.addEventListener("click", async () => {
      const a = acciones[+b.dataset.i];
      if (a.antes) { b.disabled = true; const ok = await a.antes(d); b.disabled = false; if (!ok) return; }
      cerrar(a.v === undefined ? true : a.v);
    }));
    if (alAbrir) alAbrir(d);
    setTimeout(() => ($(".dlg__acts .btn--pri, .dlg__acts .btn--bad", d) || $(".dlg__x", d)).focus(), 60);
  });
}
const confirmar = (titulo, html, ok, clase = "btn--pri") => ventana({ titulo, html, acciones: [{ t: "Volver", v: false }, { t: ok, clase, v: true }] }).then(v => v === true);
const avisar = (titulo, html) => ventana({ titulo, html, acciones: [{ t: "Entendido", clase: "btn--pri" }] });

/* =========================================================
   ACCESO
   ========================================================= */
function pantallaEntrar(aviso) {
  document.title = "Panel · MAISON";
  $("#app").innerHTML = `<div class="gate"><form class="gate__box" id="fEntrar" novalidate>
    <div class="gate__logo">${logoSVG("stacked")}</div>
    <h1>Panel MAISON</h1>
    <p class="gate__lead">Entra con tu usuario y tu contraseña</p>
    ${aviso ? `<p class="alert alert--warn">${esc(aviso)}</p>` : ""}
    <div class="f"><label for="eU">Usuario</label><input class="inp" id="eU" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
    <div class="f"><label for="eC">Contraseña</label><input class="inp" id="eC" type="password" autocomplete="current-password" required></div>
    <p class="alert alert--bad" id="eErr" hidden></p>
    <button class="btn btn--pri btn--full" id="eBtn">Entrar</button>
  </form></div>`;
  $("#eU").focus();
  $("#fEntrar").addEventListener("submit", async e => {
    e.preventDefault();
    const u = $("#eU").value.trim(), c = $("#eC").value, err = $("#eErr");
    if (!u || !c) { err.textContent = "Escribe tu usuario y tu contraseña."; err.hidden = false; return; }
    $("#eBtn").disabled = true; err.hidden = true;
    try {
      await api("entrar", { method: "POST", body: { usuario: u, clave: c } });
      YO = await api("yo"); armar();
    } catch (x) {
      err.textContent = msg(x) + (x.codigo === "datos_incorrectos" && x.data.quedan ? ` Te quedan ${plural(x.data.quedan, "intento", "intentos")}.` : "");
      err.hidden = false; $("#eBtn").disabled = false; $("#eC").select();
    }
  });
}

async function pantallaActivar(token) {
  const limpiar = () => history.replaceState(null, "", location.pathname);
  let nombre;
  try { nombre = (await api("invitacion", { method: "POST", body: { token } })).nombre; }
  catch (e) {
    limpiar();
    $("#app").innerHTML = `<div class="gate"><div class="gate__box"><div class="gate__logo">${logoSVG("stacked")}</div>
      <h1>Enlace no válido</h1><p class="gate__lead">${esc(msg(e))}</p><a class="btn btn--pri btn--full" href="admin.html">Ir a entrar</a></div></div>`;
    return;
  }
  $("#app").innerHTML = `<div class="gate"><form class="gate__box" id="fAct" novalidate>
    <div class="gate__logo">${logoSVG("stacked")}</div>
    <h1>Crea tu acceso</h1>
    <p class="gate__lead">Panel de MAISON</p>
    <div class="f"><label for="aN">Tu nombre</label><input class="inp" id="aN" autocomplete="name" maxlength="60" value="${esc(nombre)}"></div>
    <div class="f"><label for="aU">Usuario</label><input class="inp" id="aU" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ej. daniel"></div>
    <div class="f"><label for="aC">Contraseña</label><input class="inp" id="aC" type="password" autocomplete="new-password" placeholder="Mínimo 10 caracteres"></div>
    <div class="f"><label for="aC2">Repite la contraseña</label><input class="inp" id="aC2" type="password" autocomplete="new-password"></div>
    <p class="alert alert--bad" id="aErr" hidden></p>
    <button class="btn btn--pri btn--full" id="aBtn">Crear mi acceso</button>
  </form></div>`;
  $("#aN").focus(); $("#aN").select();
  $("#fAct").addEventListener("submit", async e => {
    e.preventDefault();
    const n = $("#aN").value.trim(), u = $("#aU").value.trim().toLowerCase(), c = $("#aC").value, err = $("#aErr");
    const mal = t => { err.textContent = t; err.hidden = false; };
    if (n.length < 2) return mal("Escribe tu nombre.");
    if (!/^[a-z0-9._-]{3,30}$/.test(u)) return mal(MSG.usuario_invalido);
    if (c.length < 10) return mal(MSG.clave_corta);
    if (c !== $("#aC2").value) return mal("Las contraseñas no coinciden.");
    $("#aBtn").disabled = true; err.hidden = true;
    try {
      await api("activar", { method: "POST", body: { token, nombre: n, usuario: u, clave: c } });
      limpiar(); YO = await api("yo"); armar(); toast(`Listo, ${n.split(" ")[0]}. Tu acceso quedó creado.`);
    } catch (x) { mal(msg(x)); $("#aBtn").disabled = false; }
  });
}

/* =========================================================
   ESTRUCTURA Y NAVEGACIÓN
   ========================================================= */
const SECCIONES = [["resumen", "Resumen"], ["pedidos", "Pedidos"], ["stock", "Stock"], ["productos", "Productos"], ["clientes", "Clientes"], ["reclamos", "Reclamos"]];
let actual = "", sucio = null, badgeT;
function armar() {
  actual = "";
  $("#app").innerHTML = `<div class="shell">
    <aside class="side">
      <a class="side__logo" href="#resumen">${logoSVG("word")}<small>Panel</small></a>
      <nav class="nav">${SECCIONES.map(([k, t]) => `<a href="#${k}" data-k="${k}">${I[k]}<span>${t}</span><b class="badge" data-badge="${k}" hidden></b></a>`).join("")}</nav>
      <div class="side__user"><b>${esc(YO.nombre)}</b><button type="button" id="salir">${I.salir}<span>Salir</span></button></div>
    </aside>
    <main class="main" id="main"></main>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  $("#salir").addEventListener("click", async () => {
    if (sucio && sucio() && !(await confirmar("Tienes cambios sin guardar", "<p>Si sales ahora, se pierden los cambios que no guardaste.</p>", "Salir sin guardar", "btn--bad"))) return;
    try { await api("salir", { method: "POST" }); } catch (_) {}
    YO = null; sucio = null; pantallaEntrar();
  });
  clearInterval(badgeT); badgeT = setInterval(badges, 90000);
  ir();
}
async function ir() {
  if (!YO || !$("#main")) return;
  const k = location.hash.slice(1), v = VISTAS[k] ? k : "resumen";
  if (v === actual) return;
  if (sucio && sucio()) {
    if (!(await confirmar("Tienes cambios sin guardar", "<p>Si sales ahora, se pierden los cambios que no guardaste.</p>", "Salir sin guardar", "btn--bad"))) {
      history.replaceState(null, "", "#" + actual); return;
    }
  }
  sucio = null; actual = v;
  document.title = `${SECCIONES.find(s => s[0] === v)[1]} · Panel MAISON`;
  $$(".nav a").forEach(a => a.classList.toggle("on", a.dataset.k === v));
  const m = $("#main");
  m.innerHTML = `<div class="loading">Cargando…</div>`; scrollTo(0, 0);
  try { await VISTAS[v](m); } catch (e) { if (YO && actual === v) m.innerHTML = `<div class="empty"><b>No se pudo cargar</b>${esc(msg(e))}</div>`; }
  badges();
}
addEventListener("hashchange", ir);
addEventListener("beforeunload", e => { if (sucio && sucio()) { e.preventDefault(); e.returnValue = ""; } });
async function badges() {
  if (!YO) return;
  try {
    const r = await api("resumen");
    const set = (k, n) => { const b = $(`[data-badge="${k}"]`); if (b) { b.textContent = n; b.hidden = !n; } };
    set("pedidos", r.pendientes.n); set("reclamos", r.reclamos);
  } catch (_) {}
}

/* =========================================================
   RESUMEN
   ========================================================= */
async function vResumen(m) {
  const r = await api("resumen");
  const kpi = (t, v, sub, href, tono) => `<${href ? `a href="${href}"` : "div"} class="kpi${tono ? " kpi--" + tono : ""}"><span>${t}</span><b>${v}</b>${sub ? `<em>${sub}</em>` : ""}</${href ? "a" : "div"}>`;
  // Últimos 14 días (hora de Perú), con o sin ventas
  const porDia = Object.fromEntries(r.dias.map(d => [d.dia, d]));
  const dias = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 86400e3); const k = diaLima(d); return { k, d, ...(porDia[k] || { monto: 0, n: 0 }) }; });
  const max = Math.max(1, ...dias.map(d => d.monto));
  const rank = (lista, fn) => lista.length
    ? `<ul class="rank">${lista.map(x => `<li><img src="${imgDe(x.slug, x.color)}" alt="" loading="lazy"><div><b>${esc(x.nombre)}</b>${x.color ? `<span>${esc(x.color)} · Talla ${esc(x.talla)}</span>` : ""}</div><strong>${fn(x)}</strong></li>`).join("")}</ul>`
    : `<p class="empty" style="padding:24px 0">Todavía no hay datos</p>`;
  const pctCarga = r.stock.tallas ? Math.round((r.stock.cargadas / r.stock.tallas) * 100) : 0;
  m.innerHTML = `
    <header class="top"><div><h1>Resumen</h1><p class="top__sub">${new Date().toLocaleDateString("es-PE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" })}</p></div></header>
    <section class="kpis">
      ${kpi("Ventas de hoy", money(r.ventas.hoy.monto), plural(r.ventas.hoy.n, "pedido", "pedidos"))}
      ${kpi("Últimos 7 días", money(r.ventas.semana.monto), plural(r.ventas.semana.n, "pedido", "pedidos"))}
      ${kpi("Este mes", money(r.ventas.mes.monto), plural(r.ventas.mes.n, "pedido", "pedidos"))}
      ${kpi("Pedidos por confirmar", r.pendientes.n, r.pendientes.n ? money(r.pendientes.monto) : "", "#pedidos", r.pendientes.n ? "warn" : "")}
      ${kpi("Reclamos por responder", r.reclamos, "", "#reclamos", r.reclamos ? "bad" : "")}
      ${kpi("Clientes con cuenta", r.clientes.n, r.clientes.n ? `${r.clientes.promos} aceptan promociones` : "", "#clientes")}
    </section>
    <section class="card" style="margin-bottom:18px"><h2>Ventas de los últimos 14 días</h2>
      <div class="chart">${dias.map(d => `<div class="chart__col${d.monto ? "" : " cero"}" title="${fDia(d.d)}: ${money(d.monto)} · ${plural(d.n, "pedido", "pedidos")}">
        <em>${d.monto ? "S/" + Math.round(d.monto) : ""}</em><i style="height:${Math.max(2, (d.monto / max) * 100)}%"></i><span>${d.d.toLocaleDateString("es-PE", { timeZone: TZ, day: "numeric" })}</span></div>`).join("")}</div>
    </section>
    <div class="grid3" style="margin-bottom:18px">
      <section class="card"><h2>Lo más vendido en 30 días</h2>${rank(r.vendidos, x => plural(x.n, "unidad", "unidades"))}</section>
      <section class="card"><h2>Lo más consultado en 30 días</h2>${rank(r.consultados, x => plural(x.n, "unidad", "unidades"))}</section>
      <section class="card"><h2>Stock bajo</h2>${rank(r.bajo, x => `<span class="pill ${x.stock ? "pill--pendiente" : "pill--bad"}">${x.stock ? `Quedan ${x.stock}` : "Agotado"}</span>`)}</section>
    </div>
    <section class="card"><h2>Stock cargado</h2><div class="meter"><i style="width:${pctCarga}%"></i></div>
      <div class="cargado"><p><b>${r.stock.cargadas}</b> de ${r.stock.tallas} tallas · <b>${r.stock.unidades}</b> unidades en total</p><a class="btn btn--pri" href="#stock">${I.stock}Cargar stock</a></div>
    </section>`;
}

/* =========================================================
   PEDIDOS
   ========================================================= */
const ORIGEN = { carrito: "Carrito", producto: "Producto", pack: "Pack Deluxe" };
const ESTADO = { pendiente: "Pendiente", procede: "Confirmado", cancelado: "Cancelado" };
const ped = { estado: "pendiente", q: "" };
function entregaTexto(e) {
  if (e.tipo === "domicilio") return `<b>Envío a domicilio</b><br>${esc(e.direccion || "")}${e.distrito ? `, ${esc(e.distrito)}` : ""}${e.referencia ? `<br>Referencia: ${esc(e.referencia)}` : ""}`;
  if (e.tipo === "recojo") return "<b>Recojo en tienda</b>";
  if (e.tipo === "provincia") return `<b>Envío a provincia por ${esc(C.courier)}</b><br>${esc(e.destino || "")}${e.agencia ? `<br>Agencia: ${esc(e.agencia)}` : ""}`;
  return "A coordinar por WhatsApp";
}
const waCel = cel => { const d = String(cel || "").replace(/\D/g, ""); return d.length === 9 ? "51" + d : d; };
function stockCelda(i, estado) {
  if (i.stock == null) return `<span class="chip">Sin cargar</span>`;
  if (estado !== "pendiente") return i.stock;
  if (i.stock < i.cantidad) return `<span class="pill pill--bad">Solo hay ${i.stock}</span>`;
  return `${i.stock} → <b>${i.stock - i.cantidad}</b>`;
}
function pedidoHTML(p) {
  const c = p.cliente;
  return `<article class="ped ped--${p.estado}" data-cod="${p.codigo}">
    <header class="ped__head">
      <div><span class="ped__cod">${p.codigo}</span><span class="ped__fecha">${fFecha(p.fecha)}</span></div>
      <div class="ped__tags"><span class="chip">${ORIGEN[p.origen] || p.origen}</span>${c.registrado ? `<span class="chip chip--teal">Con cuenta</span>` : ""}<span class="pill pill--${p.estado}">${ESTADO[p.estado]}</span></div>
    </header>
    <div class="ped__body">
      <div class="ped__cli">
        <h3>Cliente</h3>
        <p><b>${esc(c.nombre || "Sin nombre")}</b>${c.email ? `<br>${esc(c.email)}` : ""}</p>
        ${c.celular ? `<p><a class="lnk" href="https://wa.me/${waCel(c.celular)}" target="_blank" rel="noopener">${I.wa}${esc(c.celular)}</a></p>` : ""}
        <h3>Entrega</h3><p>${entregaTexto(p.entrega)}</p>
      </div>
      <div class="wrap-tbl"><table class="tbl">
        <thead><tr><th>Prenda</th><th>Color</th><th>Talla</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Stock</th></tr></thead>
        <tbody>${p.items.map(i => `<tr><td><div class="prd"><img src="${imgDe(i.slug, i.color)}" alt="" loading="lazy"><b>${esc(i.nombre)}</b></div></td><td data-l="Color">${esc(i.color)}</td><td data-l="Talla">${esc(i.talla)}</td><td class="num" data-l="Cantidad">${i.cantidad}</td><td class="num" data-l="Precio">${money(i.precio)}</td><td class="num" data-l="Stock">${stockCelda(i, p.estado)}</td></tr>`).join("")}</tbody>
      </table></div>
    </div>
    <footer class="ped__foot">
      <div class="tot"><span>Subtotal <b>${money(p.subtotal)}</b></span>${p.descuento ? `<span>Descuento <b>−${money(p.descuento)}</b></span>` : ""}<span>Envío <b>${p.envio == null ? (p.entrega.tipo === "provincia" ? "Tarifa Shalom" : "A coordinar") : p.envio ? money(p.envio) : "Gratis"}</b></span><span class="grande">Total <b>${money(p.total)}</b></span></div>
      ${p.estado === "pendiente"
        ? `<div class="ped__acts"><button class="btn" type="button" data-accion="cancelado">${I.x}Cancelar</button><button class="btn btn--pri" type="button" data-accion="procede">${I.check}Procede</button></div>`
        : `<p class="ped__done">${ESTADO[p.estado]} por ${esc(p.procesado_por || "—")} · ${fFecha(p.procesado)}</p>`}
    </footer>
  </article>`;
}
async function vPedidos(m) {
  m.innerHTML = `<header class="top"><h1>Pedidos</h1><div class="top__acts"><button class="btn" type="button" id="pRef">${I.ref}Actualizar</button></div></header>
    <div class="bar"><div class="tabs" id="pTabs"></div><label class="search">${I.buscar}<input class="inp" id="pQ" type="search" placeholder="Buscar código, nombre o celular" value="${esc(ped.q)}"></label></div>
    <div class="peds" id="pLista"><div class="loading">Cargando…</div></div>`;
  let lista = [], t;
  const cargar = async () => {
    const r = await api(`pedidos?estado=${ped.estado}&q=${encodeURIComponent(ped.q)}`);
    lista = r.pedidos;
    const n = { ...r.cuenta, todos: Object.values(r.cuenta).reduce((a, b) => a + b, 0) };
    $("#pTabs").innerHTML = [["pendiente", "Por confirmar"], ["procede", "Confirmados"], ["cancelado", "Cancelados"], ["todos", "Todos"]]
      .map(([k, l]) => `<button type="button" data-e="${k}" class="${ped.estado === k ? "on" : ""}">${l} <b>${n[k] || 0}</b></button>`).join("");
    $("#pLista").innerHTML = lista.length ? lista.map(pedidoHTML).join("")
      : `<div class="empty"><b>${ped.q ? "Sin resultados" : ped.estado === "pendiente" ? "No hay pedidos por confirmar" : "No hay pedidos aquí"}</b>${ped.q ? "Prueba con otro código, nombre o celular." : ""}</div>`;
  };
  await cargar();
  $("#pRef").addEventListener("click", () => cargar().then(badges).catch(e => toast(msg(e))));
  $("#pTabs").addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (b) { ped.estado = b.dataset.e; cargar().catch(x => toast(msg(x))); } });
  $("#pQ").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { ped.q = e.target.value.trim(); cargar().catch(x => toast(msg(x))); }, 300); });
  $("#pLista").addEventListener("click", async e => {
    const b = e.target.closest("[data-accion]"); if (!b) return;
    const p = lista.find(x => x.codigo === b.closest(".ped").dataset.cod); if (!p) return;
    const linea = i => `<li><span>${esc(i.nombre)} · ${esc(i.color)} · Talla ${esc(i.talla)} × ${i.cantidad}</span><b>${i.stock == null ? "Sin stock cargado" : `${i.stock} → ${i.stock - i.cantidad}`}</b></li>`;
    if (b.dataset.accion === "procede") {
      if (!(await confirmar(`¿El pedido ${p.codigo} procede?`, `<p>Se descuenta del stock:</p><ul>${p.items.map(linea).join("")}</ul>`, "Sí, procede"))) return;
    } else if (!(await confirmar(`¿Cancelar el pedido ${p.codigo}?`, "<p>El stock no cambia.</p>", "Sí, cancelar", "btn--bad"))) return;
    try {
      await api(`pedidos/${p.codigo}`, { method: "POST", body: { accion: b.dataset.accion } });
      toast(b.dataset.accion === "procede" ? `Pedido ${p.codigo} confirmado. El stock ya se actualizó en la tienda.` : `Pedido ${p.codigo} cancelado.`);
    } catch (x) {
      if (x.codigo === "sin_stock") await avisar("No hay stock suficiente", `<p>El pedido sigue por confirmar y no se descontó nada.</p>${(x.data.faltan || []).length ? `<ul>${x.data.faltan.map(f => `<li><span>${esc(f.nombre)} · ${esc(f.color)} · Talla ${esc(f.talla)}</span><b>Pidió ${f.pedido} · hay ${f.stock}</b></li>`).join("")}</ul>` : ""}`);
      else toast(msg(x));
    }
    await cargar().catch(() => {}); badges();
  });
}

/* =========================================================
   INVENTARIO (stock y productos): base de datos + datos de la tienda
   ========================================================= */
let INV = {};
async function cargarInv() {
  const r = await api("inventario");
  INV = Object.fromEntries(r.productos.map(p => [p.slug, { ...p, vars: Object.fromEntries(p.variantes.map(v => [v.color + "|" + v.talla, v])) }]));
}
/* Prendas o tallas de la tienda que todavía no están en la base (se agregan al publicar) */
function desfase() {
  let n = 0;
  PRODUCTS.forEach(p => { const d = INV[p.slug]; p.colors.forEach(([c]) => p.sizes.forEach(t => { if (!d || !d.vars[c + "|" + t]) n++; })); });
  return n ? `<p class="alert alert--warn">Hay ${plural(n, "talla nueva", "tallas nuevas")} de la tienda que todavía no está en el panel. Aparecen solas al publicar.</p>` : "";
}
const filtroLinea = (sel, valor) => `<select class="sel" id="${sel}"><option value="">Todas las líneas</option>${Object.values(LINES).map(l => `<option value="${l.slug}"${valor === l.slug ? " selected" : ""}>${esc(l.collab || l.name)}</option>`).join("")}</select>`;
const filtroCat = (sel, linea, valor) => `<select class="sel" id="${sel}"><option value="">Todas las categorías</option>${CATS.filter(c => (!linea || c.linea === linea) && PRODUCTS.some(p => p.cat === c.slug)).map(c => `<option value="${c.slug}"${valor === c.slug ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select>`;
const buscaTexto = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* =========================================================
   STOCK por color y talla
   ========================================================= */
const stkF = { linea: "", cat: "", q: "" };
async function vStock(m) {
  await cargarInv();
  const cambios = new Map(); // "slug|color|talla" → nuevo stock (número o null = sin cargar)
  sucio = () => cambios.size > 0;
  m.innerHTML = `<header class="top"><h1>Stock</h1><div class="top__acts"><button class="btn" type="button" id="sHist">${I.hist}Historial</button></div></header>
    ${desfase()}
    <div class="bar">${filtroLinea("sLinea", stkF.linea)}<span id="sCatW">${filtroCat("sCat", stkF.linea, stkF.cat)}</span><label class="search">${I.buscar}<input class="inp" id="sQ" type="search" placeholder="Buscar prenda o color" value="${esc(stkF.q)}"></label></div>
    <div id="sLista"></div>
    <div class="savebar" id="saveBar"><b id="sN"></b><div style="display:flex;gap:10px"><button class="btn btn--ghost" type="button" id="sDesc">Descartar</button><button class="btn btn--pri" type="button" id="sGuardar">${I.check}Guardar cambios</button></div></div>`;
  const orig = k => { const [s, c, t] = k.split("|"); const v = INV[s] && INV[s].vars[c + "|" + t]; return v ? v.stock : null; };
  const valor = k => (cambios.has(k) ? cambios.get(k) : orig(k));
  const total = p => p.colors.reduce((n, [c]) => n + p.sizes.reduce((x, t) => x + (valor(`${p.slug}|${c}|${t}`) || 0), 0), 0);
  const pintar = () => {
    const q = buscaTexto(stkF.q);
    const lista = PRODUCTS.filter(p => INV[p.slug] && (!stkF.linea || p.linea === stkF.linea) && (!stkF.cat || p.cat === stkF.cat) &&
      (!q || buscaTexto(p.name + " " + p.colors.map(c => c[0]).join(" ")).includes(q)));
    $("#sLista").innerHTML = lista.length ? lista.map(p => `<section class="stk" data-slug="${p.slug}">
        <div class="stk__head"><img src="${imgDe(p.slug)}" alt="" loading="lazy"><div class="stk__name"><h3>${esc(p.name)}</h3><p>${esc(lineName(p.linea))} · ${esc(catName(p.cat))}</p></div>
          <div class="stk__tot"><b data-tot>${total(p)}</b><span>unidades</span></div><button class="btn btn--sm" type="button" data-hist="${p.slug}">${I.hist}Historial</button></div>
        <div class="stk__grid" style="--n:${p.sizes.length}">
          <div class="stk__h">Color</div>${p.sizes.map(t => `<div class="stk__h">${esc(t)}</div>`).join("")}
          ${p.colors.map(([c, hex]) => `<div class="stk__c"><i style="background:${hex}"></i>${esc(c)}</div>${p.sizes.map(t => {
            const k = `${p.slug}|${c}|${t}`, v = valor(k);
            return INV[p.slug].vars[c + "|" + t]
              ? `<input data-k="${esc(k)}" inputmode="numeric" autocomplete="off" value="${v ?? ""}" placeholder="—" class="${cambios.has(k) ? "chg" : v === 0 ? "cero" : ""}" aria-label="${esc(p.name)}, ${esc(c)}, talla ${esc(t)}">`
              : `<input disabled placeholder="—" aria-label="Talla aún no disponible">`;
          }).join("")}`).join("")}
        </div></section>`).join("")
      : `<div class="empty"><b>Sin resultados</b>Prueba con otro filtro.</div>`;
  };
  const barra = () => { $("#saveBar").classList.toggle("show", cambios.size > 0); $("#sN").textContent = `${plural(cambios.size, "cambio", "cambios")} sin guardar`; };
  pintar(); barra();

  $("#sLinea").addEventListener("change", e => { stkF.linea = e.target.value; stkF.cat = ""; $("#sCatW").innerHTML = filtroCat("sCat", stkF.linea, ""); pintar(); });
  $("#sCatW").addEventListener("change", e => { stkF.cat = e.target.value; pintar(); });
  let t; $("#sQ").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { stkF.q = e.target.value.trim(); pintar(); }, 200); });
  $("#sLista").addEventListener("input", e => {
    const inp = e.target, k = inp.dataset.k; if (!k) return;
    const limpio = inp.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 5);
    if (limpio !== inp.value) inp.value = limpio;
    const nuevo = limpio === "" ? null : +limpio;
    if (nuevo === orig(k)) cambios.delete(k); else cambios.set(k, nuevo);
    inp.classList.toggle("chg", cambios.has(k)); inp.classList.toggle("cero", !cambios.has(k) && nuevo === 0);
    const sec = inp.closest(".stk"); $("[data-tot]", sec).textContent = total(PROD[sec.dataset.slug]);
    barra();
  });
  // Enter pasa a la siguiente casilla
  $("#sLista").addEventListener("keydown", e => {
    if (e.key !== "Enter" || !e.target.dataset.k) return;
    e.preventDefault(); const all = $$("#sLista input:not(:disabled)"), i = all.indexOf(e.target);
    if (all[i + 1]) { all[i + 1].focus(); all[i + 1].select(); }
  });
  $("#sLista").addEventListener("focusin", e => { if (e.target.dataset.k) e.target.select(); });
  $("#sLista").addEventListener("click", e => { const b = e.target.closest("[data-hist]"); if (b) historial(b.dataset.hist); });
  $("#sHist").addEventListener("click", () => historial(""));
  $("#sDesc").addEventListener("click", () => { cambios.clear(); pintar(); barra(); });
  $("#sGuardar").addEventListener("click", async () => {
    const lista = [...cambios].map(([k, stock]) => { const [slug, color, talla] = k.split("|"); return { slug, color, talla, stock }; });
    $("#sGuardar").disabled = true;
    try {
      await api("stock", { method: "POST", body: { cambios: lista } });
      cambios.clear(); await cargarInv(); pintar(); barra();
      toast(`Stock guardado (${plural(lista.length, "talla", "tallas")}). Ya se ve en la tienda.`);
    } catch (x) { toast(msg(x)); }
    $("#sGuardar").disabled = false;
  });
}
const MOTIVO = { ajuste: "Ajuste de stock", venta: "Venta", directo: "Cambio directo" };
async function historial(slug) {
  const r = await api("movimientos" + (slug ? `?slug=${encodeURIComponent(slug)}` : "")).catch(e => (toast(msg(e)), null));
  if (!r) return;
  const filas = r.movimientos.map(x => `<tr><td>${fFecha(x.fecha)}</td>${slug ? "" : `<td>${esc(x.nombre || x.slug)}</td>`}<td>${esc(x.color)}</td><td>${esc(x.talla)}</td>
    <td class="num">${x.antes ?? "—"} → <b>${x.despues ?? "—"}</b></td><td>${MOTIVO[x.motivo] || esc(x.motivo)}${x.pedido ? ` ${esc(x.pedido)}` : ""}</td><td>${esc(x.admin || "—")}</td></tr>`).join("");
  ventana({
    titulo: slug ? `Historial · ${PROD[slug] ? PROD[slug].name : slug}` : "Historial de stock", ancho: true,
    html: filas ? `<div class="wrap-tbl"><table class="tbl"><thead><tr><th>Fecha</th>${slug ? "" : "<th>Prenda</th>"}<th>Color</th><th>Talla</th><th class="num">Stock</th><th>Motivo</th><th>Quién</th></tr></thead><tbody>${filas}</tbody></table></div>`
      : `<p class="empty" style="padding:30px 0">Todavía no hay movimientos</p>`,
  });
}

/* =========================================================
   PRODUCTOS: precio normal, descuento, precio final y estado
   ========================================================= */
const prF = { linea: "", q: "" };
async function vProductos(m) {
  await cargarInv();
  const pend = new Set();
  sucio = () => pend.size > 0;
  m.innerHTML = `<header class="top"><h1>Productos</h1></header>
    ${desfase()}
    <div class="bar">${filtroLinea("prLinea", prF.linea)}<label class="search">${I.buscar}<input class="inp" id="prQ" type="search" placeholder="Buscar prenda" value="${esc(prF.q)}"></label></div>
    <div class="prods" id="prLista"></div>`;
  const datosDe = slug => { const d = INV[slug]; const normal = d.precio_antes ?? d.precio; return { normal, final: d.precio, pct: d.precio_antes ? Math.round((1 - d.precio / d.precio_antes) * 100) : 0, estado: d.estado }; };
  const num = v => (v === "" || v == null ? null : +v);
  const fila = p => {
    const d = datosDe(p.slug);
    return `<div class="prow${d.estado === "oculto" ? " prow--oculto" : ""}" data-slug="${p.slug}">
      <div class="prd"><img src="${imgDe(p.slug)}" alt="" loading="lazy"><div><b>${esc(p.name)}</b><small>${esc(lineName(p.linea))} · ${esc(catName(p.cat))}</small></div></div>
      <div data-l="Precio normal"><label class="money"><span>S/</span><input class="inp" data-f="normal" inputmode="decimal" value="${d.normal ?? ""}" aria-label="Precio normal de ${esc(p.name)}"></label></div>
      <div data-l="Descuento"><label class="pct"><input class="inp" data-f="pct" inputmode="numeric" value="${d.pct}" aria-label="Descuento de ${esc(p.name)}"><span>%</span></label></div>
      <div data-l="Precio final"><label class="money"><span>S/</span><input class="inp" data-f="final" inputmode="decimal" value="${d.final ?? ""}" aria-label="Precio final de ${esc(p.name)}"></label></div>
      <div class="prow__estado" data-l="Estado"><select class="sel" data-f="estado" aria-label="Estado de ${esc(p.name)}">
        ${[["activo", "A la venta"], ["agotado", "Agotado"], ["oculto", "Oculto"]].map(([v, t]) => `<option value="${v}"${d.estado === v ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="prow__acts">${p.base ? `<label class="chk"><input type="checkbox" data-f="todos">Todos los colores</label>` : ""}<button class="btn btn--pri btn--sm" type="button" data-guardar disabled>Guardar</button></div>
    </div>`;
  };
  const pintar = () => {
    const q = buscaTexto(prF.q);
    const lista = PRODUCTS.filter(p => INV[p.slug] && (!prF.linea || p.linea === prF.linea) && (!q || buscaTexto(p.name).includes(q)));
    pend.clear();
    $("#prLista").innerHTML = lista.length
      ? `<div class="prow prow--head"><span>Producto</span><span>Precio normal</span><span>Descuento</span><span>Precio final</span><span>Estado</span><span></span></div>${lista.map(fila).join("")}`
      : `<div class="empty"><b>Sin resultados</b>Prueba con otro filtro.</div>`;
  };
  const leer = row => { const g = f => $(`[data-f="${f}"]`, row); return { normal: num(g("normal").value), pct: num(g("pct").value) || 0, final: num(g("final").value), estado: g("estado").value, todos: !!(g("todos") && g("todos").checked) }; };
  const marcar = row => {
    const v = leer(row), d = datosDe(row.dataset.slug);
    const cambio = v.normal !== d.normal || v.final !== d.final || v.estado !== d.estado;
    row.classList.toggle("chg", cambio); $("[data-guardar]", row).disabled = !cambio;
    if (cambio) pend.add(row.dataset.slug); else pend.delete(row.dataset.slug);
  };
  pintar();
  $("#prLinea").addEventListener("change", e => { prF.linea = e.target.value; pintar(); });
  let t; $("#prQ").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { prF.q = e.target.value.trim(); pintar(); }, 200); });
  // El precio final se calcula con el % (y el % con el precio final), siempre a soles enteros
  $("#prLista").addEventListener("input", e => {
    const inp = e.target, f = inp.dataset.f, row = inp.closest(".prow"); if (!f || !row) return;
    if (f === "normal" || f === "final") { const s = inp.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); if (s !== inp.value) inp.value = s; }
    if (f === "pct") { const s = inp.value.replace(/\D/g, "").slice(0, 2); if (s !== inp.value) inp.value = s; }
    const v = leer(row), g = x => $(`[data-f="${x}"]`, row);
    if ((f === "normal" || f === "pct") && v.normal != null) g("final").value = Math.round(v.normal * (1 - v.pct / 100));
    if (f === "final" && v.normal && v.final != null) g("pct").value = v.final < v.normal ? Math.round((1 - v.final / v.normal) * 100) : 0;
    marcar(row);
  });
  $("#prLista").addEventListener("change", e => { const row = e.target.closest(".prow"); if (row && e.target.dataset.f) marcar(row); });
  $("#prLista").addEventListener("click", async e => {
    const b = e.target.closest("[data-guardar]"); if (!b) return;
    const row = b.closest(".prow"), slug = row.dataset.slug, v = leer(row);
    if (v.final == null || !(v.final > 0)) return toast("Escribe el precio final.");
    if (v.normal != null && v.normal < v.final) return toast("El precio normal no puede ser menor que el precio final.");
    b.disabled = true;
    try {
      const r = await api(`productos/${slug}`, { method: "POST", body: { precio: v.final, precio_antes: v.normal != null && v.normal > v.final ? v.normal : null, estado: v.estado, todos: v.todos } });
      await cargarInv();
      if (v.todos) pintar(); else { pend.delete(slug); row.outerHTML = fila(PROD[slug]); }
      toast(`${PROD[slug].name}: guardado${v.todos ? ` en ${r.cambiados} colores` : ""}. Ya se ve en la tienda.`);
    } catch (x) { toast(msg(x)); b.disabled = false; }
  });
}

/* =========================================================
   CLIENTES
   ========================================================= */
async function vClientes(m) {
  const r = await api("clientes");
  let q = "";
  m.innerHTML = `<header class="top"><h1>Clientes</h1><div class="top__acts"><button class="btn" type="button" id="cBajar"${r.clientes.length ? "" : " disabled"}>${I.bajar}Descargar lista</button></div></header>
    <section class="kpis">
      <div class="kpi"><span>Clientes con cuenta</span><b>${r.clientes.length}</b></div>
      <div class="kpi"><span>Aceptan promociones</span><b>${r.clientes.filter(c => c.promos).length}</b></div>
      <div class="kpi"><span>Compraron alguna vez</span><b>${r.clientes.filter(c => c.pedidos).length}</b></div>
    </section>
    <div class="bar"><label class="search">${I.buscar}<input class="inp" id="cQ" type="search" placeholder="Buscar nombre o correo"></label></div>
    <div class="card wrap-tbl" id="cLista"></div>`;
  const pintar = () => {
    const s = buscaTexto(q), lista = r.clientes.filter(c => !s || buscaTexto((c.nombre || "") + " " + c.email).includes(s));
    $("#cLista").innerHTML = lista.length ? `<table class="tbl"><thead><tr><th>Cliente</th><th class="num">Pedidos</th><th class="num">Total comprado</th><th>Promociones</th><th>Desde</th><th>Última compra</th></tr></thead>
      <tbody>${lista.map(c => `<tr><td><b>${esc(c.nombre || "Sin nombre")}</b><br><span style="color:var(--muted)">${esc(c.email)}</span></td><td class="num">${c.pedidos}</td><td class="num"><b>${money(c.total)}</b></td>
        <td><span class="pill ${c.promos ? "pill--procede" : "pill--cancelado"}">${c.promos ? "Sí" : "No"}</span></td><td>${fDia(c.creado)}</td><td>${c.ultima_compra ? fDia(c.ultima_compra) : "—"}</td></tr>`).join("")}</tbody></table>`
      : `<div class="empty"><b>${q ? "Sin resultados" : "Todavía no hay clientes con cuenta"}</b></div>`;
  };
  pintar();
  $("#cQ").addEventListener("input", e => { q = e.target.value.trim(); pintar(); });
  $("#cBajar").addEventListener("click", () => {
    const filas = [["Nombre", "Correo", "Pedidos confirmados", "Total comprado (S/)", "Acepta promociones", "Cliente desde", "Última compra"],
      ...r.clientes.map(c => [c.nombre || "", c.email, c.pedidos, Number(c.total).toFixed(2), c.promos ? "Sí" : "No", fDia(c.creado), c.ultima_compra ? fDia(c.ultima_compra) : ""])];
    const csv = filas.map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `clientes-maison-${diaLima(new Date())}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}

/* =========================================================
   RECLAMOS (Libro de Reclamaciones)
   ========================================================= */
const rec = { estado: "pendiente" };
const TIPO = { reclamo: "Reclamo", queja: "Queja" };
function hojaHTML(r) {
  const fila = (t, v) => (v == null || v === "" ? "" : `<dt>${t}</dt><dd>${esc(v)}</dd>`);
  return `<div class="hoja">
    <dl>${fila("Hoja N°", r.numero)}${fila("Fecha", fFecha(r.creado))}${fila("Proveedor", `${C.titular} · RUC ${C.ruc}`)}</dl>
    <h3>Consumidor</h3><dl>${fila("Nombre", r.nombre)}${fila("Documento", `${r.documento_tipo} ${r.documento}`)}${fila("Domicilio", r.domicilio)}${fila("Teléfono", r.telefono)}${fila("Correo", r.email)}${r.menor ? fila("Padre, madre o apoderado", r.apoderado) : ""}</dl>
    <h3>Bien contratado</h3><dl>${fila("Tipo", r.bien === "producto" ? "Producto" : "Servicio")}${fila("Monto reclamado", r.monto != null ? money(r.monto) : "")}${fila("Descripción", r.descripcion)}${fila("Código de pedido", r.pedido_codigo)}</dl>
    <h3>${TIPO[r.tipo]}</h3><dl>${fila("Detalle", r.detalle)}${fila("Pedido del consumidor", r.pedido_consumidor)}</dl>
  </div>`;
}
async function vReclamos(m) {
  const r = await api("reclamos");
  m.innerHTML = `<header class="top"><h1>Reclamos</h1></header><div class="bar"><div class="tabs" id="rTabs"></div></div><div id="rLista"></div>`;
  const pintar = () => {
    const n = { pendiente: r.reclamos.filter(x => x.estado === "pendiente").length, respondido: r.reclamos.filter(x => x.estado === "respondido").length, todos: r.reclamos.length };
    $("#rTabs").innerHTML = [["pendiente", "Por responder"], ["respondido", "Respondidos"], ["todos", "Todos"]]
      .map(([k, l]) => `<button type="button" data-e="${k}" class="${rec.estado === k ? "on" : ""}">${l} <b>${n[k]}</b></button>`).join("");
    const lista = r.reclamos.filter(x => rec.estado === "todos" || x.estado === rec.estado);
    $("#rLista").innerHTML = lista.length ? lista.map(x => {
      const v = venceReclamo(x.creado), tarde = x.estado === "pendiente" && diaLima(new Date()) > v.toISOString().slice(0, 10);
      return `<button type="button" class="rec" data-n="${x.numero}"><span class="rec__n">${x.numero}</span>
        <span class="rec__who"><b>${esc(x.nombre)}</b><span>${TIPO[x.tipo]} · ${fDia(x.creado)}</span></span>
        <span class="rec__vence${tarde ? " tarde" : ""}">${x.estado === "pendiente" ? `Responder hasta el ${v.toLocaleDateString("es-PE", { timeZone: "UTC", day: "numeric", month: "short" })}` : `Respondido el ${fDia(x.respondido)}`}</span>
        <span class="pill pill--${x.estado === "pendiente" ? "pendiente" : "respondido"}">${x.estado === "pendiente" ? "Por responder" : "Respondido"}</span></button>`;
    }).join("") : `<div class="empty"><b>${rec.estado === "pendiente" ? "No hay reclamos por responder" : "No hay reclamos aquí"}</b></div>`;
  };
  pintar();
  $("#rTabs").addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (b) { rec.estado = b.dataset.e; pintar(); } });
  $("#rLista").addEventListener("click", async e => {
    const b = e.target.closest("[data-n]"); if (!b) return;
    const x = r.reclamos.find(y => y.numero === b.dataset.n);
    const res = await ventana({
      titulo: `${TIPO[x.tipo]} N° ${x.numero}`, ancho: true,
      html: `${hojaHTML(x)}<div class="hoja" style="margin-top:18px"><h3>Respuesta de MAISON</h3>
        ${x.respondido ? `<p style="color:var(--muted)">Guardada el ${fFecha(x.respondido)} por ${esc(x.respondido_por || "—")}</p>` : ""}
        <textarea class="txt" id="rResp" placeholder="Escribe aquí la respuesta para el cliente">${esc(x.respuesta || "")}</textarea></div>`,
      acciones: [
        { t: `${I.print}Imprimir`, v: "imprimir" },
        { t: `${I.mail}Enviar por correo`, v: "correo" },
        { t: `${I.check}Guardar respuesta`, clase: "btn--pri", v: "guardar", antes: async d => {
          const texto = $("#rResp", d).value.trim();
          if (!texto) { toast(MSG.falta_respuesta); return false; }
          try { await api(`reclamos/${x.numero}`, { method: "POST", body: { respuesta: texto } }); x.respuesta = texto; return true; }
          catch (err) { toast(msg(err)); return false; }
        } },
      ],
      alAbrir: d => { x._d = d; },
    });
    const texto = x._d ? ($("#rResp", x._d) || {}).value || x.respuesta || "" : x.respuesta || "";
    if (res === "guardar") { toast("Respuesta guardada."); vReclamos(m); badges(); }
    if (res === "imprimir") imprimir(x, texto);
    if (res === "correo") {
      const cuerpo = `Hola ${x.nombre.split(" ")[0]},\n\nTe respondemos sobre tu ${TIPO[x.tipo].toLowerCase()} N° ${x.numero}, registrado el ${fDia(x.creado)}.\n\n${texto || "(escribe aquí la respuesta)"}\n\nAtentamente,\nMAISON\n${C.titular} · RUC ${C.ruc}\n${C.email}`;
      location.href = `mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent(`Respuesta a tu ${TIPO[x.tipo].toLowerCase()} N° ${x.numero} · MAISON`)}&body=${encodeURIComponent(cuerpo)}`;
    }
  });
}
function imprimir(x, respuesta) {
  const w = window.open("", "_blank"); if (!w) return toast("Permite las ventanas emergentes para imprimir.");
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Hoja de reclamación ${esc(x.numero)}</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:32px;max-width:820px;margin:auto}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 18px;color:#444}
    h3{font-size:14px;margin:22px 0 8px;padding-bottom:6px;border-bottom:1px solid #ccc}dl{display:grid;grid-template-columns:210px 1fr;gap:6px 16px;font-size:13px;margin:0}dt{color:#555}dd{margin:0;white-space:pre-wrap}</style></head>
    <body><h1>Libro de Reclamaciones · Hoja ${esc(x.numero)}</h1><p>MAISON · ${esc(C.titular)} · RUC ${esc(C.ruc)} · ${esc(C.domicilioLegal)}</p>
    ${hojaHTML(x).replace(/<div class="hoja">|<\/div>/g, "")}<h3>Respuesta del proveedor</h3><dl><dt>Respuesta</dt><dd>${esc(respuesta || "Pendiente")}</dd></dl>
    <script>window.onload=()=>print()<\/script></body></html>`);
  w.document.close();
}

/* =========================================================
   ARRANQUE
   ========================================================= */
const VISTAS = { resumen: vResumen, pedidos: vPedidos, stock: vStock, productos: vProductos, clientes: vClientes, reclamos: vReclamos };
(async () => {
  const act = location.hash.match(/^#activar=([\w-]+)/);
  if (act) return pantallaActivar(act[1]);
  try { YO = await api("yo"); } catch (_) { return pantallaEntrar(); }
  armar();
})();
})();
