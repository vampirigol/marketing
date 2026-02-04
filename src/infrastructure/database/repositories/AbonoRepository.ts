import { Pool } from 'pg';
import { AbonoEntity, Abono } from '../../../core/entities/Abono';
import Database from '../Database';

export interface AbonoRepository {
  crear(abono: Abono): Promise<AbonoEntity>;
  obtenerPorId(id: string): Promise<AbonoEntity | null>;
  obtenerPorCita(citaId: string): Promise<AbonoEntity[]>;
  obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<AbonoEntity[]>;
  actualizar(id: string, abono: Partial<Abono>): Promise<AbonoEntity>;
  cancelar(id: string, motivo: string, usuarioId: string): Promise<AbonoEntity>;
}

export class AbonoRepositoryPostgres implements AbonoRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(abono: Abono): Promise<AbonoEntity> {
    const query = `
      INSERT INTO abonos (
        cita_id, paciente_id, sucursal_id, monto, metodo_pago, referencia,
        montos_desglosados, registrado_por, sucursal_registro, folio_recibo,
        recibo_generado, ruta_recibo, estado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      abono.citaId,
      abono.pacienteId,
      abono.sucursalId,
      abono.monto,
      abono.metodoPago,
      abono.referencia,
      abono.montosDesglosados ? JSON.stringify(abono.montosDesglosados) : null,
      abono.registradoPor,
      abono.sucursalRegistro,
      abono.folioRecibo,
      abono.reciboGenerado,
      abono.rutaRecibo,
      abono.estado,
      abono.notas,
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<AbonoEntity | null> {
    const query = 'SELECT * FROM abonos WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorCita(citaId: string): Promise<AbonoEntity[]> {
    const query = `
      SELECT * FROM abonos 
      WHERE cita_id = $1
      AND estado = 'Aplicado'
      ORDER BY fecha_pago DESC
    `;

    const result = await this.pool.query(query, [citaId]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<AbonoEntity[]> {
    const query = `
      SELECT * FROM abonos 
      WHERE sucursal_id = $1 
      AND DATE(fecha_pago) = $2
      AND estado = 'Aplicado'
      ORDER BY fecha_pago ASC
    `;

    const result = await this.pool.query(query, [sucursalId, fecha]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async actualizar(id: string, abono: Partial<Abono>): Promise<AbonoEntity> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(abono).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = this.camelToSnake(key);
        if (snakeKey === 'montos_desglosados') {
          fields.push(`${snakeKey} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${snakeKey} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    values.push(id);

    const query = `
      UPDATE abonos 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async cancelar(id: string, motivo: string, usuarioId: string): Promise<AbonoEntity> {
    const query = `
      UPDATE abonos 
      SET estado = 'Cancelado',
          motivo_cancelacion = $1
      WHERE id = $2
      RETURNING *
    `;

    const motivoCompleto = `${motivo} - Cancelado por usuario ${usuarioId}`;
    const result = await this.pool.query(query, [motivoCompleto, id]);
    return this.mapToEntity(result.rows[0]);
  }

  private mapToEntity(row: any): AbonoEntity {
    return new AbonoEntity({
      id: row.id,
      citaId: row.cita_id,
      pacienteId: row.paciente_id,
      sucursalId: row.sucursal_id,
      monto: parseFloat(row.monto),
      metodoPago: row.metodo_pago,
      referencia: row.referencia,
      montosDesglosados: row.montos_desglosados,
      fechaPago: row.fecha_pago,
      registradoPor: row.registrado_por,
      sucursalRegistro: row.sucursal_registro,
      folioRecibo: row.folio_recibo,
      reciboGenerado: row.recibo_generado,
      rutaRecibo: row.ruta_recibo,
      estado: row.estado,
      motivoCancelacion: row.motivo_cancelacion,
      notas: row.notas,
    });
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

/**
 * Implementación en memoria del repositorio de abonos
 * Para desarrollo y pruebas
 */
export class InMemoryAbonoRepository implements AbonoRepository {
  private abonos: Map<string, AbonoEntity> = new Map();
  private contador = 1;

  async crear(abono: Abono): Promise<AbonoEntity> {
    const id = `abn-${this.contador++}`;
    const entity = new AbonoEntity({
      id,
      ...abono,
      fechaPago: new Date(),
      reciboGenerado: false,
      estado: 'Aplicado',
    });
    this.abonos.set(id, entity);
    return entity;
  }

  async obtenerPorId(id: string): Promise<AbonoEntity | null> {
    return this.abonos.get(id) || null;
  }

  async obtenerPorCita(citaId: string): Promise<AbonoEntity[]> {
    const results: AbonoEntity[] = [];
    for (const abono of this.abonos.values()) {
      if (abono.citaId === citaId && abono.estado === 'Aplicado') {
        results.push(abono);
      }
    }
    return results.sort((a, b) => b.fechaPago.getTime() - a.fechaPago.getTime());
  }

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<AbonoEntity[]> {
    const results: AbonoEntity[] = [];
    const fechaStr = fecha.toISOString().split('T')[0];

    for (const abono of this.abonos.values()) {
      const abonoFechaStr = abono.fechaPago.toISOString().split('T')[0];
      if (
        abono.sucursalId === sucursalId &&
        abonoFechaStr === fechaStr &&
        abono.estado === 'Aplicado'
      ) {
        results.push(abono);
      }
    }
    return results.sort((a, b) => a.fechaPago.getTime() - b.fechaPago.getTime());
  }

  async actualizar(id: string, updates: Partial<Abono>): Promise<AbonoEntity> {
    const abono = this.abonos.get(id);
    if (!abono) {
      throw new Error(`Abono ${id} no encontrado`);
    }

    const updated = new AbonoEntity({
      ...abono,
      ...updates,
      id,
    });

    this.abonos.set(id, updated);
    return updated;
  }

  async cancelar(id: string, motivo: string, usuarioId: string): Promise<AbonoEntity> {
    const abono = this.abonos.get(id);
    if (!abono) {
      throw new Error(`Abono ${id} no encontrado`);
    }

    const motivoCompleto = `${motivo} - Cancelado por usuario ${usuarioId}`;
    const updated = new AbonoEntity({
      ...abono,
      estado: 'Cancelado',
      motivoCancelacion: motivoCompleto,
    });

    this.abonos.set(id, updated);
    return updated;
  }
}
