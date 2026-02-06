-- Migracion minimo viable operativo
-- Ejecutar en la BD rca_crm

-- 1) Usuarios: agregar username, permisos JSONB, ultima_actualizacion
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill username si no existe (usar email)
UPDATE usuarios
SET username = COALESCE(username, email)
WHERE username IS NULL;

-- Hacer username obligatorio y unico
ALTER TABLE usuarios
  ALTER COLUMN username SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'usuarios_username_key'
  ) THEN
    CREATE UNIQUE INDEX usuarios_username_key ON usuarios (username);
  END IF;
END $$;

-- 2) Solicitudes de contacto (CRM)
CREATE TABLE IF NOT EXISTS solicitudes_contacto (
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

CREATE INDEX IF NOT EXISTS idx_solicitudes_sucursal ON solicitudes_contacto(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_contacto(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_crm_status ON solicitudes_contacto(crm_status);
