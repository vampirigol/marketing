import { Router } from "express";
import Database from "../../infrastructure/database/Database";
import { NotificacionRepositoryPostgres } from "../../infrastructure/database/repositories/NotificacionRepository";
import { NotificacionController } from "../controllers/NotificacionController";
import { autenticar } from "../middleware/auth";

const router = Router();
const pool = Database.getInstance().getPool();
const notificacionRepo = new NotificacionRepositoryPostgres(pool);
const controller = new NotificacionController(notificacionRepo);

// Obtener notificaciones del usuario
router.get("/", autenticar, controller.obtenerNotificaciones);

// Obtener notificaciones no leídas
router.get("/no-leidas", autenticar, controller.obtenerNoLeidas);

// Marcar una notificación como leída
router.put("/:notificacionId/leida", autenticar, controller.marcarComoLeida);

// Marcar todas como leídas
router.put("/marcar-todas-leidas", autenticar, controller.marcarTodasComoLeidas);

// Crear notificación (para uso interno/admin)
router.post("/", autenticar, controller.crearNotificacion);

export default router;
