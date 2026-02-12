-- ============================================
-- MIGRACIÓN: Plantillas de respuesta rápida
-- Fecha: 09 Febrero 2026
-- ============================================

CREATE TABLE IF NOT EXISTS plantillas_respuesta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  contenido TEXT NOT NULL,
  etiquetas TEXT[] DEFAULT ARRAY[]::TEXT[],
  es_global BOOLEAN NOT NULL DEFAULT false,
  activa BOOLEAN NOT NULL DEFAULT true,
  uso_count INTEGER NOT NULL DEFAULT 0,
  creado_por UUID REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plantillas_usuario ON plantillas_respuesta(usuario_id);
CREATE INDEX idx_plantillas_global ON plantillas_respuesta(es_global) WHERE es_global = true;
