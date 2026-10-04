/* =========================================================
   DATOS DE LA TIENDA
   Todo lo que se edita está en este archivo:
   número de WhatsApp, nombre, productos, categorías y pack.
   ========================================================= */

window.CONFIG = {
  // Código de país + número, sin "+", espacios ni guiones. Ej. Perú: "51987654321"
  whatsapp: "51900000000",
  store: "Tu Marca",
  tagline: "Menswear",
  email: "contacto@tumarca.com",
  city: "Lima, Perú",
  hours: "Lun – Sáb · 9:00 a 20:00",
  envioLima: 10,
  envioProvincia: 15,
  envioGratisDesde: 200,
  diasCambio: 2,
  social: { instagram: "#", facebook: "#", tiktok: "#" },
};

/* Categorías: el "img" es la foto de la tarjeta (carpeta img/) */
window.CATEGORIES = [
  { slug: "polos",      name: "Polos",      img: "polo-blanco-modelo.jpg" },
  { slug: "camisas",    name: "Camisas",    img: "camisa-celeste.jpg" },
  { slug: "poleras",    name: "Poleras",    img: "polera-gris.jpg" },
  { slug: "pantalones", name: "Pantalones", img: "pantalon-chino-khaki.jpg" },
  { slug: "jeans",      name: "Jeans",      img: "jean-oscuro.jpg" },
  { slug: "casacas",    name: "Casacas",    img: "casaca-parka-olivo.jpg" },
  { slug: "blazers",    name: "Blazers",    img: "blazer-negro.jpg" },
];

/* Colecciones (agrupan productos de distintas categorías) */
window.COLLECTIONS = [
  { slug: "perfect-business", name: "Perfect Business", desc: "Prendas de corte entallado para la oficina y después." },
  { slug: "esenciales",       name: "Esenciales",       desc: "Básicos con actitud que combinan con todo." },
  { slug: "sastre",           name: "Sastre",           desc: "Elegancia formal para ocasiones importantes." },
];

const TOPS = ["S", "M", "L", "XL"];
const BOTTOMS = ["28", "30", "32", "34", "36"];

/* Productos
   - deal: true  → aparece en "Ofertas del día" con etiqueta de descuento
   - isNew: true → etiqueta "Nuevo"
   - imgs: la primera es la principal; la segunda aparece al pasar el mouse */
window.PRODUCTS = [
  // Polos
  { slug: "polo-blanco-prime", name: "Polo Blanco Prime", cat: "polos", col: "esenciales", price: 35, old: 70, deal: true,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["polo-blanco-modelo.jpg", "polo-blanco-percha.jpg"],
    fit: "Slim fit", material: "100% algodón pima, 180 g",
    desc: "Polo de corte slim que se ajusta al cuerpo sin apretar. Cuello redondo reforzado que no se deforma y tela suave que mantiene el color lavado tras lavado." },
  { slug: "polo-luxury-negro", name: "Polo Luxury Negro", cat: "polos", col: "perfect-business", price: 50, old: 100, deal: true,
    colors: [["Negro", "#1A1A18"]], sizes: TOPS, imgs: ["polo-luxury-negro.jpg", "polo-business-negro.jpg"],
    fit: "Regular fit", material: "100% algodón peinado, 200 g",
    desc: "Nuestro polo más vendido en negro profundo con detalle estampado en el pecho. Tela gruesa que cae bien y no transparenta." },
  { slug: "polo-original-crema", name: "Polo Original Crema", cat: "polos", col: "esenciales", price: 40, old: 80, deal: true,
    colors: [["Crema", "#E9E1CF"]], sizes: TOPS, imgs: ["polo-original-crema.jpg", "polos-doblados.jpg"],
    fit: "Oversize", material: "100% algodón, 190 g",
    desc: "Polo de corte oversize con estampado frontal en azul. Hombro caído y largo extendido para un look urbano relajado." },
  { slug: "polo-skeleton-negro", name: "Polo Skeleton Negro", cat: "polos", col: "esenciales", price: 50, old: 75, isNew: true,
    colors: [["Negro", "#1A1A18"]], sizes: TOPS, imgs: ["polo-skeleton-negro.jpg", "polo-luxury-negro.jpg"],
    fit: "Regular fit", material: "100% algodón peinado, 190 g",
    desc: "Estampado gráfico en blanco sobre polo negro. Una prenda con personalidad para salir de lo básico." },
  { slug: "polo-basico-blanco", name: "Polo Básico Blanco", cat: "polos", col: "esenciales", price: 45, old: 70, isNew: true,
    colors: [["Blanco", "#F4F4F2"], ["Negro", "#1A1A18"], ["Plomo", "#8C8C88"]], sizes: TOPS, imgs: ["polo-basico-blanco.jpg", "polo-blanco-modelo.jpg"],
    fit: "Slim fit", material: "100% algodón pima, 170 g",
    desc: "El básico que todo hombre necesita. Disponible en blanco, negro y plomo para combinar con cualquier outfit." },
  { slug: "polo-perla", name: "Polo Perla", cat: "polos", col: "esenciales", price: 50, old: 75, isNew: true,
    colors: [["Perla", "#DCDCD6"]], sizes: TOPS, imgs: ["polo-perla.jpg", "polo-basico-blanco.jpg"],
    fit: "Regular fit", material: "100% algodón, 180 g",
    desc: "Un tono perla suave que va con jeans, chinos o shorts. Cómodo para el día a día." },
  { slug: "polo-perfect-business-negro", name: "Polo Perfect Business Negro", cat: "polos", col: "perfect-business", price: 50, old: 80, isNew: true,
    colors: [["Negro", "#1A1A18"], ["Blanco", "#F4F4F2"], ["Verde", "#2F4A3A"], ["Beige", "#D9C9AE"]], sizes: TOPS, imgs: ["polo-business-negro.jpg", "polo-luxury-negro.jpg"],
    fit: "Slim fit", material: "Algodón con elastano, 200 g",
    desc: "Polo de corte entallado con logo bordado. Tela con elastano que acompaña el movimiento y luce impecable bajo un blazer." },
  { slug: "polo-perfect-business-blanco", name: "Polo Perfect Business Blanco", cat: "polos", col: "perfect-business", price: 50, old: 80,
    colors: [["Blanco", "#F4F4F2"], ["Negro", "#1A1A18"]], sizes: TOPS, imgs: ["polo-blanco-detalle.jpg", "polo-blanco-percha.jpg"],
    fit: "Slim fit", material: "Algodón con elastano, 200 g",
    desc: "La versión en blanco de nuestra línea Perfect Business, con logo pequeño en el pecho." },
  { slug: "polo-street-blanco", name: "Polo Street Blanco", cat: "polos", col: "esenciales", price: 50, old: 75,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["polo-street-blanco.jpg", "polo-blanco-detalle.jpg"],
    fit: "Regular fit", material: "100% algodón, 190 g",
    desc: "Estampado en la espalda para un estilo urbano. Combínalo con jeans y zapatillas." },

  // Camisas
  { slug: "camisa-oxford-celeste", name: "Camisa Oxford Celeste", cat: "camisas", col: "perfect-business", price: 85, old: 120, isNew: true,
    colors: [["Celeste", "#A9C4DE"]], sizes: TOPS, imgs: ["camisa-celeste.jpg", "camisas-dobladas.jpg"],
    fit: "Slim fit", material: "100% algodón oxford",
    desc: "Camisa oxford de manga larga, ideal para la oficina. Se puede usar con o sin corbata." },
  { slug: "camisa-formal-blanca", name: "Camisa Formal Blanca", cat: "camisas", col: "sastre", price: 89, old: 130, deal: true,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["camisa-blanca.jpg", "camisas-dobladas.jpg"],
    fit: "Slim fit", material: "Algodón popelina",
    desc: "Camisa blanca de vestir con cuello italiano. La base perfecta para un terno o un blazer." },

  // Poleras
  { slug: "polera-hoodie-gris", name: "Polera Hoodie Gris", cat: "poleras", col: "esenciales", price: 95, old: 140, isNew: true,
    colors: [["Gris melange", "#A8A8A4"]], sizes: TOPS, imgs: ["polera-gris.jpg", "polera-blanca.jpg"],
    fit: "Regular fit", material: "Algodón french terry, interior perchado",
    desc: "Polera con capucha y bolsillo canguro. Abriga sin pesar y es perfecta para el invierno limeño." },
  { slug: "polera-crew-blanca", name: "Polera Crew Blanca", cat: "poleras", col: "esenciales", price: 85, old: 120,
    colors: [["Blanco", "#F4F4F2"]], sizes: TOPS, imgs: ["polera-blanca.jpg", "polera-gris.jpg"],
    fit: "Regular fit", material: "Algodón french terry",
    desc: "Polera de cuello redondo, limpia y minimalista. Va igual de bien con jeans que con chinos." },

  // Pantalones
  { slug: "pantalon-chino-khaki", name: "Pantalón Chino Khaki", cat: "pantalones", col: "esenciales", price: 89, old: 130, deal: true,
    colors: [["Khaki", "#BFA77F"]], sizes: BOTTOMS, imgs: ["pantalon-chino-khaki.jpg", "outfit-flatlay.jpg"],
    fit: "Slim fit", material: "Drill de algodón con elastano",
    desc: "Chino de corte slim con un toque de elastano para mayor comodidad. Funciona para la oficina y el fin de semana." },
  { slug: "pantalon-sastre-azul", name: "Pantalón Sastre Azul", cat: "pantalones", col: "sastre", price: 120, old: 180,
    colors: [["Azul", "#2E4A7A"]], sizes: BOTTOMS, imgs: ["terno-azul.jpg", "hero-terno-detalle.jpg"],
    fit: "Slim fit", material: "Lanilla con textura",
    desc: "Pantalón de vestir con textura sutil. Se vende solo o como parte del terno." },

  // Jeans
  { slug: "jean-clasico-oscuro", name: "Jean Clásico Oscuro", cat: "jeans", col: "esenciales", price: 99, old: 150, isNew: true,
    colors: [["Azul oscuro", "#2B3A55"]], sizes: BOTTOMS, imgs: ["jean-oscuro.jpg", "jeans-apilados.jpg"],
    fit: "Slim fit", material: "Denim 12 oz con elastano",
    desc: "Jean de lavado oscuro y corte slim. El jean que usarás con todo." },
  { slug: "jean-rasgado-azul", name: "Jean Rasgado Azul", cat: "jeans", col: "esenciales", price: 99, old: 140, deal: true,
    colors: [["Azul", "#4A6A94"]], sizes: BOTTOMS, imgs: ["jean-rasgado.jpg", "jeans-apilados.jpg"],
    fit: "Skinny fit", material: "Denim stretch",
    desc: "Jean con rasgados en las rodillas y lavado medio. Ideal para un look urbano." },
  { slug: "jean-negro-slim", name: "Jean Negro Slim", cat: "jeans", col: "esenciales", price: 99, old: 150,
    colors: [["Negro", "#1A1A18"]], sizes: BOTTOMS, imgs: ["jean-negro.jpg", "jean-oscuro.jpg"],
    fit: "Slim fit", material: "Denim 12 oz con elastano",
    desc: "Jean negro que no se decolora fácilmente. Combina con polos claros y casacas." },

  // Casacas
  { slug: "casaca-cuero-negra", name: "Casaca de Cuero Negra", cat: "casacas", col: "esenciales", price: 220, old: 320, deal: true,
    colors: [["Negro", "#1A1A18"]], sizes: TOPS, imgs: ["casaca-cuero-negra.jpg", "blazer-negro.jpg"],
    fit: "Slim fit", material: "Cuero sintético, forro interior",
    desc: "Casaca estilo biker con cierres metálicos. Una prenda que no pasa de moda." },
  { slug: "casaca-bomber-camel", name: "Casaca Bomber Camel", cat: "casacas", col: "esenciales", price: 160, old: 220, isNew: true,
    colors: [["Camel", "#B4693F"]], sizes: TOPS, imgs: ["casaca-bomber-camel.jpg", "blazer-camel.jpg"],
    fit: "Regular fit", material: "Poliéster satinado, forro acolchado",
    desc: "Bomber ligera con puños y basta acanalados. Ideal para las noches frescas." },
  { slug: "casaca-parka-olivo", name: "Casaca Parka Olivo", cat: "casacas", col: "esenciales", price: 180, old: 260,
    colors: [["Olivo", "#55593F"]], sizes: TOPS, imgs: ["casaca-parka-olivo.jpg", "casaca-bomber-camel.jpg"],
    fit: "Regular fit", material: "Algodón encerado, capucha",
    desc: "Parka con capucha y bolsillos amplios. Resistente a la garúa y lista para el invierno." },
  { slug: "casaca-denim-corduroy", name: "Casaca Denim Corduroy", cat: "casacas", col: "esenciales", price: 150, old: 210, isNew: true,
    colors: [["Azul", "#3E5878"]], sizes: TOPS, imgs: ["casaca-denim.jpg", "jean-rasgado.jpg"],
    fit: "Regular fit", material: "Denim 14 oz, cuello de corduroy",
    desc: "Casaca de jean con cuello de corduroy marrón. Un clásico con un detalle que la hace distinta." },

  // Blazers
  { slug: "blazer-negro-slim", name: "Blazer Negro Slim", cat: "blazers", col: "sastre", price: 240, old: 350,
    colors: [["Negro", "#1A1A18"]], sizes: TOPS, imgs: ["blazer-negro.jpg", "hero-terno-azul.jpg"],
    fit: "Slim fit", material: "Mezcla de lana, forro completo",
    desc: "Blazer de un botón y solapa delgada. Úsalo con camisa para eventos o con polo para un look casual." },
  { slug: "blazer-camel", name: "Blazer Camel", cat: "blazers", col: "sastre", price: 230, old: 330, isNew: true,
    colors: [["Camel", "#B08A5E"]], sizes: TOPS, imgs: ["blazer-camel.jpg", "pantalon-chino-khaki.jpg"],
    fit: "Regular fit", material: "Mezcla de lana, medio forro",
    desc: "Blazer en tono camel que eleva cualquier outfit, desde un polo blanco hasta una camisa." },
];

/* Pack: el cliente elige una prenda de cada paso y obtiene el descuento */
window.PACK = {
  name: "Pack Deluxe",
  discount: 0.20,
  steps: [
    { title: "Elige tu polo",     cats: ["polos"] },
    { title: "Elige tu pantalón", cats: ["pantalones", "jeans"] },
    { title: "Elige tu abrigo",   cats: ["casacas", "poleras"] },
  ],
};

/* Guía de tallas (cm) */
window.SIZE_GUIDE = {
  tops: { head: ["Talla", "Pecho", "Largo", "Hombro"], rows: [["S", "96 – 100", "68", "43"], ["M", "100 – 104", "70", "45"], ["L", "104 – 110", "72", "47"], ["XL", "110 – 116", "74", "49"]] },
  bottoms: { head: ["Talla", "Cintura", "Cadera", "Largo"], rows: [["28", "72 – 74", "92", "100"], ["30", "76 – 78", "96", "102"], ["32", "80 – 82", "100", "104"], ["34", "84 – 86", "104", "106"], ["36", "88 – 90", "108", "107"]] },
};
