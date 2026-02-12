import { api } from './api';
import type { EventoCalendario } from '@/types/calendario';

export const calendarioService = {
  async listarEventos(params: {
    fechaInicio: string;
    fechaFin: string;
    calendario?: 'personal' | 'compania';
    sucursalId?: string;
  }) {
    const response = await api.get<{ success: boolean; eventos: EventoCalendario[] }>('/calendario/eventos', {
      params,
    });
    const eventos = (response.data?.eventos || []).map((e) => ({
      ...e,
      fechaInicio: new Date(e.fechaInicio),
      fechaFin: new Date(e.fechaFin),
      fechaCreacion: new Date(e.fechaCreacion),
      fechaActualizacion: new Date(e.fechaActualizacion),
    }));
    return eventos;
  },

  async crearEvento(data: Partial<EventoCalendario> & { titulo: string; fechaInicio: Date; fechaFin: Date }) {
    const response = await api.post<{ success: boolean; evento: EventoCalendario }>('/calendario/eventos', {
      ...data,
      fechaInicio: data.fechaInicio.toISOString(),
      fechaFin: data.fechaFin.toISOString(),
    });
    const e = response.data?.evento;
    if (!e) throw new Error('No se devolvió el evento');
    return {
      ...e,
      fechaInicio: new Date(e.fechaInicio),
      fechaFin: new Date(e.fechaFin),
      fechaCreacion: new Date(e.fechaCreacion),
      fechaActualizacion: new Date(e.fechaActualizacion),
    };
  },

  async obtenerEvento(id: string) {
    const response = await api.get<{ success: boolean; evento: EventoCalendario }>(`/calendario/eventos/${id}`);
    const e = response.data?.evento;
    if (!e) throw new Error('Evento no encontrado');
    return {
      ...e,
      fechaInicio: new Date(e.fechaInicio),
      fechaFin: new Date(e.fechaFin),
      fechaCreacion: new Date(e.fechaCreacion),
      fechaActualizacion: new Date(e.fechaActualizacion),
    };
  },

  async actualizarEvento(id: string, data: Partial<EventoCalendario>) {
    const payload: any = { ...data };
    if (data.fechaInicio) payload.fechaInicio = data.fechaInicio.toISOString();
    if (data.fechaFin) payload.fechaFin = data.fechaFin.toISOString();
    const response = await api.put<{ success: boolean; evento: EventoCalendario }>(`/calendario/eventos/${id}`, payload);
    const e = response.data?.evento;
    if (!e) throw new Error('No se devolvió el evento');
    return {
      ...e,
      fechaInicio: new Date(e.fechaInicio),
      fechaFin: new Date(e.fechaFin),
      fechaCreacion: new Date(e.fechaCreacion),
      fechaActualizacion: new Date(e.fechaActualizacion),
    };
  },

  async eliminarEvento(id: string) {
    await api.delete(`/calendario/eventos/${id}`);
  },
};
