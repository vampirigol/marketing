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

/** Fallback: obtiene sucursales desde /catalogo cuando /sucursales falla o está vacío */
export async function obtenerSucursalesDesdeCatalogo(): Promise<SucursalApi[]> {
  const response = await api.get('/catalogo');
  const sucursales = (response.data?.catalogo?.sucursales || []) as Array<{
    id: string;
    nombre: string;
    ciudad: string;
    estado: string;
    direccion: string;
    telefono: string;
    email?: string;
    zonaHoraria: string;
    activo: boolean;
  }>;
  return sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    ciudad: s.ciudad,
    estado: s.estado,
    direccion: s.direccion,
    telefono: s.telefono,
    emailContacto: s.email,
    zonaHoraria: s.zonaHoraria,
    activa: s.activo ?? true,
  }));
}
