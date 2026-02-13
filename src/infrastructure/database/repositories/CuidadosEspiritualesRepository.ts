import { Pool } from 'pg';
import Database from '../Database';

export interface CuidadosEspiritualesRegistro {
  id: string;
  pacienteId: string;
  fechaAtencion: Date;
  createdAt: Date;
}

export class CuidadosEspiritualesRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async registrarAsistencia(pacienteId: string, fechaAtencion?: Date): Promise<CuidadosEspiritualesRegistro> {
    const fecha = fechaAtencion
      ? fechaAtencion instanceof Date
        ? fechaAtencion.toISOString().slice(0, 10)
        : String(fechaAtencion).slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const result = await this.pool.query(
      `INSERT INTO cuidados_espirituales_registro (paciente_id, fecha_atencion)
       VALUES ($1, $2::date)
       RETURNING id, paciente_id, fecha_atencion AS "fechaAtencion", created_at AS "createdAt"`,
      [pacienteId, fecha]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      fechaAtencion: row.fechaAtencion,
      createdAt: row.createdAt,
    };
  }

  async obtenerPorPaciente(pacienteId: string): Promise<CuidadosEspiritualesRegistro[]> {
    const result = await this.pool.query(
      `SELECT id, paciente_id AS "pacienteId", fecha_atencion AS "fechaAtencion", created_at AS "createdAt"
       FROM cuidados_espirituales_registro
       WHERE paciente_id = $1
       ORDER BY fecha_atencion DESC`,
      [pacienteId]
    );
    return result.rows;
  }

  /** Indica si el paciente tiene al menos una asistencia registrada (para UI "Asistencia Registrada") */
  async tieneAsistencia(pacienteId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM cuidados_espirituales_registro WHERE paciente_id = $1 LIMIT 1`,
      [pacienteId]
    );
    return result.rows.length > 0;
  }

  /** Última fecha de asistencia (opcional, para mostrar en perfil) */
  async ultimaAsistencia(pacienteId: string): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT fecha_atencion FROM cuidados_espirituales_registro
       WHERE paciente_id = $1 ORDER BY fecha_atencion DESC LIMIT 1`,
      [pacienteId]
    );
    return result.rows[0]?.fecha_atencion ?? null;
  }

  /** KPI: total de atenciones registradas (todas o en un rango de fechas) */
  async contarAtendidos(opciones?: { desde?: string; hasta?: string }): Promise<number> {
    const values: string[] = [];
    const conditions: string[] = [];
    if (opciones?.desde) {
      values.push(opciones.desde);
      conditions.push(`fecha_atencion >= $${values.length}::date`);
    }
    if (opciones?.hasta) {
      values.push(opciones.hasta);
      conditions.push(`fecha_atencion <= $${values.length}::date`);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM cuidados_espirituales_registro${where}`,
      values
    );
    return result.rows[0]?.total ?? 0;
  }
}
