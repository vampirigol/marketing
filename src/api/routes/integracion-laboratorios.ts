import { Router } from "express";
import Database from "../../infrastructure/database/Database";
import { LaboratorioIntegracionRepositoryPostgres } from "../../infrastructure/database/repositories/LaboratorioIntegracionRepository";
import { OrdenLaboratorioRepositoryPostgres } from "../../infrastructure/database/repositories/OrdenLaboratorioRepository";
import { NotificacionRepositoryPostgres } from "../../infrastructure/database/repositories/NotificacionRepository";
import { LaboratorioIntegracionController } from "../controllers/LaboratorioIntegracionController";
import { autenticar } from "../middleware/auth";
import { requiereRol } from "../middleware/authorization";

const router = Router();
const pool = Database.getInstance().getPool();
const integracionRepo = new LaboratorioIntegracionRepositoryPostgres(pool);
const ordenRepo = new OrdenLaboratorioRepositoryPostgres(pool);
const notificacionRepo = new NotificacionRepositoryPostgres(pool);
const controller = new LaboratorioIntegracionController(integracionRepo, ordenRepo, notificacionRepo);

// Obtener laboratorios disponibles
router.get(
  "/",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.obtenerIntegraciones
);

// Enviar orden a laboratorio externo
router.post(
  "/enviar/:ordenId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.enviarOrdenLaboratorio
);

// Simular recepción de resultados (para pruebas/demo)
router.post(
  "/simular-resultados/:ordenId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.simularResultados
);

// Obtener envíos de una orden
router.get(
  "/envios/:ordenId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.obtenerEnviosOrden
);

export default router;
