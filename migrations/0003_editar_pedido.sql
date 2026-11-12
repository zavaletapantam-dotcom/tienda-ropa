-- =========================================================
-- MAISON · Editar pedidos desde el panel
-- Solo se editan los pedidos POR CONFIRMAR (el stock todavía no se tocó).
-- Se puede quitar, agregar, cambiar cantidad, talla, color y precio de cada prenda, y el descuento.
-- =========================================================

-- Quién editó el pedido y cuándo (se muestra en el panel)
ALTER TABLE pedidos ADD COLUMN editado TEXT;
ALTER TABLE pedidos ADD COLUMN editado_por INTEGER REFERENCES admins(id);

-- Las prendas de un pedido ya confirmado o cancelado no se pueden cambiar:
-- así el stock descontado y la ganancia de un pedido confirmado nunca se descuadran.
CREATE TRIGGER items_solo_pendiente_ins BEFORE INSERT ON pedido_items
WHEN (SELECT estado FROM pedidos WHERE id = NEW.pedido_id) <> 'pendiente'
BEGIN
  SELECT RAISE(ABORT, 'PEDIDO_YA_PROCESADO');
END;

CREATE TRIGGER items_solo_pendiente_del BEFORE DELETE ON pedido_items
WHEN (SELECT estado FROM pedidos WHERE id = OLD.pedido_id) <> 'pendiente'
BEGIN
  SELECT RAISE(ABORT, 'PEDIDO_YA_PROCESADO');
END;

-- (el costo sí se puede escribir: lo guarda la propia base al confirmar)
CREATE TRIGGER items_solo_pendiente_upd BEFORE UPDATE OF slug, color, talla, cantidad, precio ON pedido_items
WHEN (SELECT estado FROM pedidos WHERE id = OLD.pedido_id) <> 'pendiente'
BEGIN
  SELECT RAISE(ABORT, 'PEDIDO_YA_PROCESADO');
END;
