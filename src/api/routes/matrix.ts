import { Router } from 'express';
import { MatrixController } from '../controllers/MatrixController';

const router = Router();
const controller = new MatrixController();

/**
 * @route GET /api/matrix/conversaciones
 * @desc Obtiene todas las conversaciones activas
 * @query canal - Filtrar por canal (whatsapp, facebook, instagram)
 * @query estado - Filtrar por estado (activa, pendiente, cerrada)
 * @query busqueda - Buscar por nombre o mensaje
 * @access Privado (Keila, Admin)
 */
router.get('/conversaciones', (req, res) => controller.obtenerConversaciones(req, res));

/**
 * @route GET /api/matrix/conversaciones/:id
 * @desc Obtiene una conversación específica con todos sus mensajes
 * @access Privado (Keila, Admin)
 */
router.get('/conversaciones/:id', (req, res) => controller.obtenerConversacion(req, res));

/**
 * @route POST /api/matrix/conversaciones/:id/mensajes
 * @desc Envía un mensaje en una conversación
 * @body { contenido, tipo }
 * @access Privado (Keila, Admin)
 */
router.post('/conversaciones/:id/mensajes', (req, res) => controller.enviarMensaje(req, res));

/**
 * @route PUT /api/matrix/conversaciones/:id/leer
 * @desc Marca conversación como leída
 * @access Privado (Keila, Admin)
 */
router.put('/conversaciones/:id/leer', (req, res) => controller.marcarComoLeida(req, res));

/**
 * @route PUT /api/matrix/conversaciones/:id/estado
 * @desc Cambia el estado de una conversación
 * @body { estado }
 * @access Privado (Keila, Admin)
 */
router.put('/conversaciones/:id/estado', (req, res) => controller.cambiarEstado(req, res));

/**
 * @route POST /api/matrix/conversaciones/:id/etiquetas
 * @desc Agrega una etiqueta a la conversación
 * @body { etiqueta }
 * @access Privado (Keila, Admin)
 */
router.post('/conversaciones/:id/etiquetas', (req, res) => controller.agregarEtiqueta(req, res));

/**
 * @route DELETE /api/matrix/conversaciones/:id/etiquetas/:etiqueta
 * @desc Elimina una etiqueta de la conversación
 * @access Privado (Keila, Admin)
 */
router.delete('/conversaciones/:id/etiquetas/:etiqueta', (req, res) => 
  controller.eliminarEtiqueta(req, res)
);

/**
 * @route PUT /api/matrix/conversaciones/:id/paciente
 * @desc Vincula conversación con un paciente
 * @body { pacienteId }
 * @access Privado (Keila, Admin)
 */
router.put('/conversaciones/:id/paciente', (req, res) => controller.vincularPaciente(req, res));

/**
 * @route GET /api/matrix/estadisticas
 * @desc Obtiene estadísticas del Contact Center
 * @access Privado (Keila, Admin, Gerencia)
 */
router.get('/estadisticas', (req, res) => controller.obtenerEstadisticas(req, res));

/**
 * @route POST /api/matrix/webhooks/whatsapp
 * @route GET /api/matrix/webhooks/whatsapp (verificación)
 * @desc Webhook para recibir mensajes de WhatsApp
 * @access Público (con verificación token)
 */
router.post('/webhooks/whatsapp', (req, res) => controller.webhookWhatsApp(req, res));
router.get('/webhooks/whatsapp', (req, res) => controller.webhookWhatsApp(req, res));

/**
 * @route POST /api/matrix/webhooks/facebook
 * @route GET /api/matrix/webhooks/facebook (verificación)
 * @desc Webhook para recibir mensajes de Facebook
 * @access Público (con verificación token)
 */
router.post('/webhooks/facebook', (req, res) => controller.webhookFacebook(req, res));
router.get('/webhooks/facebook', (req, res) => controller.webhookFacebook(req, res));

/**
 * @route POST /api/matrix/webhooks/instagram
 * @route GET /api/matrix/webhooks/instagram (verificación)
 * @desc Webhook para recibir mensajes de Instagram
 * @access Público (con verificación token)
 */
router.post('/webhooks/instagram', (req, res) => controller.webhookInstagram(req, res));
router.get('/webhooks/instagram', (req, res) => controller.webhookInstagram(req, res));

export default router;
