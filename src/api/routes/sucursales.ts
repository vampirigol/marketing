import { Router } from 'express';
import { SucursalController } from '../controllers/SucursalController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new SucursalController();

router.get('/', autenticar, (req, res) => controller.listar(req, res));

export default router;
