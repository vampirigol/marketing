import { Router } from 'express';
import { MetricasController } from '../controllers/MetricasController';
import { MetricasRepositoryPostgres } from '../../infrastructure/database/repositories/MetricasRepository';
import Database from '../../infrastructure/database/Database';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();
const pool = Database.getInstance().getPool();
const metricasRepo = new MetricasRepositoryPostgres(pool);
const metricasController = new MetricasController(metricasRepo);

// Todas las rutas requieren autenticación
router.use(autenticar);

// KPI diario de un doctor
router.get(
  '/kpi/diario',
  requiereRol('Admin', 'Supervisor', 'Medico'),
  metricasController.obtenerKPIDiario
);

// KPI semanal de un doctor
router.get(
  '/kpi/semanal',
  requiereRol('Admin', 'Supervisor', 'Medico'),
  metricasController.obtenerKPISemanal
);

// Tendencia semanal
router.get(
  '/tendencia',
  requiereRol('Admin', 'Supervisor', 'Medico'),
  metricasController.obtenerTendencia
);

// Detectar saturación
router.get(
  '/saturacion',
  requiereRol('Admin', 'Supervisor', 'Medico'),
  metricasController.detectarSaturacion
);

export default router;
