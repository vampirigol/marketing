import { Pool } from 'pg';
import Database from '../Database';

export type TipoRecordatorio = 'confirmacion' | 'recordatorio_24h' | 'recordatorio_dia' | 'recordatorio_2h';

export interface RecordatorioCita {
  id: string;
  citaId: string;
  tipo: TipoRecordatorio;
  fechaEjecucion: Date;
  ejecutado: boolean;
  ejecutadoAt?: Date;
  canal: string;
  mensajeId?: string;
  error?: string;
  createdAt: Date;
}

export class RecordatoriosCitasRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(data: {
    citaId: string;
    tipo: TipoRecordatorio;
    fechaEjecucion: Date;
    canal?: string;
  }): Promise<RecordatorioCita> {
    const query = `
      INSERT INTO recordatorios_citas (cita_id, tipo, fecha_ejecucion, canal)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      data.citaId,
      data.tipo,
      data.fechaEjecucion,
      data.canal || 'whatsapp',
    ]);
    return this.mapRow(result.rows[0]);
  }

  async obtenerPendientes(antesDe: Date): Promise<RecordatorioCita[]> {
    const query = `
      SELECT * FROM recordatorios_citas
      WHERE ejecutado = false AND fecha_ejecucion <= $1
      ORDER BY fecha_ejecucion ASC
      LIMIT 50
    `;
    const result = await this.pool.query(query, [antesDe]);
    return result.rows.map((r: any) => this.mapRow(r));
  }

  async marcarEjecutado(
    id: string,
    data: { mensajeId?: string; error?: string }
  ): Promise<void> {
    const query = `
      UPDATE recordatorios_citas
      SET ejecutado = true, ejecutado_at = CURRENT_TIMESTAMP,
          mensaje_id = COALESCE($2, mensaje_id), error = COALESCE($3, error)
      WHERE id = $1
    `;
    await this.pool.query(query, [id, data.mensajeId || null, data.error || null]);
  }

  async cancelarPorCita(citaId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM recordatorios_citas WHERE cita_id = $1 AND ejecutado = false`,
      [citaId]
    );
  }

  private mapRow(row: any): RecordatorioCita {
    return {
      id: row.id,
      citaId: row.cita_id,
      tipo: row.tipo,
      fechaEjecucion: row.fecha_ejecucion,
      ejecutado: row.ejecutado,
      ejecutadoAt: row.ejecutado_at,
      canal: row.canal,
      mensajeId: row.mensaje_id,
      error: row.error,
      createdAt: row.created_at,
    };
  }
}
