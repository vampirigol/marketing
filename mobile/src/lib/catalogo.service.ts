import { api } from './api';

export interface CatalogoSucursal {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  telefono: string;
  email?: string;
  zonaHoraria: string;
  activo: boolean;
}

export interface CatalogoEspecialidad {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface CatalogoDoctor {
  id: string;
  nombre: string;
  especialidadId: string;
  sucursalId: string;
  horario: {
    inicio: string;
    fin: string;
    intervaloMin: number;
  };
  capacidadEmpalmes: number;
  activo: boolean;
}

export interface CatalogoServicio {
  id: string;
  nombre: string;
  especialidadId: string;
  doctorId?: string;
  precioBase: number;
  duracionMinutos: number;
  promocionActiva?: boolean;
  codigoPromocion?: string;
  precioPromocion?: number;
}

export interface CatalogoData {
  sucursales: CatalogoSucursal[];
  especialidades: CatalogoEspecialidad[];
  doctores: CatalogoDoctor[];
  servicios: CatalogoServicio[];
}

export const catalogoService = {
  async obtenerCatalogo(sucursalId?: string): Promise<CatalogoData> {
    const response = await api.get('/catalogo', {
      params: sucursalId ? { sucursalId } : undefined,
    });
    return response.data.catalogo as CatalogoData;
  },

  async obtenerDisponibilidad(params: {
    sucursalId: string;
    doctorId?: string;
    fecha: string;
  }) {
    const response = await api.get('/catalogo/disponibilidad', { params });
    return response.data.disponibilidad as Array<{
      hora: string;
      disponible: boolean;
      doctor: string;
    }>;
  },

  async agendarCita(payload: {
    sucursalId: string;
    especialidadId?: string;
    doctorId?: string;
    servicioId?: string;
    fecha: string;
    hora: string;
    paciente: { nombre: string; telefono: string; email?: string };
  }) {
    const response = await api.post('/catalogo/agendar', payload);
    return response.data.cita;
  },
};
