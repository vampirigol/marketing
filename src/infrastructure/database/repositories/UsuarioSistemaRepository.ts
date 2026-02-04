/**
 * Repositorio: UsuarioSistemaRepository
 * Gestión de usuarios del sistema con autenticación
 */

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
 * Implementación In-Memory
 */
export class UsuarioSistemaRepository implements IUsuarioSistemaRepository {
  private usuarios: Map<string, UsuarioSistema> = new Map();

  constructor() {
    // Usuario Admin por defecto
    this.crearUsuarioInicial();
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
