import { CitaEntity } from '../entities/Cita';

/**
 * Caso de Uso: Marcar Llegada del Paciente
 * 
 * REGLA DE NEGOCIO (Documentación Gemini - Punto 2):
 * - Paciente llega: Se marca como "Llegó"
 * - Pasados 15 minutos sin llegar: Automáticamente pasa a "Lista de Espera"
 * - Lista de espera se cierra al final del día → "Inasistencia"
 * 
 * Usado por recepción para registrar cuando un paciente llega a la clínica
 */

export interface MarcarLlegadaDTO {
  citaId: string;
  usuarioId: string;
  sucursalId: string;
  horaLlegada?: Date; // Opcional, por defecto usa la hora actual
}

export interface MarcarLlegadaResultado {
  cita: CitaEntity;
  estado: 'LLEGADA_NORMAL' | 'LLEGADA_TARDIA' | 'LISTA_ESPERA';
  mensaje: string;
  minutosRetraso: number;
}

export class MarcarLlegadaUseCase {
  // Constante: Tolerancia de 15 minutos
  private readonly MINUTOS_TOLERANCIA = 15;

  /**
   * Ejecuta el proceso de marcar llegada con validación de tiempo
   */
  async ejecutar(dto: MarcarLlegadaDTO): Promise<MarcarLlegadaResultado> {
    // TODO: Obtener la cita de la base de datos
    // const cita = await this.citaRepository.obtenerPorId(dto.citaId);
    
    const cita = this.obtenerCitaSimulada(dto.citaId);

    // Validar que la cita existe
    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    // Validar que la cita sea de la sucursal correcta
    if (cita.sucursalId !== dto.sucursalId) {
      throw new Error('Esta cita no corresponde a esta sucursal');
    }

    // Validar que la cita no esté cancelada o finalizada
    if (cita.estado === 'Cancelada' || cita.estado === 'Atendida') {
      throw new Error(`No se puede marcar llegada de una cita con estado: ${cita.estado}`);
    }

    // Validar que la cita sea del día actual
    const hoy = new Date();
    const fechaCita = new Date(cita.fechaCita);
    
    if (fechaCita.toDateString() !== hoy.toDateString()) {
      throw new Error('Solo se pueden marcar llegadas de citas del día actual');
    }

    // Calcular si llega tarde
    const horaLlegadaReal = dto.horaLlegada || new Date();
    const { minutosRetraso, estaDentroTolerancia } = this.calcularRetraso(
      cita.fechaCita,
      cita.horaCita,
      horaLlegadaReal
    );

    // Marcar llegada
    try {
      cita.marcarLlegada();
      cita.horaLlegada = horaLlegadaReal;

      let estado: 'LLEGADA_NORMAL' | 'LLEGADA_TARDIA' | 'LISTA_ESPERA';
      let mensaje: string;

      if (minutosRetraso <= 0) {
        // Llegó puntual o antes
        estado = 'LLEGADA_NORMAL';
        mensaje = `✅ Llegada registrada. Paciente puntual.`;
      } else if (estaDentroTolerancia) {
        // Llegó tarde pero dentro de los 15 minutos
        estado = 'LLEGADA_TARDIA';
        mensaje = `⚠️ Llegada registrada con ${minutosRetraso} minutos de retraso (dentro de tolerancia).`;
      } else {
        // Llegó después de 15 minutos
        estado = 'LISTA_ESPERA';
        cita.estado = 'Cancelada'; // Marcar como no asistió
        mensaje = `❌ Paciente llegó ${minutosRetraso} minutos tarde. Pasó a Lista de Espera.`;
      }
      
      // TODO: Guardar en base de datos
      // await this.citaRepository.actualizar(cita);
      
      // TODO: Notificar al médico si está dentro de tolerancia
      // if (estaDentroTolerancia) {
      //   await this.notificacionService.notificarMedicoPacienteLlego(cita);
      // }
      
      // TODO: Si pasa a lista de espera, iniciar proceso de remarketing
      // if (estado === 'LISTA_ESPERA') {
      //   await this.remarketingService.agregarAListaEspera(cita);
      // }

      return {
        cita,
        estado,
        mensaje,
        minutosRetraso
      };
    } catch (error) {
      throw new Error(`Error al marcar llegada: ${(error as Error).message}`);
    }
  }

  /**
   * Calcula el retraso en minutos basado en la hora de la cita
   */
  private calcularRetraso(
    fechaCita: Date,
    horaCita: string,
    horaLlegada: Date
  ): { minutosRetraso: number; estaDentroTolerancia: boolean } {
    // Combinar fecha de cita con hora de cita
    const [horas, minutos] = horaCita.split(':').map(Number);
    const horaEsperada = new Date(fechaCita);
    horaEsperada.setHours(horas, minutos, 0, 0);

    // Calcular diferencia en minutos
    const diferenciaMs = horaLlegada.getTime() - horaEsperada.getTime();
    const minutosRetraso = Math.floor(diferenciaMs / (1000 * 60));

    // Verificar si está dentro de tolerancia (15 minutos)
    const estaDentroTolerancia = minutosRetraso <= this.MINUTOS_TOLERANCIA;

    return { minutosRetraso, estaDentroTolerancia };
  }

  /**
   * Verifica si una cita debe pasar automáticamente a lista de espera
   * Este método se ejecutaría cada minuto en un cron job
   */
  async verificarYMoverAListaEspera(citaId: string): Promise<boolean> {
    // TODO: Implementar con cron job
    const cita = this.obtenerCitaSimulada(citaId);
    
    if (cita.estado !== 'Agendada' && cita.estado !== 'Confirmada') {
      return false;
    }

    const ahora = new Date();
    const { minutosRetraso, estaDentroTolerancia } = this.calcularRetraso(
      cita.fechaCita,
      cita.horaCita,
      ahora
    );

    // Si pasaron más de 15 minutos y no llegó, mover a lista de espera
    if (minutosRetraso > this.MINUTOS_TOLERANCIA && !estaDentroTolerancia) {
      cita.estado = 'No_Asistio';
      
      // TODO: Guardar en BD y notificar
      // await this.citaRepository.actualizar(cita);
      // await this.remarketingService.agregarAListaEspera(cita);
      
      return true;
    }

    return false;
  }

  private obtenerCitaSimulada(citaId: string): CitaEntity {
    return new CitaEntity({
      id: citaId,
      pacienteId: 'pac-001',
      sucursalId: 'suc-001',
      fechaCita: new Date(),
      horaCita: '10:00',
      duracionMinutos: 30,
      tipoConsulta: 'Primera_Vez',
      especialidad: 'Medicina General',
      estado: 'Agendada',
      esPromocion: false,
      reagendaciones: 0,
      costoConsulta: 350,
      montoAbonado: 0,
      saldoPendiente: 350,
      creadoPor: 'keila',
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date(),
    });
  }
}
