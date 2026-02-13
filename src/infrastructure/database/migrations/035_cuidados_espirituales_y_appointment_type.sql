-- ============================================
-- MIGRACIÓN: Cuidados Espirituales + appointment_type en citas
-- Fecha: 12 Febrero 2026
-- ============================================

-- Registro de asistencias a Cuidados Espirituales (para KPI y estado por paciente)
CREATE TABLE IF NOT EXISTS cuidados_espirituales_registro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_atencion DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cuidados_espirituales_paciente ON cuidados_espirituales_registro(paciente_id);
CREATE INDEX IF NOT EXISTS idx_cuidados_espirituales_fecha ON cuidados_espirituales_registro(fecha_atencion);

-- Tipo de cita: MEDICAL (consulta normal) o SPIRITUAL (Cuidados Espirituales) para filtrar en calendario
ALTER TABLE citas
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(20) NOT NULL DEFAULT 'MEDICAL'
CHECK (appointment_type IN ('MEDICAL', 'SPIRITUAL'));

COMMENT ON COLUMN citas.appointment_type IS 'MEDICAL = consulta médica; SPIRITUAL = Cuidados Espirituales (mostrar en violeta en calendario)';
