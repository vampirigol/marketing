import { Lead, LeadStatus, CanalType } from '@/types/matrix';
import { obtenerConversacionesSimuladas, generarLeadsDesdeConversaciones } from '@/lib/matrix.service';
import { getServiciosPorSucursal } from '@/lib/doctores-data';

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
  { id: 'new', nombre: 'Nuevos', objetivo: 'Primer contacto', slaHoras: 2 },
  { id: 'reviewing', nombre: 'En revisión', objetivo: 'Validar interés', slaHoras: 6 },
  { id: 'in-progress', nombre: 'En proceso', objetivo: 'Cotización activa', slaHoras: 12 },
  { id: 'qualified', nombre: 'Calificados', objetivo: 'Agenda confirmada', slaHoras: 24 },
  { id: 'open', nombre: 'Abiertos', objetivo: 'Seguimiento cercano', slaHoras: 48 },
  { id: 'open-deal', nombre: 'Negociación', objetivo: 'Cierre en curso', slaHoras: 72 },
  { id: 'rejected', nombre: 'Perdidos', objetivo: 'Motivo registrado', slaHoras: 12 },
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

const STATUS_CYCLE: LeadStatus[] = [
  'new',
  'reviewing',
  'in-progress',
  'qualified',
  'open',
  'open-deal',
  'rejected',
];

const telefonoBase = (index: number) => `+52 33 10${(index + 10).toString().padStart(2, '0')}-22${(index + 20).toString().padStart(2, '0')}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

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
  if (embudo.tipo === 'contact-center') {
    const conversaciones = await obtenerConversacionesSimuladas();
    const leads = generarLeadsDesdeConversaciones(conversaciones);
    return leads.map((lead) => ({
      ...lead,
      etiquetas: Array.from(new Set([...(lead.etiquetas || []), 'Contact Center'])),
      customFields: {
        ...(lead.customFields || {}),
        Sucursal: 'Contact Center',
        Campana: 'Keila IA',
      },
    }));
  }

  return generarLeadsSucursal(embudo.sucursal || 'General', 28);
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

    return {
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
      etiquetas: [servicio, 'Sucursal', sucursal, status === 'rejected' ? 'Perdido' : 'Seguimiento'],
      customFields: {
        Sucursal: sucursal,
        Servicio: servicio,
        Campana: campana,
      },
      asignadoA: index % 3 === 0 ? 'Coordinación CRM' : undefined,
      estadoVendedor: index % 2 === 0 ? 'escribiendo' : 'en-llamada',
    };
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
