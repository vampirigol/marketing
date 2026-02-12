-- ============================================
-- MIGRACIÓN: Archivos Adjuntos en Mensajes
-- Fecha: 09 Febrero 2026
-- ============================================

-- Agregar campos para archivos adjuntos en mensajes
ALTER TABLE mensajes_matrix ADD COLUMN IF NOT EXISTS archivo_url TEXT;
ALTER TABLE mensajes_matrix ADD COLUMN IF NOT EXISTS archivo_nombre VARCHAR(500);
ALTER TABLE mensajes_matrix ADD COLUMN IF NOT EXISTS archivo_tipo VARCHAR(100);
ALTER TABLE mensajes_matrix ADD COLUMN IF NOT EXISTS archivo_tamano BIGINT;
ALTER TABLE mensajes_matrix ADD COLUMN IF NOT EXISTS audio_duracion INTEGER; -- segundos para mensajes de voz

-- Actualizar tipo_mensaje para incluir nuevos tipos
ALTER TABLE mensajes_matrix DROP CONSTRAINT IF EXISTS mensajes_matrix_tipo_mensaje_check;
ALTER TABLE mensajes_matrix ADD CONSTRAINT mensajes_matrix_tipo_mensaje_check 
  CHECK (tipo_mensaje IN ('texto', 'imagen', 'audio', 'archivo', 'video', 'sistema'));

-- Agregar campo de estado de entrega
ALTER TABLE mensajes_matrix ADD COLUMN IF NOT EXISTS estado_entrega VARCHAR(20) DEFAULT 'enviado';
ALTER TABLE mensajes_matrix ADD CONSTRAINT mensajes_matriz_estado_entrega_check
  CHECK (estado_entrega IN ('enviando', 'enviado', 'entregado', 'leido', 'fallido'));

-- Índice para búsqueda de archivos
CREATE INDEX IF NOT EXISTS idx_mensajes_archivos ON mensajes_matrix(conversacion_id) 
  WHERE archivo_url IS NOT NULL;

COMMENT ON COLUMN mensajes_matrix.archivo_url IS 'URL del archivo adjunto (imagen, audio, documento)';
COMMENT ON COLUMN mensajes_matrix.archivo_nombre IS 'Nombre original del archivo';
COMMENT ON COLUMN mensajes_matrix.archivo_tipo IS 'MIME type del archivo';
COMMENT ON COLUMN mensajes_matrix.audio_duracion IS 'Duración en segundos para mensajes de voz';
COMMENT ON COLUMN mensajes_matrix.estado_entrega IS 'Estado de entrega del mensaje';
