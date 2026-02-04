// Tipos para solicitudes de contacto
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

export type PreferenciaContacto = 'WhatsApp' | 'Telefono' | 'Email';

export interface SolicitudContacto {
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
  origen: 'Web' | 'WhatsApp' | 'Facebook' | 'Instagram' | 'Telefono';
  creadoPor: string;
  fechaCreacion: Date;
  fechaAsignacion?: Date;
  fechaResolucion?: Date;
  ultimaActualizacion: Date;
}

export interface ConfiguracionMotivoContacto {
  motivo: MotivoContacto;
  descripcion: string;
  prioridadSugerida: 'Alta' | 'Media' | 'Baja';
  tiempoRespuestaEsperadoMin: number;
}
