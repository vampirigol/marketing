/**
 * Scheduler: No Confirmado -> No Asistió
 * Cada hora busca citas pasadas con estado "Agendada" (no confirmadas),
 * marca el lead vinculado como NO_ASISTIO y lo añade a la lista de recuperación.
 */

import cron from 'node-cron';
import Database from '../database/Database';
import { solicitudContactoRepository } from '../database/repositories/SolicitudContactoRepository';

export class MarkNoShowsScheduler {
  private job?: cron.ScheduledTask;

  start(): void {
    this.job = cron.schedule('0 * * * *', async () => {
      await this.ejecutar();
    });
    console.log('✅ Scheduler MarkNoShows (No Confirmado -> No Asistió) iniciado - cada hora');
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = undefined;
    }
    console.log('⏹️  Scheduler MarkNoShows detenido');
  }

  /**
   * Citas con fecha+hora pasada y estado Agendada (no confirmadas) -> lead a NO_ASISTIO y lista recovery.
   */
  async ejecutar(): Promise<{ procesados: number; detalles: string[] }> {
    const detalles: string[] = [];
    let procesados = 0;

    try {
      const pool = Database.getInstance().getPool();

      const citasExpiradas = await pool.query(
        `SELECT id, paciente_id, sucursal_id, fecha_cita, hora_cita, estado
         FROM citas
         WHERE estado = 'Agendada'
           AND (fecha_cita + hora_cita) < NOW()
         ORDER BY fecha_cita, hora_cita`
      );

      if (citasExpiradas.rows.length === 0) {
        return { procesados: 0, detalles: [] };
      }

      const citaIds = citasExpiradas.rows.map((r: { id: string }) => r.id);
      const solicitudes = await solicitudContactoRepository.obtenerIdsPorCitaIds(citaIds);

      for (const sol of solicitudes) {
        await solicitudContactoRepository.actualizarLeadStatus(sol.id, 'NO_ASISTIO', true);
        procesados++;
        detalles.push(`Lead ${sol.id} (cita ${sol.cita_id}) -> NO_ASISTIO, en_lista_recovery=true`);
      }

      if (procesados > 0) {
        await pool.query(
          `UPDATE citas SET estado = 'No_Asistio', ultima_actualizacion = CURRENT_TIMESTAMP
           WHERE id = ANY($1::uuid[])`,
          [citaIds]
        );
      }

      if (procesados > 0) {
        console.log(`[MarkNoShows] ${procesados} lead(s) marcados como No Asistió, ${citaIds.length} cita(s) actualizadas`);
      }
    } catch (err) {
      console.error('[MarkNoShows] Error:', err);
      detalles.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    return { procesados, detalles };
  }
}
