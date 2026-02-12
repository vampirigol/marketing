import { Pool } from "pg";

export interface IntegracionLaboratorio {
  id: string;
  nombre: string;
  codigo: string;
  tipoIntegracion: "API" | "Email" | "Manual";
  apiUrl?: string;
  apiKey?: string;
  emailContacto?: string;
  telefono?: string;
  mapeoEstudios?: any;
  activo: boolean;
}

export interface EnvioLaboratorio {
  id: string;
  ordenId: string;
  integracionId: string;
  fechaEnvio: string;
  estado: "Enviado" | "Confirmado" | "Procesando" | "Completado" | "Error";
  idExterno?: string;
  folioExterno?: string;
  respuestaJson?: any;
  mensajeError?: string;
  resultadosRecibidos: boolean;
  fechaResultados?: string;
}

export class LaboratorioIntegracionRepositoryPostgres {
  constructor(private pool: Pool) {}

  async obtenerIntegraciones(): Promise<IntegracionLaboratorio[]> {
    const query = "SELECT * FROM integraciones_laboratorios WHERE activo = true";
    const result = await this.pool.query(query);
    return result.rows.map(this.mapIntegracionFromDb);
  }

  async obtenerPorCodigo(codigo: string): Promise<IntegracionLaboratorio | null> {
    const query = "SELECT * FROM integraciones_laboratorios WHERE codigo = $1";
    const result = await this.pool.query(query, [codigo]);
    return result.rows.length > 0 ? this.mapIntegracionFromDb(result.rows[0]) : null;
  }

  async crearEnvio(envio: Omit<EnvioLaboratorio, "id" | "fechaEnvio" | "resultadosRecibidos">): Promise<EnvioLaboratorio> {
    const query = `
      INSERT INTO envios_laboratorio (
        orden_id, integracion_id, estado, id_externo, folio_externo,
        respuesta_json, mensaje_error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      envio.ordenId,
      envio.integracionId,
      envio.estado,
      envio.idExterno || null,
      envio.folioExterno || null,
      JSON.stringify(envio.respuestaJson || {}),
      envio.mensajeError || null,
    ]);

    return this.mapEnvioFromDb(result.rows[0]);
  }

  async actualizarEstadoEnvio(envioId: string, estado: string, respuesta?: any, error?: string): Promise<void> {
    await this.pool.query(
      `UPDATE envios_laboratorio 
       SET estado = $1, respuesta_json = $2, mensaje_error = $3, actualizado_en = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [estado, JSON.stringify(respuesta || {}), error || null, envioId]
    );
  }

  async registrarResultadosRecibidos(envioId: string): Promise<void> {
    await this.pool.query(
      `UPDATE envios_laboratorio 
       SET resultados_recibidos = true, fecha_resultados = CURRENT_TIMESTAMP, estado = 'Completado'
       WHERE id = $1`,
      [envioId]
    );
  }

  async obtenerEnviosPorOrden(ordenId: string): Promise<EnvioLaboratorio[]> {
    const query = "SELECT * FROM envios_laboratorio WHERE orden_id = $1 ORDER BY fecha_envio DESC";
    const result = await this.pool.query(query, [ordenId]);
    return result.rows.map(this.mapEnvioFromDb);
  }

  private mapIntegracionFromDb(row: any): IntegracionLaboratorio {
    return {
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      tipoIntegracion: row.tipo_integracion,
      apiUrl: row.api_url,
      apiKey: row.api_key,
      emailContacto: row.email_contacto,
      telefono: row.telefono,
      mapeoEstudios: row.mapeo_estudios,
      activo: row.activo,
    };
  }

  private mapEnvioFromDb(row: any): EnvioLaboratorio {
    return {
      id: row.id,
      ordenId: row.orden_id,
      integracionId: row.integracion_id,
      fechaEnvio: row.fecha_envio,
      estado: row.estado,
      idExterno: row.id_externo,
      folioExterno: row.folio_externo,
      respuestaJson: row.respuesta_json,
      mensajeError: row.mensaje_error,
      resultadosRecibidos: row.resultados_recibidos,
      fechaResultados: row.fecha_resultados,
    };
  }
}
