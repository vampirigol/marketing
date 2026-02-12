import { api } from './api';

export type LeadStatus =
  | 'new'
  | 'reviewing'
  | 'rejected'
  | 'qualified'
  | 'open'
  | 'in-progress'
  | 'open-deal'
  | 'agendados-mobile';

export interface Lead {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  status: LeadStatus;
  canal: string;
  valorEstimado?: number;
  notas?: string;
  etiquetas?: string[];
  customFields?: Record<string, string | number | boolean>;
}

export const crmService = {
  async obtenerLeads(sucursalId?: string): Promise<Lead[]> {
    const response = await api.get('/crm/leads', {
      params: sucursalId ? { sucursal: sucursalId } : undefined,
    });
    return response.data.leads as Lead[];
  },

  async actualizarLead(id: string, payload: { status: LeadStatus; resultado?: string }): Promise<Lead> {
    const response = await api.put(`/crm/leads/${id}`, payload);
    return response.data.lead as Lead;
  },
};
