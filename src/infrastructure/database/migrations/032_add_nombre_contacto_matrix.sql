-- Agregar nombre_contacto a conversaciones_matrix para mostrar nombre real de FB/IG
ALTER TABLE conversaciones_matrix ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(200);
COMMENT ON COLUMN conversaciones_matrix.nombre_contacto IS 'Nombre del contacto desde Meta (first_name + last_name) o canal_id si no disponible';
