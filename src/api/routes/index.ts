import { Router } from 'express';
import pacientesRoutes from './pacientes';
import citasRoutes from './citas';
import abonosRoutes from './abonos';
import matrixRoutes from './matrix';
import webhooksRoutes from './webhooks';
import inasistenciasRoutes from './inasistencias';
import openTicketsRoutes from './openTickets.routes';
import catalogoRoutes from './catalogo';
import contactosRoutes from './contactos';
import authRoutes from './auth';
import segmentacionRoutes from './segmentacion';
import campanasRoutes from './campanas';
import importExportRoutes from './import-export';

const router = Router();

/**
 * Rutas principales del API
 * Todas las rutas están prefijadas con /api
 */

// Autenticación (público)
router.use('/auth', authRoutes);

// Rutas protegidas
router.use('/pacientes', pacientesRoutes);
router.use('/citas', citasRoutes);
router.use('/abonos', abonosRoutes);
router.use('/matrix', matrixRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/inasistencias', inasistenciasRoutes);
router.use('/open-tickets', openTicketsRoutes);
router.use('/catalogo', catalogoRoutes);
router.use('/contactos', contactosRoutes);
router.use('/segmentacion', segmentacionRoutes);
router.use('/campanas', campanasRoutes);
router.use('/import-export', importExportRoutes);

/**
 * Ruta de prueba de conexión
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

export default router;
