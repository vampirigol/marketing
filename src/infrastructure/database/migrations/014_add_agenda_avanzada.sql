-- ============================================
-- MIGRACIÓN: Gestión avanzada de agenda
-- Fecha: 09 Febrero 2026
-- ============================================

-- Agregar tipo de bloqueo (categoría) a doctor_bloqueos
ALTER TABLE doctor_bloqueos
ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) DEFAULT 'personal' 
CHECK (categoria IN ('vacaciones', 'comida', 'urgencia', 'personal', 'otro'));

-- Tabla de configuración de duraciones por tipo de consulta y especialidad
CREATE TABLE IF NOT EXISTS config_consultas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  especialidad VARCHAR(100) NOT NULL,
  tipo_consulta VARCHAR(50) NOT NULL CHECK (tipo_consulta IN ('Primera_Vez', 'Subsecuente', 'Urgencia', 'Telemedicina')),
  duracion_minutos INTEGER NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0),
  intervalo_minutos INTEGER NOT NULL DEFAULT 15 CHECK (intervalo_minutos > 0),
  max_empalmes INTEGER NOT NULL DEFAULT 1 CHECK (max_empalmes >= 0),
  color_hex VARCHAR(7) DEFAULT '#3b82f6',
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_por UUID REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (especialidad, tipo_consulta)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_config_consultas_especialidad ON config_consultas(especialidad);
CREATE INDEX IF NOT EXISTS idx_config_consultas_activo ON config_consultas(activo) WHERE activo = true;

-- Insertar configuraciones por defecto
INSERT INTO config_consultas (especialidad, tipo_consulta, duracion_minutos, intervalo_minutos, max_empalmes, color_hex) VALUES
  ('Odontología', 'Primera_Vez', 60, 15, 1, '#10b981'),
  ('Odontología', 'Subsecuente', 45, 15, 1, '#3b82f6'),
  ('Odontología', 'Urgencia', 30, 15, 2, '#ef4444'),
  ('Odontología', 'Telemedicina', 30, 15, 3, '#8b5cf6'),
  ('Oftalmología', 'Primera_Vez', 45, 15, 1, '#10b981'),
  ('Oftalmología', 'Subsecuente', 30, 15, 1, '#3b82f6'),
  ('Oftalmología', 'Urgencia', 20, 10, 2, '#ef4444'),
  ('Oftalmología', 'Telemedicina', 25, 15, 3, '#8b5cf6'),
  ('Medicina General', 'Primera_Vez', 40, 15, 1, '#10b981'),
  ('Medicina General', 'Subsecuente', 25, 15, 1, '#3b82f6'),
  ('Medicina General', 'Urgencia', 20, 10, 2, '#ef4444'),
  ('Medicina General', 'Telemedicina', 25, 15, 4, '#8b5cf6'),
  ('Psicología', 'Primera_Vez', 60, 30, 1, '#10b981'),
  ('Psicología', 'Subsecuente', 50, 30, 1, '#3b82f6'),
  ('Psicología', 'Urgencia', 40, 20, 1, '#ef4444'),
  ('Psicología', 'Telemedicina', 50, 30, 2, '#8b5cf6'),
  ('Nutrición', 'Primera_Vez', 50, 20, 1, '#10b981'),
  ('Nutrición', 'Subsecuente', 35, 20, 1, '#3b82f6'),
  ('Nutrición', 'Urgencia', 25, 15, 1, '#ef4444'),
  ('Nutrición', 'Telemedicina', 35, 20, 2, '#8b5cf6')
ON CONFLICT (especialidad, tipo_consulta) DO NOTHING;
