-- ============================================
-- MIGRACIÓN: Bloqueos de agenda por doctor
-- Fecha: 09 Febrero 2026
-- ============================================

CREATE TABLE IF NOT EXISTS doctor_bloqueos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medico_id UUID REFERENCES usuarios(id),
  medico_nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fecha', 'semanal')),
  fecha DATE,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME,
  hora_fin TIME,
  motivo TEXT,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_bloqueos_medico_fecha
  ON doctor_bloqueos (medico_nombre, fecha);

CREATE INDEX IF NOT EXISTS idx_doctor_bloqueos_medico_dia
  ON doctor_bloqueos (medico_nombre, dia_semana);
