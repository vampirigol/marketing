-- ============================================
-- MIGRACIÓN: Sistema de Notificaciones
-- Fecha: 09 Febrero 2026
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Destinatario
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  
  -- Tipo y contenido
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'Receta_Lista',
    'Resultados_Laboratorio',
    'Recordatorio_Ayuno',
    'Cita_Confirmada',
    'Cita_Cancelada',
    'Mensaje_Nuevo',
    'Alerta_Sistema'
  )),
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  
  -- Metadatos
  data JSONB DEFAULT '{}'::jsonb, -- {recetaId, ordenId, citaId, etc}
  
  -- Control
  leida BOOLEAN DEFAULT false,
  fecha_lectura TIMESTAMP,
  enviada BOOLEAN DEFAULT false,
  canal VARCHAR(30) CHECK (canal IN ('App', 'Email', 'SMS', 'Push')),
  
  -- Auditoría
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_paciente ON notificaciones(paciente_id, leida, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo, creado_en DESC);

-- ============================================
-- TABLA DE INTEGRACIONES CON LABORATORIOS
-- ============================================

CREATE TABLE IF NOT EXISTS integraciones_laboratorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  nombre VARCHAR(200) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  tipo_integracion VARCHAR(50) CHECK (tipo_integracion IN ('API', 'Email', 'Manual')),
  
  -- Configuración
  api_url TEXT,
  api_key TEXT,
  email_contacto VARCHAR(200),
  telefono VARCHAR(20),
  
  -- Mapeo de estudios
  mapeo_estudios JSONB DEFAULT '{}'::jsonb, -- {codigo_interno: codigo_laboratorio}
  
  activo BOOLEAN DEFAULT true,
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS envios_laboratorio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  orden_id UUID NOT NULL REFERENCES ordenes_laboratorio(id) ON DELETE CASCADE,
  integracion_id UUID NOT NULL REFERENCES integraciones_laboratorios(id),
  
  -- Control de envío
  fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(30) NOT NULL CHECK (estado IN ('Enviado', 'Confirmado', 'Procesando', 'Completado', 'Error')),
  
  -- IDs externos
  id_externo VARCHAR(200), -- ID asignado por el laboratorio
  folio_externo VARCHAR(200),
  
  -- Respuesta
  respuesta_json JSONB,
  mensaje_error TEXT,
  
  -- Resultados
  resultados_recibidos BOOLEAN DEFAULT false,
  fecha_resultados TIMESTAMP,
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_envios_orden ON envios_laboratorio(orden_id);
CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios_laboratorio(estado, fecha_envio DESC);

-- ============================================
-- DATOS INICIALES: LABORATORIOS
-- ============================================

INSERT INTO integraciones_laboratorios (nombre, codigo, tipo_integracion, email_contacto, telefono, activo) VALUES
('Laboratorio Clínico del Chopo', 'CHOPO', 'API', 'resultados@chopo.com.mx', '8001234567', true),
('Laboratorios Azteca', 'AZTECA', 'Email', 'ordenes@azteca.com.mx', '5551234567', true),
('Laboratorio Médico Polanco', 'POLANCO', 'Manual', 'contacto@polanco.com.mx', '5559876543', true)
ON CONFLICT (codigo) DO NOTHING;

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_integraciones_timestamp
  BEFORE UPDATE ON integraciones_laboratorios
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

CREATE TRIGGER trigger_envios_timestamp
  BEFORE UPDATE ON envios_laboratorio
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();
