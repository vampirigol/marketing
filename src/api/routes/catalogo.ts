import { Router } from 'express';
import { CatalogoController } from '../controllers/CatalogoController';

const router = Router();
const controller = new CatalogoController();

/**
 * @route GET /api/catalogo
 * @desc Catálogo de sucursales, especialidades, doctores, servicios y promociones
 * @access Privado
 */
router.get('/', (req, res) => controller.obtenerCatalogo(req, res));

/**
 * @route GET /api/catalogo/disponibilidad
 * @desc Obtener horarios disponibles para una sucursal, doctor y fecha
 * @access Privado
 */
router.get('/disponibilidad', (req, res) => controller.obtenerDisponibilidad(req, res));

/**
 * @route POST /api/catalogo/agendar
 * @desc Agendar una nueva cita
 * @access Privado
 */
router.post('/agendar', (req, res) => controller.agendarCita(req, res));

export default router;