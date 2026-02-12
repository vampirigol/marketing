-- ============================================
-- MIGRACIÓN: Buffer entre citas
-- Fecha: 10 Febrero 2026
-- ============================================

ALTER TABLE config_consultas
  ADD COLUMN IF NOT EXISTS buffer_minutos INTEGER NOT NULL DEFAULT 5 CHECK (buffer_minutos >= 0);

COMMENT ON COLUMN config_consultas.buffer_minutos IS 'Minutos de buffer entre citas para evitar retrasos en cascada';
