/**
 * Caso de Uso: Asignar Motivo de Inasistencia
 * Asigna un motivo a una inasistencia y ejecuta las acciones correspondientes
 */

import { InasistenciaEntity, MotivoInasistencia } from '../entities/Inasistencia';
import { InasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';

export interface AsignarMotivoRequest {
  inasistenciaId: string;
  motivo: MotivoInasistencia;
  motivoDetalle?: string;
  asignadoPor: string;
}

export interface AsignarMotivoResponse {
  success: boolean;
  inasistencia?: InasistenciaEntity;
  acciones: string[];
  error?: string;
}

export class AsignarMotivoInasistencia {
  constructor(
    private inasistenciaRepo: InasistenciaRepository
  ) {}

  async execute(request: AsignarMotivoRequest): Promise<AsignarMotivoResponse> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(request.inasistenciaId);
      
      if (!inasistencia) {
        return {
          success: false,
          acciones: [],
          error: 'Inasistencia no encontrada'
        };
      }

      const entity = new InasistenciaEntity(inasistencia);
      const acciones: string[] = [];

      // Asignar motivo
      entity.asignarMotivo(request.motivo, request.motivoDetalle);
      acciones.push(`Motivo asignado: ${request.motivo}`);

      // Verificar acciones automáticas
      if (entity.enListaRemarketing) {
        acciones.push(`✅ Agregado a lista de remarketing con campaña: ${entity.campaignRemarketing}`);
      }

      if (entity.bloqueadoMarketing) {
        acciones.push(`🚫 BLOQUEADO de marketing - No contactar`);
      }

      if (entity.proximoIntentoContacto) {
        const dias = Math.floor((entity.proximoIntentoContacto.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        acciones.push(`📅 Próximo intento programado en ${dias} días`);
      }

      // Guardar cambios
      const actualizada = await this.inasistenciaRepo.actualizar(request.inasistenciaId, entity);

      return {
        success: true,
        inasistencia: new InasistenciaEntity(actualizada),
        acciones
      };
    } catch (error) {
      return {
        success: false,
        acciones: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
