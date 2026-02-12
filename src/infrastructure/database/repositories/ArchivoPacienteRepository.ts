import { Pool } from "pg";

export interface ArchivoPaciente {
  id: string;
  pacienteId: string;
  nombreArchivo: string;
  tipoArchivo: string;
  categoria: string;
  urlArchivo: string;
  tamanioBytes?: number;
  mimeType?: string;
  descripcion?: string;
  fechaEstudio?: string;
  subidoPor?: string;
  consultaId?: string;
  ordenId?: string;
  creadoEn: string;
}

export class ArchivoPacienteRepositoryPostgres {
  constructor(private pool: Pool) {}

  async crear(archivo: Omit<ArchivoPaciente, "id" | "creadoEn">): Promise<ArchivoPaciente> {
    const query = `
      INSERT INTO archivos_paciente (
        paciente_id, nombre_archivo, tipo_archivo, categoria, url_archivo,
        tamano_bytes, mime_type, descripcion, fecha_estudio, subido_por,
        consulta_id, orden_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      archivo.pacienteId,
      archivo.nombreArchivo,
      archivo.tipoArchivo,
      archivo.categoria,
      archivo.urlArchivo,
      archivo.tamanioBytes || null,
      archivo.mimeType || null,
      archivo.descripcion || null,
      archivo.fechaEstudio || null,
      archivo.subidoPor || null,
      archivo.consultaId || null,
      archivo.ordenId || null,
    ]);

    return this.mapFromDb(result.rows[0]);
  }

  async obtenerPorPaciente(pacienteId: string, categoria?: string): Promise<ArchivoPaciente[]> {
    let query = "SELECT * FROM archivos_paciente WHERE paciente_id = $1";
    const params: any[] = [pacienteId];

    if (categoria) {
      query += " AND categoria = $2";
      params.push(categoria);
    }

    query += " ORDER BY creado_en DESC";

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapFromDb);
  }

  async eliminar(archivoId: string): Promise<void> {
    await this.pool.query("DELETE FROM archivos_paciente WHERE id = $1", [archivoId]);
  }

  private mapFromDb(row: any): ArchivoPaciente {
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      nombreArchivo: row.nombre_archivo,
      tipoArchivo: row.tipo_archivo,
      categoria: row.categoria,
      urlArchivo: row.url_archivo,
      tamanioBytes: row.tamano_bytes,
      mimeType: row.mime_type,
      descripcion: row.descripcion,
      fechaEstudio: row.fecha_estudio,
      subidoPor: row.subido_por,
      consultaId: row.consulta_id,
      ordenId: row.orden_id,
      creadoEn: row.creado_en,
    };
  }
}
