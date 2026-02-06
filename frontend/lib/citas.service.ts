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
    const { sucursalId, ...rest } = params;
    const response = await api.get(`/citas/disponibilidad/${sucursalId}`, {
      params: rest,
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
};

export default citasService;
