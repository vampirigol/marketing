import axios from 'axios';

/**
 * Servicio de Instagram Direct API
 * 
 * INTEGRACIÓN: Instagram Graph API para mensajería
 * Documentación: https://developers.facebook.com/docs/instagram-api/guides/messaging
 * 
 * Funcionalidades:
 * - Envío y recepción de mensajes directos
 * - Gestión de conversaciones
 * - Respuestas automáticas
 * - Notificaciones
 */

interface InstagramResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class InstagramService {
  private readonly apiUrl: string;
  private readonly pageAccessToken: string;
  private readonly instagramBusinessAccountId: string;
  private readonly apiVersion: string = 'v18.0';

  constructor() {
    this.apiUrl = process.env.INSTAGRAM_API_URL || 'https://graph.facebook.com';
    this.pageAccessToken =
      process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
    this.instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';

    if (!this.pageAccessToken || !this.instagramBusinessAccountId) {
      console.warn('⚠️ Instagram credentials not configured. Messages will be simulated.');
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.pageAccessToken && this.instagramBusinessAccountId);
  }

  /**
   * Envía un mensaje directo
   */
  async enviarMensaje(recipientId: string, texto: string): Promise<InstagramResponse> {
    if (!this.isConfigured()) {
      console.log('💜 [SIMULADO] Instagram:', recipientId, '-', texto);
      return {
        success: true,
        messageId: `sim-ig-${Date.now()}`
      };
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/me/messages`;
      
      const response = await axios.post(
        url,
        {
          recipient: { id: recipientId },
          message: { text: texto }
        },
        {
          params: {
            access_token: this.pageAccessToken
          }
        }
      );

      return {
        success: true,
        messageId: response.data.message_id
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any;
      console.error('❌ Error enviando mensaje Instagram:', axiosError.response?.data || errorMessage);
      return {
        success: false,
        error: axiosError.response?.data?.error?.message || errorMessage
      };
    }
  }

  /**
   * Envía confirmación de cita
   */
  async enviarConfirmacionCita(datos: {
    recipientId: string;
    nombrePaciente: string;
    fecha: string;
    hora: string;
    sucursal: string;
  }): Promise<InstagramResponse> {
    const mensaje = `✅ Hola ${datos.nombrePaciente}! Tu cita está confirmada:\n📅 ${datos.fecha} ${datos.hora}\n📍 ${datos.sucursal}\n\n¡Te esperamos! 🏥`;
    
    return this.enviarMensaje(datos.recipientId, mensaje);
  }

  /**
   * Envía recordatorio de cita
   */
  async enviarRecordatorio(datos: {
    recipientId: string;
    nombrePaciente: string;
    fecha: string;
    hora: string;
  }): Promise<InstagramResponse> {
    const mensaje = `🔔 ${datos.nombrePaciente}, recordatorio: Tu cita es mañana ${datos.fecha} a las ${datos.hora}. Por favor confirma tu asistencia 💙`;
    
    return this.enviarMensaje(datos.recipientId, mensaje);
  }

  /**
   * Envía mensaje de bienvenida
   */
  async enviarBienvenida(recipientId: string, nombre: string): Promise<InstagramResponse> {
    const mensaje = `👋 Hola ${nombre}! Bienvenido a Red de Clínicas Adventistas.\n\n¿En qué podemos ayudarte hoy?\n\n1️⃣ Agendar cita\n2️⃣ Información de servicios\n3️⃣ Promociones actuales`;
    
    return this.enviarMensaje(recipientId, mensaje);
  }

  /**
   * Marca mensaje como visto
   */
  async marcarComoVisto(senderId: string): Promise<InstagramResponse> {
    if (!this.isConfigured()) {
      return { success: true };
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/me/messages`;
      
      await axios.post(
        url,
        {
          recipient: { id: senderId },
          sender_action: 'mark_seen'
        },
        {
          params: {
            access_token: this.pageAccessToken
          }
        }
      );

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Extrae todos los mensajes de texto del payload (object: "instagram" o "page").
   * Meta puede enviar varios eventos en un solo webhook.
   */
  extraerMensajes(payload: Record<string, unknown>): Array<{ senderId: string; texto: string }> {
    const payloadAny = payload as { object?: string; entry?: Array<{ messaging?: Array<{ sender?: { id?: string }; message?: { text?: string } }> }> };
    if (payloadAny.object !== 'instagram' && payloadAny.object !== 'page') return [];
    const entries = payloadAny.entry ?? [];
    const mensajes: Array<{ senderId: string; texto: string }> = [];

    for (const entry of entries) {
      const messagingList = entry.messaging ?? [];
      for (const ev of messagingList) {
        const msg = ev.message;
        if (!msg?.text) continue;
        const senderId = ev.sender?.id ?? '';
        if (senderId) mensajes.push({ senderId, texto: msg.text });
      }
    }
    return mensajes;
  }

  /**
   * Obtiene nombre y foto del perfil de un usuario de Instagram Messaging (IGSID).
   * Requiere que el usuario haya enviado mensaje o interactuado previamente.
   */
  async obtenerPerfilUsuario(igsId: string): Promise<{ name?: string; profilePic?: string }> {
    if (!this.isConfigured()) return {};
    try {
      const url = `${this.apiUrl}/${this.apiVersion}/${igsId}`;
      const response = await axios.get(url, {
        params: {
          fields: 'name,profile_pic',
          access_token: this.pageAccessToken,
        },
      });
      return {
        name: response.data.name,
        profilePic: response.data.profile_pic,
      };
    } catch {
      return {};
    }
  }

  /**
   * Procesa webhook entrante de Instagram (legacy, un solo evento)
   */
  procesarWebhook(payload: Record<string, unknown>): {
    tipo: 'mensaje' | 'historia' | 'desconocido';
    datos: Record<string, unknown>;
  } {
    const mensajes = this.extraerMensajes(payload);
    if (mensajes.length > 0) {
      return { tipo: 'mensaje', datos: mensajes[0] };
    }
    const payloadAny = payload as { entry?: Array<{ changes?: Array<{ value?: { media_id?: string; from?: { id?: string } } }> }> };
    const entry = payloadAny.entry?.[0];
    if (entry?.changes?.[0]?.value?.media_id) {
      return { tipo: 'historia', datos: { mediaId: entry.changes[0].value.media_id } };
    }
    return { tipo: 'desconocido', datos: payload };
  }

  /**
   * Obtiene información básica de la conversación
   */
  async obtenerConversacion(conversacionId: string): Promise<Record<string, unknown> | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/${conversacionId}`;
      
      const response = await axios.get(url, {
        params: {
          fields: 'participants,messages',
          access_token: this.pageAccessToken
        }
      });

      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(errorMessage);
      return null;
    }
  }
}
