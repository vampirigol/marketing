-- Pipeline Contact Center: columnas Kanban (lead_status) y KPIs
-- Columnas: Leads WhatsApp, Agendado, Confirmado, Pagado/Cerrado, Remarketing, No Asistió

-- 1. Estado del lead para el Kanban (máquina de estados)
ALTER TABLE solicitudes_contacto
  ADD COLUMN IF NOT EXISTS lead_status VARCHAR(30) DEFAULT 'LEADS_WHATSAPP'
  CHECK (lead_status IN (
    'LEADS_WHATSAPP',  -- Entrada inicial
    'AGENDADO',        -- Tiene cita futura
    'CONFIRMADO',      -- Cita confirmada (manual o bot) -> KPI CONFIRMED_COUNT
    'PAGADO_CERRADO',  -- Pagado/cerrado -> KPI REVENUE
    'REMARKETING',     -- Leads antiguos para recuperar
    'NO_ASISTIO'       -- Automático: pasó fecha y no confirmó/atendió
  ));

ALTER TABLE solicitudes_contacto
  ADD COLUMN IF NOT EXISTS en_lista_recovery BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN solicitudes_contacto.lead_status IS 'Columna del Kanban Contact Center. Automatización: No Confirmado -> No Asistió vía cron horario.';
COMMENT ON COLUMN solicitudes_contacto.en_lista_recovery IS 'Incluido en lista de recuperación al marcar como No Asistió.';

CREATE INDEX IF NOT EXISTS idx_solicitudes_lead_status ON solicitudes_contacto(lead_status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_en_lista_recovery ON solicitudes_contacto(en_lista_recovery) WHERE en_lista_recovery = true;

-- 2. KPIs Contact Center (confirmed_count, revenue por sucursal y fecha)
CREATE TABLE IF NOT EXISTS contact_center_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  fecha DATE NOT NULL,
  confirmed_count INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sucursal_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_contact_center_kpis_sucursal_fecha ON contact_center_kpis(sucursal_id, fecha);
COMMENT ON TABLE contact_center_kpis IS 'KPIs diarios por sucursal: CONFIRMED_COUNT al confirmar cita, REVENUE al pagado/cerrado.';
