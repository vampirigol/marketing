/**
 * Rutas: Autenticación
 * Endpoints de autenticación y gestión de usuarios
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { AuthController } from '../controllers/AuthController';
import { AutenticarUsuarioUseCase } from '../../core/use-cases/AutenticarUsuario';
import Database from '../../infrastructure/database/Database';
import { IUsuarioSistemaRepository, UsuarioSistemaRepository, UsuarioSistemaRepositoryPostgres } from '../../infrastructure/database/repositories/UsuarioSistemaRepository';
import { SucursalRepositoryPostgres } from '../../infrastructure/database/repositories/SucursalRepository';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();

const DOCTOR_PASSWORD = 'medico123';
const SUCURSAL_PASSWORD = 'sucursal123';
const ADMIN_PASSWORD = 'admin123';
const DOCTORES_SEED: Array<{ nombre: string; sucursal: string }> = [
  { nombre: 'Edni González', sucursal: 'Ciudad Juárez' },
  { nombre: 'Iván Oros', sucursal: 'Ciudad Juárez' },
  { nombre: 'Iván Ornelas', sucursal: 'Ciudad Juárez' },
  { nombre: 'Samseri Sandoval', sucursal: 'Ciudad Juárez' },
  { nombre: 'Missael Fuentes', sucursal: 'Ciudad Juárez' },
  { nombre: 'Swwlet Abigail Barrientos', sucursal: 'Ciudad Juárez' },
  { nombre: 'Claudia Córdova', sucursal: 'Ciudad Juárez' },
  { nombre: 'Dr. José Ricardo Espinoza Vargas', sucursal: 'Ciudad Juárez' },
  { nombre: 'Aslysh Aboyte', sucursal: 'Ciudad Obregón' },
  { nombre: 'Daniel Balderas', sucursal: 'Ciudad Obregón' },
  { nombre: 'Alejandro Vargas', sucursal: 'Ciudad Obregón' },
  { nombre: 'Adriana Moreno', sucursal: 'Ciudad Obregón' },
  { nombre: 'Alexis Colleti', sucursal: 'Ciudad Obregón' },
  { nombre: 'Fernanda Mendoza', sucursal: 'Ciudad Obregón' },
  { nombre: 'Rubén Mexía', sucursal: 'Ciudad Obregón' },
  { nombre: 'Stephania Vélez', sucursal: 'Ciudad Obregón' },
  { nombre: 'Eliasib Pérez', sucursal: 'Ciudad Obregón' },
  { nombre: 'Miguel Ahumada', sucursal: 'Ciudad Obregón' },
  { nombre: 'Gregorio Pérez', sucursal: 'Loreto Héroes' },
  { nombre: 'Gladys López', sucursal: 'Loreto Héroes' },
  { nombre: 'Nancy Grijalva', sucursal: 'Loreto Centro' },
  { nombre: 'Dra. Tirsa Abisag Espinoza', sucursal: 'Clínica Adventista Virtual' },
  { nombre: 'Yamila Arredondo', sucursal: 'Clínica Adventista Virtual' },
  { nombre: 'Lidia Miranda', sucursal: 'Clínica Adventista Virtual' },
];

const SUCURSALES_SEED: string[] = [
  'Ciudad Obregón',
  'Ciudad Juárez',
  'Loreto Héroes',
  'Loreto Centro',
  'Clínica Adventista Virtual',
  'Valle de la Trinidad',
  'Guadalajara',
];

const normalizarUsername = (nombre: string): string => {
  const base = nombre
    .replace(/\b(dr|dra|lic|psic)\.?/gi, '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s.]/g, '')
    .replace(/\s+/g, '.')
    .toLowerCase();
  return base || 'medico';
};

const normalizarSucursalUsername = (sucursal: string): string => {
  const base = sucursal
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
    .toLowerCase();
  return `sucursal.${base || 'general'}`;
};

const generarUsernameUnico = (nombre: string, usados: Set<string>): string => {
  const base = normalizarUsername(nombre);
  if (!usados.has(base)) {
    usados.add(base);
    return base;
  }
  let index = 2;
  while (usados.has(`${base}${index}`)) index += 1;
  const candidato = `${base}${index}`;
  usados.add(candidato);
  return candidato;
};

// Inicializar dependencias
let usuarioRepository: IUsuarioSistemaRepository = new UsuarioSistemaRepository();
let autenticarUseCase = new AutenticarUsuarioUseCase(usuarioRepository);
let authController = new AuthController(autenticarUseCase);

const seedDoctores = async (): Promise<void> => {
  try {
    const usados = new Set<string>();
    const sucursalRepo = usuarioRepository instanceof UsuarioSistemaRepositoryPostgres
      ? new SucursalRepositoryPostgres()
      : null;
    const sucursalesDb = sucursalRepo ? await sucursalRepo.obtenerActivas() : [];
    const sucursalByName = new Map(sucursalesDb.map((s) => [s.nombre, s.id]));
    const alternates = new Map<string, string>([
      ['Clínica Adventista Virtual', 'Clínica Virtual Adventista'],
    ]);

    for (const doctor of DOCTORES_SEED) {
      const username = generarUsernameUnico(doctor.nombre, usados);
      const existing = await usuarioRepository.obtenerPorUsername(username);
      if (existing) continue;

      const email = `${username}@rca.com`;
      const existingEmail = await usuarioRepository.obtenerPorEmail(email);
      if (existingEmail) continue;

      const sucursalId =
        sucursalByName.get(doctor.sucursal) ||
        sucursalByName.get(alternates.get(doctor.sucursal) || '');

      await autenticarUseCase.registrar({
        username,
        password: DOCTOR_PASSWORD,
        email,
        nombreCompleto: doctor.nombre,
        rol: 'Medico',
        sucursalId: sucursalId || undefined,
        creadoPor: 'sistema',
      });
    }
  } catch {
    // Ignorar errores de seed para no bloquear auth
  }
};

const seedSucursales = async (): Promise<void> => {
  try {
    const usados = new Set<string>();
    const sucursalRepo = usuarioRepository instanceof UsuarioSistemaRepositoryPostgres
      ? new SucursalRepositoryPostgres()
      : null;
    const sucursalesDb = sucursalRepo ? await sucursalRepo.obtenerActivas() : [];
    const sucursales = sucursalesDb.length
      ? sucursalesDb.map((s) => s.nombre)
      : SUCURSALES_SEED;

    for (const nombreSucursal of sucursales) {
      const usernameBase = normalizarSucursalUsername(nombreSucursal);
      const username = generarUsernameUnico(usernameBase, usados);
      const existing = await usuarioRepository.obtenerPorUsername(username);
      if (existing) continue;

      const email = `${username}@rca.com`;
      const existingEmail = await usuarioRepository.obtenerPorEmail(email);
      if (existingEmail) continue;

      const sucursalId = sucursalesDb.find((s) => s.nombre === nombreSucursal)?.id;

      await autenticarUseCase.registrar({
        username,
        password: SUCURSAL_PASSWORD,
        email,
        nombreCompleto: `Sucursal ${nombreSucursal}`,
        rol: 'Recepcion',
        sucursalId: sucursalId || undefined,
        creadoPor: 'sistema',
      });
    }
  } catch {
    // Ignorar errores de seed para no bloquear auth
  }
};

const seedAdmin = async (): Promise<void> => {
  try {
    const existing = await usuarioRepository.obtenerPorUsername('admin');
    const existingEmail = await usuarioRepository.obtenerPorEmail('admin@rcaclinicas.com');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
    if (existing) {
      await usuarioRepository.actualizar(existing.id, { password: hash, estado: 'Activo' });
      return;
    }
    if (existingEmail) return;
    await autenticarUseCase.registrar({
      username: 'admin',
      password: ADMIN_PASSWORD,
      email: 'admin@rcaclinicas.com',
      nombreCompleto: 'Administrador Sistema',
      rol: 'Admin',
      creadoPor: 'sistema',
    });
  } catch {
    // Ignorar errores de seed para no bloquear auth
  }
};

const initUsuarioRepository = async (): Promise<void> => {
  try {
    const connected = await Database.getInstance().testConnection();
    if (connected) {
      usuarioRepository = new UsuarioSistemaRepositoryPostgres();
      autenticarUseCase = new AutenticarUsuarioUseCase(usuarioRepository);
      authController = new AuthController(autenticarUseCase);
    }
    await seedAdmin();
    await seedDoctores();
    await seedSucursales();
  } catch {
    // Mantener repositorio en memoria si la DB no está disponible
  }
};
void initUsuarioRepository();

const asegurarRepositorio = async (): Promise<void> => {
  try {
    const connected = await Database.getInstance().testConnection();
    if (connected && !(usuarioRepository instanceof UsuarioSistemaRepositoryPostgres)) {
      usuarioRepository = new UsuarioSistemaRepositoryPostgres();
      autenticarUseCase = new AutenticarUsuarioUseCase(usuarioRepository);
      authController = new AuthController(autenticarUseCase);
      await seedAdmin();
      await seedDoctores();
      await seedSucursales();
    }
  } catch {
    // mantener repositorio actual
  }
};

// OAuth Meta (Facebook/Instagram) - Login social para conectar canales
import { MetaOAuthController } from '../controllers/MetaOAuthController';

const metaOAuthController = new MetaOAuthController();

// GET /auth/facebook/url - Devuelve URL de OAuth (para frontend)
router.get('/facebook/url', (req, res) => metaOAuthController.getOAuthUrl(req, res));

// GET /auth/facebook - Inicia flujo OAuth, redirige a Facebook
router.get('/facebook', (req, res) => metaOAuthController.iniciarFacebook(req, res));

// GET /auth/facebook/callback - Callback después de autorización
router.get('/facebook/callback', (req, res) => metaOAuthController.callbackFacebook(req, res));

/**
 * Rutas Públicas (no requieren autenticación)
 */

// POST /auth/login - Login
router.post('/login', async (req, res) => {
  await asegurarRepositorio();
  return authController.login(req, res);
});

// GET /auth/roles - Listar roles disponibles
router.get('/roles', authController.listarRoles);

/**
 * Rutas Protegidas (requieren autenticación)
 */

// GET /auth/me - Información del usuario autenticado
router.get('/me', autenticar, async (req, res) => {
  await asegurarRepositorio();
  return authController.me(req, res);
});

// POST /auth/cambiar-password - Cambiar contraseña
router.post('/cambiar-password', autenticar, async (req, res) => {
  await asegurarRepositorio();
  return authController.cambiarPassword(req, res);
});
// POST /auth/perfil/foto - Actualizar foto de perfil
router.post('/perfil/foto', autenticar, async (req, res) => {
  await asegurarRepositorio();
  return authController.actualizarFotoPerfil(req, res);
});

/**
 * Rutas Admin (solo Admin)
 */

// POST /auth/register - Registrar nuevo usuario
router.post('/register', autenticar, requiereRol('Admin'), async (req, res) => {
  await asegurarRepositorio();
  return authController.register(req, res);
});

// POST /auth/usuarios/:id/suspender - Suspender usuario
router.post('/usuarios/:id/suspender', autenticar, requiereRol('Admin'), async (req, res) => {
  await asegurarRepositorio();
  return authController.suspender(req, res);
});

// POST /auth/usuarios/:id/activar - Activar usuario
router.post('/usuarios/:id/activar', autenticar, requiereRol('Admin'), async (req, res) => {
  await asegurarRepositorio();
  return authController.activar(req, res);
});

export default router;
