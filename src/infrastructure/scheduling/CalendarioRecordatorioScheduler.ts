import cron from 'node-cron';
import { EventoCalendarioRepositoryPostgres } from '../database/repositories/EventoCalendarioRepository';
import Database from '../database/Database';
import { NotificacionRepositoryPostgres } from '../database/repositories/NotificacionRepository';

/**
 * Scheduler que envía notificaciones de recordatorio para eventos del calendario
 * cuando llega la hora (fecha_inicio - recordatorio_minutos).
 * Se ejecuta cada minuto.
 */
export class CalendarioRecordatorioScheduler {
  private cronJob?: cron.ScheduledTask;
  private eventoRepo: EventoCalendarioRepositoryPostgres;
  private notificacionRepo: NotificacionRepositoryPostgres;

  constructor() {
    this.eventoRepo = new EventoCalendarioRepositoryPostgres();
    this.notificacionRepo = new NotificacionRepositoryPostgres(Database.getInstance().getPool());
  }

  start(): void {
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.ejecutarRecordatorios();
    });
    console.log('✅ CalendarioRecordatorioScheduler iniciado (cada minuto)');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
    }
    console.log('⏹️  CalendarioRecordatorioScheduler detenido');
  }

  private async ejecutarRecordatorios(): Promise<void> {
    try {
      const ahora = new Date();
      const pendientes = await this.eventoRepo.obtenerPendientesRecordatorio(ahora);

      for (const evento of pendientes) {
        if (!evento.creadoPorId) continue;

        const horaInicio = evento.fechaInicio instanceof Date
          ? evento.fechaInicio
          : new Date(evento.fechaInicio);
        const textoHora = horaInicio.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        });

        await this.notificacionRepo.crear({
          usuarioId: evento.creadoPorId,
          tipo: 'Alerta_Sistema',
          titulo: `Recordatorio: ${evento.titulo}`,
          mensaje: `El evento "${evento.titulo}" comienza a las ${textoHora}${evento.ubicacion ? ` (${evento.ubicacion})` : ''}.`,
          data: { eventoId: evento.id, fechaInicio: horaInicio.toISOString() },
          canal: 'App',
        });

        await this.eventoRepo.actualizar(evento.id, { recordatorioEnviado: true });
      }
    } catch (err) {
      console.error('Error en CalendarioRecordatorioScheduler:', err);
    }
  }
}
