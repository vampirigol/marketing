/**
 * Caso de Uso: Convertir Ticket a Cita
 * Convierte un Open Ticket en una cita normal cuando el paciente llega
 */

import { OpenTicketEntity, ConvertirTicketACitaDTO } from '../entities/OpenTicket';
import { CitaEntity } from '../entities/Cita';
import { v4 as uuidv4 } from 'uuid';

export interface ConvertirTicketResultado {
  success: boolean;
  cita?: CitaEntity;
  ticket?: OpenTicketEntity;
  mensaje: string;
}

export class ConvertirTicketACitaUseCase {
  
  async ejecutar(
    ticket: OpenTicketEntity,
    dto: ConvertirTicketACitaDTO
  ): Promise<ConvertirTicketResultado> {
    try {
      // Validar que el ticket puede ser utilizado
      const validacion = ticket.puedeSerUtilizado();
      if (!validacion.valido) {
        return {
          success: false,
          mensaje: `No se puede utilizar el ticket: ${validacion.razon}`,
        };
      }

      // Determinar médico (preferido o asignado)
      const medicoFinal = dto.medicoAsignado || ticket.medicoPreferido;

      // Crear la cita
      const ahora = new Date();
      const cita = new CitaEntity({
        id: uuidv4(),
        pacienteId: ticket.pacienteId,
        sucursalId: ticket.sucursalId,
        fechaCita: ahora,
        horaCita: `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
        duracionMinutos: 30, // Duración estándar
        tipoConsulta: 'Subsecuente',
        especialidad: ticket.especialidad,
        medicoAsignado: medicoFinal,
        estado: 'En_Consulta', // Directamente a consulta
        esPromocion: false,
        reagendaciones: 0,
        horaLlegada: dto.horaLlegada,
        horaAtencion: ahora, // Atención inmediata
        costoConsulta: ticket.costoEstimado,
        montoAbonado: 0,
        saldoPendiente: ticket.requierePago ? ticket.costoEstimado : 0,
        creadoPor: dto.recepcionistaId,
        fechaCreacion: ahora,
        ultimaActualizacion: ahora,
        notas: this.generarNotasCita(ticket, dto),
      });

      // Marcar el ticket como utilizado
      ticket.marcarComoUtilizado(cita.id);

      return {
        success: true,
        cita,
        ticket,
        mensaje: `Cita creada exitosamente desde ticket ${ticket.codigo}. Paciente en consulta.`,
      };

    } catch (error) {
      return {
        success: false,
        mensaje: `Error al convertir ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  private generarNotasCita(ticket: OpenTicketEntity, dto: ConvertirTicketACitaDTO): string {
    let notas = `Generada desde Open Ticket: ${ticket.codigo}\n`;
    
    if (ticket.motivoConsultaAnterior) {
      notas += `Consulta anterior: ${ticket.motivoConsultaAnterior}\n`;
    }
    
    if (ticket.diagnosticoAnterior) {
      notas += `Diagnóstico anterior: ${ticket.diagnosticoAnterior}\n`;
    }
    
    if (ticket.tratamientoIndicado) {
      notas += `Tratamiento indicado: ${ticket.tratamientoIndicado}\n`;
    }
    
    if (dto.notas) {
      notas += `\nNotas adicionales: ${dto.notas}`;
    }
    
    return notas;
  }
}
