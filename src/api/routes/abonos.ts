import { Router } from 'express';
import { AbonoController } from '../controllers/AbonoController';

const router = Router();
const controller = new AbonoController();

/**
 * @route POST /api/abonos
 * @desc Registrar un nuevo abono/pago
 * @access Privado (Recepción, Admin)
 */
router.post('/', (req, res) => controller.crear(req, res));

/**
 * @route GET /api/abonos/:id
 * @desc Obtener abono por ID
 * @access Privado
 */
router.get('/:id', (req, res) => controller.obtenerPorId(req, res));

/**
 * @route GET /api/abonos/cita/:citaId
 * @desc Obtener todos los abonos de una cita
 * @access Privado
 */
router.get('/cita/:citaId', (req, res) => controller.obtenerPorCita(req, res));

/**
 * @route GET /api/abonos/sucursal/:sucursalId
 * @desc Obtener abonos por sucursal y fecha (para corte de caja)
 * @query fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @access Privado (Admin, Gerente)
 */
router.get('/sucursal/:sucursalId', (req, res) =>
  controller.obtenerPorSucursalYFecha(req, res)
);

/**
 * @route GET /api/abonos/sucursal/:sucursalId/corte
 * @desc Calcular corte de caja del día (para Antonio y Yaretzi)
 * @query fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @query turno - MATUTINO | VESPERTINO | COMPLETO (opcional)
 * @access Privado (Finanzas, Admin)
 */
router.get('/sucursal/:sucursalId/corte', (req, res) =>
  controller.calcularCorte(req, res)
);

/**
 * @route POST /api/abonos/sucursal/:sucursalId/validar-corte
 * @desc Validar corte con dinero físico
 * @body { fecha, dineroFisicoEfectivo, dineroFisicoTarjeta, dineroFisicoTransferencia }
 * @access Privado (Finanzas, Admin)
 */
router.post('/sucursal/:sucursalId/validar-corte', (req, res) =>
  controller.validarCorte(req, res)
);

/**
 * @route PUT /api/abonos/:id/cancelar
 * @desc Cancelar un abono
 * @body { motivo }
 * @access Privado (Admin solamente)
 */
router.put('/:id/cancelar', (req, res) => controller.cancelar(req, res));

export default router;
