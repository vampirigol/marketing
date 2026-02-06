import { Router } from 'express';
import { AuditoriaController } from '../controllers/AuditoriaController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new AuditoriaController();

router.get('/', autenticar, (req, res) => controller.listar(req, res));

export default router;
