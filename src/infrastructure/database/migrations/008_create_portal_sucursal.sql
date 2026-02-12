-- ============================================
-- MIGRACIÓN: Portal de Sucursales
-- Fecha: 08 Febrero 2026
-- ============================================

CREATE TABLE IF NOT EXISTS portal_noticias (
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

CREATE TABLE IF NOT EXISTS portal_tareas (
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

CREATE TABLE IF NOT EXISTS portal_tarea_comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES portal_tareas(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id),
  autor_nombre VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portal_tarea_evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES portal_tareas(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('imagen', 'archivo')),
  data_uri TEXT,
  url TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
