import { api } from './api';

export const cuidadosEspiritualesService = {
  async estadoPaciente(pacienteId: string): Promise<{ hasAttended: boolean; ultimaAsistencia: string | null }> {
    const { data } = await api.get<{ success: boolean; hasAttended: boolean; ultimaAsistencia: string | null }>(
      `/cuidados-espirituales/paciente/${pacienteId}`
    );
    return { hasAttended: data?.hasAttended ?? false, ultimaAsistencia: data?.ultimaAsistencia ?? null };
  },

  async marcarAsistencia(pacienteId: string): Promise<void> {
    await api.post(`/cuidados-espirituales/paciente/${pacienteId}/marcar-asistencia`);
  },

  async kpi(desde?: string, hasta?: string): Promise<number> {
    const params: Record<string, string> = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    const { data } = await api.get<{ success: boolean; totalAtendidos: number }>(
      '/cuidados-espirituales/kpi',
      Object.keys(params).length ? { params } : {}
    );
    return data?.totalAtendidos ?? 0;
  },
};
