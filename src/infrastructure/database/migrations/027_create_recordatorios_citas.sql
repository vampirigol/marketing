-- ============================================
-- MIGRACIÓN: Recordatorios de citas persistentes
-- Fecha: 10 Febrero 2026
-- ============================================
-- Permite programar recordatorios que persisten entre reinicios del servidor
-- y se ejecutan vía job cron usando datos reales de citas y pacientes

CREATE TABLE IF NOT EXISTS recordatorios_citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('confirmacion', 'recordatorio_24h', 'recordatorio_dia', 'recordatorio_2h')),
  fecha_ejecucion TIMESTAMP NOT NULL,
  ejecutado BOOLEAN NOT NULL DEFAULT false,
  ejecutado_at TIMESTAMP,
  canal VARCHAR(20) DEFAULT 'whatsapp' CHECK ( canal IN ('whatsapp', 'sms', 'email')),
  mensaje_id VARCHAR(100),
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recordatorios_citas_pendientes 
  ON recordatorios_citas(fecha_ejecucion, ejecutado) 
  WHERE ejecutado = false;

CREATE INDEX IF NOT EXISTS idx_recordatorios_citas_cita 
  ON recordatorios_citas(cita_id);

COMMENT ON TABLE recordatorios_citas IS 'Recordatorios programados para citas; ejecutados por CitasRecordatorioScheduler';
