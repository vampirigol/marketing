/**
 * Servicio de Reglas de Automatización (IF-THEN)
 * Maneja la creación, ejecución y logging de automatizaciones
 */

import { Lead, AutomationRule, AutomationLog, AutomationCondition, LeadStatus } from '@/types/matrix';
import { SUCURSALES } from '@/lib/doctores-data';
import { api } from '@/lib/api';

/**
 * Repositorio en memoria para reglas (simulado)
 * En producción, usar BD real
 */
const CAMPANAS_BASE = ['Promoción Preventiva', 'Checkup Familiar', 'Campaña Visión 2026', 'Plan Salud Integral'];
const SERVICIOS_BASE = ['Consulta Medicina General', 'Consulta Odontológica', 'Consulta Oftalmológica', 'Consulta Nutricional'];
const ORIGENES_BASE = ['Keila IA', 'Formulario', 'Telefonía', 'WhatsApp', 'Redes Sociales', 'Importación'];
const HORARIO_LABORAL = { dias: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'], inicio: '08:00', fin: '19:00' };
const CRM_STORAGE_PREFIX = 'crm.kanban.';
type RoleOption = NonNullable<AutomationRule['rolesPermitidos']>[number];

const automationRules: AutomationRule[] = [
  {
    id: 'rca-1',
    nombre: 'Lead nuevo → Contacto inicial',
    descripcion: 'Al crear lead nuevo, asigna responsable, etiqueta Lead y notifica SLA 2h',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'alta',
    horario: HORARIO_LABORAL,
    slaPorEtapa: { new: 2, reviewing: 6, 'in-progress': 12, open: 24 },
    condiciones: [
      {
        id: 'rca-1-1',
        type: 'estado',
        operator: '=',
        value: 'new',
        label: 'Estado Lead'
      },
      {
        id: 'rca-1-2',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-1-a1',
        type: 'assign-vendedor',
        value: 'auto-sucursal',
        description: 'Asignar a asesor por sucursal'
      },
      {
        id: 'rca-1-a2',
        type: 'add-etiqueta',
        value: 'Lead',
        description: 'Agregar etiqueta Lead'
      },
      {
        id: 'rca-1-a3',
        type: 'send-notification',
        value: 'Nuevo lead: iniciar contacto (SLA 2h)',
        description: 'Notificar al asesor'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 1
  },
  {
    id: 'rca-2',
    nombre: 'Prospecto sin respuesta 24h',
    descripcion: 'Si prospecto sin respuesta 24h, reintento y alerta',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'alta',
    horario: HORARIO_LABORAL,
    condiciones: [
      {
        id: 'rca-2-1',
        type: 'estado',
        operator: '=',
        value: 'reviewing',
        label: 'Estado Prospecto'
      },
      {
        id: 'rca-2-2',
        type: 'time-in-status',
        operator: '>',
        value: 24,
        label: 'Más de 24 horas'
      },
      {
        id: 'rca-2-3',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-2-a1',
        type: 'send-notification',
        value: 'Prospecto sin respuesta 24h: reintento por otro canal',
        description: 'Notificar reintento'
      },
      {
        id: 'rca-2-a2',
        type: 'add-etiqueta',
        value: 'Reintento',
        description: 'Agregar etiqueta Reintento'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 2
  },
  {
    id: 'rca-3',
    nombre: 'Cita pendiente → Confirmación',
    descripcion: 'Al agendar cita, confirmar y mantener recordatorios activos',
    activa: true,
    categoria: 'Administrar los elementos del flujo de trabajo',
    prioridad: 'media',
    horario: HORARIO_LABORAL,
    condiciones: [
      {
        id: 'rca-3-1',
        type: 'estado',
        operator: '=',
        value: 'in-progress',
        label: 'Estado Cita pendiente'
      },
      {
        id: 'rca-3-2',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-3-a1',
        type: 'send-notification',
        value: 'Cita pendiente: enviar confirmación',
        description: 'Enviar confirmación automática'
      },
      {
        id: 'rca-3-a2',
        type: 'add-etiqueta',
        value: 'Confirmacion',
        description: 'Agregar etiqueta Confirmación'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 3
  },
  {
    id: 'rca-4',
    nombre: 'Confirmación 24h antes',
    descripcion: 'Si cita confirmada, enviar recordatorio 24h antes',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'media',
    horario: HORARIO_LABORAL,
    condiciones: [
      {
        id: 'rca-4-1',
        type: 'estado',
        operator: '=',
        value: 'open',
        label: 'Estado Confirmada'
      },
      {
        id: 'rca-4-2',
        type: 'time-in-status',
        operator: '>',
        value: 24,
        label: 'Más de 24 horas'
      },
      {
        id: 'rca-4-3',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-4-a1',
        type: 'send-notification',
        value: 'Recordatorio 24h: ¿Confirmas tu asistencia?',
        description: 'Recordatorio previo'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 4
  },
  {
    id: 'rca-5',
    nombre: 'Recordatorio día de la cita',
    descripcion: 'Si cita confirmada, enviar recordatorio día de la cita',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'media',
    horario: HORARIO_LABORAL,
    condiciones: [
      {
        id: 'rca-5-1',
        type: 'estado',
        operator: '=',
        value: 'open',
        label: 'Estado Confirmada'
      },
      {
        id: 'rca-5-2',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-5-a1',
        type: 'send-notification',
        value: 'Recordatorio de cita hoy: confirma o reagenda',
        description: 'Recordatorio mismo día'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 5
  },
  {
    id: 'rca-6',
    nombre: 'No show (15 min)',
    descripcion: 'Si no llega 15 min después, mover a cierre y activar seguimiento',
    activa: true,
    categoria: 'Alertas para los empleados',
    prioridad: 'alta',
    horario: HORARIO_LABORAL,
    condiciones: [
      {
        id: 'rca-6-1',
        type: 'estado',
        operator: '=',
        value: 'open',
        label: 'Estado Confirmada'
      },
      {
        id: 'rca-6-2',
        type: 'time-in-status',
        operator: '>',
        value: 1,
        label: 'Más de 1 hora (15 min demo)'
      },
      {
        id: 'rca-6-3',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-6-a1',
        type: 'move-status',
        value: 'qualified',
        description: 'Mover a cierre (No show)'
      },
      {
        id: 'rca-6-a2',
        type: 'add-etiqueta',
        value: 'No show',
        description: 'Etiquetar No show'
      },
      {
        id: 'rca-6-a3',
        type: 'send-notification',
        value: 'No show detectado: iniciar seguimiento',
        description: 'Notificar seguimiento'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 6
  },
  {
    id: 'rca-7',
    nombre: 'Inasistencia → 7 días de seguimiento',
    descripcion: 'Si No show sin respuesta 7 días → marcar Perdido',
    activa: true,
    categoria: 'Automatización del flujo de trabajo',
    prioridad: 'media',
    condiciones: [
      {
        id: 'rca-7-1',
        type: 'etiqueta',
        operator: 'contains',
        value: 'No show',
        label: 'Etiqueta No show'
      },
      {
        id: 'rca-7-2',
        type: 'time-in-status',
        operator: '>',
        value: 168,
        label: 'Más de 7 días'
      }
    ],
    acciones: [
      {
        id: 'rca-7-a1',
        type: 'move-status',
        value: 'qualified',
        description: 'Mantener en cierre'
      },
      {
        id: 'rca-7-a2',
        type: 'add-etiqueta',
        value: 'Perdido',
        description: 'Etiquetar Perdido'
      },
      {
        id: 'rca-7-a3',
        type: 'send-notification',
        value: 'Sin respuesta 7 días: marcar perdido',
        description: 'Notificar cierre'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 7
  },
  {
    id: 'rca-8',
    nombre: 'Cita atendida → subsecuente',
    descripcion: 'Al finalizar atención, sugerir cita subsecuente y etiqueta',
    activa: true,
    categoria: 'Ventas recurrentes',
    prioridad: 'baja',
    condiciones: [
      {
        id: 'rca-8-1',
        type: 'estado',
        operator: '=',
        value: 'qualified',
        label: 'Estado Cierre'
      }
    ],
    acciones: [
      {
        id: 'rca-8-a1',
        type: 'add-etiqueta',
        value: 'Atendida',
        description: 'Etiquetar Atendida'
      },
      {
        id: 'rca-8-a2',
        type: 'send-notification',
        value: 'Cita atendida: sugerir subsecuente',
        description: 'Notificar propuesta de subsecuente'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 8
  },
  {
    id: 'rca-9',
    nombre: 'Segmentación automática de pacientes',
    descripcion: 'Clasificar por número de atenciones',
    activa: true,
    categoria: 'Información del cliente',
    prioridad: 'baja',
    condiciones: [
      {
        id: 'rca-9-1',
        type: 'etiqueta',
        operator: 'contains',
        value: 'Atendida',
        label: 'Etiqueta Atendida'
      }
    ],
    acciones: [
      {
        id: 'rca-9-a1',
        type: 'add-etiqueta',
        value: 'Atendido 1 vez',
        description: 'Segmento: una atención'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 9
  },
  {
    id: 'rca-10',
    nombre: 'Lead sin cita 14 días',
    descripcion: 'Si lead sin cita 14 días → remarketing',
    activa: true,
    categoria: 'Anuncios',
    prioridad: 'media',
    condiciones: [
      {
        id: 'rca-10-1',
        type: 'estado',
        operator: '=',
        value: 'reviewing',
        label: 'Estado Prospecto'
      },
      {
        id: 'rca-10-2',
        type: 'time-in-status',
        operator: '>',
        value: 336,
        label: 'Más de 14 días'
      },
      {
        id: 'rca-10-3',
        type: 'ventana-mensajeria',
        operator: '<=',
        value: 7,
        label: 'Mensajería dentro de 7 días (redes sociales)'
      }
    ],
    acciones: [
      {
        id: 'rca-10-a1',
        type: 'add-etiqueta',
        value: 'Remarketing',
        description: 'Etiqueta Remarketing'
      },
      {
        id: 'rca-10-a2',
        type: 'send-notification',
        value: 'Lead 14 días sin cita: activar campaña',
        description: 'Notificar campaña'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 10
  },
  {
    id: 'rca-11',
    nombre: 'SLA vencido por etapa',
    descripcion: 'Si supera SLA, alerta y reasigna',
    activa: true,
    categoria: 'Monitoreo y control de los empleados',
    prioridad: 'alta',
    condiciones: [
      {
        id: 'rca-11-1',
        type: 'time-in-status',
        operator: '>',
        value: 6,
        label: 'SLA vencido'
      }
    ],
    acciones: [
      {
        id: 'rca-11-a1',
        type: 'send-notification',
        value: 'SLA vencido: reasignar y notificar supervisor',
        description: 'Notificar supervisor'
      },
      {
        id: 'rca-11-a2',
        type: 'assign-vendedor',
        value: 'supervisor',
        description: 'Asignar a supervisor'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 11
  },
  {
    id: 'rca-12',
    nombre: 'Reasignación inteligente',
    descripcion: 'Si no responde en 6h, reasignar a otro asesor',
    activa: true,
    categoria: 'Administración de tareas',
    prioridad: 'alta',
    condiciones: [
      {
        id: 'rca-12-1',
        type: 'time-in-status',
        operator: '>',
        value: 6,
        label: 'Más de 6 horas sin respuesta'
      }
    ],
    acciones: [
      {
        id: 'rca-12-a1',
        type: 'assign-vendedor',
        value: 'auto-reasignar',
        description: 'Reasignar a otro asesor disponible'
      },
      {
        id: 'rca-12-a2',
        type: 'send-notification',
        value: 'Reasignación automática por falta de respuesta',
        description: 'Notificar reasignación'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 12
  },
  {
    id: 'rca-13',
    nombre: 'Bloqueo conversación 7 días',
    descripcion: 'Si redes sociales supera 7 días sin respuesta, bloquear conversación',
    activa: true,
    categoria: 'Comunicación con el cliente',
    prioridad: 'alta',
    condiciones: [
      {
        id: 'rca-13-1',
        type: 'canal',
        operator: 'in',
        value: 'redes-sociales',
        label: 'Canal en redes sociales'
      },
      {
        id: 'rca-13-2',
        type: 'dias-sin-respuesta',
        operator: '>',
        value: 7,
        label: 'Más de 7 días sin respuesta'
      }
    ],
    acciones: [
      {
        id: 'rca-13-a1',
        type: 'block-conversation',
        value: 'bloqueo-7-dias',
        description: 'Bloquear conversación por política de 7 días'
      }
    ],
    fechaCreacion: new Date('2026-02-05'),
    fechaActualizacion: new Date('2026-02-05'),
    orden: 13
  }
];

let automationLogs: AutomationLog[] = [];

async function intentarApi<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Obtener todas las reglas de automatización
 */
export async function obtenerReglas(): Promise<AutomationRule[]> {
  const apiResp = await intentarApi(() => api.get('/automatizaciones/reglas').then((r) => r.data.reglas as AutomationRule[]));
  if (apiResp) {
    return apiResp.map((regla) => ({
      ...regla,
      fechaCreacion: new Date(regla.fechaCreacion),
      fechaActualizacion: new Date(regla.fechaActualizacion),
    }));
  }
  throw new Error('No se pudo obtener reglas desde backend.');
}

export async function seedReglasSiVacio(): Promise<void> {
  const reglas = await obtenerReglas();
  if (reglas.length > 0) return;
  for (const regla of automationRules) {
    await crearRegla({
      nombre: regla.nombre,
      descripcion: regla.descripcion,
      activa: regla.activa,
      categoria: regla.categoria,
      prioridad: regla.prioridad,
      rolesPermitidos: regla.rolesPermitidos,
      abTest: regla.abTest,
      sucursalScope: regla.sucursalScope,
      horario: regla.horario,
      slaPorEtapa: regla.slaPorEtapa,
      pausa: regla.pausa,
      condiciones: regla.condiciones,
      acciones: regla.acciones,
    });
  }
}

/**
 * Obtener una regla por ID
 */
export async function obtenerRegla(id: string): Promise<AutomationRule | null> {
  const reglas = await obtenerReglas();
  return reglas.find((r) => r.id === id) || null;
}

/**
 * Crear nueva regla de automatización
 */
export async function crearRegla(regla: Omit<AutomationRule, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<AutomationRule> {
  const id = `rule-${Date.now()}`;
  const nuevaRegla: AutomationRule = {
    ...regla,
    id,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    orden: automationRules.length + 1
  };
  const apiResp = await intentarApi(() => api.post('/automatizaciones/reglas', nuevaRegla).then((r) => r.data.regla as AutomationRule));
  if (apiResp) return apiResp;
  throw new Error('No se pudo crear la regla en backend.');
}

/**
 * Actualizar regla existente
 */
export async function actualizarRegla(id: string, cambios: Partial<Omit<AutomationRule, 'id' | 'fechaCreacion'>>): Promise<AutomationRule | null> {
  const apiResp = await intentarApi(() => api.put(`/automatizaciones/reglas/${id}`, cambios).then((r) => r.data.regla as AutomationRule));
  if (apiResp) return apiResp;
  throw new Error('No se pudo actualizar la regla en backend.');
}

/**
 * Eliminar regla
 */
export async function eliminarRegla(id: string): Promise<boolean> {
  const apiResp = await intentarApi(() => api.delete(`/automatizaciones/reglas/${id}`).then((r) => r.data.success as boolean));
  if (apiResp !== null) return apiResp;
  throw new Error('No se pudo eliminar la regla en backend.');
}

/**
 * Evaluar si un lead cumple las condiciones de una regla
 */
function estaEnHorario(horario?: AutomationRule['horario']): boolean {
  if (!horario) return true;
  const dias = horario.dias || [];
  const ahora = new Date();
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const diaActual = nombresDias[ahora.getDay()];
  if (dias.length > 0 && !dias.includes(diaActual)) return false;
  const [inicioH, inicioM] = horario.inicio.split(':').map((v) => parseInt(v, 10));
  const [finH, finM] = horario.fin.split(':').map((v) => parseInt(v, 10));
  const inicioMin = inicioH * 60 + inicioM;
  const finMin = finH * 60 + finM;
  const actualMin = ahora.getHours() * 60 + ahora.getMinutes();
  return actualMin >= inicioMin && actualMin <= finMin;
}

function estaEnPausa(pausa?: AutomationRule['pausa']): boolean {
  if (!pausa) return false;
  const desde = new Date(pausa.desde);
  const hasta = new Date(pausa.hasta);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return false;
  const ahora = new Date();
  return ahora >= desde && ahora <= hasta;
}

function obtenerDiasSinRespuesta(lead: Lead): number {
  const referencia = lead.fechaUltimoContacto || lead.fechaCreacion || new Date();
  const diffMs = Date.now() - referencia.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function evaluarCondiciones(lead: Lead, regla: AutomationRule): boolean {
  if (!estaEnHorario(regla.horario)) return false;
  if (estaEnPausa(regla.pausa)) return false;
  if (!estaPermitidaParaRol(regla)) return false;
  return regla.condiciones.every((cond) => evaluarCondicion(lead, cond));
}

/**
 * Evaluar una condición individual
 */
function evaluarCondicion(lead: Lead, condicion: AutomationCondition): boolean {
  const valorTexto = String(condicion.value);
  const diasSinRespuesta = obtenerDiasSinRespuesta(lead);
  const canalValue = lead.canal;
  const valorNumero = typeof condicion.value === 'number' ? condicion.value : parseFloat(valorTexto);
  const esRedSocial = canalValue === 'facebook' || canalValue === 'instagram';
  switch (condicion.type) {
    case 'time-in-status': {
      // Simular tiempo en estado (en horas)
      const horasEnEstado = Math.floor(Math.random() * 72); // 0-72 horas
      const valor = valorNumero;
      switch (condicion.operator) {
        case '>': return horasEnEstado > valor;
        case '<': return horasEnEstado < valor;
        case '>=': return horasEnEstado >= valor;
        case '<=': return horasEnEstado <= valor;
        case '=': return horasEnEstado === valor;
        default: return false;
      }
    }

    case 'valor-leads': {
      const leadValue = lead.valorEstimado || 0;
      const valor = valorNumero;
      switch (condicion.operator) {
        case '>': return leadValue > valor;
        case '<': return leadValue < valor;
        case '>=': return leadValue >= valor;
        case '<=': return leadValue <= valor;
        case '=': return leadValue === valor;
        default: return false;
      }
    }

    case 'canal': {
      const condicionValue = valorTexto;
      const canalesObjetivo =
        condicionValue === 'redes-sociales' ? ['facebook', 'instagram'] : [condicionValue];
      switch (condicion.operator) {
        case '=': return canalValue === condicionValue;
        case '!=': return canalValue !== condicionValue;
        case 'in': return canalesObjetivo.includes(canalValue);
        case 'not-in': return !canalesObjetivo.includes(canalValue);
        default: return false;
      }
    }

    case 'etiqueta': {
      const condicionValue = condicion.value as string;
      switch (condicion.operator) {
        case 'contains': return lead.etiquetas.includes(condicionValue);
        case 'not-contains': return !lead.etiquetas.includes(condicionValue);
        default: return false;
      }
    }

    case 'estado': {
      const statusValue = lead.status;
      const condicionValue = valorTexto;
      switch (condicion.operator) {
        case '=': return statusValue === condicionValue;
        case '!=': return statusValue !== condicionValue;
        default: return false;
      }
    }

    case 'sucursal': {
      const sucursal = String(lead.customFields?.Sucursal || '');
      switch (condicion.operator) {
        case '=': return sucursal === valorTexto;
        case '!=': return sucursal !== valorTexto;
        case 'contains': return sucursal.includes(valorTexto);
        default: return false;
      }
    }

    case 'campana': {
      const campana = String(lead.customFields?.Campana || '');
      switch (condicion.operator) {
        case '=': return campana === valorTexto;
        case '!=': return campana !== valorTexto;
        case 'contains': return campana.includes(valorTexto);
        default: return false;
      }
    }

    case 'servicio': {
      const servicio = String(lead.customFields?.Servicio || '');
      switch (condicion.operator) {
        case '=': return servicio === valorTexto;
        case '!=': return servicio !== valorTexto;
        case 'contains': return servicio.includes(valorTexto);
        default: return false;
      }
    }

    case 'origen': {
      const origen = String(lead.customFields?.Origen || lead.canal || '');
      switch (condicion.operator) {
        case '=': return origen === valorTexto;
        case '!=': return origen !== valorTexto;
        case 'contains': return origen.includes(valorTexto);
        default: return false;
      }
    }

    case 'intentos': {
      const intentos = Number(lead.customFields?.Intentos ?? Math.floor(Math.random() * 6));
      switch (condicion.operator) {
        case '>': return intentos > valorNumero;
        case '<': return intentos < valorNumero;
        case '>=': return intentos >= valorNumero;
        case '<=': return intentos <= valorNumero;
        case '=': return intentos === valorNumero;
        default: return false;
      }
    }

    case 'dias-sin-respuesta': {
      switch (condicion.operator) {
        case '>': return diasSinRespuesta > valorNumero;
        case '<': return diasSinRespuesta < valorNumero;
        case '>=': return diasSinRespuesta >= valorNumero;
        case '<=': return diasSinRespuesta <= valorNumero;
        case '=': return diasSinRespuesta === valorNumero;
        default: return false;
      }
    }

    case 'ventana-mensajeria': {
      if (!esRedSocial) return true;
      switch (condicion.operator) {
        case '>': return diasSinRespuesta > valorNumero;
        case '<': return diasSinRespuesta < valorNumero;
        case '>=': return diasSinRespuesta >= valorNumero;
        case '<=': return diasSinRespuesta <= valorNumero;
        case '=': return diasSinRespuesta === valorNumero;
        default: return diasSinRespuesta <= valorNumero;
      }
    }

    case 'contenido': {
      const texto = `${lead.notas || ''} ${lead.etiquetas?.join(' ') || ''}`.toLowerCase();
      const target = valorTexto.toLowerCase();
      switch (condicion.operator) {
        case 'contains': return texto.includes(target);
        case 'not-contains': return !texto.includes(target);
        default: return false;
      }
    }

    default:
      return false;
  }
}

function obtenerRolActual(): RoleOption {
  if (typeof window === 'undefined') return 'Admin';
  return (
    (localStorage.getItem('rolActual') as RoleOption) ||
    (localStorage.getItem('user_rol') as RoleOption) ||
    'Admin'
  );
}

function estaPermitidaParaRol(regla: AutomationRule): boolean {
  if (!regla.rolesPermitidos || regla.rolesPermitidos.length === 0) return true;
  const rolActual = obtenerRolActual();
  return regla.rolesPermitidos.includes(rolActual);
}

function isMessagingBlocked(lead: Lead): boolean {
  const bloqueado = Boolean(lead.customFields?.MensajeriaBloqueada);
  const diasSinRespuesta = obtenerDiasSinRespuesta(lead);
  const esRedSocial = lead.canal === 'facebook' || lead.canal === 'instagram';
  return bloqueado || (esRedSocial && diasSinRespuesta > 7);
}

/**
 * Ejecutar acciones de una regla sobre un lead
 */
export async function ejecutarAcciones(
  lead: Lead,
  regla: AutomationRule
): Promise<{ exitoso: boolean; detalles: string[] }> {
  const detalles: string[] = [];
  const seleccionarMensajeAB = () => {
    if (!regla.abTest?.enabled) return regla.abTest?.variantA || '';
    const ratio = Math.max(0, Math.min(100, regla.abTest.ratio));
    const pick = Math.random() * 100 < ratio ? 'A' : 'B';
    return pick === 'A' ? regla.abTest.variantA : regla.abTest.variantB;
  };
  
  for (const accion of regla.acciones) {
    try {
      switch (accion.type) {
        case 'move-status':
          lead.status = accion.value as LeadStatus;
          detalles.push(`Mover a estado: ${accion.value}`);
          break;

        case 'assign-vendedor':
          lead.asignadoA = String(accion.value);
          detalles.push(`Asignar a vendedor: ${accion.value}`);
          break;

        case 'add-etiqueta':
          if (!lead.etiquetas.includes(accion.value as string)) {
            lead.etiquetas.push(accion.value as string);
          }
          detalles.push(`Etiqueta agregada: ${accion.value}`);
          break;

        case 'remove-etiqueta':
          lead.etiquetas = lead.etiquetas.filter(e => e !== accion.value);
          detalles.push(`Etiqueta removida: ${accion.value}`);
          break;

        case 'send-notification':
          if (isMessagingBlocked(lead)) {
            throw new Error('Mensajería bloqueada por política 7 días');
          }
          if (regla.abTest?.enabled) {
            const mensaje = seleccionarMensajeAB();
            detalles.push(`Notificación enviada (A/B): ${mensaje || accion.description}`);
          } else {
            detalles.push(`Notificación enviada: ${accion.description}`);
          }
          break;
        case 'create-task':
          lead.customFields = {
            ...(lead.customFields || {}),
            UltimaTarea: String(accion.value),
          };
          detalles.push(`Tarea creada: ${accion.value}`);
          break;
        case 'notify-supervisor':
          lead.customFields = {
            ...(lead.customFields || {}),
            NotificacionSupervisor: String(accion.value),
          };
          detalles.push(`Supervisor notificado: ${accion.value}`);
          break;
        case 'block-conversation':
          lead.customFields = {
            ...(lead.customFields || {}),
            MensajeriaBloqueada: true,
          };
          if (!lead.etiquetas.includes('Bloqueado')) {
            lead.etiquetas.push('Bloqueado');
          }
          detalles.push(`Conversación bloqueada: ${accion.description || accion.value}`);
          break;
        case 'integration':
          lead.customFields = {
            ...(lead.customFields || {}),
            Integracion: String(accion.value),
          };
          detalles.push(`Integración ejecutada: ${accion.value}`);
          break;
        case 'cita-confirmar': {
          const citaId = String(lead.customFields?.CitaId || '');
          if (!citaId) throw new Error('CitaId no disponible');
          const cita = await api.get(`/citas/${citaId}`);
          const estado = cita.data?.cita?.estado;
          if (estado === 'Cancelada' || estado === 'No_Asistio') {
            throw new Error('Cita no confirmable por estado');
          }
          await api.put(`/citas/${citaId}`, { estado: 'Confirmada' });
          detalles.push(`Cita confirmada: ${citaId}`);
          break;
        }
        case 'cita-llegada': {
          const citaId = String(lead.customFields?.CitaId || '');
          if (!citaId) throw new Error('CitaId no disponible');
          const cita = await api.get(`/citas/${citaId}`);
          const estado = cita.data?.cita?.estado;
          if (estado && !['Agendada', 'Confirmada'].includes(estado)) {
            throw new Error('Cita no permite llegada en estado actual');
          }
          await api.put(`/citas/${citaId}/llegada`, {});
          detalles.push(`Llegada registrada: ${citaId}`);
          break;
        }
        case 'cita-reagendar': {
          const citaId = String(lead.customFields?.CitaId || '');
          const nuevaFecha = String(lead.customFields?.NuevaFecha || '');
          const nuevaHora = String(lead.customFields?.NuevaHora || '');
          if (!citaId || !nuevaFecha || !nuevaHora) {
            throw new Error('Datos de reagendación incompletos');
          }
          await api.get(`/citas/${citaId}/validar-reagendacion`);
          await api.put(`/citas/${citaId}/reagendar`, {
            nuevaFecha,
            nuevaHora,
            motivo: 'Automatización',
            precioRegular: true,
          });
          detalles.push(`Cita reagendada: ${citaId}`);
          break;
        }
      }
    } catch (error) {
      detalles.push(`Error en acción ${accion.type}: ${String(error)}`);
      return { exitoso: false, detalles };
    }
  }

  return { exitoso: true, detalles };
}

/**
 * Ejecutar todas las reglas activas contra un lead
 */
export async function ejecutarAutomatizaciones(lead: Lead): Promise<AutomationLog[]> {
  const logsGenerados: AutomationLog[] = [];
  const prioridadRank = { alta: 3, media: 2, baja: 1 };
  const reglasActivas = automationRules
    .filter((r) => r.activa)
    .sort((a, b) => {
      const pa = prioridadRank[a.prioridad || 'media'] || 2;
      const pb = prioridadRank[b.prioridad || 'media'] || 2;
      if (pa !== pb) return pb - pa;
      return (a.orden || 0) - (b.orden || 0);
    });

  for (const regla of reglasActivas) {
    if (evaluarCondiciones(lead, regla)) {
      const resultado = await ejecutarAcciones(lead, regla);
      
      const log: AutomationLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        ruleId: regla.id,
        ruleName: regla.nombre,
        leadId: lead.id,
        leadNombre: lead.nombre,
        accion: regla.acciones.map(a => a.description || a.type).join(', '),
        resultado: resultado.exitoso ? 'exitosa' : 'fallida',
        mensaje: resultado.detalles.join(' | '),
        fecha: new Date(),
        detalles: {
          condiciones: regla.condiciones,
          acciones: regla.acciones
        }
      };

      automationLogs.push(log);
      logsGenerados.push(log);
    }
  }

  return logsGenerados;
}

function hydrateLeadDates(raw: Lead): Lead {
  return {
    ...raw,
    fechaCreacion: new Date(raw.fechaCreacion),
    fechaActualizacion: new Date(raw.fechaActualizacion),
    fechaUltimoContacto: raw.fechaUltimoContacto ? new Date(raw.fechaUltimoContacto) : undefined,
    fechaUltimoEstado: raw.fechaUltimoEstado ? new Date(raw.fechaUltimoEstado) : undefined,
  };
}

function obtenerLeadsLocales(): Array<{ key: string; leads: Lead[] }> {
  if (typeof window === 'undefined') return [];
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(CRM_STORAGE_PREFIX));
  return keys.map((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { key, leads: [] };
      const parsed = JSON.parse(raw) as Lead[];
      return { key, leads: parsed.map(hydrateLeadDates) };
    } catch {
      return { key, leads: [] };
    }
  });
}

function guardarLeadsLocales(data: Array<{ key: string; leads: Lead[] }>): void {
  if (typeof window === 'undefined') return;
  data.forEach(({ key, leads }) => {
    localStorage.setItem(key, JSON.stringify(leads));
  });
}

/**
 * Obtener logs de automatización con filtros
 */
export async function obtenerLogs(opciones?: {
  ruleId?: string;
  leadId?: string;
  resultado?: 'exitosa' | 'fallida' | 'parcial';
  dias?: number;
  limite?: number;
}): Promise<AutomationLog[]> {
  const apiResp = await intentarApi(() =>
    api.get('/automatizaciones/logs', {
      params: {
        ruleId: opciones?.ruleId,
        limit: opciones?.limite,
      },
    }).then((r) => r.data.logs as AutomationLog[])
  );
  if (apiResp) {
    let logs = apiResp.map((log) => ({ ...log, fecha: new Date(log.fecha) }));
    if (opciones?.resultado) {
      logs = logs.filter((l) => l.resultado === opciones.resultado);
    }
    if (opciones?.dias) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - opciones.dias);
      logs = logs.filter((l) => l.fecha >= fechaLimite);
    }
    return logs;
  }
  throw new Error('No se pudo obtener logs desde backend.');
}

export async function ejecutarMotorAutomatizaciones(): Promise<AutomationLog[]> {
  const apiResp = await intentarApi(() =>
    api.post('/automatizaciones/ejecutar').then((r) => r.data.logs as AutomationLog[])
  );
  if (apiResp) {
    return apiResp.map((log) => ({ ...log, fecha: new Date(log.fecha) }));
  }
  throw new Error('No se pudo ejecutar el motor en backend.');
}

/**
 * Limpiar logs antiguos (> 30 días)
 */
export function limpiarLogsAntiguos(dias: number = 30): number {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - dias);
  const cantidadAntes = automationLogs.length;
  automationLogs = automationLogs.filter(l => l.fecha >= fechaLimite);
  return cantidadAntes - automationLogs.length;
}

/**
 * Obtener estadísticas de automatización
 */
export function obtenerEstadisticas() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const logsHoy = automationLogs.filter(l => {
    const fecha = new Date(l.fecha);
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime() === hoy.getTime();
  });

  const exitosos = logsHoy.filter(l => l.resultado === 'exitosa').length;
  const total = logsHoy.length;

  return {
    totalRules: automationRules.length,
    activeRules: automationRules.filter(r => r.activa).length,
    executionsToday: total,
    successRate: total > 0 ? (exitosos / total) * 100 : 0,
    lastExecutionTime: logsHoy.length > 0 ? logsHoy[0].fecha : undefined
  };
}

export function obtenerAlertasRiesgo() {
  const totalLogs = automationLogs.length;
  const fallidas = automationLogs.filter(l => l.resultado === 'fallida').length;
  const tasaFallo = totalLogs > 0 ? Math.round((fallidas / totalLogs) * 100) : 0;
  const noShowLogs = automationLogs.filter(l => l.mensaje?.toLowerCase().includes('no show')).length;
  return {
    tasaFallo,
    noShowLogs,
    mensajesBloqueados: automationLogs.filter(l => l.accion.toLowerCase().includes('bloquear')).length
  };
}

export function obtenerImpactoRegla(reglaId: string) {
  const logsRegla = automationLogs.filter((log) => log.ruleId === reglaId);
  const exitosas = logsRegla.filter((log) => log.resultado === 'exitosa').length;
  const fallidas = logsRegla.filter((log) => log.resultado === 'fallida').length;
  const parciales = logsRegla.filter((log) => log.resultado === 'parcial').length;
  const score = Math.max(0, Math.min(100, exitosas * 5 - fallidas * 3 + parciales * 2));
  const roiEstimado = Math.max(0, Math.round(score / 10));
  return {
    score,
    roiEstimado,
    total: logsRegla.length,
  };
}

export function simularRegla(reglaId: string): { afectados: number; resumen: string; leads: Lead[] } {
  const regla = automationRules.find(r => r.id === reglaId);
  const embudos = obtenerLeadsLocales();
  const leads = embudos.flatMap((item) => item.leads);
  const afectados = regla ? leads.filter((lead) => evaluarCondiciones(lead, regla)).slice(0, 50) : [];
  const total = afectados.length;
  return {
    afectados: total,
    resumen: regla ? `Simulación: ${total} leads cumplen condiciones de "${regla.nombre}".` : 'Regla no encontrada.',
    leads: afectados,
  };
}

/**
 * Reordenar reglas (drag & drop)
 */
export function reordenarReglas(ruleIds: string[]): boolean {
  try {
    const nuevoOrden: Record<string, number> = {};
    ruleIds.forEach((id, index) => {
      nuevoOrden[id] = index + 1;
    });

    automationRules.forEach(rule => {
      if (nuevoOrden[rule.id]) {
        rule.orden = nuevoOrden[rule.id];
      }
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Obtener opciones para condiciones
 */
export function obtenerOpcionesCondiciones() {
  return {
    tipos: [
      { value: 'time-in-status', label: 'Tiempo en estado' },
      { value: 'valor-leads', label: 'Valor del lead' },
      { value: 'canal', label: 'Canal (WhatsApp, Facebook, Instagram)' },
      { value: 'etiqueta', label: 'Etiqueta' },
      { value: 'estado', label: 'Estado del lead' },
      { value: 'sucursal', label: 'Sucursal' },
      { value: 'campana', label: 'Campaña' },
      { value: 'servicio', label: 'Servicio' },
      { value: 'origen', label: 'Origen' },
      { value: 'intentos', label: 'Número de intentos' },
      { value: 'dias-sin-respuesta', label: 'Días sin respuesta' },
      { value: 'ventana-mensajeria', label: 'Ventana mensajería (días)' },
      { value: 'contenido', label: 'Contenido/Palabra clave' }
    ],
    operadores: {
      'time-in-status': [
        { value: '>', label: 'Mayor que' },
        { value: '<', label: 'Menor que' },
        { value: '>=', label: 'Mayor o igual que' },
        { value: '<=', label: 'Menor o igual que' },
        { value: '=', label: 'Igual a' }
      ],
      'valor-leads': [
        { value: '>', label: 'Mayor que' },
        { value: '<', label: 'Menor que' },
        { value: '>=', label: 'Mayor o igual que' },
        { value: '<=', label: 'Menor o igual que' },
        { value: '=', label: 'Igual a' }
      ],
      'canal': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' },
        { value: 'in', label: 'Está en' },
        { value: 'not-in', label: 'No está en' }
      ],
      'etiqueta': [
        { value: 'contains', label: 'Contiene' },
        { value: 'not-contains', label: 'No contiene' }
      ],
      'estado': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' }
      ],
      'sucursal': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' },
        { value: 'contains', label: 'Contiene' }
      ],
      'campana': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' },
        { value: 'contains', label: 'Contiene' }
      ],
      'servicio': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' },
        { value: 'contains', label: 'Contiene' }
      ],
      'origen': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' },
        { value: 'contains', label: 'Contiene' }
      ],
      'intentos': [
        { value: '>', label: 'Mayor que' },
        { value: '<', label: 'Menor que' },
        { value: '>=', label: 'Mayor o igual que' },
        { value: '<=', label: 'Menor o igual que' },
        { value: '=', label: 'Igual a' }
      ],
      'dias-sin-respuesta': [
        { value: '>', label: 'Mayor que' },
        { value: '<', label: 'Menor que' },
        { value: '>=', label: 'Mayor o igual que' },
        { value: '<=', label: 'Menor o igual que' },
        { value: '=', label: 'Igual a' }
      ],
      'ventana-mensajeria': [
        { value: '<=', label: 'Menor o igual que' },
        { value: '>=', label: 'Mayor o igual que' }
      ],
      'contenido': [
        { value: 'contains', label: 'Contiene' },
        { value: 'not-contains', label: 'No contiene' }
      ]
    },
    canales: ['whatsapp', 'facebook', 'instagram', 'email', 'redes-sociales'],
    estados: ['new', 'reviewing', 'rejected', 'qualified', 'open', 'in-progress', 'open-deal'],
    sucursales: SUCURSALES,
    campanas: CAMPANAS_BASE,
    servicios: SERVICIOS_BASE,
    origenes: ORIGENES_BASE
  };
}

/**
 * Obtener opciones para acciones
 */
export function obtenerOpcionesAcciones() {
  return {
    tipos: [
      { value: 'move-status', label: 'Mover a estado' },
      { value: 'assign-vendedor', label: 'Asignar vendedor' },
      { value: 'add-etiqueta', label: 'Agregar etiqueta' },
      { value: 'remove-etiqueta', label: 'Remover etiqueta' },
      { value: 'send-notification', label: 'Enviar notificación' },
      { value: 'create-task', label: 'Crear tarea' },
      { value: 'notify-supervisor', label: 'Notificar supervisor' },
      { value: 'block-conversation', label: 'Bloquear conversación' },
      { value: 'integration', label: 'Enviar a integración' },
      { value: 'cita-confirmar', label: 'Confirmar cita' },
      { value: 'cita-reagendar', label: 'Reagendar cita' },
      { value: 'cita-llegada', label: 'Marcar llegada' }
    ]
  };
}

// Exportar tipos para uso en componentes
export type { AutomationRule, AutomationLog };
