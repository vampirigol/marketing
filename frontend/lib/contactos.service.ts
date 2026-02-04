import { api } from './api';
import type { SolicitudContacto, ConfiguracionMotivoContacto } from '@/types/contacto';

export const contactosService = {
  // Crear solicitud de contacto
  async crear(data: {
    nombreCompleto: string;
    telefono: string;
    email?: string;
    whatsapp?: string;
    sucursalId: string;
    sucursalNombre: string;
    motivo: string;
    motivoDetalle?: string;
    preferenciaContacto: string;
    origen?: string;
  }): Promise<{
    success: boolean;
    solicitud: SolicitudContacto;
    mensaje: string;
    tiempoRespuestaEstimado: number;
  }> {
    const response = await api.post('/contactos', data);
    return response.data;
  },

  // Obtener solicitud por ID
  async obtenerPorId(id: string): Promise<{ success: boolean; solicitud: SolicitudContacto }> {
    const response = await api.get(`/contactos/${id}`);
    return response.data;
  },

  // Obtener solicitudes pendientes
  async obtenerPendientes(sucursalId?: string): Promise<{
    success: boolean;
    solicitudes: SolicitudContacto[];
    total: number;
  }> {
    const params = sucursalId ? { sucursalId } : {};
    const response = await api.get('/contactos/lista/pendientes', { params });
    return response.data;
  },

  // Obtener solicitudes vencidas
  async obtenerVencidas(): Promise<{
    success: boolean;
    solicitudes: SolicitudContacto[];
    total: number;
  }> {
    const response = await api.get('/contactos/lista/vencidas');
    return response.data;
  },

  // Asignar agente
  async asignarAgente(
    id: string,
    agenteId: string,
    agenteNombre: string
  ): Promise<{ success: boolean; solicitud: SolicitudContacto; mensaje: string }> {
    const response = await api.post(`/contactos/${id}/asignar`, { agenteId, agenteNombre });
    return response.data;
  },

  // Iniciar contacto
  async iniciarContacto(
    id: string,
    notas?: string
  ): Promise<{ success: boolean; solicitud: SolicitudContacto; mensaje: string }> {
    const response = await api.post(`/contactos/${id}/iniciar-contacto`, { notas });
    return response.data;
  },

  // Resolver solicitud
  async resolver(
    id: string,
    resolucion: string
  ): Promise<{ success: boolean; solicitud: SolicitudContacto; mensaje: string }> {
    const response = await api.post(`/contactos/${id}/resolver`, { resolucion });
    return response.data;
  },

  // Obtener estadísticas
  async obtenerEstadisticas(sucursalId?: string): Promise<{
    success: boolean;
    estadisticas: {
      total: number;
      pendientes: number;
      asignadas: number;
      enContacto: number;
      resueltas: number;
      canceladas: number;
      tiempoPromedioResolucion: number;
    };
  }> {
    const params = sucursalId ? { sucursalId } : {};
    const response = await api.get('/contactos/stats/general', { params });
    return response.data;
  },

  // Obtener catálogo de motivos
  async obtenerCatalogoMotivos(): Promise<{
    success: boolean;
    motivos: ConfiguracionMotivoContacto[];
  }> {
    const response = await api.get('/contactos/catalogo/motivos');
    return response.data;
  },

  // Listar todas las solicitudes
  async listar(filtros?: {
    estado?: string;
    sucursalId?: string;
    agenteId?: string;
  }): Promise<{
    success: boolean;
    solicitudes: SolicitudContacto[];
    total: number;
  }> {
    const response = await api.get('/contactos', { params: filtros });
    return response.data;
  },
};

export default contactosService;
