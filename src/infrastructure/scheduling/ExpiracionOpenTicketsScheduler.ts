/**
 * Scheduler: Expiración de Open Tickets
 * Marca automáticamente los tickets que han superado su fecha de validez
 */

import cron from 'node-cron';
import { OpenTicketRepositoryPostgres } from '../database/repositories/OpenTicketRepository';
import { OpenTicketEntity } from '../../core/entities/OpenTicket';

export class ExpiracionOpenTicketsScheduler {
  private repository: OpenTicketRepositoryPostgres;
  private job?: cron.ScheduledTask;

  constructor() {
    this.repository = new OpenTicketRepositoryPostgres();
  }

  /**
   * Inicia el scheduler
   * Se ejecuta todos los días a las 00:01 AM
   */
  iniciar(): void {
    console.log('📋 Iniciando scheduler de expiración de Open Tickets...');

    // Ejecutar todos los días a las 00:01 AM
    this.job = cron.schedule('1 0 * * *', async () => {
      await this.ejecutar();
    });

    console.log('✅ Scheduler de expiración de Open Tickets iniciado');
    console.log('⏰ Se ejecutará diariamente a las 00:01 AM');
  }

  /**
   * Detiene el scheduler
   */
  detener(): void {
    if (this.job) {
      this.job.stop();
      console.log('🛑 Scheduler de expiración de Open Tickets detenido');
    }
  }

  /**
   * Ejecuta la tarea de marcar tickets expirados
   */
  async ejecutar(): Promise<void> {
    try {
      console.log('🔄 Ejecutando tarea de expiración de Open Tickets...');
      const inicio = Date.now();

      const cantidad = await this.repository.marcarTicketsExpirados();

      const duracion = Date.now() - inicio;
      
      if (cantidad > 0) {
        console.log(`✅ ${cantidad} ticket(s) marcado(s) como expirado(s) en ${duracion}ms`);
        
        // Aquí se podría enviar notificación a administradores
        await this.notificarTicketsExpirados(cantidad);
      } else {
        console.log(`✓ No hay tickets para expirar (${duracion}ms)`);
      }

    } catch (error) {
      console.error('❌ Error al marcar tickets expirados:', error);
      // Aquí se podría enviar alerta a los administradores
      await this.notificarError(error);
    }
  }

  /**
   * Envía notificación sobre tickets expirados
   */
  private async notificarTicketsExpirados(cantidad: number): Promise<void> {
    try {
      // TODO: Implementar notificación (email, Slack, etc.)
      console.log(`📧 Notificación: ${cantidad} tickets expirados hoy`);
    } catch (error) {
      console.error('Error al enviar notificación de tickets expirados:', error);
    }
  }

  /**
   * Envía alerta sobre errores en el scheduler
   */
  private async notificarError(error: unknown): Promise<void> {
    try {
      // TODO: Implementar alerta de error
      console.error('🚨 Alerta: Error en scheduler de expiración de tickets:', error);
    } catch (err) {
      console.error('Error al enviar alerta de error:', err);
    }
  }

  /**
   * Obtiene estadísticas de tickets próximos a expirar
   */
  async obtenerProximosAExpirar(dias: number = 3): Promise<OpenTicketEntity[]> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      const tickets = await this.repository.listar({
        estado: 'Activo',
        vigentes: true,
      });

      // Filtrar tickets que expiran en los próximos X días
      return tickets.filter((ticket: OpenTicketEntity) => {
        return ticket.fechaValidoHasta <= fechaLimite;
      });

    } catch (error) {
      console.error('Error al obtener tickets próximos a expirar:', error);
      return [];
    }
  }
}

// Instancia singleton del scheduler
let schedulerInstance: ExpiracionOpenTicketsScheduler | null = null;

/**
 * Obtiene o crea la instancia del scheduler
 */
export function obtenerSchedulerExpiracion(): ExpiracionOpenTicketsScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ExpiracionOpenTicketsScheduler();
  }
  return schedulerInstance;
}
