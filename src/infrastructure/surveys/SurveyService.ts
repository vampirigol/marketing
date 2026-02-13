/**
 * Servicio de Encuesta de Calidad (Post-Venta).
 * Se dispara al confirmar pago/cerrado ganado (lead_status = PAGADO_CERRADO).
 * Envía encuesta por el canal activo del lead: WhatsApp (plantilla) o Instagram (texto con link).
 */
import { SolicitudContacto } from '../../core/entities/SolicitudContacto';
import { WhatsAppService } from '../messaging/WhatsAppService';
import { InstagramService } from '../messaging/InstagramService';
import { solicitudContactoRepository } from '../database/repositories/SolicitudContactoRepository';

const TEMPLATE_ENCUESTA_WHATSAPP = 'encuesta_calidad_v1';
const IDIOMA_PLANTILLA = 'es_MX';
const ENLACE_ENCUESTA_DEFAULT = process.env.ENCUESTA_CALIDAD_URL || 'https://forms.gle/ejemplo-encuesta';

export interface SurveySendResult {
  enviado: boolean;
  canal: 'WhatsApp' | 'Instagram' | 'none';
  error?: string;
}

export class SurveyService {
  constructor(
    private readonly solicitud: SolicitudContacto,
    private readonly whatsappService: WhatsAppService,
    private readonly instagramService: InstagramService
  ) {}

  /**
   * Envía la encuesta de calidad según el canal activo del lead.
   * - WhatsApp: plantilla aprobada encuesta_calidad_v1 (es_MX).
   * - Instagram: mensaje de texto con link al formulario.
   */
  async sendQualitySurvey(): Promise<SurveySendResult> {
    const canal = this.resolveCanalActivo();
    if (canal === 'none') {
      return { enviado: false, canal: 'none', error: 'Sin canal o teléfono para enviar encuesta' };
    }

    if (canal === 'WhatsApp') {
      return this.enviarPorWhatsApp();
    }
    if (canal === 'Instagram') {
      return this.enviarPorInstagram();
    }
    return { enviado: false, canal: 'none' };
  }

  private resolveCanalActivo(): 'WhatsApp' | 'Instagram' | 'none' {
    const origen = (this.solicitud as any).origen as string | undefined;
    const telefono = this.normalizarTelefono(this.solicitud.telefono || this.solicitud.whatsapp);
    if (!telefono) return 'none';

    // Preferir canal por origen del lead
    if (origen === 'Instagram') return 'Instagram';
    if (origen === 'WhatsApp' || origen === 'Web' || origen === 'Telefono') return 'WhatsApp';
    if (origen === 'Facebook') return 'WhatsApp'; // muchas veces el contacto llega por FB pero se responde por WA
    if (origen === 'TikTok' || origen === 'YouTube' || origen === 'Email') return 'WhatsApp'; // fallback a WA si hay número

    return 'WhatsApp';
  }

  private normalizarTelefono(val: string | undefined): string | null {
    if (!val || !val.trim()) return null;
    const digits = val.replace(/\D/g, '');
    if (digits.length < 10) return null;
    const sinPrefijo = digits.slice(-10);
    const prefijo = digits.length > 10 ? digits.slice(0, -10) : '52';
    return prefijo === '52' ? `52${sinPrefijo}` : `52${sinPrefijo}`;
  }

  private async enviarPorWhatsApp(): Promise<SurveySendResult> {
    const to = this.normalizarTelefono(this.solicitud.whatsapp || this.solicitud.telefono);
    if (!to) return { enviado: false, canal: 'WhatsApp', error: 'Teléfono no disponible' };

    try {
      const toFormato = to.startsWith('+') ? to.slice(1) : to;
      const res = await this.whatsappService.enviarMensajePlantilla({
        to: toFormato,
        templateName: TEMPLATE_ENCUESTA_WHATSAPP,
        language: IDIOMA_PLANTILLA,
      });
      if (res.success) {
        return { enviado: true, canal: 'WhatsApp' };
      }
      return { enviado: false, canal: 'WhatsApp', error: res.error };
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Error enviando encuesta WhatsApp';
      return { enviado: false, canal: 'WhatsApp', error };
    }
  }

  private async enviarPorInstagram(): Promise<SurveySendResult> {
    // Instagram requiere recipient id (PSID), no teléfono. Si no tenemos vinculación con conversación, no podemos enviar.
    // Opción: buscar conversación por teléfono/nombre para obtener canal_id (PSID). Por ahora enviamos texto si tenemos algún id.
    const instagramRecipientId = (this.solicitud as any).instagramRecipientId as string | undefined;
    if (!instagramRecipientId) {
      // Fallback: no tenemos PSID en la solicitud; se podría buscar en conversaciones_matrix por telefono más adelante.
      console.log('[SurveyService] Instagram: sin recipient id para lead', this.solicitud.id);
      return { enviado: false, canal: 'Instagram', error: 'Instagram: no se tiene ID de destinatario' };
    }
    const mensaje = `¡Gracias por tu preferencia! 🏥 Nos gustaría conocer tu experiencia. Por favor responde nuestra breve encuesta de calidad: ${ENLACE_ENCUESTA_DEFAULT}`;
    try {
      const res = await this.instagramService.enviarMensaje(instagramRecipientId, mensaje);
      return res.success
        ? { enviado: true, canal: 'Instagram' }
        : { enviado: false, canal: 'Instagram', error: res.error };
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Error enviando encuesta Instagram';
      return { enviado: false, canal: 'Instagram', error };
    }
  }

  /**
   * Envía la encuesta de calidad para un lead por ID (para usar desde CRM o CitaController).
   */
  static async sendForLeadId(leadId: string): Promise<SurveySendResult> {
    const solicitud = await solicitudContactoRepository.obtenerPorId(leadId);
    if (!solicitud) {
      return { enviado: false, canal: 'none', error: 'Lead no encontrado' };
    }
    const survey = new SurveyService(
      solicitud,
      new WhatsAppService(),
      new InstagramService()
    );
    return survey.sendQualitySurvey();
  }
}
