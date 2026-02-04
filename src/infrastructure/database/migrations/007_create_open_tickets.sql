-- Migración: Crear tabla open_tickets
-- Gestiona tickets abiertos para citas subsecuentes sin horario específico

CREATE TABLE IF NOT EXISTS open_tickets (
  id VARCHAR(36) PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  paciente_id VARCHAR(36) NOT NULL,
  sucursal_id VARCHAR(36) NOT NULL,
  
  -- Información del ticket
  tipo_consulta VARCHAR(20) NOT NULL DEFAULT 'Subsecuente',
  especialidad VARCHAR(100) NOT NULL,
  medico_preferido VARCHAR(100),
  
  -- Vigencia
  fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_valido_desde TIMESTAMP NOT NULL,
  fecha_valido_hasta TIMESTAMP NOT NULL,
  dias_validez INTEGER NOT NULL DEFAULT 30,
  
  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  -- Valores: 'Activo', 'Utilizado', 'Expirado', 'Cancelado'
  
  -- Uso del ticket
  fecha_utilizado TIMESTAMP,
  cita_generada_id VARCHAR(36),
  hora_llegada TIMESTAMP,
  
  -- Relación con cita anterior
  cita_origen_id VARCHAR(36) NOT NULL,
  motivo_consulta_anterior TEXT,
  diagnostico_anterior TEXT,
  tratamiento_indicado TEXT,
  
  -- Financiero
  costo_estimado DECIMAL(10, 2) NOT NULL DEFAULT 0,
  requiere_pago BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Encuesta de satisfacción
  encuesta_completada BOOLEAN NOT NULL DEFAULT FALSE,
  calificacion_atencion INTEGER CHECK (calificacion_atencion >= 1 AND calificacion_atencion <= 5),
  comentarios_encuesta TEXT,
  
  -- Metadata
  creado_por VARCHAR(100) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
  notas TEXT,
  
  -- Constraints
  CONSTRAINT fk_open_ticket_paciente FOREIGN KEY (paciente_id) 
    REFERENCES pacientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_open_ticket_sucursal FOREIGN KEY (sucursal_id) 
    REFERENCES sucursales(id) ON DELETE RESTRICT,
  CONSTRAINT fk_open_ticket_cita_origen FOREIGN KEY (cita_origen_id) 
    REFERENCES citas(id) ON DELETE RESTRICT,
  CONSTRAINT fk_open_ticket_cita_generada FOREIGN KEY (cita_generada_id) 
    REFERENCES citas(id) ON DELETE SET NULL,
  CONSTRAINT check_fechas_validez CHECK (fecha_valido_hasta > fecha_valido_desde)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_open_tickets_paciente ON open_tickets(paciente_id);
CREATE INDEX idx_open_tickets_sucursal ON open_tickets(sucursal_id);
CREATE INDEX idx_open_tickets_estado ON open_tickets(estado);
CREATE INDEX idx_open_tickets_vigencia ON open_tickets(fecha_valido_desde, fecha_valido_hasta);
CREATE INDEX idx_open_tickets_codigo ON open_tickets(codigo);
CREATE INDEX idx_open_tickets_cita_origen ON open_tickets(cita_origen_id);
CREATE INDEX idx_open_tickets_cita_generada ON open_tickets(cita_generada_id);
CREATE INDEX idx_open_tickets_fecha_creacion ON open_tickets(fecha_creacion DESC);

-- Índice compuesto para tickets activos vigentes
CREATE INDEX idx_open_tickets_activos_vigentes 
  ON open_tickets(estado, fecha_valido_desde, fecha_valido_hasta)
  WHERE estado = 'Activo';

-- Vista para tickets activos y vigentes
CREATE OR REPLACE VIEW vw_tickets_activos_vigentes AS
SELECT 
  ot.*,
  p.nombre as paciente_nombre,
  p.telefono as paciente_telefono,
  s.nombre as sucursal_nombre,
  EXTRACT(DAY FROM (ot.fecha_valido_hasta - NOW())) as dias_restantes,
  CASE 
    WHEN NOW() < ot.fecha_valido_desde THEN 'Pendiente'
    WHEN NOW() BETWEEN ot.fecha_valido_desde AND ot.fecha_valido_hasta THEN 'Vigente'
    ELSE 'Expirado'
  END as estado_vigencia
FROM open_tickets ot
LEFT JOIN pacientes p ON ot.paciente_id = p.id
LEFT JOIN sucursales s ON ot.sucursal_id = s.id
WHERE ot.estado = 'Activo';

-- Vista de estadísticas por sucursal
CREATE OR REPLACE VIEW vw_estadisticas_tickets_sucursal AS
SELECT 
  s.id as sucursal_id,
  s.nombre as sucursal_nombre,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE estado = 'Activo') as tickets_activos,
  COUNT(*) FILTER (WHERE estado = 'Utilizado') as tickets_utilizados,
  COUNT(*) FILTER (WHERE estado = 'Expirado') as tickets_expirados,
  COUNT(*) FILTER (WHERE estado = 'Cancelado') as tickets_cancelados,
  COUNT(*) FILTER (WHERE encuesta_completada = TRUE) as tickets_con_encuesta,
  AVG(calificacion_atencion) FILTER (WHERE calificacion_atencion IS NOT NULL) as promedio_calificacion,
  COUNT(*) FILTER (WHERE estado = 'Activo' AND fecha_valido_hasta >= NOW()) as tickets_vigentes
FROM sucursales s
LEFT JOIN open_tickets ot ON s.id = ot.sucursal_id
GROUP BY s.id, s.nombre;

-- Función para marcar tickets expirados automáticamente
CREATE OR REPLACE FUNCTION marcar_tickets_expirados()
RETURNS INTEGER AS $$
DECLARE
  tickets_actualizados INTEGER;
BEGIN
  UPDATE open_tickets
  SET 
    estado = 'Expirado',
    ultima_actualizacion = NOW()
  WHERE estado = 'Activo'
    AND fecha_valido_hasta < NOW();
  
  GET DIAGNOSTICS tickets_actualizados = ROW_COUNT;
  RETURN tickets_actualizados;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar ultima_actualizacion
CREATE OR REPLACE FUNCTION trigger_actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_open_tickets_actualizar_fecha
  BEFORE UPDATE ON open_tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_fecha_modificacion();

-- Comentarios en la tabla
COMMENT ON TABLE open_tickets IS 'Tickets abiertos para citas subsecuentes sin horario específico - Sistema "entra cuando quiera"';
COMMENT ON COLUMN open_tickets.codigo IS 'Código único del ticket (ej: OT-SUC1-202402-0001)';
COMMENT ON COLUMN open_tickets.dias_validez IS 'Número de días que el ticket es válido (típicamente 7-30 días)';
COMMENT ON COLUMN open_tickets.estado IS 'Estado del ticket: Activo, Utilizado, Expirado, Cancelado';
COMMENT ON COLUMN open_tickets.encuesta_completada IS 'Indica si se completó la encuesta de satisfacción post-consulta';
COMMENT ON COLUMN open_tickets.calificacion_atencion IS 'Calificación de 1 a 5 estrellas de la atención recibida';
