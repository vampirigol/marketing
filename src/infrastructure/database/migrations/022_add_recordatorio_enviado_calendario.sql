-- Marca para no enviar el recordatorio de calendario más de una vez
ALTER TABLE eventos_calendario
  ADD COLUMN IF NOT EXISTS recordatorio_enviado BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_eventos_calendario_recordatorio
  ON eventos_calendario(recordatorio_enviado, fecha_inicio)
  WHERE recordatorio_minutos IS NOT NULL AND recordatorio_minutos > 0;

COMMENT ON COLUMN eventos_calendario.recordatorio_enviado IS 'True después de enviar la notificación de recordatorio';
