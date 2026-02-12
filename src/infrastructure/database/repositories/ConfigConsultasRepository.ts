import { Pool } from 'pg';
import Database from '../Database';

export interface ConfigConsulta {
  id: string;
  especialidad: string;
  tipoConsulta: 'Primera_Vez' | 'Subsecuente' | 'Urgencia' | 'Telemedicina';
  duracionMinutos: number;
  intervaloMinutos: number;
  maxEmpalmes: number;
  colorHex: string;
  activo: boolean;
  creadoPor?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

export interface ConfigConsultasRepository {
  obtenerPorEspecialidad(especialidad: string): Promise<ConfigConsulta[]>;
  obtenerPorEspecialidadYTipo(especialidad: string, tipoConsulta: string): Promise<ConfigConsulta | null>;
  obtenerTodas(): Promise<ConfigConsulta[]>;
  crear(config: Omit<ConfigConsulta, 'id' | 'fechaCreacion' | 'ultimaActualizacion'>): Promise<ConfigConsulta>;
  actualizar(id: string, config: Partial<ConfigConsulta>): Promise<ConfigConsulta>;
}

export class ConfigConsultasRepositoryPostgres implements ConfigConsultasRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async obtenerPorEspecialidad(especialidad: string): Promise<ConfigConsulta[]> {
    const query = `
      SELECT * FROM config_consultas
      WHERE especialidad = $1 AND activo = true
      ORDER BY tipo_consulta ASC
    `;
    const result = await this.pool.query(query, [especialidad]);
    return result.rows.map(this.mapToEntity);
  }

  async obtenerPorEspecialidadYTipo(especialidad: string, tipoConsulta: string): Promise<ConfigConsulta | null> {
    const query = `
      SELECT * FROM config_consultas
      WHERE especialidad = $1 AND tipo_consulta = $2 AND activo = true
      LIMIT 1
    `;
    const result = await this.pool.query(query, [especialidad, tipoConsulta]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerTodas(): Promise<ConfigConsulta[]> {
    const query = `
      SELECT * FROM config_consultas
      WHERE activo = true
      ORDER BY especialidad ASC, tipo_consulta ASC
    `;
    const result = await this.pool.query(query);
    return result.rows.map(this.mapToEntity);
  }

  async crear(config: Omit<ConfigConsulta, 'id' | 'fechaCreacion' | 'ultimaActualizacion'>): Promise<ConfigConsulta> {
    const query = `
      INSERT INTO config_consultas (
        especialidad, tipo_consulta, duracion_minutos, intervalo_minutos,
        max_empalmes, color_hex, activo, creado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      config.especialidad,
      config.tipoConsulta,
      config.duracionMinutos,
      config.intervaloMinutos,
      config.maxEmpalmes,
      config.colorHex,
      config.activo,
      config.creadoPor,
    ];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async actualizar(id: string, config: Partial<ConfigConsulta>): Promise<ConfigConsulta> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (config.duracionMinutos !== undefined) {
      fields.push(`duracion_minutos = $${paramIndex}`);
      values.push(config.duracionMinutos);
      paramIndex++;
    }
    if (config.intervaloMinutos !== undefined) {
      fields.push(`intervalo_minutos = $${paramIndex}`);
      values.push(config.intervaloMinutos);
      paramIndex++;
    }
    if (config.maxEmpalmes !== undefined) {
      fields.push(`max_empalmes = $${paramIndex}`);
      values.push(config.maxEmpalmes);
      paramIndex++;
    }
    if (config.colorHex !== undefined) {
      fields.push(`color_hex = $${paramIndex}`);
      values.push(config.colorHex);
      paramIndex++;
    }
    if (config.activo !== undefined) {
      fields.push(`activo = $${paramIndex}`);
      values.push(config.activo);
      paramIndex++;
    }

    fields.push(`ultima_actualizacion = NOW()`);
    values.push(id);

    const query = `
      UPDATE config_consultas
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  private mapToEntity(row: any): ConfigConsulta {
    return {
      id: row.id,
      especialidad: row.especialidad,
      tipoConsulta: row.tipo_consulta,
      duracionMinutos: parseInt(row.duracion_minutos),
      intervaloMinutos: parseInt(row.intervalo_minutos),
      maxEmpalmes: parseInt(row.max_empalmes),
      colorHex: row.color_hex,
      activo: row.activo,
      creadoPor: row.creado_por,
      fechaCreacion: row.fecha_creacion,
      ultimaActualizacion: row.ultima_actualizacion,
    };
  }
}
