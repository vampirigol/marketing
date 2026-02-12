import { api } from './api';
import type { Cita } from '@/types';

export interface CrearCitaPayload extends Partial<Cita> {
  codigoPromocion?: string;
  esPromocion?: boolean;
  usuarioId?: string;
}

export const citasService = {
  // Crear cita
  async crear(data: CrearCitaPayload) {
    const response = await api.post('/citas', data);
    return response.data.cita;
  },

  // Obtener cita por ID
  async obtenerPorId(id: string) {
    const response = await api.get(`/citas/${id}`);
    return response.data.cita;
  },

  // Obtener citas de un paciente
  async obtenerPorPaciente(pacienteId: string) {
    const response = await api.get(`/citas/paciente/${pacienteId}`);
    return response.data.citas;
  },

  // Obtener citas por sucursal y fecha
  async obtenerPorSucursalYFecha(sucursalId: string, fecha: string) {
    const response = await api.get(`/citas/sucursal/${sucursalId}`, {
      params: { fecha },
    });
    return response.data.citas;
  },

  // Obtener disponibilidad por sucursal y fecha
  async obtenerDisponibilidad(params: {
    sucursalId: string;
    fecha: string;
    doctorId?: string;
    inicio?: string;
    fin?: string;
    intervaloMin?: number;
    maxEmpalmes?: number;
  }) {
    const { sucursalId, doctorId, ...rest } = params;
    // Solo enviar doctorId como query param si el endpoint lo requiere
    // Si el backend espera doctorId en el path, NO lo envíes como query param
    const response = await api.get(`/citas/disponibilidad/${sucursalId}`, {
      params: {
        ...rest,
        ...(doctorId ? { doctorId } : {})
      },
    });
    return response.data.slots as Array<{
      hora: string;
      disponible: boolean;
      cupoDisponible: number;
      capacidad: number;
    }>;
  },

  // Reagendar cita
  async reagendar(id: string, data: { nuevaFecha: Date; nuevaHora: string; motivo: string }) {
    const response = await api.put(`/citas/${id}/reagendar`, data);
    return response.data.cita;
  },

  async actualizar(id: string, data: Partial<Cita>) {
    const response = await api.put(`/citas/${id}`, data);
    return response.data.cita;
  },

  async obtenerKpi(params?: { sucursalId?: string; fechaInicio?: string; fechaFin?: string }) {
    const response = await api.get('/citas/stats/kpi', { params });
    return response.data;
  },

  async obtenerAlertasRiesgo(params?: { sucursalId?: string }) {
    const response = await api.get('/citas/alertas/riesgo', { params });
    return response.data;
  },

  async sincronizarCitasDesdeCrm() {
    const response = await api.post('/crm/sync-citas');
    return response.data;
  },

  // Marcar llegada
  async marcarLlegada(id: string, data?: { horaLlegada?: string }) {
    const response = await api.put(`/citas/${id}/llegada`, data || {});
    return response.data.cita;
  },

  // Cancelar cita
  async cancelar(id: string, motivo: string) {
    const response = await api.put(`/citas/${id}/cancelar`, { motivo });
    return response.data.cita;
  },

  // Listar citas paginadas
  async listarPaginado(params: { page?: number; pageSize?: number; [key: string]: any }) {
    const response = await api.get('/citas/paginado', { params });
    return response.data;
  },

  // Obtener citas por rango de fechas
  async obtenerPorRango(params: { fechaInicio: string; fechaFin: string; [key: string]: any }) {
    const response = await api.get('/citas/rango', { params });
    return response.data.citas;
  },

  // Listar lista de espera
  async listarListaEspera(params?: { estado?: string }) {
    const response = await api.get('/citas/lista-espera', { params });
    return response.data.lista || response.data;
  },

  // Asignar cita desde lista de espera
  async asignarListaEspera(solicitudId: string, data: { citaId: string; pacienteId: string }) {
    const response = await api.post(`/citas/lista-espera/${solicitudId}/asignar`, data);
    return response.data;
  },
};

export default citasService;
