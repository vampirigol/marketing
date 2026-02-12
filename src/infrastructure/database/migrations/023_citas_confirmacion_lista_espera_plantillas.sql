-- Token para confirmación de cita por enlace (estilo Bitrix24)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS token_confirmacion VARCHAR(64) UNIQUE;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS confirmada_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_citas_token_confirmacion ON citas(token_confirmacion) WHERE token_confirmacion IS NOT NULL;

-- Lista de espera: solicitudes cuando no hay hueco disponible
CREATE TABLE IF NOT EXISTS solicitudes_lista_espera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo VARCHAR(200) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  email VARCHAR(200),
  sucursal_id UUID REFERENCES sucursales(id),
  especialidad VARCHAR(100),
  preferencia_fecha_desde DATE,
  preferencia_fecha_hasta DATE,
  notas TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Asignada', 'Cancelada', 'Expirada')),
  cita_id UUID REFERENCES citas(id),
  paciente_id UUID REFERENCES pacientes(id),
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lista_espera_estado ON solicitudes_lista_espera(estado);
CREATE INDEX IF NOT EXISTS idx_lista_espera_sucursal ON solicitudes_lista_espera(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_creado ON solicitudes_lista_espera(creado_en DESC);

-- Plantillas de mensajes para citas (nueva cita, recordatorio, aviso retraso)
CREATE TABLE IF NOT EXISTS plantillas_mensajes_citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL UNIQUE CHECK (tipo IN ('nueva_cita', 'confirmacion_cita', 'recordatorio_cita', 'aviso_retraso')),
  titulo VARCHAR(200),
  cuerpo_texto TEXT NOT NULL,
  cuerpo_whatsapp TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plantillas_mensajes_citas (tipo, titulo, cuerpo_texto, cuerpo_whatsapp, variables) VALUES
  ('nueva_cita', 'Nueva cita programada', 'Hola {{nombre}}, su cita ha sido programada para el {{fecha}} a las {{hora}} en {{sucursal}}. Especialidad: {{especialidad}}. Para confirmar: {{enlace_confirmar}}', 'Hola {{nombre}}, su cita fue programada: {{fecha}} {{hora}} en {{sucursal}}. Confirme aquí: {{enlace_confirmar}}', '["nombre","fecha","hora","sucursal","especialidad","enlace_confirmar"]'),
  ('confirmacion_cita', 'Confirmación de cita', 'Su cita ha sido confirmada para el {{fecha}} a las {{hora}}.', 'Cita confirmada: {{fecha}} {{hora}}. Nos vemos.', '["fecha","hora"]'),
  ('recordatorio_cita', 'Recordatorio de cita', 'Recordatorio: tiene cita el {{fecha}} a las {{hora}} en {{sucursal}}.', 'Recordatorio: cita {{fecha}} {{hora}} en {{sucursal}}.', '["fecha","hora","sucursal"]'),
  ('aviso_retraso', 'Aviso por retraso', 'Su cita era a las {{hora}}. ¿Sigue en camino? Responda para confirmar su asistencia.', 'Su cita era a las {{hora}}. ¿Sigue en camino?', '["hora"]')
ON CONFLICT (tipo) DO NOTHING;

COMMENT ON COLUMN citas.token_confirmacion IS 'Token único para enlace de confirmación por el paciente';
COMMENT ON COLUMN citas.confirmada_at IS 'Fecha/hora en que el paciente confirmó por enlace';
COMMENT ON TABLE solicitudes_lista_espera IS 'Solicitudes de cita cuando no hay horario disponible (lista de espera Bitrix24)';
COMMENT ON TABLE plantillas_mensajes_citas IS 'Plantillas para mensajes automáticos: nueva cita, recordatorio, aviso retraso';
