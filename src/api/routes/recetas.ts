import { Router } from "express";
import Database from "../../infrastructure/database/Database";
import { RecetaRepositoryPostgres } from "../../infrastructure/database/repositories/RecetaRepository";
import { RecetaController } from "../controllers/RecetaController";
import { autenticar } from "../middleware/auth";
import { requiereRol } from "../middleware/authorization";

const router = Router();
const pool = Database.getInstance().getPool();
const recetaRepo = new RecetaRepositoryPostgres(pool);
const controller = new RecetaController(recetaRepo);

// Crear receta (solo doctores)
router.post(
  "/",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.crearReceta
);

// Obtener recetas de un paciente
router.get(
  "/paciente/:pacienteId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerRecetasPaciente
);

// Obtener una receta específica
router.get(
  "/:recetaId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerReceta
);

// Actualizar estado de receta
router.put(
  "/:recetaId/estado",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.actualizarEstado
);

// Firmar receta
router.post(
  "/:recetaId/firmar",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.firmar
);

export default router;
