import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export interface UsuarioAuth {
  id: string;
  username: string;
  email?: string;
  nombreCompleto?: string;
  telefono?: string;
  fotoUrl?: string;
  rol?: string;
  sucursalId?: string;
  sucursalNombre?: string;
}

export interface LoginResponse {
  usuario: UsuarioAuth;
  token: string;
  mensaje: string;
}

export async function login(payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await api.post('/auth/login', payload);
  return response.data as LoginResponse;
}

export async function obtenerUsuarioActual(): Promise<UsuarioAuth> {
  const response = await api.get('/auth/me');
  return response.data as UsuarioAuth;
}

export async function guardarToken(token: string): Promise<void> {
  await AsyncStorage.setItem('auth_token', token);
}

export async function limpiarToken(): Promise<void> {
  await AsyncStorage.removeItem('auth_token');
}

export async function cambiarPassword(payload: {
  passwordActual: string;
  passwordNuevo: string;
}): Promise<void> {
  await api.post('/auth/cambiar-password', payload);
}

export async function actualizarFotoPerfil(fotoUrl: string): Promise<UsuarioAuth> {
  const response = await api.post('/auth/perfil/foto', { fotoUrl });
  return response.data.usuario as UsuarioAuth;
}
