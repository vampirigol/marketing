/**
 * Rutas: Open Tickets
 * Endpoints para gestión de tickets abiertos de citas subsecuentes
 */

import { Router } from 'express';
import { OpenTicketController } from '../controllers/OpenTicketController';

const router = Router();
const controller = new OpenTicketController();

/**
 * @route POST /api/open-tickets
 * @desc Crear nuevo open ticket
 * @access Private
 */
router.post('/', (req, res) => controller.crear(req, res));

/**
 * @route GET /api/open-tickets
 * @desc Listar tickets con filtros
 * @access Private
 */
router.get('/', (req, res) => controller.listar(req, res));

/**
 * @route GET /api/open-tickets/estadisticas
 * @desc Obtener estadísticas de tickets
 * @access Private
 */
router.get('/estadisticas', (req, res) => controller.obtenerEstadisticas(req, res));

/**
 * @route GET /api/open-tickets/:id
 * @desc Obtener ticket por ID
 * @access Private
 */
router.get('/:id', (req, res) => controller.obtenerPorId(req, res));

/**
 * @route GET /api/open-tickets/codigo/:codigo
 * @desc Obtener ticket por código (ej: OT-SUC1-202402-0001)
 * @access Private
 */
router.get('/codigo/:codigo', (req, res) => controller.obtenerPorCodigo(req, res));

/**
 * @route GET /api/open-tickets/paciente/:pacienteId/activos
 * @desc Obtener tickets activos de un paciente
 * @access Private
 */
router.get('/paciente/:pacienteId/activos', (req, res) => 
  controller.obtenerTicketsActivosPaciente(req, res)
);

/**
 * @route POST /api/open-tickets/:id/convertir
 * @desc Convertir ticket a cita cuando llega el paciente
 * @access Private
 */
router.post('/:id/convertir', (req, res) => controller.convertirACita(req, res));

/**
 * @route POST /api/open-tickets/:id/encuesta
 * @desc Registrar encuesta de satisfacción
 * @access Private
 */
router.post('/:id/encuesta', (req, res) => controller.registrarEncuesta(req, res));

/**
 * @route PUT /api/open-tickets/:id/cancelar
 * @desc Cancelar ticket
 * @access Private
 */
router.put('/:id/cancelar', (req, res) => controller.cancelar(req, res));

/**
 * @route POST /api/open-tickets/marcar-expirados
 * @desc Marcar tickets expirados (tarea programada)
 * @access Private
 */
router.post('/marcar-expirados', (req, res) => controller.marcarExpirados(req, res));

export default router;
