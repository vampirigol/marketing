/**
 * Caso de Uso: Crear Open Ticket
 * Genera un ticket abierto para citas subsecuentes sin horario específico
 */

import { OpenTicketEntity, CrearOpenTicketDTO } from '../entities/OpenTicket';
import { v4 as uuidv4 } from 'uuid';

export interface CrearOpenTicketResultado {
  success: boolean;
  ticket?: OpenTicketEntity;
  mensaje: string;
}

export class CrearOpenTicketUseCase {
  
  async ejecutar(dto: CrearOpenTicketDTO): Promise<CrearOpenTicketResultado> {
    try {
      // Validaciones
      const validacion = this.validarDatos(dto);
      if (!validacion.valido) {
        return {
          success: false,
          mensaje: validacion.mensaje!,
        };
      }

      // Generar código único
      const codigo = this.generarCodigoUnico(dto.sucursalId);

      // Calcular fechas de vigencia
      const fechaEmision = new Date();
      const fechaValidoDesde = dto.fechaValidoDesde || new Date();
      const diasValidez = dto.diasValidez || 30; // Por defecto 30 días
      const fechaValidoHasta = new Date(fechaValidoDesde);
      fechaValidoHasta.setDate(fechaValidoHasta.getDate() + diasValidez);

      // Crear el ticket
      const ticket = new OpenTicketEntity({
        id: uuidv4(),
        codigo,
        pacienteId: dto.pacienteId,
        sucursalId: dto.sucursalId,
        tipoConsulta: 'Subsecuente',
        especialidad: dto.especialidad,
        medicoPreferido: dto.medicoPreferido,
        fechaEmision,
        fechaValidoDesde,
        fechaValidoHasta,
        diasValidez,
        estado: 'Activo',
        citaOrigenId: dto.citaOrigenId,
        motivoConsultaAnterior: dto.motivoConsultaAnterior,
        diagnosticoAnterior: dto.diagnosticoAnterior,
        tratamientoIndicado: dto.tratamientoIndicado,
        costoEstimado: dto.costoEstimado,
        requierePago: dto.requierePago !== false, // Por defecto requiere pago
        encuestaCompletada: false,
        creadoPor: dto.creadoPor,
        fechaCreacion: new Date(),
        ultimaActualizacion: new Date(),
        notas: dto.notas,
      });

      return {
        success: true,
        ticket,
        mensaje: `Ticket creado exitosamente. Código: ${codigo}. Válido hasta: ${fechaValidoHasta.toLocaleDateString()}`,
      };

    } catch (error) {
      return {
        success: false,
        mensaje: `Error al crear ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  private validarDatos(dto: CrearOpenTicketDTO): { valido: boolean; mensaje?: string } {
    if (!dto.pacienteId) {
      return { valido: false, mensaje: 'El ID del paciente es requerido' };
    }

    if (!dto.sucursalId) {
      return { valido: false, mensaje: 'El ID de la sucursal es requerido' };
    }

    if (!dto.citaOrigenId) {
      return { valido: false, mensaje: 'Se requiere la cita de origen' };
    }

    if (!dto.especialidad) {
      return { valido: false, mensaje: 'La especialidad es requerida' };
    }

    if (dto.costoEstimado < 0) {
      return { valido: false, mensaje: 'El costo no puede ser negativo' };
    }

    if (dto.diasValidez && (dto.diasValidez < 1 || dto.diasValidez > 90)) {
      return { valido: false, mensaje: 'Los días de validez deben estar entre 1 y 90' };
    }

    return { valido: true };
  }

  private generarCodigoUnico(sucursalId: string): string {
    // En producción, deberías obtener el último número de la BD
    const numeroSecuencial = Math.floor(Math.random() * 9999) + 1;
    return OpenTicketEntity.generarCodigo(sucursalId, numeroSecuencial);
  }
}
