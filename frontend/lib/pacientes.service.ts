import { api } from './api';
import type { Paciente } from '@/types';

export const pacientesService = {
  // Crear paciente
  async crear(data: Partial<Paciente>) {
    const response = await api.post('/pacientes', data);
    return response.data;
  },

  // Obtener paciente por ID
  async obtenerPorId(id: string) {
    const response = await api.get(`/pacientes/${id}`);
    return response.data.paciente;
  },

  // Buscar pacientes
  async buscar(query: string) {
    const response = await api.get('/pacientes/buscar', {
      params: { q: query },
    });
    return response.data.pacientes;
  },

  // Listar pacientes
  async listar(limit = 50, offset = 0) {
    const response = await api.get('/pacientes', {
      params: { limit, offset },
    });
    return response.data.pacientes;
  },

  // Actualizar paciente
  async actualizar(id: string, data: Partial<Paciente>) {
    const response = await api.put(`/pacientes/${id}`, data);
    return response.data.paciente;
  },

  // Obtener por No_Afiliacion
  async obtenerPorNoAfiliacion(noAfiliacion: string) {
    const response = await api.get(`/pacientes/afiliacion/${noAfiliacion}`);
    return response.data.paciente;
  },
};

export default pacientesService;
