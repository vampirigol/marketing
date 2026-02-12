import { Pool } from "pg";

export interface Notificacion {
  id: string;
  usuarioId?: string;
  pacienteId?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  data?: any;
  leida: boolean;
  fechaLectura?: string;
  enviada: boolean;
  canal?: string;
  creadoEn: string;
}

export class NotificacionRepositoryPostgres {
  constructor(private pool: Pool) {}

  async crear(notificacion: Omit<Notificacion, "id" | "leida" | "enviada" | "creadoEn">): Promise<Notificacion> {
    const query = `
      INSERT INTO notificaciones (
        usuario_id, paciente_id, tipo, titulo, mensaje, data, canal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      notificacion.usuarioId || null,
      notificacion.pacienteId || null,
      notificacion.tipo,
      notificacion.titulo,
      notificacion.mensaje,
      JSON.stringify(notificacion.data || {}),
      notificacion.canal || "App",
    ]);

    return this.mapFromDb(result.rows[0]);
  }

  async obtenerPorUsuario(usuarioId: string, limit = 50): Promise<Notificacion[]> {
    const query = `
      SELECT * FROM notificaciones
      WHERE usuario_id = $1
      ORDER BY creado_en DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [usuarioId, limit]);
    return result.rows.map(this.mapFromDb);
  }

  async obtenerNoLeidas(usuarioId: string): Promise<Notificacion[]> {
    const query = `
      SELECT * FROM notificaciones
      WHERE usuario_id = $1 AND leida = false
      ORDER BY creado_en DESC
    `;

    const result = await this.pool.query(query, [usuarioId]);
    return result.rows.map(this.mapFromDb);
  }

  async marcarComoLeida(notificacionId: string): Promise<void> {
    await this.pool.query(
      "UPDATE notificaciones SET leida = true, fecha_lectura = CURRENT_TIMESTAMP WHERE id = $1",
      [notificacionId]
    );
  }

  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    await this.pool.query(
      "UPDATE notificaciones SET leida = true, fecha_lectura = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND leida = false",
      [usuarioId]
    );
  }

  async contarNoLeidas(usuarioId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = $1 AND leida = false",
      [usuarioId]
    );
    return parseInt(result.rows[0].total, 10);
  }

  private mapFromDb(row: any): Notificacion {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      pacienteId: row.paciente_id,
      tipo: row.tipo,
      titulo: row.titulo,
      mensaje: row.mensaje,
      data: row.data,
      leida: row.leida,
      fechaLectura: row.fecha_lectura,
      enviada: row.enviada,
      canal: row.canal,
      creadoEn: row.creado_en,
    };
  }
}
