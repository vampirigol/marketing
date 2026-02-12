import { Request, Response } from "express";
import { NotificacionRepositoryPostgres } from "../../infrastructure/database/repositories/NotificacionRepository";

export class NotificacionController {
  constructor(private notificacionRepo: NotificacionRepositoryPostgres) {}

  obtenerNotificaciones = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = req.user;
      
      if (!usuario || !usuario.id) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const notificaciones = await this.notificacionRepo.obtenerPorUsuario(usuario.id, limit);

      res.json({ notificaciones });
    } catch (error: unknown) {
      console.error("Error al obtener notificaciones:", error);
      res.status(500).json({ error: "Error al obtener notificaciones" });
    }
  };

  obtenerNoLeidas = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = req.user;
      
      if (!usuario || !usuario.id) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const notificaciones = await this.notificacionRepo.obtenerNoLeidas(usuario.id);
      const total = await this.notificacionRepo.contarNoLeidas(usuario.id);

      res.json({ notificaciones, total });
    } catch (error: unknown) {
      console.error("Error al obtener notificaciones:", error);
      res.status(500).json({ error: "Error al obtener notificaciones" });
    }
  };

  marcarComoLeida = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificacionId } = req.params;

      await this.notificacionRepo.marcarComoLeida(notificacionId);

      res.json({ mensaje: "Notificación marcada como leída" });
    } catch (error: unknown) {
      console.error("Error al marcar notificación:", error);
      res.status(500).json({ error: "Error al marcar notificación" });
    }
  };

  marcarTodasComoLeidas = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = req.user;
      
      if (!usuario || !usuario.id) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      await this.notificacionRepo.marcarTodasComoLeidas(usuario.id);

      res.json({ mensaje: "Todas las notificaciones marcadas como leídas" });
    } catch (error: unknown) {
      console.error("Error al marcar notificaciones:", error);
      res.status(500).json({ error: "Error al marcar notificaciones" });
    }
  };

  crearNotificacion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { usuarioId, pacienteId, tipo, titulo, mensaje, data, canal } = req.body;

      const notificacion = await this.notificacionRepo.crear({
        usuarioId,
        pacienteId,
        tipo,
        titulo,
        mensaje,
        data,
        canal,
      });

      res.status(201).json({ notificacion });
    } catch (error: unknown) {
      console.error("Error al crear notificación:", error);
      res.status(500).json({ error: "Error al crear notificación" });
    }
  };
}
