import { Request, Response } from 'express';
import { PacienteRepositoryPostgres } from '../../infrastructure/database/repositories/PacienteRepository';

export class PacienteController {
  private repository: PacienteRepositoryPostgres;

  constructor() {
    this.repository = new PacienteRepositoryPostgres();
  }

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const pacienteData = req.body;

      // Validar No_Afiliacion obligatorio
      if (!pacienteData.noAfiliacion || pacienteData.noAfiliacion.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'No_Afiliacion es obligatorio y no puede estar vacío',
        });
        return;
      }

      // Verificar si ya existe un paciente con el mismo teléfono
      const pacienteExistente = await this.repository.obtenerPorTelefono(
        pacienteData.telefono
      );

      if (pacienteExistente) {
        res.status(409).json({
          success: false,
          message: 'Ya existe un paciente con ese número de teléfono',
          paciente: pacienteExistente,
        });
        return;
      }

      const paciente = await this.repository.crear(pacienteData);

      res.status(201).json({
        success: true,
        message: 'Paciente creado exitosamente',
        paciente,
      });
    } catch (error: unknown) {
      console.error('Error al crear paciente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el paciente',
      });
    }
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const paciente = await this.repository.obtenerPorId(id);

      if (!paciente) {
        res.status(404).json({
          success: false,
          message: 'Paciente no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        paciente,
      });
    } catch (error: unknown) {
      console.error('Error al obtener paciente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el paciente',
      });
    }
  }

  async buscar(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parámetro de búsqueda requerido',
        });
        return;
      }

      const pacientes = await this.repository.buscar(q);

      res.json({
        success: true,
        count: pacientes.length,
        pacientes,
      });
    } catch (error: unknown) {
      console.error('Error al buscar pacientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar pacientes',
      });
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const pacientes = await this.repository.listar(limit, offset);

      res.json({
        success: true,
        count: pacientes.length,
        limit,
        offset,
        pacientes,
      });
    } catch (error: unknown) {
      console.error('Error al listar pacientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al listar pacientes',
      });
    }
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pacienteData = req.body;

      // Verificar que el paciente existe
      const pacienteExistente = await this.repository.obtenerPorId(id);
      if (!pacienteExistente) {
        res.status(404).json({
          success: false,
          message: 'Paciente no encontrado',
        });
        return;
      }

      const paciente = await this.repository.actualizar(id, pacienteData);

      res.json({
        success: true,
        message: 'Paciente actualizado exitosamente',
        paciente,
      });
    } catch (error: unknown) {
      console.error('Error al actualizar paciente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el paciente',
      });
    }
  }

  async obtenerPorNoAfiliacion(req: Request, res: Response): Promise<void> {
    try {
      const { noAfiliacion } = req.params;
      const paciente = await this.repository.obtenerPorNoAfiliacion(noAfiliacion);

      if (!paciente) {
        res.status(404).json({
          success: false,
          message: 'Paciente no encontrado con ese número de afiliación',
        });
        return;
      }

      res.json({
        success: true,
        paciente,
      });
    } catch (error: unknown) {
      console.error('Error al obtener paciente por No_Afiliacion:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el paciente',
      });
    }
  }
}
