import { Lead } from '@/types/matrix';

export interface VendedorAsignado {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

export interface TareaLead {
  id: string;
  titulo: string;
  descripcion: string;
  fechaVencimiento: Date;
  prioridad: 'alta' | 'media' | 'baja';
  leadId: string;
  asignadoA: string;
}

export interface WhatsAppTemplateResult {
  enviado: boolean;
  template: string;
  telefono: string;
}

export interface EmailSequenceResult {
  id: string;
  nombre: string;
  agregado: boolean;
}

export interface WorkflowQualifiedResult {
  vendedor: VendedorAsignado;
  tarea: TareaLead;
  whatsapp: WhatsAppTemplateResult;
  emailSequence: EmailSequenceResult;
}

const VENDEDORES: VendedorAsignado[] = [
  {
    id: 'vend-01',
    nombre: 'Lucía Paredes',
    email: 'lucia.paredes@rca.com',
    telefono: '+52 55 1111 2222',
  },
  {
    id: 'vend-02',
    nombre: 'Marco Ruiz',
    email: 'marco.ruiz@rca.com',
    telefono: '+52 55 3333 4444',
  },
  {
    id: 'vend-03',
    nombre: 'Sofía Díaz',
    email: 'sofia.diaz@rca.com',
    telefono: '+52 55 5555 6666',
  },
];

const RR_STORAGE_KEY = 'matrix_rr_vendedor_index';
let rrIndex = 0;

function getNextRoundRobinIndex(): number {
  if (typeof window === 'undefined') {
    const idx = rrIndex % VENDEDORES.length;
    rrIndex = idx + 1;
    return idx;
  }

  const stored = window.localStorage.getItem(RR_STORAGE_KEY);
  const currentIndex = stored ? Number(stored) : 0;
  const normalized = Number.isFinite(currentIndex) ? currentIndex : 0;
  const idx = normalized % VENDEDORES.length;
  const nextIndex = (idx + 1) % VENDEDORES.length;
  window.localStorage.setItem(RR_STORAGE_KEY, String(nextIndex));
  return idx;
}

function asignarVendedorRoundRobin(): VendedorAsignado {
  const idx = getNextRoundRobinIndex();
  return VENDEDORES[idx];
}

function crearTareaLlamadaEn2Horas(lead: Lead, vendedor: VendedorAsignado): TareaLead {
  const fechaVencimiento = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return {
    id: `task-${lead.id}-${Date.now()}`,
    titulo: 'Llamar en 2h',
    descripcion: `Llamar a ${lead.nombre} para avanzar el proceso. Lead calificado automáticamente.`,
    fechaVencimiento,
    prioridad: 'alta',
    leadId: lead.id,
    asignadoA: vendedor.id,
  };
}

async function enviarTemplateWhatsApp(lead: Lead, vendedor: VendedorAsignado): Promise<WhatsAppTemplateResult> {
  const template = 'lead_qualified_v1';
  const telefono = lead.telefono || '';

  if (!telefono) {
    return { enviado: false, template, telefono };
  }

  const mensaje = `Hola ${lead.nombre}, soy ${vendedor.nombre} del equipo RCA.\n\n` +
    '¡Gracias por tu interés! Te escribo para ayudarte a agendar tu consulta.';

  console.log('📲 [SIMULADO] WhatsApp template:', {
    template,
    to: telefono,
    message: mensaje,
  });

  return { enviado: true, template, telefono };
}

async function agregarASecuenciaEmail(lead: Lead): Promise<EmailSequenceResult> {
  const sequenceId = 'seq-qualified-welcome';
  const nombre = 'Bienvenida - Lead Calificado';

  console.log('📧 [SIMULADO] Agregar a secuencia:', {
    leadId: lead.id,
    email: lead.email,
    sequenceId,
    nombre,
  });

  return { id: sequenceId, nombre, agregado: Boolean(lead.email) };
}

export async function ejecutarWorkflowQualified(lead: Lead): Promise<WorkflowQualifiedResult> {
  const vendedor = asignarVendedorRoundRobin();

  const [tarea, whatsapp, emailSequence] = await Promise.all([
    Promise.resolve(crearTareaLlamadaEn2Horas(lead, vendedor)),
    enviarTemplateWhatsApp(lead, vendedor),
    agregarASecuenciaEmail(lead),
  ]);

  console.log('✅ Workflow Qualified ejecutado:', {
    leadId: lead.id,
    vendedor: vendedor.nombre,
    tarea: tarea.id,
    whatsapp: whatsapp.enviado,
    emailSequence: emailSequence.agregado,
  });

  return {
    vendedor,
    tarea,
    whatsapp,
    emailSequence,
  };
}