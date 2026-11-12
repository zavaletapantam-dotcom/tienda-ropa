-- =========================================================
-- Stock físico (almacén), costo, precio mayorista y ventas por mayor
-- stock (columna existente) = stock VIRTUAL: lo que ve el cliente en la página
-- fisico = stock FÍSICO: lo que hay en el almacén, solo para el panel y la contabilidad
-- =========================================================

ALTER TABLE variantes ADD COLUMN fisico INTEGER CHECK (fisico IS NULL OR fisico >= 0);
ALTER TABLE variantes ADD COLUMN fisico_actualizado TEXT;

-- costo = lo que le cuesta la prenda a MAISON · precio_mayor = precio de venta por mayor (solo panel)
ALTER TABLE productos ADD COLUMN costo REAL CHECK (costo IS NULL OR costo >= 0);
ALTER TABLE productos ADD COLUMN precio_mayor REAL CHECK (precio_mayor IS NULL OR precio_mayor >= 0);

-- De dónde salió cada pedido confirmado: del almacén (descuenta virtual y físico) o del proveedor (solo virtual)
ALTER TABLE pedidos ADD COLUMN origen_stock TEXT CHECK (origen_stock IS NULL OR origen_stock IN ('almacen', 'proveedor'));
-- Costo de cada prenda el día de la venta (para la ganancia; no cambia si después cambia el costo)
ALTER TABLE pedido_items ADD COLUMN costo REAL;

-- El historial guarda movimientos de los dos stocks; las entradas guardan costo y proveedor
ALTER TABLE movimientos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'virtual' CHECK (tipo IN ('virtual', 'fisico'));
ALTER TABLE movimientos ADD COLUMN costo_unitario REAL;
ALTER TABLE movimientos ADD COLUMN proveedor TEXT;
ALTER TABLE movimientos ADD COLUMN nota TEXT;
CREATE INDEX movimientos_tipo ON movimientos (tipo, fecha);

-- Ventas por mayor registradas a mano en el panel
CREATE TABLE ventas_mayor (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  cliente TEXT,
  celular TEXT,
  documento TEXT,
  nota TEXT,
  origen_stock TEXT NOT NULL CHECK (origen_stock IN ('almacen', 'proveedor')),
  total REAL NOT NULL DEFAULT 0,
  admin_id INTEGER REFERENCES admins(id)
);
CREATE INDEX ventas_mayor_fecha ON ventas_mayor (fecha);

CREATE TABLE ventas_mayor_items (
  id INTEGER PRIMARY KEY,
  venta_id INTEGER NOT NULL REFERENCES ventas_mayor(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  talla TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 9999),
  precio REAL NOT NULL CHECK (precio >= 0),
  costo REAL
);
CREATE INDEX ventas_mayor_items_venta ON ventas_mayor_items (venta_id);

-- SI PROCEDE: guarda el costo del día, descuenta el stock virtual y, si sale del almacén, también el físico.
-- Si alguno quedaría negativo, la regla de variantes lo impide y no se confirma nada.
DROP TRIGGER pedido_procede;
CREATE TRIGGER pedido_procede AFTER UPDATE OF estado ON pedidos
WHEN OLD.estado = 'pendiente' AND NEW.estado = 'procede'
BEGIN
  UPDATE pedido_items SET costo = (SELECT p.costo FROM productos p WHERE p.slug = pedido_items.slug)
   WHERE pedido_id = NEW.id;
  UPDATE variantes
     SET stock = stock - (SELECT SUM(i.cantidad) FROM pedido_items i
                           WHERE i.pedido_id = NEW.id AND i.slug = variantes.slug
                             AND i.color = variantes.color AND i.talla = variantes.talla),
         actualizado = datetime('now')
   WHERE stock IS NOT NULL
     AND (slug, color, talla) IN (SELECT slug, color, talla FROM pedido_items WHERE pedido_id = NEW.id);
  UPDATE variantes
     SET fisico = fisico - (SELECT SUM(i.cantidad) FROM pedido_items i
                             WHERE i.pedido_id = NEW.id AND i.slug = variantes.slug
                               AND i.color = variantes.color AND i.talla = variantes.talla),
         fisico_actualizado = datetime('now')
   WHERE NEW.origen_stock = 'almacen' AND fisico IS NOT NULL
     AND (slug, color, talla) IN (SELECT slug, color, talla FROM pedido_items WHERE pedido_id = NEW.id);
END;

-- Historial del stock virtual: ahora también guarda una nota (por ejemplo, el código de la venta por mayor)
DROP TRIGGER variante_movimiento;
CREATE TRIGGER variante_movimiento AFTER UPDATE OF stock ON variantes
WHEN OLD.stock IS NOT NEW.stock
BEGIN
  INSERT INTO movimientos (tipo, slug, color, talla, antes, despues, motivo, pedido_id, admin_id, nota)
  VALUES ('virtual', NEW.slug, NEW.color, NEW.talla, OLD.stock, NEW.stock,
          COALESCE((SELECT valor FROM ajustes WHERE clave = 'ctx_motivo'), 'directo'),
          (SELECT CAST(valor AS INTEGER) FROM ajustes WHERE clave = 'ctx_pedido'),
          (SELECT CAST(valor AS INTEGER) FROM ajustes WHERE clave = 'ctx_admin'),
          (SELECT valor FROM ajustes WHERE clave = 'ctx_nota'));
END;

-- Historial del stock físico (kardex): motivo, pedido, administrador, costo, proveedor y nota
CREATE TRIGGER variante_fisico_movimiento AFTER UPDATE OF fisico ON variantes
WHEN OLD.fisico IS NOT NEW.fisico
BEGIN
  INSERT INTO movimientos (tipo, slug, color, talla, antes, despues, motivo, pedido_id, admin_id, costo_unitario, proveedor, nota)
  VALUES ('fisico', NEW.slug, NEW.color, NEW.talla, OLD.fisico, NEW.fisico,
          COALESCE((SELECT valor FROM ajustes WHERE clave = 'ctx_motivo'), 'directo'),
          (SELECT CAST(valor AS INTEGER) FROM ajustes WHERE clave = 'ctx_pedido'),
          (SELECT CAST(valor AS INTEGER) FROM ajustes WHERE clave = 'ctx_admin'),
          (SELECT CAST(valor AS REAL) FROM ajustes WHERE clave = 'ctx_costo'),
          (SELECT valor FROM ajustes WHERE clave = 'ctx_proveedor'),
          (SELECT valor FROM ajustes WHERE clave = 'ctx_nota'));
END;

-- El catálogo de la página solo se rearma cuando cambia lo que ve el cliente (no el físico ni el costo)
DROP TRIGGER variantes_upd;
CREATE TRIGGER variantes_upd AFTER UPDATE OF stock, orden ON variantes BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
DROP TRIGGER productos_upd;
CREATE TRIGGER productos_upd AFTER UPDATE OF nombre, precio, precio_antes, estado, orden ON productos BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
