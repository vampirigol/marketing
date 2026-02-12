import { Router } from 'express';
import { MetaConfigController } from '../controllers/MetaConfigController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new MetaConfigController();

/**
 * Configuración de integración con Meta (Facebook / Instagram)
 * Para que los mensajes aparezcan en Keila IA (Matrix)
 *
 * Permisos Meta: pages_show_list, pages_messaging, pages_manage_metadata
 */

router.get('/canales-conectados', autenticar, (req, res) => controller.obtenerCanalesConectados(req, res));
router.post('/suscribir-pagina', (req, res) => controller.suscribirPagina(req, res));
router.get('/suscripciones-pagina', (req, res) => controller.obtenerSuscripcionesPagina(req, res));
router.get('/suscripciones-app', (req, res) => controller.obtenerSuscripcionesApp(req, res));
router.get('/paginas', (req, res) => controller.obtenerPaginas(req, res));
router.get('/verificar-token', (req, res) => controller.verificarTokenPagina(req, res));

export default router;
