/**
 * Tipos para el sistema Matrix Keila (Contact Center)
 */

export type CanalType = 'whatsapp' | 'tiktok' | 'instagram' | 'youtube' | 'fan-page' | 'facebook' | 'email' | 'google-ads';
export type ConversacionEstado = 'activa' | 'pendiente' | 'cerrada';
export type MensajeEstado = 'enviado' | 'entregado' | 'leido';

export interface Mensaje {
  id: string;
  conversacionId: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'audio' | 'documento';
  esDeKeila: boolean;
  estado: MensajeEstado;
  fechaHora: Date;
  adjuntos?: Adjunto[];
}

export interface Adjunto {
  id: string;
  tipo: 'imagen' | 'audio' | 'documento';
  url: string;
  nombre: string;
  tamaño: number;
}

export interface Conversacion {
  id: string;
  canal: CanalType;
  nombreContacto: string;
  telefono?: string;
  avatar?: string;
  ultimoMensaje: string;
  fechaUltimoMensaje: Date;
  estado: ConversacionEstado;
  mensajesNoLeidos: number;
  etiquetas: string[];
  pacienteId?: string;
  sucursalId?: string;
  enLinea: boolean;
  mensajes?: Mensaje[];
}

export interface EstadisticasMatrix {
  activas: number;
  pendientes: number;
  cerradasHoy: number;
  tiempoRespuestaPromedio: number; // en minutos
  tiktokCount: number;
  instagramCount: number;
  youtubeCount: number;
  fanPageCount: number;
  facebookCount: number;
  emailCount: number;
}

export interface FiltrosConversacion {
  canales: CanalType[];
  estados: ConversacionEstado[];
  etiquetas: string[];
  sucursalId?: string;
  busqueda?: string;
}

export interface AlertSettings {
  hotLeadHours: number;
  stalledDealDays: number;
  pricePageViews: number;
}

export interface KanbanColumnConfig {
  id: LeadStatus;
  titulo: string;
  color: string;
  icono: string;
  enabled: boolean;
}

export interface KanbanBoardSettings {
  hideEmptyColumns: boolean;
  columns: KanbanColumnConfig[];
}

export type CustomFieldType = 'text' | 'number' | 'boolean' | 'select';

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
}

export interface CustomFieldsSettings {
  fields: CustomFieldDefinition[];
  visibleFieldIds: string[];
}

// Tipos para la vista Kanban de Leads
export type LeadStatus =
  | 'new'
  | 'reviewing'
  | 'rejected'
  | 'qualified'
  | 'open'
  | 'in-progress'
  | 'open-deal'
  | 'agendados-mobile'
  | 'citas-locales';  // Citas agendadas desde Citas, CRM, Doctores (no redes sociales)

export interface Lead {
  id: string;
  nombre: string;
  nombreContacto?: string; // Alias usado por CRM/API
  email?: string;
  telefono?: string;
  avatar?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaUltimoContacto?: Date;
  fechaUltimoEstado?: Date;
  status: LeadStatus;
  canal: CanalType;
  valorEstimado?: number;
  notas?: string;
  conversacionId?: string; // Vinculado a una conversación de Matrix
  etiquetas: string[];
  visitasPaginaPrecios?: number;
  customFields?: Record<string, string | number | boolean>;
  asignadoA?: string;
  asignadoAvatar?: string;
  estadoVendedor?: 'en-llamada' | 'escribiendo' | 'ausente';
  editoresActivos?: string[];
  conflictoEdicion?: boolean;
}

export interface KanbanColumn {
  id: LeadStatus;
  titulo: string;
  color: string;
  icono: string;
  leads: Lead[];
}

export interface EstadisticasKanban {
  totalLeads: number;
  valorTotal: number;
  tasaConversion: number;
  promedioTiempo: number; // en días
}

// Tipos para Automatización (IF-THEN)
export type ConditionType =
  | 'time-in-status'
  | 'valor-leads'
  | 'canal'
  | 'etiqueta'
  | 'vendedor'
  | 'estado'
  | 'sucursal'
  | 'campana'
  | 'servicio'
  | 'origen'
  | 'intentos'
  | 'dias-sin-respuesta'
  | 'ventana-mensajeria'
  | 'contenido';
export type ConditionOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'contains' | 'not-contains' | 'in' | 'not-in';
export type ActionType =
  | 'move-status'
  | 'assign-vendedor'
  | 'add-etiqueta'
  | 'remove-etiqueta'
  | 'send-notification'
  | 'create-task'
  | 'notify-supervisor'
  | 'block-conversation'
  | 'integration'
  | 'cita-confirmar'
  | 'cita-reagendar'
  | 'cita-llegada';

export interface AutomationCondition {
  id: string;
  type: ConditionType;
  operator: ConditionOperator;
  value: string | number | boolean;
  label?: string;
}

export interface AutomationAction {
  id: string;
  type: ActionType;
  value: string | number;
  description?: string;
}

export interface AutomationRule {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  categoria?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  rolesPermitidos?: Array<'Admin' | 'Finanzas' | 'Contact_Center' | 'Recepcion' | 'Medico'>;
  abTest?: {
    enabled: boolean;
    ratio: number; // 0-100 para variante A
    variantA: string;
    variantB: string;
  };
  horario?: {
    dias: string[];
    inicio: string;
    fin: string;
    zona?: string;
  };
  sucursalScope?: string;
  slaPorEtapa?: Partial<Record<'new' | 'reviewing' | 'in-progress' | 'open' | 'qualified', number>>;
  pausa?: {
    tipo: 'sucursal' | 'asesor';
    id: string;
    desde: string;
    hasta: string;
  };
  condiciones: AutomationCondition[]; // AND entre condiciones
  acciones: AutomationAction[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creadorId?: string;
  orden?: number;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  leadId: string;
  leadNombre: string;
  accion: string;
  resultado: 'exitosa' | 'fallida' | 'parcial';
  mensaje?: string;
  fecha: Date;
  detalles?: Record<string, unknown>;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  executionsToday: number;
  successRate: number; // 0-100
  lastExecutionTime?: Date;
}
