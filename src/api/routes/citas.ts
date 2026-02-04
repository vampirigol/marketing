import { Router } from 'express';
import { CitaController } from '../controllers/CitaController';
import { autenticar } from '../middleware/auth';
import { requiereRol, requierePermiso } from '../middleware/authorization';

const router = Router();
const controller = new CitaController();

/**
 * @route POST /api/citas
 * @desc Crear una nueva cita
 * @access Privado (Recepción, Contact_Center, Admin)
 */
router.post('/', autenticar, requierePermiso('citas', 'crear'), (req, res) => controller.crear(req, res));

/**
 * @route GET /api/citas/:id
 * @desc Obtener cita por ID
 * @access Privado
 */
router.get('/:id', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.obtenerPorId(req, res));

/**
 * @route GET /api/citas/paciente/:pacienteId
 * @desc Obtener todas las citas de un paciente
 * @access Privado
 */
router.get('/paciente/:pacienteId', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.obtenerPorPaciente(req, res));

/**
 * @route GET /api/citas/sucursal/:sucursalId
 * @desc Obtener citas por sucursal y fecha
 * @query fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @access Privado
 */
router.get('/sucursal/:sucursalId', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerPorSucursalYFecha(req, res)
);

/**
 * @route GET /api/citas/disponibilidad/:sucursalId
 * @desc Obtener horarios disponibles para una sucursal
 * @query fecha, doctorId, inicio, fin, intervaloMin, maxEmpalmes
 * @access Privado
 */
router.get('/disponibilidad/:sucursalId', autenticar, (req, res) => controller.obtenerDisponibilidad(req, res));

/**
 * @route PUT /api/citas/:id
 * @desc Actualizar una cita (editar)
 * @body { fechaCita, horaCita, especialidad, medicoAsignado, notas, sinHorario }
 * @access Privado (Recepción, Contact_Center, Supervisor, Admin)
 */
router.put('/:id', autenticar, requierePermiso('citas', 'actualizar'), (req, res) => controller.actualizar(req, res));

/**
 * @route PUT /api/citas/:id/reagendar
 * @desc Reagendar una cita (valida regla de 1 reagendamiento para promociones)
 * @body { nuevaFecha, nuevaHora, motivo, precioRegular }
 * @access Privado (Recepción, Contact_Center, Supervisor, Admin)
 */
router.put('/:id/reagendar', autenticar, requierePermiso('citas', 'actualizar'), (req, res) => controller.reagendar(req, res));

/**
 * @route GET /api/citas/:id/validar-reagendacion
 * @desc Valida si una cita puede reagendarse y si mantiene su promoción
 * @access Privado (Contact Center, Recepción)
 */
router.get('/:id/validar-reagendacion', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.validarReagendacion(req, res));

/**
 * @route PUT /api/citas/:id/llegada
 * @desc Marcar llegada del paciente
 * @access Privado (Recepción)
 */
router.put('/:id/llegada', autenticar, requiereRol(['Recepcion', 'Admin']), (req, res) => controller.marcarLlegada(req, res));

/**
 * @route PUT /api/citas/:id/cancelar
 * @desc Cancelar una cita
 * @body { motivo }
 * @access Privado (Supervisor, Admin)
 */
router.put('/:id/cancelar', autenticar, requiereRol(['Supervisor', 'Admin']), (req, res) => controller.cancelar(req, res));

export default router;
