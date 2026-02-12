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
  async crear(data: PacientePayload | Record<string, unknown>) {
    const response = await api.post('/pacientes', data);
    return response.data.paciente ?? response.data;
  },

  async obtenerPorId(id: string) {
    const response = await api.get(`/pacientes/${id}`);
    return response.data.paciente;
  },

  async buscar(query: string) {
    const response = await api.get('/pacientes/buscar', {
      params: { q: query },
    });
    return response.data.pacientes;
  },

  async listar(limit = 50, offset = 0) {
    const response = await api.get('/pacientes', {
      params: { limit, offset },
    });
    return response.data.pacientes;
  },
};
