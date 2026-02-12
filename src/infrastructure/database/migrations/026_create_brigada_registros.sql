-- Registro por persona en brigada (una fila por asistente, columnas por servicio)
-- Alineado a plantilla Excel: SUCURSAL, FECHA, LUGAR, NO., NOMBRE, TELEFONO, etc.
CREATE TABLE IF NOT EXISTS brigada_registros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brigada_id UUID NOT NULL REFERENCES brigadas_medicas(id) ON DELETE CASCADE,
  sucursal VARCHAR(200),
  fecha DATE NOT NULL,
  lugar VARCHAR(300),
  no VARCHAR(20),
  nombre VARCHAR(200) NOT NULL,
  telefono VARCHAR(50),
  direccion VARCHAR(400),
  sexo VARCHAR(20),
  edad INTEGER,
  asd VARCHAR(50),
  no_asd VARCHAR(50),
  quiere_estudiar_biblia VARCHAR(50),
  oracion VARCHAR(50),
  medico VARCHAR(20),
  dentista VARCHAR(20),
  nutricion VARCHAR(20),
  psicologia VARCHAR(20),
  papaniculao VARCHAR(20),
  antigeno_prostatico VARCHAR(20),
  fisioterapia VARCHAR(20),
  cuidados_espirituales VARCHAR(20),
  examen_vista VARCHAR(20),
  corte_cabello VARCHAR(20),
  denominacion VARCHAR(200),
  peticion_oracion VARCHAR(50),
  quiere_estudiar_biblia_2 VARCHAR(50),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brigada_registros_brigada ON brigada_registros(brigada_id);
CREATE INDEX IF NOT EXISTS idx_brigada_registros_sucursal ON brigada_registros(sucursal);
CREATE INDEX IF NOT EXISTS idx_brigada_registros_fecha ON brigada_registros(fecha);

COMMENT ON TABLE brigada_registros IS 'Un registro por persona en brigada. Servicios en columnas (Medico, Dentista, etc.). Alimenta KPIs por sucursal/brigada.';
