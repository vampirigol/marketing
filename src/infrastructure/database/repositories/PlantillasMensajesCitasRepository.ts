import { Pool } from 'pg';
import Database from '../Database';

export type TipoPlantillaCita = 'nueva_cita' | 'confirmacion_cita' | 'recordatorio_cita' | 'aviso_retraso';

export interface PlantillaMensajeCita {
  id: string;
  tipo: TipoPlantillaCita;
  titulo?: string;
  cuerpoTexto: string;
  cuerpoWhatsapp?: string;
  variables: string[];
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

function mapRow(row: any): PlantillaMensajeCita {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    cuerpoTexto: row.cuerpo_texto,
    cuerpoWhatsapp: row.cuerpo_whatsapp,
    variables: Array.isArray(row.variables) ? row.variables : (typeof row.variables === 'string' ? JSON.parse(row.variables) : []),
    activo: row.activo ?? true,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}

export class PlantillasMensajesCitasRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async listar(): Promise<PlantillaMensajeCita[]> {
    const result = await this.pool.query('SELECT * FROM plantillas_mensajes_citas ORDER BY tipo');
    return result.rows.map(mapRow);
  }

  async obtenerPorTipo(tipo: TipoPlantillaCita): Promise<PlantillaMensajeCita | null> {
    const result = await this.pool.query('SELECT * FROM plantillas_mensajes_citas WHERE tipo = $1', [tipo]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async actualizar(
    tipo: TipoPlantillaCita,
    data: Partial<Pick<PlantillaMensajeCita, 'titulo' | 'cuerpoTexto' | 'cuerpoWhatsapp' | 'activo'>>
  ): Promise<PlantillaMensajeCita> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (data.titulo !== undefined) {
      updates.push(`titulo = $${idx}`);
      values.push(data.titulo);
      idx++;
    }
    if (data.cuerpoTexto !== undefined) {
      updates.push(`cuerpo_texto = $${idx}`);
      values.push(data.cuerpoTexto);
      idx++;
    }
    if (data.cuerpoWhatsapp !== undefined) {
      updates.push(`cuerpo_whatsapp = $${idx}`);
      values.push(data.cuerpoWhatsapp);
      idx++;
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${idx}`);
      values.push(data.activo);
      idx++;
    }
    if (updates.length === 0) {
      const r = await this.obtenerPorTipo(tipo);
      if (!r) throw new Error('Plantilla no encontrada');
      return r;
    }
    updates.push('actualizado_en = CURRENT_TIMESTAMP');
    values.push(tipo);
    const result = await this.pool.query(
      `UPDATE plantillas_mensajes_citas SET ${updates.join(', ')} WHERE tipo = $${idx} RETURNING *`,
      values
    );
    return mapRow(result.rows[0]);
  }

  /** Sustituye variables en el cuerpo: {{nombre}} -> valores.nombre */
  sustituirVariables(cuerpo: string, valores: Record<string, string>): string {
    let out = cuerpo;
    for (const [key, value] of Object.entries(valores)) {
      out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value ?? '');
    }
    return out.replace(/\{\{[^}]+\}\}/g, '');
  }
}
