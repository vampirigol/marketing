-- Auditoria de cambios basica
CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidad VARCHAR(50) NOT NULL,
  entidad_id UUID NOT NULL,
  accion VARCHAR(50) NOT NULL,
  usuario_id UUID,
  usuario_nombre VARCHAR(100),
  detalles JSONB,
  fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria_eventos(entidad);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad_id ON auditoria_eventos(entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_evento ON auditoria_eventos(fecha_evento DESC);
