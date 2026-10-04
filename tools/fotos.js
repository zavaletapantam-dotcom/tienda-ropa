/* =========================================================
   FOTOS — convierte las fotos originales a WebP en varios tamaños
   Uso:  npm run fotos
   1. Pon las fotos originales (JPG/PNG) en la carpeta /fotos
   2. Este programa crea en /img las versiones WebP de 400, 800, 1200 y 1600 px
      (solo hasta el ancho real de la foto) y la lista assets/js/fotos.js
   3. Actualiza en los .html las fotos marcadas con data-foto="nombre.jpg"
      y la versión de los archivos CSS/JS para que el navegador use siempre la última
   ========================================================= */
const fs = require("fs"), path = require("path"), crypto = require("crypto"), sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "fotos"), OUT = path.join(ROOT, "img");
const WIDTHS = [400, 800, 1200, 1600];
const QUALITY = 72;
const hash = buf => crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
const hex = n => n.toString(16).padStart(2, "0");

(async () => {
  const files = fs.readdirSync(SRC).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  const manifest = {};
  let before = 0, after = 0;
  for (const file of files) {
    const base = file.replace(/\.[^.]+$/, "");
    const buf = fs.readFileSync(path.join(SRC, file));
    const img = sharp(buf).rotate();
    const { width, height } = await img.metadata();
    const widths = [...new Set([...WIDTHS.filter(w => w < width), Math.min(width, 1600)])].sort((a, b) => a - b);
    const sizes = {};
    for (const w of widths) {
      const out = await sharp(buf).rotate().resize({ width: w }).webp({ quality: QUALITY, effort: 5 }).toBuffer();
      const name = `${base}-${w}.${hash(out)}.webp`;
      if (!fs.existsSync(path.join(OUT, name))) fs.writeFileSync(path.join(OUT, name), out);
      sizes[w] = name;
      if (w === widths[widths.length - 1]) after += out.length;
    }
    // Borra versiones antiguas de esta foto
    for (const old of fs.readdirSync(OUT)) if (old.startsWith(base + "-") && old.endsWith(".webp") && !Object.values(sizes).includes(old)) fs.unlinkSync(path.join(OUT, old));
    const { data } = await sharp(buf).resize(1, 1, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    manifest[base] = { r: +(height / width).toFixed(4), c: "#" + hex(data[0]) + hex(data[1]) + hex(data[2]), s: sizes };
    before += buf.length;
  }
  fs.writeFileSync(path.join(ROOT, "assets/js/fotos.js"),
    `/* Generado por tools/fotos.js (npm run fotos). No editar a mano. */\nwindow.FOTOS = ${JSON.stringify(manifest)};\n`);

  // Fotos fijas en los .html: <img data-foto="nombre.jpg" data-sizes="100vw" ...>
  const pick = (m, target) => { const ws = Object.keys(m.s).map(Number); return m.s[ws.find(w => w >= target) || ws[ws.length - 1]]; };
  const versions = {};
  for (const f of ["assets/css/styles.css", "assets/js/marca.js", "assets/js/datos.js", "assets/js/fotos.js", "assets/js/app.js"])
    versions[f] = hash(fs.readFileSync(path.join(ROOT, f)));
  for (const html of fs.readdirSync(ROOT).filter(f => f.endsWith(".html"))) {
    let s = fs.readFileSync(path.join(ROOT, html), "utf8");
    s = s.replace(/<img\b[^>]*\bdata-foto="([^"]+)"[^>]*>/g, (tag, foto) => {
      const m = manifest[foto.replace(/\.[^.]+$/, "")];
      if (!m) { console.warn(`  ⚠ ${html}: no existe la foto ${foto}`); return tag; }
      const sizes = (tag.match(/\bdata-sizes="([^"]+)"/) || [])[1] || "100vw";
      let t = tag.replace(/\s(src|srcset|sizes|decoding)="[^"]*"/g, "");
      const srcset = Object.entries(m.s).map(([w, n]) => `img/${n} ${w}w`).join(", ");
      return t.replace(/^<img/, `<img src="img/${pick(m, 800)}" srcset="${srcset}" sizes="${sizes}" decoding="async"`);
    });
    for (const [f, v] of Object.entries(versions))
      s = s.replace(new RegExp(f.replace(/[.]/g, "\\.") + "(\\?v=[a-f0-9]+)?", "g"), `${f}?v=${v}`);
    fs.writeFileSync(path.join(ROOT, html), s);
  }
  console.log(`${files.length} fotos → ${Object.values(manifest).reduce((t, m) => t + Object.keys(m.s).length, 0)} archivos WebP`);
  console.log(`Peso de las fotos en tamaño grande: ${(before / 1048576).toFixed(2)} MB (originales) → ${(after / 1048576).toFixed(2)} MB (WebP)`);
})().catch(e => { console.error(e); process.exit(1); });
