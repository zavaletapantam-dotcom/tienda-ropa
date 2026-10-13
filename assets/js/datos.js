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
      { img: "st-ciudad.jpg", kicker: "Colección", title: "Badass", sub: "El lado urbano, cómodo y expresivo de MAISON." },
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
      { img: "om-lino-arena.jpg", kicker: "Colección", title: "Martir Atelier", sub: "Prendas de mayor calidad, con cortes precisos y una construcción impecable." },
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

/* Categorías = las carpetas de prendas de la marca, cada una dentro de su línea.
   tipo: "top" (polos y poleras), "abajo" (jeans, joggers, pantalones), "abrigo" (casacas, conjuntos) → lo usa el Pack.
   cover: foto de la tarjeta mientras la categoría no tenga productos cargados. */
window.CATEGORIES = [
  /* BASSIC · lo básico, siempre */
  { slug: "polos-bassic",          name: "Polos Bassic",            linea: "bassic",       tipo: "top",    cover: "polo-basico-blanco.jpg" },
  { slug: "poleras-basicas",       name: "Poleras Básicas",         linea: "bassic",       tipo: "top",    cover: "polera-gris.jpg" },
  { slug: "poleras-canguro",       name: "Poleras Canguro",         linea: "bassic",       tipo: "top",    cover: "st-hoodie-mostaza.jpg" },
  { slug: "casacas-basicas",       name: "Casacas Básicas",         linea: "bassic",       tipo: "abrigo", cover: "st-bomber-negra.jpg" },
  { slug: "jean-clasicos",         name: "Jean Clásicos",           linea: "bassic",       tipo: "abajo",  cover: "jean-oscuro.jpg" },
  { slug: "jogger-clasicos-maxeta",name: "Jogger Clásicos Maxeta",  linea: "bassic",       tipo: "abajo",  cover: "jean-negro.jpg" },
  /* BLEESST · el lado más atrevido */
  { slug: "polos-bleesst",         name: "Polos Bleesst",           linea: "bleesst",      tipo: "top",    cover: "st-oversize-skyline.jpg" },
  { slug: "poleras-cr",            name: "Poleras CR",              linea: "bleesst",      tipo: "top",    cover: "st-hoodie-verde.jpg" },
  { slug: "poleras-forest",        name: "Poleras Forest",          linea: "bleesst",      tipo: "top",    cover: "st-hoodie-cafe.jpg" },
  { slug: "jean-baggy",            name: "Jean Baggy",              linea: "bleesst",      tipo: "abajo",  cover: "jean-rasgado.jpg" },
  { slug: "jean-ballom",           name: "Jean Ballom",             linea: "bleesst",      tipo: "abajo",  cover: "jeans-apilados.jpg" },
  { slug: "jean-flared",           name: "Jean Flared",             linea: "bleesst",      tipo: "abajo",  cover: "casaca-denim.jpg" },
  { slug: "mom-jean-street",       name: "Mom Jean Street",         linea: "bleesst",      tipo: "abajo",  cover: "st-rooftop.jpg" },
  { slug: "jogger-baggy-prime",    name: "Jogger Baggy Prime (Cargo)", linea: "bleesst",   tipo: "abajo",  cover: "st-ciudad.jpg" },
  { slug: "jogger-forest",         name: "Jogger Forest",           linea: "bleesst",      tipo: "abajo",  cover: "banner-urbano.jpg" },
  /* MAISON × UOMO CATTIVO · la esencia de la alta calidad */
  { slug: "polos-luxury",          name: "Polos Luxury",            linea: "uomo-cattivo", tipo: "top",    cover: "luxury-negro-a.jpg" },
  { slug: "polos-prime",           name: "Polos Prime",             linea: "uomo-cattivo", tipo: "top",    cover: "prime-arena-a.jpg" },
  { slug: "polos-monarca",         name: "Polos Monarca",           linea: "uomo-cattivo", tipo: "top",    cover: "monarca-negro-a.jpg" },
  { slug: "polos-perfect-business",name: "Polos Perfect Business",  linea: "uomo-cattivo", tipo: "top",    cover: "business-verde-a.jpg" },
  { slug: "polos-supremos",        name: "Polos Supremos",          linea: "uomo-cattivo", tipo: "top",    cover: "polo-business-negro.jpg" },
  { slug: "conjunto-smart",        name: "Conjunto Smart",          linea: "uomo-cattivo", tipo: "abrigo", cover: "blazer-camel.jpg" },
  { slug: "pantalon-clasico-cattivo", name: "Pantalón Clásico Cattivo", linea: "uomo-cattivo", tipo: "abajo", cover: "pantalon-chino-khaki.jpg" },
  { slug: "pantalon-sastre",       name: "Pantalón Sastre",         linea: "uomo-cattivo", tipo: "abajo",  cover: "terno-azul.jpg" },
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
  /* ---------------- MAISON × UOMO CATTIVO · polos reales (fotos en fotos/: a = modelo, b = frente, c = espalda) ---------------- */
  { slug: "polo-luxury", name: "Polo Luxury", estilo: "martir", linea: "uomo-cattivo", cat: "polos-luxury", price: 70, old: 100, deal: true,
    colors: [
      ["Negro", "#121212", ["luxury-negro-a.jpg", "luxury-negro-b.png", "luxury-negro-c.png"]],
      ["Blanco", "#F4F4F2", ["luxury-blanco-a.jpg", "luxury-blanco-b.png", "luxury-blanco-c.png"]],
      ["Arena", "#E6CBA6", ["luxury-arena-a.jpg", "luxury-arena-b.png", "luxury-arena-c.png"]],
      ["Acero", "#1D2C4A", ["luxury-acero-a.jpg", "luxury-acero-b.png", "luxury-acero-c.png"]],
      ["Grey", "#B7D1E6", ["luxury-grey-a.jpg", "luxury-grey-b.png", "luxury-grey-c.png"]],
      ["Marrón", "#3A2A24", ["luxury-marron-a.jpg", "luxury-marron-b.png", "luxury-marron-c.png"]],
      ["Verde", "#8EA06E", ["luxury-verde-a.jpg", "luxury-verde-b.png", "luxury-verde-c.png"]]],
    sizes: TOPS, guide: "luxury", guideImg: "medidas-luxury.webp",
    fit: "Slim fit de ajuste premium", material: "100% algodón High Cotton 1/1",
    desc: "Corte entallado en pecho y hombros con caída suelta y cómoda abajo. Puños en las mangas para mejor estructura, cuello reforzado de larga duración, etiqueta estampada para mayor confort y acabados luxury de alta calidad." },
  { slug: "polo-prime", name: "Polo Prime", estilo: "martir", linea: "uomo-cattivo", cat: "polos-prime", price: 70, isNew: true,
    colors: [
      ["Negro", "#121212", ["prime-negro-a.jpg", "prime-negro-b.png", "prime-negro-c.png"]],
      ["Blanco", "#F4F4F2", ["prime-blanco-a.jpg", "prime-blanco-b.png", "prime-blanco-c.png"]],
      ["Arena", "#EBCB9E", ["prime-arena-a.jpg", "prime-arena-b.png", "prime-arena-c.png"]],
      ["Acero", "#3D6596", ["prime-acero-a.jpg", "prime-acero-b.png", "prime-acero-c.png"]],
      ["Caramel", "#B7784A", ["prime-caramel-a.jpg", "prime-caramel-b.png", "prime-caramel-c.png"]],
      ["Cemento", "#8ED2B6", ["prime-cemento-a.jpg", "prime-cemento-b.png", "prime-cemento-c.png"]],
      ["Melange", "#C8C8C8", ["prime-melange-a.jpg", "prime-melange-b.png", "prime-melange-c.png"]],
      ["Rojo vino", "#7B1B2E", ["prime-vino-a.jpg", "prime-vino-b.png", "prime-vino-c.png"]],
      ["Verde", "#3C4636", ["prime-verde-a.jpg", "prime-verde-b.png", "prime-verde-c.png"]]],
    sizes: TOPS, guide: "prime", guideImg: "medidas-prime.webp",
    fit: "Slim fit", material: "Gamuza pima, 100% algodón",
    desc: "Corte ajustado en pecho y hombros, suelto en la parte inferior. Doble cuello para que mantenga su forma, puños en ambas mangas para estilizar los brazos y etiqueta tejida de la marca como toque final." },
  { slug: "polo-monarca", name: "Polo Monarca", estilo: "martir", linea: "uomo-cattivo", cat: "polos-monarca", price: 80, old: 100, deal: true,
    colors: [
      ["Negro", "#121212", ["monarca-negro-a.jpg", "monarca-negro-b.png", "monarca-negro-c.png"]],
      ["Blanco", "#F4F4F2", ["monarca-blanco-a.jpg", "monarca-blanco-b.png", "monarca-blanco-c.png"]],
      ["Grey", "#BDD4E8", ["monarca-grey-a.jpg", "monarca-grey-b.png", "monarca-grey-c.png"]],
      ["Marrón", "#4A3A25", ["monarca-marron-a.jpg", "monarca-marron-b.png", "monarca-marron-c.png"]]],
    sizes: TOPS, guide: "monarca", guideImg: "medidas-monarca.webp",
    fit: "Polo camisero de ajuste entallado", material: "High Cotton, alto contenido de algodón",
    desc: "Polo camisero con cuello clásico y abertura frontal con botones. Tela de mayor gramaje, suave y transpirable, con estructura firme y caída impecable. Etiqueta tejida en el interior y costuras limpias: ideal para lo casual y lo semiformal." },
  { slug: "polo-perfect-business", name: "Polo Perfect Business", estilo: "martir", linea: "uomo-cattivo", cat: "polos-perfect-business", price: 50, old: 80, deal: true,
    colors: [
      ["Negro", "#121212", ["business-negro-a.jpg", "business-negro-b.png", "business-negro-c.png"]],
      ["Beige", "#D8C2A6", ["business-beige-a.jpg", "business-beige-b.png", "business-beige-c.png"]],
      ["Madre perla", "#ECE7DC", ["business-perla-a.jpg", "business-perla-b.png", "business-perla-c.png"]],
      ["Plomo", "#8A8A8A", ["business-plomo-a.jpg", "business-plomo-b.png", "business-plomo-c.png"]],
      ["Verde", "#0E5351", ["business-verde-a.jpg", "business-verde-b.png", "business-verde-c.png"]]],
    sizes: TOPS, guide: "business", guideImg: "medidas-business.webp",
    fit: "Slim fit", material: "Tejido acanalado con elasticidad",
    desc: "Cuello alto tipo mock con acabado acanalado que da estructura y estilo. Las rayas verticales estilizan la figura y el tejido se ajusta al cuerpo. Costuras laterales, hombros limpios y basta con doble pespunte para mayor durabilidad." },
  { slug: "polera-hoodie-mostaza", name: "Polera Hoodie Mostaza", estilo: "badass", linea: "bassic", cat: "poleras-canguro", price: 110, old: 150, isNew: true,
    colors: [["Mostaza", "#D9A21B"]], sizes: TOPS, imgs: ["st-hoodie-mostaza.jpg", "st-hoodie-arena.jpg"],
    fit: "Oversize", material: "Algodón french terry, interior perchado",
    desc: "Hoodie oversize con capucha doble y bolsillo canguro. El color que hace que te vean." },
  { slug: "polera-hoodie-arena", name: "Polera Hoodie Arena", estilo: "badass", linea: "bassic", cat: "poleras-canguro", price: 110, old: 150,
    colors: [["Arena", "#CFC4B6"]], sizes: TOPS, imgs: ["st-hoodie-arena.jpg", "st-hoodie-cafe.jpg"],
    fit: "Regular fit", material: "Algodón french terry, interior perchado",
    desc: "Un neutro que combina con todo: jeans, cargo o joggers. Suave por dentro y resistente por fuera." },
  { slug: "polera-hoodie-cafe", name: "Polera Hoodie Café", estilo: "badass", linea: "bassic", cat: "poleras-canguro", price: 89, old: 150, deal: true,
    colors: [["Café", "#8B5E3C"]], sizes: TOPS, imgs: ["st-hoodie-cafe.jpg", "st-hoodie-verde.jpg"],
    fit: "Oversize", material: "Algodón french terry, interior perchado",
    desc: "Tono café de temporada con caída amplia. Perfecta para el invierno limeño." },
  { slug: "polera-hoodie-gris", name: "Polera Hoodie Gris", estilo: "badass", linea: "bassic", cat: "poleras-basicas", price: 95, old: 140,
    colors: [["Gris melange", "#A8A8A4"], ["Verde botella", "#24372F"]], sizes: TOPS, imgs: ["polera-gris.jpg", "st-hoodie-verde.jpg"],
    fit: "Regular fit", material: "Algodón french terry, interior perchado",
    desc: "El hoodie básico que siempre vuelves a usar. Disponible en gris melange y verde botella." },
  { slug: "jean-clasico-oscuro", name: "Jean Clásico Oscuro", estilo: "badass", linea: "bassic", cat: "jean-clasicos", price: 99, old: 150, isNew: true,
    colors: [["Azul oscuro", "#2B3A55"]], sizes: BOTTOMS, imgs: ["jean-oscuro.jpg", "jeans-apilados.jpg"],
    fit: "Slim fit", material: "Denim 12 oz con elastano",
    desc: "Jean de lavado oscuro y corte slim. El jean que usarás con todo." },
  { slug: "jean-negro-slim", name: "Jean Negro Slim", estilo: "badass", linea: "bassic", cat: "jean-clasicos", price: 99, old: 150,
    colors: [["Negro", "#0F0F0F"]], sizes: BOTTOMS, imgs: ["jean-negro.jpg", "jean-oscuro.jpg"],
    fit: "Slim fit", material: "Denim 12 oz con elastano",
    desc: "Jean negro que no se decolora fácilmente. Combina con polos claros y casacas." },
  { slug: "casaca-puffer-negra", name: "Casaca Puffer Negra", estilo: "badass", linea: "bassic", cat: "casacas-basicas", price: 189, old: 260, isNew: true,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["st-puffer-negra.jpg", "st-bomber-negra.jpg"],
    fit: "Regular fit", material: "Nylon con relleno térmico",
    desc: "Puffer acolchada y liviana que abriga de verdad. Cuello alto y bolsillos con cierre." },
  { slug: "casaca-bomber-negra", name: "Casaca Bomber Negra", estilo: "badass", linea: "bassic", cat: "casacas-basicas", price: 160, old: 220,
    colors: [["Negro", "#0F0F0F"], ["Camel", "#B4693F"]], sizes: TOPS, imgs: ["st-bomber-negra.jpg", "casaca-bomber-camel.jpg"],
    fit: "Regular fit", material: "Poliéster satinado, forro acolchado",
    desc: "Bomber clásica con puños acanalados. También disponible en camel." },
  { slug: "polo-perla", name: "Polo Perla", estilo: "badass", linea: "bassic", cat: "polos-bassic", price: 50, old: 75,
    colors: [["Perla", "#DCDCD6"]], sizes: TOPS, imgs: ["polo-perla.jpg", "polo-basico-blanco.jpg"],
    fit: "Regular fit", material: "100% algodón pima, 180 g",
    desc: "Un tono perla suave que va con chinos, lino o denim claro." },
  { slug: "polo-basico-blanco", name: "Polo Básico Blanco", estilo: "badass", linea: "bassic", cat: "polos-bassic", price: 45, old: 70,
    colors: [["Blanco", "#F4F4F2"], ["Negro", "#0F0F0F"], ["Plomo", "#8C8C88"]], sizes: TOPS, imgs: ["polo-basico-blanco.jpg", "polo-blanco-modelo.jpg"],
    fit: "Slim fit", material: "100% algodón pima, 170 g",
    desc: "El básico perfecto bajo un blazer o una sobrecamisa. En blanco, negro y plomo." },
  { slug: "polera-crew-blanca", name: "Polera Crew Marfil", estilo: "badass", linea: "bassic", cat: "poleras-basicas", price: 85, old: 120,
    colors: [["Marfil", "#F1EEE6"]], sizes: TOPS, imgs: ["polera-blanca.jpg", "polo-basico-blanco.jpg"],
    fit: "Regular fit", material: "Algodón french terry",
    desc: "Polera de cuello redondo, limpia y minimalista. Se ve increíble sobre una camisa." },
  { slug: "polo-oversize-skyline", name: "Polo Oversize Skyline", estilo: "badass", linea: "bleesst", cat: "polos-bleesst", price: 65, old: 95, isNew: true,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["st-oversize-skyline.jpg", "polo-street-blanco.jpg"],
    fit: "Oversize", material: "100% algodón peinado, 220 g",
    desc: "Polo oversize con gráfico de ciudad en la espalda. Hombro caído y tela gruesa que mantiene la forma lavado tras lavado." },
  { slug: "polo-out-of-the-ordinary", name: "Polo Out of the Ordinary", estilo: "badass", linea: "bleesst", cat: "polos-bleesst", price: 49, old: 90, deal: true,
    colors: [["Gris melange", "#C9CACA"]], sizes: TOPS, imgs: ["st-out-of-ordinary.jpg", "polos-doblados.jpg"],
    fit: "Oversize", material: "100% algodón, 200 g",
    desc: "Mensaje en la espalda y gráfico en contraste. Para los que no siguen la corriente." },
  { slug: "polo-skeleton-negro", name: "Polo Skeleton Negro", estilo: "badass", linea: "bleesst", cat: "polos-bleesst", price: 50, old: 75, isNew: true,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["polo-skeleton-negro.jpg", "st-polo-negro.jpg"],
    fit: "Regular fit", material: "100% algodón peinado, 190 g",
    desc: "Estampado gráfico en blanco sobre polo negro. Una prenda con personalidad para salir de lo básico." },
  { slug: "polo-original-crema", name: "Polo Original Crema", estilo: "badass", linea: "bleesst", cat: "polos-bleesst", price: 40, old: 80, deal: true,
    colors: [["Crema", "#E9E1CF"]], sizes: TOPS, imgs: ["polo-original-crema.jpg", "polos-doblados.jpg"],
    fit: "Oversize", material: "100% algodón, 190 g",
    desc: "Polo oversize con estampado frontal en azul. Hombro caído y largo extendido para un look urbano relajado." },
  { slug: "polo-street-blanco", name: "Polo Back Print Blanco", estilo: "badass", linea: "bleesst", cat: "polos-bleesst", price: 50, old: 75,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["polo-street-blanco.jpg", "polo-blanco-detalle.jpg"],
    fit: "Regular fit", material: "100% algodón, 190 g",
    desc: "Estampado en la espalda para un estilo urbano. Combínalo con jeans y zapatillas." },
  { slug: "jean-rasgado-azul", name: "Jean Rasgado Azul", estilo: "badass", linea: "bleesst", cat: "jean-baggy", price: 99, old: 140, deal: true,
    colors: [["Azul", "#4A6A94"]], sizes: BOTTOMS, imgs: ["jean-rasgado.jpg", "jeans-apilados.jpg"],
    fit: "Skinny fit", material: "Denim stretch",
    desc: "Jean con rasgados en las rodillas y lavado medio. Ideal para un look urbano." },
  { slug: "pantalon-lino-beige", name: "Pantalón de Lino Beige", estilo: "martir", linea: "uomo-cattivo", cat: "pantalon-clasico-cattivo", price: 129, old: 180, isNew: true,
    colors: [["Beige", "#D4C3A3"]], sizes: BOTTOMS, imgs: ["om-pantalon-lino.jpg", "om-lino-arena.jpg"],
    fit: "Relaxed fit", material: "Lino con algodón",
    desc: "Pantalón de lino con pinzas y caída amplia. El clásico del verano elegante." },
  { slug: "pantalon-chino-khaki", name: "Pantalón Chino Khaki", estilo: "martir", linea: "uomo-cattivo", cat: "pantalon-clasico-cattivo", price: 89, old: 130, deal: true,
    colors: [["Khaki", "#BFA77F"]], sizes: BOTTOMS, imgs: ["pantalon-chino-khaki.jpg", "outfit-flatlay.jpg"],
    fit: "Slim fit", material: "Drill de algodón con elastano",
    desc: "Chino de corte slim con un toque de elastano. Funciona para la oficina y el fin de semana." },
  { slug: "pantalon-sastre-azul", name: "Pantalón Sastre Azul", estilo: "martir", linea: "uomo-cattivo", cat: "pantalon-sastre", price: 120, old: 180,
    colors: [["Azul", "#2E4A7A"]], sizes: BOTTOMS, imgs: ["terno-azul.jpg", "hero-terno-detalle.jpg"],
    fit: "Slim fit", material: "Lanilla con textura",
    desc: "Pantalón de vestir con textura sutil. Se vende solo o como parte del terno." },
  { slug: "blazer-tweed-marron", name: "Blazer Tweed Marrón", estilo: "martir", linea: "uomo-cattivo", cat: "conjunto-smart", price: 260, old: 360, isNew: true,
    colors: [["Marrón", "#6B5440"]], sizes: TOPS, imgs: ["om-blazer-tweed.jpg", "blazer-camel.jpg"],
    fit: "Regular fit", material: "Tweed de lana, forro completo",
    desc: "Blazer de tweed con textura espigada. Herencia británica para el día a día." },
  { slug: "blazer-camel", name: "Blazer Camel", estilo: "martir", linea: "uomo-cattivo", cat: "conjunto-smart", price: 199, old: 330, deal: true,
    colors: [["Camel", "#B08A5E"]], sizes: TOPS, imgs: ["blazer-camel.jpg", "om-blazer-tweed.jpg"],
    fit: "Regular fit", material: "Mezcla de lana, medio forro",
    desc: "Blazer en tono camel que eleva cualquier outfit, desde un polo blanco hasta una camisa." },
  { slug: "blazer-negro-slim", name: "Blazer Negro Slim", estilo: "martir", linea: "uomo-cattivo", cat: "conjunto-smart", price: 240, old: 350,
    colors: [["Negro", "#0F0F0F"]], sizes: TOPS, imgs: ["blazer-negro.jpg", "hero-terno-azul.jpg"],
    fit: "Slim fit", material: "Mezcla de lana, forro completo",
    desc: "Blazer de un botón y solapa delgada. Con camisa para eventos o con polo para un look casual." },
];

/* Pack Deluxe: el cliente elige su estilo y una prenda de cada paso */
window.PACK = {
  name: "Pack Deluxe",
  discount: 0.20,
  steps: [
    { title: "Elige tu polo o polera", tipos: ["top"] },
    { title: "Elige tu pantalón",       tipos: ["abajo"] },
    { title: "Elige tu casaca o conjunto", tipos: ["abrigo"] },
  ],
};

/* Guía de tallas (cm) */
window.SIZE_GUIDE = {
  luxury:   { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "67.5 – 69.5", "49.5 – 51.5", "12.5 – 14.5", "44 – 46", "14 – 16"], ["M", "68 – 70", "50 – 52", "13 – 15", "45 – 47", "15 – 17"], ["L", "68.5 – 70.5", "52 – 54", "13.5 – 15.5", "46 – 48", "16 – 18"], ["XL", "69 – 71", "53 – 55", "14 – 16", "47 – 49", "17 – 19"]] },
  prime:    { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "67.5 – 69.5", "49.5 – 51.5", "12.5 – 14.5", "44 – 46", "14 – 16"], ["M", "68 – 70", "50 – 52", "13 – 15", "45 – 47", "15 – 17"], ["L", "68.5 – 70.5", "52 – 54", "13.5 – 15.5", "46 – 48", "16 – 18"], ["XL", "69 – 71", "53 – 55", "14 – 16", "47 – 49", "17 – 19"]] },
  monarca:  { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "65 – 67", "46 – 48", "13 – 15", "43 – 45", "14.5 – 16.5"], ["M", "66 – 68", "48 – 50", "13.5 – 15.5", "44 – 46", "15 – 17"], ["L", "67.5 – 69.5", "50 – 52", "14 – 16", "45 – 47", "15.5 – 17.5"], ["XL", "68.5 – 70.5", "52 – 54", "14.5 – 16.5", "46 – 49", "16 – 18"]] },
  business: { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "58 – 60", "44 – 46", "9 – 10", "34 – 36", "13 – 15"], ["M", "60 – 62", "46 – 48", "10 – 12", "36 – 38", "13 – 15"], ["L", "62 – 64", "48 – 50", "12 – 14", "38 – 40", "15 – 17"], ["XL", "64 – 66", "50 – 52", "14 – 16", "40 – 42", "17 – 18"]] },
  tops: { head: ["Talla", "Pecho", "Largo", "Hombro"], rows: [["S", "96 – 100", "68", "43"], ["M", "100 – 104", "70", "45"], ["L", "104 – 110", "72", "47"], ["XL", "110 – 116", "74", "49"]] },
  bottoms: { head: ["Talla", "Cintura", "Cadera", "Largo"], rows: [["28", "72 – 74", "92", "100"], ["30", "76 – 78", "96", "102"], ["32", "80 – 82", "100", "104"], ["34", "84 – 86", "104", "106"], ["36", "88 – 90", "108", "107"]] },
  shoes: { head: ["Talla", "Largo del pie"], rows: [["39", "25.0"], ["40", "25.7"], ["41", "26.4"], ["42", "27.0"], ["43", "27.7"]] },
};
