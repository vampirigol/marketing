/**
 * Repositorio: UsuarioSistemaRepository
 * Gestión de usuarios del sistema con autenticación
 */

import { Pool } from 'pg';
import Database from '../Database';
import { UsuarioSistema, UsuarioSistemaEntity, Rol } from '../../../core/entities/UsuarioSistema';

export interface IUsuarioSistemaRepository {
  crear(usuario: UsuarioSistema): Promise<UsuarioSistema>;
  obtenerPorId(id: string): Promise<UsuarioSistema | null>;
  obtenerPorUsername(username: string): Promise<UsuarioSistema | null>;
  obtenerPorEmail(email: string): Promise<UsuarioSistema | null>;
  obtenerTodos(): Promise<UsuarioSistema[]>;
  obtenerPorRol(rol: Rol): Promise<UsuarioSistema[]>;
  obtenerPorSucursal(sucursalId: string): Promise<UsuarioSistema[]>;
  actualizar(id: string, data: Partial<UsuarioSistema>): Promise<UsuarioSistema | null>;
  eliminar(id: string): Promise<boolean>;
  suspender(id: string): Promise<UsuarioSistema | null>;
  activar(id: string): Promise<UsuarioSistema | null>;
  registrarAcceso(id: string): Promise<void>;
}

/**
 * Implementación PostgreSQL
 */
export class UsuarioSistemaRepositoryPostgres implements IUsuarioSistemaRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(usuario: UsuarioSistema): Promise<UsuarioSistema> {
    const query = `
      INSERT INTO usuarios (
        username, nombre_completo, email, telefono, password_hash, rol, permisos,
        sucursal_asignada, sucursales_acceso, activo, creado_por
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;

    const values = [
      usuario.username,
      usuario.nombreCompleto,
      usuario.email,
      usuario.telefono || '',
      usuario.password,
      usuario.rol,
      JSON.stringify(usuario.permisos || []),
      usuario.sucursalId || null,
      usuario.sucursalId ? [usuario.sucursalId] : [],
      usuario.estado === 'Activo',
      this.toUuidOrNull(usuario.creadoPor),
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<UsuarioSistema | null> {
    const result = await this.pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorUsername(username: string): Promise<UsuarioSistema | null> {
    const result = await this.pool.query(
      'SELECT * FROM usuarios WHERE username = $1 OR email = $1 LIMIT 1',
      [username]
    );
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorEmail(email: string): Promise<UsuarioSistema | null> {
    const result = await this.pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerTodos(): Promise<UsuarioSistema[]> {
    const result = await this.pool.query('SELECT * FROM usuarios ORDER BY nombre_completo');
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorRol(rol: Rol): Promise<UsuarioSistema[]> {
    const result = await this.pool.query('SELECT * FROM usuarios WHERE rol = $1', [rol]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorSucursal(sucursalId: string): Promise<UsuarioSistema[]> {
    const result = await this.pool.query('SELECT * FROM usuarios WHERE sucursal_asignada = $1', [sucursalId]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async actualizar(id: string, data: Partial<UsuarioSistema>): Promise<UsuarioSistema | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mapField = (key: string) => {
      const mapping: Record<string, string> = {
        nombreCompleto: 'nombre_completo',
        password: 'password_hash',
        sucursalId: 'sucursal_asignada',
        ultimoAcceso: 'ultimo_acceso',
        ultimaActualizacion: 'ultima_actualizacion',
        fotoUrl: 'foto_url',
      };
      return mapping[key] || key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    };

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      const field = mapField(key);
      if (key === 'permisos') {
        fields.push(`${field} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else if (key === 'estado') {
        fields.push(`activo = $${paramIndex}`);
        values.push(value === 'Activo');
      } else {
        fields.push(`${field} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    fields.push(`ultima_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE usuarios
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async eliminar(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async suspender(id: string): Promise<UsuarioSistema | null> {
    const result = await this.pool.query(
      'UPDATE usuarios SET activo = false, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async activar(id: string): Promise<UsuarioSistema | null> {
    const result = await this.pool.query(
      'UPDATE usuarios SET activo = true, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async registrarAcceso(id: string): Promise<void> {
    await this.pool.query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private mapToEntity(row: any): UsuarioSistema {
    const permisos = Array.isArray(row.permisos) ? row.permisos : row.permisos || [];
    const permisosParsed = typeof permisos === 'string' ? JSON.parse(permisos) : permisos;

    return {
      id: row.id,
      username: row.username,
      password: row.password_hash,
      email: row.email,
      nombreCompleto: row.nombre_completo,
      telefono: row.telefono,
      fotoUrl: row.foto_url || undefined,
      rol: row.rol,
      permisos: permisosParsed || [],
      sucursalId: row.sucursal_asignada || undefined,
      estado: row.activo ? 'Activo' : 'Suspendido',
      ultimoAcceso: row.ultimo_acceso || undefined,
      creadoPor: row.creado_por || 'sistema',
      fechaCreacion: row.fecha_creacion,
      ultimaActualizacion: row.ultima_actualizacion || row.fecha_creacion,
    };
  }

  private toUuidOrNull(value?: string): string | null {
    if (!value) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value) ? value : null;
  }
}

/**
 * Implementación In-Memory
 */
export class UsuarioSistemaRepository implements IUsuarioSistemaRepository {
  private usuarios: Map<string, UsuarioSistema> = new Map();

  constructor() {
    // Usuario Admin por defecto
    this.crearUsuarioInicial();
    this.crearDoctorInicial();
  }

  private crearUsuarioInicial(): void {
    const adminInicial: UsuarioSistema = {
      id: 'usr_admin_001',
      username: 'admin',
      password: '$2b$10$Q4ORhzoVIDfUfx.fosXQNe1NcU1AwNo6CMSqeMtSHOI.PeE36l6j.', // admin123
      email: 'admin@crm.com',
      nombreCompleto: 'Administrador',
      telefono: '',
      rol: 'Admin',
      permisos: [],
      estado: 'Activo',
      creadoPor: 'sistema',
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    };

    this.usuarios.set(adminInicial.id, adminInicial);
  }

  private crearDoctorInicial(): void {
    const doctorInicial: UsuarioSistema = {
      id: 'usr_medico_001',
      username: 'medico',
      password: '$2b$10$2PqP0BIKkwW3fk0H9pVA3.4Ir2GiMBqhH3Elu0X0olZWTBnlXukXa', // medico123
      email: 'medico@crm.com',
      nombreCompleto: 'Dr. Medicina Integral',
      telefono: '',
      rol: 'Medico',
      permisos: [],
      estado: 'Activo',
      creadoPor: 'sistema',
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    };

    this.usuarios.set(doctorInicial.id, doctorInicial);
  }

  async crear(usuario: UsuarioSistema): Promise<UsuarioSistema> {
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }

  async obtenerPorId(id: string): Promise<UsuarioSistema | null> {
    return this.usuarios.get(id) || null;
  }

  async obtenerPorUsername(username: string): Promise<UsuarioSistema | null> {
    const usuario = Array.from(this.usuarios.values())
      .find(u => u.username === username);
    return usuario || null;
  }

  async obtenerPorEmail(email: string): Promise<UsuarioSistema | null> {
    const usuario = Array.from(this.usuarios.values())
      .find(u => u.email === email);
    return usuario || null;
  }

  async obtenerTodos(): Promise<UsuarioSistema[]> {
    return Array.from(this.usuarios.values());
  }

  async obtenerPorRol(rol: Rol): Promise<UsuarioSistema[]> {
    return Array.from(this.usuarios.values())
      .filter(u => u.rol === rol);
  }

  async obtenerPorSucursal(sucursalId: string): Promise<UsuarioSistema[]> {
    return Array.from(this.usuarios.values())
      .filter(u => u.sucursalId === sucursalId);
  }

  async actualizar(id: string, data: Partial<UsuarioSistema>): Promise<UsuarioSistema | null> {
    const usuario = this.usuarios.get(id);
    if (!usuario) return null;

    const usuarioActualizado: UsuarioSistema = {
      ...usuario,
      ...data,
      id, // Nunca cambiar el ID
      ultimaActualizacion: new Date()
    };

    this.usuarios.set(id, usuarioActualizado);
    return usuarioActualizado;
  }

  async eliminar(id: string): Promise<boolean> {
    return this.usuarios.delete(id);
  }

  async suspender(id: string): Promise<UsuarioSistema | null> {
    const usuario = this.usuarios.get(id);
    if (!usuario) return null;

    const entity = new UsuarioSistemaEntity(usuario);
    entity.suspender();

    this.usuarios.set(id, entity);
    return entity;
  }

  async activar(id: string): Promise<UsuarioSistema | null> {
    const usuario = this.usuarios.get(id);
    if (!usuario) return null;

    const entity = new UsuarioSistemaEntity(usuario);
    entity.activar();

    this.usuarios.set(id, entity);
    return entity;
  }

  async registrarAcceso(id: string): Promise<void> {
    const usuario = this.usuarios.get(id);
    if (!usuario) return;

    const entity = new UsuarioSistemaEntity(usuario);
    entity.registrarAcceso();

    this.usuarios.set(id, entity);
  }
}
