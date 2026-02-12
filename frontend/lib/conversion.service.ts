/**
 * Servicio para convertir Leads a Pacientes
 * Crea paciente y cita en el backend; la cita aparece en Recepción, embudo CRM y calendario.
 * El backend envía la notificación WhatsApp al crear la cita.
 */

import { Lead } from '@/types/matrix';
import { Paciente, Cita } from '@/types/index';
import { api } from '@/lib/api';
import { pacientesService } from '@/lib/pacientes.service';

export interface ConversionResponse {
  paciente: Paciente;
  cita: Cita;
  whatsappEnviado: boolean;
  tiempoTotal: number;
}

export interface ConversionData {
  leadId: string;
  /** UUID de la sucursal (desde API sucursales) */
  sucursalId: string;
  /** Nombre de la sucursal (para actualizar lead y mostrarlo en embudo de la sucursal) */
  sucursalNombre?: string;
  /** Nombre del doctor (medicoAsignado) */
  medicoAsignado: string;
  /** Fecha de la cita (Date o string YYYY-MM-DD) */
  fechaCita: Date | string;
  /** Hora en formato "HH:mm" */
  horaCita: string;
  /** Especialidad o servicio (ej. Consulta Odontológica) */
  especialidad: string;
  tipoConsulta: string;
  esPromocion?: boolean;
}

const ORIGEN_LEAD_VALIDOS = ['WhatsApp', 'Facebook', 'Instagram', 'Llamada', 'Presencial', 'Referido'] as const;
type OrigenLead = (typeof ORIGEN_LEAD_VALIDOS)[number];

function mapOrigenLead(canal: string | undefined): OrigenLead {
  if (!canal) return 'Presencial';
  const c = String(canal).toLowerCase();
  if (c.includes('whatsapp')) return 'WhatsApp';
  if (c.includes('facebook')) return 'Facebook';
  if (c.includes('instagram')) return 'Instagram';
  if (c.includes('llamada')) return 'Llamada';
  if (c.includes('referido')) return 'Referido';
  return 'Presencial';
}

/**
 * Convertir un Lead a Paciente: crear paciente en backend, crear cita en backend.
 * La cita queda en BD → se muestra en Recepción, embudo de la sucursal y calendario.
 * El backend envía la confirmación por WhatsApp al crear la cita.
 */
export async function convertirLeadAPaciente(
  lead: Lead,
  data: ConversionData
): Promise<ConversionResponse> {
  const tiempoInicio = Date.now();

  const nombreCompleto = (lead.nombre && String(lead.nombre).trim()) || 'Paciente';
  const telefono = (lead.telefono || '').trim() || (lead.customFields?.Telefono as string)?.trim() || '';
  const email = (lead.email || '').trim() || (lead.customFields?.Email as string)?.trim() || '';
  const noAfiliacion =
    (typeof lead.customFields?.NoAfiliacion === 'string' && lead.customFields.NoAfiliacion.trim()) ||
    '';
  const edadNum =
    typeof lead.customFields?.Edad === 'number'
      ? lead.customFields.Edad
      : typeof lead.customFields?.Edad === 'string'
        ? parseInt(String(lead.customFields.Edad), 10) || 0
        : 0;
  const fechaNacimiento =
    edadNum > 0
      ? new Date(new Date().getFullYear() - edadNum, 0, 1)
      : new Date(2000, 0, 1);
  const fechaNacStr = fechaNacimiento.toISOString().slice(0, 10);

  if (!noAfiliacion) {
    throw new Error('El número de afiliación es obligatorio. Genera uno antes de convertir.');
  }
  if (!telefono) {
    throw new Error('El teléfono del paciente es obligatorio.');
  }

  const pacientePayload = {
    nombreCompleto,
    telefono,
    whatsapp: telefono,
    email: email || undefined,
    fechaNacimiento: fechaNacStr,
    edad: edadNum || 0,
    sexo: 'M' as const,
    noAfiliacion,
    tipoAfiliacion: 'Particular' as const,
    ciudad: (lead.customFields?.Ciudad as string) || '',
    estado: (lead.customFields?.Estado as string) || '',
    origenLead: mapOrigenLead(lead.canal),
    observaciones: `Convertido desde lead (${lead.canal || 'CRM'}). ${lead.notas || ''}`.trim(),
  };

  let paciente: Paciente;
  try {
    paciente = await pacientesService.crear(pacientePayload as Parameters<typeof pacientesService.crear>[0]);
  } catch (err: unknown) {
    const ax = err as { response?: { status?: number; data?: { paciente?: Paciente } } };
    if (ax?.response?.status === 409 && ax.response.data?.paciente) {
      paciente = ax.response.data.paciente;
    } else {
      throw err;
    }
  }

  const fechaStr = typeof data.fechaCita === 'string' ? data.fechaCita.slice(0, 10) : data.fechaCita.toISOString().slice(0, 10);

  const citaPayload = {
    pacienteId: paciente.id,
    sucursalId: data.sucursalId,
    fechaCita: fechaStr,
    horaCita: data.horaCita,
    tipoConsulta: data.tipoConsulta,
    especialidad: data.especialidad,
    medicoAsignado: data.medicoAsignado,
    esPromocion: Boolean(data.esPromocion),
  };

  const { data: resData } = await api.post<{ cita: Cita; confirmacionEnviada?: boolean }>('/citas', citaPayload);
  const cita = resData.cita;
  const confirmacionEnviada = resData.confirmacionEnviada === true;
  const tiempoTotal = Date.now() - tiempoInicio;

  // Si el lead viene del backend (UUID), actualizarlo para que salga de Contact Center y aparezca en la sucursal
  const esUuidLead = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead.id);
  if (esUuidLead) {
    try {
      await api.put(`/crm/leads/${lead.id}`, {
        status: 'citas-locales',
        citaId: cita.id,
        sucursalId: data.sucursalId,
        sucursalNombre: data.sucursalNombre || undefined,
      });
    } catch {
      // Si falla (ej. lead no es solicitud de contacto), no bloquear la conversión
    }
  }

  return {
    paciente,
    cita,
    whatsappEnviado: confirmacionEnviada,
    tiempoTotal,
  };
}
