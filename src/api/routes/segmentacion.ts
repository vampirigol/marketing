/**
 * Rutas: Segmentación de Pacientes
 * Endpoints para clasificar y filtrar pacientes
 */

import { Router } from 'express';
import { SegmentacionController } from '../controllers/SegmentacionController';
import { autenticar } from '../middleware/auth';
import { requierePermiso } from '../middleware/authorization';

const router = Router();
const controller = new SegmentacionController();

// Todas las rutas requieren autenticación y permiso de lectura de pacientes

/**
 * GET /api/segmentacion/estadisticas
 * Obtener estadísticas de segmentación
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/estadisticas',
  autenticar,
  requierePermiso('pacientes', 'leer'),
  controller.obtenerEstadisticas
);

/**
 * GET /api/segmentacion/segmento/:tipo
 * Filtrar pacientes por segmento
 * @param tipo - "Nunca atendido" | "1 vez" | "Múltiples"
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/segmento/:tipo',
  autenticar,
  requierePermiso('pacientes', 'leer'),
  controller.filtrarPorSegmento
);

/**
 * GET /api/segmentacion/alto-valor
 * Obtener pacientes de alto valor (Múltiples + alto gasto)
 * @query umbral - Umbral de valor de vida (default: 5000)
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/alto-valor',
  autenticar,
  requierePermiso('pacientes', 'leer'),
  controller.obtenerAltoValor
);

/**
 * GET /api/segmentacion/riesgo-abandono
 * Pacientes con 1 cita sin regresar en los últimos X meses
 * @query meses - Meses sin cita (default: 6)
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/riesgo-abandono',
  autenticar,
  requierePermiso('pacientes', 'leer'),
  controller.obtenerRiesgoAbandono
);

/**
 * GET /api/segmentacion/leads-frios
 * Leads nunca atendidos registrados hace más de X días
 * @query dias - Días desde registro (default: 30)
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/leads-frios',
  autenticar,
  requierePermiso('pacientes', 'leer'),
  controller.obtenerLeadsFrios
);

/**
 * GET /api/segmentacion/paciente/:id
 * Obtener segmentación de un paciente específico
 * @param id - ID del paciente
 */
router.get(
  '/paciente/:id',
  autenticar,
  requierePermiso('pacientes', 'leer'),
  controller.segmentarPaciente
);

export default router;
