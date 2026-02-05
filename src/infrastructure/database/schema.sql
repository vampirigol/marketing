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
  nombre_completo VARCHAR(200) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('Admin', 'Finanzas', 'Contact_Center', 'Recepcion', 'Medico')),
  permisos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  sucursal_asignada UUID REFERENCES sucursales(id),
  sucursales_acceso UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  activo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acceso TIMESTAMP,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO usuarios (nombre_completo, email, telefono, password_hash, rol, permisos, activo)
VALUES (
  'Administrador Sistema',
  'admin@rcaclinicas.com',
  '5550000000',
  '$2b$10$rBV2kw9h3Qr4CYkjV7rg2uh7jZxZKfGxqM1x.vJ8YQN5GKL4hRs0S',
  'Admin',
  ARRAY['*'],
  true
);

COMMENT ON TABLE pacientes IS 'Tabla de pacientes. CRÍTICO: no_afiliacion no puede estar vacío para reportes de Antonio y Yaretzi';
COMMENT ON COLUMN citas.reagendaciones IS 'Contador de reagendaciones. Si es_promocion=true, máximo 1 permitida';
COMMENT ON TABLE abonos IS 'Registro de pagos. Debe coincidir con citas atendidas para el corte de caja';
