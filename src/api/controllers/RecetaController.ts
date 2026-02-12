import { Request, Response } from "express";
import { RecetaRepositoryPostgres } from "../../infrastructure/database/repositories/RecetaRepository";

export class RecetaController {
  constructor(private recetaRepo: RecetaRepositoryPostgres) {}

  crearReceta = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = req.user;
      const {
        pacienteId,
        consultaId,
        diagnostico,
        indicacionesGenerales,
        fechaVencimiento,
        notasMedicas,
        medicamentos,
      } = req.body;

      if (!pacienteId || !diagnostico || !medicamentos || medicamentos.length === 0) {
        res.status(400).json({
          error: "Faltan datos obligatorios (pacienteId, diagnostico, medicamentos)",
        });
        return;
      }

      if (!usuario?.id) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const receta = await this.recetaRepo.crear({
        pacienteId,
        doctorId: usuario.id,
        consultaId,
        sucursalId: usuario.sucursalId ?? undefined,
        fechaEmision: new Date().toISOString(),
        diagnostico,
        indicacionesGenerales,
        estado: "Activa",
        fechaVencimiento,
        firmado: false,
        notasMedicas,
        medicamentos,
      });

      res.status(201).json({ receta });
    } catch (error: unknown) {
      console.error("Error al crear receta:", error);
      res.status(500).json({ error: "Error al crear receta" });
    }
  };

  obtenerRecetasPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pacienteId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const recetas = await this.recetaRepo.obtenerPorPaciente(pacienteId, limit);

      res.json({ recetas });
    } catch (error: unknown) {
      console.error("Error al obtener recetas:", error);
      res.status(500).json({ error: "Error al obtener recetas" });
    }
  };

  obtenerReceta = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recetaId } = req.params;

      const receta = await this.recetaRepo.obtenerPorId(recetaId);

      if (!receta) {
        res.status(404).json({ error: "Receta no encontrada" });
        return;
      }

      res.json({ receta });
    } catch (error: unknown) {
      console.error("Error al obtener receta:", error);
      res.status(500).json({ error: "Error al obtener receta" });
    }
  };

  actualizarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recetaId } = req.params;
      const { estado } = req.body;

      if (!["Activa", "Surtida", "Cancelada", "Vencida"].includes(estado)) {
        res.status(400).json({ error: "Estado inválido" });
        return;
      }

      await this.recetaRepo.actualizarEstado(recetaId, estado);

      res.json({ mensaje: "Estado actualizado correctamente" });
    } catch (error: unknown) {
      console.error("Error al actualizar estado:", error);
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  };

  firmar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recetaId } = req.params;
      const { firmaDigital } = req.body;

      await this.recetaRepo.firmar(recetaId, firmaDigital);

      res.json({ mensaje: "Receta firmada correctamente" });
    } catch (error: unknown) {
      console.error("Error al firmar receta:", error);
      res.status(500).json({ error: "Error al firmar receta" });
    }
  };
}
