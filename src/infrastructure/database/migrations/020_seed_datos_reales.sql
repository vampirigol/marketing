-- Seed de datos reales para CRM, Matrix y Citas
-- Ejecutar después de que el schema esté aplicado
-- Uso: npm run db:seed

-- Pacientes para solicitudes y conversaciones
INSERT INTO pacientes (nombre_completo, telefono, email, fecha_nacimiento, edad, sexo, no_afiliacion, tipo_afiliacion, ciudad, estado, origen_lead)
SELECT 'María González López', '3312345678', 'maria.gonzalez@email.com', '1990-05-15', 34, 'F', 'AF001', 'Particular', 'Guadalajara', 'Jalisco', 'WhatsApp'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE no_afiliacion = 'AF001');

INSERT INTO pacientes (nombre_completo, telefono, email, fecha_nacimiento, edad, sexo, no_afiliacion, tipo_afiliacion, ciudad, estado, origen_lead)
SELECT 'Carlos Sánchez Martínez', '6569876543', 'carlos.sanchez@email.com', '1985-08-22', 39, 'M', 'AF002', 'IMSS', 'Ciudad Juárez', 'Chihuahua', 'Facebook'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE no_afiliacion = 'AF002');

INSERT INTO pacientes (nombre_completo, telefono, email, fecha_nacimiento, edad, sexo, no_afiliacion, tipo_afiliacion, ciudad, estado, origen_lead)
SELECT 'Ana Rodríguez Pérez', '6445551234', 'ana.rodriguez@email.com', '1992-11-10', 32, 'F', 'AF003', 'Particular', 'Ciudad Obregón', 'Sonora', 'Instagram'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE no_afiliacion = 'AF003');

-- Solicitudes de contacto (leads reales) - usan sucursales existentes del schema (RCA-001, RCA-002, RCA-003)
INSERT INTO solicitudes_contacto (nombre_completo, telefono, email, sucursal_id, sucursal_nombre, motivo, preferencia_contacto, estado, prioridad, origen, creado_por, crm_status)
SELECT 'María González López', '3312345678', 'maria.gonzalez@email.com', s.id, s.nombre, 'Consulta_General', 'WhatsApp', 'Pendiente', 'Media', 'WhatsApp', 'admin', 'new'
FROM sucursales s WHERE s.codigo = 'RCA-001'
AND NOT EXISTS (SELECT 1 FROM solicitudes_contacto sc WHERE sc.nombre_completo = 'María González López' AND sc.telefono = '3312345678' LIMIT 1);

INSERT INTO solicitudes_contacto (nombre_completo, telefono, email, sucursal_id, sucursal_nombre, motivo, preferencia_contacto, estado, prioridad, origen, creado_por, crm_status)
SELECT 'Carlos Sánchez Martínez', '6569876543', 'carlos.sanchez@email.com', s.id, s.nombre, 'Reagendar_Cita', 'Telefono', 'Asignada', 'Alta', 'Facebook', 'admin', 'reviewing'
FROM sucursales s WHERE s.codigo = 'RCA-002'
AND NOT EXISTS (SELECT 1 FROM solicitudes_contacto sc WHERE sc.nombre_completo = 'Carlos Sánchez Martínez' AND sc.telefono = '6569876543' LIMIT 1);

INSERT INTO solicitudes_contacto (nombre_completo, telefono, email, sucursal_id, sucursal_nombre, motivo, preferencia_contacto, estado, prioridad, origen, creado_por, crm_status)
SELECT 'Ana Rodríguez Pérez', '6445551234', 'ana.rodriguez@email.com', s.id, s.nombre, 'Consulta_Odontologica', 'WhatsApp', 'En_Contacto', 'Media', 'Instagram', 'admin', 'in-progress'
FROM sucursales s WHERE s.codigo = 'RCA-003'
AND NOT EXISTS (SELECT 1 FROM solicitudes_contacto sc WHERE sc.nombre_completo = 'Ana Rodríguez Pérez' AND sc.telefono = '6445551234' LIMIT 1);

-- Conversaciones Matrix (reales)
INSERT INTO conversaciones_matrix (paciente_id, canal, canal_id, estado, prioridad, ultimo_mensaje, etiquetas)
SELECT p.id, 'WhatsApp', '3312345678', 'Activa', 'Normal', 
  'Hola, quisiera agendar una cita por la promoción de limpieza dental', ARRAY['Promoción', 'Limpieza']
FROM pacientes p WHERE p.no_afiliacion = 'AF001'
ON CONFLICT (canal, canal_id) DO NOTHING;

INSERT INTO conversaciones_matrix (paciente_id, canal, canal_id, estado, prioridad, ultimo_mensaje, etiquetas)
SELECT p.id, 'Facebook', 'fb_carlos_123', 'Pendiente', 'Alta',
  '¿Tienen horario disponible para mañana? Es urgente', ARRAY['Urgente']
FROM pacientes p WHERE p.no_afiliacion = 'AF002'
ON CONFLICT (canal, canal_id) DO NOTHING;

INSERT INTO conversaciones_matrix (paciente_id, canal, canal_id, estado, prioridad, ultimo_mensaje, etiquetas)
SELECT p.id, 'Instagram', 'ig_ana_456', 'Activa', 'Normal',
  'Buenos días, me interesa la consulta oftalmológica', ARRAY['Consulta', 'Oftalmología']
FROM pacientes p WHERE p.no_afiliacion = 'AF003'
ON CONFLICT (canal, canal_id) DO NOTHING;

-- Mensajes para las conversaciones
INSERT INTO mensajes_matrix (conversacion_id, es_paciente, contenido, tipo_mensaje)
SELECT c.id, true, 'Hola, quisiera agendar una cita por la promoción de limpieza dental', 'texto'
FROM conversaciones_matrix c WHERE c.canal = 'WhatsApp' AND c.canal_id = '3312345678'
AND NOT EXISTS (SELECT 1 FROM mensajes_matrix m WHERE m.conversacion_id = c.id);

INSERT INTO mensajes_matrix (conversacion_id, es_paciente, contenido, tipo_mensaje)
SELECT c.id, true, '¿Tienen horario disponible para mañana? Es urgente', 'texto'
FROM conversaciones_matrix c WHERE c.canal = 'Facebook' AND c.canal_id = 'fb_carlos_123'
AND NOT EXISTS (SELECT 1 FROM mensajes_matrix m WHERE m.conversacion_id = c.id);

INSERT INTO mensajes_matrix (conversacion_id, es_paciente, contenido, tipo_mensaje)
SELECT c.id, true, 'Buenos días, me interesa la consulta oftalmológica', 'texto'
FROM conversaciones_matrix c WHERE c.canal = 'Instagram' AND c.canal_id = 'ig_ana_456'
AND NOT EXISTS (SELECT 1 FROM mensajes_matrix m WHERE m.conversacion_id = c.id);
