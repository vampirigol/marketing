/**
 * Repositorio: OpenTicket
 * Gestiona la persistencia de tickets abiertos para citas subsecuentes
 */

import { Pool } from 'pg';
import { OpenTicketEntity, EstadoTicket } from '../../../core/entities/OpenTicket';

// Re-exportar EstadoTicket para uso en controladores
export type { EstadoTicket };

export interface FiltrosOpenTicket {
  pacienteId?: string;
  sucursalId?: string;
  estado?: EstadoTicket;
  especialidad?: string;
  vigentes?: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class OpenTicketRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async crear(ticket: OpenTicketEntity): Promise<OpenTicketEntity> {
    const query = `
      INSERT INTO open_tickets (
        id, codigo, paciente_id, sucursal_id, tipo_consulta, especialidad,
        medico_preferido, fecha_emision, fecha_valido_desde, fecha_valido_hasta,
        dias_validez, estado, cita_origen_id, motivo_consulta_anterior,
        diagnostico_anterior, tratamiento_indicado, costo_estimado, requiere_pago,
        encuesta_completada, creado_por, fecha_creacion, ultima_actualizacion, notas
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *
    `;

    const values = [
      ticket.id,
      ticket.codigo,
      ticket.pacienteId,
      ticket.sucursalId,
      ticket.tipoConsulta,
      ticket.especialidad,
      ticket.medicoPreferido,
      ticket.fechaEmision,
      ticket.fechaValidoDesde,
      ticket.fechaValidoHasta,
      ticket.diasValidez,
      ticket.estado,
      ticket.citaOrigenId,
      ticket.motivoConsultaAnterior,
      ticket.diagnosticoAnterior,
      ticket.tratamientoIndicado,
      ticket.costoEstimado,
      ticket.requierePago,
      ticket.encuestaCompletada,
      ticket.creadoPor,
      ticket.fechaCreacion,
      ticket.ultimaActualizacion,
      ticket.notas,
    ];

    const result = await this.pool.query(query, values);
    return this.mapearTicket(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<OpenTicketEntity | null> {
    const query = 'SELECT * FROM open_tickets WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapearTicket(result.rows[0]);
  }

  async obtenerPorCodigo(codigo: string): Promise<OpenTicketEntity | null> {
    const query = 'SELECT * FROM open_tickets WHERE codigo = $1';
    const result = await this.pool.query(query, [codigo]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapearTicket(result.rows[0]);
  }

  async listar(filtros: FiltrosOpenTicket = {}): Promise<OpenTicketEntity[]> {
    let query = 'SELECT * FROM open_tickets WHERE 1=1';
    const values: (string | Date | boolean)[] = [];
    let paramIndex = 1;

    if (filtros.pacienteId) {
      query += ` AND paciente_id = $${paramIndex}`;
      values.push(filtros.pacienteId);
      paramIndex++;
    }

    if (filtros.sucursalId) {
      query += ` AND sucursal_id = $${paramIndex}`;
      values.push(filtros.sucursalId);
      paramIndex++;
    }

    if (filtros.estado) {
      query += ` AND estado = $${paramIndex}`;
      values.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.especialidad) {
      query += ` AND especialidad = $${paramIndex}`;
      values.push(filtros.especialidad);
      paramIndex++;
    }

    if (filtros.vigentes) {
      const ahora = new Date();
      query += ` AND estado = 'Activo' AND fecha_valido_desde <= $${paramIndex} AND fecha_valido_hasta >= $${paramIndex + 1}`;
      values.push(ahora, ahora);
      paramIndex += 2;
    }

    if (filtros.fechaDesde) {
      query += ` AND fecha_emision >= $${paramIndex}`;
      values.push(filtros.fechaDesde);
      paramIndex++;
    }

    if (filtros.fechaHasta) {
      query += ` AND fecha_emision <= $${paramIndex}`;
      values.push(filtros.fechaHasta);
      paramIndex++;
    }

    query += ' ORDER BY fecha_creacion DESC';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapearTicket(row));
  }

  async actualizar(ticket: OpenTicketEntity): Promise<OpenTicketEntity> {
    const query = `
      UPDATE open_tickets SET
        estado = $1,
        fecha_utilizado = $2,
        cita_generada_id = $3,
        hora_llegada = $4,
        encuesta_completada = $5,
        calificacion_atencion = $6,
        comentarios_encuesta = $7,
        medico_preferido = $8,
        ultima_actualizacion = $9,
        notas = $10
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      ticket.estado,
      ticket.fechaUtilizado,
      ticket.citaGeneradaId,
      ticket.horaLlegada,
      ticket.encuestaCompletada,
      ticket.calificacionAtencion,
      ticket.comentariosEncuesta,
      ticket.medicoPreferido,
      ticket.ultimaActualizacion,
      ticket.notas,
      ticket.id,
    ];

    const result = await this.pool.query(query, values);
    return this.mapearTicket(result.rows[0]);
  }

  async eliminar(id: string): Promise<boolean> {
    const query = 'DELETE FROM open_tickets WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Obtiene tickets activos por paciente
   */
  async obtenerTicketsActivosPorPaciente(pacienteId: string): Promise<OpenTicketEntity[]> {
    return this.listar({
      pacienteId,
      estado: 'Activo',
      vigentes: true,
    });
  }

  /**
   * Marca tickets expirados
   */
  async marcarTicketsExpirados(): Promise<number> {
    const query = `
      UPDATE open_tickets
      SET estado = 'Expirado', ultima_actualizacion = NOW()
      WHERE estado = 'Activo' 
      AND fecha_valido_hasta < NOW()
      RETURNING id
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Obtiene estadísticas de tickets
   */
  async obtenerEstadisticas(sucursalId?: string): Promise<{
    total: string;
    activos: string;
    utilizados: string;
    expirados: string;
    cancelados: string;
    con_encuesta: string;
    promedio_calificacion: string | null;
    promedio_dias_uso: string | null;
  }> {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'Activo') as activos,
        COUNT(*) FILTER (WHERE estado = 'Utilizado') as utilizados,
        COUNT(*) FILTER (WHERE estado = 'Expirado') as expirados,
        COUNT(*) FILTER (WHERE estado = 'Cancelado') as cancelados,
        COUNT(*) FILTER (WHERE encuesta_completada = true) as con_encuesta,
        AVG(calificacion_atencion) FILTER (WHERE calificacion_atencion IS NOT NULL) as promedio_calificacion,
        AVG(EXTRACT(DAY FROM (fecha_utilizado - fecha_emision))) FILTER (WHERE fecha_utilizado IS NOT NULL) as promedio_dias_uso
      FROM open_tickets
    `;

    const values: string[] = [];
    if (sucursalId) {
      query += ' WHERE sucursal_id = $1';
      values.push(sucursalId);
    }

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene el último número de ticket para generar código
   */
  async obtenerUltimoNumero(sucursalId: string, año: number, mes: number): Promise<number> {
    const query = `
      SELECT codigo FROM open_tickets
      WHERE sucursal_id = $1
      AND EXTRACT(YEAR FROM fecha_emision) = $2
      AND EXTRACT(MONTH FROM fecha_emision) = $3
      ORDER BY codigo DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [sucursalId, año, mes]);
    
    if (result.rows.length === 0) {
      return 0;
    }

    // Extraer el número del código (ej: "OT-SUC1-202402-0005" -> 5)
    const codigo = result.rows[0].codigo;
    const match = codigo.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private mapearTicket(row: Record<string, unknown>): OpenTicketEntity {
    return new OpenTicketEntity({
      id: row.id as string,
      codigo: row.codigo as string,
      pacienteId: row.paciente_id as string,
      sucursalId: row.sucursal_id as string,
      tipoConsulta: row.tipo_consulta as 'Subsecuente',
      especialidad: row.especialidad as string,
      medicoPreferido: row.medico_preferido as string | undefined,
      fechaEmision: row.fecha_emision as Date,
      fechaValidoDesde: row.fecha_valido_desde as Date,
      fechaValidoHasta: row.fecha_valido_hasta as Date,
      diasValidez: row.dias_validez as number,
      estado: row.estado as EstadoTicket,
      fechaUtilizado: row.fecha_utilizado as Date | undefined,
      citaGeneradaId: row.cita_generada_id as string | undefined,
      horaLlegada: row.hora_llegada as Date | undefined,
      citaOrigenId: row.cita_origen_id as string,
      motivoConsultaAnterior: row.motivo_consulta_anterior as string | undefined,
      diagnosticoAnterior: row.diagnostico_anterior as string | undefined,
      tratamientoIndicado: row.tratamiento_indicado as string | undefined,
      costoEstimado: parseFloat((row.costo_estimado || '0') as string),
      requierePago: row.requiere_pago as boolean,
      encuestaCompletada: row.encuesta_completada as boolean,
      calificacionAtencion: row.calificacion_atencion as number | undefined,
      comentariosEncuesta: row.comentarios_encuesta as string | undefined,
      creadoPor: row.creado_por as string,
      fechaCreacion: row.fecha_creacion as Date,
      ultimaActualizacion: row.ultima_actualizacion as Date,
      notas: row.notas as string | undefined,
    });
  }
}
