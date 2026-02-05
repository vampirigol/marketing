import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import Database from './infrastructure/database/Database';
import routes from './api/routes';
import { crearSchedulerManager, SchedulerManager } from './infrastructure/scheduling/SchedulerManager';
import { InMemoryInasistenciaRepository } from './infrastructure/database/repositories/InasistenciaRepository';
import { InMemoryCitaRepository } from './infrastructure/database/repositories/CitaRepository';
import { InMemorySucursalRepository } from './infrastructure/database/repositories/SucursalRepository';
import { RemarketingService } from './infrastructure/remarketing/RemarketingService';
import { WhatsAppService } from './infrastructure/messaging/WhatsAppService';
import { FacebookService } from './infrastructure/messaging/FacebookService';
import { InstagramService } from './infrastructure/messaging/InstagramService';
import { initializeWebSocket } from './infrastructure/websocket/WebSocketServer';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Backend en puerto 3001, frontend en 3000

// Variable global para el scheduler manager
let schedulerManager: SchedulerManager;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas API
app.use('/api', routes);

// Ruta de salud
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'RCA CRM System',
  });
});

// Ruta principal
app.get('/', (_req, res) => {
  res.json({
    message: '🏥 Sistema CRM para Red de Clínicas RCA',
    version: '1.0.0',
    endpoints: {
      pacientes: '/api/pacientes',
      citas: '/api/citas',
      abonos: '/api/abonos',
      inasistencias: '/api/inasistencias',
      contactos: '/api/contactos',
      matrix: '/api/matrix',
      catalogo: '/api/catalogo',
      health: '/api/health',
    },
    features: {
      catalogo: {
        completo: 'GET /api/catalogo - Sucursales, especialidades, doctores, servicios y promociones',
        disponibilidad: 'GET /api/citas/disponibilidad/:sucursalId - Horarios disponibles por fecha/doctor'
      },
      contactos: {
        solicitar: 'POST /api/contactos - Solicitar contacto de agente',
        pendientes: 'GET /api/contactos/lista/pendientes - Lista pendientes',
        vencidas: 'GET /api/contactos/lista/vencidas - Solicitudes vencidas',
        estadisticas: 'GET /api/contactos/stats/general - Estadísticas',
        catalogoMotivos: 'GET /api/contactos/catalogo/motivos'
      },
      inasistencias: {
        registrar: 'POST /api/inasistencias',
        listaRemarketing: 'GET /api/inasistencias/lista/remarketing',
        listaBloqueados: 'GET /api/inasistencias/lista/bloqueados',
        protocolo7Dias: 'POST /api/inasistencias/protocolo-7dias',
        estadisticas: 'GET /api/inasistencias/stats/general',
        catalogoMotivos: 'GET /api/inasistencias/catalogo/motivos'
      },
      schedulers: {
        waitList: 'Cada 15 minutos - Mueve citas a lista de espera',
        autoClosure: 'Diario 23:00 - Cierra listas y crea inasistencias',
        protocolo7Dias: 'Diario 00:00 - Ejecuta protocolo de remarketing',
        recordatorios: 'Cada minuto - Envía recordatorios programados',
        zonasHorarias: 'Cada 6 horas - Sincroniza horarios de sucursales'
      }
    }
  });
});

// Manejo de errores 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Manejo de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no capturado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║        INICIANDO SISTEMA CRM RCA - VERSIÓN 1.0        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // 1. Probar conexión a la base de datos (opcional)
    console.log('🔄 Verificando base de datos...');
    try {
      const db = Database.getInstance();
      const connected = await db.testConnection();
      if (connected) {
        console.log('✅ Conexión a base de datos establecida\n');
      } else {
        console.log('⚠️  Base de datos no disponible - Usando repositorios en memoria\n');
      }
    } catch (error) {
      console.log('⚠️  Base de datos no disponible - Usando repositorios en memoria\n');
    }

    // 2. Inicializar repositorios
    console.log('🔄 Inicializando repositorios...');
    const inasistenciaRepo = new InMemoryInasistenciaRepository();
    const citaRepo = new InMemoryCitaRepository();
    const sucursalRepo = new InMemorySucursalRepository();
    console.log('✅ Repositorios inicializados\n');

    // 3. Inicializar servicios de mensajería
    console.log('🔄 Inicializando servicios de mensajería...');
    const whatsappService = new WhatsAppService();
    const facebookService = new FacebookService();
    const instagramService = new InstagramService();
    console.log('✅ Servicios de mensajería inicializados\n');

    // 4. Inicializar servicio de remarketing
    console.log('🔄 Inicializando servicio de remarketing...');
    const remarketingService = new RemarketingService(
      inasistenciaRepo,
      whatsappService,
      facebookService,
      instagramService
    );
    console.log('✅ Servicio de remarketing inicializado\n');

    // 5. Crear e inicializar el Scheduler Manager
    console.log('🔄 Inicializando sistema de schedulers...');
    schedulerManager = crearSchedulerManager(
      citaRepo,
      inasistenciaRepo,
      sucursalRepo,
      remarketingService,
      {
        // Configuración de WaitList Scheduler
        waitList: {
          minutosTolerancia: 15,
          intervaloVerificacion: '*/15 * * * *', // Cada 15 minutos
          notificarPaciente: true,
          notificarContactCenter: true
        },
        // Configuración de Auto Closure Scheduler
        autoClosure: {
          horaCierre: '23:00', // 11 PM
          generarReporte: true,
          notificarGerencia: true,
          iniciarProtocolo7Dias: true
        },
        // Configuración de TimeZone Scheduler
        timeZone: {
          verificacionInterval: '0 */6 * * *', // Cada 6 horas
          autoAjustarDST: true,
          notificarCambios: true,
          sincronizarAutomaticamente: true
        },
        habilitarTodos: true,
        modoMantenimiento: false
      }
    );

    await schedulerManager.inicializar();
    schedulerManager.start();
    console.log('✅ Sistema de schedulers iniciado\n');

    // 6. Iniciar servidor HTTP + WebSocket
    const httpServer = http.createServer(app);
    initializeWebSocket(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║     🏥 SISTEMA CRM RCA INICIADO CORRECTAMENTE ✅      ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');
      console.log(`🚀 Servidor API: http://0.0.0.0:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕐 Zona horaria: ${process.env.DEFAULT_TIMEZONE || 'America/Mexico_City'}\n`);
      
      console.log('📍 Endpoints Principales:');
      console.log('   • GET  /                            (Información del sistema)');
      console.log('   • GET  /health                      (Estado del servidor)');
      console.log('   • GET  /api/health                  (Estado de la API)\n');
      
      console.log('📍 Endpoints de Pacientes:');
      console.log('   • POST /api/pacientes               (Crear paciente)');
      console.log('   • GET  /api/pacientes/:id           (Ver paciente)\n');
      
      console.log('📍 Endpoints de Citas:');
      console.log('   • POST /api/citas                   (Crear cita)');
      console.log('   • GET  /api/citas/:id               (Ver cita)');
      console.log('   • POST /api/citas/:id/reagendar     (Reagendar cita)');
      console.log('   • POST /api/citas/:id/marcar-llegada (Marcar llegada)\n');
      
      console.log('📍 Endpoints de Inasistencias:');
      console.log('   • POST /api/inasistencias           (Registrar inasistencia)');
      console.log('   • GET  /api/inasistencias/lista/remarketing (Lista remarketing)');
      console.log('   • POST /api/inasistencias/protocolo-7dias   (Ejecutar protocolo)\n');
      
      console.log('📍 Endpoints de Matrix (Contact Center):');
      console.log('   • GET  /api/matrix/conversaciones   (Ver conversaciones)');
      console.log('   • POST /api/matrix/mensaje          (Enviar mensaje)\n');
      
      console.log('⏰ SCHEDULERS ACTIVOS:');
      console.log('   ✅ WaitList Scheduler:');
      console.log('      └─ Cada 15 minutos - Mueve citas atrasadas a lista de espera');
      console.log('   ✅ AutoClosure Scheduler:');
      console.log('      └─ Diario 23:00 - Cierra listas de espera del día');
      console.log('   ✅ Inasistencia Scheduler:');
      console.log('      └─ Diario 00:00 - Ejecuta protocolo de 7 días');
      console.log('      └─ Cada 6 horas - Verifica inasistencias próximas');
      console.log('      └─ Diario 09:00 - Remarketing automático');
      console.log('   ✅ Reminder Scheduler:');
      console.log('      └─ Cada minuto - Envía recordatorios programados');
      console.log('   ✅ TimeZone Scheduler:');
      console.log('      └─ Cada 6 horas - Verifica zonas horarias');
      console.log('      └─ Diario 00:00 - Sincroniza horarios entre sucursales\n');
      
      console.log('📊 Estado de Servicios:');
      console.log('   • API Express: ✅ Activo');
      console.log('   • Base de datos: ⚠️  Simulada (no conectada)');
      console.log('   • Notificaciones Multi-Canal: ⚠️  Simulado');
      console.log('   • Sistema de Schedulers: ✅ Activo y automatizado\n');
      
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║           ✅ SISTEMA LISTO PARA USAR ✅               ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');
      
      // Imprimir resumen detallado de schedulers
      schedulerManager.imprimirResumen();
    });
  } catch (error) {
    console.error('\n❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales para apagado limpio
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recibido. Apagando servidor limpiamente...');
  if (schedulerManager) {
    schedulerManager.stop();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido. Apagando servidor limpiamente...');
  if (schedulerManager) {
    schedulerManager.stop();
  }
  process.exit(0);
});

startServer();

export default app;
