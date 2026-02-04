/**
 * WebhookController
 * 
 * Controlador para recibir webhooks de WhatsApp, Facebook e Instagram.
 * Procesa mensajes entrantes y eventos de las plataformas de Meta.
 * 
 * FLUJO:
 * 1. Verifica la autenticidad de la solicitud (firma HMAC)
 * 2. Procesa eventos: mensajes entrantes, cambios de estado, etc.
 * 3. Guarda en base de datos y emite eventos WebSocket
 * 4. Retorna 200 OK para confirmar recepción
 */

import { Request, Response } from 'express';
import crypto from 'crypto';

export class WebhookController {
  /**
   * Verifica el webhook en el proceso de configuración inicial
   * GET /api/webhooks/whatsapp
   * GET /api/webhooks/facebook
   * GET /api/webhooks/instagram
   */
  verificarWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const plataforma = req.path.includes('whatsapp') ? 'WHATSAPP' :
                       req.path.includes('facebook') ? 'FACEBOOK' : 'INSTAGRAM';

    const verifyToken = plataforma === 'WHATSAPP' ? process.env.WHATSAPP_VERIFY_TOKEN :
                        plataforma === 'FACEBOOK' ? process.env.FACEBOOK_VERIFY_TOKEN :
                        process.env.INSTAGRAM_VERIFY_TOKEN;

    console.log(`[${plataforma} WEBHOOK] Verificación:`, { mode, token });

    if (mode === 'subscribe' && token === verifyToken) {
      console.log(`[${plataforma} WEBHOOK] ✅ Verificación exitosa`);
      res.status(200).send(challenge);
    } else {
      console.error(`[${plataforma} WEBHOOK] ❌ Verificación fallida`);
      res.status(403).send('Forbidden');
    }
  }

  /**
   * Recibe webhooks de WhatsApp Business API
   * POST /api/webhooks/whatsapp
   * 
   * EVENTOS:
   * - messages: Mensaje entrante del paciente
   * - message_status: Confirmación de entrega/lectura
   * - account_alerts: Alertas de la cuenta
   */
  async recibirWebhookWhatsApp(req: Request, res: Response): Promise<void> {
    try {
      // Verificar firma HMAC para seguridad
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!this.verificarFirma(req.body, signature, process.env.META_APP_SECRET!)) {
        console.error('[WHATSAPP WEBHOOK] ❌ Firma inválida');
        res.status(403).send('Forbidden');
        return;
      }

      const { entry } = req.body;
      console.log('[WHATSAPP WEBHOOK] 📩 Recibido:', JSON.stringify(entry, null, 2));

      for (const cambio of entry) {
        for (const value of cambio.changes) {
          // Procesar mensajes entrantes
          if (value.value?.messages) {
            for (const mensaje of value.value.messages) {
              await this.procesarMensajeWhatsApp(mensaje, value.value.metadata);
            }
          }

          // Procesar cambios de estado (entregado, leído, fallido)
          if (value.value?.statuses) {
            for (const status of value.value.statuses) {
              await this.procesarEstadoMensaje(status, 'whatsapp');
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[WHATSAPP WEBHOOK] Error:', error);
      res.status(500).json({ error: 'Error procesando webhook' });
    }
  }

  /**
   * Recibe webhooks de Facebook Messenger
   * POST /api/webhooks/facebook
   * 
   * EVENTOS:
   * - messages: Mensaje entrante
   * - message_reads: Paciente leyó el mensaje
   * - message_deliveries: Mensaje entregado
   */
  async recibirWebhookFacebook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!this.verificarFirma(req.body, signature, process.env.META_APP_SECRET!)) {
        console.error('[FACEBOOK WEBHOOK] ❌ Firma inválida');
        res.status(403).send('Forbidden');
        return;
      }

      const { entry } = req.body;
      console.log('[FACEBOOK WEBHOOK] 📩 Recibido:', JSON.stringify(entry, null, 2));

      for (const page of entry) {
        for (const event of page.messaging) {
          if (event.message) {
            await this.procesarMensajeFacebook(event);
          }
          if (event.read) {
            await this.procesarLecturaMensaje(event.sender.id, 'facebook');
          }
          if (event.delivery) {
            await this.procesarEntregaMensaje(event.sender.id, 'facebook');
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[FACEBOOK WEBHOOK] Error:', error);
      res.status(500).json({ error: 'Error procesando webhook' });
    }
  }

  /**
   * Recibe webhooks de Instagram Direct
   * POST /api/webhooks/instagram
   * 
   * EVENTOS:
   * - messages: Mensaje directo entrante
   * - message_reactions: Reacción a mensaje
   * - story_mentions: Mención en historia
   */
  async recibirWebhookInstagram(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!this.verificarFirma(req.body, signature, process.env.META_APP_SECRET!)) {
        console.error('[INSTAGRAM WEBHOOK] ❌ Firma inválida');
        res.status(403).send('Forbidden');
        return;
      }

      const { entry } = req.body;
      console.log('[INSTAGRAM WEBHOOK] 📩 Recibido:', JSON.stringify(entry, null, 2));

      for (const page of entry) {
        for (const event of page.messaging) {
          if (event.message) {
            await this.procesarMensajeInstagram(event);
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[INSTAGRAM WEBHOOK] Error:', error);
      res.status(500).json({ error: 'Error procesando webhook' });
    }
  }

  /**
   * Verifica la firma HMAC SHA-256 del webhook
   */
  private verificarFirma(payload: Record<string, unknown>, signature: string, secret: string): boolean {
    if (!signature) return false;

    const signatureHash = signature.split('sha256=')[1];
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }

  /**
   * Procesa mensaje entrante de WhatsApp
   */
  private async procesarMensajeWhatsApp(mensaje: Record<string, any>, _metadata: Record<string, any>): Promise<void> {
    console.log('[WHATSAPP] Procesando mensaje:', {
      id: mensaje.id,
      from: mensaje.from,
      tipo: mensaje.type,
      texto: mensaje.text?.body
    });

    // TODO: Implementar
    // 1. Buscar paciente por teléfono en BD
    // 2. Crear/actualizar conversación en Matrix
    // 3. Guardar mensaje en BD
    // 4. Emitir evento WebSocket para actualizar UI de Keila
    // 5. Si es respuesta a recordatorio, marcar como confirmado
    
    // Ejemplo de estructura a guardar:
    const mensajeDB = {
      id: mensaje.id,
      conversacionId: `wa-${mensaje.from}`,
      canal: 'whatsapp',
      direccion: 'entrante',
      remitente: mensaje.from,
      contenido: mensaje.text?.body || '',
      tipo: mensaje.type, // text, image, document, etc.
      timestamp: new Date(parseInt(mensaje.timestamp) * 1000),
      estado: 'recibido'
    };

    console.log('[WHATSAPP] Mensaje procesado:', mensajeDB);
    
    // TODO: Guardar en BD y emitir WebSocket
    // await mensajeRepository.save(mensajeDB);
    // io.to(`conversacion:wa-${mensaje.from}`).emit('mensaje:nuevo', mensajeDB);
  }

  /**
   * Procesa mensaje entrante de Facebook Messenger
   */
  private async procesarMensajeFacebook(event: Record<string, any>): Promise<void> {
    console.log('[FACEBOOK] Procesando mensaje:', {
      senderId: event.sender.id,
      texto: event.message.text,
      timestamp: event.timestamp
    });

    const mensajeDB = {
      id: event.message.mid,
      conversacionId: `fb-${event.sender.id}`,
      canal: 'facebook',
      direccion: 'entrante',
      remitente: event.sender.id,
      contenido: event.message.text || '',
      timestamp: new Date(event.timestamp),
      estado: 'recibido'
    };

    console.log('[FACEBOOK] Mensaje procesado:', mensajeDB);
    // TODO: Guardar y emitir WebSocket
  }

  /**
   * Procesa mensaje entrante de Instagram
   */
  private async procesarMensajeInstagram(event: Record<string, any>): Promise<void> {
    console.log('[INSTAGRAM] Procesando mensaje:', {
      senderId: event.sender.id,
      texto: event.message.text,
      timestamp: event.timestamp
    });

    const mensajeDB = {
      id: event.message.mid,
      conversacionId: `ig-${event.sender.id}`,
      canal: 'instagram',
      direccion: 'entrante',
      remitente: event.sender.id,
      contenido: event.message.text || '',
      timestamp: new Date(event.timestamp),
      estado: 'recibido'
    };

    console.log('[INSTAGRAM] Mensaje procesado:', mensajeDB);
    // TODO: Guardar y emitir WebSocket
  }

  /**
   * Procesa cambios de estado de mensaje (entregado, leído, fallido)
   */
  private async procesarEstadoMensaje(status: Record<string, any>, canal: string): Promise<void> {
    console.log(`[${canal.toUpperCase()}] Estado mensaje:`, {
      id: status.id,
      estado: status.status,
      timestamp: status.timestamp
    });

    // TODO: Actualizar estado en BD
    // await mensajeRepository.actualizarEstado(status.id, status.status);
    // Emitir WebSocket para actualizar UI
  }

  /**
   * Procesa evento de lectura de mensaje
   */
  private async procesarLecturaMensaje(senderId: string, canal: string): Promise<void> {
    console.log(`[${canal.toUpperCase()}] Mensaje leído por:`, senderId);
    // TODO: Actualizar estado de conversación
  }

  /**
   * Procesa evento de entrega de mensaje
   */
  private async procesarEntregaMensaje(senderId: string, canal: string): Promise<void> {
    console.log(`[${canal.toUpperCase()}] Mensaje entregado a:`, senderId);
    // TODO: Actualizar estado de conversación
  }
}

export default new WebhookController();
