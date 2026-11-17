-- =========================================================
-- MAISON · Puntos MAISON, recompensas y cupones · nombre y foto propios del cliente
--
-- PUNTOS: 1 sol = 1 punto. Los da cada pedido de un cliente con cuenta cuando se CONFIRMA en el panel
--   (prendas menos descuentos, SIN envío; sin céntimos). Solo cuentan los pedidos confirmados desde que
--   existe esta tabla: los pedidos confirmados antes no dan puntos. Los puntos no vencen.
-- RECOMPENSAS: se manejan en el panel (cuántos puntos cuesta y qué da). Al canjear, el cliente recibe un CUPÓN.
-- CUPÓN: se usa en el carrito, uno por pedido. Estados: activo → en_pedido → usado (pedido confirmado)
--   o devuelto (pedido cancelado: vuelven sus puntos) · anulado (desde el panel).
-- Son tablas y columnas nuevas: nada de lo que ya existe cambia.
-- =========================================================

CREATE TABLE recompensas (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  puntos INTEGER NOT NULL CHECK (puntos > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('monto', 'porcentaje', 'envio')),
  valor REAL NOT NULL DEFAULT 0 CHECK (valor >= 0),
  activa INTEGER NOT NULL DEFAULT 1,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado TEXT
);
INSERT INTO recompensas (nombre, puntos, tipo, valor) VALUES
  ('S/10 de descuento', 200, 'monto', 10),
  ('10% de descuento', 250, 'porcentaje', 10),
  ('Envío gratis', 500, 'envio', 0);

-- Cada canje crea un cupón con una copia de la recompensa (si después se edita la recompensa, el cupón no cambia)
CREATE TABLE cupones (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  recompensa_id INTEGER REFERENCES recompensas(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('monto', 'porcentaje', 'envio')),
  valor REAL NOT NULL DEFAULT 0,
  puntos INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'en_pedido', 'usado', 'devuelto', 'anulado')),
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado TEXT
);
CREATE INDEX cupones_cliente ON cupones (cliente_id, estado);

-- Historial de puntos: el saldo de cada cliente es la suma de cantidad
-- motivo: pedido (+, al confirmar) · canje (−) · devolucion (+, pedido con cupón cancelado o cupón anulado) · ajuste (±, desde el panel)
CREATE TABLE puntos (
  id INTEGER PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad <> 0),
  motivo TEXT NOT NULL CHECK (motivo IN ('pedido', 'canje', 'devolucion', 'ajuste')),
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
  cupon_id INTEGER REFERENCES cupones(id) ON DELETE SET NULL,
  nota TEXT,
  admin_id INTEGER,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX puntos_cliente ON puntos (cliente_id);
CREATE UNIQUE INDEX puntos_por_pedido ON puntos (pedido_id) WHERE motivo = 'pedido';

-- Foto de perfil que sube el cliente (ya achicada a 400 × 400 en su celular). Se ve en /api/foto/<token>
CREATE TABLE fotos_clientes (
  token TEXT PRIMARY KEY,
  cliente_id INTEGER NOT NULL UNIQUE REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  datos TEXT NOT NULL,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Si el cliente cambió su nombre o su foto, al volver a entrar con Google ya no se reemplazan
ALTER TABLE clientes ADD COLUMN nombre_propio INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clientes ADD COLUMN foto_propia INTEGER NOT NULL DEFAULT 0;

-- Cupón usado en el pedido. Su descuento ya está sumado en "descuento" (cupon_desc dice cuánto de ese descuento es del cupón);
-- con envío gratis, el envío queda en 0. Si el cupón ya no servía al llegar el pedido: cupon_codigo queda anotado y cupon_tipo vacío.
ALTER TABLE pedidos ADD COLUMN cupon_id INTEGER REFERENCES cupones(id) ON DELETE SET NULL;
ALTER TABLE pedidos ADD COLUMN cupon_codigo TEXT;
ALTER TABLE pedidos ADD COLUMN cupon_nombre TEXT;
ALTER TABLE pedidos ADD COLUMN cupon_tipo TEXT;
ALTER TABLE pedidos ADD COLUMN cupon_valor REAL;
ALTER TABLE pedidos ADD COLUMN cupon_desc REAL NOT NULL DEFAULT 0;

-- =========================================================
-- REGLAS DENTRO DE LA BASE
-- =========================================================

-- Nadie puede quedar con puntos en negativo (canjes y ajustes)
CREATE TRIGGER puntos_sin_negativo BEFORE INSERT ON puntos
WHEN NEW.cantidad < 0
BEGIN
  SELECT RAISE(ABORT, 'PUNTOS_INSUFICIENTES')
   WHERE COALESCE((SELECT SUM(cantidad) FROM puntos WHERE cliente_id = NEW.cliente_id), 0) + NEW.cantidad < 0;
END;

-- Un pedido solo puede llevar un cupón activo del mismo cliente; al guardarse, el cupón queda "en el pedido"
CREATE TRIGGER pedido_cupon_valido BEFORE INSERT ON pedidos
WHEN NEW.cupon_id IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'CUPON_NO_DISPONIBLE')
   WHERE NOT EXISTS (SELECT 1 FROM cupones WHERE id = NEW.cupon_id AND estado = 'activo' AND cliente_id = NEW.cliente_id);
END;
CREATE TRIGGER pedido_cupon_reservar AFTER INSERT ON pedidos
WHEN NEW.cupon_id IS NOT NULL
BEGIN
  UPDATE cupones SET estado = 'en_pedido', pedido_id = NEW.id, actualizado = datetime('now') WHERE id = NEW.cupon_id;
END;

-- AL CONFIRMAR: el cliente gana sus puntos (prendas menos descuentos, sin envío) y el cupón queda usado
CREATE TRIGGER pedido_da_puntos AFTER UPDATE OF estado ON pedidos
WHEN OLD.estado = 'pendiente' AND NEW.estado = 'procede' AND NEW.cliente_id IS NOT NULL
  AND CAST(ROUND(NEW.total - COALESCE(NEW.envio, 0), 2) AS INTEGER) > 0
BEGIN
  INSERT INTO puntos (cliente_id, cantidad, motivo, pedido_id)
  VALUES (NEW.cliente_id, CAST(ROUND(NEW.total - COALESCE(NEW.envio, 0), 2) AS INTEGER), 'pedido', NEW.id);
END;
CREATE TRIGGER pedido_cupon_usado AFTER UPDATE OF estado ON pedidos
WHEN OLD.estado = 'pendiente' AND NEW.estado = 'procede' AND NEW.cupon_id IS NOT NULL
BEGIN
  UPDATE cupones SET estado = 'usado', actualizado = datetime('now') WHERE id = NEW.cupon_id AND estado = 'en_pedido';
END;

-- AL CANCELAR: si llevaba cupón, se anula y el cliente recupera los puntos que pagó por él
CREATE TRIGGER pedido_cupon_devuelto AFTER UPDATE OF estado ON pedidos
WHEN OLD.estado = 'pendiente' AND NEW.estado = 'cancelado' AND NEW.cupon_id IS NOT NULL
BEGIN
  INSERT INTO puntos (cliente_id, cantidad, motivo, pedido_id, cupon_id, nota)
    SELECT cliente_id, puntos, 'devolucion', NEW.id, id, 'Pedido cancelado' FROM cupones WHERE id = NEW.cupon_id AND estado = 'en_pedido';
  UPDATE cupones SET estado = 'devuelto', actualizado = datetime('now') WHERE id = NEW.cupon_id AND estado = 'en_pedido';
END;
