import { api } from './api';

export interface SucursalApi {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  telefono: string;
  emailContacto?: string;
  zonaHoraria: string;
  activa: boolean;
}

export async function obtenerSucursales(activa: boolean = true): Promise<SucursalApi[]> {
  const response = await api.get('/sucursales', {
    params: { activa },
  });
  return response.data.sucursales as SucursalApi[];
}
