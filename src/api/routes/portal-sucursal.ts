import { Router } from 'express';
import portalController from '../controllers/PortalSucursalController';
import { autenticar } from '../middleware/auth';
import { adminOSupervisor } from '../middleware/authorization';

const router = Router();

router.get('/noticias', autenticar, portalController.obtenerNoticias);
router.post('/noticias', autenticar, adminOSupervisor, portalController.crearNoticia);
router.get('/tareas', autenticar, portalController.obtenerTareas);
router.post('/tareas', autenticar, adminOSupervisor, portalController.crearTarea);
router.post('/tareas/:id/recibir', autenticar, portalController.recibirTarea);
router.post('/tareas/:id/iniciar', autenticar, portalController.iniciarTarea);
router.post('/tareas/:id/terminar', autenticar, portalController.terminarTarea);
router.post('/tareas/:id/comentarios', autenticar, portalController.agregarComentario);
router.post('/tareas/:id/evidencias', autenticar, portalController.agregarEvidencia);

export default router;
