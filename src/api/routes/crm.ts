import { Router } from 'express';
import { CrmController } from '../controllers/CrmController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new CrmController();

router.get('/leads', autenticar, (req, res) => controller.obtenerLeads(req, res));
router.put('/leads/:id', autenticar, (req, res) => controller.actualizarLead(req, res));

export default router;
