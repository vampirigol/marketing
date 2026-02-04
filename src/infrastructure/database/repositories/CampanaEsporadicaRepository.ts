/**
 * Repositorio: CampañaEsporádica
 * Gestión de campañas de broadcast
 */

import { CampanaEsporadica, EstadoCampana } from '../../../core/entities/CampanaEsporadica';

export interface ICampanaEsporadicaRepository {
  crear(campana: CampanaEsporadica): Promise<CampanaEsporadica>;
  obtenerPorId(id: string): Promise<CampanaEsporadica | null>;
  obtenerTodas(): Promise<CampanaEsporadica[]>;
  obtenerPorEstado(estado: EstadoCampana): Promise<CampanaEsporadica[]>;
  obtenerPorSucursal(sucursalId: string): Promise<CampanaEsporadica[]>;
  actualizar(id: string, data: Partial<CampanaEsporadica>): Promise<CampanaEsporadica | null>;
  eliminar(id: string): Promise<boolean>;
}

/**
 * Implementación In-Memory
 */
export class CampanaEsporadicaRepository implements ICampanaEsporadicaRepository {
  private campanas: Map<string, CampanaEsporadica> = new Map();

  async crear(campana: CampanaEsporadica): Promise<CampanaEsporadica> {
    this.campanas.set(campana.id, campana);
    return campana;
  }

  async obtenerPorId(id: string): Promise<CampanaEsporadica | null> {
    return this.campanas.get(id) || null;
  }

  async obtenerTodas(): Promise<CampanaEsporadica[]> {
    return Array.from(this.campanas.values())
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  }

  async obtenerPorEstado(estado: EstadoCampana): Promise<CampanaEsporadica[]> {
    return Array.from(this.campanas.values())
      .filter(c => c.estado === estado)
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  }

  async obtenerPorSucursal(sucursalId: string): Promise<CampanaEsporadica[]> {
    return Array.from(this.campanas.values())
      .filter(c => c.sucursalId === sucursalId)
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
  }

  async actualizar(id: string, data: Partial<CampanaEsporadica>): Promise<CampanaEsporadica | null> {
    const campana = this.campanas.get(id);
    if (!campana) return null;

    const campanaActualizada: CampanaEsporadica = {
      ...campana,
      ...data,
      id, // Nunca cambiar el ID
      ultimaActualizacion: new Date()
    };

    this.campanas.set(id, campanaActualizada);
    return campanaActualizada;
  }

  async eliminar(id: string): Promise<boolean> {
    return this.campanas.delete(id);
  }

  /**
   * Obtener campañas programadas listas para enviar
   */
  async obtenerProgramadasListasParaEnviar(): Promise<CampanaEsporadica[]> {
    const ahora = new Date();
    return Array.from(this.campanas.values())
      .filter(c => {
        return c.estado === 'Programada' 
          && c.fechaProgramada 
          && c.fechaProgramada <= ahora;
      });
  }
}
