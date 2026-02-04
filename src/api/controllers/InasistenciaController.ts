/**
 * Controlador: Inasistencias
 * Maneja las peticiones HTTP relacionadas con inasistencias
 */

import { Request, Response } from 'express';
import { RegistrarInasistencia } from '../../core/use-cases/RegistrarInasistencia';
import { AsignarMotivoInasistencia } from '../../core/use-cases/AsignarMotivoInasistencia';
import { RegistrarIntentoContacto } from '../../core/use-cases/RegistrarIntentoContacto';
import { ReagendarDesdeInasistencia } from '../../core/use-cases/ReagendarDesdeInasistencia';
import { ProcesarProtocolo7Dias } from '../../core/use-cases/ProcesarProtocolo7Dias';
import { InasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';
import { RemarketingService } from '../../infrastructure/remarketing/RemarketingService';
import { MotivoInasistencia, CATALOGO_MOTIVOS } from '../../core/entities/Inasistencia';

export class InasistenciaController {
  constructor(
    private inasistenciaRepo: InasistenciaRepository,
    private remarketingService: RemarketingService
  ) {}

  /**
   * POST /api/inasistencias
   * Registra una nueva inasistencia
   */
  async registrar(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new RegistrarInasistencia(this.inasistenciaRepo);
      const result = await useCase.execute({
        citaId: req.body.citaId,
        pacienteId: req.body.pacienteId,
        sucursalId: req.body.sucursalId,
        fechaCitaPerdida: new Date(req.body.fechaCitaPerdida),
        horaCitaPerdida: req.body.horaCitaPerdida,
        creadoPor: req.body.creadoPor || 'Sistema'
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.inasistencia,
          message: '✅ Inasistencia registrada. Protocolo de 7 días iniciado.'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/inasistencias/:id/motivo
   * Asigna un motivo a una inasistencia
   */
  async asignarMotivo(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new AsignarMotivoInasistencia(this.inasistenciaRepo);
      const result = await useCase.execute({
        inasistenciaId: req.params.id,
        motivo: req.body.motivo as MotivoInasistencia,
        motivoDetalle: req.body.motivoDetalle,
        asignadoPor: req.body.asignadoPor || 'Usuario'
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.inasistencia,
          acciones: result.acciones,
          message: '✅ Motivo asignado correctamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/inasistencias/:id/contacto
   * Registra un intento de contacto
   */
  async registrarContacto(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new RegistrarIntentoContacto(this.inasistenciaRepo);
      const result = await useCase.execute({
        inasistenciaId: req.params.id,
        nota: req.body.nota,
        exitoso: req.body.exitoso || false,
        respuestaPaciente: req.body.respuestaPaciente,
        realizadoPor: req.body.realizadoPor || 'Usuario'
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.inasistencia,
          totalIntentos: result.totalIntentos,
          proximoIntento: result.proximoIntento,
          message: '✅ Intento de contacto registrado'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/inasistencias/:id/reagendar
   * Reagenda una cita desde una inasistencia
   */
  async reagendar(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new ReagendarDesdeInasistencia(this.inasistenciaRepo);
      const result = await useCase.execute({
        inasistenciaId: req.params.id,
        nuevaCitaId: req.body.nuevaCitaId,
        fechaNuevaCita: new Date(req.body.fechaNuevaCita),
        horaNuevaCita: req.body.horaNuevaCita,
        notasReagendacion: req.body.notasReagendacion,
        realizadoPor: req.body.realizadoPor || 'Usuario'
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.inasistencia,
          message: result.mensaje
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/:id
   * Obtiene una inasistencia por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(req.params.id);
      
      if (!inasistencia) {
        res.status(404).json({
          success: false,
          error: 'Inasistencia no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: inasistencia
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/paciente/:pacienteId
   * Obtiene historial de inasistencias de un paciente
   */
  async obtenerPorPaciente(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new ReagendarDesdeInasistencia(this.inasistenciaRepo);
      const historial = await useCase.obtenerHistorialPaciente(req.params.pacienteId);

      res.json({
        success: true,
        data: historial
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/pendientes
   * Obtiene inasistencias pendientes de seguimiento
   */
  async obtenerPendientes(req: Request, res: Response): Promise<void> {
    try {
      const sucursalId = req.query.sucursalId as string | undefined;
      const pendientes = await this.inasistenciaRepo.obtenerPendientesSeguimiento(sucursalId);

      res.json({
        success: true,
        data: pendientes,
        total: pendientes.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/remarketing
   * Obtiene lista de remarketing
   */
  async obtenerRemarketing(req: Request, res: Response): Promise<void> {
    try {
      const sucursalId = req.query.sucursalId as string | undefined;
      const lista = await this.remarketingService.obtenerListaRemarketing(sucursalId);
      const stats = await this.remarketingService.obtenerEstadisticas(sucursalId);

      res.json({
        success: true,
        data: lista,
        estadisticas: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/inasistencias/remarketing/ejecutar
   * Ejecuta campaña de remarketing
   */
  async ejecutarRemarketing(req: Request, res: Response): Promise<void> {
    try {
      const { inasistencias, canal } = req.body;
      const resultados = await this.remarketingService.ejecutarCampana(
        inasistencias,
        canal || 'WhatsApp'
      );

      const exitosos = resultados.filter(r => r.enviado).length;
      const fallidos = resultados.filter(r => !r.enviado).length;

      res.json({
        success: true,
        resultados,
        resumen: {
          total: resultados.length,
          exitosos,
          fallidos
        },
        message: `✅ Campaña ejecutada: ${exitosos} exitosos, ${fallidos} fallidos`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/bloqueados
   * Obtiene lista de pacientes bloqueados
   */
  async obtenerBloqueados(_req: Request, res: Response): Promise<void> {
    try {
      const bloqueados = await this.inasistenciaRepo.obtenerBloqueados();

      res.json({
        success: true,
        data: bloqueados,
        total: bloqueados.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/inasistencias/protocolo-7dias
   * Ejecuta el protocolo de 7 días
   */
  async ejecutarProtocolo7Dias(_req: Request, res: Response): Promise<void> {
    try {
      const useCase = new ProcesarProtocolo7Dias(this.inasistenciaRepo);
      const result = await useCase.execute();

      res.json({
        success: result.success,
        data: result,
        message: `✅ Protocolo ejecutado: ${result.marcadosPerdidos} marcados como perdidos, ${result.alertasProximas} alertas`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/proximas-vencer
   * Obtiene inasistencias próximas a vencer (para alertas)
   */
  async obtenerProximasVencer(req: Request, res: Response): Promise<void> {
    try {
      const diasLimite = parseInt(req.query.dias as string) || 2;
      const proximas = await this.inasistenciaRepo.obtenerProximasAVencer(diasLimite);

      res.json({
        success: true,
        data: proximas,
        total: proximas.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/estadisticas
   * Obtiene estadísticas generales
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const sucursalId = req.query.sucursalId as string | undefined;
      const fechaInicio = req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined;
      const fechaFin = req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined;

      const stats = await this.inasistenciaRepo.obtenerEstadisticas(sucursalId, fechaInicio, fechaFin);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/catalogo-motivos
   * Obtiene el catálogo de motivos
   */
  async obtenerCatalogoMotivos(_req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: CATALOGO_MOTIVOS
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/inasistencias/reporte-perdidos
   * Obtiene reporte de pacientes perdidos
   */
  async obtenerReportePerdidos(req: Request, res: Response): Promise<void> {
    try {
      const sucursalId = req.query.sucursalId as string | undefined;
      const useCase = new ProcesarProtocolo7Dias(this.inasistenciaRepo);
      const reporte = await useCase.obtenerReportePerdidos(sucursalId);

      res.json({
        success: true,
        data: reporte
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
