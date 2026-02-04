/**
 * Controlador: Campañas Esporádicas
 * Maneja peticiones HTTP de campañas de broadcast
 */

import { Request, Response } from 'express';
import { EjecutarCampanaEsporadicaUseCase, CrearCampanaDTO } from '../../core/use-cases/EjecutarCampanaEsporadica';
import { CampanaEsporadicaRepository } from '../../infrastructure/database/repositories/CampanaEsporadicaRepository';
import { InMemoryPacienteRepository } from '../../infrastructure/database/repositories/PacienteRepository';
import { WhatsAppService } from '../../infrastructure/messaging/WhatsAppService';
import { SegmentarPacientesUseCase } from '../../core/use-cases/SegmentarPacientes';
import { InMemoryCitaRepository } from '../../infrastructure/database/repositories/CitaRepository';
import { InMemoryAbonoRepository } from '../../infrastructure/database/repositories/AbonoRepository';

export class CampanaController {
  private campanaUseCase: EjecutarCampanaEsporadicaUseCase;

  constructor() {
    const campanaRepository = new CampanaEsporadicaRepository();
    const pacienteRepository = new InMemoryPacienteRepository();
    const whatsAppService = new WhatsAppService();
    
    const citaRepository = new InMemoryCitaRepository();
    const abonoRepository = new InMemoryAbonoRepository();
    const segmentarUseCase = new SegmentarPacientesUseCase(
      citaRepository as any,
      abonoRepository as any
    );

    this.campanaUseCase = new EjecutarCampanaEsporadicaUseCase(
      campanaRepository,
      pacienteRepository,
      whatsAppService as any,
      segmentarUseCase as any
    );
  }

  /**
   * POST /api/campanas
   * Crear nueva campaña
   */
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CrearCampanaDTO = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        audiencia: req.body.audiencia,
        mensaje: req.body.mensaje,
        fechaProgramada: req.body.fechaProgramada ? new Date(req.body.fechaProgramada) : undefined,
        creadoPor: req.user?.username || 'sistema',
        sucursalId: req.body.sucursalId || req.user?.sucursalId
      };

      // Validar campos requeridos
      if (!dto.nombre || !dto.audiencia || !dto.mensaje) {
        res.status(400).json({
          error: 'Campos requeridos: nombre, audiencia, mensaje'
        });
        return;
      }

      const campana = await this.campanaUseCase.crear(dto);

      res.status(201).json({
        campana,
        mensaje: 'Campaña creada exitosamente'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al crear campaña',
        detalle: error.message
      });
    }
  };

  /**
   * GET /api/campanas
   * Listar todas las campañas
   */
  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const campanas = await this.campanaUseCase.listarTodas();
      res.json({
        total: campanas.length,
        campanas
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al listar campañas',
        detalle: error.message
      });
    }
  };

  /**
   * GET /api/campanas/:id
   * Obtener campaña por ID
   */
  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const campana = await this.campanaUseCase.obtenerPorId(id);

      if (!campana) {
        res.status(404).json({ error: 'Campaña no encontrada' });
        return;
      }

      res.json(campana);
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al obtener campaña',
        detalle: error.message
      });
    }
  };

  /**
   * POST /api/campanas/:id/ejecutar
   * Ejecutar campaña (envío inmediato)
   */
  ejecutar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const resultado = await this.campanaUseCase.ejecutar(id);

      if (!resultado.exito) {
        res.status(400).json({
          error: resultado.mensaje
        });
        return;
      }

      res.json({
        mensaje: resultado.mensaje,
        progreso: resultado.progreso
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al ejecutar campaña',
        detalle: error.message
      });
    }
  };

  /**
   * POST /api/campanas/:id/cancelar
   * Cancelar campaña
   */
  cancelar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const resultado = await this.campanaUseCase.cancelar(id);

      if (!resultado.exito) {
        res.status(400).json({
          error: resultado.mensaje
        });
        return;
      }

      res.json({
        mensaje: resultado.mensaje
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al cancelar campaña',
        detalle: error.message
      });
    }
  };

  /**
   * POST /api/campanas/:id/duplicar
   * Duplicar campaña existente
   */
  duplicar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const creadoPor = req.user?.username || 'sistema';

      const nuevaCampana = await this.campanaUseCase.duplicar(id, creadoPor);

      if (!nuevaCampana) {
        res.status(404).json({ error: 'Campaña no encontrada' });
        return;
      }

      res.status(201).json({
        campana: nuevaCampana,
        mensaje: 'Campaña duplicada exitosamente'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al duplicar campaña',
        detalle: error.message
      });
    }
  };
}
