import axios from 'axios';

/**
 * Servicio de WhatsApp Business API
 * 
 * INTEGRACIÓN: Meta Cloud API para WhatsApp Business
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Funcionalidades:
 * - Envío de mensajes de texto
 * - Mensajes con plantillas aprobadas
 * - Confirmaciones de citas
 * - Recordatorios automáticos
 * - Notificaciones de cambio de precio
 */

interface WhatsAppMessage {
  to: string; // Número en formato internacional: +525551234567
  body: string;
  type?: 'text' | 'template';
}

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  language?: string;
  components?: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string = 'v18.0';

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('⚠️ WhatsApp credentials not configured. Messages will be simulated.');
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.phoneNumberId && this.accessToken);
  }

  /**
   * Envía un mensaje de texto simple
   */
  async enviarMensaje(mensaje: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      console.log('📱 [SIMULADO] WhatsApp:', mensaje.to, '-', mensaje.body);
      return {
        success: true,
        messageId: `sim-wa-${Date.now()}`
      };
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: mensaje.to,
          type: 'text',
          text: {
            body: mensaje.body
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error: unknown) {
      const errMsg = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } })?.error?.message || error.message
        : error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando WhatsApp:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Envía un mensaje usando plantilla aprobada
   * Las plantillas deben estar pre-aprobadas en Meta Business Manager
   */
  async enviarMensajePlantilla(mensaje: WhatsAppTemplateMessage): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      console.log('📱 [SIMULADO] WhatsApp Template:', mensaje.to, '-', mensaje.templateName);
      return {
        success: true,
        messageId: `sim-wa-tpl-${Date.now()}`
      };
    }

    try {
      const url = `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: mensaje.to,
          type: 'template',
          template: {
            name: mensaje.templateName,
            language: {
              code: mensaje.language || 'es_MX'
            },
            components: mensaje.components || []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error: unknown) {
      const errMsg = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { message?: string } })?.error?.message || error.message
        : error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando plantilla WhatsApp:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Envía confirmación de cita agendada
   */
  async enviarConfirmacionCita(datos: {
    telefono: string;
    nombrePaciente: string;
    fecha: string;
    hora: string;
    sucursal: string;
    doctor: string;
    costo: number;
  }): Promise<WhatsAppResponse> {
    const mensaje = `✅ *CITA CONFIRMADA - Red de Clínicas Adventistas*

Hola ${datos.nombrePaciente} 👋

Tu cita ha sido agendada exitosamente:

📅 Fecha: ${datos.fecha}
🕐 Hora: ${datos.hora}
📍 Sucursal: ${datos.sucursal}
👨‍⚕️ Doctor: ${datos.doctor}
💵 Costo: $${datos.costo} MXN

Te enviaremos recordatorios antes de tu cita.

¿Alguna pregunta? Responde a este mensaje.`;

    return this.enviarMensaje({
      to: datos.telefono,
      body: mensaje
    });
  }

  /**
   * Envía recordatorio 24 horas antes
   */
  async enviarRecordatorio24h(datos: {
    telefono: string;
    nombrePaciente: string;
    fecha: string;
    hora: string;
    sucursal: string;
  }): Promise<WhatsAppResponse> {
    const mensaje = `🔔 *RECORDATORIO - Cita Mañana*

Hola ${datos.nombrePaciente},

Te recordamos tu cita:

📅 Mañana ${datos.fecha}
🕐 ${datos.hora}
📍 ${datos.sucursal}

Por favor confirma tu asistencia respondiendo:
✅ SÍ - Para confirmar
❌ NO - Para cancelar/reagendar

¡Te esperamos!`;

    return this.enviarMensaje({
      to: datos.telefono,
      body: mensaje
    });
  }

  /**
   * Envía recordatorio el día de la cita (2 horas antes)
   */
  async enviarRecordatorioDiaCita(datos: {
    telefono: string;
    nombrePaciente: string;
    hora: string;
    sucursal: string;
    direccion: string;
  }): Promise<WhatsAppResponse> {
    const mensaje = `⏰ *RECORDATORIO - Tu cita es HOY*

${datos.nombrePaciente}, tu cita es en unas horas:

🕐 Hora: ${datos.hora}
📍 ${datos.sucursal}
🗺️ ${datos.direccion}

Por favor llega 10 minutos antes.

*Importante:* Si no puedes asistir, avísanos para reprogramar.`;

    return this.enviarMensaje({
      to: datos.telefono,
      body: mensaje
    });
  }

  /**
   * Notifica cambio de precio por reagendación
   */
  async notificarCambioPrecio(datos: {
    telefono: string;
    nombrePaciente: string;
    nuevaFecha: string;
    nuevaHora: string;
    precioAnterior: number;
    precioNuevo: number;
    razon: string;
  }): Promise<WhatsAppResponse> {
    const mensaje = `🔄 *CITA REAGENDADA*

Hola ${datos.nombrePaciente},

Tu cita ha sido reagendada:

📅 Nueva fecha: ${datos.nuevaFecha}
🕐 Nueva hora: ${datos.nuevaHora}

⚠️ *IMPORTANTE - Cambio en el precio:*
Precio anterior: $${datos.precioAnterior} MXN
Precio nuevo: $${datos.precioNuevo} MXN

${datos.razon}

Si tienes dudas, contáctanos.`;

    return this.enviarMensaje({
      to: datos.telefono,
      body: mensaje
    });
  }

  /**
   * Envía recibo de pago por WhatsApp
   */
  async enviarRecibo(datos: {
    telefono: string;
    nombrePaciente: string;
    folioRecibo: string;
    monto: number;
    metodoPago: string;
    fecha: string;
  }): Promise<WhatsAppResponse> {
    const mensaje = `🧾 *RECIBO DE PAGO*

Cliente: ${datos.nombrePaciente}
Folio: ${datos.folioRecibo}

💵 Monto: $${datos.monto} MXN
💳 Método: ${datos.metodoPago}
📅 Fecha: ${datos.fecha}

Gracias por tu pago.
Red de Clínicas Adventistas 🏥`;

    return this.enviarMensaje({
      to: datos.telefono,
      body: mensaje
    });
  }

  /**
   * Notifica que el paciente pasó a lista de espera (no llegó)
   */
  async notificarListaEspera(datos: {
    telefono: string;
    nombrePaciente: string;
    fechaCita: string;
    horaCita: string;
  }): Promise<WhatsAppResponse> {
    const mensaje = `😔 *Te extrañamos hoy*

Hola ${datos.nombrePaciente},

Notamos que no pudiste llegar a tu cita:
📅 ${datos.fechaCita} a las ${datos.horaCita}

¿Todo bien? ¿Deseas reagendar?

Responde:
1️⃣ SÍ - Para reagendar
2️⃣ Tuve un problema (cuéntanos)

Estamos para ayudarte.`;

    return this.enviarMensaje({
      to: datos.telefono,
      body: mensaje
    });
  }

  /**
   * Webhook receiver para mensajes entrantes
   * Este método procesaría los webhooks de Meta
   */
  procesarWebhook(payload: Record<string, unknown>): {
    tipo: 'mensaje' | 'estado' | 'desconocido';
    datos: Record<string, unknown>;
  } {
    const payloadAny = payload as any;
    const value = payloadAny.entry?.[0]?.changes?.[0]?.value;
    if (value?.messages) {
      const mensaje = value.messages[0];
      const metadata = value.metadata || {};
      return {
        tipo: 'mensaje',
        datos: {
          de: mensaje.from,
          texto: mensaje.text?.body || '',
          timestamp: mensaje.timestamp,
          nombreContacto: value.contacts?.[0]?.profile?.name,
          /** ID del número de teléfono de WhatsApp (Meta). Usado para enrutar multi-sucursal. */
          phone_number_id: metadata.phone_number_id,
        },
      };
    }

    return {
      tipo: 'desconocido',
      datos: payload
    };
  }
}
