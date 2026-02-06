import { api } from './api';

export interface PacientePayload {
  nombreCompleto: string;
  telefono: string;
  whatsapp?: string;
  email?: string;
  fechaNacimiento: string;
  edad: number;
  sexo: 'M' | 'F' | 'Otro';
  noAfiliacion: string;
  tipoAfiliacion: 'IMSS' | 'ISSSTE' | 'Particular' | 'Seguro';
  ciudad: string;
  estado: string;
  origenLead: 'WhatsApp' | 'Facebook' | 'Instagram' | 'Llamada' | 'Presencial' | 'Referido';
}

export const pacientesService = {
  async crear(payload: PacientePayload) {
    try {
      const response = await api.post('/pacientes', payload);
      return response.data.paciente;
    } catch (error: any) {
      if (error?.response?.status === 409 && error.response.data?.paciente) {
        return error.response.data.paciente;
      }
      throw error;
    }
  },

  async obtenerPorId(id: string) {
    const response = await api.get(`/pacientes/${id}`);
    return response.data.paciente;
  },
};
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
