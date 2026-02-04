/**
 * Entidad: Paciente
 * Representa a un paciente en el sistema CRM
 */
export interface Paciente {
  id: string;
  nombreCompleto: string;
  telefono: string;
  whatsapp?: string;
  email?: string;
  fechaNacimiento: Date;
  edad: number;
  sexo: 'M' | 'F' | 'Otro';
  
  // Afiliación
  noAfiliacion: string; // CRÍTICO: No puede estar vacío según requerimientos
  tipoAfiliacion: 'IMSS' | 'ISSSTE' | 'Particular' | 'Seguro';
  
  // Dirección
  calle?: string;
  colonia?: string;
  ciudad: string;
  estado: string;
  codigoPostal?: string;
  
  // Contacto de emergencia
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  
  // Metadata
  origenLead: 'WhatsApp' | 'Facebook' | 'Instagram' | 'Llamada' | 'Presencial' | 'Referido';
  fechaRegistro: Date;
  ultimaActualizacion: Date;
  activo: boolean;
  
  // Notas médicas
  alergias?: string[];
  padecimientos?: string[];
  observaciones?: string;
}

export class PacienteEntity implements Paciente {
  id!: string;
  nombreCompleto!: string;
  telefono!: string;
  whatsapp?: string;
  email?: string;
  fechaNacimiento!: Date;
  edad!: number;
  sexo!: 'M' | 'F' | 'Otro';
  noAfiliacion!: string;
  tipoAfiliacion!: 'IMSS' | 'ISSSTE' | 'Particular' | 'Seguro';
  calle?: string;
  colonia?: string;
  ciudad!: string;
  estado!: string;
  codigoPostal?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  origenLead!: 'WhatsApp' | 'Facebook' | 'Instagram' | 'Llamada' | 'Presencial' | 'Referido';
  fechaRegistro!: Date;
  ultimaActualizacion!: Date;
  activo!: boolean;
  alergias?: string[];
  padecimientos?: string[];
  observaciones?: string;

  constructor(data: Paciente) {
    // Validación crítica: No_Afiliacion no puede estar vacío
    if (!data.noAfiliacion || data.noAfiliacion.trim() === '') {
      throw new Error('No_Afiliacion es obligatorio y no puede estar vacío');
    }

    Object.assign(this, data);
    this.edad = this.calcularEdad();
  }

  private calcularEdad(): number {
    const hoy = new Date();
    const nacimiento = new Date(this.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  actualizarEdad(): void {
    this.edad = this.calcularEdad();
  }
}
