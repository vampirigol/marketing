-- ============================================
-- SCHEMA: Red de Clínicas Adventistas (RCA)
-- Fecha: 03 Febrero 2026
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: sucursales
-- ============================================
CREATE TABLE sucursales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(10),
  telefono VARCHAR(20) NOT NULL,
  zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
  horario_apertura TIME NOT NULL DEFAULT '08:00',
  horario_cierre TIME NOT NULL DEFAULT '20:00',
  dias_operacion TEXT[] NOT NULL DEFAULT ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  consultorios_disponibles INTEGER NOT NULL DEFAULT 3,
  especialidades TEXT[] NOT NULL DEFAULT ARRAY['Medicina General'],
  activa BOOLEAN NOT NULL DEFAULT true,
  fecha_apertura DATE NOT NULL DEFAULT CURRENT_DATE,
  gerente_id UUID,
  email_contacto VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  nombre_completo VARCHAR(200) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  foto_url TEXT,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('Admin', 'Finanzas', 'Contact_Center', 'Recepcion', 'Medico')),
  permisos JSONB NOT NULL DEFAULT '[]'::jsonb,
  sucursal_asignada UUID REFERENCES sucursales(id),
  sucursales_acceso UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  activo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acceso TIMESTAMP,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creado_por UUID REFERENCES usuarios(id)
);

-- ============================================
-- TABLA: pacientes
-- ============================================
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo VARCHAR(200) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(100),
  fecha_nacimiento DATE NOT NULL,
  edad INTEGER NOT NULL,
  sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('M', 'F', 'Otro')),
  
  -- CRÍTICO: No_Afiliacion obligatorio
  no_afiliacion VARCHAR(50) NOT NULL CHECK (no_afiliacion <> ''),
  tipo_afiliacion VARCHAR(20) NOT NULL CHECK (tipo_afiliacion IN ('IMSS', 'ISSSTE', 'Particular', 'Seguro')),
  
  -- Dirección
  calle VARCHAR(200),
  colonia VARCHAR(100),
  ciudad VARCHAR(100) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(10),
  
  -- Contacto de emergencia
  contacto_emergencia VARCHAR(200),
  telefono_emergencia VARCHAR(20),
  
  -- Metadata
  origen_lead VARCHAR(50) NOT NULL CHECK (origen_lead IN ('WhatsApp', 'Facebook', 'Instagram', 'Llamada', 'Presencial', 'Referido')),
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT true,
  
  -- Notas médicas
  alergias TEXT[],
  padecimientos TEXT[],
  observaciones TEXT,
  
  -- Índices
  CONSTRAINT unique_telefono UNIQUE (telefono),
  CONSTRAINT unique_no_afiliacion UNIQUE (no_afiliacion)
);

-- ============================================
-- TABLA: citas
-- ============================================
CREATE TABLE citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  
  -- Fecha y hora
  fecha_cita DATE NOT NULL,
  hora_cita TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 30,
  
  -- Tipo de consulta
  tipo_consulta VARCHAR(20) NOT NULL CHECK (tipo_consulta IN ('Primera_Vez', 'Subsecuente', 'Urgencia')),
  especialidad VARCHAR(100) NOT NULL,
  medico_asignado VARCHAR(200),
  
  -- Estado
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('Agendada', 'Confirmada', 'En_Consulta', 'Atendida', 'Cancelada', 'No_Asistio')),
  motivo_cancelacion TEXT,
  
  -- Promoción (CRÍTICO para regla de reagendación)
  es_promocion BOOLEAN NOT NULL DEFAULT false,
  fecha_promocion DATE,
  reagendaciones INTEGER NOT NULL DEFAULT 0 CHECK (reagendaciones >= 0),
  
  -- Llegada
  hora_llegada TIMESTAMP,
  hora_atencion TIMESTAMP,
  hora_salida TIMESTAMP,
  
  -- Financiero
  costo_consulta DECIMAL(10,2) NOT NULL CHECK (costo_consulta > 0),
  monto_abonado DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (monto_abonado >= 0),
  saldo_pendiente DECIMAL(10,2) NOT NULL DEFAULT 0,
  metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Mixto')),
  
  -- Metadata
  creado_por VARCHAR(100) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas TEXT
  ,
  telemedicina_link TEXT,
  preconsulta JSONB,
  documentos JSONB
);

-- ============================================
-- TABLA: abonos
-- ============================================
CREATE TABLE abonos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID NOT NULL REFERENCES citas(id),
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  
  -- Información del pago
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Mixto')),
  referencia VARCHAR(100),
  
  -- Detalles mixto (JSON para flexibilidad)
  montos_desglosados JSONB,
  
  -- Metadata
  fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registrado_por UUID NOT NULL REFERENCES usuarios(id),
  sucursal_registro UUID NOT NULL REFERENCES sucursales(id),
  
  -- Recibo
  folio_recibo VARCHAR(50) UNIQUE NOT NULL,
  recibo_generado BOOLEAN NOT NULL DEFAULT false,
  ruta_recibo TEXT,
  
  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'Aplicado' CHECK (estado IN ('Aplicado', 'Pendiente', 'Cancelado')),
  motivo_cancelacion TEXT,
  
  notas TEXT
);

-- ============================================
-- TABLA: cortes_caja
-- ============================================
CREATE TABLE cortes_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  fecha_corte DATE NOT NULL,
  
  -- Totales
  total_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_general DECIMAL(10,2) NOT NULL DEFAULT 0,
  numero_transacciones INTEGER NOT NULL DEFAULT 0,
  
  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
  
  -- Metadata
  generado_por UUID NOT NULL REFERENCES usuarios(id),
  fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aprobado_por UUID REFERENCES usuarios(id),
  fecha_aprobacion TIMESTAMP,
  notas TEXT,
  
  CONSTRAINT unique_corte_diario UNIQUE (sucursal_id, fecha_corte)
);

-- ============================================
-- TABLA: conversaciones_matrix
-- ============================================
CREATE TABLE conversaciones_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES pacientes(id),
  
  -- Canal
  canal VARCHAR(20) NOT NULL CHECK (canal IN ('WhatsApp', 'Facebook', 'Instagram')),
  canal_id VARCHAR(100) NOT NULL, -- ID del usuario en el canal
  
  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Pendiente', 'Cerrada')),
  prioridad VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (prioridad IN ('Urgente', 'Alta', 'Normal', 'Baja')),
  
  -- Metadata
  ultimo_mensaje TEXT,
  ultimo_mensaje_fecha TIMESTAMP,
  mensajes_no_leidos INTEGER NOT NULL DEFAULT 0,
  
  -- Etiquetas
  etiquetas TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Asignación
  asignado_a UUID REFERENCES usuarios(id),
  
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP,
  
  CONSTRAINT unique_canal_usuario UNIQUE (canal, canal_id)
);

-- ============================================
-- TABLA: mensajes_matrix
-- ============================================
CREATE TABLE mensajes_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID NOT NULL REFERENCES conversaciones_matrix(id) ON DELETE CASCADE,
  
  -- Remitente
  es_paciente BOOLEAN NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  
  -- Contenido
  contenido TEXT NOT NULL,
  tipo_mensaje VARCHAR(20) NOT NULL DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'imagen', 'audio', 'archivo', 'sistema')),
  
  -- Metadata
  fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN NOT NULL DEFAULT false,
  fecha_lectura TIMESTAMP
);

-- ============================================
-- TABLA: plantillas_respuesta
-- ============================================
CREATE TABLE IF NOT EXISTS plantillas_respuesta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  contenido TEXT NOT NULL,
  etiquetas TEXT[] DEFAULT ARRAY[]::TEXT[],
  es_global BOOLEAN NOT NULL DEFAULT false,
  activa BOOLEAN NOT NULL DEFAULT true,
  uso_count INTEGER NOT NULL DEFAULT 0,
  creado_por UUID REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plantillas_usuario ON plantillas_respuesta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_global ON plantillas_respuesta(es_global) WHERE es_global = true;

-- ============================================
-- TABLA: solicitudes_contacto
-- ============================================
CREATE TABLE solicitudes_contacto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES pacientes(id),
  nombre_completo VARCHAR(200) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  whatsapp VARCHAR(20),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  sucursal_nombre VARCHAR(200) NOT NULL,
  motivo VARCHAR(50) NOT NULL,
  motivo_detalle TEXT,
  preferencia_contacto VARCHAR(20) NOT NULL CHECK (preferencia_contacto IN ('WhatsApp', 'Telefono', 'Email')),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('Pendiente', 'Asignada', 'En_Contacto', 'Resuelta', 'Cancelada')),
  prioridad VARCHAR(10) NOT NULL CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
  agente_asignado_id UUID REFERENCES usuarios(id),
  agente_asignado_nombre VARCHAR(200),
  intentos_contacto INTEGER NOT NULL DEFAULT 0,
  ultimo_intento TIMESTAMP,
  notas TEXT,
  resolucion TEXT,
  origen VARCHAR(20) NOT NULL CHECK (origen IN ('Web', 'WhatsApp', 'Facebook', 'Instagram', 'Telefono')),
  creado_por VARCHAR(100) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_asignacion TIMESTAMP,
  fecha_resolucion TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crm_status VARCHAR(50),
  crm_resultado VARCHAR(50)
);

-- ============================================
-- ÍNDICES para optimización
-- ============================================

-- Pacientes
CREATE INDEX idx_pacientes_telefono ON pacientes(telefono);
CREATE INDEX idx_pacientes_no_afiliacion ON pacientes(no_afiliacion);
CREATE INDEX idx_pacientes_activo ON pacientes(activo);

-- Citas
CREATE INDEX idx_citas_fecha ON citas(fecha_cita);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_sucursal ON citas(sucursal_id);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_promocion ON citas(es_promocion) WHERE es_promocion = true;

-- Abonos
CREATE INDEX idx_abonos_fecha ON abonos(fecha_pago);
CREATE INDEX idx_abonos_sucursal ON abonos(sucursal_id);
CREATE INDEX idx_abonos_estado ON abonos(estado);
CREATE INDEX idx_abonos_cita ON abonos(cita_id);

-- Conversaciones
CREATE INDEX idx_conversaciones_estado ON conversaciones_matrix(estado);
CREATE INDEX idx_conversaciones_paciente ON conversaciones_matrix(paciente_id);
CREATE INDEX idx_conversaciones_asignado ON conversaciones_matrix(asignado_a);

-- Mensajes
CREATE INDEX idx_mensajes_conversacion ON mensajes_matrix(conversacion_id);
CREATE INDEX idx_mensajes_fecha ON mensajes_matrix(fecha_envio);

-- Solicitudes de contacto
CREATE INDEX idx_solicitudes_sucursal ON solicitudes_contacto(sucursal_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_contacto(estado);
CREATE INDEX idx_solicitudes_crm_status ON solicitudes_contacto(crm_status);

-- ============================================
-- TABLA: inasistencias
-- ============================================
CREATE TABLE inasistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID NOT NULL REFERENCES citas(id),
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  
  -- Información de la inasistencia
  fecha_cita_perdida DATE NOT NULL,
  hora_cita_perdida TIME NOT NULL,
  
  -- Motivo y seguimiento
  motivo VARCHAR(20) CHECK (motivo IN ('Economico', 'Transporte', 'Salud', 'Olvido', 'Competencia', 'No_Responde', 'Raza_Brava', 'Otro')),
  motivo_detalle TEXT,
  estado_seguimiento VARCHAR(20) NOT NULL DEFAULT 'Pendiente_Contacto' CHECK (estado_seguimiento IN ('Pendiente_Contacto', 'En_Seguimiento', 'Reagendada', 'Perdido', 'Bloqueado')),
  
  -- Intentos de contacto
  intentos_contacto INTEGER NOT NULL DEFAULT 0,
  ultimo_intento_contacto TIMESTAMP,
  proximo_intento_contacto TIMESTAMP,
  notas_contacto TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Remarketing
  en_lista_remarketing BOOLEAN NOT NULL DEFAULT false,
  fecha_ingreso_remarketing TIMESTAMP,
  campaign_remarketing VARCHAR(100),
  
  -- Protocolo 7 días
  fecha_limite_respuesta TIMESTAMP NOT NULL,
  marcado_como_perdido BOOLEAN NOT NULL DEFAULT false,
  fecha_marcado_perdido TIMESTAMP,
  
  -- Bloqueo "raza brava"
  bloqueado_marketing BOOLEAN NOT NULL DEFAULT false,
  motivo_bloqueo TEXT,
  fecha_bloqueo TIMESTAMP,
  
  -- Nueva cita agendada
  nueva_cita_id UUID REFERENCES citas(id),
  fecha_reagendacion TIMESTAMP,
  
  -- Metadata
  creado_por VARCHAR(100) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_cita_inasistencia UNIQUE (cita_id)
);

-- Índices para inasistencias
CREATE INDEX idx_inasistencias_paciente ON inasistencias(paciente_id);
CREATE INDEX idx_inasistencias_sucursal ON inasistencias(sucursal_id);
CREATE INDEX idx_inasistencias_estado ON inasistencias(estado_seguimiento);
CREATE INDEX idx_inasistencias_remarketing ON inasistencias(en_lista_remarketing) WHERE en_lista_remarketing = true;
CREATE INDEX idx_inasistencias_bloqueados ON inasistencias(bloqueado_marketing) WHERE bloqueado_marketing = true;
CREATE INDEX idx_inasistencias_perdidos ON inasistencias(marcado_como_perdido) WHERE marcado_como_perdido = true;
CREATE INDEX idx_inasistencias_fecha_limite ON inasistencias(fecha_limite_respuesta);
CREATE INDEX idx_inasistencias_proximo_contacto ON inasistencias(proximo_intento_contacto) WHERE proximo_intento_contacto IS NOT NULL;

-- Trigger para actualización automática
CREATE TRIGGER update_inasistencias_updated_at BEFORE UPDATE ON inasistencias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGERS para updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas necesarias
CREATE TRIGGER update_sucursales_updated_at BEFORE UPDATE ON sucursales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLAS: automatizaciones
-- ============================================
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  categoria VARCHAR(100),
  prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
  roles_permitidos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ab_test JSONB,
  horario JSONB,
  sucursal_scope VARCHAR(100),
  sla_por_etapa JSONB,
  pausa JSONB,
  condiciones JSONB NOT NULL,
  acciones JSONB NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id),
  rule_name VARCHAR(200) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  target_nombre VARCHAR(200) NOT NULL,
  accion TEXT NOT NULL,
  resultado VARCHAR(20) NOT NULL,
  mensaje TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalles JSONB
);

CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX idx_automation_logs_fecha ON automation_logs(fecha);

-- ============================================
-- TABLAS: portal sucursales
-- ============================================
CREATE TABLE portal_noticias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('general', 'local')),
  sucursal_id UUID REFERENCES sucursales(id),
  publicado_por UUID REFERENCES usuarios(id),
  fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portal_tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('alta', 'media', 'baja')),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'recibida', 'en_progreso', 'terminada')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_recibida TIMESTAMP,
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  creado_por UUID REFERENCES usuarios(id)
);

CREATE TABLE portal_tarea_comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES portal_tareas(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id),
  autor_nombre VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portal_tarea_evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES portal_tareas(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('imagen', 'archivo')),
  data_uri TEXT,
  url TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: doctor_bloqueos
-- ============================================
CREATE TABLE doctor_bloqueos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medico_id UUID REFERENCES usuarios(id),
  medico_nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fecha', 'semanal')),
  categoria VARCHAR(30) DEFAULT 'personal' CHECK (categoria IN ('vacaciones', 'comida', 'urgencia', 'personal', 'otro')),
  fecha DATE,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME,
  hora_fin TIME,
  motivo TEXT,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_doctor_bloqueos_medico_fecha
  ON doctor_bloqueos (medico_nombre, fecha);

CREATE INDEX idx_doctor_bloqueos_medico_dia
  ON doctor_bloqueos (medico_nombre, dia_semana);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Sucursal de ejemplo
INSERT INTO sucursales (codigo, nombre, direccion, ciudad, estado, telefono, especialidades)
VALUES 
  ('RCA-001', 'Guadalajara', 'Av. Américas 5678', 'Guadalajara', 'Jalisco', '3331234567', ARRAY['Medicina General', 'Odontología', 'Pediatría']),
  ('RCA-002', 'Ciudad Juárez', 'Av. Tecnológico 1200', 'Ciudad Juárez', 'Chihuahua', '6561234567', ARRAY['Medicina General', 'Ginecología']),
  ('RCA-003', 'Ciudad Obregón', 'Av. Miguel Alemán 910', 'Ciudad Obregón', 'Sonora', '6441234567', ARRAY['Medicina General', 'Pediatría']);

-- Usuario administrador inicial (password: admin123 - CAMBIAR EN PRODUCCIÓN)
-- Hash generado con bcrypt, rounds: 10
INSERT INTO usuarios (username, nombre_completo, email, telefono, password_hash, rol, permisos, activo)
VALUES (
  'admin',
  'Administrador Sistema',
  'admin@rcaclinicas.com',
  '5550000000',
  '$2b$10$rBV2kw9h3Qr4CYkjV7rg2uh7jZxZKfGxqM1x.vJ8YQN5GKL4hRs0S',
  'Admin',
  '[]'::jsonb,
  true
);

COMMENT ON TABLE pacientes IS 'Tabla de pacientes. CRÍTICO: no_afiliacion no puede estar vacío para reportes de Antonio y Yaretzi';
COMMENT ON COLUMN citas.reagendaciones IS 'Contador de reagendaciones. Si es_promocion=true, máximo 1 permitida';
COMMENT ON TABLE abonos IS 'Registro de pagos. Debe coincidir con citas atendidas para el corte de caja';

-- ============================================
-- HISTORIAL CLÍNICO
-- ============================================

CREATE TABLE IF NOT EXISTS consultas_medicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  sucursal_id UUID REFERENCES sucursales(id),
  fecha_consulta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_consulta VARCHAR(50) NOT NULL CHECK (tipo_consulta IN ('Primera_Vez', 'Subsecuente', 'Urgencia', 'Telemedicina', 'Seguimiento')),
  especialidad VARCHAR(100) NOT NULL,
  motivo_consulta TEXT NOT NULL,
  signos_vitales JSONB DEFAULT '{}'::jsonb,
  exploracion_fisica TEXT,
  diagnosticos JSONB DEFAULT '[]'::jsonb,
  plan_tratamiento TEXT,
  indicaciones TEXT,
  pronostico VARCHAR(50) CHECK (pronostico IN ('Bueno', 'Reservado', 'Grave', NULL)),
  notas_evolucion TEXT,
  notas_privadas TEXT,
  requiere_seguimiento BOOLEAN DEFAULT false,
  fecha_proximo_control DATE,
  dias_incapacidad INTEGER DEFAULT 0,
  duracion_minutos INTEGER,
  archivos_adjuntos JSONB DEFAULT '[]'::jsonb,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  firmado BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signos_vitales_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  consulta_id UUID REFERENCES consultas_medicas(id) ON DELETE SET NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  temperatura DECIMAL(4,1),
  presion_sistolica INTEGER,
  presion_diastolica INTEGER,
  frecuencia_cardiaca INTEGER,
  frecuencia_respiratoria INTEGER,
  saturacion_oxigeno INTEGER,
  peso DECIMAL(5,2),
  talla DECIMAL(5,2),
  imc DECIMAL(5,2),
  glucosa INTEGER,
  perimetro_abdominal DECIMAL(5,2),
  perimetro_cefalico DECIMAL(5,2),
  observaciones TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
  parentesco VARCHAR(50),
  notas TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicamentos_actuales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  nombre_medicamento VARCHAR(200) NOT NULL,
  dosis VARCHAR(100) NOT NULL,
  via_administracion VARCHAR(50) CHECK (via_administracion IN ('Oral', 'Intravenosa', 'Intramuscular', 'Subcutanea', 'Topica', 'Oftalmica', 'Otica', 'Nasal', 'Rectal', 'Otra')),
  frecuencia VARCHAR(100),
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

CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas_medicas(paciente_id, fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_doctor ON consultas_medicas(doctor_id, fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas_medicas(fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_signos_paciente ON signos_vitales_historico(paciente_id, fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_antecedentes_paciente ON antecedentes_medicos(paciente_id, tipo_antecedente);
CREATE INDEX IF NOT EXISTS idx_medicamentos_paciente ON medicamentos_actuales(paciente_id, activo);
