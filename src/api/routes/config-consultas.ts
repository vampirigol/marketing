import { Router } from 'express';
import { ConfigConsultasController } from '../controllers/ConfigConsultasController';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();
const controller = new ConfigConsultasController();

/**
 * @route GET /api/config-consultas
 * @desc Obtiene todas las configuraciones de consultas activas
 * @access Privado (Medico, Admin)
 */
router.get('/', autenticar, requiereRol('Admin', 'Supervisor', 'Medico'), (req, res) =>
  controller.obtenerTodas(req, res)
);

/**
 * @route GET /api/config-consultas/:especialidad
 * @desc Obtiene configuraciones por especialidad
 * @access Privado (Medico, Admin)
 */
router.get('/:especialidad', autenticar, requiereRol('Admin', 'Supervisor', 'Medico'), (req, res) =>
  controller.obtenerPorEspecialidad(req, res)
);

/**
 * @route PUT /api/config-consultas/:id
 * @desc Actualiza configuración de consulta
 * @access Privado (Admin)
 */
router.put('/:id', autenticar, requiereRol('Admin'), (req, res) =>
  controller.actualizar(req, res)
);

export default router;
