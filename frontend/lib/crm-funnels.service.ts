import { Lead, LeadStatus, CanalType, KanbanColumnConfig } from '@/types/matrix';
import { obtenerConversacionesSimuladas, generarLeadsDesdeConversaciones } from '@/lib/matrix.service';
import { getServiciosPorSucursal } from '@/lib/doctores-data';
import { api } from '@/lib/api';

export type CrmFunnelType = 'sucursal' | 'contact-center';

export interface CrmFunnelStage {
  id: LeadStatus;
  nombre: string;
  objetivo: string;
  slaHoras: number;
}

export interface CrmFunnelConfig {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: CrmFunnelType;
  sucursal?: string;
  metaMensual: number;
  tasaObjetivo: number;
  slaHoras: number;
  canales: CanalType[];
  etapas: CrmFunnelStage[];
  theme: {
    accent: string;
    softBg: string;
    border: string;
    text: string;
    badge: string;
  };
}

const ETAPAS_BASE: CrmFunnelStage[] = [
  { id: 'new', nombre: 'Lead', objetivo: 'Contacto inicial', slaHoras: 2 },
  { id: 'reviewing', nombre: 'Prospecto', objetivo: 'Validar interés real', slaHoras: 6 },
  { id: 'in-progress', nombre: 'Cita pendiente', objetivo: 'Agendar fecha y hora', slaHoras: 12 },
  { id: 'open', nombre: 'Confirmada', objetivo: 'Confirmación y recordatorios', slaHoras: 24 },
  { id: 'qualified', nombre: 'Cierre', objetivo: 'Atendida / No show / Perdido', slaHoras: 24 },
];

export const CRM_COLUMN_CONFIGS: KanbanColumnConfig[] = [
  { id: 'new', titulo: 'Lead', color: 'purple', icono: '🧭', enabled: true },
  { id: 'reviewing', titulo: 'Prospecto', color: 'orange', icono: '🧑‍💼', enabled: true },
  { id: 'in-progress', titulo: 'Cita pendiente', color: 'indigo', icono: '📅', enabled: true },
  { id: 'open', titulo: 'Confirmada', color: 'blue', icono: '✅', enabled: true },
  { id: 'qualified', titulo: 'Cierre', color: 'green', icono: '🏁', enabled: true },
];

const CANALES_BASE: CanalType[] = ['whatsapp', 'instagram', 'facebook', 'email'];

const NOMBRES = [
  'María', 'Pedro', 'Sofía', 'Luis', 'Ana', 'Carlos',
  'Valeria', 'Héctor', 'Paula', 'Ricardo', 'Daniela', 'Jorge',
  'Natalia', 'Alejandro', 'Karla', 'Miguel', 'Ximena', 'Oscar',
  'Lucía', 'David', 'Fernanda', 'Diego', 'Laura', 'Iván',
];

const APELLIDOS = [
  'González', 'Sánchez', 'Martínez', 'López', 'Ramírez', 'Hernández',
  'Torres', 'García', 'Navarro', 'Morales', 'Vargas', 'Díaz',
];

const SERVICIOS_BASE = [
  'Consulta Medicina General',
  'Consulta Odontológica',
  'Consulta Oftalmológica',
  'Consulta Nutricional',
  'Sesión de Psicología',
];

const CAMPANAS = [
  'Promoción Preventiva',
  'Checkup Familiar',
  'Campaña Visión 2026',
  'Plan Salud Integral',
];

const STATUS_CYCLE: LeadStatus[] = ['new', 'reviewing', 'in-progress', 'open', 'qualified'];

const STORAGE_PREFIX = 'crm.kanban.';

const CRM_ACCIONES_POR_STATUS: Record<LeadStatus, { label: string; actionId: 'confirmar' | 'reagendar' | 'llegada' }> = {
  new: { label: 'Confirmar', actionId: 'confirmar' },
  reviewing: { label: 'Confirmar', actionId: 'confirmar' },
  'in-progress': { label: 'Confirmar', actionId: 'confirmar' },
  open: { label: 'Marcar llegada', actionId: 'llegada' },
  qualified: { label: 'Reagendar', actionId: 'reagendar' },
  rejected: { label: 'Reagendar', actionId: 'reagendar' },
  'open-deal': { label: 'Confirmar', actionId: 'confirmar' },
};

function getStorageKey(embudoId: string): string {
  return `${STORAGE_PREFIX}${embudoId}`;
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

function cargarLeadsPersistidos(embudoId: string): Lead[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(embudoId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Lead[];
    return parsed.map(hydrateLeadDates);
  } catch {
    return null;
  }
}

function guardarLeadsPersistidos(embudoId: string, leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(embudoId), JSON.stringify(leads));
}

export async function persistirMovimientoLead(
  embudoId: string,
  leadId: string,
  nuevoStatus: LeadStatus,
  extraCustomFields?: Record<string, string | number | boolean>
): Promise<Lead | null> {
  const current = cargarLeadsPersistidos(embudoId);
  const localUpdated = current
    ? current.map((lead) =>
        lead.id === leadId
          ? (() => {
              const leadActualizado = { ...lead, status: nuevoStatus };
              const accion = obtenerAccionPrimariaLead(leadActualizado);
              const customFields = {
                ...(lead.customFields || {}),
                CRM_Estado: CRM_LABELS_BY_STATUS[nuevoStatus],
                ...(accion ? { CRM_Accion: accion.actionId } : {}),
                ...(extraCustomFields || {}),
              } as Record<string, string | number | boolean>;

              if (nuevoStatus !== 'qualified' && 'CRM_Resultado' in customFields) {
                delete customFields.CRM_Resultado;
              }

              return {
                ...leadActualizado,
                customFields,
                fechaUltimoEstado: new Date(),
                fechaActualizacion: new Date(),
              };
            })()
          : lead
      )
    : null;

  if (localUpdated) {
    guardarLeadsPersistidos(embudoId, localUpdated);
  }

  const resultado = extraCustomFields?.CRM_Resultado as string | undefined;
  try {
    const resp = await api.put(`/crm/leads/${leadId}`, { status: nuevoStatus, resultado });
    const updatedLead = resp.data?.lead as Lead | undefined;
    if (updatedLead) {
      return hydrateLeadDates(updatedLead);
    }
  } catch {
    // Fallback a almacenamiento local si el backend no está disponible
  }

  return localUpdated?.find((lead) => lead.id === leadId) ?? null;
}

export function obtenerAccionPrimariaLead(lead: Lead): { label: string; actionId: 'confirmar' | 'reagendar' | 'llegada' } | null {
  return CRM_ACCIONES_POR_STATUS[lead.status] ?? null;
}

const telefonoBase = (index: number) => `+52 33 10${(index + 10).toString().padStart(2, '0')}-22${(index + 20).toString().padStart(2, '0')}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const CRM_LABELS_BY_STATUS: Record<LeadStatus, string> = {
  new: 'Lead',
  reviewing: 'Prospecto',
  'in-progress': 'Cita pendiente',
  open: 'Confirmada',
  qualified: 'Cierre',
  rejected: 'Perdido',
  'open-deal': 'Cierre',
};

const CRM_RESULTADOS = ['Atendida', 'No show', 'Perdido'];

export function mapCitaEstadoToCrmStatus(estadoCita: string): { status: LeadStatus; resultado?: string } {
  const normalizado = estadoCita.trim();
  if (['Agendada', 'Pendiente_Confirmacion', 'Reagendada'].includes(normalizado)) {
    return { status: 'in-progress' };
  }
  if (['Confirmada', 'Llegó'].includes(normalizado)) {
    return { status: 'open' };
  }
  if (['En_Atencion', 'Finalizada', 'Atendida'].includes(normalizado)) {
    return { status: 'qualified', resultado: 'Atendida' };
  }
  if (['No_Asistio', 'Inasistencia'].includes(normalizado)) {
    return { status: 'qualified', resultado: 'No show' };
  }
  if (['Cancelada', 'Perdido'].includes(normalizado)) {
    return { status: 'qualified', resultado: 'Perdido' };
  }
  return { status: 'reviewing' };
}

function aplicarCamposCrm(lead: Lead, resultado?: string): Lead {
  const estadoCita =
    typeof lead.customFields?.EstadoCita === 'string' ? lead.customFields?.EstadoCita : undefined;
  const mapped = estadoCita ? mapCitaEstadoToCrmStatus(estadoCita) : null;
  const finalStatus = mapped?.status ?? lead.status;
  const finalResultado = resultado ?? mapped?.resultado;
  const accion = obtenerAccionPrimariaLead({ ...lead, status: finalStatus });
  return {
    ...lead,
    status: finalStatus,
    customFields: {
      ...(lead.customFields || {}),
      CRM_Estado: CRM_LABELS_BY_STATUS[finalStatus],
      ...(finalResultado ? { CRM_Resultado: finalResultado } : {}),
      ...(accion ? { CRM_Accion: accion.actionId } : {}),
    },
  };
}

export function crearEmbudoConfigs(sucursales: string[]): CrmFunnelConfig[] {
  const obtenerTheme = (sucursal?: string) => {
    const key = (sucursal || 'contact-center').toLowerCase();
    if (key.includes('guadalajara')) {
      return {
        accent: 'text-emerald-600',
        softBg: 'from-emerald-50 to-white',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700',
      };
    }
    if (key.includes('juárez') || key.includes('juarez')) {
      return {
        accent: 'text-blue-600',
        softBg: 'from-blue-50 to-white',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
      };
    }
    if (key.includes('obregón') || key.includes('obregon')) {
      return {
        accent: 'text-purple-600',
        softBg: 'from-purple-50 to-white',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-700',
      };
    }
    if (key.includes('loreto')) {
      return {
        accent: 'text-amber-600',
        softBg: 'from-amber-50 to-white',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700',
      };
    }
    if (key.includes('virtual')) {
      return {
        accent: 'text-cyan-600',
        softBg: 'from-cyan-50 to-white',
        border: 'border-cyan-200',
        text: 'text-cyan-700',
        badge: 'bg-cyan-100 text-cyan-700',
      };
    }
    if (key.includes('trinidad')) {
      return {
        accent: 'text-orange-600',
        softBg: 'from-orange-50 to-white',
        border: 'border-orange-200',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700',
      };
    }
    if (key.includes('contact-center')) {
      return {
        accent: 'text-indigo-600',
        softBg: 'from-indigo-50 to-white',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        badge: 'bg-indigo-100 text-indigo-700',
      };
    }
    return {
      accent: 'text-slate-600',
      softBg: 'from-slate-50 to-white',
      border: 'border-slate-200',
      text: 'text-slate-700',
      badge: 'bg-slate-100 text-slate-700',
    };
  };

  const embudoContactCenter: CrmFunnelConfig = {
    id: 'contact-center',
    nombre: 'Contact Center',
    descripcion: 'Embudo omnicanal Keila IA con leads de mensajería',
    tipo: 'contact-center',
    metaMensual: 320,
    tasaObjetivo: 18,
    slaHoras: 2,
    canales: CANALES_BASE,
    etapas: ETAPAS_BASE,
    theme: obtenerTheme('contact-center'),
  };

  const embudosSucursal = sucursales.map((sucursal, index) => ({
    id: `sucursal:${slugify(sucursal)}`,
    nombre: `Sucursal ${sucursal}`,
    descripcion: `Embudo local para ${sucursal} con foco en conversión a cita`,
    tipo: 'sucursal' as const,
    sucursal,
    metaMensual: 90 + (index % 4) * 15,
    tasaObjetivo: 20 + (index % 3) * 3,
    slaHoras: 6,
    canales: CANALES_BASE,
    etapas: ETAPAS_BASE,
    theme: obtenerTheme(sucursal),
  }));

  return [embudoContactCenter, ...embudosSucursal];
}

export async function obtenerLeadsParaEmbudo(embudo: CrmFunnelConfig): Promise<Lead[]> {
  const apiResp = await (async () => {
    try {
      const response = await api.get('/crm/leads', {
        params: embudo.sucursal ? { sucursal: embudo.sucursal } : undefined,
      });
      return response.data.leads as Lead[];
    } catch {
      return null;
    }
  })();

  if (apiResp && apiResp.length > 0) {
    return apiResp.map((lead) => ({
      ...lead,
      fechaCreacion: new Date(lead.fechaCreacion),
      fechaActualizacion: new Date(lead.fechaActualizacion),
      fechaUltimoContacto: lead.fechaUltimoContacto ? new Date(lead.fechaUltimoContacto) : undefined,
      fechaUltimoEstado: lead.fechaUltimoEstado ? new Date(lead.fechaUltimoEstado) : undefined,
    }));
  }

  const persistidos = cargarLeadsPersistidos(embudo.id);
  if (persistidos) return persistidos;

  if (embudo.tipo === 'contact-center') {
    const conversaciones = await obtenerConversacionesSimuladas();
    const leads = generarLeadsDesdeConversaciones(conversaciones);
    const normalizados = leads.map((lead, index) => {
      const status = STATUS_CYCLE[index % STATUS_CYCLE.length];
      return aplicarCamposCrm({
        ...lead,
        status,
        etiquetas: Array.from(new Set([...(lead.etiquetas || []), 'Contact Center'])),
        customFields: {
          ...(lead.customFields || {}),
          Sucursal: 'Contact Center',
          Campana: 'Keila IA',
        },
      });
    });
    guardarLeadsPersistidos(embudo.id, normalizados);
    return normalizados;
  }

  const generados = generarLeadsSucursal(embudo.sucursal || 'General', 28);
  guardarLeadsPersistidos(embudo.id, generados);
  return generados;
}

export function generarLeadsSucursal(sucursal: string, total: number): Lead[] {
  const baseValue = 1800 + (sucursal.length % 5) * 250;
  const slug = slugify(sucursal);
  const serviciosSucursal = getServiciosPorSucursal(sucursal);

  return Array.from({ length: total }).map((_, index) => {
    const nombre = NOMBRES[index % NOMBRES.length];
    const apellido = APELLIDOS[index % APELLIDOS.length];
    const servicio = serviciosSucursal[index % serviciosSucursal.length] || SERVICIOS_BASE[index % SERVICIOS_BASE.length];
    const campana = CAMPANAS[index % CAMPANAS.length];
    const status = STATUS_CYCLE[index % STATUS_CYCLE.length];
    const canal = CANALES_BASE[index % CANALES_BASE.length];
    const createdAt = new Date(Date.now() - index * 1000 * 60 * 60 * 4);
    const resultado = status === 'qualified' ? CRM_RESULTADOS[index % CRM_RESULTADOS.length] : undefined;

    const leadBase: Lead = {
      id: `crm-${slug}-${index + 1}`,
      nombre: `${nombre} ${apellido}`,
      email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@demo.com`,
      telefono: telefonoBase(index),
      fechaCreacion: createdAt,
      fechaActualizacion: new Date(createdAt.getTime() + 1000 * 60 * 30),
      fechaUltimoContacto: new Date(createdAt.getTime() + 1000 * 60 * 45),
      status,
      canal,
      valorEstimado: baseValue + (index % 6) * 180,
      notas: `Interés en ${servicio} · ${campana}`,
      etiquetas: [servicio, 'Sucursal', sucursal, resultado ? resultado : 'Seguimiento'],
      customFields: {
        Sucursal: sucursal,
        Servicio: servicio,
        Campana: campana,
      },
      asignadoA: index % 3 === 0 ? 'Coordinación CRM' : undefined,
      estadoVendedor: index % 2 === 0 ? 'escribiendo' : 'en-llamada',
    };
    return aplicarCamposCrm(leadBase, resultado);
  });
}

export function paginarLeads(
  leads: Lead[],
  status: LeadStatus,
  page: number,
  limit: number
): { leads: Lead[]; total: number; hasMore: boolean } {
  const filtrados = leads.filter((lead) => lead.status === status);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    leads: filtrados.slice(startIndex, endIndex),
    total: filtrados.length,
    hasMore: endIndex < filtrados.length,
  };
}
