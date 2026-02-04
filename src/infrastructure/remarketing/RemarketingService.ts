/**
 * Servicio: Remarketing
 * Gestiona las campañas de recuperación de pacientes perdidos
 */

import { InasistenciaEntity, MotivoInasistencia } from '../../core/entities/Inasistencia';
import { InasistenciaRepository } from '../database/repositories/InasistenciaRepository';
import { WhatsAppService } from '../messaging/WhatsAppService';
import { FacebookService } from '../messaging/FacebookService';
import { InstagramService } from '../messaging/InstagramService';

export interface CampanaRemarketing {
  id: string;
  nombre: string;
  motivo: MotivoInasistencia;
  mensajePlantilla: string;
  diasEspera: number;
  activa: boolean;
}

export interface ResultadoRemarketing {
  inasistenciaId: string;
  pacienteId: string;
  campana: string;
  canal: 'WhatsApp' | 'Facebook' | 'Instagram';
  enviado: boolean;
  fecha: Date;
  error?: string;
}

export class RemarketingService {
  private campanas: Map<string, CampanaRemarketing> = new Map();

  constructor(
    private inasistenciaRepo: InasistenciaRepository,
    private whatsappService: WhatsAppService,
    private facebookService: FacebookService,
    private instagramService: InstagramService
  ) {
    this.inicializarCampanas();
  }

  /**
   * Inicializa las campañas de remarketing predefinidas
   */
  private inicializarCampanas(): void {
    const campanas: CampanaRemarketing[] = [
      {
        id: 'RECOVERY_Economico',
        nombre: 'Recuperación - Económico',
        motivo: 'Economico',
        mensajePlantilla: `Hola {nombre} 👋

Entendemos que a veces surgen imprevistos económicos. 💰

En Clínicas Adventistas queremos ayudarte a cuidar tu salud. Tenemos opciones de:
✅ Planes de pago flexibles
✅ Consultas con descuento
✅ Promociones especiales

¿Te gustaría reagendar tu cita? Estamos aquí para apoyarte. 🏥

Responde SÍ para coordinar una nueva fecha.`,
        diasEspera: 2,
        activa: true
      },
      {
        id: 'RECOVERY_Transporte',
        nombre: 'Recuperación - Transporte',
        motivo: 'Transporte',
        mensajePlantilla: `Hola {nombre} 👋

Notamos que tuviste dificultades para llegar a tu cita. 🚗

¿Sabías que tenemos varias sucursales? Podemos ayudarte a encontrar la más cercana a tu ubicación. 📍

También ofrecemos:
✅ Horarios flexibles
✅ Teleconsulta (si aplica)

¿Te gustaría reagendar? Responde SÍ y te ayudamos.`,
        diasEspera: 1,
        activa: true
      },
      {
        id: 'RECOVERY_Salud',
        nombre: 'Recuperación - Salud',
        motivo: 'Salud',
        mensajePlantilla: `Hola {nombre} 👋

Esperamos que te encuentres mejor. 🙏

Nos importa tu salud y queremos asegurarnos de que recibas la atención que necesitas. 

¿Te gustaría reagendar tu consulta? Podemos ayudarte a encontrar una fecha que se ajuste a tu recuperación.

Responde SÍ cuando estés listo/a.`,
        diasEspera: 3,
        activa: true
      },
      {
        id: 'RECOVERY_Olvido',
        nombre: 'Recuperación - Olvido',
        motivo: 'Olvido',
        mensajePlantilla: `Hola {nombre} 👋

¡No te preocupes! Sabemos que a veces se nos olvidan las citas. 📅

Para que no vuelva a pasar, te ofrecemos:
✅ Recordatorios automáticos por WhatsApp
✅ Llamada de confirmación 24h antes
✅ Horarios que se ajusten a tu rutina

¿Reagendamos tu cita? Responde SÍ y te ayudamos inmediatamente. 🏥`,
        diasEspera: 1,
        activa: true
      },
      {
        id: 'RECOVERY_No_Responde',
        nombre: 'Recuperación - Sin Respuesta',
        motivo: 'No_Responde',
        mensajePlantilla: `Hola {nombre} 👋

Hemos intentado contactarte sin éxito. Nos gustaría saber cómo podemos ayudarte. 🏥

Tu salud es importante para nosotros. Si prefieres otro medio de contacto o un horario específico, házmelo saber.

¿Podemos reagendar tu consulta? Responde cuando puedas. ⏰`,
        diasEspera: 2,
        activa: true
      },
      {
        id: 'RECOVERY_Otro',
        nombre: 'Recuperación - General',
        motivo: 'Otro',
        mensajePlantilla: `Hola {nombre} 👋

Notamos que no pudiste asistir a tu cita. Esperamos que todo esté bien. 🙏

En Clínicas Adventistas estamos comprometidos con tu salud y bienestar. 

¿Te gustaría reagendar? Estamos aquí para ayudarte cuando lo necesites.

Responde SÍ para coordinar una nueva fecha. 🏥`,
        diasEspera: 2,
        activa: true
      }
    ];

    campanas.forEach(c => this.campanas.set(c.id, c));
  }

  /**
   * Obtiene la lista de pacientes para remarketing
   */
  async obtenerListaRemarketing(sucursalId?: string): Promise<InasistenciaEntity[]> {
    const lista = await this.inasistenciaRepo.obtenerListaRemarketing(sucursalId);
    return lista.map(i => new InasistenciaEntity(i));
  }

  /**
   * Ejecuta campaña de remarketing para inasistencias específicas
   */
  async ejecutarCampana(
    inasistencias: string[],
    canal: 'WhatsApp' | 'Facebook' | 'Instagram' = 'WhatsApp'
  ): Promise<ResultadoRemarketing[]> {
    const resultados: ResultadoRemarketing[] = [];

    for (const id of inasistencias) {
      const resultado = await this.enviarMensajeRemarketing(id, canal);
      resultados.push(resultado);
    }

    return resultados;
  }

  /**
   * Envía mensaje de remarketing a una inasistencia
   */
  private async enviarMensajeRemarketing(
    inasistenciaId: string,
    canal: 'WhatsApp' | 'Facebook' | 'Instagram'
  ): Promise<ResultadoRemarketing> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(inasistenciaId);
      
      if (!inasistencia) {
        return {
          inasistenciaId,
          pacienteId: '',
          campana: '',
          canal,
          enviado: false,
          fecha: new Date(),
          error: 'Inasistencia no encontrada'
        };
      }

      if (inasistencia.bloqueadoMarketing) {
        return {
          inasistenciaId,
          pacienteId: inasistencia.pacienteId,
          campana: inasistencia.campaignRemarketing || '',
          canal,
          enviado: false,
          fecha: new Date(),
          error: 'Paciente bloqueado - No contactar'
        };
      }

      // Obtener campaña
      const campana = inasistencia.campaignRemarketing 
        ? this.campanas.get(inasistencia.campaignRemarketing)
        : undefined;

      if (!campana) {
        return {
          inasistenciaId,
          pacienteId: inasistencia.pacienteId,
          campana: '',
          canal,
          enviado: false,
          fecha: new Date(),
          error: 'Campaña no encontrada'
        };
      }

      // TODO: Obtener datos del paciente para personalizar mensaje
      const mensaje = this.personalizarMensaje(campana.mensajePlantilla, {
        nombre: 'Paciente' // TODO: Obtener nombre real
      });

      // Enviar según el canal
      let enviado = false;
      let error: string | undefined;

      try {
        switch (canal) {
          case 'WhatsApp':
            await this.whatsappService.enviarMensaje({
              to: inasistencia.pacienteId, // TODO: Obtener número real del paciente
              body: mensaje,
              type: 'text'
            });
            enviado = true;
            break;
          case 'Facebook':
            await this.facebookService.enviarMensaje(inasistencia.pacienteId, mensaje);
            enviado = true;
            break;
          case 'Instagram':
            await this.instagramService.enviarMensaje(inasistencia.pacienteId, mensaje);
            enviado = true;
            break;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Error al enviar mensaje';
      }

      // Registrar intento en la inasistencia
      const entity = new InasistenciaEntity(inasistencia);
      entity.registrarIntentoContacto(
        `Campaña remarketing enviada por ${canal}: ${campana.nombre}`
      );
      await this.inasistenciaRepo.actualizar(inasistenciaId, entity);

      return {
        inasistenciaId,
        pacienteId: inasistencia.pacienteId,
        campana: campana.nombre,
        canal,
        enviado,
        fecha: new Date(),
        error
      };
    } catch (error) {
      return {
        inasistenciaId,
        pacienteId: '',
        campana: '',
        canal,
        enviado: false,
        fecha: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Personaliza mensaje con datos del paciente
   */
  private personalizarMensaje(
    plantilla: string,
    datos: { nombre: string }
  ): string {
    return plantilla.replace('{nombre}', datos.nombre);
  }

  /**
   * Obtiene estadísticas de remarketing
   */
  async obtenerEstadisticas(sucursalId?: string): Promise<{
    totalEnLista: number;
    porMotivo: { motivo: MotivoInasistencia; cantidad: number }[];
    porPrioridad: { prioridad: string; cantidad: number }[];
    tasaRecuperacion: number;
  }> {
    const lista = await this.obtenerListaRemarketing(sucursalId);
    const total = lista.length;

    // Por motivo
    const motivosMap = new Map<MotivoInasistencia, number>();
    lista.forEach(i => {
      if (i.motivo) {
        motivosMap.set(i.motivo, (motivosMap.get(i.motivo) || 0) + 1);
      }
    });
    const porMotivo = Array.from(motivosMap.entries()).map(([motivo, cantidad]) => ({ motivo, cantidad }));

    // Por prioridad
    const prioridadMap = new Map<string, number>();
    lista.forEach(i => {
      const prioridad = i.obtenerConfigMotivo()?.prioridad || 'Baja';
      prioridadMap.set(prioridad, (prioridadMap.get(prioridad) || 0) + 1);
    });
    const porPrioridad = Array.from(prioridadMap.entries()).map(([prioridad, cantidad]) => ({ prioridad, cantidad }));

    // Tasa de recuperación
    const stats = await this.inasistenciaRepo.obtenerEstadisticas(sucursalId);

    return {
      totalEnLista: total,
      porMotivo,
      porPrioridad,
      tasaRecuperacion: stats.tasaRecuperacion
    };
  }

  /**
   * Agregar manualmente a remarketing
   */
  async agregarARemarketing(inasistenciaId: string): Promise<boolean> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(inasistenciaId);
      if (!inasistencia || inasistencia.bloqueadoMarketing) {
        return false;
      }

      const entity = new InasistenciaEntity(inasistencia);
      entity.agregarARemarketing();
      await this.inasistenciaRepo.actualizar(inasistenciaId, entity);
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remover de remarketing
   */
  async removerDeRemarketing(inasistenciaId: string): Promise<boolean> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(inasistenciaId);
      if (!inasistencia) {
        return false;
      }

      const entity = new InasistenciaEntity(inasistencia);
      entity.removerDeRemarketing();
      await this.inasistenciaRepo.actualizar(inasistenciaId, entity);
      
      return true;
    } catch {
      return false;
    }
  }
}
