/**
 * Entidad: Solicitud de Contacto
 * Representa una solicitud de un cliente para ser contactado por un agente
 */

export type MotivoContacto = 
  | 'Consulta_General'
  | 'Cotizacion'
  | 'Reagendar_Cita'
  | 'Cancelar_Cita'
  | 'Informacion_Servicios'
  | 'Queja_Sugerencia'
  | 'Urgencia'
  | 'Otro';

export type EstadoSolicitud =
  | 'Pendiente'
  | 'Asignada'
  | 'En_Contacto'
  | 'Resuelta'
  | 'Cancelada';

export type PreferenciaContacto = 
  | 'WhatsApp'
  | 'Telefono'
  | 'Email';

/** Columna del Kanban Contact Center (máquina de estados del lead). */
export type LeadStatus =
  | 'LEADS_WHATSAPP'  // Entrada inicial
  | 'AGENDADO'        // Tiene cita futura
  | 'CONFIRMADO'      // Cita confirmada -> KPI CONFIRMED_COUNT
  | 'PAGADO_CERRADO'  // Pagado/cerrado -> KPI REVENUE
  | 'REMARKETING'     // Leads para recuperar
  | 'NO_ASISTIO';     // Automático: pasó fecha sin confirmar/atender

export interface SolicitudContacto {
  id: string;
  
  // Información del solicitante
  pacienteId?: string; // Opcional si aún no es paciente registrado
  nombreCompleto: string;
  telefono: string;
  email?: string;
  whatsapp?: string;
  
  // Detalles de la solicitud
  sucursalId: string;
  sucursalNombre: string;
  motivo: MotivoContacto;
  motivoDetalle?: string;
  preferenciaContacto: PreferenciaContacto;
  
  // Gestión y seguimiento
  estado: EstadoSolicitud;
  prioridad: 'Alta' | 'Media' | 'Baja';
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
  
  // Seguimiento
  intentosContacto: number;
  ultimoIntento?: Date;
  notas?: string;
  resolucion?: string;
  
  // Metadata (unificado con canales para reportes y SLA)
  origen: 'Web' | 'WhatsApp' | 'Facebook' | 'Instagram' | 'Telefono' | 'TikTok' | 'YouTube' | 'Email';
  creadoPor: string;
  fechaCreacion: Date;
  fechaAsignacion?: Date;
  fechaResolucion?: Date;
  ultimaActualizacion: Date;

  // CRM
  crmStatus?: string;
  crmResultado?: string;

  /** Vinculación con cita al convertir lead → paciente/cita. Si no es null, el lead ya no se muestra en Contact Center. */
  citaId?: string;
  /** Número de afiliado asignado al crear el lead (RCA-YYYY-NNNNN). */
  noAfiliacion?: string;

  /** Columna Kanban Contact Center (Pipeline). */
  leadStatus?: LeadStatus;
  /** Incluido en lista de recuperación (ej. al marcar No Asistió). */
  enListaRecovery?: boolean;
}

/**
 * Entidad con lógica de negocio
 */
export class SolicitudContactoEntity implements SolicitudContacto {
  id: string;
  pacienteId?: string;
  nombreCompleto: string;
  telefono: string;
  email?: string;
  whatsapp?: string;
  sucursalId: string;
  sucursalNombre: string;
  motivo: MotivoContacto;
  motivoDetalle?: string;
  preferenciaContacto: PreferenciaContacto;
  estado: EstadoSolicitud;
  prioridad: 'Alta' | 'Media' | 'Baja';
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
  intentosContacto: number;
  ultimoIntento?: Date;
  notas?: string;
  resolucion?: string;
  origen: 'Web' | 'WhatsApp' | 'Facebook' | 'Instagram' | 'Telefono' | 'TikTok' | 'YouTube' | 'Email';
  creadoPor: string;
  fechaCreacion: Date;
  fechaAsignacion?: Date;
  fechaResolucion?: Date;
  ultimaActualizacion: Date;
  crmStatus?: string;
  crmResultado?: string;
  citaId?: string;
  noAfiliacion?: string;
  leadStatus?: LeadStatus;
  enListaRecovery?: boolean;

  constructor(data: SolicitudContacto) {
    this.id = data.id;
    this.pacienteId = data.pacienteId;
    this.nombreCompleto = data.nombreCompleto;
    this.telefono = data.telefono;
    this.email = data.email;
    this.whatsapp = data.whatsapp;
    this.sucursalId = data.sucursalId;
    this.sucursalNombre = data.sucursalNombre;
    this.motivo = data.motivo;
    this.motivoDetalle = data.motivoDetalle;
    this.preferenciaContacto = data.preferenciaContacto;
    this.estado = data.estado;
    this.prioridad = data.prioridad;
    this.agenteAsignadoId = data.agenteAsignadoId;
    this.agenteAsignadoNombre = data.agenteAsignadoNombre;
    this.intentosContacto = data.intentosContacto;
    this.ultimoIntento = data.ultimoIntento;
    this.notas = data.notas;
    this.resolucion = data.resolucion;
    this.origen = data.origen;
    this.creadoPor = data.creadoPor;
    this.fechaCreacion = data.fechaCreacion;
    this.fechaAsignacion = data.fechaAsignacion;
    this.fechaResolucion = data.fechaResolucion;
    this.ultimaActualizacion = data.ultimaActualizacion;
    this.crmStatus = data.crmStatus;
    this.crmResultado = data.crmResultado;
    this.citaId = data.citaId;
    this.noAfiliacion = data.noAfiliacion;
    this.leadStatus = data.leadStatus ?? 'LEADS_WHATSAPP';
    this.enListaRecovery = data.enListaRecovery ?? false;
  }

  /**
   * Asigna un agente a la solicitud
   */
  asignarAgente(agenteId: string, agenteNombre: string): void {
    this.agenteAsignadoId = agenteId;
    this.agenteAsignadoNombre = agenteNombre;
    this.estado = 'Asignada';
    this.fechaAsignacion = new Date();
    this.ultimaActualizacion = new Date();
  }

  /**
   * Marca que el agente está contactando al cliente
   */
  iniciarContacto(): void {
    if (this.estado === 'Pendiente' || this.estado === 'Asignada') {
      this.estado = 'En_Contacto';
      this.intentosContacto += 1;
      this.ultimoIntento = new Date();
      this.ultimaActualizacion = new Date();
    }
  }

  /**
   * Registra un intento de contacto adicional
   */
  registrarIntentoContacto(notas?: string): void {
    this.intentosContacto += 1;
    this.ultimoIntento = new Date();
    this.ultimaActualizacion = new Date();
    
    if (notas) {
      this.notas = this.notas ? `${this.notas}\n[${new Date().toISOString()}] ${notas}` : notas;
    }
  }

  /**
   * Resuelve la solicitud
   */
  resolver(resolucion: string): void {
    this.estado = 'Resuelta';
    this.resolucion = resolucion;
    this.fechaResolucion = new Date();
    this.ultimaActualizacion = new Date();
  }

  /**
   * Cancela la solicitud
   */
  cancelar(motivo: string): void {
    this.estado = 'Cancelada';
    this.resolucion = `Cancelada: ${motivo}`;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Actualiza la prioridad
   */
  actualizarPrioridad(nuevaPrioridad: 'Alta' | 'Media' | 'Baja'): void {
    this.prioridad = nuevaPrioridad;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Obtiene el tiempo de espera en minutos
   */
  obtenerTiempoEspera(): number {
    const ahora = new Date();
    const diffMs = ahora.getTime() - this.fechaCreacion.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Verifica si la solicitud está vencida (más de 2 horas sin respuesta)
   */
  estaVencida(): boolean {
    return this.obtenerTiempoEspera() > 120 && this.estado === 'Pendiente';
  }

  /**
   * Determina la prioridad automáticamente según el motivo
   */
  static determinarPrioridad(motivo: MotivoContacto): 'Alta' | 'Media' | 'Baja' {
    switch (motivo) {
      case 'Urgencia':
      case 'Queja_Sugerencia':
        return 'Alta';
      case 'Reagendar_Cita':
      case 'Cancelar_Cita':
      case 'Cotizacion':
        return 'Media';
      default:
        return 'Baja';
    }
  }

  /**
   * Obtiene el canal de contacto preferido
   */
  obtenerCanalContacto(): string {
    switch (this.preferenciaContacto) {
      case 'WhatsApp':
        return this.whatsapp || this.telefono;
      case 'Telefono':
        return this.telefono;
      case 'Email':
        return this.email || this.telefono;
      default:
        return this.telefono;
    }
  }
}

/**
 * Configuración de motivos de contacto
 */
export interface ConfiguracionMotivoContacto {
  motivo: MotivoContacto;
  descripcion: string;
  prioridadSugerida: 'Alta' | 'Media' | 'Baja';
  tiempoRespuestaEsperadoMin: number;
}

export const CATALOGO_MOTIVOS_CONTACTO: ConfiguracionMotivoContacto[] = [
  {
    motivo: 'Urgencia',
    descripcion: 'Necesito atención urgente',
    prioridadSugerida: 'Alta',
    tiempoRespuestaEsperadoMin: 15
  },
  {
    motivo: 'Queja_Sugerencia',
    descripcion: 'Tengo una queja o sugerencia',
    prioridadSugerida: 'Alta',
    tiempoRespuestaEsperadoMin: 30
  },
  {
    motivo: 'Reagendar_Cita',
    descripcion: 'Quiero reagendar mi cita',
    prioridadSugerida: 'Media',
    tiempoRespuestaEsperadoMin: 60
  },
  {
    motivo: 'Cancelar_Cita',
    descripcion: 'Necesito cancelar mi cita',
    prioridadSugerida: 'Media',
    tiempoRespuestaEsperadoMin: 60
  },
  {
    motivo: 'Cotizacion',
    descripcion: 'Solicitar cotización de servicios',
    prioridadSugerida: 'Media',
    tiempoRespuestaEsperadoMin: 120
  },
  {
    motivo: 'Informacion_Servicios',
    descripcion: 'Información sobre servicios disponibles',
    prioridadSugerida: 'Baja',
    tiempoRespuestaEsperadoMin: 120
  },
  {
    motivo: 'Consulta_General',
    descripcion: 'Consulta general',
    prioridadSugerida: 'Baja',
    tiempoRespuestaEsperadoMin: 180
  },
  {
    motivo: 'Otro',
    descripcion: 'Otro motivo',
    prioridadSugerida: 'Baja',
    tiempoRespuestaEsperadoMin: 180
  }
];
