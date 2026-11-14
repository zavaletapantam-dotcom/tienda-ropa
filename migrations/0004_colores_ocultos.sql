-- =========================================================
-- MAISON · Encender y apagar colores desde el panel (Stock)
-- Un color apagado no se ve en la tienda ni se puede pedir, hasta que se vuelva a encender.
-- Es una tabla aparte: el stock (virtual y físico), los precios y el historial no se tocan.
-- =========================================================

CREATE TABLE colores_ocultos (
  slug TEXT NOT NULL REFERENCES productos(slug) ON DELETE CASCADE,
  color TEXT NOT NULL,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  admin_id INTEGER,
  PRIMARY KEY (slug, color)
);

-- La página vuelve a leer el catálogo cuando se apaga o se enciende un color
CREATE TRIGGER colores_ocultos_ins AFTER INSERT ON colores_ocultos BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;
CREATE TRIGGER colores_ocultos_del AFTER DELETE ON colores_ocultos BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;

-- Si un color se quita de la tienda (datos.js), su marca de "apagado" se va con él
CREATE TRIGGER colores_ocultos_limpiar AFTER DELETE ON variantes
WHEN NOT EXISTS (SELECT 1 FROM variantes WHERE slug = OLD.slug AND color = OLD.color)
BEGIN
  DELETE FROM colores_ocultos WHERE slug = OLD.slug AND color = OLD.color;
END;
