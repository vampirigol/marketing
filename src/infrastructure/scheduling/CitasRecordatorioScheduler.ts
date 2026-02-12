/**
 * Scheduler de recordatorios de citas - PERSISTENTE
 * Lee desde la tabla recordatorios_citas y envía vía NotificationService (WhatsApp)
 * Usa datos reales de citas y pacientes desde la BD
 */

import { RecordatoriosCitasRepository } from '../database/repositories/RecordatoriosCitasRepository';
import { CitaRepositoryPostgres } from '../database/repositories/CitaRepository';
import { PacienteRepositoryPostgres } from '../database/repositories/PacienteRepository';
import { SucursalRepositoryPostgres } from '../database/repositories/SucursalRepository';
import { SlotsReservadosRepository } from '../database/repositories/SlotsReservadosRepository';
import { NotificationService } from '../notifications/NotificationService';

export class CitasRecordatorioScheduler {
  private recordatoriosRepo: RecordatoriosCitasRepository;
  private citaRepo: CitaRepositoryPostgres;
  private pacienteRepo: PacienteRepositoryPostgres;
  private sucursalRepo: SucursalRepositoryPostgres;
  private slotsRepo: SlotsReservadosRepository;
  private notificationService: NotificationService;
  private intervalId?: NodeJS.Timeout;
  private runCount = 0;

  constructor() {
    this.recordatoriosRepo = new RecordatoriosCitasRepository();
    this.citaRepo = new CitaRepositoryPostgres();
    this.pacienteRepo = new PacienteRepositoryPostgres();
    this.sucursalRepo = new SucursalRepositoryPostgres();
    this.slotsRepo = new SlotsReservadosRepository();
    this.notificationService = new NotificationService();
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.ejecutar(), 60 * 1000); // Cada minuto
    console.log('✅ CitasRecordatorioScheduler iniciado (cada minuto)');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('⏹️  CitasRecordatorioScheduler detenido');
  }

  private async ejecutar(): Promise<void> {
    try {
      const ahora = new Date();
      const pendientes = await this.recordatoriosRepo.obtenerPendientes(ahora);

      for (const rec of pendientes) {
        try {
          const cita = await this.citaRepo.obtenerPorId(rec.citaId);
          if (!cita) {
            await this.recordatoriosRepo.marcarEjecutado(rec.id, { error: 'Cita no encontrada' });
            continue;
          }
          if (cita.estado === 'Cancelada' || cita.estado === 'Atendida' || cita.estado === 'No_Asistio') {
            await this.recordatoriosRepo.marcarEjecutado(rec.id, { error: 'Cita ya no vigente' });
            continue;
          }

          const paciente = await this.pacienteRepo.obtenerPorId(cita.pacienteId);
          if (!paciente || (!paciente.telefono && !paciente.whatsapp)) {
            await this.recordatoriosRepo.marcarEjecutado(rec.id, { error: 'Paciente sin teléfono' });
            continue;
          }

          const sucursal = await this.sucursalRepo.obtenerPorId(cita.sucursalId);
          const sucursalNombre = sucursal?.nombre ?? 'Sucursal RCA';
          const sucursalDireccion = sucursal?.direccion ?? '';

          const notif = {
            cita,
            paciente,
            tipoNotificacion: rec.tipo as any,
            datosAdicionales: {
              sucursalNombre,
              sucursalDireccion,
              doctorNombre: cita.medicoAsignado,
            },
          };

          let resultado;
          if (rec.tipo === 'recordatorio_24h' || rec.tipo === 'recordatorio_dia' || rec.tipo === 'recordatorio_2h') {
            if (rec.tipo === 'recordatorio_24h') {
              resultado = await this.notificationService.enviarRecordatorio24h(notif);
            } else {
              resultado = await this.notificationService.enviarRecordatorioDiaCita(notif);
            }
          } else {
            resultado = await this.notificationService.enviarConfirmacionCita(notif);
          }

          await this.recordatoriosRepo.marcarEjecutado(rec.id, {
            mensajeId: resultado.messageId,
            error: resultado.error,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('❌ Error ejecutando recordatorio', rec.id, msg);
          await this.recordatoriosRepo.marcarEjecutado(rec.id, { error: msg });
        }
      }
      // Limpiar slots reservados expirados cada 10 ejecuciones (~10 min)
      this.runCount++;
      if (this.runCount % 10 === 0) {
        try {
          const deleted = await this.slotsRepo.limpiarExpirados();
          if (deleted > 0) {
            console.log(`🧹 Slots expirados limpiados: ${deleted}`);
          }
        } catch (_) {
          /* ignorar */
        }
      }
    } catch (err) {
      console.error('❌ Error en CitasRecordatorioScheduler:', err);
    }
  }
}
