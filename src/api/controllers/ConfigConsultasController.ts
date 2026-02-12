import { Request, Response } from 'express';
import { ConfigConsultasRepositoryPostgres } from '../../infrastructure/database/repositories/ConfigConsultasRepository';

export class ConfigConsultasController {
  private repository: ConfigConsultasRepositoryPostgres;

  constructor() {
    this.repository = new ConfigConsultasRepositoryPostgres();
  }

  async obtenerTodas(req: Request, res: Response): Promise<void> {
    try {
      const configs = await this.repository.obtenerTodas();
      res.json({
        success: true,
        configs,
      });
    } catch (error: unknown) {
      console.error('Error obteniendo configuraciones de consultas:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error obteniendo configuraciones',
      });
    }
  }

  async obtenerPorEspecialidad(req: Request, res: Response): Promise<void> {
    try {
      const { especialidad } = req.params;
      const configs = await this.repository.obtenerPorEspecialidad(especialidad);
      res.json({
        success: true,
        configs,
      });
    } catch (error: unknown) {
      console.error('Error obteniendo configuraciones por especialidad:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error obteniendo configuraciones',
      });
    }
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { duracionMinutos, intervaloMinutos, maxEmpalmes, colorHex, activo } = req.body;

      const config = await this.repository.actualizar(id, {
        duracionMinutos,
        intervaloMinutos,
        maxEmpalmes,
        colorHex,
        activo,
      });

      res.json({
        success: true,
        config,
      });
    } catch (error: unknown) {
      console.error('Error actualizando configuración de consulta:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error actualizando configuración',
      });
    }
  }
}
