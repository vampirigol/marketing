/**
 * Repositorio: Inasistencia
 * Gestiona el acceso a datos de inasistencias
 */

import { Inasistencia, InasistenciaEntity, EstadoSeguimiento, MotivoInasistencia } from '../../../core/entities/Inasistencia';

export interface InasistenciaRepository {
  crear(inasistencia: Inasistencia): Promise<Inasistencia>;
  obtenerPorId(id: string): Promise<Inasistencia | null>;
  obtenerPorCita(citaId: string): Promise<Inasistencia | null>;
  obtenerPorPaciente(pacienteId: string): Promise<Inasistencia[]>;
  actualizar(id: string, datos: Partial<Inasistencia>): Promise<Inasistencia>;
  obtenerListaRemarketing(sucursalId?: string): Promise<Inasistencia[]>;
  obtenerPendientesSeguimiento(sucursalId?: string): Promise<Inasistencia[]>;
  obtenerProximasAVencer(diasLimite: number): Promise<Inasistencia[]>;
  obtenerBloqueados(): Promise<Inasistencia[]>;
  obtenerPorEstado(estado: EstadoSeguimiento, sucursalId?: string): Promise<Inasistencia[]>;
  obtenerEstadisticas(sucursalId?: string, fechaInicio?: Date, fechaFin?: Date): Promise<EstadisticasInasistencia>;
}

export interface EstadisticasInasistencia {
  total: number;
  porMotivo: { motivo: MotivoInasistencia; cantidad: number }[];
  porEstado: { estado: EstadoSeguimiento; cantidad: number }[];
  enRemarketing: number;
  bloqueados: number;
  perdidos: number;
  recuperados: number;
  tasaRecuperacion: number;
}

/**
 * Implementación en memoria del repositorio
 */
export class InMemoryInasistenciaRepository implements InasistenciaRepository {
  private inasistencias: Map<string, Inasistencia> = new Map();

  async crear(inasistencia: Inasistencia): Promise<Inasistencia> {
    const entity = new InasistenciaEntity(inasistencia);
    this.inasistencias.set(entity.id, entity);
    return entity;
  }

  async obtenerPorId(id: string): Promise<Inasistencia | null> {
    return this.inasistencias.get(id) || null;
  }

  async obtenerPorCita(citaId: string): Promise<Inasistencia | null> {
    const inasistencia = Array.from(this.inasistencias.values())
      .find(i => i.citaId === citaId);
    return inasistencia || null;
  }

  async obtenerPorPaciente(pacienteId: string): Promise<Inasistencia[]> {
    return Array.from(this.inasistencias.values())
      .filter(i => i.pacienteId === pacienteId)
      .sort((a, b) => b.fechaCitaPerdida.getTime() - a.fechaCitaPerdida.getTime());
  }

  async actualizar(id: string, datos: Partial<Inasistencia>): Promise<Inasistencia> {
    const inasistencia = this.inasistencias.get(id);
    if (!inasistencia) {
      throw new Error(`Inasistencia ${id} no encontrada`);
    }

    const actualizada = {
      ...inasistencia,
      ...datos,
      ultimaActualizacion: new Date()
    };

    const entity = new InasistenciaEntity(actualizada);
    this.inasistencias.set(id, entity);
    return entity;
  }

  async obtenerListaRemarketing(sucursalId?: string): Promise<Inasistencia[]> {
    let lista = Array.from(this.inasistencias.values())
      .filter(i => i.enListaRemarketing && !i.bloqueadoMarketing);

    if (sucursalId) {
      lista = lista.filter(i => i.sucursalId === sucursalId);
    }

    return lista.sort((a, b) => {
      // Ordenar por prioridad y fecha
      const prioridadA = new InasistenciaEntity(a).obtenerConfigMotivo()?.prioridad || 'Baja';
      const prioridadB = new InasistenciaEntity(b).obtenerConfigMotivo()?.prioridad || 'Baja';
      
      const prioridadMap = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
      const diff = prioridadMap[prioridadB] - prioridadMap[prioridadA];
      
      if (diff !== 0) return diff;
      return a.fechaCitaPerdida.getTime() - b.fechaCitaPerdida.getTime();
    });
  }

  async obtenerPendientesSeguimiento(sucursalId?: string): Promise<Inasistencia[]> {
    const ahora = new Date();
    let pendientes = Array.from(this.inasistencias.values())
      .filter(i => {
        if (i.bloqueadoMarketing || i.marcadoComoPerdido) return false;
        if (i.estadoSeguimiento === 'Reagendada') return false;
        
        // Pendientes de contacto o próximo intento vencido
        return i.estadoSeguimiento === 'Pendiente_Contacto' ||
               (i.proximoIntentoContacto && ahora >= i.proximoIntentoContacto);
      });

    if (sucursalId) {
      pendientes = pendientes.filter(i => i.sucursalId === sucursalId);
    }

    return pendientes.sort((a, b) => a.fechaLimiteRespuesta.getTime() - b.fechaLimiteRespuesta.getTime());
  }

  async obtenerProximasAVencer(diasLimite: number = 2): Promise<Inasistencia[]> {
    const ahora = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + diasLimite);

    return Array.from(this.inasistencias.values())
      .filter(i => {
        if (i.marcadoComoPerdido || i.bloqueadoMarketing) return false;
        if (i.estadoSeguimiento === 'Reagendada') return false;
        
        return i.fechaLimiteRespuesta >= ahora && i.fechaLimiteRespuesta <= limite;
      })
      .sort((a, b) => a.fechaLimiteRespuesta.getTime() - b.fechaLimiteRespuesta.getTime());
  }

  async obtenerBloqueados(): Promise<Inasistencia[]> {
    return Array.from(this.inasistencias.values())
      .filter(i => i.bloqueadoMarketing)
      .sort((a, b) => (b.fechaBloqueo?.getTime() || 0) - (a.fechaBloqueo?.getTime() || 0));
  }

  async obtenerPorEstado(estado: EstadoSeguimiento, sucursalId?: string): Promise<Inasistencia[]> {
    let lista = Array.from(this.inasistencias.values())
      .filter(i => i.estadoSeguimiento === estado);

    if (sucursalId) {
      lista = lista.filter(i => i.sucursalId === sucursalId);
    }

    return lista.sort((a, b) => b.fechaCitaPerdida.getTime() - a.fechaCitaPerdida.getTime());
  }

  async obtenerEstadisticas(
    sucursalId?: string,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<EstadisticasInasistencia> {
    let lista = Array.from(this.inasistencias.values());

    // Filtrar por sucursal
    if (sucursalId) {
      lista = lista.filter(i => i.sucursalId === sucursalId);
    }

    // Filtrar por rango de fechas
    if (fechaInicio) {
      lista = lista.filter(i => i.fechaCitaPerdida >= fechaInicio);
    }
    if (fechaFin) {
      lista = lista.filter(i => i.fechaCitaPerdida <= fechaFin);
    }

    // Calcular estadísticas
    const total = lista.length;
    
    // Por motivo
    const motivosMap = new Map<MotivoInasistencia, number>();
    lista.forEach(i => {
      if (i.motivo) {
        motivosMap.set(i.motivo, (motivosMap.get(i.motivo) || 0) + 1);
      }
    });
    const porMotivo = Array.from(motivosMap.entries()).map(([motivo, cantidad]) => ({ motivo, cantidad }));

    // Por estado
    const estadosMap = new Map<EstadoSeguimiento, number>();
    lista.forEach(i => {
      estadosMap.set(i.estadoSeguimiento, (estadosMap.get(i.estadoSeguimiento) || 0) + 1);
    });
    const porEstado = Array.from(estadosMap.entries()).map(([estado, cantidad]) => ({ estado, cantidad }));

    // Contadores específicos
    const enRemarketing = lista.filter(i => i.enListaRemarketing).length;
    const bloqueados = lista.filter(i => i.bloqueadoMarketing).length;
    const perdidos = lista.filter(i => i.marcadoComoPerdido).length;
    const recuperados = lista.filter(i => i.estadoSeguimiento === 'Reagendada').length;
    
    // Tasa de recuperación
    const tasaRecuperacion = total > 0 ? (recuperados / total) * 100 : 0;

    return {
      total,
      porMotivo,
      porEstado,
      enRemarketing,
      bloqueados,
      perdidos,
      recuperados,
      tasaRecuperacion
    };
  }
}
