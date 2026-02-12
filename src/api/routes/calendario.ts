import { Router } from 'express';
import { CalendarioController } from '../controllers/CalendarioController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new CalendarioController();

router.use(autenticar);

router.get('/eventos', (req, res) => controller.listarEventos(req, res));
router.post('/eventos', (req, res) => controller.crearEvento(req, res));
router.get('/eventos/:id', (req, res) => controller.obtenerEvento(req, res));
router.put('/eventos/:id', (req, res) => controller.actualizarEvento(req, res));
router.delete('/eventos/:id', (req, res) => controller.eliminarEvento(req, res));

export default router;
