-- ============================================
-- MIGRACIÓN: Historial Clínico Completo
-- Fecha: 09 Febrero 2026
-- ============================================

-- Tabla principal de consultas médicas
CREATE TABLE IF NOT EXISTS consultas_medicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  sucursal_id UUID REFERENCES sucursales(id),
  
  -- Datos de la consulta
  fecha_consulta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_consulta VARCHAR(50) NOT NULL CHECK (tipo_consulta IN ('Primera_Vez', 'Subsecuente', 'Urgencia', 'Telemedicina', 'Seguimiento')),
  especialidad VARCHAR(100) NOT NULL,
  motivo_consulta TEXT NOT NULL,
  
  -- Signos vitales
  signos_vitales JSONB DEFAULT '{}'::jsonb, -- {temperatura, presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, peso, talla, imc, glucosa}
  
  -- Exploración física
  exploracion_fisica TEXT,
  
  -- Diagnósticos (pueden ser múltiples)
  diagnosticos JSONB DEFAULT '[]'::jsonb, -- [{codigo_cie10, nombre, tipo: 'principal'|'secundario', notas}]
  
  -- Tratamiento y plan
  plan_tratamiento TEXT,
  indicaciones TEXT,
  pronostico VARCHAR(50) CHECK (pronostico IN ('Bueno', 'Reservado', 'Grave', NULL)),
  
  -- Notas del doctor
  notas_evolucion TEXT,
  notas_privadas TEXT, -- Solo visible para el doctor
  
  -- Estado y seguimiento
  requiere_seguimiento BOOLEAN DEFAULT false,
  fecha_proximo_control DATE,
  dias_incapacidad INTEGER DEFAULT 0,
  
  -- Metadata
  duracion_minutos INTEGER,
  archivos_adjuntos JSONB DEFAULT '[]'::jsonb, -- [{nombre, url, tipo}]
  
  -- Auditoría
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMP
);

-- Tabla de signos vitales (histórico detallado)
CREATE TABLE IF NOT EXISTS signos_vitales_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  consulta_id UUID REFERENCES consultas_medicas(id) ON DELETE SET NULL,
  
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Signos vitales
  temperatura DECIMAL(4,1), -- Celsius
  presion_sistolica INTEGER,
  presion_diastolica INTEGER,
  frecuencia_cardiaca INTEGER, -- latidos por minuto
  frecuencia_respiratoria INTEGER, -- respiraciones por minuto
  saturacion_oxigeno INTEGER, -- porcentaje
  peso DECIMAL(5,2), -- kg
  talla DECIMAL(5,2), -- cm
  imc DECIMAL(5,2), -- calculado
  glucosa INTEGER, -- mg/dL
  
  -- Adicionales
  perimetro_abdominal DECIMAL(5,2), -- cm
  perimetro_cefalico DECIMAL(5,2), -- cm (para pediatría)
  
  observaciones TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de antecedentes médicos del paciente
CREATE TABLE IF NOT EXISTS antecedentes_medicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  
  tipo_antecedente VARCHAR(50) NOT NULL CHECK (tipo_antecedente IN (
    'Personal_Patologico',
    'Personal_No_Patologico',
    'Familiar',
    'Quirurgico',
    'Alergico',
    'Traumatico',
    'Transfusional',
    'Ginecoobstetrico'
  )),
  
  descripcion TEXT NOT NULL,
  fecha_diagnostico DATE,
  esta_activo BOOLEAN DEFAULT true,
  tratamiento_actual TEXT,
  
  -- Para antecedentes familiares
  parentesco VARCHAR(50), -- padre, madre, hermano, abuelo, etc.
  
  notas TEXT,
  
  registrado_por UUID REFERENCES usuarios(id),
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de medicamentos actuales del paciente
CREATE TABLE IF NOT EXISTS medicamentos_actuales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  
  nombre_medicamento VARCHAR(200) NOT NULL,
  dosis VARCHAR(100) NOT NULL,
  via_administracion VARCHAR(50) CHECK (via_administracion IN ('Oral', 'Intravenosa', 'Intramuscular', 'Subcutanea', 'Topica', 'Oftalmica', 'Otica', 'Nasal', 'Rectal', 'Otra')),
  frecuencia VARCHAR(100), -- "Cada 8 horas", "3 veces al día", etc.
  
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  es_cronico BOOLEAN DEFAULT false,
  
  indicacion TEXT,
  prescrito_por VARCHAR(200),
  
  activo BOOLEAN DEFAULT true,
  
  registrado_por UUID REFERENCES usuarios(id),
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas_medicas(paciente_id, fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_doctor ON consultas_medicas(doctor_id, fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas_medicas(fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_signos_paciente ON signos_vitales_historico(paciente_id, fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_antecedentes_paciente ON antecedentes_medicos(paciente_id, tipo_antecedente);
CREATE INDEX IF NOT EXISTS idx_medicamentos_paciente ON medicamentos_actuales(paciente_id, activo);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_historial_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_consultas_timestamp
  BEFORE UPDATE ON consultas_medicas
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

CREATE TRIGGER trigger_antecedentes_timestamp
  BEFORE UPDATE ON antecedentes_medicos
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

CREATE TRIGGER trigger_medicamentos_timestamp
  BEFORE UPDATE ON medicamentos_actuales
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();
