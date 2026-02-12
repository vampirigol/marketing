import cron from 'node-cron';
import { CitaEntity } from '../../core/entities/Cita';
import { PacienteEntity } from '../../core/entities/Paciente';
import { NotificationService } from '../notifications/NotificationService';

/**
 * Servicio de programación de recordatorios automáticos
 * 
 * FUNCIONALIDADES:
 * - Programar recordatorio 24h antes de la cita
 * - Programar recordatorio día de la cita (2h antes)
 * - Verificar citas cada 15 minutos para mover a lista de espera
 * - Cancelar recordatorios si la cita es reagendada/cancelada
 * - Cron jobs para ejecución automática de recordatorios
 * 
 * IMPLEMENTACIÓN:
 * - Usa node-cron para jobs programados
 * - Almacena jobs en memoria (en producción usar Redis/DB)
 * - Integrado con NotificationService
 */

interface RecordatorioProgramado {
  citaId: string;
  tipo: 'confirmacion' | 'recordatorio_24h' | 'recordatorio_dia' | 'verificacion_15min';
  fechaEjecucion: Date;
  ejecutado: boolean;
  cancelado: boolean;
}

export class ReminderScheduler {
  private notificationService: NotificationService;
  private recordatoriosProgramados: Map<string, RecordatorioProgramado[]>;
  private cronJobs: Map<string, cron.ScheduledTask>;
  private verificacionJob?: cron.ScheduledTask;

  constructor() {
    this.notificationService = new NotificationService();
    this.recordatoriosProgramados = new Map();
    this.cronJobs = new Map();
  }

  /**
   * Inicia los cron jobs para ejecución automática
   */
  start(): void {
    // Verificar recordatorios pendientes cada minuto
    this.verificacionJob = cron.schedule('* * * * *', async () => {
      await this.ejecutarRecordatoriosPendientes();
    });

    console.log('✅ ReminderScheduler iniciado');
    console.log('   • Verificación de recordatorios: Cada minuto');
    console.log('   • Recordatorios 24h: Automático');
    console.log('   • Recordatorios día de cita: Automático');
  }

  /**
   * Detiene todos los cron jobs
   */
  stop(): void {
    if (this.verificacionJob) {
      this.verificacionJob.stop();
    }
    
    for (const job of this.cronJobs.values()) {
      job.stop();
    }
    
    this.cronJobs.clear();
    console.log('⏹️  ReminderScheduler detenido');
  }

  /**
   * Programa todos los recordatorios para una cita nueva
   */
  async programarRecordatoriosCita(
    cita: CitaEntity,
    paciente: PacienteEntity,
    datosAdicionales?: {
      sucursalNombre?: string;
      sucursalDireccion?: string;
      doctorNombre?: string;
    }
  ): Promise<{
    confirmacion: boolean;
    recordatorio24h: boolean;
    recordatorioDia: boolean;
  }> {
    const resultados = {
      confirmacion: false,
      recordatorio24h: false,
      recordatorioDia: false
    };

    try {
      // 1. Enviar confirmación inmediata
      const confirma = await this.notificationService.enviarConfirmacionCita({
        cita,
        paciente,
        tipoNotificacion: 'confirmacion',
        datosAdicionales
      });
      resultados.confirmacion = confirma.enviado;

      // 2. Programar recordatorio 24h antes
      const fechaRecordatorio24h = this.calcularFechaRecordatorio(cita.fechaCita, 24);
      if (fechaRecordatorio24h > new Date()) {
        this.programarRecordatorio({
          citaId: cita.id,
          tipo: 'recordatorio_24h',
          fechaEjecucion: fechaRecordatorio24h,
          ejecutado: false,
          cancelado: false
        });
        resultados.recordatorio24h = true;
      }

      // 3. Programar recordatorio día de la cita (2h antes)
      const fechaRecordatorioDia = this.calcularFechaRecordatorio(cita.fechaCita, 2);
      if (fechaRecordatorioDia > new Date()) {
        this.programarRecordatorio({
          citaId: cita.id,
          tipo: 'recordatorio_dia',
          fechaEjecucion: fechaRecordatorioDia,
          ejecutado: false,
          cancelado: false
        });
        resultados.recordatorioDia = true;
      }

      // 4. Programar verificación de llegada (15 min después de hora de cita)
      const fechaVerificacion = this.calcularFechaVerificacion(cita.fechaCita, cita.horaCita);
      if (fechaVerificacion > new Date()) {
        this.programarRecordatorio({
          citaId: cita.id,
          tipo: 'verificacion_15min',
          fechaEjecucion: fechaVerificacion,
          ejecutado: false,
          cancelado: false
        });
      }

      console.log(`✅ Recordatorios programados para cita ${cita.id}`);
      return resultados;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error programando recordatorios:', errorMessage);
      return resultados;
    }
  }

  /**
   * Cancela todos los recordatorios de una cita (si se cancela o reagenda)
   */
  cancelarRecordatoriosCita(citaId: string): void {
    const recordatorios = this.recordatoriosProgramados.get(citaId);
    if (recordatorios) {
      recordatorios.forEach(r => {
        r.cancelado = true;
      });
      console.log(`🚫 Recordatorios cancelados para cita ${citaId}`);
    }
  }

  /**
   * Ejecuta todos los recordatorios pendientes
   * Este método debe ser llamado por un cron job cada minuto
   */
  async ejecutarRecordatoriosPendientes(): Promise<{
    ejecutados: number;
    errores: number;
  }> {
    const ahora = new Date();
    let ejecutados = 0;
    let errores = 0;

    for (const [citaId, recordatorios] of this.recordatoriosProgramados.entries()) {
      for (const recordatorio of recordatorios) {
        // Solo ejecutar si no está ejecutado, no está cancelado, y ya llegó la hora
        if (!recordatorio.ejecutado && 
            !recordatorio.cancelado && 
            recordatorio.fechaEjecucion <= ahora) {
          
          try {
            await this.ejecutarRecordatorio(citaId, recordatorio);
            recordatorio.ejecutado = true;
            ejecutados++;
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : 'Error desconocido';
            console.error(`❌ Error ejecutando recordatorio ${recordatorio.tipo} para cita ${citaId}:`, errMsg);
            errores++;
          }
        }
      }
    }

    // Limpiar recordatorios viejos (ejecutados o cancelados hace más de 7 días)
    this.limpiarRecordatoriosViejos();

    return { ejecutados, errores };
  }

  /**
   * Calcula la fecha para enviar el recordatorio
   */
  private calcularFechaRecordatorio(fechaCita: Date, horasAntes: number): Date {
    const fecha = new Date(fechaCita);
    fecha.setHours(fecha.getHours() - horasAntes);
    return fecha;
  }

  /**
   * Calcula la fecha de verificación (15 min después de la hora de cita)
   */
  private calcularFechaVerificacion(fechaCita: Date, horaCita: string): Date {
    const [horas, minutos] = horaCita.split(':').map(Number);
    const fecha = new Date(fechaCita);
    fecha.setHours(horas, minutos + 15, 0, 0);
    return fecha;
  }

  /**
   * Programa un recordatorio en el mapa
   */
  private programarRecordatorio(recordatorio: RecordatorioProgramado): void {
    const recordatorios = this.recordatoriosProgramados.get(recordatorio.citaId) || [];
    recordatorios.push(recordatorio);
    this.recordatoriosProgramados.set(recordatorio.citaId, recordatorios);
  }

  /**
   * Ejecuta un recordatorio específico
   */
  private async ejecutarRecordatorio(citaId: string, recordatorio: RecordatorioProgramado): Promise<void> {
    console.log(`📬 Ejecutando ${recordatorio.tipo} para cita ${citaId}`);

    // TODO: En producción, obtener cita y paciente de la base de datos
    // const cita = await citaRepository.obtenerPorId(citaId);
    // const paciente = await pacienteRepository.obtenerPorId(cita.pacienteId);

    // Por ahora, simulamos
    console.log(`[SIMULADO] Recordatorio ${recordatorio.tipo} enviado para cita ${citaId}`);

    /* IMPLEMENTACIÓN REAL:
    
    switch (recordatorio.tipo) {
      case 'recordatorio_24h':
        await this.notificationService.enviarRecordatorio24h({
          cita,
          paciente,
          tipoNotificacion: 'recordatorio_24h'
        });
        break;

      case 'recordatorio_dia':
        await this.notificationService.enviarRecordatorioDiaCita({
          cita,
          paciente,
          tipoNotificacion: 'recordatorio_dia'
        });
        break;

      case 'verificacion_15min':
        // Verificar si el paciente llegó
        if (cita.estado === 'Agendada' || cita.estado === 'Confirmada') {
          // No llegó, mover a lista de espera
          cita.estado = 'No_Asistio';
          await citaRepository.actualizar(cita);
          
          await this.notificationService.notificarListaEspera({
            cita,
            paciente,
            tipoNotificacion: 'cancelacion'
          });
        }
        break;
    }
    */
  }

  /**
   * Limpia recordatorios viejos para liberar memoria
   */
  private limpiarRecordatoriosViejos(): void {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    for (const [citaId, recordatorios] of this.recordatoriosProgramados.entries()) {
      const recordatoriosActivos = recordatorios.filter(r => {
        const esReciente = r.fechaEjecucion > hace7Dias;
        const estaPendiente = !r.ejecutado && !r.cancelado;
        return esReciente || estaPendiente;
      });

      if (recordatoriosActivos.length === 0) {
        this.recordatoriosProgramados.delete(citaId);
      } else if (recordatoriosActivos.length < recordatorios.length) {
        this.recordatoriosProgramados.set(citaId, recordatoriosActivos);
      }
    }
  }

  /**
   * Obtiene estadísticas de recordatorios
   */
  getEstadisticas(): {
    totalCitas: number;
    totalRecordatorios: number;
    pendientes: number;
    ejecutados: number;
    cancelados: number;
  } {
    let totalRecordatorios = 0;
    let pendientes = 0;
    let ejecutados = 0;
    let cancelados = 0;

    for (const recordatorios of this.recordatoriosProgramados.values()) {
      totalRecordatorios += recordatorios.length;
      pendientes += recordatorios.filter(r => !r.ejecutado && !r.cancelado).length;
      ejecutados += recordatorios.filter(r => r.ejecutado).length;
      cancelados += recordatorios.filter(r => r.cancelado).length;
    }

    return {
      totalCitas: this.recordatoriosProgramados.size,
      totalRecordatorios,
      pendientes,
      ejecutados,
      cancelados
    };
  }

  /**
   * Obtiene recordatorios de una cita específica
   */
  getRecordatoriosCita(citaId: string): RecordatorioProgramado[] {
    return this.recordatoriosProgramados.get(citaId) || [];
  }

  /**
   * Reinicia el programador (útil para testing)
   */
  reset(): void {
    this.recordatoriosProgramados.clear();
    console.log('🔄 Programador de recordatorios reiniciado');
  }
}

// Singleton instance
export const reminderScheduler = new ReminderScheduler();
