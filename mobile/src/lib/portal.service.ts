import { api } from './api';

export type TareaEstado = 'pendiente' | 'recibida' | 'en_progreso' | 'terminada';
export type TareaPrioridad = 'alta' | 'media' | 'baja';

export interface PortalComentario {
  id: string;
  autor: string;
  mensaje: string;
  fecha: string;
}

export interface PortalEvidencia {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'archivo';
  dataUri?: string;
  url?: string;
  fecha: string;
}

export interface PortalTarea {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: TareaPrioridad;
  estado: TareaEstado;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaRecibida?: string;
  fechaInicio?: string;
  fechaFin?: string;
  comentarios: PortalComentario[];
  evidencias: PortalEvidencia[];
}

export interface PortalNoticia {
  id: string;
  titulo: string;
  contenido: string;
  fechaPublicacion: string;
  tipo: 'general' | 'local';
}

export const portalService = {
  async obtenerNoticias(): Promise<PortalNoticia[]> {
    const response = await api.get('/portal/noticias');
    return response.data.noticias as PortalNoticia[];
  },

  async obtenerTareas(): Promise<PortalTarea[]> {
    const response = await api.get('/portal/tareas');
    return response.data.tareas as PortalTarea[];
  },

  async recibirTarea(id: string): Promise<PortalTarea> {
    const response = await api.post(`/portal/tareas/${id}/recibir`);
    return response.data.tarea as PortalTarea;
  },

  async iniciarTarea(id: string): Promise<PortalTarea> {
    const response = await api.post(`/portal/tareas/${id}/iniciar`);
    return response.data.tarea as PortalTarea;
  },

  async terminarTarea(id: string): Promise<PortalTarea> {
    const response = await api.post(`/portal/tareas/${id}/terminar`);
    return response.data.tarea as PortalTarea;
  },

  async agregarComentario(id: string, mensaje: string): Promise<PortalTarea> {
    const response = await api.post(`/portal/tareas/${id}/comentarios`, { mensaje });
    return response.data.tarea as PortalTarea;
  },

  async agregarEvidencia(payload: {
    id: string;
    nombre: string;
    tipo: 'imagen' | 'archivo';
    dataUri?: string;
    url?: string;
  }): Promise<PortalTarea> {
    const { id, ...data } = payload;
    const response = await api.post(`/portal/tareas/${id}/evidencias`, data);
    return response.data.tarea as PortalTarea;
  },
};
