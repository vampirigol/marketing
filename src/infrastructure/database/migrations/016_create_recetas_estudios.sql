-- ============================================
-- MIGRACIÓN: Recetas Médicas y Órdenes de Laboratorio
-- Fecha: 09 Febrero 2026
-- ============================================

-- Extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RECETAS MÉDICAS
-- ============================================

CREATE TABLE IF NOT EXISTS recetas_medicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  consulta_id UUID REFERENCES consultas_medicas(id) ON DELETE SET NULL,
  sucursal_id UUID REFERENCES sucursales(id),
  
  -- Datos generales
  fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  folio VARCHAR(50) UNIQUE,
  
  -- Diagnóstico
  diagnostico TEXT NOT NULL,
  indicaciones_generales TEXT,
  
  -- Control
  estado VARCHAR(30) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Surtida', 'Cancelada', 'Vencida')),
  fecha_vencimiento DATE,
  
  -- Firma y seguridad
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMP,
  firma_digital TEXT, -- Hash o firma electrónica
  
  -- Notas
  notas_medicas TEXT,
  
  -- Auditoría
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recetas_medicamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receta_id UUID NOT NULL REFERENCES recetas_medicas(id) ON DELETE CASCADE,
  
  -- Medicamento
  nombre_medicamento VARCHAR(200) NOT NULL,
  presentacion VARCHAR(100), -- "Tabletas", "Jarabe", "Ampolletas", etc.
  concentracion VARCHAR(50), -- "500mg", "10ml", etc.
  
  -- Prescripción
  cantidad INTEGER NOT NULL, -- Número de unidades a dispensar
  dosis VARCHAR(100) NOT NULL, -- "1 tableta", "5ml", etc.
  frecuencia VARCHAR(100) NOT NULL, -- "Cada 8 horas", "3 veces al día"
  via_administracion VARCHAR(50) CHECK (via_administracion IN ('Oral', 'Intravenosa', 'Intramuscular', 'Subcutánea', 'Tópica', 'Oftálmica', 'Ótica', 'Nasal', 'Rectal', 'Otra')),
  duracion_dias INTEGER, -- Duración del tratamiento
  
  -- Indicaciones específicas
  indicaciones TEXT, -- "Tomar con alimentos", "Evitar alcohol", etc.
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CATÁLOGO DE ESTUDIOS DE LABORATORIO
-- ============================================

CREATE TABLE IF NOT EXISTS catalogo_estudios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL, -- "Química Sanguínea", "Hematología", "Microbiología", etc.
  descripcion TEXT,
  
  -- Información del estudio
  requiere_ayuno BOOLEAN DEFAULT false,
  tiempo_ayuno_horas INTEGER,
  preparacion_especial TEXT,
  tiempo_resultados_horas INTEGER DEFAULT 24,
  
  -- Precios
  precio_base DECIMAL(10,2),
  precio_urgente DECIMAL(10,2),
  
  -- Control
  activo BOOLEAN DEFAULT true,
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÓRDENES DE LABORATORIO
-- ============================================

CREATE TABLE IF NOT EXISTS ordenes_laboratorio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  consulta_id UUID REFERENCES consultas_medicas(id) ON DELETE SET NULL,
  sucursal_id UUID REFERENCES sucursales(id),
  
  -- Datos generales
  fecha_orden TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  folio VARCHAR(50) UNIQUE,
  
  -- Información clínica
  diagnostico_presuntivo TEXT NOT NULL,
  indicaciones_especiales TEXT,
  es_urgente BOOLEAN DEFAULT false,
  
  -- Control y seguimiento
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En_Proceso', 'Completada', 'Cancelada')),
  laboratorio_externo VARCHAR(200), -- Nombre del laboratorio donde se procesará
  
  -- Resultados
  fecha_toma_muestra TIMESTAMP,
  fecha_resultados_esperados DATE,
  fecha_resultados_recibidos TIMESTAMP,
  resultados_archivo_url TEXT, -- URL del PDF o imagen con resultados
  resultados_observaciones TEXT,
  
  -- Firma
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMP,
  
  -- Auditoría
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordenes_estudios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id UUID NOT NULL REFERENCES ordenes_laboratorio(id) ON DELETE CASCADE,
  estudio_id UUID NOT NULL REFERENCES catalogo_estudios(id) ON DELETE RESTRICT,
  
  -- Resultado individual del estudio
  resultado_valor TEXT,
  resultado_interpretacion TEXT,
  valores_referencia TEXT,
  estado VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Procesando', 'Completado')),
  
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Recetas
CREATE INDEX IF NOT EXISTS idx_recetas_paciente ON recetas_medicas(paciente_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_recetas_doctor ON recetas_medicas(doctor_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_recetas_consulta ON recetas_medicas(consulta_id);
CREATE INDEX IF NOT EXISTS idx_recetas_estado ON recetas_medicas(estado, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_recetas_folio ON recetas_medicas(folio);

-- Órdenes de laboratorio
CREATE INDEX IF NOT EXISTS idx_ordenes_paciente ON ordenes_laboratorio(paciente_id, fecha_orden DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_doctor ON ordenes_laboratorio(doctor_id, fecha_orden DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_consulta ON ordenes_laboratorio(consulta_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_laboratorio(estado, fecha_orden DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_folio ON ordenes_laboratorio(folio);

-- Catálogo de estudios
CREATE INDEX IF NOT EXISTS idx_estudios_categoria ON catalogo_estudios(categoria, activo);
CREATE INDEX IF NOT EXISTS idx_estudios_codigo ON catalogo_estudios(codigo);

-- ============================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ============================================

CREATE TRIGGER trigger_recetas_timestamp
  BEFORE UPDATE ON recetas_medicas
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

CREATE TRIGGER trigger_catalogo_estudios_timestamp
  BEFORE UPDATE ON catalogo_estudios
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

CREATE TRIGGER trigger_ordenes_timestamp
  BEFORE UPDATE ON ordenes_laboratorio
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

CREATE TRIGGER trigger_ordenes_estudios_timestamp
  BEFORE UPDATE ON ordenes_estudios
  FOR EACH ROW
  EXECUTE FUNCTION update_historial_timestamp();

-- ============================================
-- DATOS INICIALES: CATÁLOGO DE ESTUDIOS
-- ============================================

INSERT INTO catalogo_estudios (codigo, nombre, categoria, requiere_ayuno, tiempo_ayuno_horas, precio_base, activo) VALUES
-- Química Sanguínea
('QS-001', 'Glucosa en Ayuno', 'Química Sanguínea', true, 8, 80.00, true),
('QS-002', 'Hemoglobina Glucosilada (HbA1c)', 'Química Sanguínea', false, 0, 250.00, true),
('QS-003', 'Perfil de Lípidos Completo', 'Química Sanguínea', true, 12, 350.00, true),
('QS-004', 'Colesterol Total', 'Química Sanguínea', true, 12, 100.00, true),
('QS-005', 'Triglicéridos', 'Química Sanguínea', true, 12, 100.00, true),
('QS-006', 'Creatinina', 'Química Sanguínea', false, 0, 120.00, true),
('QS-007', 'Urea', 'Química Sanguínea', false, 0, 100.00, true),
('QS-008', 'Ácido Úrico', 'Química Sanguínea', false, 0, 120.00, true),

-- Hematología
('HEM-001', 'Biometría Hemática Completa', 'Hematología', false, 0, 200.00, true),
('HEM-002', 'Tiempo de Protrombina (TP)', 'Hematología', false, 0, 180.00, true),
('HEM-003', 'Tiempo de Tromboplastina (TPT)', 'Hematología', false, 0, 180.00, true),
('HEM-004', 'Grupo Sanguíneo y Factor RH', 'Hematología', false, 0, 150.00, true),

-- Función Hepática
('HEP-001', 'Perfil Hepático Completo', 'Función Hepática', true, 8, 450.00, true),
('HEP-002', 'Bilirrubinas Totales y Directa', 'Función Hepática', false, 0, 150.00, true),
('HEP-003', 'Transaminasas (TGO/TGP)', 'Función Hepática', false, 0, 200.00, true),

-- Función Renal
('REN-001', 'Perfil Renal', 'Función Renal', false, 0, 350.00, true),
('REN-002', 'Depuración de Creatinina', 'Función Renal', false, 0, 300.00, true),

-- Electrolitos
('ELE-001', 'Electrolitos Séricos (Na, K, Cl)', 'Electrolitos', false, 0, 250.00, true),
('ELE-002', 'Calcio Sérico', 'Electrolitos', false, 0, 120.00, true),

-- Hormonas
('HOR-001', 'Perfil Tiroideo (TSH, T3, T4)', 'Hormonas', false, 0, 600.00, true),
('HOR-002', 'Hormona Estimulante del Tiroides (TSH)', 'Hormonas', false, 0, 250.00, true),

-- Orina
('ORI-001', 'Examen General de Orina', 'Urianálisis', false, 0, 150.00, true),
('ORI-002', 'Urocultivo', 'Urianálisis', false, 0, 300.00, true),

-- Microbiología
('MIC-001', 'Cultivo de Garganta', 'Microbiología', false, 0, 350.00, true),
('MIC-002', 'Coprocultivo', 'Microbiología', false, 0, 400.00, true),
('MIC-003', 'Exudado Faríngeo', 'Microbiología', false, 0, 300.00, true),

-- Inmunología
('INM-001', 'Proteína C Reactiva (PCR)', 'Inmunología', false, 0, 200.00, true),
('INM-002', 'Factor Reumatoide', 'Inmunología', false, 0, 250.00, true),

-- COVID y Virales
('VIR-001', 'Antígeno COVID-19', 'Virología', false, 0, 300.00, true),
('VIR-002', 'PCR COVID-19', 'Virología', false, 0, 800.00, true),
('VIR-003', 'Anticuerpos IgG/IgM COVID-19', 'Virología', false, 0, 500.00, true)

ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- FUNCIÓN PARA GENERAR FOLIOS AUTOMÁTICOS
-- ============================================

CREATE OR REPLACE FUNCTION generar_folio_receta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := 'RX-' || TO_CHAR(NEW.fecha_emision, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('seq_recetas')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_folio_orden()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := 'LAB-' || TO_CHAR(NEW.fecha_orden, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('seq_ordenes')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS seq_recetas START 1;
CREATE SEQUENCE IF NOT EXISTS seq_ordenes START 1;

CREATE TRIGGER trigger_generar_folio_receta
  BEFORE INSERT ON recetas_medicas
  FOR EACH ROW
  EXECUTE FUNCTION generar_folio_receta();

CREATE TRIGGER trigger_generar_folio_orden
  BEFORE INSERT ON ordenes_laboratorio
  FOR EACH ROW
  EXECUTE FUNCTION generar_folio_orden();
