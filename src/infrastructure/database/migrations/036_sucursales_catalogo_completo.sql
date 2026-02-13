-- ============================================
-- Asegurar todas las sucursales para el catálogo "Agendar Cita"
-- Ciudad Obregón, Ciudad Juárez, Guadalajara (ya existen),
-- Loreto Héroes, Loreto Centro, Valle de la Trinidad, Clínica Adventista Virtual
-- ============================================

-- Insertar sucursales faltantes (por codigo único). No modificar las existentes.
INSERT INTO sucursales (codigo, nombre, direccion, ciudad, estado, telefono, especialidades)
VALUES
  ('RCA-004', 'Loreto Héroes', 'Loreto Héroes', 'Loreto', 'Baja California Sur', '6131234567', ARRAY['Medicina General']),
  ('RCA-005', 'Loreto Centro', 'Loreto Centro', 'Loreto', 'Baja California Sur', '6131234568', ARRAY['Medicina General']),
  ('RCA-006', 'Valle de la Trinidad', 'Valle de la Trinidad', 'Valle de la Trinidad', 'Baja California', '6463000008', ARRAY['Medicina General']),
  ('RCA-007', 'Clínica Adventista Virtual', 'Servicio en Línea', 'Virtual', 'Nacional', '8000000007', ARRAY['Medicina General', 'Telemedicina'])
ON CONFLICT (codigo) DO NOTHING;
