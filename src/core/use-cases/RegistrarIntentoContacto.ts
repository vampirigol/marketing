/**
 * Caso de Uso: Registrar Intento de Contacto
 * Registra un intento de contactar al paciente inasistente
 */

import { InasistenciaEntity } from '../entities/Inasistencia';
import { InasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';

export interface RegistrarIntentoRequest {
  inasistenciaId: string;
  nota: string;
  exitoso: boolean;
  respuestaPaciente?: string;
  realizadoPor: string;
}

export interface RegistrarIntentoResponse {
  success: boolean;
  inasistencia?: InasistenciaEntity;
  totalIntentos?: number;
  proximoIntento?: Date;
  error?: string;
}

export class RegistrarIntentoContacto {
  constructor(
    private inasistenciaRepo: InasistenciaRepository
  ) {}

  async execute(request: RegistrarIntentoRequest): Promise<RegistrarIntentoResponse> {
    try {
      const inasistencia = await this.inasistenciaRepo.obtenerPorId(request.inasistenciaId);
      
      if (!inasistencia) {
        return {
          success: false,
          error: 'Inasistencia no encontrada'
        };
      }

      if (inasistencia.bloqueadoMarketing) {
        return {
          success: false,
          error: 'Paciente bloqueado - No se permiten más intentos de contacto'
        };
      }

      if (inasistencia.marcadoComoPerdido) {
        return {
          success: false,
          error: 'Paciente marcado como perdido - No se permiten más intentos'
        };
      }

      const entity = new InasistenciaEntity(inasistencia);

      // Registrar intento
      const notaCompleta = request.exitoso 
        ? `[${request.realizadoPor}] ✅ CONTACTO EXITOSO - ${request.nota}${request.respuestaPaciente ? ` | Respuesta: ${request.respuestaPaciente}` : ''}`
        : `[${request.realizadoPor}] ❌ Sin respuesta - ${request.nota}`;

      entity.registrarIntentoContacto(notaCompleta);

      // Si no hay respuesta después de varios intentos, considerar "No_Responde"
      if (!request.exitoso && entity.intentosContacto >= 3 && !entity.motivo) {
        entity.asignarMotivo('No_Responde', 'Múltiples intentos sin respuesta');
      }

      // Guardar cambios
      const actualizada = await this.inasistenciaRepo.actualizar(request.inasistenciaId, entity);
      const result = new InasistenciaEntity(actualizada);

      return {
        success: true,
        inasistencia: result,
        totalIntentos: result.intentosContacto,
        proximoIntento: result.proximoIntentoContacto
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
