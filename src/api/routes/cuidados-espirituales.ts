import { Router } from 'express';
import { CuidadosEspiritualesController } from '../controllers/CuidadosEspiritualesController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new CuidadosEspiritualesController();

router.use(autenticar);

/**
 * GET /api/cuidados-espirituales/kpi
 * Total de atendidos (opcional: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD)
 */
router.get('/kpi', (req, res) => controller.kpi(req, res));

/**
 * GET /api/cuidados-espirituales/paciente/:pacienteId
 * Estado del paciente (hasAttended, ultimaAsistencia)
 */
router.get('/paciente/:pacienteId', (req, res) => controller.estadoPaciente(req, res));

/**
 * POST /api/cuidados-espirituales/paciente/:pacienteId/marcar-asistencia
 * Marcar que el paciente asistió a Cuidados Espirituales
 */
router.post('/paciente/:pacienteId/marcar-asistencia', (req, res) => controller.marcarAsistencia(req, res));

export default router;
