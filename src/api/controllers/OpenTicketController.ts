/**
 * Controlador: OpenTicket
 * Gestiona las operaciones de tickets abiertos para citas subsecuentes
 */

import { Request, Response } from 'express';
import { OpenTicketRepositoryPostgres, EstadoTicket } from '../../infrastructure/database/repositories/OpenTicketRepository';
import { CitaRepositoryPostgres } from '../../infrastructure/database/repositories/CitaRepository';
import { CrearOpenTicketUseCase } from '../../core/use-cases/CrearOpenTicket';
import { ConvertirTicketACitaUseCase } from '../../core/use-cases/ConvertirTicketACita';
import { RegistrarEncuestaSatisfaccionUseCase } from '../../core/use-cases/RegistrarEncuestaSatisfaccion';

export class OpenTicketController {
  private repository: OpenTicketRepositoryPostgres;
  private citaRepository: CitaRepositoryPostgres;

  constructor() {
    this.repository = new OpenTicketRepositoryPostgres();
    this.citaRepository = new CitaRepositoryPostgres();
  }

  /**
   * Crear un nuevo Open Ticket
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const useCase = new CrearOpenTicketUseCase();

      const resultado = await useCase.ejecutar({
        pacienteId: req.body.pacienteId,
        sucursalId: req.body.sucursalId,
        especialidad: req.body.especialidad,
        medicoPreferido: req.body.medicoPreferido,
        citaOrigenId: req.body.citaOrigenId,
        diasValidez: req.body.diasValidez || 30,
        fechaValidoDesde: req.body.fechaValidoDesde ? new Date(req.body.fechaValidoDesde) : undefined,
        motivoConsultaAnterior: req.body.motivoConsultaAnterior,
        diagnosticoAnterior: req.body.diagnosticoAnterior,
        tratamientoIndicado: req.body.tratamientoIndicado,
        costoEstimado: req.body.costoEstimado,
        requierePago: req.body.requierePago,
        creadoPor: req.body.usuarioId || 'system',
        notas: req.body.notas,
      });

      if (!resultado.success || !resultado.ticket) {
        res.status(400).json({
          success: false,
          message: resultado.mensaje,
        });
        return;
      }

      // Guardar en base de datos
      const ticket = await this.repository.crear(resultado.ticket);

      res.status(201).json({
        success: true,
        message: resultado.mensaje,
        data: ticket,
      });

    } catch (error) {
      console.error('Error al crear open ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Obtener ticket por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await this.repository.obtenerPorId(id);

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });

    } catch (error) {
      console.error('Error al obtener ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * Obtener ticket por código
   */
  async obtenerPorCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { codigo } = req.params;
      const ticket = await this.repository.obtenerPorCodigo(codigo);

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
        });
        return;
      }

      // Verificar si está vigente
      const vigencia = ticket.puedeSerUtilizado();

      res.json({
        success: true,
        data: {
          ticket,
          vigencia,
          diasRestantes: ticket.diasRestantesVigencia(),
        },
      });

    } catch (error) {
      console.error('Error al obtener ticket por código:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * Listar tickets con filtros
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const filtros = {
        pacienteId: req.query.pacienteId as string,
        sucursalId: req.query.sucursalId as string,
        estado: req.query.estado as EstadoTicket | undefined,
        especialidad: req.query.especialidad as string,
        vigentes: req.query.vigentes === 'true',
        fechaDesde: req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined,
        fechaHasta: req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined,
      };

      const tickets = await this.repository.listar(filtros);

      res.json({
        success: true,
        data: tickets,
        total: tickets.length,
      });

    } catch (error) {
      console.error('Error al listar tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * Convertir ticket a cita cuando llega el paciente
   */
  async convertirACita(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Obtener el ticket
      const ticket = await this.repository.obtenerPorId(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
        });
        return;
      }

      // Convertir a cita usando el caso de uso
      const useCase = new ConvertirTicketACitaUseCase();
      const resultado = await useCase.ejecutar(ticket, {
        ticketId: id,
        horaLlegada: new Date(),
        medicoAsignado: req.body.medicoAsignado,
        recepcionistaId: req.body.usuarioId || 'system',
        notas: req.body.notas,
      });

      if (!resultado.success || !resultado.cita || !resultado.ticket) {
        res.status(400).json({
          success: false,
          message: resultado.mensaje,
        });
        return;
      }

      // Guardar cita y actualizar ticket
      const cita = await this.citaRepository.crear(resultado.cita);
      await this.repository.actualizar(resultado.ticket);

      res.json({
        success: true,
        message: resultado.mensaje,
        data: {
          cita,
          ticket: resultado.ticket,
        },
      });

    } catch (error) {
      console.error('Error al convertir ticket a cita:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Registrar encuesta de satisfacción
   */
  async registrarEncuesta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Obtener el ticket
      const ticket = await this.repository.obtenerPorId(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
        });
        return;
      }

      // Registrar encuesta usando el caso de uso
      const useCase = new RegistrarEncuestaSatisfaccionUseCase();
      const resultado = await useCase.ejecutar(ticket, {
        ticketId: id,
        calificacionAtencion: req.body.calificacionAtencion,
        calificacionMedico: req.body.calificacionMedico,
        calificacionInstalaciones: req.body.calificacionInstalaciones,
        calificacionTiempoEspera: req.body.calificacionTiempoEspera,
        recomendaria: req.body.recomendaria,
        comentarios: req.body.comentarios,
        aspectosPositivos: req.body.aspectosPositivos,
        aspectosMejorar: req.body.aspectosMejorar,
        fechaEncuesta: new Date(),
      });

      if (!resultado.success || !resultado.ticket) {
        res.status(400).json({
          success: false,
          message: resultado.mensaje,
        });
        return;
      }

      // Actualizar ticket en base de datos
      await this.repository.actualizar(resultado.ticket);

      res.json({
        success: true,
        message: resultado.mensaje,
        data: {
          ticket: resultado.ticket,
          promedioCalificacion: resultado.promedioCalificacion,
        },
      });

    } catch (error) {
      console.error('Error al registrar encuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * Cancelar ticket
   */
  async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const ticket = await this.repository.obtenerPorId(id);
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Ticket no encontrado',
        });
        return;
      }

      ticket.cancelar(req.body.motivo);
      await this.repository.actualizar(ticket);

      res.json({
        success: true,
        message: 'Ticket cancelado exitosamente',
        data: ticket,
      });

    } catch (error) {
      console.error('Error al cancelar ticket:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor',
      });
    }
  }

  /**
   * Obtener tickets activos de un paciente
   */
  async obtenerTicketsActivosPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;
      const tickets = await this.repository.obtenerTicketsActivosPorPaciente(pacienteId);

      res.json({
        success: true,
        data: tickets,
        total: tickets.length,
      });

    } catch (error) {
      console.error('Error al obtener tickets activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * Obtener estadísticas de tickets
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const sucursalId = req.query.sucursalId as string;
      const estadisticas = await this.repository.obtenerEstadisticas(sucursalId);

      res.json({
        success: true,
        data: estadisticas,
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * Marcar tickets expirados (tarea programada)
   */
  async marcarExpirados(_req: Request, res: Response): Promise<void> {
    try {
      const cantidad = await this.repository.marcarTicketsExpirados();

      res.json({
        success: true,
        message: `${cantidad} tickets marcados como expirados`,
        data: { cantidad },
      });

    } catch (error) {
      console.error('Error al marcar tickets expirados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
