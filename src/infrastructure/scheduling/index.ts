/**
 * Inicializador de Schedulers
 * Gestiona todos los trabajos programados del sistema
 */

import { obtenerSchedulerExpiracion } from './ExpiracionOpenTicketsScheduler';

export class SchedulerManager {
  private schedulers: Array<{ detener?: () => void; constructor: { name: string } }> = [];

  /**
   * Inicia todos los schedulers del sistema
   */
  iniciarTodos(): void {
    console.log('🚀 Iniciando todos los schedulers...\n');

    // Scheduler de expiración de Open Tickets
    const schedulerExpiracion = obtenerSchedulerExpiracion();
    schedulerExpiracion.iniciar();
    this.schedulers.push(schedulerExpiracion);

    // Aquí se pueden agregar más schedulers en el futuro
    // Ejemplo: schedulerRecordatorios, schedulerReporteDiario, etc.

    console.log(`\n✅ ${this.schedulers.length} scheduler(s) iniciado(s) correctamente\n`);
  }

  /**
   * Detiene todos los schedulers
   */
  detenerTodos(): void {
    console.log('🛑 Deteniendo todos los schedulers...');
    
    this.schedulers.forEach(scheduler => {
      if (scheduler.detener) {
        scheduler.detener();
      }
    });

    this.schedulers = [];
    console.log('✅ Todos los schedulers detenidos');
  }

  /**
   * Obtiene el estado de todos los schedulers
   */
  obtenerEstado(): { total: number; activos: number; schedulers: Array<{ id: number; nombre: string; activo: boolean }> } {
    return {
      total: this.schedulers.length,
      activos: this.schedulers.length,
      schedulers: this.schedulers.map((s, index) => ({
        id: index + 1,
        nombre: s.constructor.name,
        activo: true,
      })),
    };
  }
}

// Instancia singleton
let managerInstance: SchedulerManager | null = null;

/**
 * Obtiene o crea la instancia del manager de schedulers
 */
export function obtenerSchedulerManager(): SchedulerManager {
  if (!managerInstance) {
    managerInstance = new SchedulerManager();
  }
  return managerInstance;
}
