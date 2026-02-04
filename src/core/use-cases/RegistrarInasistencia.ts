/**
 * Caso de Uso: Registrar Inasistencia
 * Registra cuando un paciente no asiste a su cita
 */

import { v4 as uuidv4 } from 'uuid';
import { Inasistencia, InasistenciaEntity } from '../entities/Inasistencia';
import { InasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';

export interface RegistrarInasistenciaRequest {
  citaId: string;
  pacienteId: string;
  sucursalId: string;
  fechaCitaPerdida: Date;
  horaCitaPerdida: string;
  creadoPor: string;
}

export interface RegistrarInasistenciaResponse {
  success: boolean;
  inasistencia?: Inasistencia;
  error?: string;
}

export class RegistrarInasistencia {
  constructor(
    private inasistenciaRepo: InasistenciaRepository
  ) {}

  async execute(request: RegistrarInasistenciaRequest): Promise<RegistrarInasistenciaResponse> {
    try {
      // Verificar si ya existe una inasistencia para esta cita
      const existente = await this.inasistenciaRepo.obtenerPorCita(request.citaId);
      if (existente) {
        return {
          success: false,
          error: 'Ya existe un registro de inasistencia para esta cita'
        };
      }

      // Calcular fecha límite (7 días)
      const fechaLimite = new Date(request.fechaCitaPerdida);
      fechaLimite.setDate(fechaLimite.getDate() + 7);

      // Crear nueva inasistencia
      const inasistencia: Inasistencia = {
        id: uuidv4(),
        citaId: request.citaId,
        pacienteId: request.pacienteId,
        sucursalId: request.sucursalId,
        fechaCitaPerdida: request.fechaCitaPerdida,
        horaCitaPerdida: request.horaCitaPerdida,
        estadoSeguimiento: 'Pendiente_Contacto',
        intentosContacto: 0,
        notasContacto: [],
        enListaRemarketing: false,
        fechaLimiteRespuesta: fechaLimite,
        marcadoComoPerdido: false,
        bloqueadoMarketing: false,
        creadoPor: request.creadoPor,
        fechaCreacion: new Date(),
        ultimaActualizacion: new Date()
      };

      const entity = new InasistenciaEntity(inasistencia);
      const created = await this.inasistenciaRepo.crear(entity);

      return {
        success: true,
        inasistencia: created
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
