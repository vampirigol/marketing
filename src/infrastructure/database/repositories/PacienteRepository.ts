import { Pool } from 'pg';
import { PacienteEntity, Paciente } from '../../../core/entities/Paciente';
import Database from '../Database';

export interface PacienteRepository {
  crear(paciente: Paciente): Promise<PacienteEntity>;
  obtenerPorId(id: string): Promise<PacienteEntity | null>;
  obtenerPorTelefono(telefono: string): Promise<PacienteEntity | null>;
  obtenerPorNoAfiliacion(noAfiliacion: string): Promise<PacienteEntity | null>;
  /** Genera el siguiente número de afiliación único (formato RCA-YYYY-NNNNN) sin duplicados. */
  obtenerSiguienteNoAfiliacion(): Promise<string>;
  actualizar(id: string, paciente: Partial<Paciente>): Promise<PacienteEntity>;
  buscar(query: string): Promise<PacienteEntity[]>;
  listar(limit?: number, offset?: number): Promise<PacienteEntity[]>;
}

export class PacienteRepositoryPostgres implements PacienteRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(paciente: Paciente): Promise<PacienteEntity> {
    const query = `
      INSERT INTO pacientes (
        nombre_completo, telefono, whatsapp, email, fecha_nacimiento, edad, sexo,
        no_afiliacion, tipo_afiliacion, calle, colonia, ciudad, estado, codigo_postal,
        contacto_emergencia, telefono_emergencia, origen_lead, alergias, padecimientos, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      paciente.nombreCompleto,
      paciente.telefono,
      paciente.whatsapp,
      paciente.email,
      paciente.fechaNacimiento,
      paciente.edad,
      paciente.sexo,
      paciente.noAfiliacion,
      paciente.tipoAfiliacion,
      paciente.calle,
      paciente.colonia,
      paciente.ciudad,
      paciente.estado,
      paciente.codigoPostal,
      paciente.contactoEmergencia,
      paciente.telefonoEmergencia,
      paciente.origenLead,
      paciente.alergias,
      paciente.padecimientos,
      paciente.observaciones,
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<PacienteEntity | null> {
    const query = 'SELECT * FROM pacientes WHERE id = $1 AND activo = true';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorTelefono(telefono: string): Promise<PacienteEntity | null> {
    const query = 'SELECT * FROM pacientes WHERE telefono = $1 AND activo = true';
    const result = await this.pool.query(query, [telefono]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorNoAfiliacion(noAfiliacion: string): Promise<PacienteEntity | null> {
    const query = 'SELECT * FROM pacientes WHERE no_afiliacion = $1 AND activo = true';
    const result = await this.pool.query(query, [noAfiliacion]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async obtenerSiguienteNoAfiliacion(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCA-${year}-`;
    const query = `
      SELECT no_afiliacion FROM pacientes
      WHERE no_afiliacion LIKE $1 || '%'
      ORDER BY no_afiliacion DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [prefix]);
    let nextNum = 1;
    if (result.rows.length > 0) {
      const last = result.rows[0].no_afiliacion as string;
      const match = last.match(new RegExp(`^${prefix.replace(/-/g, '\\-')}(\\d+)$`));
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  async actualizar(id: string, paciente: Partial<Paciente>): Promise<PacienteEntity> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(paciente).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = this.camelToSnake(key);
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    fields.push(`ultima_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE pacientes 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async buscar(query: string): Promise<PacienteEntity[]> {
    const searchQuery = `
      SELECT * FROM pacientes 
      WHERE activo = true
      AND (
        nombre_completo ILIKE $1
        OR telefono ILIKE $1
        OR no_afiliacion ILIKE $1
        OR email ILIKE $1
      )
      ORDER BY nombre_completo
      LIMIT 20
    `;

    const result = await this.pool.query(searchQuery, [`%${query}%`]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async listar(limit: number = 50, offset: number = 0): Promise<PacienteEntity[]> {
    const query = `
      SELECT * FROM pacientes 
      WHERE activo = true
      ORDER BY fecha_registro DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pool.query(query, [limit, offset]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  private mapToEntity(row: any): PacienteEntity {
    return new PacienteEntity({
      id: row.id,
      nombreCompleto: row.nombre_completo,
      telefono: row.telefono,
      whatsapp: row.whatsapp,
      email: row.email,
      fechaNacimiento: row.fecha_nacimiento,
      edad: row.edad,
      sexo: row.sexo,
      noAfiliacion: row.no_afiliacion,
      tipoAfiliacion: row.tipo_afiliacion,
      calle: row.calle,
      colonia: row.colonia,
      ciudad: row.ciudad,
      estado: row.estado,
      codigoPostal: row.codigo_postal,
      contactoEmergencia: row.contacto_emergencia,
      telefonoEmergencia: row.telefono_emergencia,
      origenLead: row.origen_lead,
      fechaRegistro: row.fecha_registro,
      ultimaActualizacion: row.ultima_actualizacion,
      activo: row.activo,
      alergias: row.alergias,
      padecimientos: row.padecimientos,
      observaciones: row.observaciones,
    });
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

/**
 * Implementación en memoria del repositorio de pacientes
 * Para desarrollo y pruebas
 */
export class InMemoryPacienteRepository implements PacienteRepository {
  private pacientes: Map<string, PacienteEntity> = new Map();
  private contador = 1;

  async crear(paciente: Paciente): Promise<PacienteEntity> {
    const id = `pac-${this.contador++}`;
    const entity = new PacienteEntity({
      id,
      ...paciente,
      fechaRegistro: new Date(),
      ultimaActualizacion: new Date(),
      activo: true,
    });
    this.pacientes.set(id, entity);
    return entity;
  }

  async obtenerPorId(id: string): Promise<PacienteEntity | null> {
    return this.pacientes.get(id) || null;
  }

  async obtenerPorTelefono(telefono: string): Promise<PacienteEntity | null> {
    for (const paciente of this.pacientes.values()) {
      if (paciente.telefono === telefono || paciente.whatsapp === telefono) {
        return paciente;
      }
    }
    return null;
  }

  async obtenerPorNoAfiliacion(noAfiliacion: string): Promise<PacienteEntity | null> {
    for (const paciente of this.pacientes.values()) {
      if (paciente.noAfiliacion === noAfiliacion) {
        return paciente;
      }
    }
    return null;
  }

  async obtenerSiguienteNoAfiliacion(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCA-${year}-`;
    let maxNum = 0;
    for (const p of this.pacientes.values()) {
      if (p.noAfiliacion.startsWith(prefix)) {
        const match = p.noAfiliacion.match(/^RCA-\d{4}-(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
    }
    return `${prefix}${String(maxNum + 1).padStart(5, '0')}`;
  }

  async actualizar(id: string, updates: Partial<Paciente>): Promise<PacienteEntity> {
    const paciente = this.pacientes.get(id);
    if (!paciente) {
      throw new Error(`Paciente ${id} no encontrado`);
    }

    const updated = new PacienteEntity({
      ...paciente,
      ...updates,
      id,
      ultimaActualizacion: new Date(),
    });

    this.pacientes.set(id, updated);
    return updated;
  }

  async buscar(query: string): Promise<PacienteEntity[]> {
    const results: PacienteEntity[] = [];
    const lowerQuery = query.toLowerCase();

    for (const paciente of this.pacientes.values()) {
      if (
        paciente.activo &&
        (paciente.nombreCompleto.toLowerCase().includes(lowerQuery) ||
          paciente.telefono.includes(query) ||
          paciente.noAfiliacion.toLowerCase().includes(lowerQuery) ||
          (paciente.email && paciente.email.toLowerCase().includes(lowerQuery)))
      ) {
        results.push(paciente);
      }
    }

    return results.slice(0, 20);
  }

  async listar(limit: number = 50, offset: number = 0): Promise<PacienteEntity[]> {
    const activos = Array.from(this.pacientes.values())
      .filter((p) => p.activo)
      .sort((a, b) => b.fechaRegistro.getTime() - a.fechaRegistro.getTime());

    return activos.slice(offset, offset + limit);
  }

  /** Alias para compatibilidad con IPacienteRepository/segmentación */
  async obtenerTodos(): Promise<PacienteEntity[]> {
    return this.listar(10000, 0);
  }
}
