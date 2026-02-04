import { api } from './api';
import type { Cita } from '@/types';

export const citasService = {
  // Crear cita
  async crear(data: Partial<Cita>) {
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

  // Reagendar cita
  async reagendar(id: string, data: { nuevaFecha: Date; nuevaHora: string; motivo: string }) {
    const response = await api.put(`/citas/${id}/reagendar`, data);
    return response.data.cita;
  },

  // Marcar llegada
  async marcarLlegada(id: string) {
    const response = await api.put(`/citas/${id}/llegada`);
    return response.data.cita;
  },

  // Cancelar cita
  async cancelar(id: string, motivo: string) {
    const response = await api.put(`/citas/${id}/cancelar`, { motivo });
    return response.data.cita;
  },
};

export default citasService;
