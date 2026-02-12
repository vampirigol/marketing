import { Router } from 'express';
import { PacienteController } from '../controllers/PacienteController';

const router = Router();
const controller = new PacienteController();

/**
 * @route POST /api/pacientes
 * @desc Crear un nuevo paciente
 * @access Privado (Recepción, Admin)
 */
router.post('/', (req, res) => controller.crear(req, res));

/**
 * @route GET /api/pacientes/siguiente-afiliacion
 * @desc Obtener siguiente número de afiliación único (RCA-YYYY-NNNNN) sin duplicados
 * @access Privado
 */
router.get('/siguiente-afiliacion', (req, res) =>
  controller.siguienteNoAfiliacion(req, res)
);

/**
 * @route GET /api/pacientes/:id
 * @desc Obtener paciente por ID
 * @access Privado
 */
router.get('/:id', (req, res) => controller.obtenerPorId(req, res));

/**
 * @route GET /api/pacientes/buscar
 * @desc Buscar pacientes por nombre, teléfono, email o No_Afiliacion
 * @query q - Término de búsqueda
 * @access Privado
 */
router.get('/buscar', (req, res) => controller.buscar(req, res));

/**
 * @route GET /api/pacientes
 * @desc Listar pacientes con paginación
 * @query limit - Número de resultados (default: 50)
 * @query offset - Desplazamiento (default: 0)
 * @access Privado
 */
router.get('/', (req, res) => controller.listar(req, res));

/**
 * @route PUT /api/pacientes/:id
 * @desc Actualizar datos de un paciente
 * @access Privado (Recepción, Admin)
 */
router.put('/:id', (req, res) => controller.actualizar(req, res));

/**
 * @route GET /api/pacientes/afiliacion/:noAfiliacion
 * @desc Obtener paciente por número de afiliación
 * @access Privado
 */
router.get('/afiliacion/:noAfiliacion', (req, res) =>
  controller.obtenerPorNoAfiliacion(req, res)
);

export default router;
