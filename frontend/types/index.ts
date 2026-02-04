// Tipos de entidades del sistema

export interface Paciente {
  id: string;
  nombreCompleto: string;
  telefono: string;
  whatsapp: string;
  email?: string;
  fechaNacimiento: Date;
  edad: number;
  sexo: 'M' | 'F';
  noAfiliacion: string;
  tipoAfiliacion: 'Titular' | 'Familiar';
  calle?: string;
  colonia?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  origenLead?: string;
  fechaRegistro: Date;
  ultimaActualizacion: Date;
  activo: boolean;
  alergias?: string;
  padecimientos?: string;
  observaciones?: string;
}

export interface Cita {
  id: string;
  pacienteId: string;
  pacienteNombre?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  pacienteNoAfiliacion?: string;
  sucursalId: string;
  sucursalNombre?: string;
  fechaCita: Date;
  horaCita: string;
  duracionMinutos: number;
  tipoConsulta: string;
  especialidad: string;
  medicoAsignado?: string;
  estado: 'Agendada' | 'Confirmada' | 'Llegó' | 'En_Atencion' | 'Finalizada' | 'Cancelada' | 'No_Asistio';
  motivoCancelacion?: string;
  esPromocion: boolean;
  fechaPromocion?: Date;
  reagendaciones: number;
  horaLlegada?: Date;
  horaAtencion?: Date;
  horaSalida?: Date;
  costoConsulta: number;
  montoAbonado: number;
  saldoPendiente: number;
  metodoPago?: string;
  creadoPor?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
  notas?: string;
}

export interface Abono {
  id: string;
  citaId: string;
  pacienteId: string;
  sucursalId: string;
  monto: number;
  metodoPago: 'Efectivo' | 'Tarjeta_Debito' | 'Tarjeta_Credito' | 'Transferencia' | 'Mixto';
  referencia?: string;
  montosDesglosados?: {
    efectivo?: number;
    tarjeta?: number;
    transferencia?: number;
  };
  fechaPago: Date;
  registradoPor: string;
  sucursalRegistro: string;
  folioRecibo?: string;
  reciboGenerado: boolean;
  rutaRecibo?: string;
  estado: 'Aplicado' | 'Cancelado';
  motivoCancelacion?: string;
  notas?: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  telefono: string;
  email?: string;
  zonaHoraria: string;
  activo: boolean;
}

export interface Usuario {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  rol: 'Admin' | 'Finanzas' | 'Contact_Center' | 'Recepcion' | 'Medico';
  sucursalId?: string;
  activo: boolean;
  ultimoAcceso?: Date;
}
