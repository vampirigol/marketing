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
import { CitaRespuestaWhatsAppService } from '../../infrastructure/citas/CitaRespuestaWhatsAppService';
import { WhatsAppService } from '../../infrastructure/messaging/WhatsAppService';
import { ConversacionRepositoryPostgres } from '../../infrastructure/database/repositories/ConversacionRepository';
import SocketService from '../../infrastructure/websocket/SocketService';

/** Payload de mensaje WhatsApp (Meta Cloud API) */
interface WhatsAppMensaje {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  timestamp?: string;
}

/** Payload de evento Facebook/Instagram Messenger */
interface MetaMessagingEvent {
  sender?: { id?: string };
  message?: { mid?: string; text?: string };
  timestamp?: number;
}

/** Payload de estado de mensaje */
interface MetaStatusEvent {
  id?: string;
  status?: string;
  timestamp?: number;
}

export class WebhookController {
  private citaRespuestaService = new CitaRespuestaWhatsAppService();
  private whatsappService = new WhatsAppService();
  private conversacionRepo = new ConversacionRepositoryPostgres();

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
      res.status(200).send(challenge as any);
    } else {
      console.error(`[${plataforma} WEBHOOK] ❌ Verificación fallida`);
      res.status(403).send('Forbidden');
    }
  }

  /**
   * Recibe webhooks de WhatsApp Business API
   * POST /api/webhooks/whatsapp
   */
  async recibirWebhookWhatsApp(req: Request, res: Response): Promise<void> {
    try {
      const signature = String(req.headers['x-hub-signature-256'] || '');
      if (!this.verificarFirma(req, signature, String(process.env.META_APP_SECRET || ''))) {
        console.error('[WHATSAPP WEBHOOK] ❌ Firma inválida');
        res.status(403).send('Forbidden');
        return;
      }

      const { entry } = req.body;
      console.log('[WHATSAPP WEBHOOK] 📩 Recibido:', JSON.stringify(entry, null, 2));

      for (const cambio of entry || []) {
        for (const value of cambio.changes || []) {
          if (value.value?.messages) {
            for (const mensaje of value.value.messages) {
              await this.procesarMensajeWhatsApp(mensaje as WhatsAppMensaje, value.value.metadata as Record<string, unknown>);
            }
          }

          if (value.value?.statuses) {
            for (const status of value.value.statuses) {
              await this.procesarEstadoMensaje(status as MetaStatusEvent, 'whatsapp');
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
   */
  async recibirWebhookFacebook(req: Request, res: Response): Promise<void> {
    try {
      const signature = String(req.headers['x-hub-signature-256'] || '');
      if (!this.verificarFirma(req, signature, String(process.env.META_APP_SECRET || ''))) {
        console.error('[FACEBOOK WEBHOOK] ❌ Firma inválida');
        res.status(403).send('Forbidden');
        return;
      }

      const { entry } = req.body;
      console.log('[FACEBOOK WEBHOOK] 📩 Recibido:', JSON.stringify(entry, null, 2));

      for (const page of entry || []) {
        for (const event of page.messaging || []) {
          if (event.message) {
            await this.procesarMensajeFacebook(event as MetaMessagingEvent);
          }
          if ((event as any).read && event.sender?.id) {
            await this.procesarLecturaMensaje(String(event.sender.id), 'facebook');
          }
          if ((event as any).delivery && event.sender?.id) {
            await this.procesarEntregaMensaje(String(event.sender.id), 'facebook');
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
   */
  async recibirWebhookInstagram(req: Request, res: Response): Promise<void> {
    try {
      const signature = String(req.headers['x-hub-signature-256'] || '');
      if (!this.verificarFirma(req, signature, String(process.env.META_APP_SECRET || ''))) {
        console.error('[INSTAGRAM WEBHOOK] ❌ Firma inválida');
        res.status(403).send('Forbidden');
        return;
      }

      const { entry } = req.body;
      console.log('[INSTAGRAM WEBHOOK] 📩 Recibido:', JSON.stringify(entry, null, 2));

      for (const page of entry || []) {
        for (const event of page.messaging || []) {
          if (event.message) {
            await this.procesarMensajeInstagram(event as MetaMessagingEvent);
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
  private verificarFirma(req: Request, signature: string, secret: string): boolean {
    if (!signature) return false;
    try {
      const signatureHash = signature.split('sha256=')[1];

      let dataToSign: Buffer | null = null;
      const anyReq = req as any;
      if (anyReq.rawBody && Buffer.isBuffer(anyReq.rawBody)) {
        dataToSign = anyReq.rawBody as Buffer;
      } else if (anyReq.body && anyReq.body.rawBody && Buffer.isBuffer(anyReq.body.rawBody)) {
        dataToSign = anyReq.body.rawBody as Buffer;
      }

      if (!dataToSign) {
        dataToSign = Buffer.from(JSON.stringify(req.body || {}));
      }

      const expectedHash = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

      const sigBuf = Buffer.from(signatureHash, 'hex');
      const expBuf = Buffer.from(expectedHash, 'hex');

      if (sigBuf.length !== expBuf.length) {
        console.error('[WEBHOOK] Firma inválida: longitudes diferentes');
        console.error('[WEBHOOK] header signature:', signature);
        console.error('[WEBHOOK] expected hash:', expectedHash);
        try { console.error('[WEBHOOK] rawBody:', dataToSign.toString('utf8').slice(0,1000)); } catch(e){}
        return false;
      }

      const valid = crypto.timingSafeEqual(sigBuf, expBuf);
      if (!valid) {
        console.error('[WEBHOOK] Firma inválida: hashes no coinciden');
        console.error('[WEBHOOK] header signature:', signature);
        console.error('[WEBHOOK] expected hash:', expectedHash);
        try { console.error('[WEBHOOK] rawBody:', dataToSign.toString('utf8').slice(0,1000)); } catch(e){}
      }
      return valid;
    } catch (err) {
      console.error('[WEBHOOK] Error verificando firma:', err);
      return false;
    }
  }

  /**
   * Procesa mensaje entrante de WhatsApp
   */
  private async procesarMensajeWhatsApp(mensaje: WhatsAppMensaje, _metadata: Record<string, unknown>): Promise<void> {
    const texto = mensaje.text?.body ?? '';
    const from = String(mensaje.from ?? '');

    console.log('[WHATSAPP] Procesando mensaje:', {
      id: mensaje.id,
      from,
      tipo: mensaje.type,
      texto,
    });

    try {
      const resultado = await this.citaRespuestaService.procesarRespuesta(from, texto);
      if (resultado.accion !== 'ninguna' && resultado.mensaje) {
        await this.whatsappService.enviarMensaje({
          to: from.startsWith('+') ? from : `+${from}`,
          body: resultado.mensaje,
        });
      }
    } catch (err) {
      console.warn('[WHATSAPP] Error procesando respuesta cita:', err);
    }

    const mensajeDB = {
      id: mensaje.id,
      conversacionId: `wa-${from}`,
      canal: 'whatsapp',
      direccion: 'entrante',
      remitente: from,
      contenido: texto,
      tipo: mensaje.type,
      timestamp: new Date(parseInt(mensaje.timestamp ?? '0', 10) * 1000),
      estado: 'recibido',
    };
    console.log('[WHATSAPP] Mensaje procesado:', mensajeDB);
  }

  /**
   * Procesa mensaje entrante de Facebook Messenger
   */
  private async procesarMensajeFacebook(event: MetaMessagingEvent): Promise<void> {
    const senderId = event.sender?.id ?? '';
    const texto = event.message?.text ?? '';

    if (!senderId || !texto) return;

    console.log('[FACEBOOK] Procesando mensaje:', { senderId, texto });

    try {
      const { conversacionId, mensaje } = await this.conversacionRepo.asegurarConversacionYMensaje({
        canal: 'Facebook',
        canalId: senderId,
        contenido: texto,
        tipoMensaje: 'texto',
      });

      try {
        const socket = SocketService.getInstance();
        socket.emitNuevoMensaje(conversacionId, {
          id: mensaje.id,
          contenido: mensaje.contenido,
          tipo: mensaje.tipoMensaje,
          esDeKeila: false,
          timestamp: mensaje.fechaEnvio,
        });
        socket.broadcast('matrix:conversacion:actualizada', { conversacionId });
      } catch {
        /* Socket no inicializado */
      }

      console.log('[FACEBOOK] ✅ Mensaje guardado en DB');
    } catch (err) {
      console.error('[FACEBOOK] Error guardando en DB:', err);
    }
  }

  /**
   * Procesa mensaje entrante de Instagram
   */
  private async procesarMensajeInstagram(event: MetaMessagingEvent): Promise<void> {
    const senderId = event.sender?.id ?? '';
    const texto = event.message?.text ?? '';

    if (!senderId || !texto) return;

    console.log('[INSTAGRAM] Procesando mensaje:', { senderId, texto });

    try {
      const { conversacionId, mensaje } = await this.conversacionRepo.asegurarConversacionYMensaje({
        canal: 'Instagram',
        canalId: senderId,
        contenido: texto,
        tipoMensaje: 'texto',
      });

      try {
        const socket = SocketService.getInstance();
        socket.emitNuevoMensaje(conversacionId, {
          id: mensaje.id,
          contenido: mensaje.contenido,
          tipo: mensaje.tipoMensaje,
          esDeKeila: false,
          timestamp: mensaje.fechaEnvio,
        });
        socket.broadcast('matrix:conversacion:actualizada', { conversacionId });
      } catch {
        /* Socket no inicializado */
      }

      console.log('[INSTAGRAM] ✅ Mensaje guardado en DB');
    } catch (err) {
      console.error('[INSTAGRAM] Error guardando en DB:', err);
    }
  }

  /**
   * Procesa cambios de estado de mensaje (entregado, leído, fallido)
   */
  private async procesarEstadoMensaje(status: MetaStatusEvent, canal: string): Promise<void> {
    console.log(`[${canal.toUpperCase()}] Estado mensaje:`, {
      id: status.id,
      estado: status.status,
      timestamp: status.timestamp,
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
