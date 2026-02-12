-- ============================================
-- MIGRACIÓN: Foto de perfil de usuario
-- Fecha: 08 Febrero 2026
-- ============================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS foto_url TEXT;
