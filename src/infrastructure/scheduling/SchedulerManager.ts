/**
 * Scheduler Manager
 * Coordinador central de todos los schedulers del sistema
 * 
 * RESPONSABILIDADES:
 * - Iniciar y detener todos los schedulers
 * - Coordinar la ejecución de jobs
 * - Monitorear el estado de los schedulers
 * - Proporcionar estadísticas y métricas
 * - Gestionar errores y reintentos
 */

import { WaitListScheduler } from './WaitListScheduler';
import { AutoClosureScheduler } from './AutoClosureScheduler';
import { InasistenciaScheduler } from './InasistenciaScheduler';
import { ReminderScheduler } from './ReminderScheduler';
import { TimeZoneScheduler } from './TimeZoneScheduler';
import { ExpiracionOpenTicketsScheduler } from './ExpiracionOpenTicketsScheduler';
import { AutomationScheduler } from './AutomationScheduler';
import { CalendarioRecordatorioScheduler } from './CalendarioRecordatorioScheduler';
import { CitasRecordatorioScheduler } from './CitasRecordatorioScheduler';
import { MarkNoShowsScheduler } from './MarkNoShowsScheduler';
import { CitaRepository } from '../database/repositories/CitaRepository';
import { InasistenciaRepository } from '../database/repositories/InasistenciaRepository';
import { SucursalRepository } from '../database/repositories/SucursalRepository';
import { RemarketingService } from '../remarketing/RemarketingService';
import { AutomationEngine } from '../automation/AutomationEngine';
import { automationRepository, PostgresAutomationRepository } from '../automation/AutomationRepository';
import { seedAutomationRulesIfEmpty } from '../automation/automation-seed';
import { solicitudContactoRepository } from '../database/repositories/SolicitudContactoRepository';
import { WhatsAppService } from '../messaging/WhatsAppService';
import { FacebookService } from '../messaging/FacebookService';
import { InstagramService } from '../messaging/InstagramService';

export interface SchedulerConfig {
  // WaitList Scheduler
  waitList?: {
    minutosTolerancia?: number;
    intervaloVerificacion?: string;
    notificarPaciente?: boolean;
    notificarContactCenter?: boolean;
  };

  // Auto Closure Scheduler
  autoClosure?: {
    horaCierre?: string;
    cronExpression?: string;
    generarReporte?: boolean;
    notificarGerencia?: boolean;
    iniciarProtocolo7Dias?: boolean;
  };

  // TimeZone Scheduler
  timeZone?: {
    verificacionInterval?: string;
    autoAjustarDST?: boolean;
    notificarCambios?: boolean;
    sincronizarAutomaticamente?: boolean;
  };

  // General
  habilitarTodos?: boolean;
  modoMantenimiento?: boolean;
}

export interface SchedulerStatus {
  nombre: string;
  activo: boolean;
  ultimaEjecucion?: Date;
  proximaEjecucion?: Date;
  totalEjecuciones: number;
  totalErrores: number;
  estado: 'running' | 'stopped' | 'error' | 'maintenance';
}

export class SchedulerManager {
  private waitListScheduler?: WaitListScheduler;
  private autoClosureScheduler?: AutoClosureScheduler;
  private inasistenciaScheduler?: InasistenciaScheduler;
  private reminderScheduler?: ReminderScheduler;
  private timeZoneScheduler?: TimeZoneScheduler;
  private expiracionTicketsScheduler?: ExpiracionOpenTicketsScheduler;
  private automationScheduler?: AutomationScheduler;
  private calendarioRecordatorioScheduler?: CalendarioRecordatorioScheduler;
  private citasRecordatorioScheduler?: CitasRecordatorioScheduler;
  private markNoShowsScheduler?: MarkNoShowsScheduler;

  private estadoSchedulers: Map<string, SchedulerStatus>;

  constructor(
    private citaRepository: CitaRepository,
    private inasistenciaRepository: InasistenciaRepository,
    private sucursalRepository: SucursalRepository,
    private remarketingService: RemarketingService,
    private config?: SchedulerConfig
  ) {
    this.estadoSchedulers = new Map();
  }

  /**
   * Inicializa todos los schedulers
   */
  async inicializar(): Promise<void> {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║     INICIALIZANDO SISTEMA DE SCHEDULERS RCA CRM      ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    if (this.config?.modoMantenimiento) {
      console.log('⚠️  Modo mantenimiento activado - Schedulers no se iniciarán');
      return;
    }

    try {
      // 1. WaitList Scheduler - Verifica cada 15 minutos citas para lista de espera
      this.waitListScheduler = new WaitListScheduler(
        this.citaRepository,
        this.config?.waitList
      );
      this.registrarScheduler('WaitList');

      // 2. Auto Closure Scheduler - Cierre diario de listas de espera
      this.autoClosureScheduler = new AutoClosureScheduler(
        this.citaRepository,
        this.inasistenciaRepository,
        this.config?.autoClosure
      );
      this.registrarScheduler('AutoClosure');

      // 3. Inasistencia Scheduler - Protocolo de 7 días
      this.inasistenciaScheduler = new InasistenciaScheduler(
        this.inasistenciaRepository,
        this.remarketingService
      );
      this.registrarScheduler('Inasistencia');

      // 4. Reminder Scheduler - Recordatorios automáticos
      this.reminderScheduler = new ReminderScheduler();
      this.registrarScheduler('Reminder');

      // 5. TimeZone Scheduler - Gestión de zonas horarias
      this.timeZoneScheduler = new TimeZoneScheduler(
        this.sucursalRepository,
        this.config?.timeZone
      );
      this.registrarScheduler('TimeZone');

      // 6. Expiración Open Tickets Scheduler - Marca tickets expirados
      this.expiracionTicketsScheduler = new ExpiracionOpenTicketsScheduler();
      this.registrarScheduler('ExpiracionTickets');

      // 7. Automation Scheduler - Ejecuta reglas de automatización
      const automationEngine = new AutomationEngine(
        solicitudContactoRepository,
        new WhatsAppService(),
        new FacebookService(),
        new InstagramService()
      );
      const repo = process.env.DB_HOST || process.env.DATABASE_URL ? new PostgresAutomationRepository() : automationRepository;
      await seedAutomationRulesIfEmpty(repo);
      this.automationScheduler = new AutomationScheduler(automationEngine, repo, '*/1 * * * *');
      this.registrarScheduler('Automation');

      // 8. Calendario Recordatorio - Notificaciones para eventos con recordatorio
      this.calendarioRecordatorioScheduler = new CalendarioRecordatorioScheduler();
      this.registrarScheduler('CalendarioRecordatorio');

      // 9. Citas Recordatorio - Recordatorios PERSISTENTES de citas (BD)
      this.citasRecordatorioScheduler = new CitasRecordatorioScheduler();
      this.registrarScheduler('CitasRecordatorio');

      // 10. No Confirmado -> No Asistió (cada hora)
      this.markNoShowsScheduler = new MarkNoShowsScheduler();
      this.registrarScheduler('MarkNoShows');

      console.log('✅ Todos los schedulers inicializados correctamente\n');

    } catch (error) {
      console.error('❌ Error inicializando schedulers:', error);
      throw error;
    }
  }

  /**
   * Inicia todos los schedulers
   */
  start(): void {
    console.log('🚀 Iniciando schedulers...\n');

    try {
      if (this.waitListScheduler) {
        this.waitListScheduler.start();
        this.actualizarEstado('WaitList', 'running');
      }

      if (this.autoClosureScheduler) {
        this.autoClosureScheduler.start();
        this.actualizarEstado('AutoClosure', 'running');
      }

      if (this.inasistenciaScheduler) {
        this.inasistenciaScheduler.start();
        this.actualizarEstado('Inasistencia', 'running');
      }

      if (this.reminderScheduler) {
        this.reminderScheduler.start();
        this.actualizarEstado('Reminder', 'running');
      }

      if (this.expiracionTicketsScheduler) {
        this.expiracionTicketsScheduler.iniciar();
        this.actualizarEstado('ExpiracionTickets', 'running');
      }

      if (this.timeZoneScheduler) {
        this.timeZoneScheduler.start();
        this.actualizarEstado('TimeZone', 'running');
      }

      if (this.automationScheduler) {
        this.automationScheduler.start();
        this.actualizarEstado('Automation', 'running');
      }

      if (this.calendarioRecordatorioScheduler) {
        this.calendarioRecordatorioScheduler.start();
        this.actualizarEstado('CalendarioRecordatorio', 'running');
      }

      if (this.citasRecordatorioScheduler) {
        this.citasRecordatorioScheduler.start();
        this.actualizarEstado('CitasRecordatorio', 'running');
      }

      if (this.markNoShowsScheduler) {
        this.markNoShowsScheduler.start();
        this.actualizarEstado('MarkNoShows', 'running');
      }

      console.log('\n╔═══════════════════════════════════════════════════════╗');
      console.log('║          TODOS LOS SCHEDULERS INICIADOS ✅            ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');

    } catch (error) {
      console.error('❌ Error iniciando schedulers:', error);
      throw error;
    }
  }

  /**
   * Detiene todos los schedulers
   */
  stop(): void {
    console.log('\n⏹️  Deteniendo schedulers...\n');

    if (this.waitListScheduler) {
      this.waitListScheduler.stop();
      this.actualizarEstado('WaitList', 'stopped');
    }

    if (this.autoClosureScheduler) {
      this.autoClosureScheduler.stop();
      this.actualizarEstado('AutoClosure', 'stopped');
    }

    if (this.inasistenciaScheduler) {
      this.inasistenciaScheduler.stop();
      this.actualizarEstado('Inasistencia', 'stopped');
    }

    if (this.expiracionTicketsScheduler) {
      this.expiracionTicketsScheduler.detener();
      this.actualizarEstado('ExpiracionTickets', 'stopped');
    }

    if (this.reminderScheduler) {
      this.reminderScheduler.stop();
      this.actualizarEstado('Reminder', 'stopped');
    }

    if (this.timeZoneScheduler) {
      this.timeZoneScheduler.stop();
      this.actualizarEstado('TimeZone', 'stopped');
    }

    if (this.automationScheduler) {
      this.automationScheduler.stop();
      this.actualizarEstado('Automation', 'stopped');
    }

    if (this.calendarioRecordatorioScheduler) {
      this.calendarioRecordatorioScheduler.stop();
      this.actualizarEstado('CalendarioRecordatorio', 'stopped');
    }

    if (this.citasRecordatorioScheduler) {
      this.citasRecordatorioScheduler.stop();
      this.actualizarEstado('CitasRecordatorio', 'stopped');
    }

    if (this.markNoShowsScheduler) {
      this.markNoShowsScheduler.stop();
      this.actualizarEstado('MarkNoShows', 'stopped');
    }

    console.log('✅ Todos los schedulers detenidos\n');
  }

  /**
   * Reinicia todos los schedulers
   */
  async reiniciar(): Promise<void> {
    console.log('\n🔄 Reiniciando schedulers...\n');
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
    this.start();
    console.log('✅ Schedulers reiniciados\n');
  }

  /**
   * Obtiene el estado de todos los schedulers
   */
  getEstado(): SchedulerStatus[] {
    return Array.from(this.estadoSchedulers.values());
  }

  /**
   * Obtiene el estado de un scheduler específico
   */
  getEstadoScheduler(nombre: string): SchedulerStatus | undefined {
    return this.estadoSchedulers.get(nombre);
  }

  /**
   * Obtiene estadísticas generales del sistema de schedulers
   */
  getEstadisticas(): {
    totalSchedulers: number;
    activos: number;
    detenidos: number;
    conErrores: number;
    totalEjecuciones: number;
    totalErrores: number;
  } {
    const estados = Array.from(this.estadoSchedulers.values());

    return {
      totalSchedulers: estados.length,
      activos: estados.filter(e => e.activo).length,
      detenidos: estados.filter(e => !e.activo).length,
      conErrores: estados.filter(e => e.estado === 'error').length,
      totalEjecuciones: estados.reduce((sum, e) => sum + e.totalEjecuciones, 0),
      totalErrores: estados.reduce((sum, e) => sum + e.totalErrores, 0)
    };
  }

  /**
   * Activa o desactiva el modo mantenimiento
   */
  setModoMantenimiento(activar: boolean): void {
    if (activar) {
      console.log('⚠️  Activando modo mantenimiento...');
      this.stop();
      this.estadoSchedulers.forEach(estado => {
        estado.estado = 'maintenance';
      });
    } else {
      console.log('✅ Desactivando modo mantenimiento...');
      this.start();
    }
  }

  /**
   * Verifica la salud de todos los schedulers
   */
  async verificarSalud(): Promise<{
    estado: 'healthy' | 'degraded' | 'unhealthy';
    schedulers: { nombre: string; estado: string; mensaje?: string }[];
  }> {
    const schedulers = this.getEstado();
    const problemas = schedulers.filter(s => !s.activo || s.estado === 'error');

    let estado: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (problemas.length > 0) {
      estado = problemas.length === schedulers.length ? 'unhealthy' : 'degraded';
    }

    return {
      estado,
      schedulers: schedulers.map(s => ({
        nombre: s.nombre,
        estado: s.estado,
        mensaje: !s.activo ? 'Scheduler detenido' : s.estado === 'error' ? 'Scheduler con errores' : 'OK'
      }))
    };
  }

  /**
   * Ejecuta verificación manual de un scheduler específico
   */
  async ejecutarVerificacionManual(scheduler: 'waitlist' | 'autoclosure' | 'timezone'): Promise<void> {
    console.log(`\n🔧 Ejecutando verificación manual: ${scheduler}\n`);

    switch (scheduler) {
      case 'waitlist':
        if (this.waitListScheduler) {
          await this.waitListScheduler.ejecutarVerificacionManual();
        }
        break;

      case 'autoclosure':
        if (this.autoClosureScheduler) {
          await this.autoClosureScheduler.ejecutarCierreManual();
        }
        break;

      case 'timezone':
        if (this.timeZoneScheduler) {
          await this.timeZoneScheduler.ejecutarVerificacionManual();
        }
        break;
    }
  }

  /**
   * Registra un scheduler en el sistema
   */
  private registrarScheduler(nombre: string): void {
    this.estadoSchedulers.set(nombre, {
      nombre,
      activo: false,
      totalEjecuciones: 0,
      totalErrores: 0,
      estado: 'stopped'
    });
  }

  /**
   * Actualiza el estado de un scheduler
   */
  private actualizarEstado(
    nombre: string, 
    estado: 'running' | 'stopped' | 'error' | 'maintenance'
  ): void {
    const schedulerEstado = this.estadoSchedulers.get(nombre);
    if (schedulerEstado) {
      schedulerEstado.activo = estado === 'running';
      schedulerEstado.estado = estado;
      schedulerEstado.ultimaEjecucion = new Date();
      this.estadoSchedulers.set(nombre, schedulerEstado);
    }
  }

  /**
   * Imprime un resumen del estado de los schedulers
   */
  imprimirResumen(): void {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║           ESTADO DE SCHEDULERS - RCA CRM             ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    const estadisticas = this.getEstadisticas();
    console.log('📊 Estadísticas Generales:');
    console.log(`   • Total schedulers: ${estadisticas.totalSchedulers}`);
    console.log(`   • Activos: ${estadisticas.activos}`);
    console.log(`   • Detenidos: ${estadisticas.detenidos}`);
    console.log(`   • Con errores: ${estadisticas.conErrores}`);
    console.log(`   • Total ejecuciones: ${estadisticas.totalEjecuciones}`);
    console.log(`   • Total errores: ${estadisticas.totalErrores}\n`);

    console.log('📋 Detalle por Scheduler:');
    this.getEstado().forEach(scheduler => {
      const icono = scheduler.activo ? '✅' : '⏹️';
      const estado = scheduler.estado.toUpperCase();
      console.log(`   ${icono} ${scheduler.nombre}: ${estado}`);
      if (scheduler.ultimaEjecucion) {
        console.log(`      └─ Última ejecución: ${scheduler.ultimaEjecucion.toLocaleString('es-MX')}`);
      }
    });

    console.log('\n╚═══════════════════════════════════════════════════════╝\n');
  }
}

// Factory function para crear el manager con configuración por defecto
export function crearSchedulerManager(
  citaRepository: CitaRepository,
  inasistenciaRepository: InasistenciaRepository,
  sucursalRepository: SucursalRepository,
  remarketingService: RemarketingService,
  config?: SchedulerConfig
): SchedulerManager {
  return new SchedulerManager(
    citaRepository,
    inasistenciaRepository,
    sucursalRepository,
    remarketingService,
    config
  );
}
