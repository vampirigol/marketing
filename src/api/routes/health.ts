import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const controller = new HealthController();

router.get('/panel', (req, res) => controller.panel(req, res));

export default router;
