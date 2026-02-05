export interface Doctor {
  id: string;
  nombre: string;
  especialidad: string;
  sucursal: string;
  color: string; // Para diferenciación visual
}

export const DOCTORES: Doctor[] = [
  // Ciudad Juárez
  { id: 'doc-1', nombre: 'Edni González', especialidad: 'Odontología', sucursal: 'Ciudad Juárez', color: '#3B82F6' },
  { id: 'doc-2', nombre: 'Iván Oros', especialidad: 'Oftalmología', sucursal: 'Ciudad Juárez', color: '#8B5CF6' },
  { id: 'doc-20', nombre: 'Iván Ornelas', especialidad: 'Oftalmología', sucursal: 'Ciudad Juárez', color: '#6366F1' },
  { id: 'doc-17', nombre: 'Samseri Sandoval', especialidad: 'Optometría', sucursal: 'Ciudad Juárez', color: '#06B6D4' },
  { id: 'doc-21', nombre: 'Missael Fuentes', especialidad: 'Pastoral', sucursal: 'Ciudad Juárez', color: '#10B981' },
  { id: 'doc-22', nombre: 'Swwlet Abigail Barrientos', especialidad: 'Psicología', sucursal: 'Ciudad Juárez', color: '#EC4899' },
  { id: 'doc-24', nombre: 'Claudia Córdova', especialidad: 'Psicología', sucursal: 'Ciudad Juárez', color: '#F43F5E' },

  // Ciudad Obregón
  { id: 'doc-5', nombre: 'Aslysh Aboyte', especialidad: 'Odontología', sucursal: 'Ciudad Obregón', color: '#14B8A6' },
  { id: 'doc-7', nombre: 'Daniel Balderas', especialidad: 'Odontología', sucursal: 'Ciudad Obregón', color: '#F59E0B' },
  { id: 'doc-9', nombre: 'Adriana Moreno', especialidad: 'Odontología', sucursal: 'Ciudad Obregón', color: '#EF4444' },
  { id: 'doc-15', nombre: 'Fernanda Mendoza', especialidad: 'Odontología', sucursal: 'Ciudad Obregón', color: '#84CC16' },
  { id: 'doc-16', nombre: 'Rubén Mexía', especialidad: 'Odontología', sucursal: 'Ciudad Obregón', color: '#22D3EE' },
  { id: 'doc-23', nombre: 'Miguel Ahumada', especialidad: 'Odontología', sucursal: 'Ciudad Obregón', color: '#A855F7' },
  { id: 'doc-8', nombre: 'Alejandro Vargas', especialidad: 'Oftalmología', sucursal: 'Ciudad Obregón', color: '#0EA5E9' },
  { id: 'doc-10', nombre: 'Alexis Colleti', especialidad: 'Retinología', sucursal: 'Ciudad Obregón', color: '#7C3AED' },
  { id: 'doc-18', nombre: 'Stephania Vélez', especialidad: 'Nutriología', sucursal: 'Ciudad Obregón', color: '#10B981' },
  { id: 'doc-19', nombre: 'Eliasib Pérez', especialidad: 'Ortodoncia', sucursal: 'Ciudad Obregón', color: '#F97316' },

  // Loreto
  { id: 'doc-11', nombre: 'Gregorio Pérez', especialidad: 'Odontología', sucursal: 'Loreto Héroes', color: '#06B6D4' },
  { id: 'doc-12', nombre: 'Gladys López', especialidad: 'Odontología', sucursal: 'Loreto Héroes', color: '#8B5CF6' },
  { id: 'doc-13', nombre: 'Nancy Grijalva', especialidad: 'Odontología', sucursal: 'Loreto Centro', color: '#EC4899' },

  // Clínica Virtual
  { id: 'doc-4', nombre: 'Yamila Arredondo', especialidad: 'Medicina General', sucursal: 'Clínica Adventista Virtual', color: '#059669' },
  { id: 'doc-6', nombre: 'Lidia Miranda', especialidad: 'Psicología', sucursal: 'Clínica Adventista Virtual', color: '#DB2777' },

  // General
  { id: 'doc-3', nombre: 'Dra. Tirsa Abisag Espinoza', especialidad: 'Medicina General', sucursal: 'General', color: '#16A34A' },
  { id: 'doc-14', nombre: 'Dr. José Ricardo Espinoza Vargas', especialidad: 'Oftalmología', sucursal: 'General', color: '#2563EB' },
];

export const ESPECIALIDADES = Array.from(new Set(DOCTORES.map(d => d.especialidad))).sort();

const SUCURSALES_EXTRA = [
  'Guadalajara',
  'Valle de la Trinidad',
];

export const SUCURSALES = Array.from(
  new Set([...DOCTORES.map(d => d.sucursal), ...SUCURSALES_EXTRA])
).sort();

export function getDoctoresPorSucursal(sucursal: string): Doctor[] {
  return DOCTORES.filter(d => d.sucursal === sucursal);
}

export function getDoctoresPorEspecialidad(especialidad: string): Doctor[] {
  return DOCTORES.filter(d => d.especialidad === especialidad);
}

const SERVICIOS_POR_ESPECIALIDAD: Record<string, string[]> = {
  'Medicina General': ['Consulta Medicina General', 'Checkup Preventivo'],
  'Odontología': ['Consulta Odontológica', 'Limpieza Dental', 'Resina Dental'],
  'Oftalmología': ['Consulta Oftalmológica', 'Examen Visual Completo'],
  'Retinología': ['Evaluación Retinal', 'Mapeo Retiniano'],
  'Nutriología': ['Consulta Nutricional', 'Plan Alimenticio'],
  'Psicología': ['Sesión de Psicología', 'Terapia Familiar'],
  'Optometría': ['Examen Optométrico'],
  'Ortodoncia': ['Evaluación de Ortodoncia'],
  'Pastoral': ['Orientación Pastoral'],
  'Pediatría': ['Consulta Pediátrica'],
};

const SERVICIOS_FALLBACK = ['Consulta Medicina General', 'Checkup Preventivo'];

export function getEspecialidadesPorSucursal(sucursal: string): string[] {
  const especialidades = DOCTORES.filter(d => d.sucursal === sucursal)
    .map(d => d.especialidad);
  if (especialidades.length === 0) return ESPECIALIDADES;
  return Array.from(new Set(especialidades)).sort();
}

export function getServiciosPorSucursal(sucursal: string): string[] {
  const especialidades = getEspecialidadesPorSucursal(sucursal);
  const servicios = especialidades.flatMap((especialidad) => SERVICIOS_POR_ESPECIALIDAD[especialidad] || []);
  if (servicios.length === 0) return SERVICIOS_FALLBACK;
  return Array.from(new Set(servicios));
}

export function obtenerDoctorPorId(doctorId: string): Doctor | undefined {
  return DOCTORES.find(d => d.id === doctorId);
}

export function getDoctorById(id: string): Doctor | undefined {
  return DOCTORES.find(d => d.id === id);
}

export function getDoctorColor(doctorNombre: string): string {
  const doctor = DOCTORES.find(d => d.nombre === doctorNombre);
  return doctor?.color || '#6B7280';
}
