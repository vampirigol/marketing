/**
 * Caso de Uso: Reagendar desde Inasistencia
 * Permite reagendar una cita a partir de una inasistencia registrada
 */

import { InasistenciaEntity } from '../entities/Inasistencia';
import { InasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';

export interface ReagendarDesdeInasistenciaRequest {
  inasistenciaId: string;
  nuevaCitaId: string;
  fechaNuevaCita: Date;
  horaNuevaCita: string;
  notasReagendacion?: string;
  realizadoPor: string;
}

export interface ReagendarDesdeInasistenciaResponse {
  success: boolean;
  inasistencia?: InasistenciaEntity;
  mensaje?: string;
  error?: string;
}

export class ReagendarDesdeInasistencia {
  constructor(
    private inasistenciaRepo: InasistenciaRepository
  ) {}

  async execute(request: ReagendarDesdeInasistenciaRequest): Promise<ReagendarDesdeInasistenciaResponse> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(request.inasistenciaId);
      
      if (!inasistencia) {
        return {
          success: false,
          error: 'Inasistencia no encontrada'
        };
      }

      // Verificar si está bloqueado
      if (inasistencia.bloqueadoMarketing) {
        return {
          success: false,
          error: 'Paciente bloqueado - Consultar con supervisor antes de reagendar'
        };
      }

      // Verificar si ya fue reagendado
      if (inasistencia.nuevaCitaId) {
        return {
          success: false,
          error: `Ya existe una cita reagendada: ${inasistencia.nuevaCitaId}`
        };
      }

      const entity = new InasistenciaEntity(inasistencia);

      // Registrar la reagendación
      entity.registrarReagendacion(request.nuevaCitaId);

      // Agregar nota adicional si se proporcionó
      if (request.notasReagendacion) {
        entity.notasContacto.push(
          `[${new Date().toISOString()}] [${request.realizadoPor}] Reagendado: ${request.notasReagendacion}`
        );
      }

      // Agregar detalles de la nueva cita
      entity.notasContacto.push(
        `[${new Date().toISOString()}] Nueva cita: ${request.fechaNuevaCita.toLocaleDateString()} a las ${request.horaNuevaCita}`
      );

      // Guardar cambios
      const actualizada = await this.inasistenciaRepo.actualizar(request.inasistenciaId, entity);
      const result = new InasistenciaEntity(actualizada);

      return {
        success: true,
        inasistencia: result,
        mensaje: `✅ Paciente recuperado exitosamente. Nueva cita: ${request.nuevaCitaId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene inasistencias que pueden ser reagendadas
   */
  async obtenerReagendables(sucursalId?: string): Promise<InasistenciaEntity[]> {
    const pendientes = await this.inasistenciaRepo.obtenerPendientesSeguimiento(sucursalId);
    const enSeguimiento = await this.inasistenciaRepo.obtenerPorEstado('En_Seguimiento', sucursalId);
    
    const todas = [...pendientes, ...enSeguimiento];
    
    return todas
      .filter(i => !i.bloqueadoMarketing && !i.marcadoComoPerdido && !i.nuevaCitaId)
      .map(i => new InasistenciaEntity(i))
      .sort((a, b) => {
        // Priorizar por fecha límite y prioridad del motivo
        const estadoA = a.obtenerEstadoSeguimiento();
        const estadoB = b.obtenerEstadoSeguimiento();
        return estadoA.diasRestantesLimite - estadoB.diasRestantesLimite;
      });
  }

  /**
   * Obtiene historial de inasistencias del paciente
   */
  async obtenerHistorialPaciente(pacienteId: string): Promise<{
    totalInasistencias: number;
    inasistencias: InasistenciaEntity[];
    tasaRecuperacion: number;
    bloqueado: boolean;
  }> {
    const inasistencias = await this.inasistenciaRepo.obtenerPorPaciente(pacienteId);
    const entities = inasistencias.map(i => new InasistenciaEntity(i));
    
    const total = entities.length;
    const recuperados = entities.filter(i => i.estadoSeguimiento === 'Reagendada').length;
    const tasaRecuperacion = total > 0 ? (recuperados / total) * 100 : 0;
    const bloqueado = entities.some(i => i.bloqueadoMarketing);

    return {
      totalInasistencias: total,
      inasistencias: entities,
      tasaRecuperacion,
      bloqueado
    };
  }
}
