import { api } from './api';

export interface HealthPanel {
  api: { status: string; timestamp: string };
  database: { connected: boolean };
  websocket: { connected: boolean; clientes: number };
  schedulers: { total: number; activos: number; schedulers: Array<{ id: number; nombre: string; activo: boolean }> };
}

export async function obtenerHealthPanel(): Promise<HealthPanel> {
  const response = await api.get('/health/panel');
  return response.data;
}
