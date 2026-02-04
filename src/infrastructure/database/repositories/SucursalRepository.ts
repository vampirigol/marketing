import { Pool } from 'pg';
import { SucursalEntity, Sucursal } from '../../../core/entities/Sucursal';
import Database from '../Database';

export interface SucursalRepository {
  crear(sucursal: Sucursal): Promise<SucursalEntity>;
  obtenerPorId(id: string): Promise<SucursalEntity>;
  obtenerTodas(): Promise<SucursalEntity[]>;
  obtenerActivas(): Promise<SucursalEntity[]>;
  actualizar(sucursal: SucursalEntity): Promise<SucursalEntity>;
  buscarPorCodigo(codigo: string): Promise<SucursalEntity | null>;
}

export class SucursalRepositoryPostgres implements SucursalRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(sucursal: Sucursal): Promise<SucursalEntity> {
    const query = `
      INSERT INTO sucursales (
        codigo, nombre, direccion, ciudad, estado, codigo_postal,
        telefono, zona_horaria, horario_apertura, horario_cierre,
        dias_operacion, consultorios_disponibles, especialidades,
        activa, fecha_apertura, gerente_id, email_contacto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      sucursal.codigo,
      sucursal.nombre,
      sucursal.direccion,
      sucursal.ciudad,
      sucursal.estado,
      sucursal.codigoPostal,
      sucursal.telefono,
      sucursal.zonaHoraria,
      sucursal.horarioApertura,
      sucursal.horarioCierre,
      sucursal.diasOperacion,
      sucursal.consultoriosDisponibles,
      sucursal.especialidades,
      sucursal.activa,
      sucursal.fechaApertura,
      sucursal.gerenteId,
      sucursal.emailContacto,
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<SucursalEntity> {
    const query = 'SELECT * FROM sucursales WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error(`Sucursal ${id} no encontrada`);
    }

    return this.mapToEntity(result.rows[0]);
  }

  async obtenerTodas(): Promise<SucursalEntity[]> {
    const query = 'SELECT * FROM sucursales ORDER BY nombre';
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async obtenerActivas(): Promise<SucursalEntity[]> {
    const query = 'SELECT * FROM sucursales WHERE activa = true ORDER BY nombre';
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async actualizar(sucursal: SucursalEntity): Promise<SucursalEntity> {
    const query = `
      UPDATE sucursales 
      SET nombre = $1, direccion = $2, ciudad = $3, estado = $4,
          codigo_postal = $5, telefono = $6, zona_horaria = $7,
          horario_apertura = $8, horario_cierre = $9, dias_operacion = $10,
          consultorios_disponibles = $11, especialidades = $12, activa = $13,
          gerente_id = $14, email_contacto = $15
      WHERE id = $16
      RETURNING *
    `;

    const values = [
      sucursal.nombre,
      sucursal.direccion,
      sucursal.ciudad,
      sucursal.estado,
      sucursal.codigoPostal,
      sucursal.telefono,
      sucursal.zonaHoraria,
      sucursal.horarioApertura,
      sucursal.horarioCierre,
      sucursal.diasOperacion,
      sucursal.consultoriosDisponibles,
      sucursal.especialidades,
      sucursal.activa,
      sucursal.gerenteId,
      sucursal.emailContacto,
      sucursal.id,
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async buscarPorCodigo(codigo: string): Promise<SucursalEntity | null> {
    const query = 'SELECT * FROM sucursales WHERE codigo = $1';
    const result = await this.pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntity(row: any): SucursalEntity {
    return new SucursalEntity({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      direccion: row.direccion,
      ciudad: row.ciudad,
      estado: row.estado,
      codigoPostal: row.codigo_postal,
      telefono: row.telefono,
      zonaHoraria: row.zona_horaria,
      horarioApertura: row.horario_apertura,
      horarioCierre: row.horario_cierre,
      diasOperacion: row.dias_operacion,
      consultoriosDisponibles: row.consultorios_disponibles,
      especialidades: row.especialidades,
      activa: row.activa,
      fechaApertura: row.fecha_apertura,
      gerenteId: row.gerente_id,
      emailContacto: row.email_contacto,
    });
  }
}

// Implementación en memoria para desarrollo/testing
export class InMemorySucursalRepository implements SucursalRepository {
  private sucursales: Map<string, SucursalEntity> = new Map();

  constructor() {
    // Crear algunas sucursales de ejemplo
    this.inicializarDatosEjemplo();
  }

  private inicializarDatosEjemplo(): void {
    const sucursalesEjemplo: Sucursal[] = [
      {
        id: 'suc-001',
        codigo: 'RCA-CDMX-01',
        nombre: 'Red de Clínicas - Polanco',
        direccion: 'Av. Presidente Masaryk 111, Polanco',
        ciudad: 'Ciudad de México',
        estado: 'CDMX',
        codigoPostal: '11560',
        telefono: '+525555551234',
        zonaHoraria: 'America/Mexico_City',
        horarioApertura: '08:00',
        horarioCierre: '20:00',
        diasOperacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        consultoriosDisponibles: 5,
        especialidades: ['Medicina General', 'Pediatría', 'Ginecología', 'Dermatología'],
        activa: true,
        fechaApertura: new Date('2020-01-15'),
        emailContacto: 'polanco@redclinicas.mx'
      },
      {
        id: 'suc-002',
        codigo: 'RCA-GDL-01',
        nombre: 'Red de Clínicas - Guadalajara',
        direccion: 'Av. Vallarta 2020, Col. Americana',
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        codigoPostal: '44100',
        telefono: '+523336667890',
        zonaHoraria: 'America/Mexico_City',
        horarioApertura: '09:00',
        horarioCierre: '19:00',
        diasOperacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        consultoriosDisponibles: 3,
        especialidades: ['Medicina General', 'Pediatría'],
        activa: true,
        fechaApertura: new Date('2021-03-20'),
        emailContacto: 'guadalajara@redclinicas.mx'
      },
      {
        id: 'suc-003',
        codigo: 'RCA-MTY-01',
        nombre: 'Red de Clínicas - Monterrey',
        direccion: 'Av. Constitución 850, Centro',
        ciudad: 'Monterrey',
        estado: 'Nuevo León',
        codigoPostal: '64000',
        telefono: '+528112345678',
        zonaHoraria: 'America/Monterrey',
        horarioApertura: '08:00',
        horarioCierre: '21:00',
        diasOperacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        consultoriosDisponibles: 4,
        especialidades: ['Medicina General', 'Pediatría', 'Oftalmología'],
        activa: true,
        fechaApertura: new Date('2021-06-10'),
        emailContacto: 'monterrey@redclinicas.mx'
      }
    ];

    sucursalesEjemplo.forEach(sucursal => {
      const entity = new SucursalEntity(sucursal);
      this.sucursales.set(entity.id, entity);
    });
  }

  async crear(sucursal: Sucursal): Promise<SucursalEntity> {
    const entity = new SucursalEntity(sucursal);
    this.sucursales.set(entity.id, entity);
    return entity;
  }

  async obtenerPorId(id: string): Promise<SucursalEntity> {
    const sucursal = this.sucursales.get(id);
    if (!sucursal) {
      throw new Error(`Sucursal ${id} no encontrada`);
    }
    return sucursal;
  }

  async obtenerTodas(): Promise<SucursalEntity[]> {
    return Array.from(this.sucursales.values());
  }

  async obtenerActivas(): Promise<SucursalEntity[]> {
    return Array.from(this.sucursales.values()).filter(s => s.activa);
  }

  async actualizar(sucursal: SucursalEntity): Promise<SucursalEntity> {
    if (!this.sucursales.has(sucursal.id)) {
      throw new Error(`Sucursal ${sucursal.id} no encontrada`);
    }
    this.sucursales.set(sucursal.id, sucursal);
    return sucursal;
  }

  async buscarPorCodigo(codigo: string): Promise<SucursalEntity | null> {
    const sucursal = Array.from(this.sucursales.values()).find(s => s.codigo === codigo);
    return sucursal || null;
  }
}
