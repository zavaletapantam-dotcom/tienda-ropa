-- =========================================================
-- MAISON · Cumpleaños del cliente (opcional)
-- Solo se guarda el día y el mes ("MM-DD"), nunca el año. Lo da el cliente al crear su cuenta o desde "Mi cuenta".
-- cumple_fecha = cuándo lo guardó (sirve para las recompensas: un cumpleaños recién puesto no da regalo ese mismo día).
-- Son columnas nuevas: nada de lo que ya existe en clientes cambia.
-- =========================================================

ALTER TABLE clientes ADD COLUMN cumple TEXT CHECK (cumple IS NULL OR cumple GLOB '[01][0-9]-[0-3][0-9]');
ALTER TABLE clientes ADD COLUMN cumple_fecha TEXT;
