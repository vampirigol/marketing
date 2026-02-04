/**
 * Repositorio: Solicitud de Contacto
 * Gestiona el almacenamiento y recuperación de solicitudes de contacto
 */

import { 
  SolicitudContacto, 
  EstadoSolicitud 
} from '../../../core/entities/SolicitudContacto';

export interface SolicitudContactoRepository {
  crear(solicitud: SolicitudContacto): Promise<SolicitudContacto>;
  obtenerPorId(id: string): Promise<SolicitudContacto | null>;
  obtenerPorSucursal(sucursalId: string): Promise<SolicitudContacto[]>;
  obtenerPorEstado(estado: EstadoSolicitud): Promise<SolicitudContacto[]>;
  obtenerPorAgente(agenteId: string): Promise<SolicitudContacto[]>;
  obtenerPendientes(): Promise<SolicitudContacto[]>;
  obtenerVencidas(): Promise<SolicitudContacto[]>;
  actualizar(id: string, datos: Partial<SolicitudContacto>): Promise<SolicitudContacto>;
  obtenerTodas(): Promise<SolicitudContacto[]>;
  obtenerEstadisticas(sucursalId?: string): Promise<{
    total: number;
    pendientes: number;
    asignadas: number;
    enContacto: number;
    resueltas: number;
    canceladas: number;
    tiempoPromedioResolucion: number;
  }>;
}

/**
 * Implementación en memoria (para desarrollo)
 * En producción, usar MongoDB, PostgreSQL, etc.
 */
export class InMemorySolicitudContactoRepository implements SolicitudContactoRepository {
  private solicitudes: Map<string, SolicitudContacto> = new Map();

  async crear(solicitud: SolicitudContacto): Promise<SolicitudContacto> {
    this.solicitudes.set(solicitud.id, { ...solicitud });
    return { ...solicitud };
  }

  async obtenerPorId(id: string): Promise<SolicitudContacto | null> {
    const solicitud = this.solicitudes.get(id);
    return solicitud ? { ...solicitud } : null;
  }

  async obtenerPorSucursal(sucursalId: string): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.sucursalId === sucursalId)
      .map(s => ({ ...s }));
  }

  async obtenerPorEstado(estado: EstadoSolicitud): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.estado === estado)
      .map(s => ({ ...s }));
  }

  async obtenerPorAgente(agenteId: string): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.agenteAsignadoId === agenteId)
      .map(s => ({ ...s }));
  }

  async obtenerPendientes(): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.estado === 'Pendiente' || s.estado === 'Asignada')
      .map(s => ({ ...s }));
  }

  async obtenerVencidas(): Promise<SolicitudContacto[]> {
    const ahora = new Date();
    return Array.from(this.solicitudes.values())
      .filter(s => {
        if (s.estado !== 'Pendiente') return false;
        const diffMs = ahora.getTime() - s.fechaCreacion.getTime();
        const diffMinutos = diffMs / (1000 * 60);
        return diffMinutos > 120; // Vencidas después de 2 horas
      })
      .map(s => ({ ...s }));
  }

  async actualizar(id: string, datos: Partial<SolicitudContacto>): Promise<SolicitudContacto> {
    const solicitud = this.solicitudes.get(id);
    
    if (!solicitud) {
      throw new Error(`Solicitud ${id} no encontrada`);
    }

    const actualizada = {
      ...solicitud,
      ...datos,
      ultimaActualizacion: new Date()
    };

    this.solicitudes.set(id, actualizada);
    return { ...actualizada };
  }

  async obtenerTodas(): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values()).map(s => ({ ...s }));
  }

  async obtenerEstadisticas(sucursalId?: string): Promise<{
    total: number;
    pendientes: number;
    asignadas: number;
    enContacto: number;
    resueltas: number;
    canceladas: number;
    tiempoPromedioResolucion: number;
  }> {
    let solicitudes = Array.from(this.solicitudes.values());
    
    if (sucursalId) {
      solicitudes = solicitudes.filter(s => s.sucursalId === sucursalId);
    }

    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const asignadas = solicitudes.filter(s => s.estado === 'Asignada').length;
    const enContacto = solicitudes.filter(s => s.estado === 'En_Contacto').length;
    const resueltas = solicitudes.filter(s => s.estado === 'Resuelta').length;
    const canceladas = solicitudes.filter(s => s.estado === 'Cancelada').length;

    // Calcular tiempo promedio de resolución
    const resueltas_completas = solicitudes.filter(
      s => s.estado === 'Resuelta' && s.fechaResolucion
    );
    
    let tiempoPromedioResolucion = 0;
    if (resueltas_completas.length > 0) {
      const tiempos = resueltas_completas.map(s => {
        if (!s.fechaResolucion) return 0;
        return (s.fechaResolucion.getTime() - s.fechaCreacion.getTime()) / (1000 * 60);
      });
      tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    }

    return {
      total,
      pendientes,
      asignadas,
      enContacto,
      resueltas,
      canceladas,
      tiempoPromedioResolucion: Math.round(tiempoPromedioResolucion)
    };
  }

  /**
   * Método auxiliar para limpiar datos (útil en testing)
   */
  async limpiar(): Promise<void> {
    this.solicitudes.clear();
  }
}

// Instancia singleton para usar en toda la aplicación
export const solicitudContactoRepository = new InMemorySolicitudContactoRepository();
