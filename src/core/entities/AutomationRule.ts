export type ConditionType =
  | 'time-in-status'
  | 'valor-leads'
  | 'canal'
  | 'etiqueta'
  | 'estado'
  | 'sucursal'
  | 'campana'
  | 'servicio'
  | 'origen'
  | 'intentos'
  | 'dias-sin-respuesta'
  | 'ventana-mensajeria'
  | 'contenido';

export type ConditionOperator =
  | '>'
  | '<'
  | '>='
  | '<='
  | '='
  | '!='
  | 'contains'
  | 'not-contains'
  | 'in'
  | 'not-in';

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
    ratio: number;
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
  condiciones: AutomationCondition[];
  acciones: AutomationAction[];
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  targetId: string;
  targetNombre: string;
  accion: string;
  resultado: 'exitosa' | 'fallida' | 'parcial';
  mensaje?: string;
  fecha: Date;
  detalles?: Record<string, unknown>;
}
