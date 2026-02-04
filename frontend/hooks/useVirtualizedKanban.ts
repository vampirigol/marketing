import { useMemo } from 'react';
import { Lead, LeadStatus } from '@/types/matrix';

interface KanbanColumnData {
  id: LeadStatus;
  titulo: string;
  color: string;
  icono: string;
  leads: Lead[];
  valorTotal: number;
}

export function useVirtualizedKanban(
  leads: Lead[],
  busqueda: string,
  filtroCanal: 'todos' | 'whatsapp' | 'facebook' | 'instagram'
) {
  // Memoizar el filtrado de leads
  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      const matchBusqueda =
        lead.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        lead.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
        lead.telefono?.includes(busqueda);

      const matchCanal = filtroCanal === 'todos' || lead.canal === filtroCanal;

      return matchBusqueda && matchCanal;
    });
  }, [leads, busqueda, filtroCanal]);

  // Definir las columnas del Kanban (memoizado)
  const columnasBase = useMemo<Omit<KanbanColumnData, 'leads' | 'valorTotal'>[]>(
    () => [
      {
        id: 'new' as LeadStatus,
        titulo: 'Leads Nuevos',
        color: 'purple',
        icono: '🆕',
      },
      {
        id: 'reviewing' as LeadStatus,
        titulo: 'En Revisión',
        color: 'orange',
        icono: '👀',
      },
      {
        id: 'rejected' as LeadStatus,
        titulo: 'Rechazados',
        color: 'red',
        icono: '❌',
      },
      {
        id: 'qualified' as LeadStatus,
        titulo: 'Calificados',
        color: 'green',
        icono: '✅',
      },
      {
        id: 'open' as LeadStatus,
        titulo: 'Abiertos',
        color: 'blue',
        icono: '📂',
      },
      {
        id: 'in-progress' as LeadStatus,
        titulo: 'En Progreso',
        color: 'indigo',
        icono: '⚡',
      },
      {
        id: 'open-deal' as LeadStatus,
        titulo: 'Negociación',
        color: 'yellow',
        icono: '💰',
      },
    ],
    []
  );

  // Organizar leads por columna con cálculo de valores (memoizado)
  const columnasConLeads = useMemo<KanbanColumnData[]>(() => {
    return columnasBase.map((columna) => {
      const leadsColumna = leadsFiltrados.filter((lead) => lead.status === columna.id);
      const valorTotal = leadsColumna.reduce((acc, lead) => acc + (lead.valorEstimado || 0), 0);

      return {
        ...columna,
        leads: leadsColumna,
        valorTotal,
      };
    });
  }, [columnasBase, leadsFiltrados]);

  // Estadísticas generales (memoizado)
  const estadisticas = useMemo(() => {
    const totalLeads = leadsFiltrados.length;
    const valorTotal = leadsFiltrados.reduce((acc, lead) => acc + (lead.valorEstimado || 0), 0);
    
    const hoy = new Date();
    const nuevosHoy = leadsFiltrados.filter((l) => {
      return l.fechaCreacion.toDateString() === hoy.toDateString();
    }).length;

    const calificados = leadsFiltrados.filter((l) => l.status === 'qualified').length;
    const dealsActivos = leadsFiltrados.filter((l) => l.status === 'open-deal').length;

    return {
      totalLeads,
      valorTotal,
      nuevosHoy,
      calificados,
      dealsActivos,
    };
  }, [leadsFiltrados]);

  return {
    columnasConLeads,
    estadisticas,
    leadsFiltrados,
  };
}
