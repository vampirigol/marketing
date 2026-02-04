/**
 * Caso de Uso: Solicitar Contacto de Agente
 * Permite que un cliente solicite ser contactado por un agente de una sucursal específica
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SolicitudContactoEntity, 
  MotivoContacto, 
  PreferenciaContacto 
} from '../entities/SolicitudContacto';
import { SolicitudContactoRepository } from '../../infrastructure/database/repositories/SolicitudContactoRepository';
import { NotificationService } from '../../infrastructure/notifications/NotificationService';

export interface SolicitarContactoDTO {
  // Información del solicitante
  pacienteId?: string; // Si ya es paciente registrado
  nombreCompleto: string;
  telefono: string;
  email?: string;
  whatsapp?: string;
  
  // Detalles de la solicitud
  sucursalId: string;
  sucursalNombre: string;
  motivo: MotivoContacto;
  motivoDetalle?: string;
  preferenciaContacto: PreferenciaContacto;
  
  // Metadata
  origen?: 'Web' | 'WhatsApp' | 'Facebook' | 'Instagram' | 'Telefono';
  creadoPor?: string;
}

export interface SolicitarContactoResultado {
  solicitud: SolicitudContactoEntity;
  mensaje: string;
  tiempoRespuestaEstimado: number; // minutos
  notificacionEnviada: boolean;
}

export class SolicitarContactoAgenteUseCase {
  constructor(
    private solicitudRepo: SolicitudContactoRepository,
    private notificationService?: NotificationService
  ) {}

  async ejecutar(dto: SolicitarContactoDTO): Promise<SolicitarContactoResultado> {
    // 1. Validar datos requeridos
    this.validarDatos(dto);

    // 2. Determinar prioridad automática
    const prioridad = SolicitudContactoEntity.determinarPrioridad(dto.motivo);

    // 3. Crear solicitud
    const solicitud = new SolicitudContactoEntity({
      id: uuidv4(),
      pacienteId: dto.pacienteId,
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      email: dto.email,
      whatsapp: dto.whatsapp,
      sucursalId: dto.sucursalId,
      sucursalNombre: dto.sucursalNombre,
      motivo: dto.motivo,
      motivoDetalle: dto.motivoDetalle,
      preferenciaContacto: dto.preferenciaContacto,
      estado: 'Pendiente',
      prioridad,
      intentosContacto: 0,
      origen: dto.origen || 'Web',
      creadoPor: dto.creadoPor || 'Cliente',
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    });

    // 4. Guardar en repositorio
    const solicitudGuardada = await this.solicitudRepo.crear(solicitud);

    // 5. Notificar al cliente (confirmación)
    let notificacionEnviada = false;
    if (this.notificationService) {
      try {
        await this.enviarConfirmacionCliente(solicitud);
        notificacionEnviada = true;
      } catch (error) {
        console.warn('No se pudo enviar confirmación al cliente:', error);
      }
    }

    // 6. Notificar a agentes de la sucursal (en producción, sería un sistema de cola)
    if (this.notificationService) {
      try {
        await this.notificarAgentesSucursal(solicitud);
      } catch (error) {
        console.warn('No se pudo notificar a agentes:', error);
      }
    }

    // 7. Obtener tiempo de respuesta estimado
    const tiempoRespuestaEstimado = this.obtenerTiempoRespuestaEstimado(solicitud);

    return {
      solicitud: new SolicitudContactoEntity(solicitudGuardada),
      mensaje: this.generarMensajeConfirmacion(solicitud, tiempoRespuestaEstimado),
      tiempoRespuestaEstimado,
      notificacionEnviada
    };
  }

  /**
   * Validar datos de entrada
   */
  private validarDatos(dto: SolicitarContactoDTO): void {
    if (!dto.nombreCompleto || dto.nombreCompleto.trim().length < 3) {
      throw new Error('Nombre completo es requerido (mínimo 3 caracteres)');
    }

    if (!dto.telefono || dto.telefono.trim().length < 10) {
      throw new Error('Teléfono válido es requerido');
    }

    if (!dto.sucursalId) {
      throw new Error('Debe seleccionar una sucursal');
    }

    if (!dto.motivo) {
      throw new Error('Debe indicar el motivo de contacto');
    }

    if (!dto.preferenciaContacto) {
      throw new Error('Debe indicar su preferencia de contacto');
    }

    // Validar que tenga el canal correspondiente
    if (dto.preferenciaContacto === 'WhatsApp' && !dto.whatsapp && !dto.telefono) {
      throw new Error('Debe proporcionar número de WhatsApp o teléfono');
    }

    if (dto.preferenciaContacto === 'Email' && !dto.email) {
      throw new Error('Debe proporcionar correo electrónico');
    }
  }

  /**
   * Obtener tiempo de respuesta estimado según prioridad
   */
  private obtenerTiempoRespuestaEstimado(solicitud: SolicitudContactoEntity): number {
    switch (solicitud.prioridad) {
      case 'Alta':
        return 15; // 15 minutos
      case 'Media':
        return 60; // 1 hora
      case 'Baja':
        return 120; // 2 horas
      default:
        return 60;
    }
  }

  /**
   * Generar mensaje de confirmación para el cliente
   */
  private generarMensajeConfirmacion(
    solicitud: SolicitudContactoEntity,
    tiempoEstimado: number
  ): string {
    const tiempoTexto = tiempoEstimado < 60 
      ? `${tiempoEstimado} minutos`
      : `${Math.floor(tiempoEstimado / 60)} hora(s)`;

    return `¡Solicitud registrada exitosamente! Un agente de ${solicitud.sucursalNombre} se comunicará contigo en aproximadamente ${tiempoTexto} por ${solicitud.preferenciaContacto}.`;
  }

  /**
   * Enviar confirmación al cliente
   */
  private async enviarConfirmacionCliente(solicitud: SolicitudContactoEntity): Promise<void> {
    const tiempoEstimado = this.obtenerTiempoRespuestaEstimado(solicitud);
    const tiempoTexto = tiempoEstimado < 60 
      ? `${tiempoEstimado} minutos`
      : `${Math.floor(tiempoEstimado / 60)} hora(s)`;

    const mensaje = `✅ *Solicitud de Contacto Registrada*

Hola ${solicitud.nombreCompleto} 👋

Hemos recibido tu solicitud:
📍 Sucursal: ${solicitud.sucursalNombre}
📋 Motivo: ${this.traducirMotivo(solicitud.motivo)}
⏱️ Tiempo estimado de respuesta: ${tiempoTexto}

Un asesor se comunicará contigo pronto por ${solicitud.preferenciaContacto}.

Número de solicitud: #${solicitud.id.substring(0, 8).toUpperCase()}

Gracias por tu preferencia 🙌`;

    // Enviar por el canal preferido
    if (this.notificationService) {
      try {
        if (solicitud.preferenciaContacto === 'WhatsApp' && solicitud.whatsapp) {
          await this.notificationService.enviarNotificacionDirecta(
            'whatsapp',
            solicitud.whatsapp,
            mensaje
          );
        }
      } catch (error) {
        console.warn('Error enviando confirmación:', error);
      }
    }
  }

  /**
   * Notificar a agentes de la sucursal
   */
  private async notificarAgentesSucursal(solicitud: SolicitudContactoEntity): Promise<void> {
    // En producción, esto debería:
    // 1. Consultar lista de agentes de la sucursal
    // 2. Enviar notificación push/email/WhatsApp a agentes disponibles
    // 3. Crear tarea en sistema de tickets
    
    console.log(`📢 [NOTIFICACIÓN AGENTES] Nueva solicitud de contacto:`);
    console.log(`   • Sucursal: ${solicitud.sucursalNombre}`);
    console.log(`   • Cliente: ${solicitud.nombreCompleto}`);
    console.log(`   • Motivo: ${solicitud.motivo}`);
    console.log(`   • Prioridad: ${solicitud.prioridad}`);
    console.log(`   • ID: ${solicitud.id}`);
  }

  /**
   * Traducir motivo a texto legible
   */
  private traducirMotivo(motivo: MotivoContacto): string {
    const traducciones: Record<MotivoContacto, string> = {
      'Consulta_General': 'Consulta general',
      'Cotizacion': 'Cotización de servicios',
      'Reagendar_Cita': 'Reagendar cita',
      'Cancelar_Cita': 'Cancelar cita',
      'Informacion_Servicios': 'Información de servicios',
      'Queja_Sugerencia': 'Queja o sugerencia',
      'Urgencia': 'Urgencia',
      'Otro': 'Otro'
    };

    return traducciones[motivo] || motivo;
  }

  /**
   * Obtener solicitudes pendientes de una sucursal
   */
  async obtenerPendientesPorSucursal(sucursalId: string): Promise<SolicitudContactoEntity[]> {
    const solicitudes = await this.solicitudRepo.obtenerPorSucursal(sucursalId);
    return solicitudes
      .filter(s => s.estado === 'Pendiente' || s.estado === 'Asignada')
      .map(s => new SolicitudContactoEntity(s))
      .sort((a, b) => {
        // Ordenar por prioridad y antigüedad
        const prioridadPeso = { Alta: 3, Media: 2, Baja: 1 };
        if (prioridadPeso[a.prioridad] !== prioridadPeso[b.prioridad]) {
          return prioridadPeso[b.prioridad] - prioridadPeso[a.prioridad];
        }
        return a.fechaCreacion.getTime() - b.fechaCreacion.getTime();
      });
  }

  /**
   * Asignar agente a una solicitud
   */
  async asignarAgente(
    solicitudId: string,
    agenteId: string,
    agenteNombre: string
  ): Promise<SolicitudContactoEntity> {
    const solicitud = await this.solicitudRepo.obtenerPorId(solicitudId);
    
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    const entity = new SolicitudContactoEntity(solicitud);
    entity.asignarAgente(agenteId, agenteNombre);

    const actualizada = await this.solicitudRepo.actualizar(solicitudId, entity);
    return new SolicitudContactoEntity(actualizada);
  }

  /**
   * Registrar inicio de contacto
   */
  async iniciarContacto(solicitudId: string, notas?: string): Promise<SolicitudContactoEntity> {
    const solicitud = await this.solicitudRepo.obtenerPorId(solicitudId);
    
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    const entity = new SolicitudContactoEntity(solicitud);
    entity.iniciarContacto();
    
    if (notas) {
      entity.notas = notas;
    }

    const actualizada = await this.solicitudRepo.actualizar(solicitudId, entity);
    return new SolicitudContactoEntity(actualizada);
  }

  /**
   * Resolver solicitud
   */
  async resolver(solicitudId: string, resolucion: string): Promise<SolicitudContactoEntity> {
    const solicitud = await this.solicitudRepo.obtenerPorId(solicitudId);
    
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    const entity = new SolicitudContactoEntity(solicitud);
    entity.resolver(resolucion);

    const actualizada = await this.solicitudRepo.actualizar(solicitudId, entity);
    return new SolicitudContactoEntity(actualizada);
  }
}
