/**
 * Controlador: Solicitudes de Contacto
 * Maneja las peticiones HTTP relacionadas con solicitudes de contacto con agentes
 */

import { Request, Response } from 'express';
import {
  SolicitarContactoAgenteUseCase
} from '../../core/use-cases/SolicitarContactoAgente';
import {
  solicitudContactoRepository
} from '../../infrastructure/database/repositories/SolicitudContactoRepository';
import {
  CATALOGO_MOTIVOS_CONTACTO
} from '../../core/entities/SolicitudContacto';
import { PacienteRepositoryPostgres } from '../../infrastructure/database/repositories/PacienteRepository';
import Database from '../../infrastructure/database/Database';
import { NotificacionRepositoryPostgres } from '../../infrastructure/database/repositories/NotificacionRepository';
import { UsuarioSistemaRepositoryPostgres } from '../../infrastructure/database/repositories/UsuarioSistemaRepository';

export class ContactoController {
  private getUseCase(): SolicitarContactoAgenteUseCase {
    return new SolicitarContactoAgenteUseCase(solicitudContactoRepository);
  }

  /**
   * POST /api/contactos
   * Crea una nueva solicitud de contacto (lead). Asigna automáticamente número de afiliado.
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const {
        pacienteId,
        nombreCompleto,
        telefono,
        email,
        whatsapp,
        sucursalId,
        sucursalNombre,
        motivo,
        motivoDetalle,
        preferenciaContacto,
        origen
      } = req.body;

      let noAfiliacion: string | undefined;
      try {
        const pacienteRepo = new PacienteRepositoryPostgres();
        noAfiliacion = await pacienteRepo.obtenerSiguienteNoAfiliacion();
      } catch {
        // Si falla (ej. BD no disponible), continuar sin número de afiliado
      }

      const resultado = await this.getUseCase().ejecutar({
        pacienteId,
        nombreCompleto,
        telefono,
        email,
        whatsapp,
        sucursalId,
        sucursalNombre,
        motivo,
        motivoDetalle,
        preferenciaContacto,
        origen: origen || 'Web',
        creadoPor: 'Cliente',
        noAfiliacion,
      });

      // Notificar a Contact Center y Admin (in-app + disponibilidad para push/email/Matrix)
      this.notificarNuevoLeadAContactCenter(resultado.solicitud).catch(() => {});

      res.status(201).json({
        success: true,
        solicitud: resultado.solicitud,
        mensaje: resultado.mensaje,
        tiempoRespuestaEstimado: resultado.tiempoRespuestaEstimado,
        notificacionEnviada: resultado.notificacionEnviada
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * Crea notificaciones in-app para usuarios Contact_Center y Admin (nuevo lead).
   * Permite que el frontend/Matrix muestre "Nuevo lead" y en el futuro push/email.
   */
  private async notificarNuevoLeadAContactCenter(solicitud: { id: string; nombreCompleto: string; sucursalNombre: string; origen: string; noAfiliacion?: string }): Promise<void> {
    try {
      const pool = Database.getInstance().getPool();
      const notifRepo = new NotificacionRepositoryPostgres(pool);
      const userRepo = new UsuarioSistemaRepositoryPostgres();
      const contactCenter = await userRepo.obtenerPorRol('Contact_Center');
      const admins = await userRepo.obtenerPorRol('Admin');
      const userIds = [...new Set([...contactCenter, ...admins].map((u) => u.id))];
      const titulo = 'Nuevo lead';
      const mensaje = `${solicitud.nombreCompleto} · ${solicitud.sucursalNombre} · Origen: ${solicitud.origen}${solicitud.noAfiliacion ? ` · No. Afiliado: ${solicitud.noAfiliacion}` : ''}`;
      for (const usuarioId of userIds) {
        await notifRepo.crear({
          usuarioId,
          tipo: 'nuevo_lead',
          titulo,
          mensaje,
          data: { solicitudId: solicitud.id },
          canal: 'App',
        });
      }
    } catch {
      // No bloquear la creación del lead si falla la notificación
    }
  }

  /**
   * GET /api/contactos/:id
   * Obtiene una solicitud por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const solicitud = await solicitudContactoRepository.obtenerPorId(id);

      if (!solicitud) {
        res.status(404).json({
          success: false,
          error: 'Solicitud no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        solicitud
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/contactos/sucursal/:sucursalId
   * Obtiene solicitudes de una sucursal
   */
  async obtenerPorSucursal(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const solicitudes = await solicitudContactoRepository.obtenerPorSucursal(sucursalId);

      res.json({
        success: true,
        solicitudes,
        total: solicitudes.length
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/contactos/pendientes
   * Obtiene solicitudes pendientes de atención
   */
  async obtenerPendientes(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.query;

      let solicitudes;
      if (sucursalId) {
        solicitudes = await this.getUseCase().obtenerPendientesPorSucursal(
          sucursalId as string
        );
      } else {
        solicitudes = await solicitudContactoRepository.obtenerPendientes();
      }

      res.json({
        success: true,
        solicitudes,
        total: solicitudes.length
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/contactos/vencidas
   * Obtiene solicitudes vencidas (más de 2 horas sin respuesta)
   */
  async obtenerVencidas(_req: Request, res: Response): Promise<void> {
    try {
      const solicitudes = await solicitudContactoRepository.obtenerVencidas();

      res.json({
        success: true,
        solicitudes,
        total: solicitudes.length
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * POST /api/contactos/:id/asignar
   * Asigna un agente a la solicitud
   */
  async asignarAgente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { agenteId, agenteNombre } = req.body;

      if (!agenteId || !agenteNombre) {
        res.status(400).json({
          success: false,
          error: 'agenteId y agenteNombre son requeridos'
        });
        return;
      }

      const solicitud = await this.getUseCase().asignarAgente(
        id,
        agenteId,
        agenteNombre
      );

      res.json({
        success: true,
        solicitud,
        mensaje: `Solicitud asignada a ${agenteNombre}`
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * POST /api/contactos/:id/iniciar-contacto
   * Marca que el agente inició contacto con el cliente
   */
  async iniciarContacto(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notas } = req.body;

      const solicitud = await this.getUseCase().iniciarContacto(id, notas);

      res.json({
        success: true,
        solicitud,
        mensaje: 'Contacto iniciado'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * POST /api/contactos/:id/resolver
   * Resuelve la solicitud
   */
  async resolver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolucion } = req.body;

      if (!resolucion) {
        res.status(400).json({
          success: false,
          error: 'resolucion es requerida'
        });
        return;
      }

      const solicitud = await this.getUseCase().resolver(id, resolucion);

      res.json({
        success: true,
        solicitud,
        mensaje: 'Solicitud resuelta exitosamente'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/contactos/estadisticas
   * Obtiene estadísticas de solicitudes
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.query;

      const estadisticas = await solicitudContactoRepository.obtenerEstadisticas(
        sucursalId as string | undefined
      );

      res.json({
        success: true,
        estadisticas
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/contactos/catalogo/motivos
   * Obtiene catálogo de motivos de contacto
   */
  async obtenerCatalogoMotivos(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      motivos: CATALOGO_MOTIVOS_CONTACTO
    });
  }

  /**
   * GET /api/contactos
   * Lista todas las solicitudes con filtros opcionales
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { estado, sucursalId, agenteId } = req.query;

      let solicitudes;

      if (estado) {
        solicitudes = await solicitudContactoRepository.obtenerPorEstado(
          estado as any
        );
      } else if (sucursalId) {
        solicitudes = await solicitudContactoRepository.obtenerPorSucursal(
          sucursalId as string
        );
      } else if (agenteId) {
        solicitudes = await solicitudContactoRepository.obtenerPorAgente(
          agenteId as string
        );
      } else {
        solicitudes = await solicitudContactoRepository.obtenerTodas();
      }

      res.json({
        success: true,
        solicitudes,
        total: solicitudes.length
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}
