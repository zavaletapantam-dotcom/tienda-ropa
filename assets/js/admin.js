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
  mayorista: svg('<rect x="2.5" y="13" width="8.5" height="8" rx="1"/><rect x="13" y="13" width="8.5" height="8" rx="1"/><rect x="7.75" y="3" width="8.5" height="8" rx="1"/>'),
  caja: svg('<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="18" cy="18.5" r="1.8"/>'),
  entrada: svg('<path d="M12 3v11M7.5 9.5 12 14l4.5-4.5"/><path d="M4 14v6h16v-6"/>'),
  salida: svg('<path d="M12 14V3M7.5 7.5 12 3l4.5 4.5"/><path d="M4 14v6h16v-6"/>'),
  mas: svg('<path d="M12 5v14M5 12h14"/>'),
  editar: svg('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'),
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
  sin_stock: "No hay stock virtual suficiente.",
  sin_stock_fisico: "No hay suficiente en tu almacén.",
  falta_origen: "Elige de dónde sale la mercadería.",
  costo_invalido: "Revisa el costo.",
  precio_mayor_invalido: "Revisa el precio mayorista.",
  motivo_invalido: "Elige el motivo de la salida.",
  sin_prendas: "Agrega al menos una prenda con su cantidad.",
  tipo_invalido: "No se pudo registrar el movimiento.",
  prenda_no_existe: "Una de las prendas ya no está en la tienda. Recarga la página.",
  stock_invalido: "Revisa las cantidades.",
  datos_invalidos: "Revisa los datos.",
  descuento_invalido: "El descuento no puede ser mayor que el subtotal.",
  envio_invalido: "Revisa el monto del envío.",
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
/* Ventana propia (nunca alert/confirm). acciones: [{ t, clase, v, antes }] → devuelve el v del botón tocado (o null)
   antes(d): se ejecuta al tocar el botón; si devuelve false la ventana sigue abierta · fijo: no se cierra al tocar afuera */
function ventana({ titulo, html, acciones = [], ancho = false, alAbrir, fijo = false }) {
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
    if (!fijo) $(".dlg__bg", d).addEventListener("click", () => cerrar(null));
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
const SECCIONES = [["resumen", "Resumen"], ["pedidos", "Pedidos"], ["mayorista", "Mayorista"], ["stock", "Stock"], ["productos", "Productos"], ["clientes", "Clientes"], ["reclamos", "Reclamos"]];
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
  const rank = (lista, fn) => lista.length
    ? `<ul class="rank">${lista.map(x => `<li><img src="${imgDe(x.slug, x.color)}" alt="" loading="lazy"><div><b>${esc(x.nombre)}</b>${x.color ? `<span>${esc(x.color)} · Talla ${esc(x.talla)}</span>` : ""}</div><strong>${fn(x)}</strong></li>`).join("")}</ul>`
    : `<p class="empty" style="padding:24px 0">Todavía no hay datos</p>`;
  const pctCarga = r.stock.tallas ? Math.round((r.stock.cargadas / r.stock.tallas) * 100) : 0;
  // Ganancia del mes (sobre el precio de venta): solo cuenta las ventas cuyas prendas tienen costo
  const gan = g => {
    const ganancia = g.ventas_con_costo - g.costo, pct = g.ventas_con_costo ? Math.round((ganancia / g.ventas_con_costo) * 100) : null;
    return { valor: money(ganancia), sub: !g.n ? "Sin ventas este mes" : `Margen ${pct == null ? "—" : pct + "%"} · ${plural(g.n, "venta", "ventas")}${g.sin_costo ? ` · ${g.sin_costo} sin costo` : ""}`, tono: ganancia < 0 ? "bad" : "" };
  };
  const gMin = gan(r.ganancia.minorista), gMay = gan(r.ganancia.mayorista);
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
    <section class="kpis">
      ${kpi("Ganancia minorista del mes", gMin.valor, gMin.sub, "#pedidos", gMin.tono)}
      ${kpi("Ganancia mayorista del mes", gMay.valor, gMay.sub, "#mayorista", gMay.tono)}
      ${kpi("Inventario en tu almacén", money(r.fisico.valor), `${plural(r.fisico.unidades, "unidad", "unidades")} a precio de costo${r.fisico.sin_costo ? ` · ${r.fisico.sin_costo} sin costo` : ""}`, "#stock")}
    </section>
    <section class="card ventas" id="vCard">
      <div class="ventas__cal"><div class="cal" id="vCal"></div><div class="atajos" id="vAtajos"></div></div>
      <div class="ventas__dat"><div class="ventas__head" id="vHead"></div><div class="chart" id="vChart"></div></div>
    </section>
    <div class="grid3" style="margin-bottom:18px">
      <section class="card"><h2>Lo más vendido en 30 días</h2>${rank(r.vendidos, x => plural(x.n, "unidad", "unidades"))}</section>
      <section class="card"><h2>Lo más consultado en 30 días</h2>${rank(r.consultados, x => plural(x.n, "unidad", "unidades"))}</section>
      <section class="card"><h2>Stock virtual bajo</h2>${rank(r.bajo, x => `<span class="pill ${x.stock ? "pill--pendiente" : "pill--bad"}">${x.stock ? `Quedan ${x.stock}` : "Agotado"}</span>`)}</section>
    </div>
    <section class="card"><h2>Stock virtual cargado</h2><div class="meter"><i style="width:${pctCarga}%"></i></div>
      <div class="cargado"><p><b>${r.stock.cargadas}</b> de ${r.stock.tallas} tallas · <b>${r.stock.unidades}</b> unidades en la tienda</p><a class="btn btn--pri" href="#stock">${I.stock}Cargar stock</a></div>
    </section>`;
  ventasRango();
}

/* ---------- Ventas por rango de fechas: calendario + gráfica ----------
   Un clic marca el inicio y otro clic el fin (o se arrastra de un día a otro). Fechas en hora de Perú, como "AAAA-MM-DD". */
const fD = s => new Date(s + "T12:00:00Z");
const sumarDias = (s, n) => { const d = fD(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const entreDias = (a, b) => Math.round((fD(b) - fD(a)) / 86400e3);
const fCorta = (s, o = {}) => fD(s).toLocaleDateString("es-PE", { timeZone: "UTC", day: "numeric", month: "short", ...o }).replace(".", "");
const finMes = ym => sumarDias(sumarDias(ym + "-01", 32).slice(0, 7) + "-01", -1);
const VR = { desde: null, hasta: null, mes: null, atajo: "14" }; // se recuerda al cambiar de sección
const conVenta = new Map(); // "AAAA-MM" → Set de días con ventas (puntitos del calendario)
function atajosVentas(hoy) {
  const mes = hoy.slice(0, 7), pasado = sumarDias(mes + "-01", -1).slice(0, 7);
  return [["7", "7 días", sumarDias(hoy, -6), hoy], ["14", "14 días", sumarDias(hoy, -13), hoy], ["30", "30 días", sumarDias(hoy, -29), hoy],
    ["mes", "Este mes", mes + "-01", hoy], ["pasado", "Mes pasado", pasado + "-01", finMes(pasado)]];
}
function ventasRango() {
  const cal = $("#vCal"); if (!cal) return;
  const hoy = diaLima(new Date()), ATAJOS = atajosVentas(hoy);
  if (!VR.desde) { const a = ATAJOS.find(x => x[0] === VR.atajo) || ATAJOS[1]; VR.desde = a[2]; VR.hasta = a[3]; }
  if (!VR.mes) VR.mes = VR.hasta.slice(0, 7);
  let ancla = null, sobre = null, arrastrando = false, pide = 0;

  const pintarAtajos = () => {
    $("#vAtajos").innerHTML = ATAJOS.map(([k, t, a, b]) => `<button type="button" data-a="${k}" class="${VR.desde === a && VR.hasta === b ? "on" : ""}">${t}</button>`).join("");
  };
  // Calendario del mes visible
  const pintarMes = () => {
    const ym = VR.mes, ini = ym + "-01", fin = finMes(ym), hueco = (fD(ini).getUTCDay() + 6) % 7, marcas = conVenta.get(ym);
    const titulo = fD(ini).toLocaleDateString("es-PE", { timeZone: "UTC", month: "long", year: "numeric" });
    let dias = "";
    for (let s = ini; s <= fin; s = sumarDias(s, 1))
      dias += `<button type="button" class="cal__d${s === hoy ? " hoy" : ""}${marcas && marcas.has(s) ? " con" : ""}" data-d="${s}"${s > hoy ? " disabled" : ""} aria-label="${fCorta(s, { year: "numeric" })}"><span>${+s.slice(8)}</span></button>`;
    cal.innerHTML = `<div class="cal__head"><button type="button" class="cal__nav" data-m="-1" aria-label="Mes anterior">${svg('<path d="m15 6-6 6 6 6"/>')}</button>
      <b>${titulo}</b><button type="button" class="cal__nav" data-m="1" aria-label="Mes siguiente"${ym >= hoy.slice(0, 7) ? " disabled" : ""}>${svg('<path d="m9 6 6 6-6 6"/>')}</button></div>
      <div class="cal__grid">${["L", "M", "M", "J", "V", "S", "D"].map(d => `<span class="cal__dow">${d}</span>`).join("")}${'<i></i>'.repeat(hueco)}${dias}</div>
      <p class="cal__ayuda" id="vAyuda"></p>`;
    pintarRango();
    if (!marcas) puntitos(ym);
  };
  // Marca el rango elegido (o el que se está eligiendo) sin redibujar el mes
  const pintarRango = () => {
    const [a, b] = ancla ? [ancla, sobre || ancla].sort() : [VR.desde, VR.hasta];
    $$(".cal__d", cal).forEach(el => {
      const d = el.dataset.d;
      el.classList.toggle("ini", d === a); el.classList.toggle("fin", d === b); el.classList.toggle("en", d > a && d < b);
    });
    const ay = $("#vAyuda");
    if (ay) ay.textContent = ancla ? "Ahora elige el día final (o vuelve a tocar el mismo día para ver solo ese)." : "Toca un día de inicio y luego el día final, o arrastra de uno a otro.";
    cal.classList.toggle("eligiendo", !!ancla);
  };
  const puntitos = async ym => {
    try {
      const r = await api(`ventas?desde=${ym}-01&hasta=${finMes(ym) > hoy ? hoy : finMes(ym)}`);
      conVenta.set(ym, new Set([...r.tienda, ...r.mayor].filter(x => x.monto > 0 || x.n > 0).map(x => x.dia)));
      if (VR.mes === ym && $("#vCal") === cal) $$(".cal__d", cal).forEach(el => el.classList.toggle("con", conVenta.get(ym).has(el.dataset.d)));
    } catch (_) {}
  };
  const fijar = (a, b) => {
    [VR.desde, VR.hasta] = [a, b].sort(); ancla = sobre = null; arrastrando = false;
    VR.atajo = (ATAJOS.find(x => x[2] === VR.desde && x[3] === VR.hasta) || [""])[0];
    pintarRango(); pintarAtajos(); cargar();
  };

  // Gráfica y totales del rango
  const cargar = async () => {
    const n = ++pide, ch = $("#vChart");
    ch.classList.add("cargando");
    let r;
    try { r = await api(`ventas?desde=${VR.desde}&hasta=${VR.hasta}`); }
    catch (e) { if (n === pide) { ch.classList.remove("cargando"); toast(msg(e)); } return; }
    if (n !== pide || $("#vChart") !== ch) return;
    ch.classList.remove("cargando");
    const T = Object.fromEntries(r.tienda.map(x => [x.dia, x])), M = Object.fromEntries(r.mayor.map(x => [x.dia, x]));
    // Agrupa por día (hasta 2 meses), por semana (hasta 6 meses) o por mes
    const total = entreDias(VR.desde, VR.hasta) + 1, modo = total <= 62 ? "dia" : total <= 186 ? "semana" : "mes";
    const grupos = [];
    for (let s = VR.desde, i = 0; s <= VR.hasta; s = sumarDias(s, 1), i++) {
      const k = modo === "dia" ? s : modo === "semana" ? Math.floor(i / 7) : s.slice(0, 7);
      let g = grupos[grupos.length - 1];
      if (!g || g.k !== k) grupos.push(g = { k, desde: s, hasta: s, t: 0, tn: 0, m: 0, mn: 0 });
      g.hasta = s;
      if (T[s]) { g.t += T[s].monto; g.tn += T[s].n; }
      if (M[s]) { g.m += M[s].monto; g.mn += M[s].n; }
    }
    const sum = (f) => grupos.reduce((a, g) => a + g[f], 0), st = sum("t"), stn = sum("tn"), sm = sum("m"), smn = sum("mn");
    const rango = VR.desde === VR.hasta ? fCorta(VR.desde, { weekday: "long", year: "numeric" })
      : `${fCorta(VR.desde, VR.desde.slice(0, 4) !== VR.hasta.slice(0, 4) ? { year: "numeric" } : {})} – ${fCorta(VR.hasta, { year: "numeric" })}`;
    $("#vHead").innerHTML = `<div><span class="ventas__rango">${rango} · ${plural(total, "día", "días")}</span><b class="ventas__total">${money(st + sm)}</b></div>
      <div class="leyenda"><span><i></i>Tienda <b>${money(st)}</b> · ${plural(stn, "pedido", "pedidos")}</span><span><i class="may"></i>Mayorista <b>${money(sm)}</b> · ${plural(smn, "venta", "ventas")}</span></div>`;
    // Etiquetas: el número del día si son pocos días; si no, "3 nov" cada tantas columnas según el ancho disponible
    const corta = modo === "dia" && grupos.length <= 16, max = Math.max(1, ...grupos.map(g => g.t + g.m));
    const cada = Math.ceil(grupos.length / Math.max(3, Math.floor((ch.clientWidth || 700) / (corta ? 30 : 58))));
    const etiqueta = g => modo === "mes" ? fD(g.desde).toLocaleDateString("es-PE", { timeZone: "UTC", month: "short" }).replace(".", "")
      : corta ? String(+g.desde.slice(8)) : fCorta(g.desde);
    const titulo = g => `${g.desde === g.hasta ? fCorta(g.desde, { weekday: "short", year: "numeric" }) : `${fCorta(g.desde)} – ${fCorta(g.hasta, { year: "numeric" })}`}: ${money(g.t + g.m)}`
      + ` · Tienda ${money(g.t)} (${plural(g.tn, "pedido", "pedidos")})${g.mn ? ` · Mayorista ${money(g.m)} (${plural(g.mn, "venta", "ventas")})` : ""}`;
    ch.className = "chart" + (grupos.length > 16 ? " chart--denso" : "") + (grupos.length > 40 ? " chart--muy" : "");
    ch.style.gridTemplateColumns = `repeat(${grupos.length}, minmax(0, 1fr))`;
    ch.innerHTML = grupos.map((g, i) => { const v = g.t + g.m;
      return `<div class="chart__col${v ? "" : " cero"}" title="${esc(titulo(g))}"><em>${v ? "S/" + Math.round(v) : ""}</em>`
        + `<i style="height:${Math.max(2, (v / max) * 100)}%">${g.m ? `<u style="height:${(g.m / v) * 100}%"></u>` : ""}</i>`
        + `<span${i % cada ? ' class="oculto"' : ""}>${etiqueta(g)}</span></div>`; }).join("");
  };

  // Clic en un día: el primero marca el inicio, el segundo el fin. Arrastrar también sirve.
  cal.addEventListener("pointerdown", e => {
    const b = e.target.closest(".cal__d"); if (!b || b.disabled || e.button > 0) return;
    e.preventDefault();
    if (ancla) return fijar(ancla, b.dataset.d);
    ancla = sobre = b.dataset.d; arrastrando = true; pintarRango();
  });
  cal.addEventListener("pointerover", e => {
    const b = e.target.closest(".cal__d");
    if (ancla && b && !b.disabled && b.dataset.d !== sobre) { sobre = b.dataset.d; pintarRango(); }
  });
  const soltar = () => { if (arrastrando) { arrastrando = false; if (ancla && sobre && sobre !== ancla) fijar(ancla, sobre); } };
  const tecla = e => { if (e.key === "Escape" && ancla && $("#vCal") === cal) { ancla = sobre = null; arrastrando = false; pintarRango(); } };
  addEventListener("pointerup", soltar); addEventListener("keydown", tecla);
  // Al salir del resumen se quitan los escuchas globales
  const limpiar = () => { if ($("#vCal") !== cal) { removeEventListener("pointerup", soltar); removeEventListener("keydown", tecla); removeEventListener("hashchange", limpiar); } };
  addEventListener("hashchange", limpiar);
  // Teclado: Enter/Espacio sobre un día hace lo mismo que el clic
  cal.addEventListener("click", e => {
    const nav = e.target.closest("[data-m]");
    if (nav) { VR.mes = sumarDias(VR.mes + "-01", nav.dataset.m > 0 ? 32 : -1).slice(0, 7); pintarMes(); return; }
    const b = e.target.closest(".cal__d");
    if (b && e.detail === 0) { if (ancla) fijar(ancla, b.dataset.d); else { ancla = sobre = b.dataset.d; pintarRango(); } }
  });
  $("#vAtajos").addEventListener("click", e => {
    const b = e.target.closest("[data-a]"), a = b && ATAJOS.find(x => x[0] === b.dataset.a); if (!a) return;
    VR.mes = a[3].slice(0, 7); ancla = sobre = null; pintarMes(); fijar(a[2], a[3]);
  });
  pintarMes(); pintarAtajos(); cargar();
}

/* =========================================================
   PEDIDOS
   ========================================================= */
const ORIGEN = { carrito: "Carrito", producto: "Producto", pack: "Pack Deluxe" };
const ESTADO = { pendiente: "Pendiente", procede: "Confirmado", cancelado: "Cancelado" };
const DESDE = { almacen: "desde tu almacén", proveedor: "desde el proveedor" };
const ENTREGA = { domicilio: "Envío a domicilio", recojo: "Recojo en tienda", provincia: "Envío a provincia" };
const ped = { estado: "pendiente", q: "" };
function entregaTexto(e) {
  if (e.tipo === "domicilio") return `<b>Envío a domicilio</b><br>${esc(e.direccion || "")}${e.distrito ? `, ${esc(e.distrito)}` : ""}${e.referencia ? `<br>Referencia: ${esc(e.referencia)}` : ""}`;
  if (e.tipo === "recojo") return "<b>Recojo en tienda</b>";
  if (e.tipo === "provincia") return `<b>Envío a provincia por ${esc(C.courier)}</b><br>${esc(e.destino || "")}${e.agencia ? `<br>Agencia: ${esc(e.agencia)}` : ""}`;
  return "A coordinar por WhatsApp";
}
const waCel = cel => { const d = String(cel || "").replace(/\D/g, ""); return d.length === 9 ? "51" + d : d; };
/* Stock virtual de una prenda del pedido; si está por confirmar, cómo quedaría */
function stockCelda(v, cant, estado) {
  if (v == null) return `<span class="chip">Sin cargar</span>`;
  if (estado !== "pendiente") return v;
  if (v < cant) return `<span class="pill pill--bad">Solo hay ${v}</span>`;
  return `${v} → <b>${v - cant}</b>`;
}
/* Ganancia de un pedido confirmado: prendas (menos descuento, sin envío) frente a su costo del día */
function ganPedido(p) {
  if (p.estado !== "procede" || !p.items.length || p.items.some(i => i.costo == null)) return null;
  const venta = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0) - (p.descuento || 0), costo = p.items.reduce((s, i) => s + i.costo * i.cantidad, 0);
  return { venta, costo, g: venta - costo };
}
const pctDe = (g, venta) => (venta ? Math.round((g / venta) * 100) : 0);
function pedidoHTML(p) {
  const c = p.cliente, g = ganPedido(p);
  return `<article class="ped ped--${p.estado}" data-cod="${p.codigo}">
    <header class="ped__head">
      <div><span class="ped__cod">${p.codigo}</span><span class="ped__fecha">${fFecha(p.fecha)}${p.editado ? ` · Editado por ${esc(p.editado_por || "—")} el ${fFecha(p.editado)}` : ""}</span></div>
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
        <thead><tr><th>Prenda</th><th>Color</th><th>Talla</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Virtual</th><th class="num">Físico</th></tr></thead>
        <tbody>${p.items.map(i => `<tr><td><div class="prd"><img src="${imgDe(i.slug, i.color)}" alt="" loading="lazy"><b>${esc(i.nombre)}</b></div></td><td data-l="Color">${esc(i.color)}</td><td data-l="Talla">${esc(i.talla)}</td><td class="num" data-l="Cantidad">${i.cantidad}</td><td class="num" data-l="Precio">${money(i.precio)}</td><td class="num" data-l="Virtual">${stockCelda(i.stock, i.cantidad, p.estado)}</td><td class="num" data-l="Físico">${i.fisico == null ? `<span class="chip">Sin cargar</span>` : i.fisico}</td></tr>`).join("")}</tbody>
      </table></div>
    </div>
    <footer class="ped__foot">
      <div class="tot"><span>Subtotal <b>${money(p.subtotal)}</b></span>${p.descuento ? `<span>Descuento <b>−${money(p.descuento)}</b></span>` : ""}<span>Envío <b>${p.envio == null ? (p.entrega.tipo === "provincia" ? "Tarifa Shalom" : "A coordinar") : p.envio ? money(p.envio) : "Gratis"}</b></span><span class="grande">Total <b>${money(p.total)}</b></span>${g ? `<span>Ganancia <b class="${g.g < 0 ? "neg" : "pos"}">${money(g.g)} · ${pctDe(g.g, g.venta)}%</b></span>` : ""}</div>
      ${p.estado === "pendiente"
        ? `<div class="ped__acts"><button class="btn" type="button" data-accion="cancelado">${I.x}Cancelar</button><button class="btn" type="button" data-accion="editar">${I.editar}Editar</button><button class="btn btn--pri" type="button" data-accion="procede">${I.check}Procede</button></div>`
        : `<p class="ped__done">${ESTADO[p.estado]}${p.origen_stock ? " " + DESDE[p.origen_stock] : ""} por ${esc(p.procesado_por || "—")} · ${fFecha(p.procesado)}</p>`}
    </footer>
  </article>`;
}
const listaFaltan = faltan => ((faltan || []).length ? `<ul>${faltan.map(f => `<li><span>${esc(f.nombre)} · ${esc(f.color)} · Talla ${esc(f.talla)}</span><b>Se necesitan ${f.pedido} · hay ${f.stock}</b></li>`).join("")}</ul>` : "");
async function vPedidos(m) {
  m.innerHTML = `<header class="top"><h1>Pedidos</h1><div class="top__acts"><button class="btn" type="button" id="pExcel">${I.bajar}Descargar Excel</button><button class="btn" type="button" id="pRef">${I.ref}Actualizar</button></div></header>
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
    $("#pExcel").disabled = !lista.length;
  };
  await cargar();
  $("#pRef").addEventListener("click", () => cargar().then(badges).catch(e => toast(msg(e))));
  $("#pExcel").addEventListener("click", () => excelPedidos(lista));
  $("#pTabs").addEventListener("click", e => { const b = e.target.closest("[data-e]"); if (b) { ped.estado = b.dataset.e; cargar().catch(x => toast(msg(x))); } });
  $("#pQ").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { ped.q = e.target.value.trim(); cargar().catch(x => toast(msg(x))); }, 300); });
  $("#pLista").addEventListener("click", async e => {
    const b = e.target.closest("[data-accion]"); if (!b) return;
    const p = lista.find(x => x.codigo === b.closest(".ped").dataset.cod); if (!p) return;
    if (b.dataset.accion === "editar") { if (await editarPedido(p)) { await cargar().catch(() => {}); badges(); } return; }
    let origen = null;
    if (b.dataset.accion === "procede") {
      // ¿De dónde sale? Almacén: baja el virtual y el físico · Proveedor: solo el virtual
      const linea = i => `<li><span>${esc(i.nombre)} · ${esc(i.color)} · Talla ${esc(i.talla)} × ${i.cantidad}</span><b>Virtual ${i.stock == null ? "sin cargar" : i.stock < i.cantidad ? `solo hay ${i.stock}` : `${i.stock} → ${i.stock - i.cantidad}`} · Físico ${i.fisico == null ? "sin cargar" : i.fisico}</b></li>`;
      origen = await ventana({
        titulo: `¿De dónde sale el pedido ${p.codigo}?`, ancho: true,
        html: `<ul>${p.items.map(linea).join("")}</ul><p><b>Sale de mi almacén:</b> baja el stock virtual y el físico.<br><b>Lo envía el proveedor:</b> solo baja el stock virtual.</p>`,
        acciones: [{ t: "Volver", v: null }, { t: `${I.caja}Lo envía el proveedor`, clase: "btn--dark", v: "proveedor" }, { t: `${I.stock}Sale de mi almacén`, clase: "btn--pri", v: "almacen" }],
      });
      if (!origen) return;
    } else if (!(await confirmar(`¿Cancelar el pedido ${p.codigo}?`, "<p>El stock no cambia.</p>", "Sí, cancelar", "btn--bad"))) return;
    try {
      await api(`pedidos/${p.codigo}`, { method: "POST", body: { accion: b.dataset.accion, origen } });
      toast(b.dataset.accion === "procede" ? `Pedido ${p.codigo} confirmado ${DESDE[origen]}. El stock ya se actualizó.` : `Pedido ${p.codigo} cancelado.`);
    } catch (x) {
      if (x.codigo === "sin_stock") await avisar("No hay stock virtual suficiente", `<p>El pedido sigue por confirmar y no se descontó nada.</p>${listaFaltan(x.data.faltan)}`);
      else if (x.codigo === "sin_stock_fisico") await avisar("No hay stock físico suficiente", `<p>El pedido sigue por confirmar y no se descontó nada. Registra una entrada en Stock › Físico o elige «Lo envía el proveedor».</p>${listaFaltan(x.data.faltan)}`);
      else toast(msg(x));
    }
    await cargar().catch(() => {}); badges();
  });
}
/* ---------- Editar un pedido por confirmar: prendas, talla, color, cantidad, precio, descuento y envío ---------- */
async function editarPedido(p) {
  try { await cargarInv(); } catch (x) { toast(msg(x)); return false; }
  const lineas = p.items.map(i => ({ slug: i.slug, nombre: i.nombre, color: i.color, talla: i.talla, cantidad: i.cantidad, precio: i.precio }));
  const tipo = p.entrega.tipo, num = v => (v === "" || v == null ? null : +v);
  // Mismas reglas que el carrito: domicilio S/10 (gratis desde S/200), recojo gratis, provincia o sin datos: a coordinar
  const envioAuto = sub => (tipo === "domicilio" ? (sub >= C.envioGratisDesde ? 0 : C.envio) : tipo === "recojo" ? 0 : null);
  const sinEnvio = tipo === "provincia" ? `Tarifa ${C.courier}` : "A coordinar";
  let manual = (p.envio ?? null) !== envioAuto(p.subtotal); // si alguien ya lo escribió a mano, se respeta
  const subtotal = () => r2(lineas.reduce((s, l) => s + (l.precio || 0) * l.cantidad, 0));
  const nombreDe = l => (PROD[l.slug] ? PROD[l.slug].name : l.nombre);
  const coloresDe = slug => (PROD[slug] ? PROD[slug].colors.map(c => c[0]).filter(c => PROD[slug].sizes.some(t => varDe(slug, c, t))) : []);
  const tallasDe = (slug, color) => (PROD[slug] ? PROD[slug].sizes.filter(t => varDe(slug, color, t)) : []);
  const opts = (lista, valor) => (lista.length ? lista : [valor]).map(x => `<option value="${esc(x)}"${x === valor ? " selected" : ""}>${esc(x)}</option>`).join("");
  const stockTxt = l => {
    const v = varDe(l.slug, l.color, l.talla);
    if (!v) return `<span class="neg">Esta talla ya no está en la tienda</span>`;
    const falta = v.stock != null && l.cantidad > v.stock;
    return `${falta ? `<span class="neg">No alcanza el stock virtual · </span>` : ""}Virtual ${v.stock ?? "sin cargar"} · Físico ${v.fisico ?? "sin cargar"}`;
  };
  const filaHTML = (l, i) => `<div class="edl" data-i="${i}">
      <div class="edl__prd prd"><img src="${imgDe(l.slug, l.color)}" alt="" loading="lazy"><b>${esc(nombreDe(l))}</b></div>
      <div class="edl__color" data-l="Color"><select class="sel" data-f="color" aria-label="Color de ${esc(nombreDe(l))}">${opts(coloresDe(l.slug), l.color)}</select></div>
      <div class="edl__talla" data-l="Talla"><select class="sel" data-f="talla" aria-label="Talla de ${esc(nombreDe(l))}">${opts(tallasDe(l.slug, l.color), l.talla)}</select></div>
      <div class="edl__cant" data-l="Cantidad"><input class="inp" data-f="cantidad" inputmode="numeric" autocomplete="off" value="${l.cantidad}" aria-label="Cantidad de ${esc(nombreDe(l))}"></div>
      <div class="edl__precio" data-l="Precio"><label class="money"><span>S/</span><input class="inp" data-f="precio" inputmode="decimal" autocomplete="off" value="${l.precio ?? ""}" placeholder="0.00" aria-label="Precio de ${esc(nombreDe(l))}"></label></div>
      <div class="edl__imp" data-imp>${money((l.precio || 0) * l.cantidad)}</div>
      <button class="edl__x lin__x" type="button" data-quitar aria-label="Quitar ${esc(nombreDe(l))}">${I.x}</button>
      <p class="edl__stk" data-stk>${stockTxt(l)}</p>
    </div>`;
  const html = `<div class="frm">
    <p class="frm__lead">El stock no cambia ahora: se descuenta recién cuando confirmas el pedido.</p>
    <div class="edl edl--head"><span class="edl__prd">Prenda</span><span class="edl__color">Color</span><span class="edl__talla">Talla</span><span class="edl__cant">Cant.</span><span class="edl__precio">Precio</span><span class="edl__imp">Importe</span></div>
    <div id="edLineas"></div>
    <div class="add add--2">${selPrendas("edP")}<button class="btn" type="button" id="edAdd">${I.mas}Agregar prenda</button></div>
    <div class="ed-tot">
      <div class="ed-tot__f"><span>Subtotal</span><b id="edSub"></b></div>
      <div class="ed-tot__f"><label for="edDesc">Descuento</label><label class="money"><span>S/</span><input class="inp" id="edDesc" inputmode="decimal" autocomplete="off" value="${p.descuento || ""}" placeholder="0.00"></label></div>
      <div class="ed-tot__f"><label for="edEnv">Envío</label><label class="money"><span>S/</span><input class="inp" id="edEnv" inputmode="decimal" autocomplete="off" value="${p.envio ?? ""}" placeholder="${esc(sinEnvio)}"></label></div>
      <p class="ed-tot__nota" id="edEnvNota"></p>
      <div class="ed-tot__f ed-tot__f--total"><span>Total</span><b id="edTot"></b></div>
    </div>
    <div class="alert alert--bad" id="edErr" hidden></div></div>`;
  const decimal = inp => { const s = inp.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); if (s !== inp.value) inp.value = s; return s; };
  const totales = d => {
    const sub = subtotal();
    if (!manual) { const e = envioAuto(sub); $("#edEnv", d).value = e == null ? "" : e; }
    const env = num($("#edEnv", d).value) || 0;
    $("#edSub", d).textContent = money(sub);
    $("#edEnvNota", d).innerHTML = manual
      ? `Envío escrito a mano. <button type="button" class="lnk-btn" id="edEnvAuto">Calcularlo solo</button>`
      : tipo === "domicilio" ? `Se calcula solo: S/${C.envio}, gratis desde S/${C.envioGratisDesde}. Puedes escribir otro monto.`
      : tipo === "recojo" ? "Recojo en tienda: sin costo de envío." : `${esc(sinEnvio)}: escríbelo aquí si ya lo sabes.`;
    $("#edTot", d).textContent = money(sub - (num($("#edDesc", d).value) || 0) + env);
  };
  const pintar = d => { $("#edLineas", d).innerHTML = lineas.length ? lineas.map(filaHTML).join("") : `<p class="vacio">El pedido no tiene prendas. Agrega al menos una.</p>`; totales(d); };
  const r = await ventana({
    titulo: `Editar pedido ${p.codigo}`, ancho: true, fijo: true, html,
    acciones: [{ t: "Volver", v: false }, { t: `${I.check}Guardar cambios`, clase: "btn--pri", v: true, antes: async d => {
      const err = $("#edErr", d), mal = h => { err.innerHTML = h; err.hidden = false; err.scrollIntoView({ block: "nearest", behavior: "smooth" }); return false; };
      if (!lineas.length) return mal("El pedido tiene que tener al menos una prenda. Si el cliente ya no quiere nada, mejor cancela el pedido.");
      const malCant = lineas.find(l => !(l.cantidad >= 1 && l.cantidad <= 20));
      if (malCant) return mal(`Revisa la cantidad de ${esc(nombreDe(malCant))}: de 1 a 20.`);
      const sinPrecio = lineas.find(l => l.precio == null);
      if (sinPrecio) return mal(`Pon el precio de ${esc(nombreDe(sinPrecio))}.`);
      // La misma prenda, color, talla y precio en dos líneas se junta en una
      const items = [];
      for (const l of lineas) {
        const y = items.find(x => x.slug === l.slug && x.color === l.color && x.talla === l.talla && x.precio === l.precio);
        if (y) y.cantidad += l.cantidad; else items.push({ slug: l.slug, color: l.color, talla: l.talla, cantidad: l.cantidad, precio: l.precio });
      }
      if (items.some(i => i.cantidad > 20)) return mal("Máximo 20 unidades de la misma prenda, color y talla.");
      const desc = num($("#edDesc", d).value) || 0;
      if (desc > subtotal()) return mal(MSG.descuento_invalido);
      const env = $("#edEnv", d).value;
      try {
        const res = await api(`pedidos/${p.codigo}/editar`, { method: "POST", body: { items, descuento: desc, envio: env === "" ? null : +env, envio_manual: manual } });
        toast(`Pedido ${p.codigo} actualizado. Nuevo total: ${money(res.pedido.total)}.`);
        return true;
      } catch (x) {
        if (x.codigo === "ya_procesado") return mal("Este pedido ya fue confirmado o cancelado, así que ya no se puede editar.");
        return mal(esc(msg(x)));
      }
    } }],
    alAbrir: d => {
      pintar(d);
      const L = $("#edLineas", d), linea = el => { const f = el.closest(".edl"); return f ? [f, lineas[+f.dataset.i]] : [null, null]; };
      L.addEventListener("change", e => {
        const [f, l] = linea(e.target); if (!l) return;
        if (e.target.dataset.f === "color") {
          l.color = e.target.value; const ts = tallasDe(l.slug, l.color); if (!ts.includes(l.talla)) l.talla = ts[0];
          f.outerHTML = filaHTML(l, +f.dataset.i);
        }
        if (e.target.dataset.f === "talla") { l.talla = e.target.value; $("[data-stk]", f).innerHTML = stockTxt(l); }
      });
      L.addEventListener("input", e => {
        const [f, l] = linea(e.target); if (!l) return;
        if (e.target.dataset.f === "cantidad") { const s = e.target.value.replace(/\D/g, "").slice(0, 2); if (s !== e.target.value) e.target.value = s; l.cantidad = +s || 0; $("[data-stk]", f).innerHTML = stockTxt(l); }
        if (e.target.dataset.f === "precio") { const s = decimal(e.target); l.precio = s === "" ? null : +s; }
        $("[data-imp]", f).textContent = money((l.precio || 0) * l.cantidad); totales(d);
      });
      L.addEventListener("click", e => { const b = e.target.closest("[data-quitar]"); if (!b) return; lineas.splice(+b.closest(".edl").dataset.i, 1); pintar(d); });
      $("#edAdd", d).addEventListener("click", () => {
        const slug = $("#edP", d).value; if (!slug) return toast("Elige la prenda que quieres agregar.");
        const color = coloresDe(slug)[0], talla = color && tallasDe(slug, color)[0];
        if (!talla) return toast("Esta prenda todavía no tiene tallas en el panel.");
        lineas.push({ slug, nombre: PROD[slug].name, color, talla, cantidad: 1, precio: INV[slug].precio });
        pintar(d); $("#edP", d).value = "";
        const nueva = $(`.edl[data-i="${lineas.length - 1}"]`, d);
        if (nueva) { nueva.scrollIntoView({ block: "nearest", behavior: "smooth" }); $("select", nueva).focus(); }
      });
      $("#edDesc", d).addEventListener("input", e => { decimal(e.target); totales(d); });
      $("#edEnv", d).addEventListener("input", e => { decimal(e.target); manual = true; totales(d); });
      d.addEventListener("click", e => { if (e.target.id === "edEnvAuto") { manual = false; totales(d); } });
    },
  });
  return r === true;
}
/* Excel de los pedidos de la pestaña abierta: un pedido por fila y, aparte, cada prenda */
function excelPedidos(lista) {
  const pedidos = lista.map(p => {
    const g = ganPedido(p), u = p.items.reduce((s, i) => s + i.cantidad, 0);
    return [p.codigo, p.fecha, ESTADO[p.estado], p.cliente.nombre || "", p.cliente.celular || "", p.cliente.email || "", ENTREGA[p.entrega.tipo] || "A coordinar",
      p.origen_stock ? (p.origen_stock === "almacen" ? "Almacén" : "Proveedor") : "", u, p.subtotal, p.descuento || 0, p.envio, p.total,
      g ? r2(g.costo) : null, g ? r2(g.g) : null, g && g.venta ? g.g / g.venta : null];
  });
  const prendas = lista.flatMap(p => p.items.map(i => [p.codigo, p.fecha, ESTADO[p.estado], i.nombre, i.color, i.talla, i.cantidad, i.precio, r2(i.precio * i.cantidad), i.costo, i.costo == null ? null : r2(i.costo * i.cantidad)]));
  const suma = (filas, col) => r2(filas.reduce((s, f) => s + (f[col] || 0), 0));
  excel(`pedidos-${ped.estado}`, [
    { nombre: "Pedidos", columnas: [{ t: "Código", ancho: 11 }, { t: "Fecha", ancho: 17, f: "d" }, { t: "Estado", ancho: 12 }, { t: "Cliente", ancho: 26 }, { t: "Celular", ancho: 13 }, { t: "Correo", ancho: 28 }, { t: "Entrega", ancho: 18 },
      { t: "Sale de", ancho: 11 }, { t: "Unidades", ancho: 10, f: "n" }, { t: "Subtotal (S/)", ancho: 13, f: "s" }, { t: "Descuento (S/)", ancho: 14, f: "s" }, { t: "Envío (S/)", ancho: 11, f: "s" }, { t: "Total (S/)", ancho: 12, f: "s" },
      { t: "Costo de prendas (S/)", ancho: 19, f: "s" }, { t: "Ganancia (S/)", ancho: 14, f: "s" }, { t: "Margen", ancho: 9, f: "p" }],
      filas: pedidos, total: ["Total", null, null, null, null, null, null, null, suma(pedidos, 8), suma(pedidos, 9), suma(pedidos, 10), suma(pedidos, 11), suma(pedidos, 12), suma(pedidos, 13), suma(pedidos, 14), null] },
    { nombre: "Prendas", columnas: [{ t: "Código", ancho: 11 }, { t: "Fecha", ancho: 17, f: "d" }, { t: "Estado", ancho: 12 }, { t: "Prenda", ancho: 34 }, { t: "Color", ancho: 16 }, { t: "Talla", ancho: 8 },
      { t: "Cantidad", ancho: 10, f: "n" }, { t: "Precio (S/)", ancho: 12, f: "s" }, { t: "Venta (S/)", ancho: 12, f: "s" }, { t: "Costo unitario (S/)", ancho: 17, f: "s" }, { t: "Costo total (S/)", ancho: 15, f: "s" }],
      filas: prendas, total: ["Total", null, null, null, null, null, suma(prendas, 6), null, suma(prendas, 8), null, suma(prendas, 10)] },
  ]);
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
/* Tipos de prenda de la línea elegida, como botones de un toque (aparecen al elegir una línea) */
function chipsCat(linea, valor) {
  const cats = linea ? CATS.filter(c => c.linea === linea && PRODUCTS.some(p => p.cat === c.slug)) : [];
  const chip = (slug, t) => `<button type="button" data-cat="${slug}" class="${valor === slug ? "on" : ""}" aria-pressed="${valor === slug}">${esc(t)}</button>`;
  return cats.length > 1 ? chip("", "Todas") + cats.map(c => chip(c.slug, c.name)).join("") : "";
}
/* Filtro por tipo de prenda: f = { linea, cat } (stkF o prF) · al tocar un botón se marca y se vuelve a pintar la lista */
function usarChips(caja, f, pintar) {
  caja.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]"); if (!b || b.dataset.cat === f.cat) return;
    f.cat = b.dataset.cat; caja.innerHTML = chipsCat(f.linea, f.cat); pintar();
  });
}
const buscaTexto = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* =========================================================
   EXCEL (.xlsx de verdad, sin librerías)
   hojas: [{ nombre, columnas: [{ t, ancho, f }], filas: [[...]], total: [...] }]
   f: "s" soles (2 decimales) · "n" entero · "p" porcentaje (0.25 = 25%) · "d" fecha y hora de Perú
   ========================================================= */
const r2 = n => Math.round(n * 100) / 100;
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
/* Zip sin comprimir (así es un .xlsx por dentro) */
function zipBlob(archivos, tipo) {
  const enc = new TextEncoder(), loc = [], cen = []; let off = 0;
  const poner = (dv, campos) => campos.forEach(([o, v, z]) => (z === 4 ? dv.setUint32(o, v, true) : dv.setUint16(o, v, true)));
  for (const [nombre, texto] of archivos) {
    const n = enc.encode(nombre), d = enc.encode(texto), crc = crc32(d);
    const h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
    poner(h, [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x800, 2], [12, 0x21, 2], [14, crc, 4], [18, d.length, 4], [22, d.length, 4], [26, n.length, 2]]);
    poner(c, [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x800, 2], [14, 0x21, 2], [16, crc, 4], [20, d.length, 4], [24, d.length, 4], [28, n.length, 2], [42, off, 4]]);
    loc.push(h, n, d); cen.push(c, n); off += 30 + n.length + d.length;
  }
  const tam = cen.reduce((s, x) => s + x.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  poner(e, [[0, 0x06054b50, 4], [8, archivos.length, 2], [10, archivos.length, 2], [12, tam, 4], [16, off, 4]]);
  return new Blob([...loc, ...cen, e], { type: tipo });
}
const xe = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
const colX = i => { let s = ""; for (i++; i; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };
const ESTILO = { s: 2, n: 3, p: 4, d: 9 }; // posiciones en cellXfs (+4 = la misma en negrita, para totales)
function hojaXML({ columnas, filas, total }) {
  const celda = (v, ci, ri, neg) => {
    if (v == null || v === "") return "";
    const r = colX(ci) + ri, f = columnas[ci].f;
    if (f === "d" && typeof v === "string") { const t = Date.parse(v); if (!isNaN(t)) return `<c r="${r}" s="9"><v>${(t - 5 * 3600e3) / 864e5 + 25569}</v></c>`; }
    if (f && f !== "d" && typeof v === "number" && isFinite(v)) return `<c r="${r}" s="${ESTILO[f] + (neg ? 4 : 0)}"><v>${v}</v></c>`;
    return `<c r="${r}" t="inlineStr"${neg ? ` s="5"` : ""}><is><t xml:space="preserve">${xe(v)}</t></is></c>`;
  };
  const fila = (vals, ri, neg) => `<row r="${ri}">${vals.map((v, ci) => celda(v, ci, ri, neg)).join("")}</row>`;
  const cab = `<row r="1">${columnas.map((c, ci) => `<c r="${colX(ci)}1" t="inlineStr" s="1"><is><t>${xe(c.t)}</t></is></c>`).join("")}</row>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    + `<cols>${columnas.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.ancho || 14}" customWidth="1"/>`).join("")}</cols>`
    + `<sheetData>${cab}${filas.map((f, i) => fila(f, i + 2)).join("")}${total ? fila(total, filas.length + 2, true) : ""}</sheetData></worksheet>`;
}
function excel(archivo, hojas) {
  const X = "http://schemas.openxmlformats.org/spreadsheetml/2006/main", R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", P = "http://schemas.openxmlformats.org/package/2006/relationships";
  const cab = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
  // 0 normal · 1 encabezado · 2 soles · 3 entero · 4 % · 5 texto negrita · 6 soles negrita · 7 entero negrita · 8 % negrita · 9 fecha
  const xfs = [[0, 0, 0], [0, 1, 2], [4, 0, 0], [3, 0, 0], [164, 0, 0], [0, 1, 0], [4, 1, 0], [3, 1, 0], [164, 1, 0], [165, 0, 0]];
  const estilos = `${cab}<styleSheet xmlns="${X}"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.0%"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts>`
    + `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>`
    + `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDE8E7"/><bgColor indexed="64"/></patternFill></fill></fills>`
    + `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
    + `<cellXfs count="${xfs.length}">${xfs.map(([nf, fo, fi]) => `<xf numFmtId="${nf}" fontId="${fo}" fillId="${fi}" borderId="0" xfId="0"${nf ? ` applyNumberFormat="1"` : ""}${fo ? ` applyFont="1"` : ""}${fi ? ` applyFill="1"` : ""}/>`).join("")}</cellXfs>`
    + `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const archivos = [
    ["[Content_Types].xml", `${cab}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>`
      + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
      + `${hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
    ["_rels/.rels", `${cab}<Relationships xmlns="${P}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `${cab}<workbook xmlns="${X}" xmlns:r="${R}"><sheets>${hojas.map((h, i) => `<sheet name="${xe(h.nombre.replace(/[\\/?*[\]:]/g, " ").slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `${cab}<Relationships xmlns="${P}">${hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${hojas.length + 1}" Type="${R}/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", estilos],
    ...hojas.map((h, i) => [`xl/worksheets/sheet${i + 1}.xml`, hojaXML(h)]),
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob(archivos, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
  a.download = `${archivo}-${diaLima(new Date())}.xlsx`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("Excel descargado.");
}

/* =========================================================
   STOCK: virtual (lo que ve la tienda) y físico (tu almacén, solo panel)
   ========================================================= */
const stkF = { linea: "", cat: "", q: "", modo: "virtual" };
const CAMPO = { virtual: "stock", fisico: "fisico" };
const varDe = (slug, color, talla) => (INV[slug] && INV[slug].vars[color + "|" + talla]) || null;
async function vStock(m) {
  await cargarInv();
  const cambios = new Map(); // "slug|color|talla" → nuevo valor del stock abierto (número o null = sin cargar)
  sucio = () => cambios.size > 0;
  m.innerHTML = `<header class="top"><h1>Stock</h1><div class="top__acts" id="sActs"></div></header>
    ${desfase()}
    <div class="bar"><div class="tabs" id="sModo"></div><p class="bar__nota" id="sNota"></p></div>
    <section class="kpis" id="sKpis"></section>
    <div class="bar">${filtroLinea("sLinea", stkF.linea)}<label class="search">${I.buscar}<input class="inp" id="sQ" type="search" placeholder="Buscar prenda o color" value="${esc(stkF.q)}"></label></div>
    <div class="chips" id="sCats" role="group" aria-label="Tipo de prenda">${chipsCat(stkF.linea, stkF.cat)}</div>
    <div id="sLista"></div>
    <div class="savebar" id="saveBar"><b id="sN"></b><div style="display:flex;gap:10px"><button class="btn btn--ghost" type="button" id="sDesc">Descartar</button><button class="btn btn--pri" type="button" id="sGuardar">${I.check}Guardar cambios</button></div></div>`;
  const fis = () => stkF.modo === "fisico";
  const orig = k => { const [s, c, t] = k.split("|"); const v = varDe(s, c, t); return v ? v[CAMPO[stkF.modo]] : null; };
  const valor = k => (cambios.has(k) ? cambios.get(k) : orig(k));
  const total = p => p.colors.reduce((n, [c]) => n + p.sizes.reduce((x, t) => x + (valor(`${p.slug}|${c}|${t}`) || 0), 0), 0);
  const kpis = () => {
    let u = 0, val = 0, agot = 0, sinCargar = 0; const sinCosto = new Set();
    PRODUCTS.forEach(p => { const d = INV[p.slug]; if (!d) return; p.colors.forEach(([c]) => p.sizes.forEach(t => {
      const v = d.vars[c + "|" + t]; if (!v) return; const x = v[CAMPO[stkF.modo]];
      if (x == null) { sinCargar++; return; }
      u += x; if (x === 0) agot++;
      if (fis() && x > 0) { if (d.costo == null) sinCosto.add(p.slug); else val += x * d.costo; }
    })); });
    $("#sKpis").innerHTML = fis()
      ? `<div class="kpi"><span>Unidades en tu almacén</span><b>${u}</b></div>
         <div class="kpi"><span>Valor del inventario</span><b>${money(val)}</b><em>A precio de costo</em></div>
         <a class="kpi${sinCosto.size ? " kpi--warn" : ""}" href="#productos"><span>Prendas sin costo</span><b>${sinCosto.size}</b><em>${sinCosto.size ? "Ponles costo en Productos" : "Todas tienen costo"}</em></a>`
      : `<div class="kpi"><span>Unidades en la tienda</span><b>${u}</b></div>
         <div class="kpi${agot ? " kpi--warn" : ""}"><span>Tallas agotadas</span><b>${agot}</b></div>
         <div class="kpi"><span>Tallas sin cargar</span><b>${sinCargar}</b><em>Se venden sin límite</em></div>`;
  };
  const cabeza = () => {
    $("#sModo").innerHTML = [["virtual", "Stock virtual"], ["fisico", "Stock físico"]].map(([k, l]) => `<button type="button" data-m="${k}" class="${stkF.modo === k ? "on" : ""}">${l}</button>`).join("");
    $("#sNota").textContent = fis() ? "Tu almacén. Solo lo ves tú. Baja cuando un pedido o una venta por mayor sale de tu almacén." : "Lo que la tienda muestra disponible. Baja cuando confirmas un pedido.";
    $("#sActs").innerHTML = `<button class="btn" type="button" data-a="hist">${I.hist}Historial</button>` + (fis()
      ? `<button class="btn" type="button" data-a="excel">${I.bajar}Descargar Excel</button><button class="btn" type="button" data-a="salida">${I.salida}Registrar salida</button><button class="btn btn--pri" type="button" data-a="entrada">${I.entrada}Registrar entrada</button>`
      : "");
    kpis();
  };
  const valorProd = p => (INV[p.slug].costo == null ? "" : `Costo ${money(INV[p.slug].costo)} · Valor <b>${money(total(p) * INV[p.slug].costo)}</b>`);
  // Colores apagados: no se ven en la tienda. El interruptor está en Stock virtual (lo que ve la tienda); en físico solo se avisa.
  const ocultos = p => new Set(INV[p.slug].ocultos || []);
  const avisoOcultos = (p, fuera) => (!fuera.size ? "" : `<span class="chip chip--off">${fuera.size >= p.colors.length ? "No se ve en la tienda" : plural(fuera.size, "color oculto", "colores ocultos")}</span>`);
  const colorCelda = (p, c, hex, off) => `<div class="stk__c${off ? " off" : ""}"><i style="background:${hex}"></i><span class="stk__cn">${esc(c)}${off ? "<small>Oculto en la tienda</small>" : ""}</span>${fis() ? ""
    : `<label class="sw" title="${off ? "Apagado: no se ve en la tienda. Toca para mostrarlo." : "Encendido: se ve en la tienda. Toca para ocultarlo."}"><input type="checkbox" data-color="${esc(c)}"${off ? "" : " checked"} aria-label="Mostrar ${esc(c)} de ${esc(p.name)} en la tienda"><b aria-hidden="true"></b></label>`}</div>`;
  const seccion = p => { const fuera = ocultos(p); return `<section class="stk" data-slug="${p.slug}">
        <div class="stk__head"><img src="${imgDe(p.slug)}" alt="" loading="lazy"><div class="stk__name"><h3>${esc(p.name)}</h3><p>${esc(lineName(p.linea))} · ${esc(catName(p.cat))}</p></div>
          ${avisoOcultos(p, fuera)}
          ${fis() ? (INV[p.slug].costo == null ? `<a class="chip chip--warn" href="#productos">Sin costo</a>` : `<span class="stk__val" data-val>${valorProd(p)}</span>`) : ""}
          <div class="stk__tot"><b data-tot>${total(p)}</b><span>unidades</span></div><button class="btn btn--sm" type="button" data-hist="${p.slug}">${I.hist}Historial</button></div>
        <div class="stk__grid${fis() ? "" : " stk__grid--sw"}" style="--n:${p.sizes.length}">
          <div class="stk__h">Color</div>${p.sizes.map(t => `<div class="stk__h">${esc(t)}</div>`).join("")}
          ${p.colors.map(([c, hex]) => colorCelda(p, c, hex, fuera.has(c)) + p.sizes.map(t => {
            const k = `${p.slug}|${c}|${t}`, v = valor(k), off = fuera.has(c) ? " off" : "";
            return varDe(p.slug, c, t)
              ? `<input data-k="${esc(k)}" inputmode="numeric" autocomplete="off" value="${v ?? ""}" placeholder="—" class="${cambios.has(k) ? "chg" : v === 0 ? "cero" : ""}${off}" aria-label="${esc(p.name)}, ${esc(c)}, talla ${esc(t)}">`
              : `<input disabled placeholder="—" aria-label="Talla aún no disponible">`;
          }).join("")).join("")}
        </div></section>`; };
  const pintar = () => {
    const q = buscaTexto(stkF.q);
    const lista = PRODUCTS.filter(p => INV[p.slug] && (!stkF.linea || p.linea === stkF.linea) && (!stkF.cat || p.cat === stkF.cat) &&
      (!q || buscaTexto(p.name + " " + p.colors.map(c => c[0]).join(" ")).includes(q)));
    $("#sLista").innerHTML = lista.length ? lista.map(seccion).join("")
      : `<div class="empty"><b>Sin resultados</b>Prueba con otro filtro.</div>`;
  };
  const barra = () => { $("#saveBar").classList.toggle("show", cambios.size > 0); $("#sN").textContent = `${plural(cambios.size, "cambio", "cambios")} sin guardar`; };
  const recargar = async () => { cambios.clear(); await cargarInv(); cabeza(); pintar(); barra(); };
  const descartar = async t => !cambios.size || confirmar("Tienes cambios sin guardar", `<p>Si ${t} ahora, se pierden los cambios que no guardaste.</p>`, "Seguir sin guardar", "btn--bad");
  cabeza(); pintar(); barra();

  $("#sModo").addEventListener("click", async e => {
    const b = e.target.closest("[data-m]"); if (!b || b.dataset.m === stkF.modo) return;
    if (!(await descartar("cambias de stock"))) return;
    cambios.clear(); stkF.modo = b.dataset.m; cabeza(); pintar(); barra();
  });
  $("#sActs").addEventListener("click", async e => {
    const a = e.target.closest("[data-a]"); if (!a) return;
    if (a.dataset.a === "hist") return historial("", stkF.modo);
    if (a.dataset.a === "excel") return excelInventario();
    if (!(await descartar("registras una " + a.dataset.a))) return;
    if (await movFisico(a.dataset.a)) await recargar().catch(x => toast(msg(x)));
  });
  $("#sLinea").addEventListener("change", e => { stkF.linea = e.target.value; stkF.cat = ""; $("#sCats").innerHTML = chipsCat(stkF.linea, ""); pintar(); });
  usarChips($("#sCats"), stkF, pintar);
  let t; $("#sQ").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { stkF.q = e.target.value.trim(); pintar(); }, 200); });
  $("#sLista").addEventListener("input", e => {
    const inp = e.target, k = inp.dataset.k; if (!k) return;
    const limpio = inp.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 5);
    if (limpio !== inp.value) inp.value = limpio;
    const nuevo = limpio === "" ? null : +limpio;
    if (nuevo === orig(k)) cambios.delete(k); else cambios.set(k, nuevo);
    inp.classList.toggle("chg", cambios.has(k)); inp.classList.toggle("cero", !cambios.has(k) && nuevo === 0);
    const sec = inp.closest(".stk"), p = PROD[sec.dataset.slug];
    $("[data-tot]", sec).textContent = total(p);
    const vl = $("[data-val]", sec); if (vl) vl.innerHTML = valorProd(p);
    barra();
  });
  // Enter pasa a la siguiente casilla
  $("#sLista").addEventListener("keydown", e => {
    if (e.key !== "Enter" || !e.target.dataset.k) return;
    e.preventDefault(); const all = $$("#sLista input[data-k]:not(:disabled)"), i = all.indexOf(e.target);
    if (all[i + 1]) { all[i + 1].focus(); all[i + 1].select(); }
  });
  $("#sLista").addEventListener("focusin", e => { if (e.target.dataset.k) e.target.select(); });
  $("#sLista").addEventListener("click", e => { const b = e.target.closest("[data-hist]"); if (b) historial(b.dataset.hist, stkF.modo); });
  // Interruptor de un color: se guarda al instante (no usa "Guardar cambios" y no toca el stock)
  $("#sLista").addEventListener("change", async e => {
    const sw = e.target.closest("[data-color]"); if (!sw) return;
    const sec = sw.closest(".stk"), p = PROD[sec.dataset.slug], color = sw.dataset.color, visible = sw.checked;
    sw.disabled = true;
    try {
      const r = await api("colores", { method: "POST", body: { slug: p.slug, color, visible } });
      INV[p.slug].ocultos = r.ocultos;
      const actual = $("#sLista") && $(`.stk[data-slug="${p.slug}"]`, $("#sLista"));
      if (actual) actual.outerHTML = seccion(p);
      toast(visible ? `${p.name} · ${color}: ya se ve en la tienda.`
        : r.ocultos.length >= p.colors.length ? `${p.name}: apagaste todos sus colores, la prenda ya no se ve en la tienda.`
        : `${p.name} · ${color}: ya no se ve en la tienda. Su stock queda guardado.`);
    } catch (x) { sw.checked = !visible; sw.disabled = false; toast(msg(x)); }
  });
  $("#sDesc").addEventListener("click", () => { cambios.clear(); pintar(); barra(); });
  $("#sGuardar").addEventListener("click", async () => {
    const campo = CAMPO[stkF.modo];
    const lista = [...cambios].map(([k, v]) => { const [slug, color, talla] = k.split("|"); return { slug, color, talla, [campo]: v }; });
    $("#sGuardar").disabled = true;
    try {
      await api("stock", { method: "POST", body: { cambios: lista } });
      await recargar();
      toast(fis() ? `Stock físico guardado (${plural(lista.length, "talla", "tallas")}). Queda en el historial como conteo.` : `Stock virtual guardado (${plural(lista.length, "talla", "tallas")}). Ya se ve en la tienda.`);
    } catch (x) { toast(msg(x)); }
    $("#sGuardar").disabled = false;
  });
}

/* ---------- Entradas y salidas del almacén ---------- */
const SALIDA = { merma: "Merma", danado: "Prenda dañada", devolucion: "Devolución al proveedor", otro: "Otro" };
function selPrendas(id) {
  const g = {}; PRODUCTS.filter(p => INV[p.slug]).forEach(p => (g[lineName(p.linea) || "Otras"] ||= []).push(p));
  return `<select class="sel" id="${id}"><option value="">Elige la prenda</option>${Object.entries(g).map(([l, ps]) => `<optgroup label="${esc(l)}">${ps.map(p => `<option value="${p.slug}">${esc(p.name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
}
/* Guarda solo el costo de una prenda (el resto queda igual) */
async function guardarCosto(slug, costo) {
  const d = INV[slug];
  await api(`productos/${slug}`, { method: "POST", body: { precio: d.precio, precio_antes: d.precio_antes, costo, precio_mayor: d.precio_mayor, estado: d.estado, todos: false } });
}
async function movFisico(tipo) {
  const entrada = tipo === "entrada";
  let provs = [], slug = "";
  if (entrada) { try { provs = [...new Set((await api("movimientos?tipo=fisico")).movimientos.map(x => x.proveedor).filter(Boolean))]; } catch (_) {} }
  const grilla = () => {
    const p = PROD[slug];
    if (!p) return `<p class="vacio">Elige una prenda para poner las cantidades por color y talla.</p>`;
    return `<div class="stk__grid" style="--n:${p.sizes.length}"><div class="stk__h">Color</div>${p.sizes.map(t => `<div class="stk__h">${esc(t)}</div>`).join("")}
      ${p.colors.map(([c, hex]) => `<div class="stk__c"><i style="background:${hex}"></i>${esc(c)}</div>${p.sizes.map(t => {
        const v = varDe(slug, c, t);
        return v ? `<label class="cel"><input data-c="${esc(c)}" data-t="${esc(t)}" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="${esc(c)}, talla ${esc(t)}"><em>Hay ${v.fisico ?? 0}</em></label>`
          : `<input disabled placeholder="—" aria-label="Talla aún no disponible">`;
      }).join("")}`).join("")}</div>`;
  };
  const html = `<div class="frm">
    <p class="frm__lead">${entrada ? "Prendas que llegan a tu almacén (compra al proveedor)." : "Prendas que salen de tu almacén sin venderse."}</p>
    <div class="f"><label for="mvP">Prenda</label>${selPrendas("mvP")}</div>
    <div class="f"><label>Cantidades</label><div id="mvG">${grilla()}</div></div>
    ${entrada ? `<div class="frm__2">
        <div class="f"><label for="mvCosto">Costo por prenda</label><label class="money"><span>S/</span><input class="inp" id="mvCosto" inputmode="decimal" autocomplete="off" placeholder="0.00"></label></div>
        <div class="f"><label for="mvProv">Proveedor</label><input class="inp" id="mvProv" maxlength="120" list="mvProvs" autocomplete="off" placeholder="Opcional"><datalist id="mvProvs">${provs.map(x => `<option value="${esc(x)}">`).join("")}</datalist></div>
      </div>
      <label class="chk" id="mvUsarW" hidden><input type="checkbox" id="mvUsar"><span id="mvUsarT"></span></label>`
    : `<div class="f"><label for="mvMot">Motivo</label><select class="sel" id="mvMot">${Object.entries(SALIDA).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>`}
    <div class="f"><label for="mvNota">Nota</label><input class="inp" id="mvNota" maxlength="300" autocomplete="off" placeholder="Opcional"></div>
    <div class="alert alert--bad" id="mvErr" hidden></div></div>`;
  const costoActual = () => (INV[slug] ? INV[slug].costo : null);
  const revisarCosto = d => {
    const v = $("#mvCosto", d).value, c = costoActual(), w = $("#mvUsarW", d);
    w.hidden = !slug || v === "" || +v === c;
    if (!w.hidden) { $("#mvUsarT", d).textContent = c == null ? `Guardar S/${(+v).toFixed(2)} como costo de esta prenda` : `Cambiar el costo de esta prenda de ${money(c)} a S/${(+v).toFixed(2)}`; }
  };
  const r = await ventana({
    titulo: entrada ? "Registrar entrada" : "Registrar salida", ancho: true, fijo: true, html,
    acciones: [{ t: "Volver", v: false }, { t: entrada ? `${I.entrada}Registrar entrada` : `${I.salida}Registrar salida`, clase: entrada ? "btn--pri" : "btn--dark", v: true, antes: async d => {
      const err = $("#mvErr", d), mal = h => { err.innerHTML = h; err.hidden = false; err.scrollIntoView({ block: "nearest", behavior: "smooth" }); return false; };
      if (!slug) return mal("Elige la prenda.");
      const items = $$("#mvG input[data-t]", d).filter(i => +i.value > 0).map(i => ({ slug, color: i.dataset.c, talla: i.dataset.t, cantidad: +i.value }));
      if (!items.length) return mal("Pon la cantidad en al menos una talla.");
      const body = { tipo, items, nota: $("#mvNota", d).value.trim() };
      if (entrada) { const c = $("#mvCosto", d).value; body.costo_unitario = c === "" ? null : +c; body.proveedor = $("#mvProv", d).value.trim(); }
      else body.motivo = $("#mvMot", d).value;
      try {
        const res = await api("fisico", { method: "POST", body });
        let extra = "";
        if (entrada && !$("#mvUsarW", d).hidden && $("#mvUsar", d).checked) {
          try { await guardarCosto(slug, body.costo_unitario); extra = " y el costo de la prenda"; } catch (_) { extra = ", pero no se pudo cambiar el costo de la prenda"; }
        }
        toast(entrada ? `Entrada registrada: ${plural(res.unidades, "unidad", "unidades")} más en tu almacén${extra}.` : `Salida registrada: ${plural(res.unidades, "unidad", "unidades")} menos en tu almacén.`);
        return true;
      } catch (x) {
        if (x.codigo === "sin_stock_fisico") return mal(`No hay tantas en tu almacén.${listaFaltan(x.data.faltan)}`);
        return mal(esc(msg(x)));
      }
    } }],
    alAbrir: d => {
      $("#mvP", d).addEventListener("change", e => {
        slug = e.target.value; $("#mvG", d).innerHTML = grilla();
        if (entrada) { const c = costoActual(); $("#mvCosto", d).value = c == null ? "" : c; $("#mvUsar", d).checked = c == null; revisarCosto(d); }
        const i = $("#mvG input:not(:disabled)", d); if (i) i.focus();
      });
      $("#mvG", d).addEventListener("input", e => { const i = e.target; if (!i.dataset.t) return; const s = i.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 4); if (s !== i.value) i.value = s; });
      if (entrada) $("#mvCosto", d).addEventListener("input", e => {
        const s = e.target.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); if (s !== e.target.value) e.target.value = s;
        revisarCosto(d);
      });
      setTimeout(() => $("#mvP", d).focus(), 80);
    },
  });
  return r === true;
}

/* ---------- Historial (kardex) del stock virtual y físico ---------- */
const MOTIVO = { ajuste: "Ajuste a mano", conteo: "Conteo", venta: "Pedido", venta_mayor: "Venta por mayor", entrada: "Entrada", merma: "Merma", danado: "Prenda dañada", devolucion: "Devolución al proveedor", otro: "Otro", directo: "Cambio directo" };
const TIPO_STK = { virtual: "Virtual", fisico: "Físico" };
async function historial(slug, tipo = "") {
  let filtro = tipo;
  const cargar = async () => (await api(`movimientos?tipo=${filtro}${slug ? `&slug=${encodeURIComponent(slug)}` : ""}`)).movimientos;
  let movs = await cargar().catch(e => (toast(msg(e)), null));
  if (!movs) return;
  const detalle = x => [x.pedido ? `${x.pedido}${x.origen_stock ? ` (${x.origen_stock === "almacen" ? "almacén" : "proveedor"})` : ""}` : "",
    x.costo_unitario != null ? `Costo ${money(x.costo_unitario)}` : "", x.proveedor, x.nota].filter(Boolean).map(esc).join(" · ");
  const tabla = () => (movs.length
    ? `<div class="wrap-tbl"><table class="tbl"><thead><tr><th>Fecha</th>${slug ? "" : "<th>Prenda</th>"}<th>Color</th><th>Talla</th><th>Stock</th><th class="num">Cantidad</th><th>Motivo</th><th>Quién</th></tr></thead><tbody>${movs.map(x => {
        const dif = (x.despues ?? 0) - (x.antes ?? 0);
        return `<tr><td>${fFecha(x.fecha)}</td>${slug ? "" : `<td>${esc(x.nombre || x.slug)}</td>`}<td>${esc(x.color)}</td><td>${esc(x.talla)}</td>
          <td><span class="chip${x.tipo === "fisico" ? " chip--teal" : ""}">${TIPO_STK[x.tipo] || x.tipo}</span></td>
          <td class="num">${x.antes ?? "—"} → <b>${x.despues ?? "—"}</b>${x.despues != null && dif ? ` <span class="dif ${dif > 0 ? "mas" : "menos"}">${dif > 0 ? "+" : "−"}${Math.abs(dif)}</span>` : ""}</td>
          <td>${MOTIVO[x.motivo] || esc(x.motivo)}${detalle(x) ? `<small class="sub">${detalle(x)}</small>` : ""}</td><td>${esc(x.admin || "—")}</td></tr>`;
      }).join("")}</tbody></table></div>`
    : `<p class="vacio">Todavía no hay movimientos</p>`);
  await ventana({
    titulo: slug ? `Historial · ${PROD[slug] ? PROD[slug].name : slug}` : "Historial de stock", ancho: true,
    html: `<div class="bar"><div class="tabs tabs--sm" id="hTipo">${[["", "Todo"], ["virtual", "Virtual"], ["fisico", "Físico"]].map(([k, l]) => `<button type="button" data-t="${k}" class="${filtro === k ? "on" : ""}">${l}</button>`).join("")}</div></div><div id="hTabla">${tabla()}</div>`,
    acciones: [{ t: `${I.bajar}Descargar Excel`, antes: async () => { if (movs.length) excelMovs(movs, slug); else toast("No hay movimientos para descargar."); return false; } }, { t: "Cerrar", clase: "btn--pri", v: null }],
    alAbrir: d => $("#hTipo", d).addEventListener("click", async e => {
      const b = e.target.closest("[data-t]"); if (!b || b.dataset.t === filtro) return;
      filtro = b.dataset.t; $$("#hTipo button", d).forEach(x => x.classList.toggle("on", x.dataset.t === filtro));
      try { movs = await cargar(); $("#hTabla", d).innerHTML = tabla(); } catch (x) { toast(msg(x)); }
    }),
  });
}
function excelMovs(movs, slug) {
  excel(slug ? `historial-${slug}` : "historial-stock", [{
    nombre: "Movimientos",
    columnas: [{ t: "Fecha", ancho: 17, f: "d" }, { t: "Stock", ancho: 9 }, { t: "Prenda", ancho: 34 }, { t: "Color", ancho: 16 }, { t: "Talla", ancho: 8 },
      { t: "Antes", ancho: 8, f: "n" }, { t: "Después", ancho: 9, f: "n" }, { t: "Cantidad", ancho: 10, f: "n" }, { t: "Motivo", ancho: 22 }, { t: "Pedido", ancho: 11 },
      { t: "Costo unitario (S/)", ancho: 17, f: "s" }, { t: "Valor (S/)", ancho: 12, f: "s" }, { t: "Proveedor", ancho: 22 }, { t: "Nota", ancho: 30 }, { t: "Quién", ancho: 16 }],
    filas: movs.map(x => {
      const dif = x.antes == null && x.despues == null ? null : (x.despues ?? 0) - (x.antes ?? 0);
      return [x.fecha, TIPO_STK[x.tipo] || x.tipo, x.nombre || x.slug, x.color, x.talla, x.antes, x.despues, dif, MOTIVO[x.motivo] || x.motivo, x.pedido || "",
        x.costo_unitario, x.costo_unitario != null && dif != null ? r2(x.costo_unitario * dif) : null, x.proveedor || "", x.nota || "", x.admin || ""];
    }),
  }]);
}
/* Excel del inventario: cada talla con su físico, virtual y valor; y un resumen por prenda con sus márgenes */
function excelInventario() {
  const tallas = [], prendas = [];
  PRODUCTS.forEach(p => {
    const d = INV[p.slug]; if (!d) return;
    let uf = 0, uv = 0;
    p.colors.forEach(([c]) => p.sizes.forEach(t => {
      const v = d.vars[c + "|" + t]; if (!v) return;
      uf += v.fisico || 0; uv += v.stock || 0;
      tallas.push([p.name, lineName(p.linea), catName(p.cat), c, t, v.fisico, v.stock, d.costo, v.fisico != null && d.costo != null ? r2(v.fisico * d.costo) : null, v.fisico_actualizado]);
    }));
    const mMin = margen(d.precio, d.costo), mMay = margen(d.precio_mayor, d.costo);
    prendas.push([p.name, lineName(p.linea), uf, uv, d.costo, d.costo != null ? r2(uf * d.costo) : null, d.precio, mMin ? r2(mMin.s) : null, mMin ? mMin.s / d.precio : null,
      d.precio_mayor, mMay ? r2(mMay.s) : null, mMay ? mMay.s / d.precio_mayor : null]);
  });
  const suma = (filas, col) => r2(filas.reduce((s, f) => s + (f[col] || 0), 0));
  excel("inventario-maison", [
    { nombre: "Inventario por talla", columnas: [{ t: "Prenda", ancho: 34 }, { t: "Línea", ancho: 18 }, { t: "Categoría", ancho: 16 }, { t: "Color", ancho: 16 }, { t: "Talla", ancho: 8 },
      { t: "Stock físico", ancho: 12, f: "n" }, { t: "Stock virtual", ancho: 13, f: "n" }, { t: "Costo unitario (S/)", ancho: 17, f: "s" }, { t: "Valor a costo (S/)", ancho: 17, f: "s" }, { t: "Último cambio del físico", ancho: 21, f: "d" }],
      filas: tallas, total: ["Total", null, null, null, null, suma(tallas, 5), suma(tallas, 6), null, suma(tallas, 8), null] },
    { nombre: "Por prenda", columnas: [{ t: "Prenda", ancho: 34 }, { t: "Línea", ancho: 18 }, { t: "Stock físico", ancho: 12, f: "n" }, { t: "Stock virtual", ancho: 13, f: "n" },
      { t: "Costo unitario (S/)", ancho: 17, f: "s" }, { t: "Valor a costo (S/)", ancho: 17, f: "s" }, { t: "Precio tienda (S/)", ancho: 16, f: "s" }, { t: "Ganancia tienda (S/)", ancho: 18, f: "s" }, { t: "Margen tienda", ancho: 13, f: "p" },
      { t: "Precio mayorista (S/)", ancho: 19, f: "s" }, { t: "Ganancia mayorista (S/)", ancho: 21, f: "s" }, { t: "Margen mayorista", ancho: 16, f: "p" }],
      filas: prendas, total: ["Total", null, suma(prendas, 2), suma(prendas, 3), null, suma(prendas, 5), null, null, null, null, null, null] },
  ]);
}

/* =========================================================
   PRODUCTOS: precio normal, descuento, precio final, costo, precio mayorista y estado
   ========================================================= */
const prF = { linea: "", cat: "", q: "" };
/* Ganancia sobre el precio de venta, en soles y en % */
const margen = (precio, costo) => (precio == null || costo == null || !(precio > 0) ? null : { s: precio - costo, p: Math.round(((precio - costo) / precio) * 100) });
function margenHTML(precio, costo) {
  const g = margen(precio, costo);
  if (!g) return `<em class="mg mg--nada">${costo == null ? "Sin costo" : "—"}</em>`;
  return g.s < 0 ? `<em class="mg mg--bad">Pierdes ${money(-g.s)} · ${g.p}%</em>` : `<em class="mg">Ganas ${money(g.s)} · ${g.p}%</em>`;
}
async function vProductos(m) {
  await cargarInv();
  const pend = new Set();
  sucio = () => pend.size > 0;
  m.innerHTML = `<header class="top"><h1>Productos</h1></header>
    ${desfase()}
    <div class="bar">${filtroLinea("prLinea", prF.linea)}<label class="search">${I.buscar}<input class="inp" id="prQ" type="search" placeholder="Buscar prenda" value="${esc(prF.q)}"></label><p class="bar__nota">El costo y el precio mayorista solo los ves tú.</p></div>
    <div class="chips" id="prCats" role="group" aria-label="Tipo de prenda">${chipsCat(prF.linea, prF.cat)}</div>
    <div class="prods" id="prLista"></div>`;
  const datosDe = slug => { const d = INV[slug]; const normal = d.precio_antes ?? d.precio; return { normal, final: d.precio, pct: d.precio_antes ? Math.round((1 - d.precio / d.precio_antes) * 100) : 0, estado: d.estado, costo: d.costo, mayor: d.precio_mayor }; };
  const num = v => (v === "" || v == null ? null : +v);
  const dinero = (f, valor, etiqueta, p) => `<label class="money"><span>S/</span><input class="inp" data-f="${f}" inputmode="decimal" autocomplete="off" value="${valor ?? ""}" aria-label="${etiqueta} de ${esc(p.name)}"></label>`;
  const fila = p => {
    const d = datosDe(p.slug);
    return `<div class="prow${d.estado === "oculto" ? " prow--oculto" : ""}" data-slug="${p.slug}">
      <div class="prd"><img src="${imgDe(p.slug)}" alt="" loading="lazy"><div><b>${esc(p.name)}</b><small>${esc(lineName(p.linea))} · ${esc(catName(p.cat))}</small></div></div>
      <div data-l="Precio normal">${dinero("normal", d.normal, "Precio normal", p)}</div>
      <div data-l="Descuento"><label class="pct"><input class="inp" data-f="pct" inputmode="numeric" autocomplete="off" value="${d.pct}" aria-label="Descuento de ${esc(p.name)}"><span>%</span></label></div>
      <div data-l="Precio final">${dinero("final", d.final, "Precio final", p)}<span data-mg="min">${margenHTML(d.final, d.costo)}</span></div>
      <div data-l="Costo">${dinero("costo", d.costo, "Costo", p)}</div>
      <div data-l="Precio mayorista">${dinero("mayor", d.mayor, "Precio mayorista", p)}<span data-mg="may">${d.mayor == null ? `<em class="mg mg--nada">Sin precio</em>` : margenHTML(d.mayor, d.costo)}</span></div>
      <div class="prow__estado" data-l="Estado"><select class="sel" data-f="estado" aria-label="Estado de ${esc(p.name)}">
        ${[["activo", "A la venta"], ["agotado", "Agotado"], ["oculto", "Oculto"]].map(([v, t]) => `<option value="${v}"${d.estado === v ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="prow__acts">${p.base ? `<label class="chk"><input type="checkbox" data-f="todos">Todos los colores</label>` : ""}<button class="btn btn--pri btn--sm" type="button" data-guardar disabled>Guardar</button></div>
    </div>`;
  };
  const pintar = () => {
    const q = buscaTexto(prF.q);
    const lista = PRODUCTS.filter(p => INV[p.slug] && (!prF.linea || p.linea === prF.linea) && (!prF.cat || p.cat === prF.cat) && (!q || buscaTexto(p.name).includes(q)));
    pend.clear();
    $("#prLista").innerHTML = lista.length
      ? `<div class="prow prow--head"><span>Producto</span><span>Precio normal</span><span>Descuento</span><span>Precio final</span><span>Costo</span><span>Precio mayorista</span><span>Estado</span><span></span></div>${lista.map(fila).join("")}`
      : `<div class="empty"><b>Sin resultados</b>Prueba con otro filtro.</div>`;
  };
  const leer = row => { const g = f => $(`[data-f="${f}"]`, row); return { normal: num(g("normal").value), pct: num(g("pct").value) || 0, final: num(g("final").value), costo: num(g("costo").value), mayor: num(g("mayor").value), estado: g("estado").value, todos: !!(g("todos") && g("todos").checked) }; };
  const marcar = row => {
    const v = leer(row), d = datosDe(row.dataset.slug);
    $('[data-mg="min"]', row).innerHTML = margenHTML(v.final, v.costo);
    $('[data-mg="may"]', row).innerHTML = v.mayor == null ? `<em class="mg mg--nada">Sin precio</em>` : margenHTML(v.mayor, v.costo);
    const cambio = v.normal !== d.normal || v.final !== d.final || v.estado !== d.estado || v.costo !== d.costo || v.mayor !== d.mayor;
    row.classList.toggle("chg", cambio); $("[data-guardar]", row).disabled = !cambio;
    if (cambio) pend.add(row.dataset.slug); else pend.delete(row.dataset.slug);
  };
  pintar();
  $("#prLinea").addEventListener("change", e => { prF.linea = e.target.value; prF.cat = ""; $("#prCats").innerHTML = chipsCat(prF.linea, ""); pintar(); });
  usarChips($("#prCats"), prF, pintar);
  let t; $("#prQ").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { prF.q = e.target.value.trim(); pintar(); }, 200); });
  // El precio final se calcula con el % (y el % con el precio final), siempre a soles enteros
  $("#prLista").addEventListener("input", e => {
    const inp = e.target, f = inp.dataset.f, row = inp.closest(".prow"); if (!f || !row) return;
    if (["normal", "final", "costo", "mayor"].includes(f)) { const s = inp.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); if (s !== inp.value) inp.value = s; }
    if (f === "pct") { const s = inp.value.replace(/\D/g, "").slice(0, 2); if (s !== inp.value) inp.value = s; }
    const v = leer(row), g = x => $(`[data-f="${x}"]`, row);
    if ((f === "normal" || f === "pct") && v.normal != null) g("final").value = Math.round(v.normal * (1 - v.pct / 100));
    if (f === "final" && v.normal && v.final != null) g("pct").value = v.final < v.normal ? Math.round((1 - v.final / v.normal) * 100) : 0;
    marcar(row);
  });
  $("#prLista").addEventListener("change", e => { const row = e.target.closest(".prow"); if (row && e.target.dataset.f) marcar(row); });
  $("#prLista").addEventListener("click", async e => {
    const b = e.target.closest("[data-guardar]"); if (!b) return;
    const row = b.closest(".prow"), slug = row.dataset.slug, v = leer(row), d = datosDe(slug);
    if (v.final == null || !(v.final > 0)) return toast("Escribe el precio final.");
    if (v.normal != null && v.normal < v.final) return toast("El precio normal no puede ser menor que el precio final.");
    if (v.mayor != null && !(v.mayor > 0)) return toast("Revisa el precio mayorista.");
    const enTienda = v.normal !== d.normal || v.final !== d.final || v.estado !== d.estado;
    b.disabled = true;
    try {
      const r = await api(`productos/${slug}`, { method: "POST", body: { precio: v.final, precio_antes: v.normal != null && v.normal > v.final ? v.normal : null, costo: v.costo, precio_mayor: v.mayor, estado: v.estado, todos: v.todos } });
      await cargarInv();
      if (v.todos) pintar(); else { pend.delete(slug); row.outerHTML = fila(PROD[slug]); }
      toast(`${PROD[slug].name}: guardado${v.todos ? ` en ${r.cambiados} colores` : ""}.${enTienda ? " Ya se ve en la tienda." : ""}`);
    } catch (x) { toast(msg(x)); b.disabled = false; }
  });
}

/* =========================================================
   MAYORISTA: ventas por mayor registradas a mano, con su ganancia
   ========================================================= */
const ORIGEN_STK = { almacen: "Tu almacén", proveedor: "Proveedor" };
function cuentaVenta(v) {
  const venta = v.items.reduce((s, i) => s + i.precio * i.cantidad, 0), u = v.items.reduce((s, i) => s + i.cantidad, 0);
  if (v.items.some(i => i.costo == null)) return { venta, u, costo: null, g: null };
  const costo = v.items.reduce((s, i) => s + i.costo * i.cantidad, 0);
  return { venta, u, costo, g: venta - costo };
}
const ganHTML = (g, venta) => (g == null ? `<span class="chip">Sin costo</span>` : `<b class="${g < 0 ? "neg" : "pos"}">${money(g)}</b> <span class="muted">· ${pctDe(g, venta)}%</span>`);
async function vMayorista(m) {
  const [r] = await Promise.all([api("mayor"), cargarInv()]);
  const mes = diaLima(new Date()).slice(0, 7), delMes = r.ventas.filter(v => diaLima(new Date(v.fecha)).slice(0, 7) === mes);
  const t = delMes.reduce((a, v) => { const c = cuentaVenta(v); a.venta += c.venta; a.u += c.u; if (c.g == null) a.sc++; else { a.g += c.g; a.vc += c.venta; } return a; }, { venta: 0, u: 0, g: 0, vc: 0, sc: 0 });
  m.innerHTML = `<header class="top"><div><h1>Mayorista</h1><p class="top__sub">Ventas por mayor que registras aquí. Bajan el stock igual que un pedido confirmado.</p></div>
      <div class="top__acts"><button class="btn" type="button" id="mxExcel"${r.ventas.length ? "" : " disabled"}>${I.bajar}Descargar Excel</button><button class="btn btn--pri" type="button" id="mxNueva">${I.mas}Nueva venta</button></div></header>
    <section class="kpis">
      <div class="kpi"><span>Vendido este mes</span><b>${money(t.venta)}</b><em>${plural(delMes.length, "venta", "ventas")} · ${plural(t.u, "unidad", "unidades")}</em></div>
      <div class="kpi${t.g < 0 ? " kpi--bad" : ""}"><span>Ganancia del mes</span><b>${money(t.g)}</b><em>Margen ${t.vc ? pctDe(t.g, t.vc) + "%" : "—"}${t.sc ? ` · ${t.sc} sin costo` : ""}</em></div>
    </section>
    <div class="card wrap-tbl" id="mxLista"></div>`;
  $("#mxLista").innerHTML = r.ventas.length
    ? `<table class="tbl tbl--click"><thead><tr><th>Código</th><th>Fecha</th><th>Cliente</th><th>Sale de</th><th class="num">Unidades</th><th class="num">Total</th><th class="num">Ganancia</th></tr></thead><tbody>${r.ventas.map(v => {
        const c = cuentaVenta(v);
        return `<tr data-cod="${v.codigo}" tabindex="0"><td><b>${v.codigo}</b></td><td>${fFecha(v.fecha)}</td><td>${esc(v.cliente || "—")}</td><td>${ORIGEN_STK[v.origen_stock] || "—"}</td><td class="num">${c.u}</td><td class="num"><b>${money(v.total)}</b></td><td class="num">${ganHTML(c.g, c.venta)}</td></tr>`;
      }).join("")}</tbody></table>`
    : `<div class="empty"><b>Todavía no hay ventas por mayor</b>Registra la primera con «Nueva venta».</div>`;
  $("#mxNueva").addEventListener("click", async () => { if (await nuevaVentaMayor()) vMayorista(m).catch(x => toast(msg(x))); });
  $("#mxExcel").addEventListener("click", () => excelMayor(r.ventas));
  const abrir = e => { const tr = e.target.closest("[data-cod]"); if (tr) verVentaMayor(r.ventas.find(v => v.codigo === tr.dataset.cod)); };
  $("#mxLista").addEventListener("click", abrir);
  $("#mxLista").addEventListener("keydown", e => { if (e.key === "Enter") abrir(e); });
}
function verVentaMayor(v) {
  const c = cuentaVenta(v), fila = (t, x) => (x == null || x === "" ? "" : `<dt>${t}</dt><dd>${x}</dd>`);
  ventana({
    titulo: `Venta ${v.codigo}`, ancho: true,
    html: `<div class="hoja"><dl>${fila("Fecha", fFecha(v.fecha))}${fila("Cliente", esc(v.cliente))}${fila("Celular", v.celular ? `<a class="lnk" href="https://wa.me/${waCel(v.celular)}" target="_blank" rel="noopener">${I.wa}${esc(v.celular)}</a>` : "")}
      ${fila("DNI o RUC", esc(v.documento || ""))}${fila("Sale de", ORIGEN_STK[v.origen_stock])}${fila("Registró", esc(v.admin || "—"))}${fila("Nota", esc(v.nota || ""))}</dl></div>
      <div class="wrap-tbl" style="margin-top:18px"><table class="tbl"><thead><tr><th>Prenda</th><th>Color</th><th>Talla</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Costo</th><th class="num">Ganancia</th></tr></thead>
      <tbody>${v.items.map(i => `<tr><td><div class="prd"><img src="${imgDe(i.slug, i.color)}" alt="" loading="lazy"><b>${esc(i.nombre)}</b></div></td><td>${esc(i.color)}</td><td>${esc(i.talla)}</td><td class="num">${i.cantidad}</td><td class="num">${money(i.precio)}</td><td class="num">${i.costo == null ? "—" : money(i.costo)}</td>
        <td class="num">${i.costo == null ? "—" : ganHTML((i.precio - i.costo) * i.cantidad, i.precio * i.cantidad)}</td></tr>`).join("")}</tbody></table></div>
      <div class="vm-tot"><span>Unidades <b>${c.u}</b></span><span>Total <b>${money(v.total)}</b></span>${c.g == null ? `<span>Ganancia <b>sin costo</b></span>` : `<span>Costo <b>${money(c.costo)}</b></span><span>Ganancia ${ganHTML(c.g, c.venta)}</span>`}</div>`,
    acciones: [{ t: "Cerrar", clase: "btn--pri", v: null }],
  });
}
async function nuevaVentaMayor() {
  const lineas = []; // { slug, color, precio, cant: { talla: n } }
  const unid = l => Object.values(l.cant).reduce((a, b) => a + b, 0);
  const lineaHTML = (l, i) => {
    const p = PROD[l.slug];
    return `<div class="lin" data-i="${i}">
      <div class="lin__head"><img src="${imgDe(l.slug, l.color)}" alt=""><div class="lin__name"><b>${esc(p.name)}</b><span><i style="background:${colorHex(l.slug, l.color)}"></i>${esc(l.color)}</span></div>
        <div class="lin__precio"><span>Precio por prenda</span><label class="money"><span>S/</span><input class="inp" data-precio inputmode="decimal" autocomplete="off" value="${l.precio ?? ""}" placeholder="0.00" aria-label="Precio por prenda"></label></div>
        <button class="lin__x" type="button" data-quitar aria-label="Quitar ${esc(p.name)}">${I.x}</button></div>
      <div class="stk__grid stk__grid--sin" style="--n:${p.sizes.length}">${p.sizes.map(t => `<div class="stk__h">${esc(t)}</div>`).join("")}${p.sizes.map(t => {
        const v = varDe(l.slug, l.color, t);
        return v ? `<label class="cel"><input data-t="${esc(t)}" inputmode="numeric" autocomplete="off" placeholder="0" value="${l.cant[t] || ""}" aria-label="Talla ${esc(t)}"><em>Virtual ${v.stock ?? "—"}<br>Físico ${v.fisico ?? 0}</em></label>`
          : `<input disabled placeholder="—" aria-label="Talla aún no disponible">`;
      }).join("")}</div>
      <p class="lin__sub" data-sub>${subLinea(l)}</p></div>`;
  };
  const subLinea = l => {
    const n = unid(l), c = INV[l.slug].costo; if (!n) return "Pon las cantidades por talla.";
    const venta = n * (l.precio || 0), base = `${plural(n, "unidad", "unidades")} · <b>${money(venta)}</b>`;
    if (!(l.precio > 0)) return `${base} · Falta el precio`;
    return c == null ? `${base} · Sin costo` : `${base} · Ganancia ${ganHTML((l.precio - c) * n, venta)}`;
  };
  const totales = d => {
    let u = 0, venta = 0, costo = 0, sinC = false;
    lineas.forEach(l => { const n = unid(l), c = INV[l.slug].costo; u += n; venta += n * (l.precio || 0); if (c == null) { if (n) sinC = true; } else costo += n * c; });
    $("#vmTot", d).innerHTML = `<span>Unidades <b>${u}</b></span><span>Total <b>${money(venta)}</b></span>${sinC ? `<span>Ganancia <b>falta el costo de alguna prenda</b></span>` : `<span>Costo <b>${money(costo)}</b></span><span>Ganancia ${ganHTML(venta - costo, venta)}</span>`}`;
  };
  const pintarLineas = d => { $("#vmLineas", d).innerHTML = lineas.map(lineaHTML).join(""); totales(d); };
  const html = `<div class="frm">
    <div class="frm__3">
      <div class="f"><label for="vmCli">Cliente</label><input class="inp" id="vmCli" maxlength="120" autocomplete="off" placeholder="Nombre o razón social"></div>
      <div class="f"><label for="vmCel">Celular</label><input class="inp" id="vmCel" maxlength="30" inputmode="tel" autocomplete="off" placeholder="Opcional"></div>
      <div class="f"><label for="vmDoc">DNI o RUC</label><input class="inp" id="vmDoc" maxlength="20" inputmode="numeric" autocomplete="off" placeholder="Opcional"></div>
    </div>
    <div class="f"><span class="f__t">¿De dónde sale la mercadería?</span><div class="opcs">
      <label class="opc"><input type="radio" name="vmO" value="almacen"><span><b>Sale de mi almacén</b><em>Baja el stock virtual y el físico</em></span></label>
      <label class="opc"><input type="radio" name="vmO" value="proveedor"><span><b>Lo envía el proveedor</b><em>Solo baja el stock virtual</em></span></label>
    </div></div>
    <div class="f"><span class="f__t">Prendas</span><div class="add">${selPrendas("vmP")}<select class="sel" id="vmC" disabled><option value="">Color</option></select><button class="btn" type="button" id="vmAdd">${I.mas}Agregar</button></div>
      <div id="vmLineas"></div></div>
    <div class="f"><label for="vmNota">Nota</label><input class="inp" id="vmNota" maxlength="300" autocomplete="off" placeholder="Opcional"></div>
    <div class="vm-tot" id="vmTot"></div>
    <div class="alert alert--bad" id="vmErr" hidden></div></div>`;
  const r = await ventana({
    titulo: "Nueva venta por mayor", ancho: true, fijo: true, html,
    acciones: [{ t: "Volver", v: false }, { t: `${I.check}Registrar venta`, clase: "btn--pri", v: true, antes: async d => {
      const err = $("#vmErr", d), mal = h => { err.innerHTML = h; err.hidden = false; err.scrollIntoView({ block: "nearest", behavior: "smooth" }); return false; };
      const cliente = $("#vmCli", d).value.trim(), origen = ($('input[name="vmO"]:checked', d) || {}).value;
      if (!cliente) return mal("Escribe el nombre del cliente.");
      if (!origen) return mal("Elige de dónde sale la mercadería.");
      const conCant = lineas.filter(l => unid(l) > 0);
      if (!conCant.length) return mal("Agrega al menos una prenda con su cantidad.");
      const sinPrecio = conCant.find(l => !(l.precio > 0));
      if (sinPrecio) return mal(`Pon el precio de ${esc(PROD[sinPrecio.slug].name)} · ${esc(sinPrecio.color)}.`);
      const items = conCant.flatMap(l => Object.entries(l.cant).filter(([, n]) => n > 0).map(([talla, cantidad]) => ({ slug: l.slug, color: l.color, talla, cantidad, precio: l.precio })));
      try {
        const res = await api("mayor", { method: "POST", body: { cliente, celular: $("#vmCel", d).value.trim(), documento: $("#vmDoc", d).value.trim(), nota: $("#vmNota", d).value.trim(), origen, items } });
        toast(`Venta ${res.codigo} registrada por ${money(res.total)}. El stock ya se actualizó.`);
        return true;
      } catch (x) {
        if (x.codigo === "sin_stock") return mal(`No hay stock virtual suficiente. No se registró nada.${listaFaltan(x.data.faltan)}`);
        if (x.codigo === "sin_stock_fisico") return mal(`No hay suficiente en tu almacén. No se registró nada. Elige «Lo envía el proveedor» o registra una entrada.${listaFaltan(x.data.faltan)}`);
        return mal(esc(msg(x)));
      }
    } }],
    alAbrir: d => {
      totales(d);
      $("#vmP", d).addEventListener("change", e => {
        const p = PROD[e.target.value], sel = $("#vmC", d);
        sel.innerHTML = p ? p.colors.map(([c]) => `<option value="${esc(c)}">${esc(c)}</option>`).join("") : `<option value="">Color</option>`;
        sel.disabled = !p || p.colors.length < 2;
      });
      $("#vmAdd", d).addEventListener("click", () => {
        const slug = $("#vmP", d).value, color = $("#vmC", d).value;
        if (!slug || !color) return toast("Elige la prenda y el color.");
        const ya = lineas.findIndex(l => l.slug === slug && l.color === color);
        if (ya < 0) { lineas.push({ slug, color, precio: INV[slug].precio_mayor ?? null, cant: {} }); pintarLineas(d); }
        const lin = $(`.lin[data-i="${ya < 0 ? lineas.length - 1 : ya}"]`, d), i = lin && $("input[data-t]", lin);
        if (i) { lin.scrollIntoView({ block: "nearest", behavior: "smooth" }); i.focus(); }
      });
      $("#vmLineas", d).addEventListener("input", e => {
        const inp = e.target, lin = inp.closest(".lin"); if (!lin) return;
        const l = lineas[+lin.dataset.i];
        if (inp.dataset.t) { const s = inp.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 4); if (s !== inp.value) inp.value = s; if (+s) l.cant[inp.dataset.t] = +s; else delete l.cant[inp.dataset.t]; }
        if ("precio" in inp.dataset) { const s = inp.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); if (s !== inp.value) inp.value = s; l.precio = s === "" ? null : +s; }
        $("[data-sub]", lin).innerHTML = subLinea(l); totales(d);
      });
      $("#vmLineas", d).addEventListener("click", e => { const b = e.target.closest("[data-quitar]"); if (!b) return; lineas.splice(+b.closest(".lin").dataset.i, 1); pintarLineas(d); });
      setTimeout(() => $("#vmCli", d).focus(), 80);
    },
  });
  return r === true;
}
/* Excel de ventas por mayor: cada prenda con su precio, costo y ganancia; y un resumen por venta */
function excelMayor(ventas) {
  const lineas = ventas.flatMap(v => v.items.map(i => {
    const venta = r2(i.precio * i.cantidad), costo = i.costo == null ? null : r2(i.costo * i.cantidad);
    return [v.codigo, v.fecha, v.cliente || "", v.documento || "", ORIGEN_STK[v.origen_stock] || "", i.nombre, i.color, i.talla, i.cantidad, i.precio, venta, i.costo, costo,
      costo == null ? null : r2(venta - costo), costo == null || !venta ? null : (venta - costo) / venta];
  }));
  const resumen = ventas.map(v => { const c = cuentaVenta(v); return [v.codigo, v.fecha, v.cliente || "", v.celular || "", v.documento || "", ORIGEN_STK[v.origen_stock] || "", c.u, v.total, c.costo == null ? null : r2(c.costo), c.g == null ? null : r2(c.g), c.g == null || !c.venta ? null : c.g / c.venta, v.admin || "", v.nota || ""]; });
  const suma = (filas, col) => r2(filas.reduce((s, f) => s + (f[col] || 0), 0));
  excel("ventas-por-mayor", [
    { nombre: "Ventas por mayor", columnas: [{ t: "Código", ancho: 11 }, { t: "Fecha", ancho: 17, f: "d" }, { t: "Cliente", ancho: 26 }, { t: "Celular", ancho: 13 }, { t: "DNI o RUC", ancho: 13 }, { t: "Sale de", ancho: 12 },
      { t: "Unidades", ancho: 10, f: "n" }, { t: "Total (S/)", ancho: 12, f: "s" }, { t: "Costo (S/)", ancho: 12, f: "s" }, { t: "Ganancia (S/)", ancho: 14, f: "s" }, { t: "Margen", ancho: 9, f: "p" }, { t: "Registró", ancho: 16 }, { t: "Nota", ancho: 30 }],
      filas: resumen, total: ["Total", null, null, null, null, null, suma(resumen, 6), suma(resumen, 7), suma(resumen, 8), suma(resumen, 9), null, null, null] },
    { nombre: "Prendas", columnas: [{ t: "Código", ancho: 11 }, { t: "Fecha", ancho: 17, f: "d" }, { t: "Cliente", ancho: 26 }, { t: "DNI o RUC", ancho: 13 }, { t: "Sale de", ancho: 12 }, { t: "Prenda", ancho: 34 }, { t: "Color", ancho: 16 }, { t: "Talla", ancho: 8 },
      { t: "Cantidad", ancho: 10, f: "n" }, { t: "Precio (S/)", ancho: 12, f: "s" }, { t: "Venta (S/)", ancho: 12, f: "s" }, { t: "Costo unitario (S/)", ancho: 17, f: "s" }, { t: "Costo total (S/)", ancho: 15, f: "s" }, { t: "Ganancia (S/)", ancho: 14, f: "s" }, { t: "Margen", ancho: 9, f: "p" }],
      filas: lineas, total: ["Total", null, null, null, null, null, null, null, suma(lineas, 8), null, suma(lineas, 10), null, suma(lineas, 12), suma(lineas, 13), null] },
  ]);
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
const VISTAS = { resumen: vResumen, pedidos: vPedidos, mayorista: vMayorista, stock: vStock, productos: vProductos, clientes: vClientes, reclamos: vReclamos };
(async () => {
  const act = location.hash.match(/^#activar=([\w-]+)/);
  if (act) return pantallaActivar(act[1]);
  try { YO = await api("yo"); } catch (_) { return pantallaEntrar(); }
  armar();
})();
})();
