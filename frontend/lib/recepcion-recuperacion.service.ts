import { api } from './api';

export interface ItemListaRecuperacion {
  leadId: string;
  nombre: string;
  telefono: string;
  ultimaCitaFallida: {
    fecha: string;
    hora: string;
  } | null;
  pacienteId: string | null;
  citaId: string | null;
  sucursalId: string | null;
}

export const recepcionRecuperacionService = {
  async getListaRecuperacion(sucursalId?: string): Promise<ItemListaRecuperacion[]> {
    const { data } = await api.get<{ success: boolean; lista: ItemListaRecuperacion[] }>(
      '/crm/lista-recuperacion',
      sucursalId ? { params: { sucursalId } } : {}
    );
    return data?.lista ?? [];
  },

  async vincularLeadANuevaCita(leadId: string, citaId: string, sucursalId: string, sucursalNombre?: string): Promise<void> {
    await api.put(`/crm/leads/${leadId}`, {
      citaId,
      status: 'citas-locales',
      sucursalId,
      sucursalNombre,
    });
  },
};
