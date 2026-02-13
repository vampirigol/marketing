/**
 * Entidad: Cita
 * Representa una cita médica en el sistema
 */
export interface Cita {
  id: string;
  pacienteId: string;
  sucursalId: string;
  
  // Fecha y hora
  fechaCita: Date;
  horaCita: string; // formato "HH:mm"
  duracionMinutos: number;
  
  // Tipo de consulta
  tipoConsulta: 'Primera_Vez' | 'Subsecuente' | 'Urgencia';
  especialidad: string;
  medicoAsignado?: string;
  /** MEDICAL = consulta normal; SPIRITUAL = Cuidados Espirituales (calendario en violeta) */
  appointmentType?: 'MEDICAL' | 'SPIRITUAL';
  
  // Estado
  estado: 'Agendada' | 'Confirmada' | 'En_Consulta' | 'Atendida' | 'Cancelada' | 'No_Asistio';
  motivoCancelacion?: string;
  
  // Promoción
  esPromocion: boolean;
  fechaPromocion?: Date;
  reagendaciones: number; // Contador de reagendaciones
  
  // Llegada
  horaLlegada?: Date;
  horaAtencion?: Date;
  horaSalida?: Date;
  
  // Financiero
  costoConsulta: number;
  montoAbonado: number;
  saldoPendiente: number;
  metodoPago?: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto';
  
  // Confirmación por enlace (estilo Bitrix24)
  tokenConfirmacion?: string;
  confirmadaAt?: Date;

  // Metadata
  creadoPor: string; // Usuario que creó la cita (Antonio, Yaretzi, Keila)
  fechaCreacion: Date;
  ultimaActualizacion: Date;
  notas?: string;

  // Telemedicina
  telemedicinaLink?: string;
  preconsulta?: {
    motivo?: string;
    sintomas?: string;
    notas?: string;
  };
  documentos?: Array<{ nombre?: string; url: string }>;
}

export class CitaEntity implements Cita {
  id!: string;
  pacienteId!: string;
  sucursalId!: string;
  fechaCita!: Date;
  horaCita!: string;
  duracionMinutos!: number;
  tipoConsulta!: 'Primera_Vez' | 'Subsecuente' | 'Urgencia';
  especialidad!: string;
  medicoAsignado?: string;
  appointmentType?: 'MEDICAL' | 'SPIRITUAL';
  estado!: 'Agendada' | 'Confirmada' | 'En_Consulta' | 'Atendida' | 'Cancelada' | 'No_Asistio';
  motivoCancelacion?: string;
  esPromocion!: boolean;
  fechaPromocion?: Date;
  reagendaciones!: number;
  horaLlegada?: Date;
  horaAtencion?: Date;
  horaSalida?: Date;
  costoConsulta!: number;
  montoAbonado!: number;
  saldoPendiente!: number;
  metodoPago?: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto';
  creadoPor!: string;
  fechaCreacion!: Date;
  ultimaActualizacion!: Date;
  notas?: string;
  telemedicinaLink?: string;
  preconsulta?: {
    motivo?: string;
    sintomas?: string;
    notas?: string;
  };
  documentos?: Array<{ nombre?: string; url: string }>;

  constructor(data: Cita) {
    Object.assign(this, data);
    this.calcularSaldo();
  }

  marcarLlegada(): void {
    if (this.estado !== 'Confirmada' && this.estado !== 'Agendada') {
      throw new Error('Solo se puede marcar llegada en citas Agendadas o Confirmadas');
    }
    this.horaLlegada = new Date();
    this.estado = 'Confirmada';
  }

  iniciarAtencion(): void {
    if (this.estado !== 'Confirmada') {
      throw new Error('La cita debe estar confirmada para iniciar atención');
    }
    this.horaAtencion = new Date();
    this.estado = 'En_Consulta';
  }

  finalizarAtencion(): void {
    if (this.estado !== 'En_Consulta') {
      throw new Error('La cita debe estar en consulta para finalizarla');
    }
    this.horaSalida = new Date();
    this.estado = 'Atendida';
  }

  reagendar(nuevaFecha: Date, nuevaHora: string): void {
    // Nota: La validación de límite de promoción se hace en el UseCase ReagendarPromocion
    // Aquí solo validamos restricciones de la entidad
    
    if (this.estado === 'Cancelada') {
      throw new Error('No se puede reagendar una cita cancelada');
    }
    
    if (this.estado === 'Atendida') {
      throw new Error('No se puede reagendar una cita ya atendida');
    }
    
    this.fechaCita = nuevaFecha;
    this.horaCita = nuevaHora;
    this.reagendaciones++;
    this.estado = 'Agendada';
    this.ultimaActualizacion = new Date();
  }

  registrarAbono(monto: number, metodo: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto'): void {
    if (monto <= 0) {
      throw new Error('El monto del abono debe ser mayor a cero');
    }
    
    this.montoAbonado += monto;
    this.metodoPago = metodo;
    this.calcularSaldo();
  }

  private calcularSaldo(): void {
    this.saldoPendiente = this.costoConsulta - this.montoAbonado;
  }

  estaVencida(): boolean {
    const ahora = new Date();
    return this.fechaCita < ahora && this.estado === 'Agendada';
  }
}
