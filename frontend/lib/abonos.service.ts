import { api } from './api';
import type { Abono } from '@/types';

export const abonosService = {
  // Crear abono
  async crear(data: Partial<Abono>) {
    const response = await api.post('/abonos', data);
    return response.data;
  },

  // Obtener abono por ID
  async obtenerPorId(id: string) {
    const response = await api.get(`/abonos/${id}`);
    return response.data.abono;
  },

  // Obtener abonos de una cita
  async obtenerPorCita(citaId: string) {
    const response = await api.get(`/abonos/cita/${citaId}`);
    return response.data.abonos;
  },

  // Obtener abonos por sucursal y fecha (para corte de caja)
  async obtenerPorSucursalYFecha(sucursalId: string, fecha: string) {
    const response = await api.get(`/abonos/sucursal/${sucursalId}`, {
      params: { fecha },
    });
    return response.data;
  },

  // Cancelar abono
  async cancelar(id: string, motivo: string) {
    const response = await api.put(`/abonos/${id}/cancelar`, { motivo });
    return response.data.abono;
  },
};

export default abonosService;
