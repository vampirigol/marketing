-- Multi-Sucursal WhatsApp: configuración por sucursal y enrutamiento por phone_number_id
-- Cada sucursal puede tener su propio número de WhatsApp (phoneNumberId, accessToken, wabaId).
-- Las conversaciones de WhatsApp se asocian a una sucursal; el webhook enruta por metadata.phone_number_id.

-- 1. Columna whatsapp_config en sucursales (1:1 Sucursal ↔ Credenciales WhatsApp)
ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS whatsapp_config JSONB;
COMMENT ON COLUMN sucursales.whatsapp_config IS 'Credenciales WhatsApp Cloud API por sucursal: { "phoneNumberId", "accessToken", "wabaId" }';

-- Índice para búsqueda rápida por phone_number_id en webhooks
CREATE UNIQUE INDEX IF NOT EXISTS idx_sucursales_whatsapp_phone_number_id
  ON sucursales ((whatsapp_config->>'phoneNumberId'))
  WHERE whatsapp_config IS NOT NULL AND whatsapp_config->>'phoneNumberId' IS NOT NULL AND whatsapp_config->>'phoneNumberId' <> '';

-- 2. Columna sucursal_id en conversaciones_matrix (WhatsApp por sucursal; FB/IG sin sucursal)
ALTER TABLE conversaciones_matrix ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id);
COMMENT ON COLUMN conversaciones_matrix.sucursal_id IS 'Sucursal que atiende esta conversación. WhatsApp: obligatorio. Facebook/Instagram: null.';

-- 3. Reemplazar UNIQUE (canal, canal_id) por lógica que permita mismo contacto en distintas sucursales (WhatsApp)
ALTER TABLE conversaciones_matrix DROP CONSTRAINT IF EXISTS unique_canal_usuario;

-- WhatsApp: una conversación por (canal, canal_id, sucursal_id)
CREATE UNIQUE INDEX IF NOT EXISTS unique_conversacion_whatsapp_sucursal
  ON conversaciones_matrix (canal, canal_id, sucursal_id)
  WHERE canal = 'WhatsApp' AND sucursal_id IS NOT NULL;

-- Facebook/Instagram (y WhatsApp legacy sin sucursal): una conversación por (canal, canal_id)
CREATE UNIQUE INDEX IF NOT EXISTS unique_conversacion_canal_canal_id
  ON conversaciones_matrix (canal, canal_id)
  WHERE canal <> 'WhatsApp' OR sucursal_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversaciones_matrix_sucursal ON conversaciones_matrix(sucursal_id);
