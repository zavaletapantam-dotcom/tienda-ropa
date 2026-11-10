/* =========================================================
   CONSTRUIR — arma la carpeta ./dist con solo lo que se publica
   Uso:  npm run construir
   (nunca se publica la raíz: tiene las fotos originales, los .zip y node_modules)
   ========================================================= */
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, ".."), DIST = path.join(ROOT, "dist");
const FIJOS = ["_headers", "_redirects", "_routes.json", "favicon.svg", "apple-touch-icon.png"];
const CARPETAS = ["assets", "img"];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
const html = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
for (const f of [...html, ...FIJOS]) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
for (const d of CARPETAS) fs.cpSync(path.join(ROOT, d), path.join(DIST, d), { recursive: true });

const contar = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? contar(path.join(d, e.name)) : 1), 0);
console.log(`dist listo: ${contar(DIST)} archivos (${html.length} páginas)`);
