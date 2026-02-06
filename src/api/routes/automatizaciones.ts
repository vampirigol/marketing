import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new AutomationController();

router.get('/reglas', autenticar, (req, res) => controller.listarReglas(req, res));
router.post('/reglas', autenticar, (req, res) => controller.crearRegla(req, res));
router.put('/reglas/:id', autenticar, (req, res) => controller.actualizarRegla(req, res));
router.delete('/reglas/:id', autenticar, (req, res) => controller.eliminarRegla(req, res));

router.get('/logs', autenticar, (req, res) => controller.listarLogs(req, res));
router.post('/ejecutar', autenticar, (req, res) => controller.ejecutar(req, res));

export default router;
