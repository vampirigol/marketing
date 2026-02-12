-- Unificar origen del lead con canales para reportes y SLA: TikTok, YouTube, Email.
-- Permite distinguir canal en solicitudes y reportes.
ALTER TABLE solicitudes_contacto DROP CONSTRAINT IF EXISTS solicitudes_contacto_origen_check;
ALTER TABLE solicitudes_contacto ADD CONSTRAINT solicitudes_contacto_origen_check
  CHECK (origen IN ('Web', 'WhatsApp', 'Facebook', 'Instagram', 'Telefono', 'TikTok', 'YouTube', 'Email'));

COMMENT ON COLUMN solicitudes_contacto.origen IS 'Canal de origen del lead: Web, WhatsApp, Facebook, Instagram, Telefono, TikTok, YouTube, Email. Unificado para reportes y SLA.';
