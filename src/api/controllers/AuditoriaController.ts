import { Request, Response } from 'express';
import { AuditoriaRepositoryPostgres } from '../../infrastructure/database/repositories/AuditoriaRepository';

export class AuditoriaController {
  private repository: AuditoriaRepositoryPostgres;

  constructor() {
    this.repository = new AuditoriaRepositoryPostgres();
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { entidad, entidadId, limit } = req.query;
      const eventos = await this.repository.listar({
        entidad: entidad as string | undefined,
        entidadId: entidadId as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        total: eventos.length,
        eventos,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener auditoría',
      });
    }
  }
}
