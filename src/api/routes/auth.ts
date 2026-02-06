/**
 * Rutas: Autenticación
 * Endpoints de autenticación y gestión de usuarios
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AutenticarUsuarioUseCase } from '../../core/use-cases/AutenticarUsuario';
import Database from '../../infrastructure/database/Database';
import { IUsuarioSistemaRepository, UsuarioSistemaRepository, UsuarioSistemaRepositoryPostgres } from '../../infrastructure/database/repositories/UsuarioSistemaRepository';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();

// Inicializar dependencias
let usuarioRepository: IUsuarioSistemaRepository = new UsuarioSistemaRepository();
let autenticarUseCase = new AutenticarUsuarioUseCase(usuarioRepository);
let authController = new AuthController(autenticarUseCase);

const initUsuarioRepository = async (): Promise<void> => {
  try {
    const connected = await Database.getInstance().testConnection();
    if (connected) {
      usuarioRepository = new UsuarioSistemaRepositoryPostgres();
      autenticarUseCase = new AutenticarUsuarioUseCase(usuarioRepository);
      authController = new AuthController(autenticarUseCase);
    }
  } catch {
    // Mantener repositorio en memoria si la DB no está disponible
  }
};
void initUsuarioRepository();

/**
 * Rutas Públicas (no requieren autenticación)
 */

// POST /auth/login - Login
router.post('/login', authController.login);

// GET /auth/roles - Listar roles disponibles
router.get('/roles', authController.listarRoles);

/**
 * Rutas Protegidas (requieren autenticación)
 */

// GET /auth/me - Información del usuario autenticado
router.get('/me', autenticar, authController.me);

// POST /auth/cambiar-password - Cambiar contraseña
router.post('/cambiar-password', autenticar, authController.cambiarPassword);

/**
 * Rutas Admin (solo Admin)
 */

// POST /auth/register - Registrar nuevo usuario
router.post('/register', autenticar, requiereRol('Admin'), authController.register);

// POST /auth/usuarios/:id/suspender - Suspender usuario
router.post('/usuarios/:id/suspender', autenticar, requiereRol('Admin'), authController.suspender);

// POST /auth/usuarios/:id/activar - Activar usuario
router.post('/usuarios/:id/activar', autenticar, requiereRol('Admin'), authController.activar);

export default router;
