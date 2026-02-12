-- Registro de atenciones por brigada (alineado al informe Excel)
CREATE TABLE IF NOT EXISTS brigada_atenciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brigada_id UUID NOT NULL REFERENCES brigadas_medicas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME,
  ubicacion VARCHAR(300),
  medico VARCHAR(200),
  -- Paciente (puede ser nombre libre o vincular a pacientes)
  paciente_id UUID REFERENCES pacientes(id),
  paciente_nombre VARCHAR(200) NOT NULL,
  edad INTEGER,
  sexo VARCHAR(20),
  domicilio VARCHAR(300),
  codigo_postal VARCHAR(20),
  localidad VARCHAR(100),
  colonia VARCHAR(100),
  tipo_sangre VARCHAR(10),
  -- Signos vitales (opcionales)
  peso DECIMAL(5,2),
  altura DECIMAL(5,2),
  imc DECIMAL(4,2),
  ta VARCHAR(20),
  temp DECIMAL(4,2),
  fc INTEGER,
  fr INTEGER,
  glu DECIMAL(5,2),
  -- Atención
  especialidad VARCHAR(50) NOT NULL,
  servicio VARCHAR(100),
  lentes_entregados BOOLEAN DEFAULT false,
  diagnostico TEXT,
  receta TEXT,
  medicamentos_entregados TEXT,
  observaciones TEXT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brigada_atenciones_brigada ON brigada_atenciones(brigada_id);
CREATE INDEX IF NOT EXISTS idx_brigada_atenciones_fecha ON brigada_atenciones(fecha);
CREATE INDEX IF NOT EXISTS idx_brigada_atenciones_especialidad ON brigada_atenciones(especialidad);

COMMENT ON TABLE brigada_atenciones IS 'Registro de atenciones por brigada. Alimenta KPIs y reportes.';
