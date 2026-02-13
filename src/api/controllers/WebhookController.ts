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
  // ...definición de la interfaz aquí...
}

import { Request, Response } from 'express';
import crypto from 'crypto';
import Database from '../../infrastructure/database/Database';
import { Server as SocketIOServer } from 'socket.io';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN;
const SIGNATURE_HEADER = 'x-hub-signature';

export class WebhookController {
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
      this.io = io;
    }

    // GET /api/meta/webhook (verificación de Meta)
    verifyWebhook(req: Request, res: Response) {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      }
      return res.status(403).send('Forbidden');
    }

    // POST /api/meta/webhook (recepción de mensajes)
    async receiveWebhook(req: Request, res: Response) {
      // Seguridad: Verificar firma X-Hub-Signature
      const signature = req.headers[SIGNATURE_HEADER] as string;
      if (signature && !this.verifySignature(req.rawBody, signature)) {
        return res.status(401).send('Invalid signature');
      }

      const body = req.body;
      try {
        // Detectar canal
        let canal = '';
        let canal_id = '';
        let mensaje = {
          remitente: '',
          direccion: 'entrante',
          tipo: '',
          contenido: '',
          meta_message_id: '',
          estado: 'enviado',
          fecha_hora: new Date(),
        };
        // WhatsApp
        if (body.object === 'whatsapp_business_account') {
          canal = 'whatsapp';
          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0]?.value;
          const msg = changes?.messages?.[0];
          if (msg) {
            canal_id = msg.from;
            mensaje.remitente = msg.from;
            mensaje.tipo = msg.type;
            mensaje.meta_message_id = msg.id || msg['wamid'];
            if (msg.type === 'text') mensaje.contenido = msg.text.body;
            if (msg.type === 'image') mensaje.contenido = msg.image?.link;
            if (msg.type === 'audio') mensaje.contenido = msg.audio?.link;
            if (msg.type === 'document') mensaje.contenido = msg.document?.link;
          }
        }
        // Facebook Messenger
        else if (body.object === 'page') {
          canal = 'facebook';
          const entry = body.entry?.[0];
          const messaging = entry?.messaging?.[0];
          if (messaging) {
            canal_id = messaging.sender.id;
            mensaje.remitente = messaging.sender.id;
            mensaje.tipo = messaging.message?.text ? 'text' : messaging.message?.attachments?.[0]?.type;
            mensaje.meta_message_id = messaging.message?.mid;
            mensaje.contenido = messaging.message?.text || messaging.message?.attachments?.[0]?.payload?.url;
          }
        }
        // Instagram
        else if (body.object === 'instagram') {
          canal = 'instagram';
          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0]?.value;
          const msg = changes?.messages?.[0];
          if (msg) {
            canal_id = msg.from;
            mensaje.remitente = msg.from;
            mensaje.tipo = msg.type;
            mensaje.meta_message_id = msg.id;
            if (msg.type === 'text') mensaje.contenido = msg.text.body;
            if (msg.type === 'image') mensaje.contenido = msg.image?.link;
            if (msg.type === 'audio') mensaje.contenido = msg.audio?.link;
            if (msg.type === 'document') mensaje.contenido = msg.document?.link;
          }
        }
        // Normalización y Upsert de conversación
        if (!canal || !canal_id || !mensaje.meta_message_id) {
          return res.status(200).send('No message');
        }
        // Upsert conversación
        const db = Database.instance || new Database();
        const pool = db.getPool();
        const convRes = await pool.query(
          `INSERT INTO conversaciones (canal, canal_id, nombre_contacto, ultimo_mensaje, fecha_ultimo_mensaje, mensajes_no_leidos, estado)
           VALUES ($1, $2, '', $3, $4, 1, 'abierto')
           ON CONFLICT (canal_id) DO UPDATE SET ultimo_mensaje = $3, fecha_ultimo_mensaje = $4, mensajes_no_leidos = conversaciones.mensajes_no_leidos + 1
           RETURNING id`,
          [canal, canal_id, mensaje.contenido, mensaje.fecha_hora]
        );
        const conversacion_id = convRes.rows[0].id;
        // Guardar mensaje
        await pool.query(
          `INSERT INTO mensajes (conversacion_id, remitente, direccion, tipo, contenido, meta_message_id, estado, fecha_hora)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (meta_message_id) DO NOTHING`,
          [conversacion_id, mensaje.remitente, mensaje.direccion, mensaje.tipo, mensaje.contenido, mensaje.meta_message_id, mensaje.estado, mensaje.fecha_hora]
        );
        // Emitir evento tiempo real
        this.io.emit('mensaje_nuevo', { conversacion_id, ...mensaje });
        return res.status(200).send('OK');
      } catch (err) {
        console.error('Error en webhook:', err);
        return res.status(500).send('Internal error');
      }
    }

    // Verifica la firma de Meta
    verifySignature(rawBody: Buffer, signature: string): boolean {
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) return false;
      const expected = 'sha1=' + crypto.createHmac('sha1', appSecret).update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
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
