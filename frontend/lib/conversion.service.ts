/**
 * Servicio para convertir Leads a Pacientes
 * Incluye: Auto-creación de paciente + cita + envío de confirmación
 */

import { Lead } from '@/types/matrix';
import { Paciente, Cita } from '@/types/index';

interface ConversionResponse {
  paciente: Paciente;
  cita: Cita;
  whatsappEnviado: boolean;
  tiempoTotal: number;
}

interface ConversionData {
  leadId: string;
  especialidad?: string;
  tipoConsulta?: string;
  fechaCita?: Date;
}

/**
 * Convertir un Lead a Paciente con auto-creación de cita y WhatsApp
 */
export async function convertirLeadAPaciente(
  lead: Lead,
  data: ConversionData
): Promise<ConversionResponse> {
  const tiempoInicio = Date.now();

  try {
    // 1. Crear paciente desde el lead
    const paciente = await crearPacienteDesdeLeads(lead);

    // 2. Auto-crear cita (paralelo)
    const sucursalLead = typeof lead.customFields?.Sucursal === 'string' ? lead.customFields?.Sucursal : undefined;
    const sucursalActual = typeof window !== 'undefined' ? localStorage.getItem('sucursalActual') || undefined : undefined;
    const esPromocion =
      typeof lead.customFields?.Promocion === 'boolean'
        ? lead.customFields?.Promocion
        : Array.isArray(lead.etiquetas) && lead.etiquetas.some((tag) => tag.toLowerCase().includes('promo'));

    const citaPromise = crearCitaAutomatica(paciente.id, {
      especialidad: data.especialidad || 'Consulta General',
      tipoConsulta: data.tipoConsulta || 'Consulta Inicial',
      fechaCita: data.fechaCita || generarFechaPruebaProxima(),
      sucursalId: sucursalLead || sucursalActual || 'SUC-001',
      esPromocion,
    });

    // 3. Enviar confirmación WhatsApp (paralelo)
    const whatsappPromise = enviarConfirmacionWhatsApp(paciente, lead);

    // Ejecutar en paralelo
    const [cita, whatsappEnviado] = await Promise.all([citaPromise, whatsappPromise]);

    const tiempoTotal = Date.now() - tiempoInicio;

    console.log(`✅ Conversión completada en ${tiempoTotal}ms`);

    return {
      paciente,
      cita,
      whatsappEnviado,
      tiempoTotal,
    };
  } catch (error) {
    console.error('Error en conversión de lead a paciente:', error);
    throw error;
  }
}

/**
 * Crear un nuevo paciente basado en datos del lead
 */
async function crearPacienteDesdeLeads(lead: Lead): Promise<Paciente> {
  // Extraer datos del lead
  const nombreCompleto = lead.nombre;
  const telefono = lead.telefono || '';
  const email = lead.email || '';

  const pacienteData = {
    nombreCompleto,
    telefono,
    whatsapp: telefono, // Usar teléfono como WhatsApp
    email,
    fechaNacimiento: new Date(), // Será llenado después
    edad: 0, // Será calculado después
    sexo: 'M' as const,
    noAfiliacion: `LEAD-${lead.id}`,
    tipoAfiliacion: 'Titular' as const,
    origenLead: `${lead.canal}-${lead.status}`,
    activo: true,
    fechaRegistro: new Date(),
    ultimaActualizacion: new Date(),
    observaciones: `Convertido desde lead: ${lead.notas || 'Sin notas'}`,
  };

  try {
    // Simular API call (en producción sería a /api/pacientes)
    const paciente: Paciente = {
      id: `PAC-${Date.now()}`,
      ...pacienteData,
      fechaNacimiento: new Date(2000, 0, 1),
      edad: new Date().getFullYear() - 2000,
    };

    console.log('✅ Paciente creado:', paciente);
    return paciente;
  } catch (error) {
    console.error('Error creando paciente:', error);
    throw error;
  }
}

/**
 * Crear paciente desde lead (versión corregida)
 */
async function crearPacienteDesdeLeadFn(lead: Lead): Promise<Paciente> {
  return crearPacienteDesdeLeads(lead);
}

/**
 * Auto-crear una cita de prueba
 */
async function crearCitaAutomatica(
  pacienteId: string,
  options: {
    especialidad: string;
    tipoConsulta: string;
    fechaCita: Date;
    sucursalId: string;
    esPromocion: boolean;
  }
): Promise<Cita> {
  const citaData = {
    pacienteId,
    sucursalId: options.sucursalId,
    fechaCita: options.fechaCita,
    horaCita: generarHoraPrueba(),
    duracionMinutos: 30,
    tipoConsulta: options.tipoConsulta,
    especialidad: options.especialidad,
    estado: 'Agendada' as const,
    esPromocion: options.esPromocion,
    costoConsulta: 250,
    montoAbonado: 0,
    saldoPendiente: 250,
    reagendaciones: 0,
    fechaCreacion: new Date(),
    ultimaActualizacion: new Date(),
  };

  try {
    // Simular API call
    const cita: Cita = {
      id: `CITA-${Date.now()}`,
      ...citaData,
    };

    console.log('✅ Cita creada:', cita);
    return cita;
  } catch (error) {
    console.error('Error creando cita:', error);
    throw error;
  }
}

/**
 * Enviar confirmación por WhatsApp
 */
async function enviarConfirmacionWhatsApp(paciente: Paciente, _lead: Lead): Promise<boolean> {
  const mensaje = `¡Hola ${paciente.nombreCompleto}! 👋

Gracias por tu interés. Hemos registrado tu cita para consulta inicial.

📅 Fecha: ${new Date().toLocaleDateString('es-MX')}
⏰ Hora: Próximamente confirmada
💰 Costo: $250 MXN (Promoción especial)

Recibe: Consulta + Diagnóstico + Plan de tratamiento

¿Confirmas tu asistencia? Responde SÍ o llámanos al +1234567890

¡Te esperamos! 🏥`;

  try {
    console.log('📱 Enviando WhatsApp a:', paciente.whatsapp);
    console.log('Mensaje:', mensaje);

    // Simular envío de WhatsApp
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('✅ WhatsApp enviado exitosamente');
    return true;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return false;
  }
}

/**
 * Generar fecha de prueba para próxima cita (7 días después)
 */
function generarFechaPruebaProxima(): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha;
}

/**
 * Generar hora de prueba
 */
function generarHoraPrueba(): string {
  const horas = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  return horas[Math.floor(Math.random() * horas.length)];
}

/**
 * Exportar función corregida
 */
export const crearPacienteDesdeLeads_impl = crearPacienteDesdeLeadFn;
