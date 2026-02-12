import { Pool } from 'pg';
import Database from '../Database';

export type EstadoBrigada = 'planificada' | 'en_curso' | 'finalizada';

export interface BrigadaEntity {
  id: string;
  nombre: string;
  ubicacion: string | null;
  ciudad: string;
  estado_brigada: EstadoBrigada;
  fecha_inicio: string;
  fecha_fin: string | null;
  sucursal_id: string | null;
  observaciones: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CrearBrigadaInput {
  nombre: string;
  ubicacion?: string;
  ciudad: string;
  estado_brigada?: EstadoBrigada;
  fecha_inicio: string;
  fecha_fin?: string;
  sucursal_id?: string;
  observaciones?: string;
}

export interface ActualizarBrigadaInput {
  nombre?: string;
  ubicacion?: string;
  ciudad?: string;
  estado_brigada?: EstadoBrigada;
  fecha_inicio?: string;
  fecha_fin?: string;
  sucursal_id?: string | null;
  observaciones?: string | null;
}

export interface BrigadaRepository {
  listar(): Promise<BrigadaEntity[]>;
  obtenerPorId(id: string): Promise<BrigadaEntity | null>;
  crear(datos: CrearBrigadaInput): Promise<BrigadaEntity>;
  actualizar(id: string, datos: ActualizarBrigadaInput): Promise<BrigadaEntity | null>;
  eliminar(id: string): Promise<boolean>;
}

function mapRow(row: Record<string, unknown>): BrigadaEntity {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    ubicacion: row.ubicacion != null ? String(row.ubicacion) : null,
    ciudad: String(row.ciudad),
    estado_brigada: (row.estado_brigada as EstadoBrigada) || 'planificada',
    fecha_inicio: String(row.fecha_inicio),
    fecha_fin: row.fecha_fin != null ? String(row.fecha_fin) : null,
    sucursal_id: row.sucursal_id != null ? String(row.sucursal_id) : null,
    observaciones: row.observaciones != null ? String(row.observaciones) : null,
    fecha_creacion: String(row.fecha_creacion),
    fecha_actualizacion: String(row.fecha_actualizacion),
  };
}

export class BrigadaRepositoryPostgres implements BrigadaRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async listar(): Promise<BrigadaEntity[]> {
    const result = await this.pool.query(
      'SELECT * FROM brigadas_medicas ORDER BY fecha_inicio DESC, nombre'
    );
    return result.rows.map(mapRow);
  }

  async obtenerPorId(id: string): Promise<BrigadaEntity | null> {
    const result = await this.pool.query('SELECT * FROM brigadas_medicas WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async crear(datos: CrearBrigadaInput): Promise<BrigadaEntity> {
    const result = await this.pool.query(
      `INSERT INTO brigadas_medicas (
        nombre, ubicacion, ciudad, estado_brigada, fecha_inicio, fecha_fin, sucursal_id, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        datos.nombre,
        datos.ubicacion ?? null,
        datos.ciudad,
        datos.estado_brigada ?? 'planificada',
        datos.fecha_inicio,
        datos.fecha_fin ?? null,
        datos.sucursal_id ?? null,
        datos.observaciones ?? null,
      ]
    );
    return mapRow(result.rows[0]);
  }

  async actualizar(id: string, datos: ActualizarBrigadaInput): Promise<BrigadaEntity | null> {
    const current = await this.obtenerPorId(id);
    if (!current) return null;

    const nombre = datos.nombre ?? current.nombre;
    const ubicacion = datos.ubicacion !== undefined ? datos.ubicacion : current.ubicacion;
    const ciudad = datos.ciudad ?? current.ciudad;
    const estado_brigada = datos.estado_brigada ?? current.estado_brigada;
    const fecha_inicio = datos.fecha_inicio ?? current.fecha_inicio;
    const fecha_fin = datos.fecha_fin !== undefined ? datos.fecha_fin : current.fecha_fin;
    const sucursal_id = datos.sucursal_id !== undefined ? datos.sucursal_id : current.sucursal_id;
    const observaciones = datos.observaciones !== undefined ? datos.observaciones : current.observaciones;

    const result = await this.pool.query(
      `UPDATE brigadas_medicas SET
        nombre = $1, ubicacion = $2, ciudad = $3, estado_brigada = $4,
        fecha_inicio = $5, fecha_fin = $6, sucursal_id = $7, observaciones = $8,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $9 RETURNING *`,
      [nombre, ubicacion, ciudad, estado_brigada, fecha_inicio, fecha_fin, sucursal_id, observaciones, id]
    );
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async eliminar(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM brigadas_medicas WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
