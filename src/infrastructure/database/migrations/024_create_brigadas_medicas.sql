-- Brigadas médicas (eventos de atención en fecha/lugar)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS brigadas_medicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  ubicacion VARCHAR(300),
  ciudad VARCHAR(100) NOT NULL,
  estado_brigada VARCHAR(20) NOT NULL DEFAULT 'planificada'
    CHECK (estado_brigada IN ('planificada', 'en_curso', 'finalizada')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  sucursal_id UUID REFERENCES sucursales(id),
  observaciones TEXT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brigadas_medicas_ciudad ON brigadas_medicas(ciudad);
CREATE INDEX IF NOT EXISTS idx_brigadas_medicas_fecha ON brigadas_medicas(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_brigadas_medicas_estado ON brigadas_medicas(estado_brigada);

COMMENT ON TABLE brigadas_medicas IS 'Brigadas médicas (eventos de atención por fecha y lugar). Los KPIs se calculan por brigada.';
