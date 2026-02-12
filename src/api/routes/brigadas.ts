import { Router } from 'express';
import { BrigadaController } from '../controllers/BrigadaController';
import { autenticar } from '../middleware/auth';

const router = Router();
const controller = new BrigadaController();

router.get('/', autenticar, (req, res) => controller.listar(req, res));
router.post('/', autenticar, (req, res) => controller.crear(req, res));
router.post('/importar', autenticar, (req, res) => controller.importar(req, res));
router.post('/importar-registros', autenticar, (req, res) => controller.importarRegistros(req, res));
router.get('/:id/atenciones', autenticar, (req, res) => controller.listarAtenciones(req, res));
router.get('/:id/registros', autenticar, (req, res) => controller.listarRegistros(req, res));
router.get('/:id/resumen-registros', autenticar, (req, res) => controller.obtenerResumenRegistros(req, res));
router.get('/:id/resumen', autenticar, (req, res) => controller.obtenerResumen(req, res));
router.post('/:id/atenciones', autenticar, (req, res) => controller.crearAtencion(req, res));
router.put('/:id/atenciones/:atencionId', autenticar, (req, res) => controller.actualizarAtencion(req, res));
router.delete('/:id/atenciones/:atencionId', autenticar, (req, res) => controller.eliminarAtencion(req, res));
router.get('/:id', autenticar, (req, res) => controller.obtenerPorId(req, res));
router.put('/:id', autenticar, (req, res) => controller.actualizar(req, res));
router.delete('/:id', autenticar, (req, res) => controller.eliminar(req, res));

export default router;
