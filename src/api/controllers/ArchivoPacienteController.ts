import { Request, Response } from "express";
import { ArchivoPacienteRepositoryPostgres } from "../../infrastructure/database/repositories/ArchivoPacienteRepository";

export class ArchivoPacienteController {
  constructor(private archivoRepo: ArchivoPacienteRepositoryPostgres) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = (req as any).usuario;
      const {
        pacienteId,
        nombreArchivo,
        tipoArchivo,
        categoria,
        urlArchivo,
        tamanioBytes,
        mimeType,
        descripcion,
        fechaEstudio,
        consultaId,
        ordenId,
      } = req.body;

      if (!pacienteId || !nombreArchivo || !categoria || !urlArchivo) {
        res.status(400).json({ error: "Faltan datos obligatorios" });
        return;
      }

      const archivo = await this.archivoRepo.crear({
        pacienteId,
        nombreArchivo,
        tipoArchivo: tipoArchivo || categoria,
        categoria,
        urlArchivo,
        tamanioBytes,
        mimeType,
        descripcion,
        fechaEstudio,
        subidoPor: usuario.id,
        consultaId,
        ordenId,
      });

      res.status(201).json({ archivo });
    } catch (error: any) {
      console.error("Error al crear archivo:", error);
      res.status(500).json({ error: "Error al crear archivo" });
    }
  };

  obtenerPorPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pacienteId } = req.params;
      const { categoria } = req.query;

      const archivos = await this.archivoRepo.obtenerPorPaciente(
        pacienteId,
        categoria as string | undefined
      );

      res.json({ archivos });
    } catch (error: any) {
      console.error("Error al obtener archivos:", error);
      res.status(500).json({ error: "Error al obtener archivos" });
    }
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { archivoId } = req.params;

      await this.archivoRepo.eliminar(archivoId);

      res.json({ mensaje: "Archivo eliminado correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar archivo:", error);
      res.status(500).json({ error: "Error al eliminar archivo" });
    }
  };
}
