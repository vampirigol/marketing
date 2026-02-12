-- ============================================
-- MIGRACIÓN: Archivos Adjuntos del Paciente
-- Fecha: 09 Febrero 2026
-- ============================================

CREATE TABLE IF NOT EXISTS archivos_paciente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Paciente
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  
  -- Datos del archivo
  nombre_archivo VARCHAR(300) NOT NULL,
  tipo_archivo VARCHAR(100) NOT NULL, -- "Radiografía", "Laboratorio", "Tomografía", "Receta", "Otro"
  categoria VARCHAR(50) CHECK (categoria IN (
    'Radiografia',
    'Laboratorio',
    'Tomografia',
    'Resonancia',
    'Ultrasonido',
    'Electrocardiograma',
    'Receta',
    'Consentimiento',
    'Identificacion',
    'Otro'
  )),
  
  -- Almacenamiento
  url_archivo TEXT NOT NULL,
  tamano_bytes BIGINT,
  mime_type VARCHAR(100),
  
  -- Metadatos
  descripcion TEXT,
  fecha_estudio DATE,
  subido_por UUID REFERENCES usuarios(id),
  
  -- Relaciones
  consulta_id UUID REFERENCES consultas_medicas(id) ON DELETE SET NULL,
  orden_id UUID REFERENCES ordenes_laboratorio(id) ON DELETE SET NULL,
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_archivos_paciente ON archivos_paciente(paciente_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_archivos_categoria ON archivos_paciente(categoria, paciente_id);
CREATE INDEX IF NOT EXISTS idx_archivos_consulta ON archivos_paciente(consulta_id);

-- Agregar campo de foto al paciente
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(10);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre VARCHAR(200);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono VARCHAR(20);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(50);
