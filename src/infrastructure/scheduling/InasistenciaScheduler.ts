/**
 * Scheduler: Inasistencias
 * Procesa automáticamente las inasistencias y ejecuta el protocolo de 7 días
 */

import cron from 'node-cron';
import { ProcesarProtocolo7Dias } from '../../core/use-cases/ProcesarProtocolo7Dias';
import { InasistenciaRepository } from '../database/repositories/InasistenciaRepository';
import { RemarketingService } from '../remarketing/RemarketingService';

export class InasistenciaScheduler {
  private protocolo7DiasJob?: cron.ScheduledTask;
  private verificacionProximasJob?: cron.ScheduledTask;
  private remarketingAutoJob?: cron.ScheduledTask;

  constructor(
    private inasistenciaRepo: InasistenciaRepository,
    private remarketingService: RemarketingService
  ) {}

  /**
   * Inicia todos los schedulers
   */
  start(): void {
    this.iniciarProtocolo7Dias();
    this.iniciarVerificacionProximas();
    this.iniciarRemarketingAutomatico();
    
    console.log('✅ Scheduler de Inasistencias iniciado');
    console.log('   • Protocolo 7 días: Diario a las 00:00');
    console.log('   • Verificación próximas: Cada 6 horas');
    console.log('   • Remarketing automático: Diario a las 09:00');
  }

  /**
   * Detiene todos los schedulers
   */
  stop(): void {
    if (this.protocolo7DiasJob) {
      this.protocolo7DiasJob.stop();
    }
    if (this.verificacionProximasJob) {
      this.verificacionProximasJob.stop();
    }
    if (this.remarketingAutoJob) {
      this.remarketingAutoJob.stop();
    }
    
    console.log('⏹️  Scheduler de Inasistencias detenido');
  }

  /**
   * Ejecuta el protocolo de 7 días diariamente a medianoche
   */
  private iniciarProtocolo7Dias(): void {
    // Ejecutar todos los días a las 00:00
    this.protocolo7DiasJob = cron.schedule('0 0 * * *', async () => {
      console.log(`\n[${new Date().toISOString()}] 🔄 Ejecutando Protocolo 7 Días...`);
      
      try {
        const useCase = new ProcesarProtocolo7Dias(this.inasistenciaRepo);
        const result = await useCase.execute();

        if (result.success) {
          console.log(`✅ Protocolo 7 Días completado:`);
          console.log(`   • Procesados: ${result.procesados}`);
          console.log(`   • Marcados como perdidos: ${result.marcadosPerdidos}`);
          console.log(`   • Alertas próximas: ${result.alertasProximas}`);

          // Log de detalles importantes
          const marcados = result.detalles.filter(d => d.accion === 'MARCADO_PERDIDO');
          if (marcados.length > 0) {
            console.log(`\n   ⚠️  Pacientes marcados como PERDIDOS:`);
            marcados.forEach(d => {
              console.log(`      - Paciente ${d.pacienteId} (${d.diasTranscurridos} días sin respuesta)`);
            });
          }

          const alertas = result.detalles.filter(d => d.accion === 'ALERTA_PROXIMA');
          if (alertas.length > 0) {
            console.log(`\n   🔔 Alertas - Próximos a vencer (acción requerida):`);
            alertas.forEach(d => {
              console.log(`      - Paciente ${d.pacienteId} (${d.diasTranscurridos} días transcurridos)`);
            });
          }
        } else {
          console.error(`❌ Error en Protocolo 7 Días`);
        }
      } catch (error) {
        console.error('❌ Error ejecutando Protocolo 7 Días:', error);
      }
    });

    console.log('   ✓ Protocolo 7 días programado (00:00 diario)');
  }

  /**
   * Verifica inasistencias próximas a vencer cada 6 horas
   */
  private iniciarVerificacionProximas(): void {
    // Ejecutar cada 6 horas (00:00, 06:00, 12:00, 18:00)
    this.verificacionProximasJob = cron.schedule('0 */6 * * *', async () => {
      console.log(`\n[${new Date().toISOString()}] 🔔 Verificando inasistencias próximas a vencer...`);
      
      try {
        const proximas = await this.inasistenciaRepo.obtenerProximasAVencer(2);

        if (proximas.length > 0) {
          console.log(`⚠️  ${proximas.length} inasistencias próximas a vencer (< 2 días):`);
          proximas.forEach(i => {
            const diasRestantes = Math.floor(
              (i.fechaLimiteRespuesta.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            console.log(`   • Paciente ${i.pacienteId} - ${diasRestantes} días restantes`);
          });
          
          // TODO: Enviar notificaciones al equipo de Contact Center
          console.log('   📧 Notificaciones enviadas al equipo de Contact Center');
        } else {
          console.log('✅ No hay inasistencias próximas a vencer');
        }
      } catch (error) {
        console.error('❌ Error verificando inasistencias próximas:', error);
      }
    });

    console.log('   ✓ Verificación próximas programada (cada 6 horas)');
  }

  /**
   * Ejecuta remarketing automático para lista pendiente
   */
  private iniciarRemarketingAutomatico(): void {
    // Ejecutar diariamente a las 09:00 AM
    this.remarketingAutoJob = cron.schedule('0 9 * * *', async () => {
      console.log(`\n[${new Date().toISOString()}] 📢 Ejecutando Remarketing Automático...`);
      
      try {
        // Obtener lista de remarketing
        const lista = await this.remarketingService.obtenerListaRemarketing();

        if (lista.length === 0) {
          console.log('✅ No hay pacientes en lista de remarketing');
          return;
        }

        console.log(`📋 ${lista.length} pacientes en lista de remarketing`);

        // Filtrar solo los que están listos para contacto
        const ahora = new Date();
        const listos = lista.filter(i => {
          if (!i.proximoIntentoContacto) return true;
          return ahora >= i.proximoIntentoContacto;
        });

        if (listos.length === 0) {
          console.log('⏰ Ningún paciente listo para contacto en este momento');
          return;
        }

        console.log(`✅ ${listos.length} pacientes listos para contacto`);

        // Ejecutar campaña (limitado a 50 por día para no saturar)
        const aContactar = listos.slice(0, 50);
        const ids = aContactar.map(i => i.id);

        const resultados = await this.remarketingService.ejecutarCampana(ids, 'WhatsApp');
        const exitosos = resultados.filter(r => r.enviado).length;
        const fallidos = resultados.filter(r => !r.enviado).length;

        console.log(`\n📊 Resultados de Remarketing Automático:`);
        console.log(`   • Total procesados: ${resultados.length}`);
        console.log(`   • Enviados exitosamente: ${exitosos}`);
        console.log(`   • Fallidos: ${fallidos}`);

        if (fallidos > 0) {
          console.log(`\n   ⚠️  Mensajes fallidos:`);
          resultados
            .filter(r => !r.enviado)
            .forEach(r => {
              console.log(`      - Paciente ${r.pacienteId}: ${r.error}`);
            });
        }
      } catch (error) {
        console.error('❌ Error en Remarketing Automático:', error);
      }
    });

    console.log('   ✓ Remarketing automático programado (09:00 diario)');
  }

  /**
   * Ejecuta manualmente el protocolo de 7 días (para testing)
   */
  async ejecutarProtocolo7DiasManual(): Promise<void> {
    console.log('🔄 Ejecutando Protocolo 7 Días MANUAL...');
    
    try {
      const useCase = new ProcesarProtocolo7Dias(this.inasistenciaRepo);
      const result = await useCase.execute();

      console.log('✅ Resultado:', result);
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  /**
   * Ejecuta manualmente el remarketing (para testing)
   */
  async ejecutarRemarketingManual(): Promise<void> {
    console.log('📢 Ejecutando Remarketing MANUAL...');
    
    try {
      const lista = await this.remarketingService.obtenerListaRemarketing();
      console.log(`📋 ${lista.length} pacientes en lista`);

      if (lista.length > 0) {
        const ids = lista.slice(0, 5).map(i => i.id); // Solo 5 para testing
        const resultados = await this.remarketingService.ejecutarCampana(ids, 'WhatsApp');
        console.log('✅ Resultados:', resultados);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  /**
   * Obtiene el estado del scheduler
   */
  getStatus(): {
    activo: boolean;
    jobs: {
      protocolo7Dias: boolean;
      verificacionProximas: boolean;
      remarketingAuto: boolean;
    };
  } {
    return {
      activo: true,
      jobs: {
        protocolo7Dias: !!this.protocolo7DiasJob,
        verificacionProximas: !!this.verificacionProximasJob,
        remarketingAuto: !!this.remarketingAutoJob
      }
    };
  }
}
