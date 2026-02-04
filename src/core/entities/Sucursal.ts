/**
 * Entidad: Sucursal
 * Representa una clínica de la Red de Clínicas
 */
export interface Sucursal {
  id: string;
  codigo: string; // Código único (ej: "RCA-001")
  nombre: string;
  
  // Ubicación
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  telefono: string;
  
  // Configuración
  zonaHoraria: string; // ej: "America/Mexico_City"
  horarioApertura: string; // "08:00"
  horarioCierre: string; // "20:00"
  diasOperacion: string[]; // ["Lunes", "Martes", ...]
  
  // Capacidad
  consultoriosDisponibles: number;
  especialidades: string[];
  
  // Estado
  activa: boolean;
  fechaApertura: Date;
  
  // Metadata
  gerenteId?: string;
  emailContacto?: string;
}

export class SucursalEntity implements Sucursal {
  id!: string;
  codigo!: string;
  nombre!: string;
  direccion!: string;
  ciudad!: string;
  estado!: string;
  codigoPostal!: string;
  telefono!: string;
  zonaHoraria!: string;
  horarioApertura!: string;
  horarioCierre!: string;
  diasOperacion!: string[];
  consultoriosDisponibles!: number;
  especialidades!: string[];
  activa!: boolean;
  fechaApertura!: Date;
  gerenteId?: string;
  emailContacto?: string;

  constructor(data: Sucursal) {
    Object.assign(this, data);
  }

  estaAbierta(fecha?: Date): boolean {
    const fechaConsulta = fecha || new Date();
    const dia = fechaConsulta.toLocaleDateString('es-MX', { weekday: 'long' });
    
    return this.activa && this.diasOperacion.includes(dia);
  }

  tieneEspecialidad(especialidad: string): boolean {
    return this.especialidades.includes(especialidad);
  }
}
