/**
 * Rutas: Importación/Exportación
 * Endpoints para import/export de datos
 */

import { Router } from 'express';
import { ImportExportController } from '../controllers/ImportExportController';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();
const controller = new ImportExportController();

// Middleware de upload
const uploadMiddleware = controller.getUploadMiddleware();

/**
 * GET /api/import-export/exportar/pacientes
 * Exportar pacientes a CSV o Excel
 * @query formato - "csv" o "excel" (default: csv)
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/exportar/pacientes',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  controller.exportarPacientes
);

/**
 * POST /api/import-export/importar/pacientes
 * Importar pacientes desde CSV o Excel
 * @body file - Archivo CSV o Excel
 */
router.post(
  '/importar/pacientes',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  uploadMiddleware,
  controller.importarPacientes
);

/**
 * GET /api/import-export/plantilla/pacientes
 * Descargar plantilla de importación de pacientes
 * @query formato - "csv" o "excel" (default: csv)
 */
router.get(
  '/plantilla/pacientes',
  autenticar,
  controller.descargarPlantillaPacientes
);

/**
 * GET /api/import-export/exportar/citas
 * Exportar citas a CSV o Excel
 * @query formato - "csv" o "excel" (default: csv)
 * @query fechaDesde - Filtrar desde fecha (opcional)
 * @query fechaHasta - Filtrar hasta fecha (opcional)
 * @query sucursalId - Filtrar por sucursal (opcional)
 */
router.get(
  '/exportar/citas',
  autenticar,
  requiereRol(['Admin', 'Supervisor']),
  controller.exportarCitas
);

export default router;
