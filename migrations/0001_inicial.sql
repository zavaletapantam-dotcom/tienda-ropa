-- =========================================================
-- MAISON: base de datos de la tienda (Cloudflare D1, SQLite)
-- Fechas en UTC con datetime('now'); los reportes las pasan a hora de Perú (-5 h).
-- =========================================================

-- Ajustes y datos internos: configuración de la tienda, catálogo ya armado para la página,
-- y el "contexto" de cada cambio de stock (motivo, pedido y administrador) que usa el historial.
CREATE TABLE ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT
);
INSERT INTO ajustes (clave, valor) VALUES ('catalogo_ver', '1');

-- Productos tal como se ven en la tienda (los de datos.js; se sincronizan al publicar).
-- precio = lo que paga el cliente · precio_antes = precio tachado (NULL si no tiene descuento)
CREATE TABLE productos (
  slug TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  base TEXT,
  estilo TEXT NOT NULL,
  linea TEXT NOT NULL,
  cat TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  precio REAL CHECK (precio IS NULL OR precio >= 0),
  precio_antes REAL CHECK (precio_antes IS NULL OR precio_antes >= 0),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'agotado', 'oculto')),
  actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stock por color y talla. NULL = todavía sin cargar. Nunca puede quedar negativo.
CREATE TABLE variantes (
  slug TEXT NOT NULL REFERENCES productos(slug) ON DELETE CASCADE,
  color TEXT NOT NULL,
  talla TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  stock INTEGER CHECK (stock IS NULL OR stock >= 0),
  actualizado TEXT,
  PRIMARY KEY (slug, color, talla)
);

-- Administradores del panel. clave = PBKDF2-SHA256 (nunca la contraseña en texto).
CREATE TABLE admins (
  id INTEGER PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nombre TEXT NOT NULL,
  clave TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  ultimo_acceso TEXT
);

-- Enlaces de activación del panel: se guarda solo el resumen SHA-256 del enlace; sirven una vez.
CREATE TABLE invitaciones (
  token TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  expira TEXT NOT NULL,
  usada TEXT,
  admin_id INTEGER REFERENCES admins(id)
);

-- Clientes que crean su cuenta con Google
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  nombre TEXT,
  foto TEXT,
  acepto TEXT NOT NULL,
  promos INTEGER NOT NULL DEFAULT 0,
  promos_fecha TEXT,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  ultimo_acceso TEXT
);

-- Sesiones del panel y de los clientes: se guarda solo el resumen SHA-256 del token
CREATE TABLE sesiones (
  token TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'cliente')),
  usuario_id INTEGER NOT NULL,
  creada TEXT NOT NULL DEFAULT (datetime('now')),
  expira TEXT NOT NULL
);
CREATE INDEX sesiones_usuario ON sesiones (tipo, usuario_id);

-- Intentos fallidos de entrar al panel (bloqueo temporal) y límites de envíos públicos
CREATE TABLE intentos (
  clave TEXT PRIMARY KEY,
  fallos INTEGER NOT NULL,
  hasta TEXT
);
CREATE TABLE limites (
  clave TEXT PRIMARY KEY,
  cuenta INTEGER NOT NULL,
  expira TEXT NOT NULL
);

-- Pedidos consultados por WhatsApp. estado: pendiente → procede (se descuenta stock) o cancelado (no se toca)
CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  origen TEXT NOT NULL CHECK (origen IN ('carrito', 'producto', 'pack')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procede', 'cancelado')),
  procesado TEXT,
  procesado_por INTEGER REFERENCES admins(id),
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  nombre TEXT,
  celular TEXT,
  entrega TEXT,
  distrito TEXT,
  direccion TEXT,
  referencia TEXT,
  destino TEXT,
  agencia TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  descuento REAL NOT NULL DEFAULT 0,
  envio REAL,
  total REAL NOT NULL DEFAULT 0,
  precio_pendiente INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX pedidos_estado ON pedidos (estado, creado);
CREATE INDEX pedidos_cliente ON pedidos (cliente_id);

CREATE TABLE pedido_items (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  talla TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 20),
  precio REAL
);
CREATE INDEX items_pedido ON pedido_items (pedido_id);
CREATE INDEX items_variante ON pedido_items (slug, color, talla);

-- Historial de cada cambio de stock (lo llena la base sola, ver el disparador de variantes)
CREATE TABLE movimientos (
  id INTEGER PRIMARY KEY,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  slug TEXT NOT NULL,
  color TEXT NOT NULL,
  talla TEXT NOT NULL,
  antes INTEGER,
  despues INTEGER,
  motivo TEXT NOT NULL,
  pedido_id INTEGER,
  admin_id INTEGER
);
CREATE INDEX movimientos_fecha ON movimientos (fecha);
CREATE INDEX movimientos_variante ON movimientos (slug, color, talla);

-- Libro de Reclamaciones (Código de Protección y Defensa del Consumidor). numero = AAAA-000001
CREATE TABLE reclamos (
  id INTEGER PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  tipo TEXT NOT NULL CHECK (tipo IN ('reclamo', 'queja')),
  nombre TEXT NOT NULL,
  documento_tipo TEXT NOT NULL,
  documento TEXT NOT NULL,
  domicilio TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  menor INTEGER NOT NULL DEFAULT 0,
  apoderado TEXT,
  bien TEXT NOT NULL CHECK (bien IN ('producto', 'servicio')),
  monto REAL,
  descripcion TEXT NOT NULL,
  pedido_codigo TEXT,
  detalle TEXT NOT NULL,
  pedido_consumidor TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'respondido')),
  respuesta TEXT,
  respondido TEXT,
  respondido_por INTEGER REFERENCES admins(id)
);

-- =========================================================
-- REGLAS DENTRO DE LA BASE (no dependen del código de la página)
-- =========================================================

-- Un pedido se procesa una sola vez: si ya procedió o se canceló, no puede cambiar de estado.
CREATE TRIGGER pedido_una_sola_vez BEFORE UPDATE OF estado ON pedidos
WHEN OLD.estado <> 'pendiente' AND NEW.estado <> OLD.estado
BEGIN
  SELECT RAISE(ABORT, 'PEDIDO_YA_PROCESADO');
END;

-- SI PROCEDE: se descuenta del stock exactamente lo que se pidió en cada color y talla.
-- Si alguna prenda no tiene stock suficiente, el stock quedaría negativo, la regla de
-- variantes lo impide y todo se deshace (el pedido sigue pendiente y nada se descuenta).
-- SI SE CANCELA: no hay ninguna regla que toque el stock.
CREATE TRIGGER pedido_procede AFTER UPDATE OF estado ON pedidos
WHEN OLD.estado = 'pendiente' AND NEW.estado = 'procede'
BEGIN
  UPDATE variantes
     SET stock = stock - (SELECT SUM(i.cantidad) FROM pedido_items i
                           WHERE i.pedido_id = NEW.id AND i.slug = variantes.slug
                             AND i.color = variantes.color AND i.talla = variantes.talla),
         actualizado = datetime('now')
   WHERE stock IS NOT NULL
     AND (slug, color, talla) IN (SELECT slug, color, talla FROM pedido_items WHERE pedido_id = NEW.id);
END;

-- Cada cambio de stock queda en el historial con su motivo, pedido y administrador
CREATE TRIGGER variante_movimiento AFTER UPDATE OF stock ON variantes
WHEN OLD.stock IS NOT NEW.stock
BEGIN
  INSERT INTO movimientos (slug, color, talla, antes, despues, motivo, pedido_id, admin_id)
  VALUES (NEW.slug, NEW.color, NEW.talla, OLD.stock, NEW.stock,
          COALESCE((SELECT valor FROM ajustes WHERE clave = 'ctx_motivo'), 'directo'),
          (SELECT CAST(valor AS INTEGER) FROM ajustes WHERE clave = 'ctx_pedido'),
          (SELECT CAST(valor AS INTEGER) FROM ajustes WHERE clave = 'ctx_admin'));
END;

-- Cualquier cambio de productos o stock invalida el catálogo armado: la página lo vuelve a leer
CREATE TRIGGER productos_ins AFTER INSERT ON productos BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
CREATE TRIGGER productos_upd AFTER UPDATE ON productos BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
CREATE TRIGGER productos_del AFTER DELETE ON productos BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
CREATE TRIGGER variantes_ins AFTER INSERT ON variantes BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
CREATE TRIGGER variantes_upd AFTER UPDATE ON variantes BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
CREATE TRIGGER variantes_del AFTER DELETE ON variantes BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
