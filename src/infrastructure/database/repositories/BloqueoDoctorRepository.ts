import Database from '../Database';

export type BloqueoDoctor = {
  id: string;
  medicoId?: string;
  medicoNombre: string;
  tipo: 'fecha' | 'semanal';
  categoria?: 'vacaciones' | 'comida' | 'urgencia' | 'personal' | 'otro';
  fecha?: string;
  diaSemana?: number;
  horaInicio?: string;
  horaFin?: string;
  motivo?: string;
  creadoPor?: string;
  createdAt?: string;
};

export class BloqueoDoctorRepository {
  private pool = Database.getInstance().getPool();

  async crear(payload: Omit<BloqueoDoctor, 'id' | 'createdAt'>): Promise<BloqueoDoctor> {
    const query = `
      INSERT INTO doctor_bloqueos (
        medico_id, medico_nombre, tipo, categoria, fecha, dia_semana, hora_inicio, hora_fin, motivo, creado_por
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const values = [
      payload.medicoId || null,
      payload.medicoNombre,
      payload.tipo,
      payload.categoria || 'personal',
      payload.fecha || null,
      payload.diaSemana ?? null,
      payload.horaInicio || null,
      payload.horaFin || null,
      payload.motivo || null,
      payload.creadoPor || null,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async eliminar(id: string, medicoNombre?: string): Promise<void> {
    if (medicoNombre) {
      await this.pool.query(
        'DELETE FROM doctor_bloqueos WHERE id = $1 AND medico_nombre = $2',
        [id, medicoNombre]
      );
      return;
    }
    await this.pool.query('DELETE FROM doctor_bloqueos WHERE id = $1', [id]);
  }

  async listarPorMedico(medicoNombre: string): Promise<BloqueoDoctor[]> {
    const result = await this.pool.query(
      'SELECT * FROM doctor_bloqueos WHERE medico_nombre = $1 ORDER BY created_at DESC',
      [medicoNombre]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async obtenerParaFecha(medicoNombre: string, fecha: string): Promise<BloqueoDoctor[]> {
    const date = new Date(`${fecha}T00:00:00`);
    const diaSemana = date.getDay();
    const result = await this.pool.query(
      `SELECT * FROM doctor_bloqueos
       WHERE medico_nombre = $1
       AND (
         (tipo = 'fecha' AND fecha = $2::date)
         OR (tipo = 'semanal' AND dia_semana = $3)
       )`,
      [medicoNombre, fecha, diaSemana]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: any): BloqueoDoctor {
    return {
      id: row.id,
      medicoId: row.medico_id || undefined,
      medicoNombre: row.medico_nombre,
      tipo: row.tipo,
      categoria: row.categoria || undefined,
      fecha: row.fecha ? String(row.fecha).slice(0, 10) : undefined,
      diaSemana: row.dia_semana ?? undefined,
      horaInicio: row.hora_inicio ? String(row.hora_inicio).slice(0, 5) : undefined,
      horaFin: row.hora_fin ? String(row.hora_fin).slice(0, 5) : undefined,
      motivo: row.motivo || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }
}
