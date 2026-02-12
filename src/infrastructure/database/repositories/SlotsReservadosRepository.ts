import { Pool } from 'pg';
import Database from '../Database';

export class SlotsReservadosRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  /** Reserva un slot temporalmente (5-10 min por defecto) */
  async reservar(data: {
    sucursalId: string;
    fechaCita: string;
    horaCita: string;
    medicoAsignado?: string;
    sessionId: string;
    duracionMinutos?: number;
  }): Promise<{ id: string }> {
    const duracion = data.duracionMinutos ?? 10;
    const expiraEn = new Date(Date.now() + duracion * 60 * 1000);

    const query = `
      INSERT INTO slots_reservados_temporal 
        (sucursal_id, fecha_cita, hora_cita, medico_asignado, session_id, expira_en)
      VALUES ($1, $2::date, $3::time, $4, $5, $6)
      RETURNING id
    `;
    const result = await this.pool.query(query, [
      data.sucursalId,
      data.fechaCita,
      data.horaCita,
      data.medicoAsignado || null,
      data.sessionId,
      expiraEn,
    ]);
    return { id: result.rows[0].id };
  }

  /** Verifica si el slot está reservado para esta sesión (válido) */
  async estaReservadoParaSesion(data: {
    sucursalId: string;
    fechaCita: string;
    horaCita: string;
    medicoAsignado?: string;
    sessionId: string;
  }): Promise<boolean> {
    const horaNorm = data.horaCita.length === 5 ? data.horaCita : data.horaCita.slice(0, 5);
    const query = `
      SELECT 1 FROM slots_reservados_temporal
      WHERE sucursal_id = $1 AND fecha_cita = $2::date 
        AND hora_cita::text LIKE $3 || '%'
        AND ($4::text IS NULL OR medico_asignado = $4 OR medico_asignado IS NULL)
        AND session_id = $5
        AND expira_en > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    const result = await this.pool.query(query, [
      data.sucursalId,
      data.fechaCita,
      horaNorm,
      data.medicoAsignado || null,
      data.sessionId,
    ]);
    return result.rows.length > 0;
  }

  /** Libera la reserva al confirmar la cita */
  async liberar(data: {
    sucursalId: string;
    fechaCita: string;
    horaCita: string;
    medicoAsignado?: string;
    sessionId: string;
  }): Promise<void> {
    const horaNorm = data.horaCita.length === 5 ? data.horaCita : data.horaCita.slice(0, 5);
    await this.pool.query(
      `DELETE FROM slots_reservados_temporal
       WHERE sucursal_id = $1 AND fecha_cita = $2::date 
         AND hora_cita::text LIKE $3 || '%'
         AND ($4::text IS NULL OR medico_asignado = $4 OR medico_asignado IS NULL)
         AND session_id = $5`,
      [data.sucursalId, data.fechaCita, horaNorm, data.medicoAsignado || null, data.sessionId]
    );
  }

  /** Cuenta cuántos slots están reservados en un horario (para disponibilidad) */
  async contarReservados(data: {
    sucursalId: string;
    fechaCita: string;
    horaCita: string;
    medicoAsignado?: string;
  }): Promise<number> {
    const horaNorm = data.horaCita.length === 5 ? data.horaCita : data.horaCita.slice(0, 5);
    const query = `
      SELECT COUNT(*)::int AS total FROM slots_reservados_temporal
      WHERE sucursal_id = $1 AND fecha_cita = $2::date 
        AND hora_cita::text LIKE $3 || '%'
        AND ($4::text IS NULL OR medico_asignado = $4 OR medico_asignado IS NULL)
        AND expira_en > CURRENT_TIMESTAMP
    `;
    const result = await this.pool.query(query, [
      data.sucursalId,
      data.fechaCita,
      horaNorm,
      data.medicoAsignado || null,
    ]);
    return result.rows[0]?.total ?? 0;
  }

  /** Limpia slots expirados (ejecutar periódicamente) */
  async limpiarExpirados(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM slots_reservados_temporal WHERE expira_en <= CURRENT_TIMESTAMP`
    );
    return result.rowCount ?? 0;
  }
}
