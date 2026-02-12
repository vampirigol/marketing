import { Pool } from "pg";

export interface RecetaMedica {
  id: string;
  pacienteId: string;
  doctorId: string;
  consultaId?: string;
  sucursalId?: string;
  fechaEmision: string;
  folio: string;
  diagnostico: string;
  indicacionesGenerales?: string;
  estado: "Activa" | "Surtida" | "Cancelada" | "Vencida";
  fechaVencimiento?: string;
  firmado: boolean;
  fechaFirma?: string;
  firmaDigital?: string;
  notasMedicas?: string;
  medicamentos: RecetaMedicamento[];
}

export interface RecetaMedicamento {
  id?: string;
  recetaId?: string;
  nombreMedicamento: string;
  presentacion?: string;
  concentracion?: string;
  cantidad: number;
  dosis: string;
  frecuencia: string;
  viaAdministracion?: string;
  duracionDias?: number;
  indicaciones?: string;
}

export class RecetaRepositoryPostgres {
  constructor(private pool: Pool) {}

  async crear(receta: Omit<RecetaMedica, "id" | "folio">): Promise<RecetaMedica> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Insertar receta
      const recetaQuery = `
        INSERT INTO recetas_medicas (
          paciente_id, doctor_id, consulta_id, sucursal_id,
          diagnostico, indicaciones_generales, estado, fecha_vencimiento,
          firmado, notas_medicas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const recetaResult = await client.query(recetaQuery, [
        receta.pacienteId,
        receta.doctorId,
        receta.consultaId || null,
        receta.sucursalId || null,
        receta.diagnostico,
        receta.indicacionesGenerales || null,
        receta.estado,
        receta.fechaVencimiento || null,
        receta.firmado,
        receta.notasMedicas || null,
      ]);

      const recetaCreada = recetaResult.rows[0];

      // Insertar medicamentos
      const medicamentos: RecetaMedicamento[] = [];
      for (const med of receta.medicamentos) {
        const medQuery = `
          INSERT INTO recetas_medicamentos (
            receta_id, nombre_medicamento, presentacion, concentracion,
            cantidad, dosis, frecuencia, via_administracion, duracion_dias, indicaciones
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        
        const medResult = await client.query(medQuery, [
          recetaCreada.id,
          med.nombreMedicamento,
          med.presentacion || null,
          med.concentracion || null,
          med.cantidad,
          med.dosis,
          med.frecuencia,
          med.viaAdministracion || null,
          med.duracionDias || null,
          med.indicaciones || null,
        ]);

        medicamentos.push(this.mapMedicamentoFromDb(medResult.rows[0]));
      }

      await client.query("COMMIT");

      return this.mapRecetaFromDb(recetaCreada, medicamentos);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async obtenerPorPaciente(pacienteId: string, limit = 50): Promise<RecetaMedica[]> {
    const query = `
      SELECT r.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'nombreMedicamento', m.nombre_medicamento,
            'presentacion', m.presentacion,
            'concentracion', m.concentracion,
            'cantidad', m.cantidad,
            'dosis', m.dosis,
            'frecuencia', m.frecuencia,
            'viaAdministracion', m.via_administracion,
            'duracionDias', m.duracion_dias,
            'indicaciones', m.indicaciones
          )
        ) as medicamentos
      FROM recetas_medicas r
      LEFT JOIN recetas_medicamentos m ON r.id = m.receta_id
      WHERE r.paciente_id = $1
      GROUP BY r.id
      ORDER BY r.fecha_emision DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [pacienteId, limit]);
    return result.rows.map((row) => this.mapRecetaFromDb(row, row.medicamentos || []));
  }

  async obtenerPorId(recetaId: string): Promise<RecetaMedica | null> {
    const query = `
      SELECT r.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'nombreMedicamento', m.nombre_medicamento,
            'presentacion', m.presentacion,
            'concentracion', m.concentracion,
            'cantidad', m.cantidad,
            'dosis', m.dosis,
            'frecuencia', m.frecuencia,
            'viaAdministracion', m.via_administracion,
            'duracionDias', m.duracion_dias,
            'indicaciones', m.indicaciones
          )
        ) as medicamentos
      FROM recetas_medicas r
      LEFT JOIN recetas_medicamentos m ON r.id = m.receta_id
      WHERE r.id = $1
      GROUP BY r.id
    `;

    const result = await this.pool.query(query, [recetaId]);
    if (result.rows.length === 0) return null;
    
    return this.mapRecetaFromDb(result.rows[0], result.rows[0].medicamentos || []);
  }

  async actualizarEstado(
    recetaId: string,
    estado: "Activa" | "Surtida" | "Cancelada" | "Vencida"
  ): Promise<void> {
    await this.pool.query(
      "UPDATE recetas_medicas SET estado = $1, actualizado_en = CURRENT_TIMESTAMP WHERE id = $2",
      [estado, recetaId]
    );
  }

  async firmar(recetaId: string, firmaDigital?: string): Promise<void> {
    await this.pool.query(
      `UPDATE recetas_medicas 
       SET firmado = true, fecha_firma = CURRENT_TIMESTAMP, firma_digital = $1, actualizado_en = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [firmaDigital || null, recetaId]
    );
  }

  private mapRecetaFromDb(row: any, medicamentos: any[]): RecetaMedica {
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      doctorId: row.doctor_id,
      consultaId: row.consulta_id,
      sucursalId: row.sucursal_id,
      fechaEmision: row.fecha_emision,
      folio: row.folio,
      diagnostico: row.diagnostico,
      indicacionesGenerales: row.indicaciones_generales,
      estado: row.estado,
      fechaVencimiento: row.fecha_vencimiento,
      firmado: row.firmado,
      fechaFirma: row.fecha_firma,
      firmaDigital: row.firma_digital,
      notasMedicas: row.notas_medicas,
      medicamentos: medicamentos.filter(m => m.nombreMedicamento).map(this.mapMedicamentoFromDb),
    };
  }

  private mapMedicamentoFromDb(row: any): RecetaMedicamento {
    return {
      id: row.id,
      recetaId: row.receta_id || row.recetaId,
      nombreMedicamento: row.nombre_medicamento || row.nombreMedicamento,
      presentacion: row.presentacion,
      concentracion: row.concentracion,
      cantidad: row.cantidad,
      dosis: row.dosis,
      frecuencia: row.frecuencia,
      viaAdministracion: row.via_administracion || row.viaAdministracion,
      duracionDias: row.duracion_dias || row.duracionDias,
      indicaciones: row.indicaciones,
    };
  }
}
