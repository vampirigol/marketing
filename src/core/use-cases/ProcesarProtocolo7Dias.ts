/**
 * Caso de Uso: Procesar Protocolo 7 Días
 * Verifica y marca como perdidos los pacientes que cumplan el protocolo de 7 días sin respuesta
 */

import { InasistenciaEntity } from '../entities/Inasistencia';
import { InasistenciaRepository } from '../../infrastructure/database/repositories/InasistenciaRepository';

export interface ProcesarProtocolo7DiasResponse {
  success: boolean;
  procesados: number;
  marcadosPerdidos: number;
  alertasProximas: number;
  detalles: {
    inasistenciaId: string;
    pacienteId: string;
    diasTranscurridos: number;
    accion: 'MARCADO_PERDIDO' | 'ALERTA_PROXIMA' | 'EN_PLAZO';
  }[];
}

export class ProcesarProtocolo7Dias {
  constructor(
    private inasistenciaRepo: InasistenciaRepository
  ) {}

  async execute(): Promise<ProcesarProtocolo7DiasResponse> {
    try {
      const detalles: ProcesarProtocolo7DiasResponse['detalles'] = [];
      let marcadosPerdidos = 0;
      let alertasProximas = 0;

      // Obtener todas las inasistencias en seguimiento
      const enSeguimiento = await this.inasistenciaRepo.obtenerPorEstado('En_Seguimiento');
      const pendientes = await this.inasistenciaRepo.obtenerPorEstado('Pendiente_Contacto');
      const todas = [...enSeguimiento, ...pendientes];

      for (const inasistencia of todas) {
        // Saltar bloqueados y ya marcados
        if (inasistencia.bloqueadoMarketing || inasistencia.marcadoComoPerdido) {
          continue;
        }

        // Saltar reagendados
        if (inasistencia.estadoSeguimiento === 'Reagendada') {
          continue;
        }

        const entity = new InasistenciaEntity(inasistencia);
        const estado = entity.obtenerEstadoSeguimiento();

        let accion: 'MARCADO_PERDIDO' | 'ALERTA_PROXIMA' | 'EN_PLAZO';

        // Verificar si cumple protocolo de 7 días
        if (estado.diasRestantesLimite <= 0) {
          // MARCAR COMO PERDIDO
          entity.marcarComoPerdido('Protocolo automático: 7 días sin respuesta');
          await this.inasistenciaRepo.actualizar(inasistencia.id, entity);
          marcadosPerdidos++;
          accion = 'MARCADO_PERDIDO';
        } else if (estado.diasRestantesLimite <= 2) {
          // ALERTA: Próximo a vencer
          alertasProximas++;
          accion = 'ALERTA_PROXIMA';
        } else {
          // Aún en plazo
          accion = 'EN_PLAZO';
        }

        detalles.push({
          inasistenciaId: inasistencia.id,
          pacienteId: inasistencia.pacienteId,
          diasTranscurridos: estado.diasDesdeInasistencia,
          accion
        });
      }

      return {
        success: true,
        procesados: todas.length,
        marcadosPerdidos,
        alertasProximas,
        detalles
      };
    } catch (error) {
      return {
        success: false,
        procesados: 0,
        marcadosPerdidos: 0,
        alertasProximas: 0,
        detalles: []
      };
    }
  }

  /**
   * Obtiene inasistencias próximas a vencer (para alertas)
   */
  async obtenerProximasAVencer(diasLimite: number = 2): Promise<InasistenciaEntity[]> {
    const inasistencias = await this.inasistenciaRepo.obtenerProximasAVencer(diasLimite);
    return inasistencias.map(i => new InasistenciaEntity(i));
  }

  /**
   * Obtiene reporte de pacientes perdidos
   */
  async obtenerReportePerdidos(sucursalId?: string): Promise<{
    total: number;
    porMotivo: { motivo: string; cantidad: number }[];
    porMes: { mes: string; cantidad: number }[];
  }> {
    const perdidos = await this.inasistenciaRepo.obtenerPorEstado('Perdido', sucursalId);

    // Por motivo
    const motivosMap = new Map<string, number>();
    perdidos.forEach(i => {
      const motivo = i.motivo || 'Sin_Motivo';
      motivosMap.set(motivo, (motivosMap.get(motivo) || 0) + 1);
    });
    const porMotivo = Array.from(motivosMap.entries()).map(([motivo, cantidad]) => ({ motivo, cantidad }));

    // Por mes
    const mesesMap = new Map<string, number>();
    perdidos.forEach(i => {
      if (i.fechaMarcadoPerdido) {
        const mes = i.fechaMarcadoPerdido.toISOString().substring(0, 7); // YYYY-MM
        mesesMap.set(mes, (mesesMap.get(mes) || 0) + 1);
      }
    });
    const porMes = Array.from(mesesMap.entries())
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    return {
      total: perdidos.length,
      porMotivo,
      porMes
    };
  }
}
