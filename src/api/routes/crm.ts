import { Router } from 'express';
import { CrmController } from '../controllers/CrmController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new CrmController();

router.get('/leads', autenticar, (req, res) => controller.obtenerLeads(req, res));
router.get('/lista-recuperacion', autenticar, (req, res) => controller.obtenerListaRecuperacion(req, res));
router.get('/pipeline', autenticar, (req, res) => controller.obtenerPipeline(req, res));
router.put('/leads/:id', autenticar, (req, res) => controller.actualizarLead(req, res));
router.put('/leads/:id/lead-status', autenticar, (req, res) => controller.actualizarLeadStatus(req, res));
router.post('/sync-citas', autenticar, (req, res) => controller.sincronizarCitas(req, res));

export default router;
