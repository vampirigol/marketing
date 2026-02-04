/**
 * Rutas: Autenticación
 * Endpoints de autenticación y gestión de usuarios
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AutenticarUsuarioUseCase } from '../../core/use-cases/AutenticarUsuario';
import { UsuarioSistemaRepository } from '../../infrastructure/database/repositories/UsuarioSistemaRepository';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();

// Inicializar dependencias
const usuarioRepository = new UsuarioSistemaRepository();
const autenticarUseCase = new AutenticarUsuarioUseCase(usuarioRepository);
const authController = new AuthController(autenticarUseCase);

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
router.post('/register', autenticar, requiereRol(['Admin']), authController.register);

// POST /auth/usuarios/:id/suspender - Suspender usuario
router.post('/usuarios/:id/suspender', autenticar, requiereRol(['Admin']), authController.suspender);

// POST /auth/usuarios/:id/activar - Activar usuario
router.post('/usuarios/:id/activar', autenticar, requiereRol(['Admin']), authController.activar);

export default router;
