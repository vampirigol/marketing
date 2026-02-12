import { Pool } from "pg";

export interface EstudioCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  requiereAyuno: boolean;
  tiempoAyunoHoras?: number;
  preparacionEspecial?: string;
  tiempoResultadosHoras: number;
  precioBase?: number;
  precioUrgente?: number;
  activo: boolean;
}

export interface OrdenLaboratorio {
  id: string;
  pacienteId: string;
  doctorId: string;
  consultaId?: string;
  sucursalId?: string;
  fechaOrden: string;
  folio: string;
  diagnosticoPresuntivo: string;
  indicacionesEspeciales?: string;
  esUrgente: boolean;
  estado: "Pendiente" | "En_Proceso" | "Completada" | "Cancelada";
  laboratorioExterno?: string;
  fechaTomaMuestra?: string;
  fechaResultadosEsperados?: string;
  fechaResultadosRecibidos?: string;
  resultadosArchivoUrl?: string;
  resultadosObservaciones?: string;
  firmado: boolean;
  fechaFirma?: string;
  estudios: OrdenEstudio[];
}

export interface OrdenEstudio {
  id?: string;
  ordenId?: string;
  estudioId: string;
  estudio?: EstudioCatalogo;
  resultadoValor?: string;
  resultadoInterpretacion?: string;
  valoresReferencia?: string;
  estado: "Pendiente" | "Procesando" | "Completado";
}

export class OrdenLaboratorioRepositoryPostgres {
  constructor(private pool: Pool) {}

  async obtenerCatalogoEstudios(categoria?: string): Promise<EstudioCatalogo[]> {
    let query = "SELECT * FROM catalogo_estudios WHERE activo = true";
    const params: any[] = [];

    if (categoria) {
      query += " AND categoria = $1";
      params.push(categoria);
    }

    query += " ORDER BY categoria, nombre";

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapEstudioFromDb);
  }

  async obtenerCategoriasEstudios(): Promise<string[]> {
    const query = `
      SELECT DISTINCT categoria 
      FROM catalogo_estudios 
      WHERE activo = true 
      ORDER BY categoria
    `;
    const result = await this.pool.query(query);
    return result.rows.map((row) => row.categoria);
  }

  async crear(orden: Omit<OrdenLaboratorio, "id" | "folio">): Promise<OrdenLaboratorio> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Insertar orden
      const ordenQuery = `
        INSERT INTO ordenes_laboratorio (
          paciente_id, doctor_id, consulta_id, sucursal_id,
          diagnostico_presuntivo, indicaciones_especiales, es_urgente,
          estado, laboratorio_externo, fecha_resultados_esperados, firmado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const ordenResult = await client.query(ordenQuery, [
        orden.pacienteId,
        orden.doctorId,
        orden.consultaId || null,
        orden.sucursalId || null,
        orden.diagnosticoPresuntivo,
        orden.indicacionesEspeciales || null,
        orden.esUrgente,
        orden.estado,
        orden.laboratorioExterno || null,
        orden.fechaResultadosEsperados || null,
        orden.firmado,
      ]);

      const ordenCreada = ordenResult.rows[0];

      // Insertar estudios
      const estudios: OrdenEstudio[] = [];
      for (const est of orden.estudios) {
        const estQuery = `
          INSERT INTO ordenes_estudios (
            orden_id, estudio_id, estado
          ) VALUES ($1, $2, $3)
          RETURNING *
        `;

        const estResult = await client.query(estQuery, [
          ordenCreada.id,
          est.estudioId,
          est.estado || "Pendiente",
        ]);

        estudios.push(this.mapOrdenEstudioFromDb(estResult.rows[0]));
      }

      await client.query("COMMIT");

      return this.mapOrdenFromDb(ordenCreada, estudios);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async obtenerPorPaciente(pacienteId: string, limit = 50): Promise<OrdenLaboratorio[]> {
    const query = `
      SELECT o.*,
        json_agg(
          json_build_object(
            'id', oe.id,
            'estudioId', oe.estudio_id,
            'resultadoValor', oe.resultado_valor,
            'resultadoInterpretacion', oe.resultado_interpretacion,
            'valoresReferencia', oe.valores_referencia,
            'estado', oe.estado,
            'estudio', json_build_object(
              'id', ce.id,
              'codigo', ce.codigo,
              'nombre', ce.nombre,
              'categoria', ce.categoria,
              'requiereAyuno', ce.requiere_ayuno,
              'tiempoAyunoHoras', ce.tiempo_ayuno_horas
            )
          )
        ) as estudios
      FROM ordenes_laboratorio o
      LEFT JOIN ordenes_estudios oe ON o.id = oe.orden_id
      LEFT JOIN catalogo_estudios ce ON oe.estudio_id = ce.id
      WHERE o.paciente_id = $1
      GROUP BY o.id
      ORDER BY o.fecha_orden DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [pacienteId, limit]);
    return result.rows.map((row) => this.mapOrdenFromDb(row, row.estudios || []));
  }

  async obtenerPorId(ordenId: string): Promise<OrdenLaboratorio | null> {
    const query = `
      SELECT o.*,
        json_agg(
          json_build_object(
            'id', oe.id,
            'estudioId', oe.estudio_id,
            'resultadoValor', oe.resultado_valor,
            'resultadoInterpretacion', oe.resultado_interpretacion,
            'valoresReferencia', oe.valores_referencia,
            'estado', oe.estado,
            'estudio', json_build_object(
              'id', ce.id,
              'codigo', ce.codigo,
              'nombre', ce.nombre,
              'categoria', ce.categoria,
              'requiereAyuno', ce.requiere_ayuno,
              'tiempoAyunoHoras', ce.tiempo_ayuno_horas,
              'preparacionEspecial', ce.preparacion_especial
            )
          )
        ) as estudios
      FROM ordenes_laboratorio o
      LEFT JOIN ordenes_estudios oe ON o.id = oe.orden_id
      LEFT JOIN catalogo_estudios ce ON oe.estudio_id = ce.id
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const result = await this.pool.query(query, [ordenId]);
    if (result.rows.length === 0) return null;

    return this.mapOrdenFromDb(result.rows[0], result.rows[0].estudios || []);
  }

  async actualizarEstado(
    ordenId: string,
    estado: "Pendiente" | "En_Proceso" | "Completada" | "Cancelada"
  ): Promise<void> {
    await this.pool.query(
      "UPDATE ordenes_laboratorio SET estado = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = $2",
      [estado, ordenId]
    );
  }

  async registrarResultados(
    ordenId: string,
    resultadosArchivoUrl: string,
    observaciones?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE ordenes_laboratorio 
       SET resultados_archivo_url = $1, 
           resultados_observaciones = $2,
           fecha_resultados_recibidos = CURRENT_TIMESTAMP,
           estado = 'Completada',
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [resultadosArchivoUrl, observaciones || null, ordenId]
    );
  }

  async firmar(ordenId: string): Promise<void> {
    await this.pool.query(
      `UPDATE ordenes_laboratorio 
       SET firmado = true, fecha_firma = CURRENT_TIMESTAMP, actualizado_en = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [ordenId]
    );
  }

  private mapOrdenFromDb(row: any, estudios: any[]): OrdenLaboratorio {
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      doctorId: row.doctor_id,
      consultaId: row.consulta_id,
      sucursalId: row.sucursal_id,
      fechaOrden: row.fecha_orden,
      folio: row.folio,
      diagnosticoPresuntivo: row.diagnostico_presuntivo,
      indicacionesEspeciales: row.indicaciones_especiales,
      esUrgente: row.es_urgente,
      estado: row.estado,
      laboratorioExterno: row.laboratorio_externo,
      fechaTomaMuestra: row.fecha_toma_muestra,
      fechaResultadosEsperados: row.fecha_resultados_esperados,
      fechaResultadosRecibidos: row.fecha_resultados_recibidos,
      resultadosArchivoUrl: row.resultados_archivo_url,
      resultadosObservaciones: row.resultados_observaciones,
      firmado: row.firmado,
      fechaFirma: row.fecha_firma,
      estudios: estudios.filter(e => e.estudioId).map(this.mapOrdenEstudioFromDb),
    };
  }

  private mapOrdenEstudioFromDb(row: any): OrdenEstudio {
    return {
      id: row.id,
      ordenId: row.orden_id || row.ordenId,
      estudioId: row.estudio_id || row.estudioId,
      estudio: row.estudio ? {
        id: row.estudio.id,
        codigo: row.estudio.codigo,
        nombre: row.estudio.nombre,
        categoria: row.estudio.categoria,
        requiereAyuno: row.estudio.requiereAyuno,
        tiempoAyunoHoras: row.estudio.tiempoAyunoHoras,
        preparacionEspecial: row.estudio.preparacionEspecial,
        tiempoResultadosHoras: row.estudio.tiempoResultadosHoras || 24,
        activo: true,
      } : undefined,
      resultadoValor: row.resultado_valor || row.resultadoValor,
      resultadoInterpretacion: row.resultado_interpretacion || row.resultadoInterpretacion,
      valoresReferencia: row.valores_referencia || row.valoresReferencia,
      estado: row.estado,
    };
  }

  private mapEstudioFromDb(row: any): EstudioCatalogo {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      categoria: row.categoria,
      descripcion: row.descripcion,
      requiereAyuno: row.requiere_ayuno,
      tiempoAyunoHoras: row.tiempo_ayuno_horas,
      preparacionEspecial: row.preparacion_especial,
      tiempoResultadosHoras: row.tiempo_resultados_horas,
      precioBase: row.precio_base,
      precioUrgente: row.precio_urgente,
      activo: row.activo,
    };
  }
}
