/* =========================================================
   BASE — mantiene la base de datos D1 al día con datos.js
   Uso:
     node tools/base.js migrar       [--local | --prueba | --real]   crea o actualiza las tablas
     node tools/base.js sincronizar  [--local | --prueba | --real]   productos y tallas de datos.js
     node tools/base.js invitar "Nombre" [--local | --prueba | --real]   enlace para activar un acceso al panel

   sincronizar: agrega lo nuevo de datos.js y quita lo que ya no existe en la tienda.
   Nunca toca el stock, los precios ni el estado de lo que ya estaba: eso se maneja en el panel.
   ========================================================= */
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DESTINOS = {
  local: { db: "maison-db", flags: ["--local"], web: "http://localhost:8788" },
  prueba: { db: "maison-db-prueba", flags: ["--remote", "--env", "preview"], web: "https://prueba-dominio.maison-pe.pages.dev" },
  real: { db: "maison-db", flags: ["--remote"], web: "https://maison.pe" },
};
const args = process.argv.slice(2);
const destino = args.includes("--real") ? "real" : args.includes("--prueba") ? "prueba" : "local";
const D = DESTINOS[destino];

function wrangler(...a) {
  const r = spawnSync("npx", ["-y", "wrangler@latest", ...a], { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status || 1);
}
function ejecutarSQL(sql, nombre) {
  const f = path.join(os.tmpdir(), `maison-${nombre}-${Date.now()}.sql`);
  fs.writeFileSync(f, sql);
  try { wrangler("d1", "execute", D.db, ...D.flags, "--file", f, "--yes"); } finally { fs.rmSync(f, { force: true }); }
}
const q = v => (v == null ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

function datos() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/js/datos.js"), "utf8"), ctx);
  return ctx.window;
}

function sincronizar() {
  const W = datos(), P = W.PRODUCTS;
  const prod = P.map((p, i) => `(${[p.slug, p.name, p.base || null, p.estilo, p.linea, p.cat, i, p.price ?? null, p.old ?? null].map(q).join(", ")})`);
  const vars = [];
  P.forEach(p => p.colors.forEach((c, ci) => p.sizes.forEach((t, ti) => vars.push([p.slug, c[0], t, ci * 100 + ti]))));
  const config = { envio: W.CONFIG.envio, gratisDesde: W.CONFIG.envioGratisDesde, packDescuento: W.PACK.discount, packPasos: W.PACK.steps.length };
  const sql = [
    // Productos: lo nuevo entra con el precio de datos.js; lo que ya estaba conserva precio y estado
    `INSERT INTO productos (slug, nombre, base, estilo, linea, cat, orden, precio, precio_antes) VALUES\n${prod.join(",\n")}\n` +
      `ON CONFLICT(slug) DO UPDATE SET nombre = excluded.nombre, base = excluded.base, estilo = excluded.estilo, linea = excluded.linea, cat = excluded.cat, orden = excluded.orden;`,
    `DELETE FROM productos WHERE slug NOT IN (${P.map(p => q(p.slug)).join(", ")});`,
    // Tallas por color: las nuevas entran "sin cargar"; el stock de las existentes no se toca
    `INSERT INTO variantes (slug, color, talla, orden) VALUES\n${vars.map(v => `(${v.map(q).join(", ")})`).join(",\n")}\n` +
      `ON CONFLICT(slug, color, talla) DO UPDATE SET orden = excluded.orden WHERE variantes.orden <> excluded.orden;`,
    `DELETE FROM variantes WHERE slug || '|' || color || '|' || talla NOT IN (${vars.map(v => q(`${v[0]}|${v[1]}|${v[2]}`)).join(", ")});`,
    `INSERT INTO ajustes (clave, valor) VALUES ('config', ${q(JSON.stringify(config))}) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor;`,
  ].join("\n");
  console.log(`Sincronizando ${P.length} productos y ${vars.length} tallas con la base ${destino}…`);
  ejecutarSQL(sql, "sincronizar");
}

function invitar(nombre) {
  if (!nombre || nombre.startsWith("--")) { console.error('Falta el nombre: node tools/base.js invitar "Nombre" --real'); process.exit(1); }
  const token = crypto.randomBytes(32).toString("base64url");
  const resumen = crypto.createHash("sha256").update(token).digest("hex");
  ejecutarSQL(`INSERT INTO invitaciones (token, nombre, expira) VALUES (${q(resumen)}, ${q(nombre)}, datetime('now', '+48 hours'));`, "invitar");
  // El enlace no se imprime: queda en un archivo local que no se sube a ningún lado (_hoja está en .gitignore)
  const dir = path.join(ROOT, "_hoja"), f = path.join(dir, "accesos-admin.txt");
  fs.mkdirSync(dir, { recursive: true });
  const vence = new Date(Date.now() + 48 * 3600e3).toLocaleString("es-PE", { timeZone: "America/Lima" });
  fs.appendFileSync(f, `${nombre} (${destino}) · vence ${vence} · sirve una sola vez\n${D.web}/admin#activar=${token}\n\n`);
  console.log(`Enlace de activación para ${nombre} guardado en ${f}`);
}

const [cmd, extra] = args;
if (cmd === "migrar") wrangler("d1", "migrations", "apply", D.db, ...D.flags);
else if (cmd === "sincronizar") sincronizar();
else if (cmd === "invitar") invitar(extra);
else { console.log("Uso: node tools/base.js migrar|sincronizar|invitar \"Nombre\" [--local|--prueba|--real]"); process.exit(1); }
