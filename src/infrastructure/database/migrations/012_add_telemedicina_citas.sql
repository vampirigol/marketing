-- ============================================
-- MIGRACIÓN: Telemedicina en citas
-- Fecha: 09 Febrero 2026
-- ============================================

ALTER TABLE citas
ADD COLUMN IF NOT EXISTS telemedicina_link TEXT,
ADD COLUMN IF NOT EXISTS preconsulta JSONB,
ADD COLUMN IF NOT EXISTS documentos JSONB;
