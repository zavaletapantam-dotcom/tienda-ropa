/* La tienda vive en maison.pe: lo que entra por maison-pe.pages.dev o www.maison.pe
   se manda a maison.pe con la misma ruta (las vistas previas *.maison-pe.pages.dev no se tocan).
   Solo corre en las páginas: fotos y archivos de /img y /assets quedan fuera (ver _routes.json). */
const VIEJOS = ["maison-pe.pages.dev", "www.maison.pe"];

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (VIEJOS.includes(url.hostname)) {
    url.hostname = "maison.pe";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
