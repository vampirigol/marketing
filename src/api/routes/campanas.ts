/**
 * Rutas: Campañas Esporádicas
 * Endpoints para broadcast manual
 */

import { Router } from 'express';
import { CampanaController } from '../controllers/CampanaController';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();
const controller = new CampanaController();

// Todas las rutas requieren autenticación y rol Admin o Supervisor

/**
 * POST /api/campanas
 * Crear nueva campaña de broadcast
 */
router.post(
  '/',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  controller.crear
);

/**
 * GET /api/campanas
 * Listar todas las campañas
 */
router.get(
  '/',
  autenticar,
  requiereRol(['Admin', 'Supervisor', 'Contact_Center']),
  controller.listar
);

/**
 * GET /api/campanas/:id
 * Obtener campaña por ID
 */
router.get(
  '/:id',
  autenticar,
  requiereRol(['Admin', 'Supervisor', 'Contact_Center']),
  controller.obtenerPorId
);

/**
 * POST /api/campanas/:id/ejecutar
 * Ejecutar campaña (envío inmediato)
 */
router.post(
  '/:id/ejecutar',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  controller.ejecutar
);

/**
 * POST /api/campanas/:id/cancelar
 * Cancelar campaña
 */
router.post(
  '/:id/cancelar',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  controller.cancelar
);

/**
 * POST /api/campanas/:id/duplicar
 * Duplicar campaña existente
 */
router.post(
  '/:id/duplicar',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  controller.duplicar
);

export default router;
