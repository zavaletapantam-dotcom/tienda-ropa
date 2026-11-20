-- =========================================================
-- MAISON · La tienda también muestra el stock FÍSICO (almacén de Chimbote)
-- Con stock físico: «Entrega en 24 horas» · sin stock físico (viene de Lima): «Llega en 2 días».
-- El catálogo que ve la tienda se rearma cuando cambia algo de las tallas; antes solo al cambiar el stock
-- virtual o el orden, ahora también al cambiar el stock físico. No cambia ninguna tabla ni ningún dato.
-- =========================================================

DROP TRIGGER variantes_upd;
CREATE TRIGGER variantes_upd AFTER UPDATE OF stock, orden, fisico ON variantes BEGIN
  UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
END;

-- El catálogo guardado se rearma una vez para que ya incluya el stock físico
UPDATE ajustes SET valor = CAST(valor AS INTEGER) + 1 WHERE clave = 'catalogo_ver';
