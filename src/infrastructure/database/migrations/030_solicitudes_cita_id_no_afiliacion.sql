-- Permite vincular una solicitud (lead) con la cita creada al convertir.
-- Contact Center muestra solo leads con cita_id IS NULL; al convertir se actualiza cita_id y sucursal.
-- no_afiliacion se asigna al crear el lead para mostrarlo en CRM.
ALTER TABLE solicitudes_contacto
  ADD COLUMN IF NOT EXISTS cita_id UUID REFERENCES citas(id),
  ADD COLUMN IF NOT EXISTS no_afiliacion VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_solicitudes_cita_id ON solicitudes_contacto(cita_id) WHERE cita_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solicitudes_no_afiliacion ON solicitudes_contacto(no_afiliacion) WHERE no_afiliacion IS NOT NULL;

COMMENT ON COLUMN solicitudes_contacto.cita_id IS 'Cuando el lead se convierte a paciente/cita, se vincula aquí. Contact Center solo lista solicitudes con cita_id NULL.';
COMMENT ON COLUMN solicitudes_contacto.no_afiliacion IS 'Número de afiliado asignado automáticamente al crear el lead (formato RCA-YYYY-NNNNN).';
