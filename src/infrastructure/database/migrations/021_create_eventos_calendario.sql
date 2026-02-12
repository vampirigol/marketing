-- Eventos de calendario (reuniones, eventos corporativos) - estilo Bitrix24
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS eventos_calendario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'reunion' CHECK (tipo IN ('reunion', 'evento', 'capacitacion', 'recordatorio', 'otro')),
  calendario VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (calendario IN ('personal', 'compania')),
  sucursal_id UUID REFERENCES sucursales(id),
  creado_por_id UUID REFERENCES usuarios(id),
  creado_por_nombre VARCHAR(200),
  ubicacion VARCHAR(300),
  es_todo_el_dia BOOLEAN NOT NULL DEFAULT false,
  es_privado BOOLEAN NOT NULL DEFAULT false,
  color VARCHAR(20) DEFAULT '#3B82F6',
  participantes JSONB DEFAULT '[]'::jsonb,
  recordatorio_minutos INTEGER,
  cita_id UUID REFERENCES citas(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_calendario_fecha ON eventos_calendario(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_calendario ON eventos_calendario(calendario);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_creado_por ON eventos_calendario(creado_por_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_sucursal ON eventos_calendario(sucursal_id);

COMMENT ON TABLE eventos_calendario IS 'Eventos y reuniones del módulo Calendario (personal y compañía)';
