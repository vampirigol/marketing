import { Pool } from 'pg';
import Database from '../Database';

export interface AuditoriaEvento {
  id: string;
  entidad: string;
  entidadId: string;
  accion: string;
  usuarioId?: string;
  usuarioNombre?: string;
  detalles?: Record<string, any>;
  fechaEvento: Date;
}

export class AuditoriaRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async registrar(data: {
    entidad: string;
    entidadId: string;
    accion: string;
    usuarioId?: string;
    usuarioNombre?: string;
    detalles?: Record<string, any>;
  }): Promise<void> {
    const query = `
      INSERT INTO auditoria_eventos (
        entidad, entidad_id, accion, usuario_id, usuario_nombre, detalles
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      data.entidad,
      data.entidadId,
      data.accion,
      data.usuarioId || null,
      data.usuarioNombre || null,
      data.detalles ? JSON.stringify(data.detalles) : null,
    ];
    await this.pool.query(query, values);
  }

  async listar(params: {
    entidad?: string;
    entidadId?: string;
    limit?: number;
  }): Promise<AuditoriaEvento[]> {
    const filters: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.entidad) {
      filters.push(`entidad = $${idx}`);
      values.push(params.entidad);
      idx += 1;
    }

    if (params.entidadId) {
      filters.push(`entidad_id = $${idx}`);
      values.push(params.entidadId);
      idx += 1;
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const limit = params.limit || 50;
    values.push(limit);

    const query = `
      SELECT id, entidad, entidad_id, accion, usuario_id, usuario_nombre, detalles, fecha_evento
      FROM auditoria_eventos
      ${where}
      ORDER BY fecha_evento DESC
      LIMIT $${idx}
    `;

    const result = await this.pool.query(query, values);
    return result.rows.map((row) => ({
      id: row.id,
      entidad: row.entidad,
      entidadId: row.entidad_id,
      accion: row.accion,
      usuarioId: row.usuario_id,
      usuarioNombre: row.usuario_nombre,
      detalles: row.detalles || undefined,
      fechaEvento: row.fecha_evento,
    }));
  }
}
