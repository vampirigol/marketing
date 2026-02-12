import { WhatsAppService } from '../messaging/WhatsAppService';
import { FacebookService } from '../messaging/FacebookService';
import { InstagramService } from '../messaging/InstagramService';
import { CitaEntity } from '../../core/entities/Cita';
import { PacienteEntity } from '../../core/entities/Paciente';
import { AbonoEntity } from '../../core/entities/Abono';

/**
 * Servicio unificado de notificaciones
 * 
 * Orquesta el envío de notificaciones a través de múltiples canales:
 * - WhatsApp Business
 * - Facebook Messenger
 * - Instagram Direct
 * - Email (futuro)
 * - SMS (futuro)
 * 
 * Usado por:
 * - Casos de uso (ReagendarPromocion, CrearCita, etc.)
 * - Cron jobs para recordatorios automáticos
 * - Sistema de auditoría
 */

interface NotificacionCita {
  cita: CitaEntity;
  paciente: PacienteEntity;
  tipoNotificacion: 'confirmacion' | 'recordatorio_24h' | 'recordatorio_dia' | 'reagendacion' | 'cancelacion';
  datosAdicionales?: {
    precioAnterior?: number;
    precioNuevo?: number;
    razon?: string;
    sucursalNombre?: string;
    sucursalDireccion?: string;
    doctorNombre?: string;
  };
}

interface NotificacionAbono {
  abono: AbonoEntity;
  paciente: PacienteEntity;
  cita: CitaEntity;
}

interface ResultadoNotificacion {
  enviado: boolean;
  canal: 'whatsapp' | 'facebook' | 'instagram' | 'email' | 'sms' | 'ninguno';
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private whatsappService: WhatsAppService;
  private facebookService: FacebookService;
  private instagramService: InstagramService;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.facebookService = new FacebookService();
    this.instagramService = new InstagramService();
  }

  /**
   * Determina el canal preferido según origen del paciente
   */
  private determinarCanalPreferido(paciente: PacienteEntity, canalOrigen?: string): 'whatsapp' | 'facebook' | 'instagram' {
    // Si viene del canal de origen, usar ese
    if (canalOrigen) {
      if (canalOrigen === 'WhatsApp' && paciente.whatsapp) return 'whatsapp';
      if (canalOrigen === 'Facebook') return 'facebook';
      if (canalOrigen === 'Instagram') return 'instagram';
    }

    // Por defecto, preferir WhatsApp si tiene número
    if (paciente.whatsapp || paciente.telefono) {
      return 'whatsapp';
    }

    // Sino, usar el origen del lead
    if (paciente.origenLead === 'Facebook') return 'facebook';
    if (paciente.origenLead === 'Instagram') return 'instagram';

    return 'whatsapp'; // Default
  }

  /**
   * Envía confirmación de cita recién agendada
   */
  async enviarConfirmacionCita(notificacion: NotificacionCita): Promise<ResultadoNotificacion> {
    const { cita, paciente, datosAdicionales } = notificacion;
    const canal = this.determinarCanalPreferido(paciente);

    try {
      const datos = {
        nombrePaciente: paciente.nombreCompleto,
        fecha: cita.fechaCita.toLocaleDateString('es-MX', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        hora: cita.horaCita,
        sucursal: datosAdicionales?.sucursalNombre || 'Sucursal RCA',
        doctor: datosAdicionales?.doctorNombre || 'Doctor',
        costo: cita.costoConsulta
      };

      let resultado;

      switch (canal) {
        case 'whatsapp':
          resultado = await this.whatsappService.enviarConfirmacionCita({
            telefono: paciente.whatsapp || paciente.telefono,
            ...datos
          });
          break;

        case 'facebook':
          resultado = await this.facebookService.enviarConfirmacionCita({
            recipientId: paciente.id, // Aquí iría el PSID de Facebook
            ...datos
          });
          break;

        case 'instagram':
          resultado = await this.instagramService.enviarConfirmacionCita({
            recipientId: paciente.id, // Aquí iría el IGSID de Instagram
            fecha: datos.fecha,
            hora: datos.hora,
            sucursal: datos.sucursal,
            nombrePaciente: datos.nombrePaciente
          });
          break;

        default:
          return {
            enviado: false,
            canal: 'ninguno',
            error: 'No se pudo determinar canal de comunicación'
          };
      }

      return {
        enviado: resultado.success,
        canal,
        messageId: resultado.messageId,
        error: resultado.error
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando confirmación:', errorMessage);
      return {
        enviado: false,
        canal,
        error: errorMessage
      };
    }
  }

  /**
   * Envía recordatorio 24 horas antes de la cita
   */
  async enviarRecordatorio24h(notificacion: NotificacionCita): Promise<ResultadoNotificacion> {
    const { cita, paciente, datosAdicionales } = notificacion;
    const canal = this.determinarCanalPreferido(paciente);

    try {
      const datos = {
        nombrePaciente: paciente.nombreCompleto,
        fecha: cita.fechaCita.toLocaleDateString('es-MX'),
        hora: cita.horaCita,
        sucursal: datosAdicionales?.sucursalNombre || 'Sucursal RCA'
      };

      let resultado;

      switch (canal) {
        case 'whatsapp':
          resultado = await this.whatsappService.enviarRecordatorio24h({
            telefono: paciente.whatsapp || paciente.telefono,
            ...datos
          });
          break;

        case 'facebook':
          resultado = await this.facebookService.enviarRecordatorio({
            recipientId: paciente.id,
            ...datos
          });
          break;

        case 'instagram':
          resultado = await this.instagramService.enviarRecordatorio({
            recipientId: paciente.id,
            ...datos
          });
          break;

        default:
          return {
            enviado: false,
            canal: 'ninguno',
            error: 'Canal no configurado'
          };
      }

      return {
        enviado: resultado.success,
        canal,
        messageId: resultado.messageId,
        error: resultado.error
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando recordatorio 24h:', errorMessage);
      return {
        enviado: false,
        canal,
        error: errorMessage
      };
    }
  }

  /**
   * Envía recordatorio el día de la cita (2 horas antes)
   */
  async enviarRecordatorioDiaCita(notificacion: NotificacionCita): Promise<ResultadoNotificacion> {
    const { cita, paciente, datosAdicionales } = notificacion;
    const canal = this.determinarCanalPreferido(paciente);

    try {
      if (canal === 'whatsapp') {
        const resultado = await this.whatsappService.enviarRecordatorioDiaCita({
          telefono: paciente.whatsapp || paciente.telefono,
          nombrePaciente: paciente.nombreCompleto,
          hora: cita.horaCita,
          sucursal: datosAdicionales?.sucursalNombre || 'Sucursal RCA',
          direccion: datosAdicionales?.sucursalDireccion || ''
        });

        return {
          enviado: resultado.success,
          canal: 'whatsapp',
          messageId: resultado.messageId,
          error: resultado.error
        };
      }

      // Para FB e IG usar recordatorio simple
      return this.enviarRecordatorio24h(notificacion);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando recordatorio día cita:', errorMessage);
      return {
        enviado: false,
        canal,
        error: errorMessage
      };
    }
  }

  /**
   * Notifica cambio de precio por reagendación (REGLA DE ORO)
   */
  async notificarCambioPrecio(notificacion: NotificacionCita): Promise<ResultadoNotificacion> {
    const { cita, paciente, datosAdicionales } = notificacion;
    const canal = this.determinarCanalPreferido(paciente);

    if (!datosAdicionales?.precioAnterior || !datosAdicionales?.precioNuevo) {
      return {
        enviado: false,
        canal: 'ninguno',
        error: 'Faltan datos de precios'
      };
    }

    try {
      if (canal === 'whatsapp') {
        const resultado = await this.whatsappService.notificarCambioPrecio({
          telefono: paciente.whatsapp || paciente.telefono,
          nombrePaciente: paciente.nombreCompleto,
          nuevaFecha: cita.fechaCita.toLocaleDateString('es-MX'),
          nuevaHora: cita.horaCita,
          precioAnterior: datosAdicionales.precioAnterior,
          precioNuevo: datosAdicionales.precioNuevo,
          razon: datosAdicionales.razon || 'Por política de la clínica, al reagendar más de una vez se pierde la promoción.'
        });

        return {
          enviado: resultado.success,
          canal: 'whatsapp',
          messageId: resultado.messageId,
          error: resultado.error
        };
      }

      // Para otros canales, envío genérico
      const mensaje = `🔄 Tu cita ha sido reagendada. IMPORTANTE: El precio cambió de $${datosAdicionales.precioAnterior} a $${datosAdicionales.precioNuevo} MXN.`;
      
      let resultado;
      if (canal === 'facebook') {
        resultado = await this.facebookService.enviarMensaje(paciente.id, mensaje);
      } else {
        resultado = await this.instagramService.enviarMensaje(paciente.id, mensaje);
      }

      return {
        enviado: resultado.success,
        canal,
        messageId: resultado.messageId,
        error: resultado.error
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error notificando cambio precio:', errorMessage);
      return {
        enviado: false,
        canal,
        error: errorMessage
      };
    }
  }

  /**
   * Envía recibo de pago por WhatsApp
   */
  async enviarReciboAbono(notificacion: NotificacionAbono): Promise<ResultadoNotificacion> {
    const { abono, paciente } = notificacion;

    if (!paciente.whatsapp && !paciente.telefono) {
      return {
        enviado: false,
        canal: 'ninguno',
        error: 'Paciente sin WhatsApp configurado'
      };
    }

    try {
      const resultado = await this.whatsappService.enviarRecibo({
        telefono: paciente.whatsapp || paciente.telefono,
        nombrePaciente: paciente.nombreCompleto,
        folioRecibo: abono.folioRecibo,
        monto: abono.monto,
        metodoPago: abono.metodoPago,
        fecha: abono.fechaPago.toLocaleDateString('es-MX')
      });

      return {
        enviado: resultado.success,
        canal: 'whatsapp',
        messageId: resultado.messageId,
        error: resultado.error
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando recibo:', errorMessage);
      return {
        enviado: false,
        canal: 'whatsapp',
        error: errorMessage
      };
    }
  }

  /**
   * Notifica a paciente que pasó a lista de espera (no llegó)
   */
  async notificarListaEspera(notificacion: NotificacionCita): Promise<ResultadoNotificacion> {
    const { cita, paciente } = notificacion;
    const canal = this.determinarCanalPreferido(paciente);

    try {
      if (canal === 'whatsapp') {
        const resultado = await this.whatsappService.notificarListaEspera({
          telefono: paciente.whatsapp || paciente.telefono,
          nombrePaciente: paciente.nombreCompleto,
          fechaCita: cita.fechaCita.toLocaleDateString('es-MX'),
          horaCita: cita.horaCita
        });

        return {
          enviado: resultado.success,
          canal: 'whatsapp',
          messageId: resultado.messageId,
          error: resultado.error
        };
      }

      // Mensaje genérico para otros canales
      const mensaje = `😔 ${paciente.nombreCompleto}, te extrañamos hoy. ¿Deseas reagendar tu cita?`;
      
      let resultado;
      if (canal === 'facebook') {
        resultado = await this.facebookService.enviarMensaje(paciente.id, mensaje);
      } else {
        resultado = await this.instagramService.enviarMensaje(paciente.id, mensaje);
      }

      return {
        enviado: resultado.success,
        canal,
        messageId: resultado.messageId,
        error: resultado.error
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error notificando lista espera:', errorMessage);
      return {
        enviado: false,
        canal,
        error: errorMessage
      };
    }
  }

  /**
   * Envía notificación a través del canal especificado directamente
   */
  async enviarNotificacionDirecta(
    canal: 'whatsapp' | 'facebook' | 'instagram',
    destinatario: string,
    mensaje: string
  ): Promise<ResultadoNotificacion> {
    try {
      let resultado;

      switch (canal) {
        case 'whatsapp':
          resultado = await this.whatsappService.enviarMensaje({
            to: destinatario,
            body: mensaje
          });
          break;

        case 'facebook':
          resultado = await this.facebookService.enviarMensaje(destinatario, mensaje);
          break;

        case 'instagram':
          resultado = await this.instagramService.enviarMensaje(destinatario, mensaje);
          break;
      }

      return {
        enviado: resultado.success,
        canal,
        messageId: resultado.messageId,
        error: resultado.error
      };

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Error desconocido';
      return {
        enviado: false,
        canal,
        error: errMsg
      };
    }
  }

  /**
   * Verifica qué servicios están configurados
   */
  getEstadoServicios(): {
    whatsapp: boolean;
    facebook: boolean;
    instagram: boolean;
  } {
    return {
      whatsapp: this.whatsappService.isConfigured(),
      facebook: this.facebookService.isConfigured(),
      instagram: this.instagramService.isConfigured()
    };
  }
}
