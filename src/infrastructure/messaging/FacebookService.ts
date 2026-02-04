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
      console.error('❌ Error enviando mensaje Facebook:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
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
      console.error('❌ Error enviando mensaje con opciones:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
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
      return {
        success: false,
        error: error.message
      };
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
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesa webhook entrante de Facebook
   */
  procesarWebhook(payload: Record<string, unknown>): {
    tipo: 'mensaje' | 'lectura' | 'entrega' | 'desconocido';
    datos: Record<string, unknown>;
  } {
    const payloadAny = payload as any;
    const entry = payloadAny.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (messaging?.message) {
      return {
        tipo: 'mensaje',
        datos: {
          senderId: messaging.sender.id,
          recipientId: messaging.recipient.id,
          texto: messaging.message.text || '',
          timestamp: messaging.timestamp
        }
      };
    }

    if (messaging?.read) {
      return {
        tipo: 'lectura',
        datos: {
          senderId: messaging.sender.id,
          watermark: messaging.read.watermark
        }
      };
    }

    if (messaging?.delivery) {
      return {
        tipo: 'entrega',
        datos: {
          messageIds: messaging.delivery.mids
        }
      };
    }

    return {
      tipo: 'desconocido',
      datos: payload
    };
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
