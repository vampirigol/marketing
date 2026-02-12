import { api } from './api';

export interface CrearCitaPayload {
  pacienteId?: string;
  doctorId?: string;
  sucursalId?: string;
  fecha?: string;
  hora?: string;
  motivo?: string;
  codigoPromocion?: string;
  esPromocion?: boolean;
  usuarioId?: string;
}

export const citasService = {
  async crear(data: CrearCitaPayload) {
    const response = await api.post('/citas', data);
    return response.data.cita;
  },

  async obtenerPorId(id: string) {
    const response = await api.get(`/citas/${id}`);
    return response.data.cita;
  },

  async obtenerPorPaciente(pacienteId: string) {
    const response = await api.get(`/citas/paciente/${pacienteId}`);
    return response.data.citas;
  },

  async obtenerPorDoctorYFecha(params: { medico: string; fecha: string }) {
    const response = await api.get('/citas/doctor', { params });
    return response.data.citas;
  },

  async obtenerPorDoctorYRango(params: { medico: string; fechaInicio: string; fechaFin: string }) {
    const response = await api.get('/citas/doctor/rango', { params });
    return response.data.citas;
  },

  async obtenerDisponibilidadPublica(params: {
    sucursalId: string;
    fecha: string;
    doctorId?: string;
    inicio?: string;
    fin?: string;
    intervaloMin?: number;
    maxEmpalmes?: number;
  }) {
    const { sucursalId, ...rest } = params;
    const response = await api.get(`/citas/publica/disponibilidad/${sucursalId}`, {
      params: rest,
    });
    return response.data.slots as Array<{
      hora: string;
      disponible: boolean;
      cupoDisponible: number;
      capacidad: number;
    }>;
  },

  async crearPublica(payload: {
    paciente: {
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
    };
    sucursalId: string;
    fechaCita: string;
    horaCita: string;
    tipoConsulta: 'Primera_Vez' | 'Subsecuente' | 'Urgencia';
    especialidad: string;
    medicoAsignado?: string;
    telemedicinaLink?: string;
    preconsulta?: {
      motivo?: string;
      sintomas?: string;
      notas?: string;
    };
    documentos?: Array<{ nombre?: string; url: string }>;
  }) {
    const response = await api.post('/citas/publica', payload);
    return response.data.cita;
  },

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: string) {
    const response = await api.get(`/citas/sucursal/${sucursalId}`, {
      params: { fecha },
    });
    return response.data.citas;
  },

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
};
