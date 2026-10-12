/* =========================================================
   DATOS DE LA TIENDA — MAISON
   Todo lo que se edita está en este archivo:
   WhatsApp, nombre, mundos (Badass / Martir Atelier), líneas, productos y pack.
   ========================================================= */

window.CONFIG = {
  // Código de país + número, sin "+", espacios ni guiones. Ej. Perú: "51987654321"
  whatsapp: "51936659911",
  store: "MAISON",
  tagline: "Dos mundos · Una sola esencia",
  email: "contacto@maison.pe",
  city: "Lima, Perú",
  hours: "Atención 24 horas",
  envioLima: 10,
  envioProvincia: 15,
  diasCambio: 2,
  social: { instagram: "#", facebook: "#", tiktok: "#" },
};

/* Los dos mundos de MAISON. Cada uno tiene su propia página (badass.html / martir.html).
   panel = foto del panel de la intro (debe ser igual a la primera foto de heroes para la transición) */
window.STYLES = {
  badass: {
    slug: "badass", name: "Badass", page: "badass.html", logo: "assets/marcas/badass.svg?v=1",
    tags: ["Urbano", "Oversize", "Boxy fit"],
    desc: "El lado urbano, cómodo y expresivo. Ropa pensada para el día a día, con actitud y libertad de movimiento.",
    short: "Urbano, cómodo y expresivo. Bassic y Bleesst.",
    lines: ["bassic", "bleesst"],
    panel: "st-ciudad.jpg",
    heroes: [
      { img: "st-ciudad.jpg", kicker: "Urbano · Oversize · Boxy fit", title: "Badass", sub: "El lado urbano, cómodo y expresivo de MAISON." },
      { img: "st-franela-roja.jpg", kicker: "Bleesst", title: "El lado más atrevido", sub: "Estampados, bordados y cortes con actitud." },
      { img: "st-hoodie-arena.jpg", kicker: "Bassic", title: "Lo básico, siempre", sub: "Colores enteros, 100% algodón y comodidad para todos los días." },
    ],
    marquee: ["Badass", "Urbano", "Oversize", "Boxy fit", "Bassic", "Bleesst"],
    editorial: {
      img: "st-rooftop.jpg", kicker: "Manifiesto", title: "Libertad de movimiento",
      text: "Cortes amplios, telas gruesas y prendas pensadas para el día a día. Badass es para quienes visten como viven: con actitud y sin pedir permiso.",
    },
  },
  martir: {
    slug: "martir", name: "Martir Atelier", page: "martir.html", sub: "Maison Martir",
    tags: ["Refinado", "Estructurado", "Alta calidad"],
    desc: "El lado pesado, refinado y estructurado. Prendas de mayor calidad, con cortes precisos y una construcción impecable.",
    short: "Refinado y estructurado. Maison × Uomo Cattivo.",
    lines: ["uomo-cattivo"],
    panel: "om-lino-arena.jpg",
    heroes: [
      { img: "om-lino-arena.jpg", kicker: "Maison Martir", title: "Martir Atelier", sub: "Prendas de mayor calidad, con cortes precisos y una construcción impecable." },
      { img: "om-blazer-tweed.jpg", kicker: "Maison × Uomo Cattivo", title: "Alta calidad", sub: "La colección creada junto a Uomo Cattivo." },
      { img: "om-abrigo-camel.jpg", kicker: "Atelier", title: "Cortes precisos", sub: "Abrigos, casacas y pantalones hechos para durar." },
    ],
    quote: "La calidad no se explica, se siente.",
    editorial: {
      img: "om-sobrecamisa-arena.jpg", kicker: "El atelier", title: "Construcción impecable",
      text: "Telas nobles, cortes precisos y acabados cuidados en cada costura. Martir Atelier es el lado más refinado de MAISON.",
    },
  },
};

/* Las líneas dentro de cada mundo. Badass = Bassic + Bleesst · Martir Atelier = Maison × Uomo Cattivo */
window.LINES = {
  bassic: {
    slug: "bassic", name: "Bassic", estilo: "badass", tagline: "Lo básico, siempre.",
    desc: "Polos, poleras y buzos en colores enteros. Comodidad de todos los días, en 20/1 y 100% algodón.",
    points: ["Polos", "Poleras", "Buzos", "Colores enteros", "Comodidad", "20/1, 100% algodón"],
  },
  bleesst: {
    slug: "bleesst", name: "Bleesst", estilo: "badass", tagline: "El lado más atrevido.", logo: "assets/marcas/bleesst.svg?v=1",
    desc: "Estampados, bordados, cortes y fusiones visuales en polos, jeans, casacas y poleras.",
    points: ["Polos", "Jeans", "Casacas", "Poleras", "Estampados", "Bordados, cortes y fusiones visuales"],
  },
  "uomo-cattivo": {
    slug: "uomo-cattivo", name: "Uomo Cattivo", estilo: "martir", tagline: "La esencia de la alta calidad.", logo: "assets/marcas/mm.svg?v=1",
    collab: "Maison × Uomo Cattivo",
    desc: "La colección de MAISON junto a Uomo Cattivo: polos, casacas, pantalones, cafarenas y más prendas de alta calidad.",
    points: ["Polos", "Casacas", "Pantalones", "Cafarenas", "Y más prendas de la colección"],
  },
};

/* Categorías (la foto de cada tarjeta se toma del primer producto de esa categoría) */
window.CATEGORIES = [
  { slug: "polos",      name: "Polos" },
  { slug: "camisas",    name: "Camisas" },
  { slug: "poleras",    name: "Poleras" },
  { slug: "pantalones", name: "Pantalones" },
  { slug: "jeans",      name: "Jeans" },
  { slug: "casacas",    name: "Casacas" },
  { slug: "blazers",    name: "Blazers" },
  { slug: "calzado",    name: "Calzado" },
];

const TOPS = ["S", "M", "L", "XL"];
const BOTTOMS = ["28", "30", "32", "34", "36"];
const SHOES = ["39", "40", "41", "42", "43"];

/* Productos
   - estilo: "badass" o "martir"  ·  linea: "bassic", "bleesst" o "uomo-cattivo"
   - deal: true  → aparece en "Ofertas del día" con etiqueta de descuento
   - isNew: true → etiqueta "Nuevo"
   - imgs: la primera es la principal; la segunda aparece al pasar el mouse */
window.PRODUCTS = [
  /* ---------------- BADASS (Bleesst y Bassic) ---------------- */
  { slug: "polo-oversize-skyline", name: "Polo Oversize Skyline", estilo: "badass", linea: "bleesst", cat: "polos", price: 65, old: 95, isNew: true,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["st-oversize-skyline.jpg", "polo-street-blanco.jpg"],
    fit: "Oversize", material: "100% algodón peinado, 220 g",
    desc: "Polo oversize con gráfico de ciudad en la espalda. Hombro caído y tela gruesa que mantiene la forma lavado tras lavado." },
  { slug: "polo-out-of-the-ordinary", name: "Polo Out of the Ordinary", estilo: "badass", linea: "bleesst", cat: "polos", price: 49, old: 90, deal: true,
    colors: [["Gris melange", "#C9CACA"]], sizes: TOPS, imgs: ["st-out-of-ordinary.jpg", "polos-doblados.jpg"],
    fit: "Oversize", material: "100% algodón, 200 g",
    desc: "Mensaje en la espalda y gráfico en contraste. Para los que no siguen la corriente." },
  { slug: "polo-skeleton-negro", name: "Polo Skeleton Negro", estilo: "badass", linea: "bleesst", cat: "polos", price: 50, old: 75, isNew: true,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["polo-skeleton-negro.jpg", "st-polo-negro.jpg"],
    fit: "Regular fit", material: "100% algodón peinado, 190 g",
    desc: "Estampado gráfico en blanco sobre polo negro. Una prenda con personalidad para salir de lo básico." },
  { slug: "polo-original-crema", name: "Polo Original Crema", estilo: "badass", linea: "bleesst", cat: "polos", price: 40, old: 80, deal: true,
    colors: [["Crema", "#E9E1CF"]], sizes: TOPS, imgs: ["polo-original-crema.jpg", "polos-doblados.jpg"],
    fit: "Oversize", material: "100% algodón, 190 g",
    desc: "Polo oversize con estampado frontal en azul. Hombro caído y largo extendido para un look urbano relajado." },
  { slug: "polo-luxury-negro", name: "Polo Luxury Negro", estilo: "badass", linea: "bleesst", cat: "polos", price: 50, old: 100, deal: true,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["polo-luxury-negro.jpg", "polo-business-negro.jpg"],
    fit: "Regular fit", material: "100% algodón peinado, 200 g",
    desc: "Negro profundo con frase estampada en el pecho. Tela gruesa que cae bien y no transparenta." },
  { slug: "polo-street-blanco", name: "Polo Back Print Blanco", estilo: "badass", linea: "bleesst", cat: "polos", price: 50, old: 75,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["polo-street-blanco.jpg", "polo-blanco-detalle.jpg"],
    fit: "Regular fit", material: "100% algodón, 190 g",
    desc: "Estampado en la espalda para un estilo urbano. Combínalo con jeans y zapatillas." },
  { slug: "overshirt-franela-roja", name: "Overshirt Franela Roja", estilo: "badass", linea: "bleesst", cat: "camisas", price: 99, old: 140, isNew: true,
    colors: [["Rojo cuadros", "#A3242B"]], sizes: TOPS, imgs: ["st-franela-roja.jpg", "banner-urbano.jpg"],
    fit: "Relaxed fit", material: "Franela de algodón cepillado",
    desc: "Camisa de franela a cuadros para usar abierta sobre un hoodie o un polo. Abriga sin pesar." },
  { slug: "polera-hoodie-mostaza", name: "Polera Hoodie Mostaza", estilo: "badass", linea: "bassic", cat: "poleras", price: 110, old: 150, isNew: true,
    colors: [["Mostaza", "#D9A21B"]], sizes: TOPS, imgs: ["st-hoodie-mostaza.jpg", "st-hoodie-arena.jpg"],
    fit: "Oversize", material: "Algodón french terry, interior perchado",
    desc: "Hoodie oversize con capucha doble y bolsillo canguro. El color que hace que te vean." },
  { slug: "polera-hoodie-arena", name: "Polera Hoodie Arena", estilo: "badass", linea: "bassic", cat: "poleras", price: 110, old: 150,
    colors: [["Arena", "#CFC4B6"]], sizes: TOPS, imgs: ["st-hoodie-arena.jpg", "st-hoodie-cafe.jpg"],
    fit: "Regular fit", material: "Algodón french terry, interior perchado",
    desc: "Un neutro que combina con todo: jeans, cargo o joggers. Suave por dentro y resistente por fuera." },
  { slug: "polera-hoodie-cafe", name: "Polera Hoodie Café", estilo: "badass", linea: "bassic", cat: "poleras", price: 89, old: 150, deal: true,
    colors: [["Café", "#8B5E3C"]], sizes: TOPS, imgs: ["st-hoodie-cafe.jpg", "st-hoodie-verde.jpg"],
    fit: "Oversize", material: "Algodón french terry, interior perchado",
    desc: "Tono café de temporada con caída amplia. Perfecta para el invierno limeño." },
  { slug: "polera-hoodie-gris", name: "Polera Hoodie Gris", estilo: "badass", linea: "bassic", cat: "poleras", price: 95, old: 140,
    colors: [["Gris melange", "#A8A8A4"], ["Verde botella", "#24372F"]], sizes: TOPS, imgs: ["polera-gris.jpg", "st-hoodie-verde.jpg"],
    fit: "Regular fit", material: "Algodón french terry, interior perchado",
    desc: "El hoodie básico que siempre vuelves a usar. Disponible en gris melange y verde botella." },
  { slug: "jean-rasgado-azul", name: "Jean Rasgado Azul", estilo: "badass", linea: "bleesst", cat: "jeans", price: 99, old: 140, deal: true,
    colors: [["Azul", "#4A6A94"]], sizes: BOTTOMS, imgs: ["jean-rasgado.jpg", "jeans-apilados.jpg"],
    fit: "Skinny fit", material: "Denim stretch",
    desc: "Jean con rasgados en las rodillas y lavado medio. Ideal para un look urbano." },
  { slug: "jean-clasico-oscuro", name: "Jean Clásico Oscuro", estilo: "badass", linea: "bleesst", cat: "jeans", price: 99, old: 150, isNew: true,
    colors: [["Azul oscuro", "#2B3A55"]], sizes: BOTTOMS, imgs: ["jean-oscuro.jpg", "jeans-apilados.jpg"],
    fit: "Slim fit", material: "Denim 12 oz con elastano",
    desc: "Jean de lavado oscuro y corte slim. El jean que usarás con todo." },
  { slug: "jean-negro-slim", name: "Jean Negro Slim", estilo: "badass", linea: "bleesst", cat: "jeans", price: 99, old: 150,
    colors: [["Negro", "#0F0F0F"]], sizes: BOTTOMS, imgs: ["jean-negro.jpg", "jean-oscuro.jpg"],
    fit: "Slim fit", material: "Denim 12 oz con elastano",
    desc: "Jean negro que no se decolora fácilmente. Combina con polos claros y casacas." },
  { slug: "casaca-puffer-negra", name: "Casaca Puffer Negra", estilo: "badass", linea: "bleesst", cat: "casacas", price: 189, old: 260, isNew: true,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["st-puffer-negra.jpg", "st-bomber-negra.jpg"],
    fit: "Regular fit", material: "Nylon con relleno térmico",
    desc: "Puffer acolchada y liviana que abriga de verdad. Cuello alto y bolsillos con cierre." },
  { slug: "casaca-bomber-negra", name: "Casaca Bomber Negra", estilo: "badass", linea: "bleesst", cat: "casacas", price: 160, old: 220,
    colors: [["Negro", "#0F0F0F"], ["Camel", "#B4693F"]], sizes: TOPS, imgs: ["st-bomber-negra.jpg", "casaca-bomber-camel.jpg"],
    fit: "Regular fit", material: "Poliéster satinado, forro acolchado",
    desc: "Bomber clásica con puños acanalados. También disponible en camel." },
  { slug: "casaca-cuero-negra", name: "Casaca de Cuero Negra", estilo: "badass", linea: "bleesst", cat: "casacas", price: 199, old: 320, deal: true,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["casaca-cuero-negra.jpg", "st-bomber-negra.jpg"],
    fit: "Slim fit", material: "Cuero sintético, forro interior",
    desc: "Casaca estilo biker con cierres metálicos. Una prenda que no pasa de moda." },
  { slug: "casaca-denim-corduroy", name: "Casaca Denim Corduroy", estilo: "badass", linea: "bleesst", cat: "casacas", price: 150, old: 210,
    colors: [["Azul", "#3E5878"]], sizes: TOPS, imgs: ["casaca-denim.jpg", "jean-rasgado.jpg"],
    fit: "Regular fit", material: "Denim 14 oz, cuello de corduroy",
    desc: "Casaca de jean con cuello de corduroy marrón. Un clásico con un detalle que la hace distinta." },

  /* ---------------- MARTIR ATELIER (Maison × Uomo Cattivo) y Bassic ---------------- */
  { slug: "camisa-lino-arena", name: "Camisa de Lino Arena", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 119, old: 170, isNew: true,
    colors: [["Arena", "#E3D9C6"]], sizes: TOPS, imgs: ["om-lino-arena.jpg", "om-lino-blanca.jpg"],
    fit: "Regular fit", material: "100% lino lavado",
    desc: "Camisa de lino con cuello mao y caída natural. Fresca, elegante y perfecta para el verano." },
  { slug: "camisa-lino-celeste", name: "Camisa de Lino Celeste", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 99, old: 170, deal: true,
    colors: [["Celeste", "#8FA9C4"]], sizes: TOPS, imgs: ["om-lino-celeste.jpg", "camisa-celeste.jpg"],
    fit: "Regular fit", material: "100% lino lavado",
    desc: "Celeste suave que va con beige, blanco o azul marino. Úsala abierta o abotonada." },
  { slug: "camisa-lino-blanca", name: "Camisa de Lino Blanca", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 119, old: 170,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["om-lino-blanca.jpg", "om-pantalon-lino.jpg"],
    fit: "Relaxed fit", material: "100% lino lavado",
    desc: "La camisa de lino blanca que no puede faltar. Ligera, transpirable y siempre impecable." },
  { slug: "camisa-lino-salvia", name: "Camisa de Lino Salvia", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 119, old: 170, isNew: true,
    colors: [["Salvia", "#9DAE9F"]], sizes: TOPS, imgs: ["om-lino-salvia.jpg", "om-lino-arena.jpg"],
    fit: "Regular fit", material: "100% lino lavado",
    desc: "Un verde salvia sereno, el color de la casa. Combínala con pantalón beige o blanco." },
  { slug: "camisa-oxford-celeste", name: "Camisa Oxford Celeste", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 85, old: 120,
    colors: [["Celeste", "#A9C4DE"]], sizes: TOPS, imgs: ["camisa-celeste.jpg", "camisas-dobladas.jpg"],
    fit: "Slim fit", material: "100% algodón oxford",
    desc: "Camisa oxford de manga larga, ideal para la oficina. Se puede usar con o sin corbata." },
  { slug: "camisa-formal-blanca", name: "Camisa Formal Blanca", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 79, old: 130, deal: true,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["camisa-blanca.jpg", "om-camisa-tirantes.jpg"],
    fit: "Slim fit", material: "Algodón popelina",
    desc: "Camisa blanca de vestir con cuello italiano. La base perfecta para un terno o un blazer." },
  { slug: "sobrecamisa-arena", name: "Sobrecamisa Arena", estilo: "martir", linea: "uomo-cattivo", cat: "camisas", price: 129, old: 180,
    colors: [["Arena", "#D8CDBB"]], sizes: TOPS, imgs: ["om-sobrecamisa-arena.jpg", "om-lino-arena.jpg"],
    fit: "Relaxed fit", material: "Algodón sarga",
    desc: "Sobrecamisa ligera para usar como capa sobre un polo. Elegante sin esfuerzo." },
  { slug: "polo-blanco-prime", name: "Polo Blanco Prime", estilo: "martir", linea: "uomo-cattivo", cat: "polos", price: 35, old: 70, deal: true,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["polo-blanco-modelo.jpg", "polo-blanco-percha.jpg"],
    fit: "Slim fit", material: "100% algodón pima, 180 g",
    desc: "Polo de corte slim que se ajusta al cuerpo sin apretar. Cuello reforzado que no se deforma." },
  { slug: "polo-perla", name: "Polo Perla", estilo: "badass", linea: "bassic", cat: "polos", price: 50, old: 75,
    colors: [["Perla", "#DCDCD6"]], sizes: TOPS, imgs: ["polo-perla.jpg", "polo-basico-blanco.jpg"],
    fit: "Regular fit", material: "100% algodón pima, 180 g",
    desc: "Un tono perla suave que va con chinos, lino o denim claro." },
  { slug: "polo-basico-blanco", name: "Polo Básico Blanco", estilo: "badass", linea: "bassic", cat: "polos", price: 45, old: 70,
    colors: [["Blanco", "#F4F4F2"], ["Negro", "#0F0F0F"], ["Plomo", "#8C8C88"]], sizes: TOPS, imgs: ["polo-basico-blanco.jpg", "polo-blanco-modelo.jpg"],
    fit: "Slim fit", material: "100% algodón pima, 170 g",
    desc: "El básico perfecto bajo un blazer o una sobrecamisa. En blanco, negro y plomo." },
  { slug: "polera-crew-blanca", name: "Polera Crew Marfil", estilo: "badass", linea: "bassic", cat: "poleras", price: 85, old: 120,
    colors: [["Marfil", "#F1EEE6"]], sizes: TOPS, imgs: ["polera-blanca.jpg", "polo-basico-blanco.jpg"],
    fit: "Regular fit", material: "Algodón french terry",
    desc: "Polera de cuello redondo, limpia y minimalista. Se ve increíble sobre una camisa." },
  { slug: "pantalon-lino-beige", name: "Pantalón de Lino Beige", estilo: "martir", linea: "uomo-cattivo", cat: "pantalones", price: 129, old: 180, isNew: true,
    colors: [["Beige", "#D4C3A3"]], sizes: BOTTOMS, imgs: ["om-pantalon-lino.jpg", "om-lino-arena.jpg"],
    fit: "Relaxed fit", material: "Lino con algodón",
    desc: "Pantalón de lino con pinzas y caída amplia. El clásico del verano elegante." },
  { slug: "pantalon-chino-khaki", name: "Pantalón Chino Khaki", estilo: "martir", linea: "uomo-cattivo", cat: "pantalones", price: 89, old: 130, deal: true,
    colors: [["Khaki", "#BFA77F"]], sizes: BOTTOMS, imgs: ["pantalon-chino-khaki.jpg", "outfit-flatlay.jpg"],
    fit: "Slim fit", material: "Drill de algodón con elastano",
    desc: "Chino de corte slim con un toque de elastano. Funciona para la oficina y el fin de semana." },
  { slug: "pantalon-sastre-azul", name: "Pantalón Sastre Azul", estilo: "martir", linea: "uomo-cattivo", cat: "pantalones", price: 120, old: 180,
    colors: [["Azul", "#2E4A7A"]], sizes: BOTTOMS, imgs: ["terno-azul.jpg", "hero-terno-detalle.jpg"],
    fit: "Slim fit", material: "Lanilla con textura",
    desc: "Pantalón de vestir con textura sutil. Se vende solo o como parte del terno." },
  { slug: "blazer-tweed-marron", name: "Blazer Tweed Marrón", estilo: "martir", linea: "uomo-cattivo", cat: "blazers", price: 260, old: 360, isNew: true,
    colors: [["Marrón", "#6B5440"]], sizes: TOPS, imgs: ["om-blazer-tweed.jpg", "blazer-camel.jpg"],
    fit: "Regular fit", material: "Tweed de lana, forro completo",
    desc: "Blazer de tweed con textura espigada. Herencia británica para el día a día." },
  { slug: "blazer-camel", name: "Blazer Camel", estilo: "martir", linea: "uomo-cattivo", cat: "blazers", price: 199, old: 330, deal: true,
    colors: [["Camel", "#B08A5E"]], sizes: TOPS, imgs: ["blazer-camel.jpg", "om-blazer-tweed.jpg"],
    fit: "Regular fit", material: "Mezcla de lana, medio forro",
    desc: "Blazer en tono camel que eleva cualquier outfit, desde un polo blanco hasta una camisa." },
  { slug: "blazer-negro-slim", name: "Blazer Negro Slim", estilo: "martir", linea: "uomo-cattivo", cat: "blazers", price: 240, old: 350,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["blazer-negro.jpg", "hero-terno-azul.jpg"],
    fit: "Slim fit", material: "Mezcla de lana, forro completo",
    desc: "Blazer de un botón y solapa delgada. Con camisa para eventos o con polo para un look casual." },
  { slug: "abrigo-camel", name: "Abrigo Camel", estilo: "martir", linea: "uomo-cattivo", cat: "casacas", price: 290, old: 400, isNew: true,
    colors: [["Camel", "#C2A47E"]], sizes: TOPS, imgs: ["om-abrigo-camel.jpg", "blazer-camel.jpg"],
    fit: "Regular fit", material: "Paño de lana, cuello de piel sintética",
    desc: "Abrigo largo en camel con cuello de contraste. Una pieza para toda la vida." },
  { slug: "casaca-parka-olivo", name: "Casaca Encerada Olivo", estilo: "martir", linea: "uomo-cattivo", cat: "casacas", price: 180, old: 260,
    colors: [["Olivo", "#55593F"]], sizes: TOPS, imgs: ["casaca-parka-olivo.jpg", "om-abrigo-camel.jpg"],
    fit: "Regular fit", material: "Algodón encerado, capucha",
    desc: "Casaca de campo en algodón encerado. Resistente a la garúa y con estilo de herencia." },
  { slug: "mocasines-cuero-negro", name: "Mocasines de Cuero Negro", estilo: "martir", linea: "uomo-cattivo", cat: "calzado", price: 189, old: 260,
    colors: [["Negro", "#0F0F0F"]], sizes: SHOES, imgs: ["om-mocasines.jpg", "om-pantalon-lino.jpg"],
    fit: "Horma clásica", material: "Cuero natural, suela de goma",
    desc: "Mocasines de cuero con antifaz. Van igual de bien con lino que con pantalón de vestir." },
];

/* Pack Deluxe: el cliente elige su estilo y una prenda de cada paso */
window.PACK = {
  name: "Pack Deluxe",
  discount: 0.20,
  steps: [
    { title: "Elige tu polo o camisa", cats: ["polos", "camisas"] },
    { title: "Elige tu pantalón",       cats: ["pantalones", "jeans"] },
    { title: "Elige tu abrigo",         cats: ["casacas", "poleras", "blazers"] },
  ],
};

/* Guía de tallas (cm) */
window.SIZE_GUIDE = {
  tops: { head: ["Talla", "Pecho", "Largo", "Hombro"], rows: [["S", "96 – 100", "68", "43"], ["M", "100 – 104", "70", "45"], ["L", "104 – 110", "72", "47"], ["XL", "110 – 116", "74", "49"]] },
  bottoms: { head: ["Talla", "Cintura", "Cadera", "Largo"], rows: [["28", "72 – 74", "92", "100"], ["30", "76 – 78", "96", "102"], ["32", "80 – 82", "100", "104"], ["34", "84 – 86", "104", "106"], ["36", "88 – 90", "108", "107"]] },
  shoes: { head: ["Talla", "Largo del pie"], rows: [["39", "25.0"], ["40", "25.7"], ["41", "26.4"], ["42", "27.0"], ["43", "27.7"]] },
};
