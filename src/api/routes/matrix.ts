import { Router } from 'express';
import { MatrixController } from '../controllers/MatrixController';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();
const controller = new MatrixController();
const accesoMatrix = requiereRol('Admin', 'Supervisor', 'Recepcion', 'Medico', 'Contact_Center');
const accesoOperacionMatrix = requiereRol('Admin', 'Supervisor', 'Contact_Center', 'Medico');

/**
 * @route GET /api/matrix/conversaciones
 * @desc Obtiene todas las conversaciones activas
 * @query canal - Filtrar por canal (whatsapp, facebook, instagram)
 * @query estado - Filtrar por estado (activa, pendiente, cerrada)
 * @query busqueda - Buscar por nombre o mensaje
 * @access Privado (Keila, Admin)
 */
router.get('/conversaciones', autenticar, accesoMatrix, (req, res) =>
  controller.obtenerConversaciones(req, res)
);

/**
 * @route GET /api/matrix/conversaciones/:id
 * @desc Obtiene una conversación específica con todos sus mensajes
 * @access Privado (Keila, Admin)
 */
router.get('/conversaciones/:id', autenticar, accesoMatrix, (req, res) =>
  controller.obtenerConversacion(req, res)
);

/**
 * @route POST /api/matrix/conversaciones/:id/mensajes
 * @desc Envía un mensaje en una conversación
 * @body { contenido, tipo }
 * @access Privado (Keila, Admin)
 */
router.post('/conversaciones/:id/mensajes', autenticar, accesoOperacionMatrix, (req, res) =>
  controller.enviarMensaje(req, res)
);

/**
 * @route PUT /api/matrix/conversaciones/:id/leer
 * @desc Marca conversación como leída
 * @access Privado (Keila, Admin)
 */
router.put('/conversaciones/:id/leer', autenticar, accesoOperacionMatrix, (req, res) =>
  controller.marcarComoLeida(req, res)
);

/**
 * @route PUT /api/matrix/conversaciones/:id/estado
 * @desc Cambia el estado de una conversación
 * @body { estado }
 * @access Privado (Keila, Admin)
 */
router.put('/conversaciones/:id/estado', autenticar, requiereRol('Admin', 'Supervisor', 'Contact_Center'), (req, res) =>
  controller.cambiarEstado(req, res)
);

/**
 * @route POST /api/matrix/conversaciones/:id/etiquetas
 * @desc Agrega una etiqueta a la conversación
 * @body { etiqueta }
 * @access Privado (Keila, Admin)
 */
router.post('/conversaciones/:id/etiquetas', autenticar, requiereRol('Admin', 'Supervisor', 'Contact_Center'), (req, res) =>
  controller.agregarEtiqueta(req, res)
);

/**
 * @route DELETE /api/matrix/conversaciones/:id/etiquetas/:etiqueta
 * @desc Elimina una etiqueta de la conversación
 * @access Privado (Keila, Admin)
 */
router.delete('/conversaciones/:id/etiquetas/:etiqueta', autenticar, requiereRol('Admin', 'Supervisor', 'Contact_Center'), (req, res) =>
  controller.eliminarEtiqueta(req, res)
);

/**
 * @route PUT /api/matrix/conversaciones/:id/paciente
 * @desc Vincula conversación con un paciente
 * @body { pacienteId }
 * @access Privado (Keila, Admin)
 */
router.put('/conversaciones/:id/paciente', autenticar, requiereRol('Admin', 'Supervisor', 'Contact_Center'), (req, res) =>
  controller.vincularPaciente(req, res)
);

/**
 * @route PUT /api/matrix/conversaciones/:id/prioridad
 * @desc Cambia la prioridad de una conversación
 * @body { prioridad }
 * @access Privado (Keila, Admin, Medico)
 */
router.put('/conversaciones/:id/prioridad', autenticar, accesoOperacionMatrix, (req, res) =>
  controller.cambiarPrioridad(req, res)
);

/**
 * @route PUT /api/matrix/conversaciones/:id/asignar
 * @desc Asigna o escala conversación a otro usuario
 * @body { usuarioId }
 * @access Privado (Keila, Admin, Medico)
 */
router.put('/conversaciones/:id/asignar', autenticar, accesoOperacionMatrix, (req, res) =>
  controller.asignarConversacion(req, res)
);

/**
 * @route GET /api/matrix/plantillas
 * @desc Obtiene plantillas de respuestas rápidas
 * @access Privado (Keila, Admin, Medico)
 */
router.get('/plantillas', autenticar, accesoOperacionMatrix, (req, res) =>
  controller.obtenerPlantillas(req, res)
);

/**
 * @route POST /api/matrix/plantillas
 * @desc Crea una nueva plantilla de respuesta
 * @body { nombre, contenido, etiquetas, esGlobal }
 * @access Privado (Keila, Admin, Medico)
 */
router.post('/plantillas', autenticar, accesoOperacionMatrix, (req, res) =>
  controller.crearPlantilla(req, res)
);

/**
 * @route GET /api/matrix/estadisticas
 * @desc Obtiene estadísticas del Contact Center
 * @access Privado (Keila, Admin, Gerencia)
 */
router.get('/estadisticas', autenticar, requiereRol('Admin', 'Supervisor', 'Contact_Center'), (req, res) =>
  controller.obtenerEstadisticas(req, res)
);

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
 
/**
 * @route GET /api/matrix/sync-meta
 * @desc Sincroniza conversaciones históricas desde Meta (Facebook/Instagram)
 * @access Privado (Keila, Admin)
 */
router.get('/sync-meta', autenticar, accesoMatrix, (req, res) =>
  controller.sincronizarConversacionesMeta(req, res)
);

export default router;
