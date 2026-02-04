/**
 * Rutas: Inasistencias
 * Define los endpoints para la gestión de inasistencias
 */

import { Router } from 'express';
import { InasistenciaController } from '../controllers/InasistenciaController';
import { InMemoryInasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';
import { RemarketingService } from '../../infrastructure/remarketing/RemarketingService';
import { WhatsAppService } from '../../infrastructure/messaging/WhatsAppService';
import { FacebookService } from '../../infrastructure/messaging/FacebookService';
import { InstagramService } from '../../infrastructure/messaging/InstagramService';

const router = Router();

// Inicializar dependencias
const inasistenciaRepo = new InMemoryInasistenciaRepository();
const whatsappService = new WhatsAppService();
const facebookService = new FacebookService();
const instagramService = new InstagramService();
const remarketingService = new RemarketingService(
  inasistenciaRepo,
  whatsappService,
  facebookService,
  instagramService
);
const controller = new InasistenciaController(inasistenciaRepo, remarketingService);

/**
 * @route POST /api/inasistencias
 * @desc Registrar una nueva inasistencia
 * @body { citaId, pacienteId, sucursalId, fechaCitaPerdida, horaCitaPerdida, creadoPor }
 */
router.post('/', (req, res) => controller.registrar(req, res));

/**
 * @route GET /api/inasistencias/:id
 * @desc Obtener inasistencia por ID
 */
router.get('/:id', (req, res) => controller.obtenerPorId(req, res));

/**
 * @route POST /api/inasistencias/:id/motivo
 * @desc Asignar motivo a una inasistencia
 * @body { motivo, motivoDetalle?, asignadoPor }
 */
router.post('/:id/motivo', (req, res) => controller.asignarMotivo(req, res));

/**
 * @route POST /api/inasistencias/:id/contacto
 * @desc Registrar intento de contacto
 * @body { nota, exitoso, respuestaPaciente?, realizadoPor }
 */
router.post('/:id/contacto', (req, res) => controller.registrarContacto(req, res));

/**
 * @route POST /api/inasistencias/:id/reagendar
 * @desc Reagendar desde una inasistencia
 * @body { nuevaCitaId, fechaNuevaCita, horaNuevaCita, notasReagendacion?, realizadoPor }
 */
router.post('/:id/reagendar', (req, res) => controller.reagendar(req, res));

/**
 * @route GET /api/inasistencias/paciente/:pacienteId
 * @desc Obtener historial de inasistencias de un paciente
 */
router.get('/paciente/:pacienteId', (req, res) => controller.obtenerPorPaciente(req, res));

/**
 * @route GET /api/inasistencias/pendientes
 * @desc Obtener inasistencias pendientes de seguimiento
 * @query { sucursalId? }
 */
router.get('/lista/pendientes', (req, res) => controller.obtenerPendientes(req, res));

/**
 * @route GET /api/inasistencias/remarketing
 * @desc Obtener lista de remarketing
 * @query { sucursalId? }
 */
router.get('/lista/remarketing', (req, res) => controller.obtenerRemarketing(req, res));

/**
 * @route POST /api/inasistencias/remarketing/ejecutar
 * @desc Ejecutar campaña de remarketing
 * @body { inasistencias: string[], canal: 'WhatsApp' | 'Facebook' | 'Instagram' }
 */
router.post('/remarketing/ejecutar', (req, res) => controller.ejecutarRemarketing(req, res));

/**
 * @route GET /api/inasistencias/bloqueados
 * @desc Obtener pacientes bloqueados (raza brava)
 */
router.get('/lista/bloqueados', (req, res) => controller.obtenerBloqueados(req, res));

/**
 * @route POST /api/inasistencias/protocolo-7dias
 * @desc Ejecutar protocolo de 7 días (marcar como perdidos)
 */
router.post('/protocolo-7dias', (req, res) => controller.ejecutarProtocolo7Dias(req, res));

/**
 * @route GET /api/inasistencias/proximas-vencer
 * @desc Obtener inasistencias próximas a vencer (alertas)
 * @query { dias?: number }
 */
router.get('/lista/proximas-vencer', (req, res) => controller.obtenerProximasVencer(req, res));

/**
 * @route GET /api/inasistencias/estadisticas
 * @desc Obtener estadísticas de inasistencias
 * @query { sucursalId?, fechaInicio?, fechaFin? }
 */
router.get('/stats/general', (req, res) => controller.obtenerEstadisticas(req, res));

/**
 * @route GET /api/inasistencias/catalogo-motivos
 * @desc Obtener catálogo de motivos de inasistencia
 */
router.get('/catalogo/motivos', (req, res) => controller.obtenerCatalogoMotivos(req, res));

/**
 * @route GET /api/inasistencias/reporte-perdidos
 * @desc Obtener reporte de pacientes perdidos
 * @query { sucursalId? }
 */
router.get('/reporte/perdidos', (req, res) => controller.obtenerReportePerdidos(req, res));

export default router;
