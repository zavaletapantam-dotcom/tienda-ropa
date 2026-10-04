/* =========================================================
   APP — cabecera, pie, componentes y lógica de cada página.
   Los datos (productos, WhatsApp, etc.) están en datos.js
   ========================================================= */
(() => {
"use strict";

const C = window.CONFIG, PRODUCTS = window.PRODUCTS, CATS = window.CATEGORIES,
      COLS = window.COLLECTIONS, PACK = window.PACK, GUIDE = window.SIZE_GUIDE;
const PAGE = document.body.dataset.page || "";

/* ---------- Utilidades ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const money = n => "S/" + Number(n).toFixed(2);
const pct = p => (p.old ? Math.round((1 - p.price / p.old) * 100) : 0);
const imgSrc = f => "img/" + f;
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const findProduct = slug => PRODUCTS.find(p => p.slug === slug);
const catOf = slug => CATS.find(c => c.slug === slug);
const colOf = slug => COLS.find(c => c.slug === slug);
const productUrl = p => "producto.html?p=" + encodeURIComponent(p.slug);
const absUrl = rel => new URL(rel, location.href).href;
const waLink = msg => "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg);
const waPretty = () => "+" + C.whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4");
const isBottom = p => /^\d+$/.test(p.sizes[0]);
const generalMsg = () => `Hola ${C.store} 👋, quisiera más información sobre sus productos.`;

function productMsg(p, o = {}) {
  const l = [`Hola ${C.store} 👋, me interesa este producto:`, "", `🛍️ *${p.name}*`];
  if (o.color) l.push(`🎨 Color: ${o.color}`);
  if (o.size) l.push(`📏 Talla: ${o.size}`);
  if (o.qty > 1) l.push(`🔢 Cantidad: ${o.qty}`);
  l.push(`💰 Precio: ${money(p.price)}${o.qty > 1 ? " c/u" : ""}`);
  l.push("", `🔗 ${absUrl(productUrl(p))}`, "", "¿Está disponible?");
  return l.join("\n");
}
function searchProducts(q, list = PRODUCTS) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  return list.filter(p => {
    const hay = norm([p.name, catOf(p.cat)?.name, colOf(p.col)?.name, p.colors.map(c => c[0]).join(" ")].join(" "));
    return terms.every(t => hay.includes(t));
  });
}

/* ---------- Íconos ---------- */
const svg = (d, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 1.7),
  menu: svg('<path d="M3 7h18M3 12h18M9 17h12"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 1.7),
  prev: svg('<path d="m15 18-6-6 6-6"/>', 2),
  next: svg('<path d="m9 18 6-6-6-6"/>', 2),
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#i-wa"/></svg>',
  truck: svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  swap: svg('<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>'),
  card: svg('<rect x="3" y="6" width="18" height="13" rx="1"/><path d="M3 10h18M7 15h4"/>'),
  shield: svg('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  chat: svg('<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  share: svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>'),
  filter: svg('<path d="M4 6h16M7 12h10M10 18h4"/>', 1.8),
  home: svg('<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z"/>'),
  shirt: svg('<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3c0 2-2 3.5-4 3.5S8 5 8 3Z"/>'),
  gift: svg('<rect x="3" y="8" width="18" height="13"/><path d="M3 12h18M12 8v13M12 8C10 4 6 4 6 6.5S9 8 12 8Zm0 0c2-4 6-4 6-1.5S15 8 12 8Z"/>'),
  store: svg('<path d="M4 9h16l-1-5H5L4 9Zm0 0v11h16V9M9 20v-6h6v6"/>'),
  ruler: svg('<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>'),
  insta: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'),
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v7h4v-7h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.4 2.3 1.9 3.8 4 4v3.3c-1.5 0-2.9-.5-4-1.2V16a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.4a2.2 2.2 0 1 0 1.3 2V3h3.3Z"/></svg>',
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-wa" viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35Zm-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.88 9.88Zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42Z"/></symbol></svg>`;

/* =========================================================
   CABECERA, MENÚ, PIE Y ELEMENTOS FIJOS
   ========================================================= */
const NAV = [
  ["inicio", "Inicio", "index.html"],
  ["tienda", "Tienda", "tienda.html"],
  ["pack", "Pack Deluxe", "pack.html"],
  ["nosotros", "Nosotros", "nosotros.html"],
  ["contacto", "Contacto", "contacto.html"],
];
const isActive = key => key === PAGE || (key === "tienda" && PAGE === "producto");

function renderLayout() {
  const nav = NAV.map(([k, label, href]) => `<a href="${href}"${isActive(k) ? ' class="active" aria-current="page"' : ""}>${label}</a>`).join("");
  const top = `
  ${SPRITE}
  <div class="topbar" aria-hidden="true"><div class="topbar__track">${[
    "Envíos a todo el Perú", `Envío gratis desde ${money(C.envioGratisDesde)}`, "Nueva colección disponible",
    "Atención personalizada por WhatsApp", `Cambios hasta ${C.diasCambio} días después`,
  ].map(t => `<span>${t}</span>`).join("").repeat(2)}</div></div>
  <header class="header" id="header">
    <div class="wrap header__in">
      <a href="index.html" class="logo" aria-label="${esc(C.store)} — inicio">${esc(C.store)}<small>${esc(C.tagline)}</small></a>
      <nav class="nav" aria-label="Principal">${nav}</nav>
      <div class="header__icons">
        <button class="icon-btn" id="openSearch" aria-label="Buscar" aria-expanded="false" aria-controls="search">${I.search}</button>
        <a class="header__wa js-wa" href="#" target="_blank" rel="noopener">${I.wa}<span>Asesor</span></a>
        <button class="icon-btn burger" id="openMenu" aria-label="Abrir menú">${I.menu}</button>
      </div>
    </div>
    <div class="wrap search" id="search">
      <form action="tienda.html" method="get" role="search">
        <input type="search" name="q" id="searchInput" placeholder="Buscar polos, jeans, casacas…" autocomplete="off" aria-label="Buscar productos">
        <span class="search__hint">Enter ↵</span>
      </form>
      <div class="suggest" id="suggest"></div>
    </div>
  </header>
  <div class="drawer" id="drawer">
    <div class="drawer__bg" data-close></div>
    <div class="drawer__panel" role="dialog" aria-label="Menú">
      <button class="icon-btn drawer__close" data-close aria-label="Cerrar menú">${I.close}</button>
      ${NAV.map(([k, label, href]) => `<a href="${href}"${isActive(k) ? ' class="active"' : ""}>${label}<span aria-hidden="true">→</span></a>`).join("")}
      <p class="drawer__label">Categorías</p>
      <div class="drawer__cats">${CATS.map(c => `<a href="tienda.html?cat=${c.slug}">${c.name}</a>`).join("")}</div>
      <div class="drawer__wa"><a class="btn-wa js-wa" href="#" target="_blank" rel="noopener">${I.wa}Hablar con un asesor</a></div>
    </div>
  </div>`;

  const bottom = `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div>
          <div class="logo">${esc(C.store)}<small>${esc(C.tagline)}</small></div>
          <p>Ropa masculina con estilo y actitud. Escríbenos y un asesor te ayudará a elegir tu talla y prenda ideal.</p>
          <div class="socials">
            <a href="${C.social.instagram}" aria-label="Instagram">${I.insta}</a>
            <a href="${C.social.facebook}" aria-label="Facebook">${I.fb}</a>
            <a href="${C.social.tiktok}" aria-label="TikTok">${I.tiktok}</a>
            <a class="js-wa" href="#" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a>
          </div>
        </div>
        <div>
          <h2>Tienda</h2>
          ${CATS.slice(0, 5).map(c => `<a href="tienda.html?cat=${c.slug}">${c.name}</a>`).join("")}
          <a href="tienda.html?ofertas=1">Ofertas</a>
        </div>
        <div>
          <h2>Información</h2>
          <a href="nosotros.html">Nosotros</a>
          <a href="pack.html">Pack Deluxe</a>
          <a href="ayuda.html#envios">Envíos</a>
          <a href="ayuda.html#cambios">Cambios y devoluciones</a>
          <a href="contacto.html">Contacto</a>
        </div>
        <div>
          <h2>Ayuda</h2>
          <a class="js-wa" href="#" target="_blank" rel="noopener">WhatsApp: ${waPretty()}</a>
          <a href="mailto:${C.email}">${esc(C.email)}</a>
          <a href="ayuda.html#terminos">Términos y condiciones</a>
          <a href="ayuda.html#privacidad">Políticas de privacidad</a>
          <a href="ayuda.html#reclamaciones">Libro de reclamaciones</a>
        </div>
      </div>
      <div class="footer__bottom"><span>© ${new Date().getFullYear()} ${esc(C.store)}. Todos los derechos reservados.</span><span>${esc(C.city)}</span></div>
    </div>
  </footer>
  <a class="wa-float js-wa" href="#" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${I.wa}<span class="wa-float__tip">¿Te ayudamos con tu talla?</span></a>
  <nav class="tabbar" aria-label="Navegación móvil">
    <a href="index.html"${PAGE === "inicio" ? ' class="on"' : ""}>${I.home}Inicio</a>
    <a href="tienda.html"${PAGE === "tienda" || PAGE === "producto" ? ' class="on"' : ""}>${I.shirt}Tienda</a>
    <a href="pack.html"${PAGE === "pack" ? ' class="on"' : ""}>${I.gift}Pack</a>
    <a href="#" class="is-wa js-wa" target="_blank" rel="noopener">${I.wa}WhatsApp</a>
  </nav>
  <div class="modal" id="modal" aria-hidden="true">
    <div class="modal__bg" data-close></div>
    <div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="qvName">
      <button class="modal__close" data-close aria-label="Cerrar">${I.close}</button>
      <div class="qv__img"><img id="qvImg" alt=""></div>
      <div class="qv__info">
        <span class="pdp__cat" id="qvCat"></span>
        <h2 class="pdp__name" id="qvName"></h2>
        <div class="pdp__price" id="qvPrice"></div>
        <div class="opt" id="qvColorsWrap"><div class="opt-label">Color <em id="qvColorName"></em></div><div class="swatches" id="qvColors"></div></div>
        <div class="opt"><div class="opt-label">Talla</div><div class="size-btns" id="qvSizes"></div></div>
        <a class="btn-wa" id="qvWa" href="#" target="_blank" rel="noopener">${I.wa}Pedir por WhatsApp</a>
        <a class="qv__more" id="qvMore" href="#">Ver detalles del producto</a>
      </div>
    </div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.body.insertAdjacentHTML("afterbegin", top);
  document.body.insertAdjacentHTML("beforeend", bottom);
}

/* Rellena textos que vienen de CONFIG: <span data-c="email"></span> */
function fillConfig() {
  const v = {
    store: C.store, email: C.email, city: C.city, hours: C.hours, whatsapp: waPretty(),
    envioLima: money(C.envioLima), envioProvincia: money(C.envioProvincia),
    envioGratisDesde: money(C.envioGratisDesde), diasCambio: C.diasCambio,
    packDiscount: Math.round(PACK.discount * 100) + "%",
  };
  $$("[data-c]").forEach(el => { if (el.dataset.c in v) el.textContent = v[el.dataset.c]; });
  $$(".js-wa").forEach(a => { if (!a.dataset.msg) a.href = waLink(generalMsg()); });
}

/* ---------- Toast ---------- */
let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- Header: sombra, buscador, menú ---------- */
function initHeader() {
  const header = $("#header");
  addEventListener("scroll", () => header.classList.toggle("is-scrolled", scrollY > 10), { passive: true });

  const box = $("#search"), input = $("#searchInput"), sug = $("#suggest"), btn = $("#openSearch");
  btn.addEventListener("click", () => {
    const open = box.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    if (open) setTimeout(() => input.focus(), 150);
  });
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) { sug.innerHTML = ""; return; }
    const res = searchProducts(q);
    sug.innerHTML = res.length
      ? res.slice(0, 5).map(p => `<a href="${productUrl(p)}"><img src="${imgSrc(p.imgs[0])}" alt="" loading="lazy"><span><b>${esc(p.name)}</b><small>${esc(catOf(p.cat)?.name || "")}</small></span><span class="price-mini">${money(p.price)}</span></a>`).join("") +
        `<a class="suggest__all" href="tienda.html?q=${encodeURIComponent(q)}">Ver los ${res.length} resultados →</a>`
      : `<p style="padding:8px 8px 4px">No encontramos “${esc(q)}”. Prueba con polo, jean o casaca.</p>`;
  });
  if (PAGE === "tienda") input.value = new URLSearchParams(location.search).get("q") || "";

  const drawer = $("#drawer");
  $("#openMenu").addEventListener("click", () => drawer.classList.add("open"));
  $$("[data-close]", drawer).forEach(el => el.addEventListener("click", () => drawer.classList.remove("open")));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { drawer.classList.remove("open"); closeQV(); closeFilters(); } });
}

/* =========================================================
   COMPONENTES
   ========================================================= */
function priceHTML(p, withOff = true) {
  return `<b>${money(p.price)}</b>${p.old ? `<s>${money(p.old)}</s>` : ""}${withOff && p.old && !p.deal ? `<span class="off">-${pct(p)}%</span>` : ""}`;
}
function cardHTML(p) {
  const tag = p.deal ? `<span class="tag">-${pct(p)}%</span>` : p.isNew ? `<span class="tag tag--new">Nuevo</span>` : "";
  const url = productUrl(p);
  return `<article class="card">
    <div class="card__img">
      <a class="card__link" href="${url}" aria-label="Ver ${esc(p.name)}">
        <img class="img-main" src="${imgSrc(p.imgs[0])}" alt="${esc(p.name)}" loading="lazy">
        <img class="img-hover" src="${imgSrc(p.imgs[1] || p.imgs[0])}" alt="" loading="lazy">
      </a>
      ${tag}
      <div class="sizes">${p.sizes.map(s => `<button type="button" data-qv="${p.slug}" data-size="${s}" aria-label="Talla ${s} de ${esc(p.name)}">${s}</button>`).join("")}</div>
    </div>
    <div class="card__info">
      <div>
        <a class="card__name" href="${url}">${esc(p.name)}</a>
        <div class="price">${priceHTML(p)}</div>
      </div>
      <a class="wa-mini" href="${waLink(productMsg(p))}" target="_blank" rel="noopener" aria-label="Consultar ${esc(p.name)} por WhatsApp" title="Consultar por WhatsApp">${I.wa}</a>
    </div>
  </article>`;
}
function catCardHTML(c) {
  const n = PRODUCTS.filter(p => p.cat === c.slug).length;
  return `<a href="tienda.html?cat=${c.slug}" class="cat">
    <img src="${imgSrc(c.img)}" alt="" loading="lazy">
    <div class="cat__txt"><h3>${c.name}</h3><span>${n} ${n === 1 ? "prenda" : "prendas"}</span></div>
  </a>`;
}
function arrowsHTML(forId) {
  return `<div class="arrows" data-for="${forId}"><button class="arrow" data-dir="-1" aria-label="Anterior">${I.prev}</button><button class="arrow" data-dir="1" aria-label="Siguiente">${I.next}</button></div>`;
}
function perksHTML() {
  const items = [
    [I.truck, "Envío gratis", `En compras desde ${money(C.envioGratisDesde)}`],
    [I.pin, "Envíos a todo el Perú", `Lima ${money(C.envioLima)} · Provincia ${money(C.envioProvincia)}`],
    [I.swap, "Cambios", `Hasta ${C.diasCambio} días después de tu compra`],
    [I.card, "Pago seguro", "Yape, Plin, tarjeta y transferencia"],
    [I.shield, "Calidad garantizada", "Telas premium en cada prenda"],
    [I.chat, "Asesoría", "Te atendemos por WhatsApp"],
  ];
  return `<div class="wrap">
    <div class="label center" style="margin-bottom:28px"><span class="line"></span>Garantías<span class="line"></span></div>
    <div class="perks__grid">${items.map(([ic, t, d]) => `<div class="perk">${ic}<h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
  </div>`;
}

/* ---------- Carruseles ---------- */
function step(track) {
  const c = track.firstElementChild;
  return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 300;
}
function updateArrows() {
  $$(".arrows").forEach(a => {
    const t = document.getElementById(a.dataset.for); if (!t) return;
    const [prev, next] = $$(".arrow", a);
    prev.disabled = t.scrollLeft <= 2;
    next.disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 2;
  });
}
function initCarousels() {
  $$(".arrows").forEach(a => {
    const t = document.getElementById(a.dataset.for); if (!t || a.dataset.ready) return;
    a.dataset.ready = 1;
    $$(".arrow", a).forEach(b => b.addEventListener("click", () => t.scrollBy({ left: step(t) * +b.dataset.dir })));
    t.addEventListener("scroll", () => requestAnimationFrame(updateArrows), { passive: true });
  });
  addEventListener("resize", updateArrows);
  $$("[data-auto]").forEach(t => {
    let hover = false;
    t.addEventListener("mouseenter", () => (hover = true));
    t.addEventListener("mouseleave", () => (hover = false));
    setInterval(() => {
      if (hover || document.hidden || t.scrollWidth <= t.clientWidth + 4) return;
      const atEnd = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
      t.scrollTo({ left: atEnd ? 0 : t.scrollLeft + step(t) });
    }, 4200);
  });
  updateArrows();
}

/* ---------- Aparición al hacer scroll ---------- */
function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("pre"); io.observe(el); }
  });
}

/* ---------- Botón de WhatsApp que exige talla ---------- */
function guardSize(link, getSize, sizesEl) {
  link.addEventListener("click", e => {
    if (getSize()) return;
    e.preventDefault();
    toast("Elige tu talla primero");
    sizesEl.classList.remove("shake"); void sizesEl.offsetWidth; sizesEl.classList.add("shake");
  });
}

/* ---------- Vista rápida ---------- */
const qv = { p: null, size: null, color: null };
function openQV(slug, size) {
  const p = findProduct(slug); if (!p) return;
  Object.assign(qv, { p, size: size || null, color: p.colors[0][0] });
  $("#qvImg").src = imgSrc(p.imgs[0]); $("#qvImg").alt = p.name;
  $("#qvCat").textContent = [catOf(p.cat)?.name, colOf(p.col)?.name].filter(Boolean).join(" · ");
  $("#qvName").textContent = p.name;
  $("#qvPrice").innerHTML = priceHTML(p, false) + (p.old ? `<span class="tag">-${pct(p)}%</span>` : "");
  $("#qvColorName").textContent = qv.color;
  $("#qvColors").innerHTML = p.colors.map(([n, c], i) => `<button type="button" class="${i ? "" : "on"}" style="background:${c}" title="${n}" aria-label="Color ${n}" data-c="${n}"></button>`).join("");
  $$("#qvColors button").forEach(b => b.addEventListener("click", () => {
    $$("#qvColors button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    qv.color = b.dataset.c; $("#qvColorName").textContent = qv.color; updateQV();
  }));
  $("#qvSizes").innerHTML = p.sizes.map(s => `<button type="button"${s === qv.size ? ' class="on"' : ""}>${s}</button>`).join("");
  $$("#qvSizes button").forEach(b => b.addEventListener("click", () => {
    $$("#qvSizes button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    qv.size = b.textContent; updateQV();
  }));
  $("#qvMore").href = productUrl(p);
  updateQV();
  const m = $("#modal"); m.classList.add("open"); m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function updateQV() { $("#qvWa").href = waLink(productMsg(qv.p, { size: qv.size, color: qv.color })); }
function closeQV() {
  const m = $("#modal"); if (!m || !m.classList.contains("open")) return;
  m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
}
function initQV() {
  $$("[data-close]", $("#modal")).forEach(el => el.addEventListener("click", closeQV));
  guardSize($("#qvWa"), () => qv.size, $("#qvSizes"));
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-qv]");
    if (b) { e.preventDefault(); openQV(b.dataset.qv, b.dataset.size); }
  });
}

/* =========================================================
   PÁGINA: INICIO
   ========================================================= */
function initInicio() {
  // Banner principal
  const slides = $$(".slide");
  if (slides.length) {
    const count = $("#heroCount"), bar = $("#heroBar"), dots = $("#heroDots");
    let i = 0, timer;
    dots.innerHTML = slides.map((_, k) => `<button type="button" aria-label="Ir a la imagen ${k + 1}"></button>`).join("");
    const go = n => {
      slides[i].classList.remove("active");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("active");
      $$("button", dots).forEach((d, k) => d.classList.toggle("on", k === i));
      count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run");
      clearTimeout(timer); timer = setTimeout(() => go(i + 1), 6000);
    };
    $$("button", dots).forEach((d, k) => d.addEventListener("click", () => go(k)));
    $("#heroPrev").addEventListener("click", () => go(i - 1));
    $("#heroNext").addEventListener("click", () => go(i + 1));
    let x0 = null;
    const hero = $("#hero");
    hero.addEventListener("touchstart", e => (x0 = e.touches[0].clientX), { passive: true });
    hero.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  }

  // Cuenta regresiva hasta medianoche
  const els = [$("#tH"), $("#tM"), $("#tS")];
  if (els[0]) {
    const tick = () => {
      const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((end - now) / 1000));
      const v = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, "0"));
      els.forEach((el, k) => {
        if (el.textContent !== v[k]) { el.textContent = v[k]; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
      });
    };
    tick(); setInterval(tick, 1000);
  }

  const fill = (id, list) => { const el = document.getElementById(id); if (el) el.innerHTML = list.map(cardHTML).join(""); };
  fill("trackDeals", PRODUCTS.filter(p => p.deal));
  fill("trackNew1", PRODUCTS.filter(p => p.col === "perfect-business"));
  fill("trackNew2", PRODUCTS.filter(p => p.isNew && p.col !== "perfect-business"));
  const cats = $("#trackCats"); if (cats) cats.innerHTML = CATS.map(catCardHTML).join("");
}

/* =========================================================
   PÁGINA: TIENDA
   ========================================================= */
const PER_PAGE = 12;
const SORTS = [
  ["recomendado", "Recomendado"], ["nuevo", "Novedades"], ["precio-asc", "Precio: menor a mayor"],
  ["precio-desc", "Precio: mayor a menor"], ["descuento", "Mayor descuento"], ["nombre", "Nombre A–Z"],
];
let shop = {};
function readShop() {
  const u = new URLSearchParams(location.search);
  shop = {
    cat: u.get("cat") || "", col: u.get("col") || "", q: u.get("q") || "", talla: u.get("talla") || "",
    min: u.get("min") || "", max: u.get("max") || "", ofertas: u.get("ofertas") === "1",
    orden: u.get("orden") || "recomendado", page: Math.max(1, parseInt(u.get("page") || "1", 10) || 1),
  };
}
function writeShop() {
  const u = new URLSearchParams();
  ["cat", "col", "q", "talla", "min", "max"].forEach(k => shop[k] && u.set(k, shop[k]));
  if (shop.ofertas) u.set("ofertas", "1");
  if (shop.orden !== "recomendado") u.set("orden", shop.orden);
  if (shop.page > 1) u.set("page", shop.page);
  const qs = u.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
}
function filtered() {
  let list = PRODUCTS.slice();
  if (shop.q) list = searchProducts(shop.q, list);
  if (shop.cat) list = list.filter(p => p.cat === shop.cat);
  if (shop.col) list = list.filter(p => p.col === shop.col);
  if (shop.talla) list = list.filter(p => p.sizes.includes(shop.talla));
  if (shop.min !== "") list = list.filter(p => p.price >= +shop.min);
  if (shop.max !== "") list = list.filter(p => p.price <= +shop.max);
  if (shop.ofertas) list = list.filter(p => p.deal);
  const by = {
    "precio-asc": (a, b) => a.price - b.price,
    "precio-desc": (a, b) => b.price - a.price,
    descuento: (a, b) => pct(b) - pct(a),
    nuevo: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0),
    nombre: (a, b) => a.name.localeCompare(b.name, "es"),
  }[shop.orden];
  return by ? list.sort(by) : list;
}
function closeFilters() {
  const f = $("#filters"); if (!f) return;
  f.classList.remove("open"); $("#fOverlay")?.classList.remove("show"); document.body.style.overflow = "";
}
function initTienda() {
  readShop();
  const allSizes = [...new Set(PRODUCTS.flatMap(p => p.sizes))];

  $("#fSort").innerHTML = SORTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  $("#fSizes").innerHTML = allSizes.map(s => `<button type="button" data-s="${s}">${s}</button>`).join("");

  const set = (patch) => { Object.assign(shop, patch, patch.page ? {} : { page: 1 }); writeShop(); render(); };

  $("#fCats").addEventListener("click", e => { const b = e.target.closest("button"); if (b) set({ cat: b.dataset.v }); });
  $("#fCols").addEventListener("click", e => { const b = e.target.closest("button"); if (b) set({ col: shop.col === b.dataset.v ? "" : b.dataset.v }); });
  $("#shopCats").addEventListener("click", e => { const b = e.target.closest("button"); if (b) set({ cat: b.dataset.v }); });
  $("#fSizes").addEventListener("click", e => { const b = e.target.closest("button"); if (b) set({ talla: shop.talla === b.dataset.s ? "" : b.dataset.s }); });
  $("#fPrice").addEventListener("submit", e => { e.preventDefault(); set({ min: $("#fMin").value.trim(), max: $("#fMax").value.trim() }); closeFilters(); });
  $("#fDeals").addEventListener("change", e => set({ ofertas: e.target.checked }));
  $("#fSort").addEventListener("change", e => set({ orden: e.target.value }));
  $("#fClear").addEventListener("click", () => { shop = { cat: "", col: "", q: "", talla: "", min: "", max: "", ofertas: false, orden: shop.orden, page: 1 }; writeShop(); render(); closeFilters(); });
  $("#chips").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) set({ [b.dataset.rm]: b.dataset.rm === "ofertas" ? false : "" }); });
  $("#pager").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    set({ page: +b.dataset.p });
    $("#shopTop").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#openFilters").addEventListener("click", () => { $("#filters").classList.add("open"); $("#fOverlay").classList.add("show"); document.body.style.overflow = "hidden"; });
  $$("[data-close-filters]").forEach(el => el.addEventListener("click", closeFilters));

  function render() {
    // Lista de categorías y colecciones
    const catBtns = [{ slug: "", name: "Todas" }, ...CATS].map(c => {
      const n = c.slug ? PRODUCTS.filter(p => p.cat === c.slug).length : PRODUCTS.length;
      return [c, n];
    });
    $("#fCats").innerHTML = catBtns.map(([c, n]) => `<button type="button" data-v="${c.slug}" class="${shop.cat === c.slug ? "on" : ""}">${c.name}<small>${n}</small></button>`).join("");
    $("#shopCats").innerHTML = catBtns.map(([c]) => `<button type="button" data-v="${c.slug}" class="${shop.cat === c.slug ? "on" : ""}">${c.name}</button>`).join("");
    $("#fCols").innerHTML = COLS.map(c => `<button type="button" data-v="${c.slug}" class="${shop.col === c.slug ? "on" : ""}">${c.name}<small>${PRODUCTS.filter(p => p.col === c.slug).length}</small></button>`).join("");
    $$("#fSizes button").forEach(b => b.classList.toggle("on", b.dataset.s === shop.talla));
    $("#fMin").value = shop.min; $("#fMax").value = shop.max;
    $("#fDeals").checked = shop.ofertas;
    $("#fSort").value = shop.orden;

    // Encabezado según filtro
    const cat = catOf(shop.cat), col = colOf(shop.col);
    const title = shop.q ? `“${shop.q}”` : cat ? cat.name : col ? col.name : shop.ofertas ? "Ofertas" : "Tienda";
    $("#shopTitle").textContent = title;
    $("#shopSub").textContent = shop.q ? "Resultados de tu búsqueda" : col ? col.desc : cat ? `Todos nuestros ${cat.name.toLowerCase()} en un solo lugar.` : shop.ofertas ? "Precios especiales por tiempo limitado." : "Encuentra tu próxima prenda favorita. Consulta tallas y stock por WhatsApp.";
    $("#shopCrumb").textContent = title;
    $("#shopHeroImg").src = imgSrc(cat ? cat.img : "camisas-dobladas.jpg");
    document.title = `${shop.q ? "Búsqueda" : title} · ${C.store}`;

    // Filtros activos
    const chips = [];
    if (shop.q) chips.push(["q", `Búsqueda: ${shop.q}`]);
    if (cat) chips.push(["cat", cat.name]);
    if (col) chips.push(["col", col.name]);
    if (shop.talla) chips.push(["talla", `Talla ${shop.talla}`]);
    if (shop.min) chips.push(["min", `Desde ${money(+shop.min)}`]);
    if (shop.max) chips.push(["max", `Hasta ${money(+shop.max)}`]);
    if (shop.ofertas) chips.push(["ofertas", "Solo ofertas"]);
    $("#chips").innerHTML = chips.map(([k, l]) => `<button type="button" class="chip" data-rm="${k}" aria-label="Quitar filtro ${esc(l)}">${esc(l)} ${I.close}</button>`).join("");
    $("#chips").hidden = !chips.length;
    const nActive = chips.filter(c => c[0] !== "q").length;
    $("#openFilters").innerHTML = `${I.filter.replace("<svg", '<svg width="16" height="16"')}Filtros${nActive ? ` <b>${nActive}</b>` : ""}`;

    // Productos
    const list = filtered(), total = list.length, pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (shop.page > pages) shop.page = pages;
    const from = (shop.page - 1) * PER_PAGE;
    const pageItems = list.slice(from, from + PER_PAGE);
    $("#shopCount").innerHTML = total
      ? `<b>${from + 1}–${from + pageItems.length}</b> de <b>${total}</b> productos · página ${shop.page} de ${pages}`
      : "0 productos";
    $("#grid").innerHTML = total
      ? pageItems.map(cardHTML).join("")
      : `<div class="empty" style="grid-column:1/-1"><h2>No encontramos prendas con esos filtros</h2><p>Prueba quitando algún filtro o escríbenos: te ayudamos a encontrar lo que buscas.</p><a class="btn btn--dark js-wa-search" href="#" target="_blank" rel="noopener">${I.wa.replace("<svg", '<svg width="16" height="16"')}Preguntar por WhatsApp</a></div>`;
    const ask = $(".js-wa-search", $("#grid"));
    if (ask) ask.href = waLink(`Hola ${C.store} 👋, estoy buscando ${shop.q || (cat ? cat.name.toLowerCase() : "una prenda")}${shop.talla ? ` en talla ${shop.talla}` : ""}. ¿Me pueden ayudar?`);

    // Paginación
    if (pages > 1) {
      let b = `<button type="button" data-p="${shop.page - 1}" ${shop.page === 1 ? "disabled" : ""} aria-label="Página anterior">${I.prev.replace("<svg", '<svg width="16" height="16"')}</button>`;
      for (let n = 1; n <= pages; n++) b += `<button type="button" data-p="${n}" class="${n === shop.page ? "on" : ""}" ${n === shop.page ? 'aria-current="page"' : ""}>${n}</button>`;
      b += `<button type="button" data-p="${shop.page + 1}" ${shop.page === pages ? "disabled" : ""} aria-label="Página siguiente">${I.next.replace("<svg", '<svg width="16" height="16"')}</button>`;
      $("#pager").innerHTML = b;
    } else $("#pager").innerHTML = "";
  }
  render();
}

/* =========================================================
   PÁGINA: PRODUCTO
   ========================================================= */
function initProducto() {
  const root = $("#pdp");
  const p = findProduct(new URLSearchParams(location.search).get("p"));
  if (!p) {
    root.innerHTML = `<div class="notfound wrap"><span class="label center">Error 404</span><h1>No encontramos esta prenda</h1><p>Puede que ya no esté disponible o que el enlace esté incompleto. Mira todo lo que tenemos en la tienda.</p><a class="btn btn--dark" href="tienda.html">Ir a la tienda <span>→</span></a></div>`;
    return;
  }
  const cat = catOf(p.cat), col = colOf(p.col), d = pct(p);
  const guide = isBottom(p) ? GUIDE.bottoms : GUIDE.tops;
  const state = { size: null, color: p.colors[0][0], qty: 1 };
  document.title = `${p.name} · ${C.store}`;
  $('meta[name="description"]')?.setAttribute("content", `${p.name} a ${money(p.price)}. ${p.desc}`);

  root.innerHTML = `
  <div class="wrap">
    <nav class="crumbs" aria-label="Ruta"><a href="index.html">Inicio</a><span aria-hidden="true">/</span><a href="tienda.html">Tienda</a><span aria-hidden="true">/</span><a href="tienda.html?cat=${p.cat}">${cat?.name || ""}</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></nav>
    <div class="pdp__layout">
      <div class="gallery">
        <div class="gallery__thumbs">${p.imgs.map((f, i) => `<button type="button" class="${i ? "" : "on"}" data-i="${i}" aria-label="Ver foto ${i + 1}"><img src="${imgSrc(f)}" alt=""></button>`).join("")}</div>
        <div class="gallery__wrap">
          <div class="gallery__main" id="gMain">${p.imgs.map((f, i) => `<figure><img src="${imgSrc(f)}" alt="${esc(p.name)}${i ? ` — foto ${i + 1}` : ""}"></figure>`).join("")}</div>
          ${p.deal ? `<span class="tag">-${d}%</span>` : p.isNew ? `<span class="tag tag--new">Nuevo</span>` : ""}
          <div class="gallery__dots" id="gDots">${p.imgs.map((_, i) => `<span class="${i ? "" : "on"}"></span>`).join("")}</div>
        </div>
      </div>
      <div class="pdp__info">
        <span class="pdp__cat"><a href="tienda.html?cat=${p.cat}">${cat?.name || ""}</a>${col ? ` · <a href="tienda.html?col=${p.col}">${col.name}</a>` : ""}</span>
        <h1 class="pdp__name">${esc(p.name)}</h1>
        <div class="pdp__price">${priceHTML(p, false)}${p.old ? `<span class="tag">-${d}%</span>` : ""}</div>
        ${p.old ? `<p class="pdp__save">Ahorras ${money(p.old - p.price)}</p>` : ""}
        <p class="pdp__desc">${esc(p.desc)}</p>
        <div class="opt">
          <div class="opt-label">Color <em id="pColorName">${esc(state.color)}</em></div>
          <div class="swatches" id="pColors">${p.colors.map(([n, c], i) => `<button type="button" class="${i ? "" : "on"}" style="background:${c}" title="${n}" aria-label="Color ${n}" data-c="${n}"></button>`).join("")}</div>
        </div>
        <div class="opt">
          <div class="opt-label">Talla <button type="button" class="link-btn" id="guideBtn" aria-expanded="false" aria-controls="guide">Guía de tallas</button></div>
          <div class="size-btns" id="pSizes">${p.sizes.map(s => `<button type="button" data-s="${s}">${s}</button>`).join("")}</div>
          <div class="guide" id="guide">
            <div class="guide__scroll"><table><thead><tr>${guide.head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${guide.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
            <p>Medidas de la prenda en centímetros. ¿Dudas? Escríbenos y te ayudamos a elegir.</p>
          </div>
        </div>
        <div class="opt">
          <div class="opt-label">Cantidad</div>
          <div class="pdp__actions">
            <div class="qty"><button type="button" data-q="-1" aria-label="Quitar uno">−</button><output id="pQty" aria-live="polite">1</output><button type="button" data-q="1" aria-label="Agregar uno">+</button></div>
            <a class="btn-wa" id="pWa" href="#" target="_blank" rel="noopener">${I.wa}Pedir por WhatsApp</a>
          </div>
          <p class="pdp__note">Un asesor confirmará <b>stock, talla y costo de envío</b> contigo antes de pagar.</p>
          <button type="button" class="pdp__share" id="pShare">${I.share}Compartir este producto</button>
        </div>
        <div class="pdp__trust">
          <div>${I.truck}<span><b>Envío a todo el Perú.</b> Gratis desde ${money(C.envioGratisDesde)}</span></div>
          <div>${I.swap}<span><b>Cambios</b> hasta ${C.diasCambio} días después de recibir tu pedido</span></div>
          <div>${I.card}<span><b>Paga como prefieras:</b> Yape, Plin, tarjeta o transferencia</span></div>
        </div>
        <div class="acc">
          <details open><summary>Detalles de la prenda</summary><div class="acc__body"><dl><dt>Ajuste</dt><dd>${esc(p.fit)}</dd><dt>Material</dt><dd>${esc(p.material)}</dd><dt>Tallas</dt><dd>${p.sizes.join(" · ")}</dd><dt>Colores</dt><dd>${p.colors.map(c => c[0]).join(", ")}</dd></dl></div></details>
          <details><summary>Cuidado</summary><div class="acc__body">Lavar a máquina en agua fría con colores similares. Planchar al revés a temperatura media. No usar secadora ni lejía para mantener el color y la forma.</div></details>
          <details><summary>Envíos y cambios</summary><div class="acc__body">Lima: ${money(C.envioLima)} · Provincia: ${money(C.envioProvincia)}. Envío gratis en compras desde ${money(C.envioGratisDesde)}. Puedes cambiar tu prenda hasta ${C.diasCambio} días después de recibirla, sin uso y con etiqueta. <a class="link-btn" href="ayuda.html#cambios">Ver políticas</a></div></details>
        </div>
      </div>
    </div>
  </div>
  <section class="related">
    <div class="wrap">
      <div class="sec-head"><div><div class="label">También te puede gustar<span class="line"></span></div><h2 class="h2">Completa tu look</h2></div><div class="head-right"><a class="see-all" href="tienda.html?cat=${p.cat}">Ver ${cat?.name.toLowerCase() || "todo"} <span>→</span></a>${arrowsHTML("trackRel")}</div></div>
      <div class="track" id="trackRel"></div>
    </div>
  </section>
  <div class="buybar"><div><small>${p.old ? `Antes ${money(p.old)}` : "Precio"}</small><b>${money(p.price)}</b></div><a class="btn-wa" id="pWa2" href="#" target="_blank" rel="noopener">${I.wa}Pedir por WhatsApp</a></div>`;

  // Relacionados: misma categoría, luego misma colección
  const rel = [...PRODUCTS.filter(x => x.cat === p.cat && x !== p), ...PRODUCTS.filter(x => x.col === p.col && x.cat !== p.cat)].slice(0, 8);
  $("#trackRel").innerHTML = rel.map(cardHTML).join("");

  // Galería
  const main = $("#gMain"), thumbs = $$(".gallery__thumbs button"), dots = $$("#gDots span");
  const setActive = i => { thumbs.forEach((t, k) => t.classList.toggle("on", k === i)); dots.forEach((t, k) => t.classList.toggle("on", k === i)); };
  thumbs.forEach(t => t.addEventListener("click", () => main.scrollTo({ left: main.clientWidth * +t.dataset.i, behavior: "smooth" })));
  main.addEventListener("scroll", () => setActive(Math.round(main.scrollLeft / main.clientWidth)), { passive: true });
  if (matchMedia("(hover:hover)").matches) {
    $$("figure", main).forEach(f => {
      f.addEventListener("mouseenter", () => f.classList.add("zoom"));
      f.addEventListener("mouseleave", () => f.classList.remove("zoom"));
      f.addEventListener("mousemove", e => {
        const r = f.getBoundingClientRect();
        f.style.setProperty("--zx", ((e.clientX - r.left) / r.width) * 100 + "%");
        f.style.setProperty("--zy", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  // Opciones
  const update = () => {
    const href = waLink(productMsg(p, state));
    $("#pWa").href = href; $("#pWa2").href = href;
  };
  $$("#pColors button").forEach(b => b.addEventListener("click", () => {
    $$("#pColors button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    state.color = b.dataset.c; $("#pColorName").textContent = state.color; update();
  }));
  $$("#pSizes button").forEach(b => b.addEventListener("click", () => {
    $$("#pSizes button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    state.size = b.dataset.s; update();
  }));
  $$("[data-q]").forEach(b => b.addEventListener("click", () => {
    state.qty = Math.min(10, Math.max(1, state.qty + +b.dataset.q)); $("#pQty").textContent = state.qty; update();
  }));
  $("#guideBtn").addEventListener("click", e => {
    const open = $("#guide").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", open);
  });
  [$("#pWa"), $("#pWa2")].forEach(a => guardSize(a, () => state.size, $("#pSizes")));
  $("#pWa2").addEventListener("click", () => { if (!state.size) $("#pSizes").scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("#pShare").addEventListener("click", async () => {
    const data = { title: p.name, text: `${p.name} — ${money(p.price)}`, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (_) {} return; }
    try { await navigator.clipboard.writeText(location.href); toast("Enlace copiado"); }
    catch (_) { toast("Copia el enlace desde la barra del navegador"); }
  });
  update();
}

/* =========================================================
   PÁGINA: PACK
   ========================================================= */
function initPack() {
  const steps = PACK.steps.map(s => ({ ...s, items: PRODUCTS.filter(p => s.cats.includes(p.cat)) }));
  const sel = steps.map(() => ({ slug: null, size: null }));
  const off = Math.round(PACK.discount * 100);

  $("#packSteps").innerHTML = steps.map((s, i) => `
    <section class="step" id="step${i}" aria-labelledby="stepT${i}" style="padding:0">
      <div class="step__head"><span class="step__num">${i + 1}</span><h2 id="stepT${i}">${s.title}</h2><small id="stepS${i}">Sin elegir</small></div>
      <div class="picks" role="radiogroup" aria-labelledby="stepT${i}">${s.items.map(p => `
        <button type="button" class="pick" role="radio" aria-checked="false" data-step="${i}" data-slug="${p.slug}">
          <img src="${imgSrc(p.imgs[0])}" alt="" loading="lazy"><div><b>${esc(p.name)}</b><span>${money(p.price)}</span></div><i aria-hidden="true">✓</i>
        </button>`).join("")}</div>
      <div class="step__sizes" id="stepZ${i}" hidden></div>
    </section>`).join("");

  $("#packSteps").addEventListener("click", e => {
    const pick = e.target.closest(".pick");
    if (pick) {
      const i = +pick.dataset.step;
      sel[i] = { slug: pick.dataset.slug, size: null };
      $$(`.pick[data-step="${i}"]`).forEach(b => { const on = b === pick; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
      const p = findProduct(sel[i].slug), z = $("#stepZ" + i);
      z.hidden = false;
      z.innerHTML = `<span>Talla</span><div class="size-btns">${p.sizes.map(s => `<button type="button" data-step="${i}" data-s="${s}">${s}</button>`).join("")}</div>`;
      update(); return;
    }
    const sz = e.target.closest("[data-s]");
    if (sz) {
      const i = +sz.dataset.step;
      sel[i].size = sz.dataset.s;
      $$(`#stepZ${i} button`).forEach(b => b.classList.toggle("on", b === sz));
      update();
      const next = sel.findIndex(x => !x.slug || !x.size);
      if (next > i) setTimeout(() => $("#step" + next).scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    }
  });

  function update() {
    const chosen = sel.map(x => (x.slug ? findProduct(x.slug) : null));
    const done = sel.filter(x => x.slug && x.size).length;
    const complete = done === steps.length;
    const sub = chosen.reduce((t, p) => t + (p ? p.price : 0), 0);
    const disc = complete ? sub * PACK.discount : 0;
    const total = sub - disc;

    steps.forEach((s, i) => {
      const x = sel[i], st = $("#stepS" + i);
      st.textContent = !x.slug ? "Sin elegir" : !x.size ? "Falta la talla" : `Talla ${x.size} ✓`;
      $("#step" + i).classList.toggle("done", !!(x.slug && x.size));
    });

    $("#sumList").innerHTML = steps.map((s, i) => {
      const p = chosen[i];
      return p
        ? `<div class="summary__item"><img src="${imgSrc(p.imgs[0])}" alt=""><span><b>${esc(p.name)}</b>${sel[i].size ? `Talla ${sel[i].size}` : `<span style="color:var(--accent)">Elige talla</span>`}</span><em>${money(p.price)}</em></div>`
        : `<div class="summary__item"><span class="ph">${i + 1}</span><span>${s.title}</span><em>—</em></div>`;
    }).join("");
    $("#sumSub").textContent = money(sub);
    $("#sumDisc").textContent = complete ? "−" + money(disc) : `al completar ${steps.length} prendas`;
    $("#sumTotal").textContent = money(total);
    $("#packProgress").style.width = (done / steps.length) * 100 + "%";
    const missing = steps.filter((s, i) => !(sel[i].slug && sel[i].size)).map(s => s.title.replace(/^Elige tu /i, ""));
    $("#sumHint").textContent = complete ? `Ahorras ${money(disc)} con el pack` : `Te falta: ${missing.join(", ")}`;
    $("#pbTotal").textContent = money(total);
    $("#pbInfo").textContent = complete ? `Pack completo · −${off}%` : `${done} de ${steps.length} prendas`;

    const msg = [`Hola ${C.store} 👋, quiero armar mi *${PACK.name}*:`, "",
      ...chosen.map((p, i) => p ? `${i + 1}. ${p.name} — Talla ${sel[i].size || "?"} — ${money(p.price)}` : ""),
      "", `Precio normal: ${money(sub)}`, `Precio pack (−${off}%): ${money(total)}`, "", "¿Está disponible?"].join("\n");
    [$("#sumWa"), $("#pbWa")].forEach(a => { a.href = complete ? waLink(msg) : "#"; a.setAttribute("aria-disabled", !complete); });
  }
  [$("#sumWa"), $("#pbWa")].forEach(a => a.addEventListener("click", e => {
    if (a.getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      const i = sel.findIndex(x => !x.slug || !x.size);
      toast(sel[i].slug ? "Elige la talla de tu prenda" : `Falta: ${steps[i].title.toLowerCase()}`);
      $("#step" + i).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }));
  update();
}

/* =========================================================
   PÁGINA: CONTACTO
   ========================================================= */
function initContacto() {
  $("#contactCards").innerHTML = `
    <a class="c-card c-card--wa js-wa" href="#" target="_blank" rel="noopener">${I.wa}<span><small>WhatsApp</small><b>${waPretty()}</b></span><span class="copy">Escribir</span></a>
    <div class="c-card">${I.mail}<span><small>Correo</small><b>${esc(C.email)}</b></span><button type="button" class="copy" data-copy="${esc(C.email)}">Copiar</button></div>
    <div class="c-card">${I.pin}<span><small>Ubicación</small><b>${esc(C.city)}</b></span></div>
    <div class="c-card">${I.clock}<span><small>Horario de atención</small><b>${esc(C.hours)}</b></span></div>`;
  $("#contactSocial").innerHTML = `<a href="${C.social.instagram}" aria-label="Instagram">${I.insta.replace("<svg", '<svg width="18" height="18"')}</a><a href="${C.social.facebook}" aria-label="Facebook">${I.fb.replace("<svg", '<svg width="18" height="18"')}</a><a href="${C.social.tiktok}" aria-label="TikTok">${I.tiktok.replace("<svg", '<svg width="18" height="18"')}</a>`;
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Copiado"); } catch (_) { toast(b.dataset.copy); }
  }));
  $(".biz .btn-wa").href = waLink(`Hola ${C.store} 👋, me interesa vender sus productos / comprar por mayor. ¿Me pueden dar información?`);
  $(".biz .btn-wa").dataset.msg = "1";

  const form = $("#contactForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    ["cName", "cMsg"].forEach(id => {
      const f = document.getElementById(id), wrap = f.closest(".field"), bad = !f.value.trim();
      wrap.classList.toggle("err", bad); if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    const v = id => document.getElementById(id).value.trim();
    const lines = [`Hola ${C.store} 👋, les escribo desde la web.`, "", `👤 Nombre: ${v("cName")}`];
    if (v("cPhone")) lines.push(`📞 Teléfono: ${v("cPhone")}`);
    lines.push(`📌 Motivo: ${v("cTopic")}`, "", v("cMsg"));
    const url = waLink(lines.join("\n"));
    const w = window.open(url, "_blank");
    if (w) w.opener = null; else location.href = url;
    toast("Abriendo WhatsApp con tu mensaje…");
  });
  $$("#contactForm input, #contactForm textarea").forEach(f => f.addEventListener("input", () => f.closest(".field").classList.remove("err")));

  const faqs = [
    ["¿Cuánto cuesta el envío?", `El envío en Lima cuesta ${money(C.envioLima)} y a provincia ${money(C.envioProvincia)}. Es gratis en compras desde ${money(C.envioGratisDesde)}.`],
    ["¿Cuánto demora mi pedido?", "En Lima entregamos de 1 a 2 días hábiles. A provincia, de 2 a 5 días hábiles según el destino."],
    ["¿Cómo sé cuál es mi talla?", "Cada producto tiene su guía de tallas con medidas en centímetros. Si tienes dudas, escríbenos por WhatsApp con tu altura y peso y te recomendamos la mejor talla."],
    ["¿Puedo cambiar una prenda?", `Sí. Tienes hasta ${C.diasCambio} días después de recibir tu pedido para cambiarla por otra talla o modelo, siempre que esté sin uso y con etiqueta.`],
    ["¿Qué medios de pago aceptan?", "Yape, Plin, transferencia bancaria y tarjeta de crédito o débito. El asesor te envía los datos al confirmar tu pedido."],
    ["¿Venden por mayor?", "Sí, trabajamos con emprendedores y tiendas. Escríbenos y te enviamos el catálogo con precios por mayor."],
  ];
  $("#faqList").innerHTML = faqs.map(([q, a]) => `<details><summary>${q}</summary><div class="acc__body">${a}</div></details>`).join("");
}

/* =========================================================
   PÁGINA: AYUDA (menú lateral activo)
   ========================================================= */
function initAyuda() {
  const links = $$(".legal__nav a");
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-30% 0px -60% 0px" });
  $$(".legal__body article").forEach(a => io.observe(a));
}

/* =========================================================
   ARRANQUE
   ========================================================= */
renderLayout();
$$("[data-perks]").forEach(el => (el.innerHTML = perksHTML()));
({ inicio: initInicio, tienda: initTienda, producto: initProducto, pack: initPack, contacto: initContacto, ayuda: initAyuda }[PAGE] || (() => {}))();
fillConfig();
initHeader();
initQV();
initCarousels();
initReveal();
})();
