import { Router } from "express";
import Database from "../../infrastructure/database/Database";
import { ArchivoPacienteRepositoryPostgres } from "../../infrastructure/database/repositories/ArchivoPacienteRepository";
import { ArchivoPacienteController } from "../controllers/ArchivoPacienteController";
import { autenticar } from "../middleware/auth";
import { requiereRol } from "../middleware/authorization";

const router = Router();
const pool = Database.getInstance().getPool();
const archivoRepo = new ArchivoPacienteRepositoryPostgres(pool);
const controller = new ArchivoPacienteController(archivoRepo);

// Crear archivo
router.post(
  "/",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.crear
);

// Obtener archivos de un paciente
router.get(
  "/paciente/:pacienteId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerPorPaciente
);

// Eliminar archivo
router.delete(
  "/:archivoId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.eliminar
);

export default router;
