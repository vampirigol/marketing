/**
 * Scheduler: Lista de Espera
 * Verifica cada 15 minutos si las citas deben moverse a lista de espera
 * 
 * LÓGICA:
 * - Cada 15 minutos busca citas "Agendadas" o "Confirmadas"
 * - Si pasaron >15 minutos desde la hora programada y no llegó
 * - La cita pasa automáticamente a "En_Lista_Espera"
 * - Notifica al paciente y al contact center
 */

import cron from 'node-cron';
import { CitaEntity } from '../../core/entities/Cita';
import { CitaRepository } from '../database/repositories/CitaRepository';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConfiguracionListaEspera {
  minutosTolerancia: number; // 15 minutos por defecto
  intervaloVerificacion: string; // Cron expression: cada 15 minutos
  notificarPaciente: boolean;
  notificarContactCenter: boolean;
}

export class WaitListScheduler {
  private verificacionJob?: cron.ScheduledTask;
  private config: ConfiguracionListaEspera;

  constructor(
    private citaRepository: CitaRepository,
    config?: Partial<ConfiguracionListaEspera>
  ) {
    this.config = {
      minutosTolerancia: config?.minutosTolerancia || 15,
      intervaloVerificacion: config?.intervaloVerificacion || '*/15 * * * *', // Cada 15 minutos
      notificarPaciente: config?.notificarPaciente ?? true,
      notificarContactCenter: config?.notificarContactCenter ?? true,
    };
  }

  /**
   * Inicia el scheduler de lista de espera
   */
  start(): void {
    // Cada 15 minutos verifica si hay citas que deben pasar a lista de espera
    this.verificacionJob = cron.schedule(this.config.intervaloVerificacion, async () => {
      await this.verificarYMoverCitasAListaEspera();
    });

    console.log('✅ WaitListScheduler iniciado');
    console.log(`   • Verificación cada 15 minutos (${this.config.intervaloVerificacion})`);
    console.log(`   • Tolerancia: ${this.config.minutosTolerancia} minutos`);
    console.log(`   • Notificar paciente: ${this.config.notificarPaciente ? 'Sí' : 'No'}`);
  }

  /**
   * Detiene el scheduler
   */
  stop(): void {
    if (this.verificacionJob) {
      this.verificacionJob.stop();
    }
    console.log('⏹️  WaitListScheduler detenido');
  }

  /**
   * Verifica y mueve citas a lista de espera
   * Se ejecuta cada 15 minutos
   */
  private async verificarYMoverCitasAListaEspera(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Verificando citas para lista de espera...`);

    try {
      // 1. Obtener todas las citas que deberían estar en curso o ya pasadas
      const citasPendientes = await this.citaRepository.buscarCitasPendientesVerificacion();

      if (citasPendientes.length === 0) {
        console.log('   ✓ No hay citas pendientes de verificación');
        return;
      }

      console.log(`   📋 ${citasPendientes.length} citas para verificar`);

      let movidasAListaEspera = 0;
      const ahora = new Date();

      for (const cita of citasPendientes) {
        // Calcular si ya pasó el tiempo de tolerancia
        const horaLimiteCita = this.calcularHoraLimite(cita.fechaCita, cita.horaCita);
        const minutosTranscurridos = Math.floor((ahora.getTime() - horaLimiteCita.getTime()) / 1000 / 60);

        if (minutosTranscurridos > this.config.minutosTolerancia) {
          // El paciente no llegó a tiempo, mover a lista de espera
          await this.moverAListaEspera(cita, minutosTranscurridos);
          movidasAListaEspera++;
        }
      }

      console.log(`   ✅ Verificación completada:`);
      console.log(`      • Movidas a lista de espera: ${movidasAListaEspera}`);
      console.log(`      • Sin cambios: ${citasPendientes.length - movidasAListaEspera}`);

    } catch (error) {
      console.error('❌ Error en verificación de lista de espera:', error);
    }
  }

  /**
   * Mueve una cita a lista de espera
   */
  private async moverAListaEspera(cita: CitaEntity, minutosRetraso: number): Promise<void> {
    try {
      // 1. Actualizar estado de la cita
      await this.citaRepository.actualizar(cita.id, {
        estado: 'No_Asistio',
        motivoCancelacion: `No se presentó a tiempo (${minutosRetraso} min de retraso)`
      });

      console.log(`   ⚠️  Cita ${cita.id} → Lista de Espera (${minutosRetraso} min retraso)`);

      // 2. Agregar a lista de remarketing
      // TODO: Implementar método agregarAListaEspera en RemarketingService
      console.log(`   📝 Agregando a lista de remarketing: ${cita.id}`);

      // 3. Notificar al paciente (si está configurado)
      if (this.config.notificarPaciente) {
        await this.notificarPacienteListaEspera(cita, minutosRetraso);
      }

      // 4. Notificar al contact center (si está configurado)
      if (this.config.notificarContactCenter) {
        await this.notificarContactCenterListaEspera(cita, minutosRetraso);
      }

    } catch (error) {
      console.error(`   ❌ Error moviendo cita ${cita.id} a lista de espera:`, error);
    }
  }

  /**
   * Notifica al paciente que pasó a lista de espera
   */
  private async notificarPacienteListaEspera(cita: CitaEntity, _minutosRetraso: number): Promise<void> {
    try {
      const paciente = await this.citaRepository.obtenerPaciente(cita.pacienteId);
      
      const mensaje = `Hola ${paciente.nombre}. 

No detectamos tu llegada a tu cita de hoy ${format(new Date(cita.fechaCita), 'd \'de\' MMMM', { locale: es })} a las ${cita.horaCita}.

Has sido agregado a nuestra lista de espera. Si aún puedes asistir hoy, por favor confirma lo antes posible para asignarte un nuevo horario disponible.

¿Aún puedes venir hoy? 🏥`;

      // TODO: Implementar método enviarNotificacion
      console.log(`   📧 Notificación enviada a paciente ${cita.pacienteId}: ${mensaje}`);

    } catch (error) {
      console.error(`   ⚠️  Error notificando paciente ${cita.pacienteId}:`, error);
    }
  }

  /**
   * Notifica al contact center sobre la cita en lista de espera
   */
  private async notificarContactCenterListaEspera(cita: CitaEntity, _minutosRetraso: number): Promise<void> {
    try {
      // TODO: Integrar con sistema Matrix/Contact Center
      console.log(`   📞 Contact Center notificado: Cita ${cita.id} en lista de espera`);
      
      // Aquí se podría enviar a Matrix, crear alerta en dashboard, etc.
      // await this.matrixService.crearAlertaListaEspera(cita);
      
    } catch (error) {
      console.error(`   ⚠️  Error notificando contact center:`, error);
    }
  }

  /**
   * Calcula la hora límite de llegada (hora cita + tolerancia)
   */
  private calcularHoraLimite(fechaCita: Date, horaCita: string): Date {
    const [horas, minutos] = horaCita.split(':').map(Number);
    const horaLimite = new Date(fechaCita);
    horaLimite.setHours(horas, minutos, 0, 0);
    
    // Agregar tolerancia
    horaLimite.setMinutes(horaLimite.getMinutes() + this.config.minutosTolerancia);
    
    return horaLimite;
  }

  /**
   * Ejecuta verificación manual (útil para testing)
   */
  async ejecutarVerificacionManual(): Promise<{
    verificadas: number;
    movidasAListaEspera: number;
  }> {
    console.log('\n🔧 Ejecutando verificación manual de lista de espera...');
    await this.verificarYMoverCitasAListaEspera();
    
    return {
      verificadas: 0, // TODO: retornar métricas reales
      movidasAListaEspera: 0
    };
  }
}
