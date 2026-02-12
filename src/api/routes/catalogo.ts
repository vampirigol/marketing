import { Router, Request, Response } from 'express';
import { CatalogoController } from '../controllers/CatalogoController';
import { CitaController } from '../controllers/CitaController';

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
 * @desc Obtener horarios disponibles (delega a lógica real de citas para móvil/otros)
 * @query sucursalId, fecha, doctorId (opcional)
 * @access Privado
 */
router.get('/disponibilidad', (req, res) => {
  const sucursalId = req.query.sucursalId as string;
  const fecha = req.query.fecha as string;
  if (!sucursalId || !fecha) {
    return res.status(400).json({
      success: false,
      message: 'sucursalId y fecha son requeridos',
    });
  }
  const reqCitas = { params: { sucursalId }, query: req.query } as unknown as Request;
  const citaController = new CitaController();
  let statusCode = 200;
  const resWrapper = {
    status(code: number) {
      statusCode = code;
      return resWrapper;
    },
    json(body: unknown) {
      if (statusCode >= 400) {
        return res.status(statusCode).json(body);
      }
      const slots = (body as { slots?: Array<{ hora: string; disponible: boolean }> }).slots || [];
      return res.json({
        success: true,
        fecha: req.query.fecha,
        sucursalId: req.query.sucursalId,
        doctorId: req.query.doctorId,
        disponibilidad: slots.map((s) => ({
          hora: s.hora,
          disponible: s.disponible,
          doctor: req.query.doctorId || 'doc-1',
        })),
      });
    },
  } as Response;
  citaController.obtenerDisponibilidad(reqCitas, resWrapper);
});

/**
 * @route POST /api/catalogo/agendar
 * @desc Agendar una nueva cita
 * @access Privado
 */
router.post('/agendar', (req, res) => controller.agendarCita(req, res));

export default router;