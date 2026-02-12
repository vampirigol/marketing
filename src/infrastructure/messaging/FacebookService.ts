import axios from 'axios';

/**
 * Servicio de Facebook Messenger API
 * 
 * INTEGRACIÓN: Facebook Graph API para Messenger
 * Documentación: https://developers.facebook.com/docs/messenger-platform
 * 
 * Funcionalidades:
 * - Envío y recepción de mensajes
 * - Gestión de conversaciones
 * - Respuestas rápidas
 * - Notificaciones
 */

interface FacebookResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class FacebookService {
  private readonly apiUrl: string;
  private readonly pageAccessToken: string;
  private readonly apiVersion: string = 'v18.0';

  constructor() {
    this.apiUrl = process.env.FACEBOOK_API_URL || 'https://graph.facebook.com';
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';

    if (!this.pageAccessToken) {
      console.warn('⚠️ Facebook credentials not configured. Messages will be simulated.');
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!this.pageAccessToken;
  }

  /**
   * Envía un mensaje de texto a un usuario
   */
  async enviarMensaje(recipientId: string, texto: string): Promise<FacebookResponse> {
    if (!this.isConfigured()) {
      console.log('💬 [SIMULADO] Facebook:', recipientId, '-', texto);
      return {
        success: true,
        messageId: `sim-fb-${Date.now()}`
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
      const errMsg = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } })?.error?.message || error.message
        : error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando mensaje Facebook:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Envía mensaje con respuestas rápidas
   */
  async enviarMensajeConOpciones(
    recipientId: string,
    texto: string,
    opciones: Array<{ titulo: string; payload: string }>
  ): Promise<FacebookResponse> {
    if (!this.isConfigured()) {
      console.log('💬 [SIMULADO] Facebook con opciones:', recipientId, '-', texto);
      return {
        success: true,
        messageId: `sim-fb-opt-${Date.now()}`
      };
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/me/messages`;
      
      const response = await axios.post(
        url,
        {
          recipient: { id: recipientId },
          message: {
            text: texto,
            quick_replies: opciones.map(opt => ({
              content_type: 'text',
              title: opt.titulo,
              payload: opt.payload
            }))
          }
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
      const errMsg = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } })?.error?.message || error.message
        : error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando mensaje con opciones:', errMsg);
      return { success: false, error: errMsg };
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
    doctor: string;
  }): Promise<FacebookResponse> {
    const mensaje = `✅ Hola ${datos.nombrePaciente}!\n\nTu cita está confirmada:\n📅 ${datos.fecha}\n🕐 ${datos.hora}\n📍 ${datos.sucursal}\n👨‍⚕️ ${datos.doctor}`;
    
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
    sucursal: string;
  }): Promise<FacebookResponse> {
    const mensaje = `🔔 Recordatorio: ${datos.nombrePaciente}, tu cita es mañana ${datos.fecha} a las ${datos.hora} en ${datos.sucursal}`;
    
    return this.enviarMensajeConOpciones(
      datos.recipientId,
      mensaje,
      [
        { titulo: '✅ Confirmar', payload: 'CONFIRMAR_CITA' },
        { titulo: '🔄 Reagendar', payload: 'REAGENDAR_CITA' },
        { titulo: '❌ Cancelar', payload: 'CANCELAR_CITA' }
      ]
    );
  }

  /**
   * Marca el mensaje como "visto"
   */
  async marcarComoVisto(senderId: string): Promise<FacebookResponse> {
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
      const errMsg = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errMsg };
    }
  }

  /**
   * Muestra indicador de "escribiendo..."
   */
  async mostrarEscribiendo(recipientId: string): Promise<FacebookResponse> {
    if (!this.isConfigured()) {
      return { success: true };
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/me/messages`;
      
      await axios.post(
        url,
        {
          recipient: { id: recipientId },
          sender_action: 'typing_on'
        },
        {
          params: {
            access_token: this.pageAccessToken
          }
        }
      );

      return { success: true };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errMsg };
    }
  }

  /**
   * Extrae todos los mensajes del payload (object: "page").
   * Soporta: entry[].messaging y entry[].standby (mensajes fuera de ventana 24h).
   * Incluye texto y adjuntos (imagen, audio, video, archivo).
   */
  extraerMensajes(payload: Record<string, unknown>): Array<{ senderId: string; texto: string; tipoMensaje?: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video'; timestamp?: number }> {
    const payloadAny = payload as {
      object?: string;
      entry?: Array<{
        messaging?: Array<Record<string, unknown>>;
        standby?: Array<Record<string, unknown>>;
      }>;
    };
    if (payloadAny.object !== 'page') return [];
    const entries = payloadAny.entry ?? [];
    const mensajes: Array<{ senderId: string; texto: string; tipoMensaje?: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video'; timestamp?: number }> = [];

    const procesarEvento = (ev: Record<string, unknown>) => {
      const msg = ev.message as { text?: string; is_echo?: boolean; attachments?: Array<{ type?: string }> } | undefined;
      if (!msg || msg.is_echo) return;
      const senderId = (ev.sender as { id?: string })?.id ?? '';
      if (!senderId) return;

      let texto = msg.text ?? '';
      let tipoMensaje: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video' = 'texto';

      if (!texto && msg.attachments?.length) {
        const tipo = (msg.attachments[0]?.type ?? 'file') as string;
        if (tipo === 'image') { texto = '[Imagen]'; tipoMensaje = 'imagen'; }
        else if (tipo === 'audio' || tipo === 'video') { texto = `[${tipo === 'audio' ? 'Audio' : 'Video'}]`; tipoMensaje = tipo === 'audio' ? 'audio' : 'video'; }
        else { texto = '[Archivo]'; tipoMensaje = 'archivo'; }
      }
      if (!texto) return;
      mensajes.push({ senderId, texto, tipoMensaje, timestamp: ev.timestamp as number });
    };

    for (const entry of entries) {
      for (const ev of entry.messaging ?? []) procesarEvento(ev as Record<string, unknown>);
      for (const ev of entry.standby ?? []) procesarEvento(ev as Record<string, unknown>);
    }
    return mensajes;
  }

  /**
   * Procesa webhook entrante de Facebook Messenger (legacy, un solo evento)
   * Estructura: { object: "page", entry: [{ id, time, messaging: [...] }] }
   */
  procesarWebhook(payload: Record<string, unknown>): {
    tipo: 'mensaje' | 'lectura' | 'entrega' | 'desconocido';
    datos: Record<string, unknown>;
  } {
    const mensajes = this.extraerMensajes(payload);
    if (mensajes.length > 0) {
      return { tipo: 'mensaje', datos: mensajes[0] };
    }
    const payloadAny = payload as { object?: string; entry?: Array<{ messaging?: Array<Record<string, unknown>> }> };
    const entries = payloadAny.entry ?? [];
    const firstMessaging = entries[0]?.messaging?.[0] as Record<string, unknown> | undefined;
    if (!firstMessaging) return { tipo: 'desconocido', datos: payload };
    const senderId = (firstMessaging.sender as { id?: string })?.id;
    if (firstMessaging.read) return { tipo: 'lectura', datos: { senderId } };
    if (firstMessaging.delivery) return { tipo: 'entrega', datos: {} };
    return { tipo: 'desconocido', datos: payload };
  }

  /**
   * Obtiene información del perfil del usuario
   */
  async obtenerPerfilUsuario(userId: string): Promise<{
    firstName?: string;
    lastName?: string;
    profilePic?: string;
  }> {
    if (!this.isConfigured()) {
      return {};
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/${userId}`;
      
      const response = await axios.get(url, {
        params: {
          fields: 'first_name,last_name,profile_pic',
          access_token: this.pageAccessToken
        }
      });

      return {
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        profilePic: response.data.profile_pic
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(errorMessage);
      return {};
    }
  }
}
