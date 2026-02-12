import { Router } from 'express';
import { SucursalController } from '../controllers/SucursalController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new SucursalController();

/** Público: listado mínimo para formulario de reserva */
router.get('/public', (req, res) => controller.listarPublico(req, res));

router.get('/', autenticar, (req, res) => controller.listar(req, res));

export default router;
