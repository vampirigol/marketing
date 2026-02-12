import { api } from './api';

export interface UsuarioAuth {
  id: string;
  username: string;
  email?: string;
  nombreCompleto?: string;
  telefono?: string;
  rol?: string;
  sucursalId?: string;
  sucursalNombre?: string;
}

export async function obtenerUsuarioActual(): Promise<UsuarioAuth> {
  const response = await api.get('/auth/me');
  return response.data as UsuarioAuth;
}

export async function cambiarPassword(payload: {
  passwordActual: string;
  passwordNuevo: string;
}): Promise<{ mensaje: string }> {
  const response = await api.post('/auth/cambiar-password', payload);
  return response.data as { mensaje: string };
}
