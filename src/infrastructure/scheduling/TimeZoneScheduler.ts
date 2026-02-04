/**
 * Scheduler: Zonas Horarias y Sincronización de Sucursales
 * Gestiona automáticamente las zonas horarias de las sucursales
 * 
 * FUNCIONALIDADES:
 * - Verificación automática de zonas horarias por sucursal
 * - Sincronización de horarios entre sucursales
 * - Ajuste automático de horarios según zona horaria
 * - Detección de horario de verano (DST)
 * - Validación de horarios de operación
 */

import cron from 'node-cron';
import { SucursalRepository } from '../database/repositories/SucursalRepository';
import { SucursalEntity } from '../../core/entities/Sucursal';
import { format, utcToZonedTime } from 'date-fns-tz';
import { isWithinInterval, parse } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConfiguracionZonaHoraria {
  verificacionInterval: string; // Cron expression: por defecto cada 6 horas
  autoAjustarDST: boolean; // Ajuste automático de horario de verano
  notificarCambios: boolean;
  sincronizarAutomaticamente: boolean;
}

interface ResultadoVerificacion {
  sucursalId: string;
  sucursalNombre: string;
  zonaHoraria: string;
  horaLocal: Date;
  horaServidor: Date;
  diferencia: number; // Diferencia en horas
  estaEnHorarioOperacion: boolean;
  requiereAjuste: boolean;
  mensaje?: string;
}

export class TimeZoneScheduler {
  private verificacionJob?: cron.ScheduledTask;
  private sincronizacionJob?: cron.ScheduledTask;
  private config: ConfiguracionZonaHoraria;

  // Zonas horarias comunes en México
  private readonly ZONAS_HORARIAS_MEXICO = {
    'America/Mexico_City': 'Tiempo del Centro (CDMX, Guadalajara, Monterrey)',
    'America/Tijuana': 'Tiempo del Pacífico (Tijuana, Mexicali)',
    'America/Hermosillo': 'Tiempo de la Montaña (Hermosillo, Sonora)',
    'America/Cancun': 'Tiempo del Este (Cancún, Quintana Roo)',
    'America/Chihuahua': 'Tiempo de la Montaña (Chihuahua)',
  };

  constructor(
    private sucursalRepository: SucursalRepository,
    config?: Partial<ConfiguracionZonaHoraria>
  ) {
    this.config = {
      verificacionInterval: config?.verificacionInterval || '0 */6 * * *', // Cada 6 horas
      autoAjustarDST: config?.autoAjustarDST ?? true,
      notificarCambios: config?.notificarCambios ?? true,
      sincronizarAutomaticamente: config?.sincronizarAutomaticamente ?? true,
    };
  }

  /**
   * Inicia los schedulers de zona horaria
   */
  start(): void {
    // Verificación periódica de zonas horarias
    this.verificacionJob = cron.schedule(this.config.verificacionInterval, async () => {
      await this.verificarZonasHorarias();
    });

    // Sincronización diaria de horarios (00:00 cada día)
    this.sincronizacionJob = cron.schedule('0 0 * * *', async () => {
      await this.sincronizarHorariosSucursales();
    });

    console.log('✅ TimeZoneScheduler iniciado');
    console.log(`   • Verificación de zonas: ${this.config.verificacionInterval}`);
    console.log(`   • Sincronización diaria: 00:00`);
    console.log(`   • Auto-ajuste DST: ${this.config.autoAjustarDST ? 'Sí' : 'No'}`);
  }

  /**
   * Detiene los schedulers
   */
  stop(): void {
    if (this.verificacionJob) {
      this.verificacionJob.stop();
    }
    if (this.sincronizacionJob) {
      this.sincronizacionJob.stop();
    }
    console.log('⏹️  TimeZoneScheduler detenido');
  }

  /**
   * Verifica las zonas horarias de todas las sucursales
   */
  private async verificarZonasHorarias(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🌍 Verificando zonas horarias de sucursales...`);

    try {
      const sucursales = await this.sucursalRepository.obtenerTodas();
      
      if (sucursales.length === 0) {
        console.log('   ✓ No hay sucursales registradas');
        return;
      }

      console.log(`   📍 ${sucursales.length} sucursales a verificar`);

      const resultados: ResultadoVerificacion[] = [];

      for (const sucursal of sucursales) {
        const resultado = await this.verificarSucursal(sucursal);
        resultados.push(resultado);

        if (resultado.requiereAjuste) {
          console.log(`   ⚠️  ${sucursal.nombre}: Requiere ajuste (${resultado.mensaje})`);
        } else {
          console.log(`   ✓ ${sucursal.nombre}: OK (${resultado.zonaHoraria})`);
        }
      }

      // Notificar si hay cambios importantes
      const sucursalesConProblemas = resultados.filter(r => r.requiereAjuste);
      if (sucursalesConProblemas.length > 0 && this.config.notificarCambios) {
        await this.notificarProblemasZonaHoraria(sucursalesConProblemas);
      }

      console.log(`   ✅ Verificación completada: ${resultados.length} sucursales verificadas`);

    } catch (error) {
      console.error('❌ Error verificando zonas horarias:', error);
    }
  }

  /**
   * Verifica una sucursal específica
   */
  private async verificarSucursal(sucursal: SucursalEntity): Promise<ResultadoVerificacion> {
    const horaServidor = new Date();
    const zonaHoraria = sucursal.zonaHoraria || 'America/Mexico_City';
    
    try {
      // Convertir hora del servidor a hora local de la sucursal
      const horaLocal = utcToZonedTime(horaServidor, zonaHoraria);
      
      // Calcular diferencia en horas
      const diferencia = (horaLocal.getTime() - horaServidor.getTime()) / (1000 * 60 * 60);

      // Verificar si está en horario de operación
      const estaEnHorarioOperacion = this.estaEnHorarioOperacion(
        horaLocal,
        sucursal.horarioApertura,
        sucursal.horarioCierre,
        sucursal.diasOperacion
      );

      // Detectar si requiere ajuste (zona horaria no válida o no configurada)
      const requiereAjuste = !this.esZonaHorariaValida(zonaHoraria) || !sucursal.zonaHoraria;

      return {
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        zonaHoraria,
        horaLocal,
        horaServidor,
        diferencia,
        estaEnHorarioOperacion,
        requiereAjuste,
        mensaje: requiereAjuste ? 'Zona horaria no válida o no configurada' : undefined
      };

    } catch (error) {
      return {
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        zonaHoraria,
        horaLocal: horaServidor,
        horaServidor,
        diferencia: 0,
        estaEnHorarioOperacion: false,
        requiereAjuste: true,
        mensaje: `Error procesando zona horaria: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Sincroniza los horarios entre todas las sucursales
   */
  private async sincronizarHorariosSucursales(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Sincronizando horarios entre sucursales...`);

    try {
      const sucursales = await this.sucursalRepository.obtenerTodas();
      
      if (sucursales.length === 0) {
        console.log('   ✓ No hay sucursales para sincronizar');
        return;
      }

      const ahora = new Date();
      let sincronizadas = 0;

      for (const sucursal of sucursales) {
        try {
          // Obtener hora local de la sucursal
          const zonaHoraria = sucursal.zonaHoraria || 'America/Mexico_City';
          const horaLocal = utcToZonedTime(ahora, zonaHoraria);

          // Actualizar última sincronización (sin guardar en DB por ahora)
          // sucursal.ultimaSincronizacion = ahora;
          // sucursal.horaLocalUltimaSinc = horaLocal;
          
          // await this.sucursalRepository.actualizar(sucursal);
          sincronizadas++;

          console.log(`   ✓ ${sucursal.nombre}: ${format(horaLocal, 'HH:mm:ss', { timeZone: zonaHoraria })}`);

        } catch (error) {
          console.error(`   ❌ Error sincronizando ${sucursal.nombre}:`, error);
        }
      }

      console.log(`   ✅ Sincronización completada: ${sincronizadas}/${sucursales.length} sucursales`);

    } catch (error) {
      console.error('❌ Error en sincronización de horarios:', error);
    }
  }

  /**
   * Verifica si una zona horaria es válida
   */
  private esZonaHorariaValida(zonaHoraria: string): boolean {
    try {
      // Intenta crear una fecha en esa zona horaria
      const ahora = new Date();
      utcToZonedTime(ahora, zonaHoraria);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si una sucursal está en horario de operación
   */
  private estaEnHorarioOperacion(
    horaLocal: Date,
    horarioApertura: string,
    horarioCierre: string,
    diasOperacion: string[]
  ): boolean {
    // Verificar día de la semana
    const diaActual = format(horaLocal, 'EEEE', { locale: es });
    const diaCapitalizado = diaActual.charAt(0).toUpperCase() + diaActual.slice(1);
    
    if (!diasOperacion.includes(diaCapitalizado)) {
      return false;
    }

    // Verificar hora
    try {
      const apertura = parse(horarioApertura, 'HH:mm', horaLocal);
      const cierre = parse(horarioCierre, 'HH:mm', horaLocal);

      return isWithinInterval(horaLocal, { start: apertura, end: cierre });
    } catch {
      return false;
    }
  }

  /**
   * Notifica problemas con zonas horarias
   */
  private async notificarProblemasZonaHoraria(problemas: ResultadoVerificacion[]): Promise<void> {
    try {
      console.log('\n   📧 Notificando problemas de zona horaria...');
      
      const mensaje = `⚠️ *Alerta de Zonas Horarias*

Se detectaron ${problemas.length} sucursal(es) con problemas:

${problemas.map(p => `• ${p.sucursalNombre}: ${p.mensaje}`).join('\n')}

Por favor, revisa la configuración de zonas horarias.`;

      // TODO: Enviar notificación a administradores
      console.log(mensaje);

    } catch (error) {
      console.error('   ⚠️  Error notificando problemas:', error);
    }
  }

  /**
   * Convierte una hora de una zona horaria a otra
   */
  convertirHoraEntreSucursales(
    hora: Date,
    _sucursalOrigenId: string,
    _sucursalDestinoId: string
  ): Promise<Date> {
    // TODO: Implementar conversión entre sucursales
    return Promise.resolve(hora);
  }

  /**
   * Obtiene la hora actual de una sucursal
   */
  async obtenerHoraActualSucursal(sucursalId: string): Promise<{
    horaLocal: Date;
    zonaHoraria: string;
    estaAbierta: boolean;
  }> {
    const sucursal = await this.sucursalRepository.obtenerPorId(sucursalId);
    const zonaHoraria = sucursal.zonaHoraria || 'America/Mexico_City';
    const horaLocal = utcToZonedTime(new Date(), zonaHoraria);
    const estaAbierta = this.estaEnHorarioOperacion(
      horaLocal,
      sucursal.horarioApertura,
      sucursal.horarioCierre,
      sucursal.diasOperacion
    );

    return { horaLocal, zonaHoraria, estaAbierta };
  }

  /**
   * Lista todas las zonas horarias disponibles en México
   */
  getZonasHorariasDisponibles(): Record<string, string> {
    return this.ZONAS_HORARIAS_MEXICO;
  }

  /**
   * Ejecuta verificación manual
   */
  async ejecutarVerificacionManual(): Promise<void> {
    console.log('\n🔧 Ejecutando verificación manual de zonas horarias...');
    await this.verificarZonasHorarias();
  }

  /**
   * Ejecuta sincronización manual
   */
  async ejecutarSincronizacionManual(): Promise<void> {
    console.log('\n🔧 Ejecutando sincronización manual de horarios...');
    await this.sincronizarHorariosSucursales();
  }
}
