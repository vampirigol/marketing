/**
 * Caso de Uso: Autenticar Usuario
 * Login y gestión de sesiones
 */

import bcrypt from 'bcrypt';
import { UsuarioSistema, UsuarioSistemaEntity, obtenerPermisosPorRol } from '../entities/UsuarioSistema';
import { IUsuarioSistemaRepository } from '../../infrastructure/database/repositories/UsuarioSistemaRepository';

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegistroDTO {
  username: string;
  password: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
  rol: 'Admin' | 'Recepcion' | 'Contact_Center' | 'Medico' | 'Supervisor';
  sucursalId?: string;
  creadoPor: string;
}

export interface LoginResponse {
  usuario: Omit<UsuarioSistema, 'password'>;
  exito: boolean;
  mensaje: string;
}

export class AutenticarUsuarioUseCase {
  constructor(
    private usuarioRepository: IUsuarioSistemaRepository
  ) {}

  /**
   * Autenticar usuario (login)
   */
  async login(dto: LoginDTO): Promise<LoginResponse> {
    // Buscar usuario
    const usuario = await this.usuarioRepository.obtenerPorUsername(dto.username);

    if (!usuario) {
      return {
        usuario: null as any,
        exito: false,
        mensaje: 'Usuario o contraseña incorrectos'
      };
    }

    // Verificar estado
    const entity = new UsuarioSistemaEntity(usuario);
    if (!entity.estaActivo()) {
      return {
        usuario: null as any,
        exito: false,
        mensaje: 'Usuario inactivo o suspendido'
      };
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) {
      return {
        usuario: null as any,
        exito: false,
        mensaje: 'Usuario o contraseña incorrectos'
      };
    }

    // Registrar acceso
    await this.usuarioRepository.registrarAcceso(usuario.id);

    return {
      usuario: entity.toSafeObject(),
      exito: true,
      mensaje: 'Login exitoso'
    };
  }

  /**
   * Registrar nuevo usuario
   */
  async registrar(dto: RegistroDTO): Promise<{ usuario: UsuarioSistema; mensaje: string }> {
    // Validar username único
    const existeUsername = await this.usuarioRepository.obtenerPorUsername(dto.username);
    if (existeUsername) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Validar email único
    const existeEmail = await this.usuarioRepository.obtenerPorEmail(dto.email);
    if (existeEmail) {
      throw new Error('El email ya está en uso');
    }

    // Hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Crear usuario
    const nuevoUsuario: UsuarioSistema = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: dto.username,
      password: passwordHash,
      email: dto.email,
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      rol: dto.rol,
      permisos: obtenerPermisosPorRol(dto.rol),
      sucursalId: dto.sucursalId,
      estado: 'Activo',
      creadoPor: dto.creadoPor,
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    };

    const usuarioCreado = await this.usuarioRepository.crear(nuevoUsuario);

    return {
      usuario: usuarioCreado,
      mensaje: 'Usuario registrado exitosamente'
    };
  }

  /**
   * Obtener usuario por ID
   */
  async obtenerPorId(id: string): Promise<UsuarioSistema | null> {
    return await this.usuarioRepository.obtenerPorId(id);
  }

  /**
   * Actualizar foto de perfil
   */
  async actualizarFotoPerfil(usuarioId: string, fotoUrl: string): Promise<UsuarioSistema | null> {
    return await this.usuarioRepository.actualizar(usuarioId, { fotoUrl });
  }

  /**
   * Cambiar contraseña
   */
  async cambiarPassword(
    usuarioId: string,
    passwordActual: string,
    passwordNuevo: string
  ): Promise<{ exito: boolean; mensaje: string }> {
    const usuario = await this.usuarioRepository.obtenerPorId(usuarioId);
    if (!usuario) {
      return { exito: false, mensaje: 'Usuario no encontrado' };
    }

    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValida) {
      return { exito: false, mensaje: 'Contraseña actual incorrecta' };
    }

    // Hash nuevo password
    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNuevo, salt);

    // Actualizar
    await this.usuarioRepository.actualizar(usuarioId, {
      password: nuevoHash
    });

    return { exito: true, mensaje: 'Contraseña actualizada' };
  }

  /**
   * Suspender usuario
   */
  async suspender(usuarioId: string, creadoPor: string): Promise<UsuarioSistema | null> {
    return await this.usuarioRepository.suspender(usuarioId);
  }

  /**
   * Activar usuario
   */
  async activar(usuarioId: string): Promise<UsuarioSistema | null> {
    return await this.usuarioRepository.activar(usuarioId);
  }

  /**
   * Listar usuarios por rol
   */
  async listarPorRol(rol: string): Promise<UsuarioSistema[]> {
    return await this.usuarioRepository.obtenerPorRol(rol as any);
  }

  /**
   * Listar usuarios por sucursal
   */
  async listarPorSucursal(sucursalId: string): Promise<UsuarioSistema[]> {
    return await this.usuarioRepository.obtenerPorSucursal(sucursalId);
  }
}
