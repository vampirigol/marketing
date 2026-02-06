import { AutomationRule } from '../../core/entities/AutomationRule';
import { AutomationRepository } from './AutomationRepository';

export const SEED_RULES: Omit<AutomationRule, 'id' | 'fechaCreacion' | 'fechaActualizacion'>[] = [
  {
    nombre: 'Lead nuevo → Contacto inicial',
    descripcion: 'Al crear lead nuevo, asigna responsable, etiqueta Lead y notifica SLA 2h',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'alta',
    condiciones: [
      { id: 'seed-1-1', type: 'estado', operator: '=', value: 'new', label: 'Estado Lead' },
      { id: 'seed-1-2', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-1-a1', type: 'assign-vendedor', value: 'auto-sucursal', description: 'Asignar asesor' },
      { id: 'seed-1-a2', type: 'add-etiqueta', value: 'Lead', description: 'Agregar etiqueta Lead' },
      { id: 'seed-1-a3', type: 'send-notification', value: 'Nuevo lead: iniciar contacto (SLA 2h)', description: 'Notificar asesor' },
    ],
  },
  {
    nombre: 'Prospecto sin respuesta 24h',
    descripcion: 'Si prospecto sin respuesta 24h, reintento y alerta',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'alta',
    condiciones: [
      { id: 'seed-2-1', type: 'estado', operator: '=', value: 'reviewing', label: 'Estado Prospecto' },
      { id: 'seed-2-2', type: 'time-in-status', operator: '>', value: 24, label: 'Más de 24 horas' },
      { id: 'seed-2-3', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-2-a1', type: 'send-notification', value: 'Prospecto sin respuesta 24h', description: 'Reintento por otro canal' },
      { id: 'seed-2-a2', type: 'add-etiqueta', value: 'Reintento', description: 'Agregar etiqueta Reintento' },
    ],
  },
  {
    nombre: 'Cita pendiente → Confirmación',
    descripcion: 'Al agendar cita, confirmar y mantener recordatorios activos',
    activa: true,
    categoria: 'Administrar los elementos del flujo de trabajo',
    prioridad: 'media',
    condiciones: [
      { id: 'seed-3-1', type: 'estado', operator: '=', value: 'in-progress', label: 'Estado Cita pendiente' },
      { id: 'seed-3-2', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-3-a1', type: 'send-notification', value: 'Cita pendiente: enviar confirmación', description: 'Confirmación automática' },
      { id: 'seed-3-a2', type: 'add-etiqueta', value: 'Confirmacion', description: 'Etiqueta Confirmación' },
    ],
  },
  {
    nombre: 'Confirmación 24h antes',
    descripcion: 'Si cita confirmada, enviar recordatorio 24h antes',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'media',
    condiciones: [
      { id: 'seed-4-1', type: 'estado', operator: '=', value: 'open', label: 'Estado Confirmada' },
      { id: 'seed-4-2', type: 'time-in-status', operator: '>', value: 24, label: 'Más de 24 horas' },
      { id: 'seed-4-3', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-4-a1', type: 'send-notification', value: 'Recordatorio 24h', description: 'Recordatorio previo' },
    ],
  },
  {
    nombre: 'Recordatorio día de la cita',
    descripcion: 'Si cita confirmada, enviar recordatorio día de la cita',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'media',
    condiciones: [
      { id: 'seed-5-1', type: 'estado', operator: '=', value: 'open', label: 'Estado Confirmada' },
      { id: 'seed-5-2', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-5-a1', type: 'send-notification', value: 'Recordatorio día de la cita', description: 'Recordatorio mismo día' },
    ],
  },
  {
    nombre: 'No show (15 min)',
    descripcion: 'Si no llega 15 min después, mover a cierre y activar seguimiento',
    activa: true,
    categoria: 'Alertas para los empleados',
    prioridad: 'alta',
    condiciones: [
      { id: 'seed-6-1', type: 'estado', operator: '=', value: 'open', label: 'Estado Confirmada' },
      { id: 'seed-6-2', type: 'time-in-status', operator: '>', value: 1, label: 'Más de 1 hora (demo)' },
      { id: 'seed-6-3', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-6-a1', type: 'move-status', value: 'qualified', description: 'Mover a cierre (No show)' },
      { id: 'seed-6-a2', type: 'add-etiqueta', value: 'No show', description: 'Etiquetar No show' },
      { id: 'seed-6-a3', type: 'send-notification', value: 'No show detectado', description: 'Notificar seguimiento' },
    ],
  },
  {
    nombre: 'Inasistencia → 7 días de seguimiento',
    descripcion: 'Si No show sin respuesta 7 días → marcar Perdido',
    activa: true,
    categoria: 'Automatización del flujo de trabajo',
    prioridad: 'media',
    condiciones: [
      { id: 'seed-7-1', type: 'etiqueta', operator: 'contains', value: 'No show', label: 'Etiqueta No show' },
      { id: 'seed-7-2', type: 'time-in-status', operator: '>', value: 168, label: 'Más de 7 días' },
    ],
    acciones: [
      { id: 'seed-7-a1', type: 'add-etiqueta', value: 'Perdido', description: 'Etiquetar Perdido' },
      { id: 'seed-7-a2', type: 'send-notification', value: 'Sin respuesta 7 días', description: 'Notificar cierre' },
    ],
  },
  {
    nombre: 'Cita atendida → subsecuente',
    descripcion: 'Al finalizar atención, sugerir cita subsecuente y etiqueta',
    activa: true,
    categoria: 'Ventas recurrentes',
    prioridad: 'baja',
    condiciones: [
      { id: 'seed-8-1', type: 'estado', operator: '=', value: 'qualified', label: 'Estado Cierre' },
    ],
    acciones: [
      { id: 'seed-8-a1', type: 'add-etiqueta', value: 'Atendida', description: 'Etiqueta Atendida' },
      { id: 'seed-8-a2', type: 'send-notification', value: 'Sugerir cita subsecuente', description: 'Notificar subsecuente' },
    ],
  },
  {
    nombre: 'Segmentación automática de pacientes',
    descripcion: 'Clasificar por número de atenciones',
    activa: true,
    categoria: 'Información del cliente',
    prioridad: 'baja',
    condiciones: [
      { id: 'seed-9-1', type: 'etiqueta', operator: 'contains', value: 'Atendida', label: 'Etiqueta Atendida' },
    ],
    acciones: [
      { id: 'seed-9-a1', type: 'add-etiqueta', value: 'Atendido 1 vez', description: 'Segmento: una atención' },
    ],
  },
  {
    nombre: 'Lead sin cita 14 días',
    descripcion: 'Si lead sin cita 14 días → remarketing',
    activa: true,
    categoria: 'Anuncios',
    prioridad: 'media',
    condiciones: [
      { id: 'seed-10-1', type: 'estado', operator: '=', value: 'reviewing', label: 'Estado Prospecto' },
      { id: 'seed-10-2', type: 'time-in-status', operator: '>', value: 336, label: 'Más de 14 días' },
      { id: 'seed-10-3', type: 'ventana-mensajeria', operator: '<=', value: 7, label: 'Mensajería dentro de 7 días' },
    ],
    acciones: [
      { id: 'seed-10-a1', type: 'add-etiqueta', value: 'Remarketing', description: 'Etiqueta Remarketing' },
      { id: 'seed-10-a2', type: 'send-notification', value: 'Lead 14 días sin cita', description: 'Notificar campaña' },
    ],
  },
  {
    nombre: 'SLA vencido por etapa',
    descripcion: 'Si supera SLA, alerta y reasigna',
    activa: true,
    categoria: 'Monitoreo y control de los empleados',
    prioridad: 'alta',
    condiciones: [
      { id: 'seed-11-1', type: 'time-in-status', operator: '>', value: 6, label: 'SLA vencido' },
    ],
    acciones: [
      { id: 'seed-11-a1', type: 'notify-supervisor', value: 'SLA vencido', description: 'Notificar supervisor' },
      { id: 'seed-11-a2', type: 'assign-vendedor', value: 'supervisor', description: 'Asignar supervisor' },
    ],
  },
  {
    nombre: 'Reasignación inteligente',
    descripcion: 'Si no responde en 6h, reasignar a otro asesor',
    activa: true,
    categoria: 'Administración de tareas',
    prioridad: 'alta',
    condiciones: [
      { id: 'seed-12-1', type: 'time-in-status', operator: '>', value: 6, label: 'Más de 6 horas sin respuesta' },
    ],
    acciones: [
      { id: 'seed-12-a1', type: 'assign-vendedor', value: 'auto-reasignar', description: 'Reasignar asesor' },
      { id: 'seed-12-a2', type: 'send-notification', value: 'Reasignación automática', description: 'Notificar reasignación' },
    ],
  },
  {
    nombre: 'Bloqueo conversación 7 días',
    descripcion: 'Si redes sociales supera 7 días sin respuesta, bloquear conversación',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'alta',
    condiciones: [
      { id: 'seed-13-1', type: 'canal', operator: 'in', value: 'redes-sociales', label: 'Canal redes sociales' },
      { id: 'seed-13-2', type: 'dias-sin-respuesta', operator: '>', value: 7, label: 'Más de 7 días' },
    ],
    acciones: [
      { id: 'seed-13-a1', type: 'block-conversation', value: 'bloqueo-7-dias', description: 'Bloquear conversación' },
    ],
  },
];

export async function seedAutomationRulesIfEmpty(repo: AutomationRepository): Promise<void> {
  const existentes = await repo.listarReglas();
  if (existentes.length > 0) return;
  for (const regla of SEED_RULES) {
    await repo.crearRegla({
      ...regla,
      id: '',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });
  }
}
