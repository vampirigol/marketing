/**
 * Servicio de Reglas de Automatización (IF-THEN)
 * Maneja la creación, ejecución y logging de automatizaciones
 */

import { Lead, AutomationRule, AutomationLog, AutomationCondition } from '@/types/matrix';

/**
 * Repositorio en memoria para reglas (simulado)
 * En producción, usar BD real
 */
const automationRules: AutomationRule[] = [
  {
    id: '1',
    nombre: 'Revisar después de 48h',
    descripcion: 'Si lead en "Reviewing" > 48h → Mover a "Pendiente"',
    activa: true,
    condiciones: [
      {
        id: '1-1',
        type: 'time-in-status',
        operator: '>',
        value: 48,
        label: 'Más de 48 horas'
      }
    ],
    acciones: [
      {
        id: '1-a1',
        type: 'move-status',
        value: 'open',
        description: 'Mover a Abiertos'
      },
      {
        id: '1-a2',
        type: 'send-notification',
        value: 'Lead requiere atención después de 48h',
        description: 'Notificar al vendedor'
      }
    ],
    fechaCreacion: new Date('2026-01-15'),
    fechaActualizacion: new Date('2026-01-15'),
    orden: 1
  },
  {
    id: '2',
    nombre: 'Leads premium por valor',
    descripcion: 'Si valor > $10,000 → Asignar a vendedor senior',
    activa: true,
    condiciones: [
      {
        id: '2-1',
        type: 'valor-leads',
        operator: '>',
        value: 10000,
        label: 'Valor mayor a $10,000'
      }
    ],
    acciones: [
      {
        id: '2-a1',
        type: 'assign-vendedor',
        value: 'senior',
        description: 'Asignar a equipo senior'
      },
      {
        id: '2-a2',
        type: 'add-etiqueta',
        value: 'Premium',
        description: 'Agregar etiqueta Premium'
      }
    ],
    fechaCreacion: new Date('2026-01-15'),
    fechaActualizacion: new Date('2026-01-15'),
    orden: 2
  },
  {
    id: '3',
    nombre: 'Social Media auto-etiquetado',
    descripcion: 'Si canal = Instagram → Agregar etiqueta "Social Media"',
    activa: true,
    condiciones: [
      {
        id: '3-1',
        type: 'canal',
        operator: '=',
        value: 'instagram',
        label: 'Canal es Instagram'
      }
    ],
    acciones: [
      {
        id: '3-a1',
        type: 'add-etiqueta',
        value: 'Social Media',
        description: 'Etiquetar como Social Media'
      }
    ],
    fechaCreacion: new Date('2026-01-15'),
    fechaActualizacion: new Date('2026-01-15'),
    orden: 3
  }
];

let automationLogs: AutomationLog[] = [];

/**
 * Obtener todas las reglas de automatización
 */
export function obtenerReglas(): AutomationRule[] {
  return [...automationRules].sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

/**
 * Obtener una regla por ID
 */
export function obtenerRegla(id: string): AutomationRule | null {
  return automationRules.find(r => r.id === id) || null;
}

/**
 * Crear nueva regla de automatización
 */
export function crearRegla(regla: Omit<AutomationRule, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): AutomationRule {
  const id = `rule-${Date.now()}`;
  const nuevaRegla: AutomationRule = {
    ...regla,
    id,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    orden: automationRules.length + 1
  };
  automationRules.push(nuevaRegla);
  return nuevaRegla;
}

/**
 * Actualizar regla existente
 */
export function actualizarRegla(id: string, cambios: Partial<Omit<AutomationRule, 'id' | 'fechaCreacion'>>): AutomationRule | null {
  const index = automationRules.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  automationRules[index] = {
    ...automationRules[index],
    ...cambios,
    fechaActualizacion: new Date()
  };
  
  return automationRules[index];
}

/**
 * Eliminar regla
 */
export function eliminarRegla(id: string): boolean {
  const index = automationRules.findIndex(r => r.id === id);
  if (index === -1) return false;
  automationRules.splice(index, 1);
  return true;
}

/**
 * Evaluar si un lead cumple las condiciones de una regla
 */
export function evaluarCondiciones(lead: Lead, condiciones: AutomationCondition[]): boolean {
  // AND entre todas las condiciones
  return condiciones.every(cond => evaluarCondicion(lead, cond));
}

/**
 * Evaluar una condición individual
 */
function evaluarCondicion(lead: Lead, condicion: AutomationCondition): boolean {
  switch (condicion.type) {
    case 'time-in-status': {
      // Simular tiempo en estado (en horas)
      const horasEnEstado = Math.floor(Math.random() * 72); // 0-72 horas
      const valor = condicion.value as number;
      switch (condicion.operator) {
        case '>': return horasEnEstado > valor;
        case '<': return horasEnEstado < valor;
        case '=': return horasEnEstado === valor;
        default: return false;
      }
    }

    case 'valor-leads': {
      const leadValue = lead.valorEstimado || 0;
      const valor = condicion.value as number;
      switch (condicion.operator) {
        case '>': return leadValue > valor;
        case '<': return leadValue < valor;
        case '=': return leadValue === valor;
        default: return false;
      }
    }

    case 'canal': {
      const canalValue = lead.canal;
      const condicionValue = condicion.value as string;
      switch (condicion.operator) {
        case '=': return canalValue === condicionValue;
        case '!=': return canalValue !== condicionValue;
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
      const condicionValue = condicion.value as string;
      switch (condicion.operator) {
        case '=': return statusValue === condicionValue;
        case '!=': return statusValue !== condicionValue;
        default: return false;
      }
    }

    default:
      return false;
  }
}

/**
 * Ejecutar acciones de una regla sobre un lead
 */
export async function ejecutarAcciones(
  lead: Lead,
  regla: AutomationRule
): Promise<{ exitoso: boolean; detalles: string[] }> {
  const detalles: string[] = [];
  
  for (const accion of regla.acciones) {
    try {
      switch (accion.type) {
        case 'move-status':
          detalles.push(`Mover a estado: ${accion.value}`);
          break;

        case 'assign-vendedor':
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
          detalles.push(`Notificación enviada: ${accion.description}`);
          break;
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
  const reglasActivas = automationRules.filter(r => r.activa);

  for (const regla of reglasActivas) {
    if (evaluarCondiciones(lead, regla.condiciones)) {
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

/**
 * Obtener logs de automatización con filtros
 */
export function obtenerLogs(opciones?: {
  ruleId?: string;
  leadId?: string;
  resultado?: 'exitosa' | 'fallida' | 'parcial';
  dias?: number;
  limite?: number;
}): AutomationLog[] {
  let logs = [...automationLogs];

  if (opciones?.ruleId) {
    logs = logs.filter(l => l.ruleId === opciones.ruleId);
  }

  if (opciones?.leadId) {
    logs = logs.filter(l => l.leadId === opciones.leadId);
  }

  if (opciones?.resultado) {
    logs = logs.filter(l => l.resultado === opciones.resultado);
  }

  if (opciones?.dias) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - opciones.dias);
    logs = logs.filter(l => l.fecha >= fechaLimite);
  }

  // Ordenar por fecha descendente
  logs.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  if (opciones?.limite) {
    logs = logs.slice(0, opciones.limite);
  }

  return logs;
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
      { value: 'estado', label: 'Estado del lead' }
    ],
    operadores: {
      'time-in-status': [
        { value: '>', label: 'Mayor que' },
        { value: '<', label: 'Menor que' },
        { value: '=', label: 'Igual a' }
      ],
      'valor-leads': [
        { value: '>', label: 'Mayor que' },
        { value: '<', label: 'Menor que' },
        { value: '=', label: 'Igual a' }
      ],
      'canal': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' }
      ],
      'etiqueta': [
        { value: 'contains', label: 'Contiene' },
        { value: 'not-contains', label: 'No contiene' }
      ],
      'estado': [
        { value: '=', label: 'Es' },
        { value: '!=', label: 'No es' }
      ]
    },
    canales: ['whatsapp', 'facebook', 'instagram'],
    estados: ['new', 'reviewing', 'rejected', 'qualified', 'open', 'in-progress', 'open-deal']
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
      { value: 'send-notification', label: 'Enviar notificación' }
    ]
  };
}

// Exportar tipos para uso en componentes
export type { AutomationRule, AutomationLog };
