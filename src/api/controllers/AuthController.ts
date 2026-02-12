/**
 * Controlador: Autenticación
 * Maneja peticiones HTTP de autenticación
 */

import { Request, Response } from 'express';
import { AutenticarUsuarioUseCase, LoginDTO, RegistroDTO } from '../../core/use-cases/AutenticarUsuario';
import { generarToken } from '../middleware/auth';
import { DESCRIPCION_ROLES, UsuarioSistemaEntity } from '../../core/entities/UsuarioSistema';

export class AuthController {
  constructor(
    private autenticarUsuarioUseCase: AutenticarUsuarioUseCase
  ) {}

  /**
   * POST /auth/login
   * Login de usuario
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: LoginDTO = {
        username: req.body.username,
        password: req.body.password
      };

      // Validar campos
      if (!dto.username || !dto.password) {
        res.status(400).json({
          error: 'Username y password son requeridos'
        });
        return;
      }

      // Autenticar
      const result = await this.autenticarUsuarioUseCase.login(dto);

      if (!result.exito) {
        res.status(401).json({
          error: result.mensaje
        });
        return;
      }

      // Generar token JWT
      const token = generarToken(result.usuario);

      res.json({
        usuario: result.usuario,
        token,
        mensaje: result.mensaje
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error en el login',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * POST /auth/register
   * Registro de nuevo usuario (solo Admin)
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: RegistroDTO = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        nombreCompleto: req.body.nombreCompleto,
        telefono: req.body.telefono,
        rol: req.body.rol,
        sucursalId: req.body.sucursalId,
        creadoPor: req.user?.username || 'sistema'
      };

      // Validar campos
      if (!dto.username || !dto.password || !dto.email || !dto.nombreCompleto || !dto.rol) {
        res.status(400).json({
          error: 'Campos requeridos: username, password, email, nombreCompleto, rol'
        });
        return;
      }

      // Validar rol válido
      const rolesValidos = ['Recepcion', 'Contact_Center', 'Medico', 'Supervisor'];
      if (!rolesValidos.includes(dto.rol)) {
        res.status(400).json({
          error: `Rol inválido. Roles válidos: ${rolesValidos.join(', ')}`
        });
        return;
      }

      // Registrar
      const result = await this.autenticarUsuarioUseCase.registrar(dto);

      res.status(201).json({
        usuario: new UsuarioSistemaEntity(result.usuario).toSafeObject(),
        mensaje: result.mensaje
      });
    } catch (error: unknown) {
      res.status(400).json({
        error: 'Error al registrar usuario',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /auth/me
   * Obtener información del usuario autenticado
   */
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const usuario = await this.autenticarUsuarioUseCase.obtenerPorId(req.user.id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const entity = new UsuarioSistemaEntity(usuario);
      res.json(entity.toSafeObject());
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al obtener usuario',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * POST /auth/perfil/foto
   * Actualizar foto de perfil del usuario autenticado
   */
  actualizarFotoPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const { fotoUrl } = req.body as { fotoUrl?: string };
      if (!fotoUrl) {
        res.status(400).json({ error: 'fotoUrl es requerido' });
        return;
      }
      const actualizado = await this.autenticarUsuarioUseCase.actualizarFotoPerfil(
        req.user.id,
        fotoUrl
      );
      if (!actualizado) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      const entity = new UsuarioSistemaEntity(actualizado);
      res.json({ usuario: entity.toSafeObject(), mensaje: 'Foto actualizada' });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al actualizar foto',
        detalle: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * POST /auth/cambiar-password
   * Cambiar contraseña
   */
  cambiarPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const { passwordActual, passwordNuevo } = req.body;

      if (!passwordActual || !passwordNuevo) {
        res.status(400).json({
          error: 'passwordActual y passwordNuevo son requeridos'
        });
        return;
      }

      if (passwordNuevo.length < 6) {
        res.status(400).json({
          error: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
        return;
      }

      const result = await this.autenticarUsuarioUseCase.cambiarPassword(
        req.user.id,
        passwordActual,
        passwordNuevo
      );

      if (!result.exito) {
        res.status(400).json({ error: result.mensaje });
        return;
      }

      res.json({ mensaje: result.mensaje });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al cambiar contraseña',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /auth/roles
   * Listar roles disponibles
   */
  listarRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        roles: DESCRIPCION_ROLES
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al listar roles',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * POST /auth/usuarios/:id/suspender
   * Suspender usuario (solo Admin)
   */
  suspender = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const creadoPor = req.user?.username || 'sistema';

      const usuario = await this.autenticarUsuarioUseCase.suspender(id, creadoPor);
      if (!usuario) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const entity = new UsuarioSistemaEntity(usuario);
      res.json({
        usuario: entity.toSafeObject(),
        mensaje: 'Usuario suspendido'
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al suspender usuario',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * POST /auth/usuarios/:id/activar
   * Activar usuario (solo Admin)
   */
  activar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const usuario = await this.autenticarUsuarioUseCase.activar(id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const entity = new UsuarioSistemaEntity(usuario);
      res.json({
        usuario: entity.toSafeObject(),
        mensaje: 'Usuario activado'
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al activar usuario',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}
