import { Request, Response } from 'express';
import { SucursalRepositoryPostgres } from '../../infrastructure/database/repositories/SucursalRepository';

export class SucursalController {
  private repository: SucursalRepositoryPostgres;

  constructor() {
    this.repository = new SucursalRepositoryPostgres();
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const soloActivas = req.query.activa !== 'false';
      const sucursales = soloActivas
        ? await this.repository.obtenerActivas()
        : await this.repository.obtenerTodas();

      res.json({
        success: true,
        sucursales,
        total: sucursales.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}
