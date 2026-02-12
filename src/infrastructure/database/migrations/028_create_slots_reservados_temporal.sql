-- ============================================
-- MIGRACIÓN: Slot holding - bloqueo temporal de slots
-- Fecha: 10 Febrero 2026
-- ============================================
-- Evita doble reserva cuando dos usuarios seleccionan el mismo slot simultáneamente

CREATE TABLE IF NOT EXISTS slots_reservados_temporal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  fecha_cita DATE NOT NULL,
  hora_cita TIME NOT NULL,
  medico_asignado VARCHAR(200),
  session_id VARCHAR(100) NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slots_reservados_busqueda 
  ON slots_reservados_temporal(sucursal_id, fecha_cita, hora_cita, expira_en);

-- Índice simple en expira_en (sin predicado - CURRENT_TIMESTAMP no es inmutable en predicados)
CREATE INDEX IF NOT EXISTS idx_slots_reservados_expira 
  ON slots_reservados_temporal(expira_en);

COMMENT ON TABLE slots_reservados_temporal IS 'Bloqueo temporal de slots durante el flujo de reserva (5-10 min)';
