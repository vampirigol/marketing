import { Pool } from 'pg';
import Database from '../Database';

export interface SolicitudListaEspera {
  id: string;
  nombreCompleto: string;
  telefono: string;
  email?: string;
  sucursalId?: string;
  especialidad?: string;
  preferenciaFechaDesde?: Date;
  preferenciaFechaHasta?: Date;
  notas?: string;
  estado: 'Pendiente' | 'Asignada' | 'Cancelada' | 'Expirada';
  citaId?: string;
  pacienteId?: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

function mapRow(row: any): SolicitudListaEspera {
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    telefono: row.telefono,
    email: row.email,
    sucursalId: row.sucursal_id,
    especialidad: row.especialidad,
    preferenciaFechaDesde: row.preferencia_fecha_desde,
    preferenciaFechaHasta: row.preferencia_fecha_hasta,
    notas: row.notas,
    estado: row.estado,
    citaId: row.cita_id,
    pacienteId: row.paciente_id,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}

export class ListaEsperaRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(data: Omit<SolicitudListaEspera, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<SolicitudListaEspera> {
    const result = await this.pool.query(
      `INSERT INTO solicitudes_lista_espera (
        nombre_completo, telefono, email, sucursal_id, especialidad,
        preferencia_fecha_desde, preferencia_fecha_hasta, notas, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.nombreCompleto,
        data.telefono,
        data.email ?? null,
        data.sucursalId ?? null,
        data.especialidad ?? null,
        data.preferenciaFechaDesde ?? null,
        data.preferenciaFechaHasta ?? null,
        data.notas ?? null,
        data.estado ?? 'Pendiente',
      ]
    );
    return mapRow(result.rows[0]);
  }

  async listar(filtros?: { estado?: string; sucursalId?: string }): Promise<SolicitudListaEspera[]> {
    let query = 'SELECT * FROM solicitudes_lista_espera WHERE 1=1';
    const values: any[] = [];
    let idx = 1;
    if (filtros?.estado) {
      query += ` AND estado = $${idx}`;
      values.push(filtros.estado);
      idx++;
    }
    if (filtros?.sucursalId) {
      query += ` AND (sucursal_id = $${idx} OR sucursal_id IS NULL)`;
      values.push(filtros.sucursalId);
      idx++;
    }
    query += ' ORDER BY creado_en DESC';
    const result = await this.pool.query(query, values);
    return result.rows.map(mapRow);
  }

  async obtenerPorId(id: string): Promise<SolicitudListaEspera | null> {
    const result = await this.pool.query('SELECT * FROM solicitudes_lista_espera WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async asignarCita(id: string, citaId: string, pacienteId?: string): Promise<SolicitudListaEspera | null> {
    const result = await this.pool.query(
      `UPDATE solicitudes_lista_espera SET estado = 'Asignada', cita_id = $2, paciente_id = $3, actualizado_en = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, citaId, pacienteId ?? null]
    );
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async cancelar(id: string): Promise<void> {
    await this.pool.query(
      "UPDATE solicitudes_lista_espera SET estado = 'Cancelada', actualizado_en = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
  }
}
