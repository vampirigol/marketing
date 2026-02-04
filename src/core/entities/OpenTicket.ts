/**
 * Entidad: OpenTicket
 * Representa un ticket abierto para citas subsecuentes sin horario específico
 * Permite que el paciente llegue "cuando quiera" dentro de un rango de fechas
 */

export type EstadoTicket = 
  | 'Activo'           // Ticket válido, paciente puede llegar
  | 'Utilizado'        // Ya se convirtió en cita
  | 'Expirado'         // Fuera del rango de validez
  | 'Cancelado';       // Cancelado manualmente

export interface OpenTicket {
  id: string;
  codigo: string;              // Código único para identificar el ticket (ej: "OT-2024-001")
  pacienteId: string;
  sucursalId: string;
  
  // Información del ticket
  tipoConsulta: 'Subsecuente';  // Solo para subsecuentes
  especialidad: string;
  medicoPreferido?: string;     // Médico que atendió la consulta anterior
  
  // Vigencia
  fechaEmision: Date;
  fechaValidoDesde: Date;       // Desde cuándo puede usar el ticket
  fechaValidoHasta: Date;       // Hasta cuándo es válido
  diasValidez: number;          // Duración en días (típicamente 7-30 días)
  
  // Estado
  estado: EstadoTicket;
  
  // Uso del ticket
  fechaUtilizado?: Date;        // Cuándo llegó el paciente
  citaGeneradaId?: string;      // ID de la cita que se generó al llegar
  horaLlegada?: Date;           // Hora exacta en que llegó
  
  // Relación con cita anterior
  citaOrigenId: string;         // Cita que originó este ticket
  motivoConsultaAnterior?: string;
  diagnosticoAnterior?: string;
  tratamientoIndicado?: string;
  
  // Financiero
  costoEstimado: number;
  requierePago: boolean;
  
  // Encuesta post-consulta de la cita anterior
  encuestaCompletada: boolean;
  calificacionAtencion?: number;  // 1-5 estrellas
  comentariosEncuesta?: string;
  
  // Metadata
  creadoPor: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
  notas?: string;
}

export class OpenTicketEntity implements OpenTicket {
  id!: string;
  codigo!: string;
  pacienteId!: string;
  sucursalId!: string;
  tipoConsulta!: 'Subsecuente';
  especialidad!: string;
  medicoPreferido?: string;
  fechaEmision!: Date;
  fechaValidoDesde!: Date;
  fechaValidoHasta!: Date;
  diasValidez!: number;
  estado!: EstadoTicket;
  fechaUtilizado?: Date;
  citaGeneradaId?: string;
  horaLlegada?: Date;
  citaOrigenId!: string;
  motivoConsultaAnterior?: string;
  diagnosticoAnterior?: string;
  tratamientoIndicado?: string;
  costoEstimado!: number;
  requierePago!: boolean;
  encuestaCompletada!: boolean;
  calificacionAtencion?: number;
  comentariosEncuesta?: string;
  creadoPor!: string;
  fechaCreacion!: Date;
  ultimaActualizacion!: Date;
  notas?: string;

  constructor(data: OpenTicket) {
    Object.assign(this, data);
  }

  /**
   * Verifica si el ticket está vigente en este momento
   */
  estaVigente(): boolean {
    const ahora = new Date();
    return (
      this.estado === 'Activo' &&
      ahora >= this.fechaValidoDesde &&
      ahora <= this.fechaValidoHasta
    );
  }

  /**
   * Verifica si el ticket puede ser utilizado
   */
  puedeSerUtilizado(): { valido: boolean; razon?: string } {
    if (this.estado !== 'Activo') {
      return { valido: false, razon: `Ticket ${this.estado.toLowerCase()}` };
    }

    if (!this.estaVigente()) {
      return { valido: false, razon: 'Ticket fuera del rango de validez' };
    }

    return { valido: true };
  }

  /**
   * Marca el ticket como utilizado y registra la llegada
   */
  marcarComoUtilizado(citaId: string): void {
    if (!this.puedeSerUtilizado().valido) {
      throw new Error('No se puede utilizar este ticket en este momento');
    }

    this.estado = 'Utilizado';
    this.fechaUtilizado = new Date();
    this.horaLlegada = new Date();
    this.citaGeneradaId = citaId;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Marca el ticket como expirado
   */
  marcarComoExpirado(): void {
    if (this.estado === 'Activo') {
      this.estado = 'Expirado';
      this.ultimaActualizacion = new Date();
    }
  }

  /**
   * Cancela el ticket
   */
  cancelar(motivo?: string): void {
    if (this.estado === 'Utilizado') {
      throw new Error('No se puede cancelar un ticket ya utilizado');
    }

    this.estado = 'Cancelado';
    if (motivo) {
      this.notas = this.notas ? `${this.notas}\nCancelación: ${motivo}` : `Cancelación: ${motivo}`;
    }
    this.ultimaActualizacion = new Date();
  }

  /**
   * Registra la encuesta de satisfacción
   */
  registrarEncuesta(calificacion: number, comentarios?: string): void {
    if (calificacion < 1 || calificacion > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    this.encuestaCompletada = true;
    this.calificacionAtencion = calificacion;
    this.comentariosEncuesta = comentarios;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Calcula días restantes de vigencia
   */
  diasRestantesVigencia(): number {
    const ahora = new Date();
    const diferencia = this.fechaValidoHasta.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Genera el código del ticket
   */
  static generarCodigo(sucursalId: string, numero: number): string {
    const año = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const numeroFormateado = String(numero).padStart(4, '0');
    return `OT-${sucursalId}-${año}${mes}-${numeroFormateado}`;
  }
}

/**
 * DTO para crear un OpenTicket
 */
export interface CrearOpenTicketDTO {
  pacienteId: string;
  sucursalId: string;
  especialidad: string;
  medicoPreferido?: string;
  citaOrigenId: string;
  diasValidez?: number;          // Por defecto 30 días
  fechaValidoDesde?: Date;       // Por defecto: hoy
  motivoConsultaAnterior?: string;
  diagnosticoAnterior?: string;
  tratamientoIndicado?: string;
  costoEstimado: number;
  requierePago?: boolean;
  creadoPor: string;
  notas?: string;
}

/**
 * DTO para convertir un ticket a cita
 */
export interface ConvertirTicketACitaDTO {
  ticketId: string;
  horaLlegada: Date;
  medicoAsignado?: string;
  recepcionistaId: string;
  notas?: string;
}
