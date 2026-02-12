import { Router } from 'express';
import bloqueosController from '../controllers/BloqueoDoctorController';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();

router.get('/', autenticar, requiereRol('Medico', 'Admin', 'Supervisor'), bloqueosController.listar);
router.post('/', autenticar, requiereRol('Medico', 'Admin', 'Supervisor'), bloqueosController.crear);
router.delete('/:id', autenticar, requiereRol('Medico', 'Admin', 'Supervisor'), bloqueosController.eliminar);

export default router;
