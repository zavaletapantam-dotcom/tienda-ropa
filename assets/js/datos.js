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
  email: "maison.pe.dandy@gmail.com",
  city: "Chimbote, Perú",
  hours: "Atención 24 horas",
  envio: 10,                 // envío a domicilio (S/)
  envioGratisDesde: 200,     // envío gratis desde este monto
  entrega: "1 a 2 días hábiles",
  recojo: "Urb. Bellamar 2da. Etapa, Mz. T5 Lote 4, Naciones Unidas",   // dirección de la tienda para recojo
  recojoRef: "Al costado del Tambo, frente a Sheyla",
  distritos: ["Chimbote", "Nuevo Chimbote"],   // envío a domicilio solo a estos distritos
  courier: "Shalom",                            // envío a provincia: el cliente recoge en una agencia de este courier
  provinciaCosto: "Según tarifa de Shalom",     // costo del envío a provincia (lo confirma el asesor)
  diasCambio: 2,
  social: { instagram: "https://www.instagram.com/maison.pe_dandy/", facebook: "", tiktok: "" },
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
    panel: "panter-negro-a.webp",
    heroes: [
      { img: "panter-negro-a.webp", kicker: "Colección", title: "Badass", sub: "El lado urbano, cómodo y expresivo de MAISON." },
      { img: "street-gris-a.webp", kicker: "Bleesst", title: "El lado más atrevido", sub: "Estampados, bordados y cortes con actitud." },
      { img: "polera-basica-acero-a.jpg", kicker: "Bassic", title: "Lo básico, siempre", sub: "Colores enteros, 100% algodón y comodidad para todos los días." },
    ],
    marquee: ["Badass", "Urbano", "Oversize", "Boxy fit", "Bassic", "Bleesst"],
    editorial: {
      img: "panter-negro-c.webp", kicker: "Manifiesto", title: "Libertad de movimiento",
      text: "Cortes amplios, telas gruesas y prendas pensadas para el día a día. Badass es para quienes visten como viven: con actitud y sin pedir permiso.",
    },
  },
  martir: {
    slug: "martir", name: "Martir Atelier", page: "martir.html", sub: "Maison Martir",
    tags: ["Refinado", "Estructurado", "Alta calidad"],
    desc: "El lado pesado, refinado y estructurado. Prendas de mayor calidad, con cortes precisos y una construcción impecable.",
    short: "Refinado y estructurado. Maison × Uomo Cattivo.",
    lines: ["uomo-cattivo"],
    panel: "business-verde-a.webp",
    heroes: [
      { img: "business-verde-a.webp", kicker: "Colección", title: "Martir Atelier", sub: "Prendas de mayor calidad, con cortes precisos y una construcción impecable." },
      { img: "milano-lila-a.webp", kicker: "Maison × Uomo Cattivo", title: "Alta calidad", sub: "La colección creada junto a Uomo Cattivo." },
      { img: "pclasico-beige-a.webp", kicker: "Atelier", title: "Cortes precisos", sub: "Abrigos, casacas y pantalones hechos para durar." },
    ],
    quote: "La calidad no se explica, se siente.",
    editorial: {
      img: "bolonia-beige-c.webp", kicker: "El atelier", title: "Construcción impecable",
      text: "Telas nobles, cortes precisos y acabados cuidados en cada costura. Martir Atelier es el lado más refinado de MAISON.",
    },
  },
};

/* Las líneas dentro de cada mundo. Badass = Bassic + Bleesst · Martir Atelier = Maison × Uomo Cattivo
   allies = marcas con contrato de exclusividad (se muestran como "muy pronto" con su Instagram) */
window.LINES = {
  bassic: {
    slug: "bassic", name: "Bassic", estilo: "badass", tagline: "Lo básico, siempre.",
    desc: "Polos, poleras y buzos en colores enteros. Comodidad de todos los días, en 20/1 y 100% algodón.",
    points: ["Polos", "Poleras", "Buzos", "Colores enteros", "Comodidad", "20/1, 100% algodón"],
    allies: [{ name: "Ezzeta", ig: "ezzetacompany" }],
  },
  bleesst: {
    slug: "bleesst", name: "Bleesst", estilo: "badass", tagline: "El lado más atrevido.", logo: "assets/marcas/bleesst.svg?v=1",
    desc: "Estampados, bordados, cortes y fusiones visuales en polos, jeans, casacas y poleras.",
    points: ["Polos", "Jeans", "Casacas", "Poleras", "Estampados", "Bordados, cortes y fusiones visuales"],
    allies: [{ name: "Ezzeta", ig: "ezzetacompany" }, { name: "Crepante", ig: "crepante" }],
  },
  "uomo-cattivo": {
    slug: "uomo-cattivo", name: "Uomo Cattivo", estilo: "martir", tagline: "La esencia de la alta calidad.", logo: "assets/marcas/mm.svg?v=1",
    collab: "Maison × Uomo Cattivo",
    desc: "La colección de MAISON junto a Uomo Cattivo: polos, casacas, pantalones y más prendas de alta calidad.",
    points: ["Polos", "Casacas", "Pantalones", "Y más prendas de la colección"],
  },
};

/* Categorías = las carpetas de prendas de la marca, cada una dentro de su línea.
   tipo: "top" (polos y poleras), "abajo" (jeans, joggers, pantalones), "abrigo" (casacas) → lo usa el Pack.
   cover: foto de la tarjeta mientras la categoría no tenga productos cargados. */
window.CATEGORIES = [
  /* BASSIC · lo básico, siempre */
  { slug: "polos-bassic",          name: "Polos Bassic",            linea: "bassic",       tipo: "top",    cover: null },
  { slug: "poleras-basicas",       name: "Poleras Básicas",         linea: "bassic",       tipo: "top",    cover: "polera-basica-negro-a.jpg" },
  { slug: "poleras-canguro",       name: "Poleras Canguro",         linea: "bassic",       tipo: "top",    cover: "canguro-verde-a.jpg" },
  { slug: "poleras-cr",            name: "Poleras CR",              linea: "bassic",      tipo: "top",    cover: "cr-verde-a.jpg" },
  { slug: "casacas-basicas",       name: "Casacas Básicas",         linea: "bassic",       tipo: "abrigo", cover: "basica-acero-a.png" },
  { slug: "jean-clasicos",         name: "Jean Clásicos",           linea: "bassic",       tipo: "abajo",  cover: "clasico-negro-a.png" },
  /* BLEESST · el lado más atrevido */
  { slug: "polos-bleesst",         name: "Polos Bleesst",           linea: "bleesst",      tipo: "top",    cover: null },
  { slug: "casacas-bleesst",       name: "Casacas Bleesst",         linea: "bleesst",      tipo: "abrigo", cover: "bomber-verde-a.png" },
  { slug: "jean-baggy",            name: "Jean Baggy",              linea: "bleesst",      tipo: "abajo",  cover: "baggy-celeste-a.png" },
  { slug: "jean-ballom",           name: "Jean Ballom",             linea: "bleesst",      tipo: "abajo",  cover: "ballom-negro-a.png" },
  { slug: "mom-jean-street",       name: "Mom Jean Street",         linea: "bleesst",      tipo: "abajo",  cover: "mom-celeste-2-0-a.png" },
  { slug: "jogger-baggy-prime",    name: "Jogger Baggy Prime (Cargo)", linea: "bleesst",   tipo: "abajo",  cover: "cargo-beige-a.png" },
  /* MAISON × UOMO CATTIVO · la esencia de la alta calidad */
  { slug: "polos-luxury",          name: "Polos Luxury",            linea: "uomo-cattivo", tipo: "top",    cover: "luxury-negro-a.jpg" },
  { slug: "polos-monarca",         name: "Polos Monarca",           linea: "uomo-cattivo", tipo: "top",    cover: "monarca-negro-a.jpg" },
  { slug: "polos-prime",           name: "Polos Prime",             linea: "uomo-cattivo", tipo: "top",    cover: "prime-arena-a.jpg" },
  { slug: "casacas-cattivo",       name: "Casacas",                 linea: "uomo-cattivo", tipo: "abrigo", cover: "bolonia-marron-a.webp" },
  { slug: "polos-perfect-business",name: "Polos Perfect Business",  linea: "uomo-cattivo", tipo: "top",    cover: "business-verde-a.jpg" },
  { slug: "pantalon-clasico-cattivo", name: "Pantalón Clásico Cattivo", linea: "uomo-cattivo", tipo: "abajo", cover: "pclasico-beige-a.webp" },
  { slug: "pantalon-sastre",       name: "Pantalón Sastre",         linea: "uomo-cattivo", tipo: "abajo",  cover: "sastre-azul-a.webp" },
];

const TOPS = ["S", "M", "L", "XL"];
const BOTTOMS = ["28", "30", "32", "34", "36"];
const SHOES = ["39", "40", "41", "42", "43"];

/* Productos
   - estilo: "badass" o "martir"  ·  linea: "bassic", "bleesst" o "uomo-cattivo"
   - deal: true  → aparece en "Ofertas del día" con etiqueta de descuento
   - isNew: true → etiqueta "Nuevo"
   - colors: [nombre, color, [fotos]] → cada color con sus fotos: modelo, frente, espalda (la 2.ª aparece al pasar el mouse)
   - guide / guideImg: guía de tallas (SIZE_GUIDE) e imagen de medidas */
window.PRODUCTS = [
  /* ---------------- MAISON × UOMO CATTIVO · polos, casacas y pantalones (fotos en fotos/: a = principal, b = al pasar el mouse) ---------------- */
  { slug: "polo-luxury", name: "Polo Luxury", estilo: "martir", linea: "uomo-cattivo", cat: "polos-luxury", price: 75, old: 100, deal: true,
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
  { slug: "polo-monarca", name: "Polo Monarca", estilo: "martir", linea: "uomo-cattivo", cat: "polos-monarca", price: 80, old: 110, deal: true,
    colors: [
      ["Negro", "#121212", ["monarca-negro-a.jpg", "monarca-negro-b.png", "monarca-negro-c.png"]],
      ["Blanco", "#F4F4F2", ["monarca-blanco-a.jpg", "monarca-blanco-b.png", "monarca-blanco-c.png"]],
      ["Grey", "#BDD4E8", ["monarca-grey-a.jpg", "monarca-grey-b.png", "monarca-grey-c.png"]],
      ["Marrón", "#4A3A25", ["monarca-marron-a.jpg", "monarca-marron-b.png", "monarca-marron-c.png"]]],
    sizes: TOPS, guide: "monarca", guideImg: "medidas-monarca.webp",
    fit: "Polo camisero de ajuste entallado", material: "High Cotton, alto contenido de algodón",
    desc: "Polo camisero con cuello clásico y abertura frontal con botones. Tela de mayor gramaje, suave y transpirable, con estructura firme y caída impecable. Etiqueta tejida en el interior y costuras limpias: ideal para lo casual y lo semiformal." },
  { slug: "polo-prime", name: "Polo Prime", estilo: "martir", linea: "uomo-cattivo", cat: "polos-prime", price: 70, old: 90, isNew: true,
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
  { slug: "casaca-bolonia", name: "Casaca Bolonia", estilo: "martir", linea: "uomo-cattivo", cat: "casacas-cattivo", price: 130, old: 219, deal: true,
    colors: [
      ["Beige", "#C9B9A3", ["bolonia-beige-a.webp", "bolonia-beige-b.webp", "bolonia-beige-c.webp", "bolonia-beige-d.webp"]],
      ["Marrón", "#6A4934", ["bolonia-marron-a.webp", "bolonia-marron-b.webp", "bolonia-marron-c.webp", "bolonia-marron-d.webp"]]],
    sizes: TOPS, guide: "bolonia", guideImg: "medidas-bolonia.webp",
    fit: "Corte relajado, tipo bomber",
    desc: "Casaca tipo bomber con cuello camisero en contraste, cierre frontal metálico y pretina con elástico en los laterales para un mejor ajuste. Costuras de diseño en el delantero, bolsillos laterales de acceso discreto y mangas amplias para moverte con libertad. Ideal para outfits urbanos y de entretiempo." },
  { slug: "casaca-genova", name: "Casaca Génova", estilo: "martir", linea: "uomo-cattivo", cat: "casacas-cattivo", price: 110, old: 190, deal: true,
    colors: [
      ["Amarillo", "#8C6A2C", ["genova-amarillo-a.webp", "genova-amarillo-b.webp", "genova-amarillo-c.webp", "genova-amarillo-d.webp"]],
      ["Verde", "#8F9787", ["genova-verde-a.webp", "genova-verde-b.webp", "genova-verde-c.webp"]]],
    sizes: TOPS, guide: "genova", guideImg: "medidas-genova.webp",
    fit: "Relaxed fit, tipo Harrington",
    desc: "Casaca Harrington a cuadros con cuello camisero en contraste de color sólido, cierre frontal metálico y puños con elástico. Bolsillos laterales funcionales y bajo ligeramente elasticado que mejora la estructura. Versátil para outfits urbanos y de entretiempo." },
  { slug: "casaca-milano", name: "Casaca Milano", estilo: "martir", linea: "uomo-cattivo", cat: "casacas-cattivo", price: 120, old: 200, deal: true,
    colors: [
      ["Grey", "#A6A9AC", ["milano-grey-a.webp", "milano-grey-b.webp", "milano-grey-c.webp", "milano-grey-d.webp"]],
      ["Lila", "#8D7F90", ["milano-lila-a.webp", "milano-lila-b.webp", "milano-lila-c.webp", "milano-lila-d.webp"]]],
    sizes: TOPS, guide: "milano", guideImg: "medidas-milano.webp",
    fit: "Regular fit, tipo Harrington",
    desc: "Casaca Harrington con cuello camisero negro en contraste, cierre frontal metálico de largo completo y bolsillos inferiores con tapeta y broche. Puños con broche de ajuste y pretina parcialmente elasticada para mayor comodidad." },
  { slug: "polo-perfect-business", name: "Polo Perfect Business", estilo: "martir", linea: "uomo-cattivo", cat: "polos-perfect-business", price: 70, old: 90, deal: true,
    colors: [
      ["Negro", "#121212", ["business-negro-a.jpg", "business-negro-b.png", "business-negro-c.png"]],
      ["Beige", "#D8C2A6", ["business-beige-a.jpg", "business-beige-b.png", "business-beige-c.png"]],
      ["Madre perla", "#ECE7DC", ["business-perla-a.jpg", "business-perla-b.png", "business-perla-c.png"]],
      ["Plomo", "#8A8A8A", ["business-plomo-a.jpg", "business-plomo-b.png", "business-plomo-c.png"]],
      ["Verde", "#0E5351", ["business-verde-a.jpg", "business-verde-b.png", "business-verde-c.png"]]],
    sizes: TOPS, guide: "business", guideImg: "medidas-business.webp",
    fit: "Slim fit", material: "Tejido acanalado con elasticidad",
    desc: "Cuello alto tipo mock con acabado acanalado que da estructura y estilo. Las rayas verticales estilizan la figura y el tejido se ajusta al cuerpo. Costuras laterales, hombros limpios y basta con doble pespunte para mayor durabilidad." },
  /* ---------------- MAISON × UOMO CATTIVO · casacas y pantalones ---------------- */
  { slug: "pantalon-clasico-cattivo", name: "Pantalón Clásico Cattivo", estilo: "martir", linea: "uomo-cattivo", cat: "pantalon-clasico-cattivo", price: 100, old: 130, deal: true,
    colors: [
      ["Negro", "#121212", ["pclasico-negro-a.png", "pclasico-negro-b.png", "pclasico-negro-c.png", "pclasico-negro-d.png"]],
      ["Azul", "#1F2A44", ["pclasico-azul-a.webp", "pclasico-azul-b.webp", "pclasico-azul-c.webp", "pclasico-azul-d.webp"]],
      ["Beige", "#D9CBB3", ["pclasico-beige-a.webp", "pclasico-beige-b.webp", "pclasico-beige-c.webp", "pclasico-beige-d.webp"]],
      ["Hueso", "#E6DFCF", ["pclasico-hueso-a.png", "pclasico-hueso-b.png", "pclasico-hueso-c.png", "pclasico-hueso-d.png"]],
      ["Plomo claro", "#B9BBBD", ["pclasico-plomo-claro-a.png", "pclasico-plomo-claro-b.png", "pclasico-plomo-claro-c.png", "pclasico-plomo-claro-d.png"]],
      ["Plomo rata", "#7D8083", ["pclasico-plomo-rata-a.webp", "pclasico-plomo-rata-b.webp", "pclasico-plomo-rata-c.webp", "pclasico-plomo-rata-d.webp"]]],
    sizes: TOPS, guide: "pantalon-clasico", guideImg: "medidas-pantalon-clasico.webp",
    fit: "Slim fit de caída recta",
    desc: "Pantalón clásico con caída recta y ligeramente ajustada desde la cadera hasta el bajo, con pinzas y bolsillos laterales tipo francés para un acabado limpio. Combina con zapatos de vestir o calzado casual elegante: ideal para lo formal, ejecutivo o business casual." },
  { slug: "pantalon-sastre", name: "Pantalón Sastre", estilo: "martir", linea: "uomo-cattivo", cat: "pantalon-sastre", price: 100, old: 130, deal: true,
    colors: [
      ["Negro", "#121212", ["sastre-negro-a.png", "sastre-negro-b.png", "sastre-negro-c.png"]],
      ["Azul", "#1E2940", ["sastre-azul-a.webp", "sastre-azul-b.webp", "sastre-azul-c.webp", "sastre-azul-d.webp"]],
      ["Beige", "#D8C5A8", ["sastre-beige-a.png", "sastre-beige-b.png", "sastre-beige-c.png", "sastre-beige-d.png"]]],
    sizes: TOPS, guide: "pantalon-sastre", guideImg: "medidas-pantalon-sastre.png",
    fit: "Slim fit de caída recta",
    desc: "Pantalón sastre con pinzas y ajustadores de botón en la pretina, caída recta y ligeramente ajustada desde la cadera hasta el bajo. Bolsillos laterales tipo francés y acabado limpio para ocasiones formales, ejecutivas o business casual." },
  /* ---------------- BASSIC · poleras, casacas y jean clásico ---------------- */
  { slug: "polera-basica", name: "Polera Básica", estilo: "badass", linea: "bassic", cat: "poleras-basicas", price: 100, old: 140, isNew: true,
    colors: [
      ["Negro", "#111111", ["polera-basica-negro-a.jpg", "polera-basica-negro-b.png", "polera-basica-negro-c.png"]],
      ["Blanco", "#F4F4F2", ["polera-basica-blanco-a.jpg", "polera-basica-blanco-b.png", "polera-basica-blanco-c.png"]],
      ["Melange", "#CFCFCF", ["polera-basica-melange-a.jpg", "polera-basica-melange-b.png", "polera-basica-melange-c.png"]],
      ["Gárgola", "#A7A9AB", ["polera-basica-gargola-a.jpg", "polera-basica-gargola-b.png", "polera-basica-gargola-c.png"]],
      ["Acero", "#1F3557", ["polera-basica-acero-a.jpg", "polera-basica-acero-b.png", "polera-basica-acero-c.png"]],
      ["Denim", "#8FB3C2", ["polera-basica-denim-a.jpg", "polera-basica-denim-b.png", "polera-basica-denim-c.png"]],
      ["Verde", "#1F4A33", ["polera-basica-verde-a.jpg", "polera-basica-verde-b.png", "polera-basica-verde-c.png"]]],
    sizes: TOPS, guide: "polera-basica", guideImg: "medidas-polera-basica.png",
    fit: "Oversize",
    desc: "Polera con capucha de corte amplio y hombro caído, en colores enteros. Lo básico, siempre: cómoda y fácil de combinar con todo." },
  { slug: "polera-canguro", name: "Polera Canguro", estilo: "badass", linea: "bassic", cat: "poleras-canguro", price: 100, old: 140,
    colors: [
      ["Negro", "#111111", ["canguro-negro-a.jpg", "canguro-negro-b.webp"]],
      ["Blanco", "#F4F4F2", ["canguro-blanco-a.jpg", "canguro-blanco-b.png"]],
      ["Melange", "#CFCFCF", ["canguro-melange-a.jpg"]],
      ["Gárgola", "#A7A9AB", ["canguro-gargola-a.jpg", "canguro-gargola-b.png"]],
      ["Acero", "#1F3557", ["canguro-acero-a.jpg", "canguro-acero-b.png"]],
      ["Denim", "#8FB3C2", ["canguro-denim-a.jpg", "canguro-denim-b.png"]],
      ["Verde", "#1F4A33", ["canguro-verde-a.jpg", "canguro-verde-b.png", "canguro-verde-c.png"]]],
    sizes: TOPS, guide: "polera-canguro", guideImg: "medidas-polera-canguro.png",
    fit: "Oversize",
    desc: "Polera con capucha y bolsillo canguro, de corte amplio y hombro caído, en colores enteros para el día a día." },
  { slug: "polera-cr", name: "Polera CR", estilo: "badass", linea: "bassic", cat: "poleras-cr", price: 100, old: 140,
    colors: [
      ["Negro", "#111111", ["cr-negro-a.jpg", "cr-negro-b.png", "cr-negro-c.jpg", "cr-negro-d.jpg"]],
      ["Blanco", "#F4F4F2", ["cr-blanco-a.jpg", "cr-blanco-b.png", "cr-blanco-c.jpg", "cr-blanco-d.jpg"]],
      ["Melange", "#C9CDCB", ["cr-melange-a.jpg", "cr-melange-b.png", "cr-melange-c.jpg", "cr-melange-d.jpg"]],
      ["Denim", "#8FB3C2", ["cr-denim-a.jpg", "cr-denim-b.png", "cr-denim-c.jpg", "cr-denim-d.jpg"]],
      ["Verde", "#1E4A30", ["cr-verde-a.jpg", "cr-verde-b.png", "cr-verde-c.jpg", "cr-verde-d.jpg"]]],
    sizes: TOPS, guide: "polera-cr", guideImg: "medidas-polera-cr.png",
    fit: "Oversize",
    desc: "Polera de cuello redondo, corte amplio y hombro caído, en colores enteros. Limpia y versátil." },
  { slug: "casaca-basica", name: "Casaca Básica", estilo: "badass", linea: "bassic", cat: "casacas-basicas", price: 110, old: 160,
    colors: [
      ["Negro", "#111111", ["basica-negro-a.png", "basica-negro-b.png", "basica-negro-c.png"]],
      ["Blanco", "#F4F4F2", ["basica-blanco-a.png", "basica-blanco-b.png", "basica-blanco-c.png"]],
      ["Melange", "#D0D0D0", ["basica-melange-a.png", "basica-melange-b.png", "basica-melange-c.png"]],
      ["Acero", "#213A63", ["basica-acero-a.png", "basica-acero-b.png", "basica-acero-c.png"]],
      ["Denim", "#92B5C2", ["basica-denim-a.png", "basica-denim-b.png", "basica-denim-c.png"]],
      ["Verde", "#24533A", ["basica-verde-a.png", "basica-verde-b.png", "basica-verde-c.png"]]],
    sizes: TOPS,
    fit: "Oversize",
    desc: "Casaca con capucha y cierre completo, de corte amplio y hombro caído, en colores enteros." },
  { slug: "casaca-jacket-plus", name: "Casaca Jacket Plus", estilo: "badass", linea: "bassic", cat: "casacas-basicas", price: 120, old: 199,
    colors: [
      ["Negro", "#151515", ["jacket-negro-a.png", "jacket-negro-b.png", "jacket-negro-c.png", "jacket-negro-d.png"]],
      ["Lila", "#7E6C86", ["jacket-lila-a.png", "jacket-lila-b.png", "jacket-lila-c.png", "jacket-lila-d.png"]]],
    sizes: TOPS, guide: "jacket-plus", guideImg: "medidas-jacket-plus.png",
    fit: "Regular fit",
    desc: "Casaca de cierre frontal con cuello camisero, bolsillos laterales y pretina y puños ajustados. Sobria y fácil de llevar." },
  { slug: "jean-clasico", name: "Jean Clásico", estilo: "badass", linea: "bassic", cat: "jean-clasicos", price: 100, old: 140,
    colors: [
      ["Negro", "#1A1A1A", ["clasico-negro-a.png", "clasico-negro-b.png", "clasico-negro-c.png"]],
      ["Azul marino", "#1D2433", ["clasico-azul-marino-a.png", "clasico-azul-marino-b.png"]],
      ["Azul", "#3D5E85", ["clasico-azul-a.png", "clasico-azul-b.png"]],
      ["Celeste", "#7FA7D0", ["clasico-celeste-a.png", "clasico-celeste-b.png"]],
      ["Hielo", "#A6C6E4", ["clasico-hielo-a.png", "clasico-hielo-b.png"]],
      ["Cenizo", "#A9ABAD", ["clasico-cenizo-a.png", "clasico-cenizo-b.png", "clasico-cenizo-c.png"]]],
    sizes: BOTTOMS, guide: "jean-clasico", guideImg: "medidas-jean-clasico.png",
    fit: "Regular fit",
    desc: "El jean de siempre: corte recto y cómodo con cinco bolsillos, en lavados lisos que combinan con todo." },
  /* ---------------- BASSIC · poleras y casacas ---------------- */
  /* ---------------- BLEESST · casacas y jeans ---------------- */
  { slug: "casaca-bomber", name: "Casaca Bomber", estilo: "badass", linea: "bleesst", cat: "casacas-bleesst", price: 130, old: 219, isNew: true,
    colors: [
      ["Negro", "#141414", ["bomber-negro-a.png", "bomber-negro-b.png", "bomber-negro-c.png", "bomber-negro-d.png"]],
      ["Perla", "#ECE9E1", ["bomber-perla-a.png", "bomber-perla-b.png", "bomber-perla-c.png", "bomber-perla-d.png", "bomber-perla-e.png"]],
      ["Verde", "#A9B59A", ["bomber-verde-a.png", "bomber-verde-b.png", "bomber-verde-c.png", "bomber-verde-d.png"]]],
    sizes: TOPS, guide: "casaca-bomber", guideImg: "medidas-casaca-bomber.png",
    fit: "Oversize acolchada",
    desc: "Casaca acolchada tipo puffer con cuello alto y cierre frontal. Abriga sin perder estilo; la versión Perla trae el interior estampado." },
  { slug: "casaca-denim-street", name: "Casaca Denim Street", estilo: "badass", linea: "bleesst", cat: "casacas-bleesst", price: 249,
    colors: [
      ["Gris", "#C9CAC6", ["street-gris-a.webp", "street-gris-b.webp", "street-gris-c.webp", "street-gris-d.webp"]]],
    sizes: TOPS, guide: "casaca-street", guideImg: "medidas-casaca-street.webp",
    fit: "Regular fit",
    desc: "Casaca de denim claro con acabado crepé, cuello camisero, cierre frontal y detalles de cierre en el pecho." },
  { slug: "casaca-panter", name: "Casaca Panter", estilo: "badass", linea: "bleesst", cat: "casacas-bleesst", price: 249,
    colors: [
      ["Negro", "#2B2B2B", ["panter-negro-a.webp", "panter-negro-b.webp", "panter-negro-c.webp"]]],
    sizes: TOPS, guide: "casaca-panter", guideImg: "medidas-casaca-panter.webp",
    fit: "Regular fit",
    desc: "Casaca de acabado tipo cuero lavado con capucha, cierre frontal y bolsillos con cierre. Atrevida y con carácter." },
  { slug: "jean-baggy", name: "Jean Baggy", estilo: "badass", linea: "bleesst", cat: "jean-baggy", price: 100, old: 140, isNew: true,
    colors: [
      ["Negro", "#1E1F22", ["baggy-negro-a.png", "baggy-negro-b.png", "baggy-negro-c.png"]],
      ["Negro entero", "#111111", ["baggy-negro-entero-a.png", "baggy-negro-entero-b.png"]],
      ["Negro vintage", "#3B3C40", ["baggy-negro-vintage-a.png", "baggy-negro-vintage-b.png", "baggy-negro-vintage-c.png"]],
      ["Negro rasgado", "#2A2B2E", ["baggy-negro-rasgado-a.png", "baggy-negro-rasgado-b.png", "baggy-negro-rasgado-c.png"], { guide: "baggy-rasgado-negro", guideImg: "medidas-baggy-rasgado-negro.png" }],
      ["Black wash", "#3A3F47", ["baggy-black-wash-a.png", "baggy-black-wash-b.png"]],
      ["Humo", "#5E6266", ["baggy-humo-a.png", "baggy-humo-b.png", "baggy-humo-c.png"]],
      ["Cenizo", "#6E6F72", ["baggy-cenizo-a.png", "baggy-cenizo-b.png", "baggy-cenizo-c.png"]],
      ["Two color", "#55585C", ["baggy-two-color-a.png", "baggy-two-color-b.png", "baggy-two-color-c.png"]],
      ["Azul vintage", "#5F86AE", ["baggy-azul-vintage-a.png", "baggy-azul-vintage-b.png"]],
      ["Azul rasgado", "#9CB7CC", ["baggy-azul-rasgado-a.png", "baggy-azul-rasgado-b.png", "baggy-azul-rasgado-c.png"]],
      ["Celeste", "#8DB2D6", ["baggy-celeste-a.png", "baggy-celeste-b.png", "baggy-celeste-c.png", "baggy-celeste-d.png"]],
      ["Hielo", "#AFCBE3", ["baggy-hielo-a.png", "baggy-hielo-b.png"]]],
    sizes: BOTTOMS, guide: "baggy", guideImg: "medidas-baggy.png",
    fit: "Baggy fit",
    desc: "Jean de corte baggy, amplio de cadera a basta, con caída suelta que se acumula sobre las zapatillas. Disponible en lavados lisos, vintage, rasgados y two color." },
  { slug: "jean-ballom", name: "Jean Ballom", estilo: "badass", linea: "bleesst", cat: "jean-ballom", price: 100, old: 140, isNew: true,
    colors: [
      ["Negro", "#222222", ["ballom-negro-a.png", "ballom-negro-b.png", "ballom-negro-c.png", "ballom-negro-d.png", "ballom-negro-e.png"]],
      ["Plomo claro", "#8E9093", ["ballom-plomo-claro-a.png", "ballom-plomo-claro-b.png", "ballom-plomo-claro-c.png", "ballom-plomo-claro-d.png", "ballom-plomo-claro-e.png"]],
      ["Azul vintage", "#3F5161", ["ballom-azul-vintage-a.png", "ballom-azul-vintage-b.png", "ballom-azul-vintage-c.png", "ballom-azul-vintage-d.png", "ballom-azul-vintage-e.png"]],
      ["Hielo", "#A9C8E4", ["ballom-hielo-a.png", "ballom-hielo-b.png", "ballom-hielo-c.png", "ballom-hielo-d.png"]]],
    sizes: BOTTOMS, guide: "ballom", guideImg: "medidas-ballom.png",
    fit: "Balloon fit",
    desc: "Jean de silueta ballom: holgado en muslo y rodilla, con la basta recogida para un volumen marcado. Pretina con ajustadores laterales y lavados con desgaste." },
  { slug: "mom-jean-street", name: "Mom Jean Street", estilo: "badass", linea: "bleesst", cat: "mom-jean-street", price: 100, old: 140,
    colors: [
      ["Negro 2.0", "#232325", ["mom-negro-2-0-a.png", "mom-negro-2-0-b.png", "mom-negro-2-0-c.png", "mom-negro-2-0-d.png"]],
      ["Focal black", "#2C2C2E", ["mom-focal-black-a.png", "mom-focal-black-b.png", "mom-focal-black-c.png", "mom-focal-black-d.png"], { guide: "mom-ezzeta", guideImg: "medidas-mom-ezzeta.png" }],
      ["Focal blue", "#34465E", ["mom-focal-blue-a.png", "mom-focal-blue-b.png", "mom-focal-blue-c.png", "mom-focal-blue-d.png", "mom-focal-blue-e.png"], { guide: "mom-ezzeta", guideImg: "medidas-mom-ezzeta.png" }],
      ["Cenizo 2.0", "#B5BABF", ["mom-cenizo-2-0-a.png", "mom-cenizo-2-0-b.png", "mom-cenizo-2-0-c.png", "mom-cenizo-2-0-d.png"]],
      ["Celeste 2.0", "#6E97C7", ["mom-celeste-2-0-a.png", "mom-celeste-2-0-b.png", "mom-celeste-2-0-c.png", "mom-celeste-2-0-d.png"]],
      ["Sky blue", "#A3C2DE", ["mom-sky-blue-a.png", "mom-sky-blue-b.png", "mom-sky-blue-c.png", "mom-sky-blue-d.png"], { guide: "mom-ezzeta", guideImg: "medidas-mom-ezzeta.png" }],
      ["Hielo 2.0", "#9CC0E3", ["mom-hielo-2-0-a.png", "mom-hielo-2-0-b.png", "mom-hielo-2-0-c.png", "mom-hielo-2-0-d.png", "mom-hielo-2-0-e.png"]]],
    sizes: BOTTOMS, guide: "mom", guideImg: "medidas-mom.png",
    fit: "Mom fit",
    desc: "Jean de tiro alto y pierna recta relajada, con lavados clásicos y efectos de desgaste. Cómodo para el día a día con un estilo urbano." },
  { slug: "jogger-baggy-prime", name: "Jogger Baggy Prime (Cargo)", estilo: "badass", linea: "bleesst", cat: "jogger-baggy-prime", price: 109, old: 150,
    colors: [
      ["Negro", "#151515", ["cargo-negro-a.png", "cargo-negro-b.png", "cargo-negro-c.png", "cargo-negro-d.png"]],
      ["Beige", "#D8D2B4", ["cargo-beige-a.png", "cargo-beige-b.png", "cargo-beige-c.png", "cargo-beige-d.png"]],
      ["Cemento", "#9DAF84", ["cargo-cemento-a.png", "cargo-cemento-b.png", "cargo-cemento-c.png", "cargo-cemento-d.png"]],
      ["Gárgola", "#5C6159", ["cargo-gargola-a.png", "cargo-gargola-b.png", "cargo-gargola-c.png", "cargo-gargola-d.png"]]],
    sizes: BOTTOMS, guide: "jogger", guideImg: "medidas-jogger.png",
    fit: "Baggy fit cargo",
    desc: "Pantalón cargo de corte baggy con bolsillos laterales con tapa, pierna amplia y caída relajada. Funcional y cómodo para un look urbano." },
];

/* Pack Deluxe: el cliente elige su estilo y una prenda de cada paso */
window.PACK = {
  name: "Pack Deluxe",
  discount: 0.20,
  steps: [
    { title: "Elige tu polo o polera", tipos: ["top"] },
    { title: "Elige tu pantalón",       tipos: ["abajo"] },
    { title: "Elige tu casaca", tipos: ["abrigo"] },
  ],
};

/* Guía de tallas (cm) */
window.SIZE_GUIDE = {
  "polera-basica": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","60 – 62","61 – 63","49 – 51"], ["M","63 – 65","62 – 64","50 – 52"], ["L","66 – 68","64 – 66","51 – 53"], ["XL","71 – 73","66 – 68","52 – 54"]] },
  "polera-canguro": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","60 – 62","61 – 63","49 – 51"], ["M","63 – 65","62 – 64","50 – 52"], ["L","66 – 68","64 – 66","51 – 53"], ["XL","71 – 73","66 – 68","52 – 54"]] },
  "polera-cr": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","60 – 62","61 – 63","49 – 51"], ["M","63 – 65","62 – 64","50 – 52"], ["L","66 – 68","64 – 66","51 – 53"], ["XL","71 – 73","66 – 68","52 – 54"]] },
  "jacket-plus": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","67 – 69","58 – 60","74 – 76"], ["M","69 – 71","59 – 61","75 – 77"], ["L","72 – 74","62 – 64","80 – 82"], ["XL","73 – 75","63 – 65","81 – 83"]] },
  "casaca-street": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","65 – 67","58 – 60","55 – 58"], ["M","66 – 68","60 – 62","56 – 59"], ["L","68 – 70","61 – 63","59 – 61"], ["XL","70 – 72","63 – 65","61 – 63"]] },
  "casaca-panter": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","65 – 67","65 – 67","53 – 55"], ["M","65 – 67","68 – 70","54 – 56"], ["L","67 – 69","69 – 71","56 – 58"], ["XL","70 – 72","72 – 74","58 – 60"]] },
  "casaca-bomber": { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","71 – 73","59 – 61","55 – 57"], ["M","75 – 77","64 – 66","56 – 58"], ["L","78 – 80","65 – 67","57 – 59"], ["XL","81 – 83","66 – 68","58 – 60"]] },
  bolonia:  { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","61 – 63","63 – 59","72 – 74"], ["M","64 – 66","65 – 67","76 – 78"], ["L","65 – 70","66 – 68","77 – 79"], ["XL","68 – 70","68 – 70","81 – 83"]] },
  genova:   { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","65 – 67","54 – 55","54 – 56"], ["M","66 – 67","57 – 59","55 – 57"], ["L","67 – 69","59 – 61","56 – 58"], ["XL","69 – 71","60 – 62","58 – 60"]] },
  milano:   { head: ["Talla", "Largo", "Ancho", "Largo manga"], rows: [["S","65 – 67","57 – 59","61 – 63"], ["M","66 – 68","59 – 61","63 – 65"], ["L","68 – 70","61 – 63","63 – 65"], ["XL","70 – 72","62 – 64","65 – 67"]] },
  "pantalon-clasico": { head: ["Talla", "Cintura", "Cadera", "Bota", "Largo", "Muslo"], rows: [["S","39 – 41","40 – 41","17 – 18","94 – 96","27 – 29"], ["M","40 – 42","41 – 42","19 – 20","97 – 98","29 – 31"], ["L","42 – 44","43 – 45","20 – 22","99 – 101","31 – 33"], ["XL","43 – 45","45 – 47","21 – 23","101 – 103","32 – 34"]] },
  "pantalon-sastre":  { head: ["Talla", "Cintura", "Cadera", "Bota", "Largo", "Muslo"], rows: [["S","39 – 41","40 – 41","17 – 18","94 – 96","27 – 29"], ["M","40 – 42","41 – 42","19 – 20","97 – 98","29 – 31"], ["L","42 – 44","43 – 45","20 – 22","99 – 101","31 – 33"], ["XL","43 – 45","45 – 47","21 – 23","101 – 103","32 – 34"]] },
  baggy:    { head: ["Talla", "Largo", "Ancho cintura", "Ancho cadera", "Ancho basta"], rows: [["28","97 – 98","36.5 – 38.5","40 – 42","20 – 22"], ["30","98 – 100","39 – 41","44 – 46","20 – 22"], ["32","100 – 102","40 – 42","45 – 47","22 – 24"], ["34","101 – 103","44 – 46","47 – 49","22.5 – 24.5"], ["36","101 – 103","45 – 47","48 – 50","23 – 25"]] },
  "baggy-rasgado-negro": { head: ["Talla", "Ancho", "Largo"], rows: [["28","40","98"], ["30","43","99"], ["32","44","101"], ["34","46","102"], ["36","48","102"]] },
  ballom:   { head: ["Talla", "Largo", "Ancho cintura", "Ancho cadera", "Ancho muslo", "Ancho basta"], rows: [["28","95 – 97","39 – 41","53 – 55","27 – 29","23 – 25"], ["30","97 – 99","40 – 42","55 – 57","29 – 31","23.5 – 25.5"], ["32","99 – 101","42 – 44","58 – 60","30.5 – 32.5","24 – 26"], ["34","100.5 – 102.5","44.5 – 46.5","61 – 63","32 – 34","25 – 27"], ["36","101 – 103","47 – 49","63 – 65","34 – 36","26 – 28"]] },
  "jean-clasico": { head: ["Talla", "Largo", "Ancho cintura", "Ancho cadera", "Ancho bota"], rows: [["28","98 – 100","44 – 46","37 – 39","19 – 21"], ["30","100 – 102","47 – 49","41 – 43","20 – 22"], ["32","102 – 104","48 – 50","42 – 44","21 – 23"], ["34","103 – 105","51 – 53","46 – 48","22 – 24"], ["36","104 – 106","52 – 54","47 – 49","23 – 25"]] },
  jogger:   { head: ["Talla", "Largo", "Ancho muslo", "Bolsillo", "Ancho basta", "Cintura", "Cadera"], rows: [["28","97.5","28","18 × 18","22","38","46"], ["30","99.5","30","18 × 18","23","40","48"], ["32","100","32","18 × 18","23.5","42","50"], ["34","102","34","19 × 19","24","45.5","52"], ["36","102","35","19 × 19","25","48","54"]] },
  mom:      { head: ["Talla", "Largo", "Ancho cintura", "Ancho cadera", "Ancho bota"], rows: [["28","99","39","42","17"], ["30","100","42.5","43.5","17.5"], ["32","101","45","46","18"], ["34","102","46","47.5","19"], ["36","103","47","50.5","20"]] },
  "mom-ezzeta": { head: ["Talla", "Largo", "Ancho cintura", "Ancho cadera", "Ancho bota"], rows: [["28","98 – 99","38 – 40","41 – 43","16 – 18"], ["30","99 – 101","41.5 – 43.5","42.5 – 44.5","16.5 – 18.5"], ["32","100 – 102","44 – 46","45 – 47","17 – 19"], ["34","101 – 103","45 – 47","46.5 – 48.5","18 – 20"], ["36","102 – 104","46 – 48","49.5 – 51.5","19 – 21"]] },
  luxury:   { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "67.5 – 69.5", "49.5 – 51.5", "12.5 – 14.5", "44 – 46", "14 – 16"], ["M", "68 – 70", "50 – 52", "13 – 15", "45 – 47", "15 – 17"], ["L", "68.5 – 70.5", "52 – 54", "13.5 – 15.5", "46 – 48", "16 – 18"], ["XL", "69 – 71", "53 – 55", "14 – 16", "47 – 49", "17 – 19"]] },
  prime:    { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "67.5 – 69.5", "49.5 – 51.5", "12.5 – 14.5", "44 – 46", "14 – 16"], ["M", "68 – 70", "50 – 52", "13 – 15", "45 – 47", "15 – 17"], ["L", "68.5 – 70.5", "52 – 54", "13.5 – 15.5", "46 – 48", "16 – 18"], ["XL", "69 – 71", "53 – 55", "14 – 16", "47 – 49", "17 – 19"]] },
  monarca:  { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "65 – 67", "46 – 48", "13 – 15", "43 – 45", "14.5 – 16.5"], ["M", "66 – 68", "48 – 50", "13.5 – 15.5", "44 – 46", "15 – 17"], ["L", "67.5 – 69.5", "50 – 52", "14 – 16", "45 – 47", "15.5 – 17.5"], ["XL", "68.5 – 70.5", "52 – 54", "14.5 – 16.5", "46 – 49", "16 – 18"]] },
  business: { head: ["Talla", "Largo", "Ancho", "Ancho hombro", "Hombro a hombro", "Diámetro manga"], rows: [["S", "58 – 60", "44 – 46", "9 – 10", "34 – 36", "13 – 15"], ["M", "60 – 62", "46 – 48", "10 – 12", "36 – 38", "13 – 15"], ["L", "62 – 64", "48 – 50", "12 – 14", "38 – 40", "15 – 17"], ["XL", "64 – 66", "50 – 52", "14 – 16", "40 – 42", "17 – 18"]] },
  tops: { head: ["Talla", "Pecho", "Largo", "Hombro"], rows: [["S", "96 – 100", "68", "43"], ["M", "100 – 104", "70", "45"], ["L", "104 – 110", "72", "47"], ["XL", "110 – 116", "74", "49"]] },
  bottoms: { head: ["Talla", "Cintura", "Cadera", "Largo"], rows: [["28", "72 – 74", "92", "100"], ["30", "76 – 78", "96", "102"], ["32", "80 – 82", "100", "104"], ["34", "84 – 86", "104", "106"], ["36", "88 – 90", "108", "107"]] },
  shoes: { head: ["Talla", "Largo del pie"], rows: [["39", "25.0"], ["40", "25.7"], ["41", "26.4"], ["42", "27.0"], ["43", "27.7"]] },
};
