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
import automatizacionesRoutes from './automatizaciones';
import crmRoutes from './crm';
import sucursalesRoutes from './sucursales';
import auditoriaRoutes from './auditoria';
import healthRoutes from './health';
import portalSucursalRoutes from './portal-sucursal';
import bloqueosDoctorRoutes from './bloqueos-doctor';
import configConsultasRoutes from './config-consultas';
import metricasRoutes from './metricas';
import historialClinicoRoutes from './historial-clinico';
import recetasRoutes from './recetas';
import ordenesLaboratorioRoutes from './ordenes-laboratorio';
import notificacionesRoutes from './notificaciones';
import integracionLaboratoriosRoutes from './integracion-laboratorios';
import archivosPacienteRoutes from './archivos-paciente';
import uploadRoutes from './upload';
import calendarioRoutes from './calendario';
import brigadasRoutes from './brigadas';
import metaConfigRoutes from './meta-config';

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
router.use('/automatizaciones', automatizacionesRoutes);
router.use('/crm', crmRoutes);
router.use('/portal', portalSucursalRoutes);
router.use('/bloqueos-doctor', bloqueosDoctorRoutes);
router.use('/config-consultas', configConsultasRoutes);
router.use('/metricas', metricasRoutes);
router.use('/historial-clinico', historialClinicoRoutes);
router.use('/recetas', recetasRoutes);
router.use('/ordenes-laboratorio', ordenesLaboratorioRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/integracion-laboratorios', integracionLaboratoriosRoutes);
router.use('/archivos-paciente', archivosPacienteRoutes);
router.use('/sucursales', sucursalesRoutes);
router.use('/upload', uploadRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/calendario', calendarioRoutes);
router.use('/brigadas', brigadasRoutes);
router.use('/meta-config', metaConfigRoutes);
router.use('/health', healthRoutes);

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
