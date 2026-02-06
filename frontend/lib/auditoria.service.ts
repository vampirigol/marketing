import { api } from './api';

export interface AuditoriaEvento {
  id: string;
  entidad: string;
  entidadId: string;
  accion: string;
  usuarioId?: string;
  usuarioNombre?: string;
  detalles?: Record<string, any>;
  fechaEvento: string;
}

export async function obtenerAuditoria(params?: {
  entidad?: string;
  entidadId?: string;
  limit?: number;
}): Promise<AuditoriaEvento[]> {
  const response = await api.get('/auditoria', { params });
  return response.data.eventos as AuditoriaEvento[];
}
