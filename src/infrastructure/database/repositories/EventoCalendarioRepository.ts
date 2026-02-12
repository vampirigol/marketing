import { Pool } from 'pg';
import Database from '../Database';

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: 'reunion' | 'evento' | 'capacitacion' | 'recordatorio' | 'otro';
  calendario: 'personal' | 'compania';
  sucursalId?: string;
  creadoPorId?: string;
  creadoPorNombre?: string;
  ubicacion?: string;
  esTodoElDia: boolean;
  esPrivado: boolean;
  color: string;
  participantes: Array<{ id?: string; nombre: string; email?: string }>;
  recordatorioMinutos?: number;
  recordatorioEnviado?: boolean;
  citaId?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface EventoCalendarioRepository {
  crear(evento: Omit<EventoCalendario, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<EventoCalendario>;
  obtenerPorId(id: string): Promise<EventoCalendario | null>;
  obtenerPorRango(
    fechaInicio: Date,
    fechaFin: Date,
    opts?: { calendario?: 'personal' | 'compania'; creadoPorId?: string; sucursalId?: string }
  ): Promise<EventoCalendario[]>;
  /** Eventos con recordatorio configurado cuya hora de recordatorio ya pasó (para enviar notificación) */
  obtenerPendientesRecordatorio(antesDe: Date): Promise<EventoCalendario[]>;
  actualizar(id: string, datos: Partial<EventoCalendario>): Promise<EventoCalendario>;
  eliminar(id: string): Promise<void>;
}

function mapRow(row: any): EventoCalendario {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    tipo: row.tipo,
    calendario: row.calendario,
    sucursalId: row.sucursal_id,
    creadoPorId: row.creado_por_id,
    creadoPorNombre: row.creado_por_nombre,
    ubicacion: row.ubicacion,
    esTodoElDia: row.es_todo_el_dia ?? false,
    esPrivado: row.es_privado ?? false,
    color: row.color ?? '#3B82F6',
    participantes: Array.isArray(row.participantes) ? row.participantes : (row.participantes ? JSON.parse(row.participantes) : []),
    recordatorioMinutos: row.recordatorio_minutos,
    recordatorioEnviado: row.recordatorio_enviado ?? false,
    citaId: row.cita_id,
    fechaCreacion: row.fecha_creacion,
    fechaActualizacion: row.fecha_actualizacion,
  };
}

export class EventoCalendarioRepositoryPostgres implements EventoCalendarioRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(evento: Omit<EventoCalendario, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<EventoCalendario> {
    const query = `
      INSERT INTO eventos_calendario (
        titulo, descripcion, fecha_inicio, fecha_fin, tipo, calendario,
        sucursal_id, creado_por_id, creado_por_nombre, ubicacion,
        es_todo_el_dia, es_privado, color, participantes, recordatorio_minutos, cita_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16)
      RETURNING *
    `;
    const values = [
      evento.titulo,
      evento.descripcion ?? null,
      evento.fechaInicio,
      evento.fechaFin,
      evento.tipo,
      evento.calendario,
      evento.sucursalId ?? null,
      evento.creadoPorId ?? null,
      evento.creadoPorNombre ?? null,
      evento.ubicacion ?? null,
      evento.esTodoElDia ?? false,
      evento.esPrivado ?? false,
      evento.color ?? '#3B82F6',
      JSON.stringify(evento.participantes ?? []),
      evento.recordatorioMinutos ?? null,
      evento.citaId ?? null,
    ];
    const result = await this.pool.query(query, values);
    return mapRow(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<EventoCalendario | null> {
    const result = await this.pool.query('SELECT * FROM eventos_calendario WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async obtenerPorRango(
    fechaInicio: Date,
    fechaFin: Date,
    opts?: { calendario?: 'personal' | 'compania'; creadoPorId?: string; sucursalId?: string }
  ): Promise<EventoCalendario[]> {
    let query = `
      SELECT * FROM eventos_calendario
      WHERE fecha_inicio <= $2 AND fecha_fin >= $1
    `;
    const values: any[] = [fechaInicio, fechaFin];
    let idx = 3;
    if (opts?.calendario) {
      query += ` AND calendario = $${idx}`;
      values.push(opts.calendario);
      idx++;
    }
    if (opts?.creadoPorId) {
      query += ` AND creado_por_id = $${idx}`;
      values.push(opts.creadoPorId);
      idx++;
    }
    if (opts?.sucursalId) {
      query += ` AND (sucursal_id = $${idx} OR sucursal_id IS NULL)`;
      values.push(opts.sucursalId);
    }
    query += ' ORDER BY fecha_inicio ASC';
    const result = await this.pool.query(query, values);
    return result.rows.map(mapRow);
  }

  async obtenerPendientesRecordatorio(antesDe: Date): Promise<EventoCalendario[]> {
    const result = await this.pool.query(
      `SELECT * FROM eventos_calendario
       WHERE recordatorio_minutos IS NOT NULL AND recordatorio_minutos > 0
         AND (recordatorio_enviado = false OR recordatorio_enviado IS NULL)
         AND creado_por_id IS NOT NULL
         AND (fecha_inicio - (recordatorio_minutos || 0) * interval '1 minute') <= $1
       ORDER BY fecha_inicio ASC`,
      [antesDe]
    );
    return result.rows.map(mapRow);
  }

  async actualizar(id: string, datos: Partial<EventoCalendario>): Promise<EventoCalendario> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    const map: Record<string, string> = {
      titulo: 'titulo',
      descripcion: 'descripcion',
      fechaInicio: 'fecha_inicio',
      fechaFin: 'fecha_fin',
      tipo: 'tipo',
      calendario: 'calendario',
      sucursalId: 'sucursal_id',
      creadoPorNombre: 'creado_por_nombre',
      ubicacion: 'ubicacion',
      esTodoElDia: 'es_todo_el_dia',
      esPrivado: 'es_privado',
      color: 'color',
      participantes: 'participantes',
      recordatorioMinutos: 'recordatorio_minutos',
      recordatorioEnviado: 'recordatorio_enviado',
      citaId: 'cita_id',
    };
    for (const [key, col] of Object.entries(map)) {
      const val = (datos as any)[key];
      if (val !== undefined) {
        if (key === 'participantes') {
          fields.push(`${col} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(val));
        } else {
          fields.push(`${col} = $${paramIndex}`);
          values.push(val);
        }
        paramIndex++;
      }
    }
    if (fields.length === 0) {
      const existing = await this.obtenerPorId(id);
      if (!existing) throw new Error('Evento no encontrado');
      return existing;
    }
    fields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
    values.push(id);
    const result = await this.pool.query(
      `UPDATE eventos_calendario SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return mapRow(result.rows[0]);
  }

  async eliminar(id: string): Promise<void> {
    await this.pool.query('DELETE FROM eventos_calendario WHERE id = $1', [id]);
  }
}
