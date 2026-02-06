import { AutomationRule, AutomationLog } from '../../core/entities/AutomationRule';
import { SolicitudContactoRepository } from '../database/repositories/SolicitudContactoRepository';
import { WhatsAppService } from '../messaging/WhatsAppService';
import { FacebookService } from '../messaging/FacebookService';
import { InstagramService } from '../messaging/InstagramService';

const SOCIAL_CHANNELS = ['Facebook', 'Instagram'];

export class AutomationEngine {
  constructor(
    private readonly contactosRepo: SolicitudContactoRepository,
    private readonly whatsapp: WhatsAppService,
    private readonly facebook: FacebookService,
    private readonly instagram: InstagramService
  ) {}

  async ejecutarReglas(reglas: AutomationRule[]): Promise<AutomationLog[]> {
    const logs: AutomationLog[] = [];
    const solicitudes = await this.contactosRepo.obtenerTodas();

    const ordenadas = [...reglas].filter((r) => r.activa).sort((a, b) => {
      const rank = { alta: 3, media: 2, baja: 1 };
      const pa = rank[a.prioridad || 'media'];
      const pb = rank[b.prioridad || 'media'];
      if (pa !== pb) return pb - pa;
      return (a.fechaActualizacion?.getTime() || 0) - (b.fechaActualizacion?.getTime() || 0);
    });

    for (const solicitud of solicitudes) {
      for (const regla of ordenadas) {
        if (!this.cumpleRegla(solicitud, regla)) continue;
        const resultado = await this.ejecutarAcciones(solicitud, regla);
        logs.push(resultado);
      }
    }

    return logs;
  }

  simularRegla(regla: AutomationRule): { afectados: number; ids: string[] } {
    return { afectados: 0, ids: [] };
  }

  private cumpleRegla(solicitud: Awaited<ReturnType<SolicitudContactoRepository['obtenerPorId']>> | null, regla: AutomationRule): boolean {
    if (!solicitud) return false;
    if (!this.estaEnHorario(regla.horario)) return false;
    if (this.estaEnPausa(regla.pausa)) return false;

    return regla.condiciones.every((cond) => {
      const valorTexto = String(cond.value);
      const valorNumero = typeof cond.value === 'number' ? cond.value : parseFloat(valorTexto);
      const diasSinRespuesta = this.diasSinRespuesta(solicitud);
      const canal = solicitud.origen;
      switch (cond.type) {
        case 'estado':
          return this.compare(cond.operator, solicitud.estado, valorTexto);
        case 'sucursal':
          return this.compare(cond.operator, solicitud.sucursalId, valorTexto) || this.compare(cond.operator, solicitud.sucursalNombre, valorTexto);
        case 'origen':
        case 'canal':
          if (cond.operator === 'in' || cond.operator === 'not-in') {
            const list = valorTexto === 'redes-sociales' ? SOCIAL_CHANNELS : [valorTexto];
            const contains = list.includes(canal);
            return cond.operator === 'in' ? contains : !contains;
          }
          return this.compare(cond.operator, canal, valorTexto);
        case 'intentos':
          return this.compareNumber(cond.operator, solicitud.intentosContacto, valorNumero);
        case 'dias-sin-respuesta':
          return this.compareNumber(cond.operator, diasSinRespuesta, valorNumero);
        case 'ventana-mensajeria':
          if (!SOCIAL_CHANNELS.includes(canal)) return true;
          return this.compareNumber(cond.operator, diasSinRespuesta, valorNumero);
        case 'contenido': {
          const texto = `${solicitud.motivoDetalle || ''} ${solicitud.notas || ''}`.toLowerCase();
          if (cond.operator === 'contains') return texto.includes(valorTexto.toLowerCase());
          if (cond.operator === 'not-contains') return !texto.includes(valorTexto.toLowerCase());
          return false;
        }
        case 'time-in-status': {
          const horas = this.horasDesde(solicitud.ultimaActualizacion);
          return this.compareNumber(cond.operator, horas, valorNumero);
        }
        default:
          return true;
      }
    });
  }

  private async ejecutarAcciones(solicitud: Awaited<ReturnType<SolicitudContactoRepository['obtenerPorId']>> | null, regla: AutomationRule): Promise<AutomationLog> {
    const detalles: string[] = [];
    let resultado: 'exitosa' | 'fallida' | 'parcial' = 'exitosa';

    if (!solicitud) {
      return this.buildLog(regla, 'fallida', 'Solicitud no encontrada', []);
    }

    for (const accion of regla.acciones) {
      try {
        switch (accion.type) {
          case 'move-status':
            await this.contactosRepo.actualizar(solicitud.id, { estado: accion.value as any });
            detalles.push(`Mover a estado: ${accion.value}`);
            break;
          case 'assign-vendedor':
            await this.contactosRepo.actualizar(solicitud.id, { agenteAsignadoNombre: String(accion.value) });
            detalles.push(`Asignar vendedor: ${accion.value}`);
            break;
          case 'send-notification':
            await this.enviarNotificacion(solicitud, regla, accion.description || String(accion.value));
            detalles.push(`Notificación enviada: ${accion.description || accion.value}`);
            break;
          case 'create-task':
            await this.contactosRepo.actualizar(solicitud.id, { notas: this.appendNota(solicitud.notas, `Tarea: ${accion.value}`) });
            detalles.push(`Tarea creada: ${accion.value}`);
            break;
          case 'notify-supervisor':
            await this.contactosRepo.actualizar(solicitud.id, { notas: this.appendNota(solicitud.notas, `Supervisor: ${accion.value}`) });
            detalles.push(`Supervisor notificado: ${accion.value}`);
            break;
          case 'block-conversation':
            await this.contactosRepo.actualizar(solicitud.id, { notas: this.appendNota(solicitud.notas, `Bloqueo: ${accion.description || accion.value}`) });
            detalles.push(`Conversación bloqueada`);
            break;
          case 'integration':
            detalles.push(`Integración ejecutada: ${accion.value}`);
            break;
          default:
            detalles.push(`Acción no soportada en backend: ${accion.type}`);
            resultado = 'parcial';
            break;
        }
      } catch (error) {
        detalles.push(`Error en acción ${accion.type}: ${String(error)}`);
        resultado = 'fallida';
        break;
      }
    }

    return this.buildLog(regla, resultado, detalles.join(' | '), detalles, solicitud);
  }

  private async enviarNotificacion(solicitud: NonNullable<Awaited<ReturnType<SolicitudContactoRepository['obtenerPorId']>>>, regla: AutomationRule, mensaje: string): Promise<void> {
    const texto = regla.abTest?.enabled ? this.pickAB(regla) : mensaje;
    const destino = solicitud.whatsapp || solicitud.telefono;
    if (solicitud.preferenciaContacto === 'Email') {
      return;
    }
    if (solicitud.origen === 'Facebook') {
      await this.facebook.enviarMensaje(solicitud.telefono, texto);
      return;
    }
    if (solicitud.origen === 'Instagram') {
      await this.instagram.enviarMensaje(solicitud.telefono, texto);
      return;
    }
    await this.whatsapp.enviarMensaje({
      to: destino,
      body: texto,
    });
  }

  private pickAB(regla: AutomationRule): string {
    if (!regla.abTest?.enabled) return regla.abTest?.variantA || '';
    const ratio = Math.max(0, Math.min(100, regla.abTest.ratio));
    const pick = Math.random() * 100 < ratio ? 'A' : 'B';
    return pick === 'A' ? regla.abTest.variantA : regla.abTest.variantB;
  }

  private buildLog(
    regla: AutomationRule,
    resultado: 'exitosa' | 'fallida' | 'parcial',
    mensaje: string,
    detalles: string[],
    solicitud?: NonNullable<Awaited<ReturnType<SolicitudContactoRepository['obtenerPorId']>>>
  ): AutomationLog {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ruleId: regla.id,
      ruleName: regla.nombre,
      targetId: solicitud?.id || 'desconocido',
      targetNombre: solicitud?.nombreCompleto || 'N/A',
      accion: regla.acciones.map((a) => a.description || a.type).join(', '),
      resultado,
      mensaje,
      fecha: new Date(),
      detalles: {
        condiciones: regla.condiciones,
        acciones: regla.acciones,
        notas: detalles,
      },
    };
  }

  private diasSinRespuesta(solicitud: NonNullable<Awaited<ReturnType<SolicitudContactoRepository['obtenerPorId']>>>): number {
    const base = solicitud.ultimoIntento || solicitud.fechaCreacion;
    const diffMs = Date.now() - base.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  private horasDesde(fecha: Date): number {
    const diffMs = Date.now() - fecha.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  }

  private compare(op: string, value: string, target: string): boolean {
    switch (op) {
      case '=':
        return value === target;
      case '!=':
        return value !== target;
      case 'contains':
        return value.includes(target);
      case 'not-contains':
        return !value.includes(target);
      default:
        return false;
    }
  }

  private compareNumber(op: string, value: number, target: number): boolean {
    switch (op) {
      case '>':
        return value > target;
      case '<':
        return value < target;
      case '>=':
        return value >= target;
      case '<=':
        return value <= target;
      case '=':
        return value === target;
      default:
        return false;
    }
  }

  private estaEnHorario(horario?: AutomationRule['horario']): boolean {
    if (!horario) return true;
    const dias = horario.dias || [];
    const ahora = new Date();
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const diaActual = nombresDias[ahora.getDay()];
    if (dias.length > 0 && !dias.includes(diaActual)) return false;
    const [inicioH, inicioM] = horario.inicio.split(':').map((v) => parseInt(v, 10));
    const [finH, finM] = horario.fin.split(':').map((v) => parseInt(v, 10));
    const inicioMin = inicioH * 60 + inicioM;
    const finMin = finH * 60 + finM;
    const actualMin = ahora.getHours() * 60 + ahora.getMinutes();
    return actualMin >= inicioMin && actualMin <= finMin;
  }

  private estaEnPausa(pausa?: AutomationRule['pausa']): boolean {
    if (!pausa) return false;
    const desde = new Date(pausa.desde);
    const hasta = new Date(pausa.hasta);
    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return false;
    const ahora = new Date();
    return ahora >= desde && ahora <= hasta;
  }

  private appendNota(actual: string | undefined, texto: string): string {
    const linea = `[${new Date().toISOString()}] ${texto}`;
    return actual ? `${actual}\n${linea}` : linea;
  }
}
