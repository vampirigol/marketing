import { Router } from "express";
import Database from "../../infrastructure/database/Database";
import { OrdenLaboratorioRepositoryPostgres } from "../../infrastructure/database/repositories/OrdenLaboratorioRepository";
import { OrdenLaboratorioController } from "../controllers/OrdenLaboratorioController";
import { autenticar } from "../middleware/auth";
import { requiereRol } from "../middleware/authorization";

const router = Router();
const pool = Database.getInstance().getPool();
const ordenRepo = new OrdenLaboratorioRepositoryPostgres(pool);
const controller = new OrdenLaboratorioController(ordenRepo);

// Obtener catálogo de estudios
router.get(
  "/catalogo/estudios",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerCatalogoEstudios
);

// Obtener categorías de estudios
router.get(
  "/catalogo/categorias",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerCategorias
);

// Crear orden de laboratorio (solo doctores)
router.post(
  "/",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.crearOrden
);

// Obtener órdenes de un paciente
router.get(
  "/paciente/:pacienteId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerOrdenesPaciente
);

// Obtener una orden específica
router.get(
  "/:ordenId",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.obtenerOrden
);

// Actualizar estado de orden
router.put(
  "/:ordenId/estado",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.actualizarEstado
);

// Registrar resultados
router.post(
  "/:ordenId/resultados",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico", "Recepcion"]),
  controller.registrarResultados
);

// Firmar orden
router.post(
  "/:ordenId/firmar",
  autenticar,
  requiereRol(["Admin", "Supervisor", "Medico"]),
  controller.firmar
);

export default router;
