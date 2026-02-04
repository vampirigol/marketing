/**
 * Rutas de Webhooks
 * 
 * Endpoints para recibir eventos de WhatsApp, Facebook e Instagram.
 * Estos webhooks son configurados en Meta Developers Console.
 * 
 * CONFIGURACIÓN EN META:
 * 1. Ir a https://developers.facebook.com/apps/
 * 2. Seleccionar tu App → Productos → WhatsApp/Messenger/Instagram
 * 3. Webhooks → Configurar → URL de devolución de llamada
 * 4. URLs:
 *    - WhatsApp: https://tu-dominio.com/api/webhooks/whatsapp
 *    - Facebook: https://tu-dominio.com/api/webhooks/facebook
 *    - Instagram: https://tu-dominio.com/api/webhooks/instagram
 * 5. Token de verificación: mismo que en .env (WHATSAPP_VERIFY_TOKEN, etc.)
 * 6. Suscribirse a campos: messages, message_status, account_alerts
 */

import { Router } from 'express';
import webhookController from '../controllers/WebhookController';

const router = Router();

// ===============================================
// WHATSAPP BUSINESS API WEBHOOKS
// ===============================================

/**
 * GET /api/webhooks/whatsapp
 * Verificación inicial del webhook (Meta envía esto al configurar)
 */
router.get('/whatsapp', (req, res) => {
  webhookController.verificarWebhook(req, res);
});

/**
 * POST /api/webhooks/whatsapp
 * Recibe eventos de WhatsApp:
 * - Mensajes entrantes de pacientes
 * - Estados de mensajes (entregado, leído, fallido)
 * - Alertas de cuenta
 */
router.post('/whatsapp', async (req, res) => {
  await webhookController.recibirWebhookWhatsApp(req, res);
});

// ===============================================
// FACEBOOK MESSENGER WEBHOOKS
// ===============================================

/**
 * GET /api/webhooks/facebook
 * Verificación inicial del webhook
 */
router.get('/facebook', (req, res) => {
  webhookController.verificarWebhook(req, res);
});

/**
 * POST /api/webhooks/facebook
 * Recibe eventos de Facebook Messenger:
 * - Mensajes entrantes
 * - Confirmaciones de lectura
 * - Entregas de mensajes
 */
router.post('/facebook', async (req, res) => {
  await webhookController.recibirWebhookFacebook(req, res);
});

// ===============================================
// INSTAGRAM DIRECT WEBHOOKS
// ===============================================

/**
 * GET /api/webhooks/instagram
 * Verificación inicial del webhook
 */
router.get('/instagram', (req, res) => {
  webhookController.verificarWebhook(req, res);
});

/**
 * POST /api/webhooks/instagram
 * Recibe eventos de Instagram Direct:
 * - Mensajes directos entrantes
 * - Reacciones a mensajes
 * - Menciones en historias
 */
router.post('/instagram', async (req, res) => {
  await webhookController.recibirWebhookInstagram(req, res);
});

export default router;
