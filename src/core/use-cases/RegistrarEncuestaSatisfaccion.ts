/**
 * Caso de Uso: Registrar Encuesta de Satisfacción
 * Permite registrar la encuesta de satisfacción post-consulta
 */

import { OpenTicketEntity } from '../entities/OpenTicket';

export interface EncuestaSatisfaccionDTO {
  ticketId: string;
  calificacionAtencion: number;       // 1-5 estrellas
  calificacionMedico?: number;        // 1-5 estrellas
  calificacionInstalaciones?: number; // 1-5 estrellas
  calificacionTiempoEspera?: number;  // 1-5 estrellas
  recomendaria: boolean;              // ¿Recomendaría la clínica?
  comentarios?: string;
  aspectosPositivos?: string[];
  aspectosMejorar?: string[];
  fechaEncuesta?: Date;
}

export interface RegistrarEncuestaResultado {
  success: boolean;
  ticket?: OpenTicketEntity;
  promedioCalificacion?: number;
  mensaje: string;
}

export class RegistrarEncuestaSatisfaccionUseCase {
  
  async ejecutar(
    ticket: OpenTicketEntity,
    encuesta: EncuestaSatisfaccionDTO
  ): Promise<RegistrarEncuestaResultado> {
    try {
      // Validaciones
      const validacion = this.validarEncuesta(encuesta, ticket);
      if (!validacion.valido) {
        return {
          success: false,
          mensaje: validacion.mensaje!,
        };
      }

      // Calcular promedio de calificaciones
      const calificaciones = [
        encuesta.calificacionAtencion,
        encuesta.calificacionMedico,
        encuesta.calificacionInstalaciones,
        encuesta.calificacionTiempoEspera,
      ].filter(c => c !== undefined) as number[];

      const promedioCalificacion = 
        calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length;

      // Preparar comentarios completos
      const comentariosCompletos = this.formatearComentarios(encuesta);

      // Registrar encuesta en el ticket
      ticket.registrarEncuesta(
        Math.round(promedioCalificacion), // Redondear para la calificación principal
        comentariosCompletos
      );

      // Determinar mensaje según calificación
      const mensajeCalificacion = this.obtenerMensajeCalificacion(promedioCalificacion);

      return {
        success: true,
        ticket,
        promedioCalificacion,
        mensaje: `Encuesta registrada exitosamente. ${mensajeCalificacion}`,
      };

    } catch (error) {
      return {
        success: false,
        mensaje: `Error al registrar encuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  private validarEncuesta(
    encuesta: EncuestaSatisfaccionDTO,
    ticket: OpenTicketEntity
  ): { valido: boolean; mensaje?: string } {
    
    if (ticket.estado !== 'Utilizado') {
      return { 
        valido: false, 
        mensaje: 'Solo se puede registrar encuesta en tickets utilizados' 
      };
    }

    if (ticket.encuestaCompletada) {
      return { 
        valido: false, 
        mensaje: 'Ya existe una encuesta registrada para este ticket' 
      };
    }

    if (encuesta.calificacionAtencion < 1 || encuesta.calificacionAtencion > 5) {
      return { 
        valido: false, 
        mensaje: 'La calificación de atención debe estar entre 1 y 5' 
      };
    }

    // Validar otras calificaciones opcionales
    const calificacionesOpcionales = [
      encuesta.calificacionMedico,
      encuesta.calificacionInstalaciones,
      encuesta.calificacionTiempoEspera,
    ];

    for (const cal of calificacionesOpcionales) {
      if (cal !== undefined && (cal < 1 || cal > 5)) {
        return { 
          valido: false, 
          mensaje: 'Todas las calificaciones deben estar entre 1 y 5' 
        };
      }
    }

    return { valido: true };
  }

  private formatearComentarios(encuesta: EncuestaSatisfaccionDTO): string {
    let comentarios = `=== ENCUESTA DE SATISFACCIÓN ===\n`;
    comentarios += `Fecha: ${encuesta.fechaEncuesta?.toLocaleDateString() || new Date().toLocaleDateString()}\n\n`;
    
    comentarios += `📊 CALIFICACIONES:\n`;
    comentarios += `• Atención general: ${this.mostrarEstrellas(encuesta.calificacionAtencion)}\n`;
    
    if (encuesta.calificacionMedico) {
      comentarios += `• Atención médica: ${this.mostrarEstrellas(encuesta.calificacionMedico)}\n`;
    }
    
    if (encuesta.calificacionInstalaciones) {
      comentarios += `• Instalaciones: ${this.mostrarEstrellas(encuesta.calificacionInstalaciones)}\n`;
    }
    
    if (encuesta.calificacionTiempoEspera) {
      comentarios += `• Tiempo de espera: ${this.mostrarEstrellas(encuesta.calificacionTiempoEspera)}\n`;
    }
    
    comentarios += `\n¿Recomendaría la clínica?: ${encuesta.recomendaria ? 'SÍ ✅' : 'NO ❌'}\n`;

    if (encuesta.aspectosPositivos && encuesta.aspectosPositivos.length > 0) {
      comentarios += `\n✅ ASPECTOS POSITIVOS:\n`;
      encuesta.aspectosPositivos.forEach(aspecto => {
        comentarios += `• ${aspecto}\n`;
      });
    }

    if (encuesta.aspectosMejorar && encuesta.aspectosMejorar.length > 0) {
      comentarios += `\n⚠️ ASPECTOS A MEJORAR:\n`;
      encuesta.aspectosMejorar.forEach(aspecto => {
        comentarios += `• ${aspecto}\n`;
      });
    }

    if (encuesta.comentarios) {
      comentarios += `\n💬 COMENTARIOS ADICIONALES:\n${encuesta.comentarios}\n`;
    }

    return comentarios;
  }

  private mostrarEstrellas(calificacion: number): string {
    const estrellasLlenas = '⭐'.repeat(calificacion);
    const estrellasVacias = '☆'.repeat(5 - calificacion);
    return `${estrellasLlenas}${estrellasVacias} (${calificacion}/5)`;
  }

  private obtenerMensajeCalificacion(promedio: number): string {
    if (promedio >= 4.5) {
      return '¡Excelente! El paciente está muy satisfecho. 🌟';
    } else if (promedio >= 4) {
      return 'Buena calificación. Paciente satisfecho. 👍';
    } else if (promedio >= 3) {
      return 'Calificación regular. Revisar áreas de mejora. ⚠️';
    } else {
      return 'Calificación baja. Requiere seguimiento urgente. ⚠️🔴';
    }
  }
}
