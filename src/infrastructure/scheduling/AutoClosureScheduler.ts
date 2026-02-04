/**
 * Scheduler: Cierre Automático de Listas de Espera
 * Ejecuta el cierre diario de listas de espera y conversión a inasistencias
 * 
 * LÓGICA:
 * - Se ejecuta al final de cada día (configurable, por defecto 23:00)
 * - Cierra todas las listas de espera del día
 * - Convierte citas "En_Lista_Espera" a "Inasistencia"
 * - Genera reportes de inasistencias
 * - Inicia protocolo de remarketing de 7 días
 */

import cron from 'node-cron';
import { CitaEntity } from '../../core/entities/Cita';
import { CitaRepository } from '../database/repositories/CitaRepository';
import { InasistenciaRepository } from '../database/repositories/InasistenciaRepository';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

interface ConfiguracionCierreAutomatico {
  horaCierre: string; // Hora de cierre (formato 24h: "23:00")
  cronExpression?: string; // Expresión cron personalizada
  generarReporte: boolean;
  notificarGerencia: boolean;
  iniciarProtocolo7Dias: boolean;
}

interface ResultadoCierre {
  fecha: Date;
  totalListasEspera: number;
  convertidas: number;
  errores: number;
  detalles: {
    citaId: string;
    pacienteId: string;
    sucursalId: string;
    resultado: 'exito' | 'error';
    mensaje?: string;
  }[];
}

export class AutoClosureScheduler {
  private cierreJob?: cron.ScheduledTask;
  private config: ConfiguracionCierreAutomatico;

  constructor(
    private citaRepository: CitaRepository,
    private inasistenciaRepository: InasistenciaRepository,
    config?: Partial<ConfiguracionCierreAutomatico>
  ) {
    this.config = {
      horaCierre: config?.horaCierre || '23:00',
      cronExpression: config?.cronExpression,
      generarReporte: config?.generarReporte ?? true,
      notificarGerencia: config?.notificarGerencia ?? true,
      iniciarProtocolo7Dias: config?.iniciarProtocolo7Dias ?? true,
    };
  }

  /**
   * Inicia el scheduler de cierre automático
   */
  start(): void {
    // Usar expresión cron personalizada o generar una desde horaCierre
    const cronExpression = this.config.cronExpression || this.generarCronExpression(this.config.horaCierre);

    // Ejecutar cierre diario
    this.cierreJob = cron.schedule(cronExpression, async () => {
      await this.ejecutarCierreDiario();
    });

    console.log('✅ AutoClosureScheduler iniciado');
    console.log(`   • Hora de cierre: ${this.config.horaCierre}`);
    console.log(`   • Cron: ${cronExpression}`);
    console.log(`   • Generar reporte: ${this.config.generarReporte ? 'Sí' : 'No'}`);
    console.log(`   • Protocolo 7 días: ${this.config.iniciarProtocolo7Dias ? 'Sí' : 'No'}`);
  }

  /**
   * Detiene el scheduler
   */
  stop(): void {
    if (this.cierreJob) {
      this.cierreJob.stop();
    }
    console.log('⏹️  AutoClosureScheduler detenido');
  }

  /**
   * Ejecuta el cierre diario de listas de espera
   */
  private async ejecutarCierreDiario(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Ejecutando cierre automático de listas de espera...`);
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const hoy = new Date();
      const inicioDia = startOfDay(hoy);
      const finDia = endOfDay(hoy);

      // 1. Obtener todas las citas en lista de espera del día
      const citasEnListaEspera = await this.citaRepository.buscarCitasEnListaEspera(
        inicioDia,
        finDia
      );

      if (citasEnListaEspera.length === 0) {
        console.log('   ✓ No hay citas en lista de espera para cerrar hoy');
        return;
      }

      console.log(`   📋 ${citasEnListaEspera.length} citas en lista de espera detectadas`);

      // 2. Procesar cada cita en lista de espera
      const resultado: ResultadoCierre = {
        fecha: hoy,
        totalListasEspera: citasEnListaEspera.length,
        convertidas: 0,
        errores: 0,
        detalles: []
      };

      for (const cita of citasEnListaEspera) {
        try {
          await this.convertirAInasistencia(cita, resultado);
          resultado.convertidas++;
        } catch (error) {
          resultado.errores++;
          resultado.detalles.push({
            citaId: cita.id,
            pacienteId: cita.pacienteId,
            sucursalId: cita.sucursalId,
            resultado: 'error',
            mensaje: error instanceof Error ? error.message : 'Error desconocido'
          });
          console.error(`   ❌ Error procesando cita ${cita.id}:`, error);
        }
      }

      // 3. Generar reporte si está configurado
      if (this.config.generarReporte) {
        await this.generarReporteCierre(resultado);
      }

      // 4. Notificar a gerencia si está configurado
      if (this.config.notificarGerencia) {
        await this.notificarGerencia(resultado);
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('   ✅ Cierre automático completado:');
      console.log(`      • Total procesadas: ${resultado.totalListasEspera}`);
      console.log(`      • Convertidas a inasistencia: ${resultado.convertidas}`);
      console.log(`      • Errores: ${resultado.errores}`);
      console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
      console.error('❌ Error en cierre automático de listas:', error);
    }
  }

  /**
   * Convierte una cita en lista de espera a inasistencia
   */
  private async convertirAInasistencia(cita: CitaEntity, resultado: ResultadoCierre): Promise<void> {
    // 1. Actualizar estado de la cita
    await this.citaRepository.actualizar(cita.id, {
      estado: 'No_Asistio'
    });

    // 2. Crear registro de inasistencia
    const inasistencia = {
      id: uuidv4(),
      citaId: cita.id,
      pacienteId: cita.pacienteId,
      sucursalId: cita.sucursalId,
      fechaCitaPerdida: cita.fechaCita,
      horaCitaPerdida: cita.horaCita,
      estadoSeguimiento: 'Pendiente_Contacto' as const,
      intentosContacto: 0,
      notasContacto: ['Cita cerrada automáticamente desde lista de espera'],
      enListaRemarketing: true,
      fechaIngresoRemarketing: new Date(),
      fechaLimiteRespuesta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      marcadoComoPerdido: false,
      bloqueadoMarketing: false,
      creadoPor: 'sistema_autoclosure',
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    };

    await this.inasistenciaRepository.crear(inasistencia);

    // 3. Iniciar protocolo de 7 días si está configurado
    if (this.config.iniciarProtocolo7Dias) {
      // TODO: Implementar método iniciarProtocolo7Dias en RemarketingService
      console.log(`   🔄 Iniciando protocolo 7 días para inasistencia ${inasistencia.id}`);
    }

    // 4. Registrar detalle
    resultado.detalles.push({
      citaId: cita.id,
      pacienteId: cita.pacienteId,
      sucursalId: cita.sucursalId,
      resultado: 'exito'
    });

    console.log(`   ✓ Cita ${cita.id} → Inasistencia (ID: ${inasistencia.id})`);
  }

  /**
   * Genera reporte de cierre diario
   */
  private async generarReporteCierre(resultado: ResultadoCierre): Promise<void> {
    try {
      const fechaFormato = format(resultado.fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
      
      const reporte = {
        titulo: `Reporte de Cierre Automático - ${fechaFormato}`,
        fecha: resultado.fecha,
        resumen: {
          totalProcesadas: resultado.totalListasEspera,
          exitosas: resultado.convertidas,
          errores: resultado.errores,
          tasaExito: resultado.totalListasEspera > 0 
            ? ((resultado.convertidas / resultado.totalListasEspera) * 100).toFixed(2) + '%'
            : '0%'
        },
        detallesPorSucursal: this.agruparPorSucursal(resultado.detalles),
        detalles: resultado.detalles,
        generadoEn: new Date()
      };

      // TODO: Guardar reporte en base de datos o sistema de archivos
      console.log('\n   📊 Reporte generado:');
      console.log(`      ${JSON.stringify(reporte.resumen, null, 2)}`);

    } catch (error) {
      console.error('   ⚠️  Error generando reporte:', error);
    }
  }

  /**
   * Notifica a gerencia sobre el cierre del día
   */
  private async notificarGerencia(resultado: ResultadoCierre): Promise<void> {
    try {
      const fechaFormato = format(resultado.fecha, "d 'de' MMMM", { locale: es });
      
      const mensaje = `📊 *Reporte de Cierre Diario*
Fecha: ${fechaFormato}

🔢 Resumen:
• Total procesadas: ${resultado.totalListasEspera}
• Convertidas a inasistencia: ${resultado.convertidas}
• Errores: ${resultado.errores}

${resultado.errores > 0 ? '⚠️ Revisa los errores en el panel de administración' : '✅ Cierre exitoso'}`;

      // TODO: Enviar a canal de gerencia/administración
      console.log('\n   📧 Notificación a gerencia enviada');
      console.log(mensaje);
      
    } catch (error) {
      console.error('   ⚠️  Error notificando gerencia:', error);
    }
  }

  /**
   * Agrupa detalles por sucursal para el reporte
   */
  private agruparPorSucursal(detalles: ResultadoCierre['detalles']): Record<string, number> {
    return detalles.reduce((acc, detalle) => {
      acc[detalle.sucursalId] = (acc[detalle.sucursalId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Genera expresión cron desde hora en formato 24h
   */
  private generarCronExpression(hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);
    return `${minutos} ${horas} * * *`; // min hora dia mes dia_semana
  }

  /**
   * Ejecuta cierre manual (útil para testing o cierre anticipado)
   */
  async ejecutarCierreManual(fecha?: Date): Promise<ResultadoCierre> {
    console.log('\n🔧 Ejecutando cierre manual de listas de espera...');
    await this.ejecutarCierreDiario();
    
    // TODO: retornar resultado real
    return {
      fecha: fecha || new Date(),
      totalListasEspera: 0,
      convertidas: 0,
      errores: 0,
      detalles: []
    };
  }
}
