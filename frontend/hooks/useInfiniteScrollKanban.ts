import { useState, useCallback, useRef } from 'react';
import { Lead, LeadStatus } from '@/types/matrix';

interface LoadMoreOptions {
  status: LeadStatus;
  page: number;
  limit: number;
}

interface ColumnState {
  leads: Lead[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  totalCount: number;
}

type ColumnsState = Record<LeadStatus, ColumnState>;

interface UseInfiniteScrollKanbanProps {
  initialLimit?: number;
  loadMoreLimit?: number;
  onLoadMore: (options: LoadMoreOptions) => Promise<{ leads: Lead[]; hasMore: boolean; total: number }>;
  initialStates?: LeadStatus[];
}

const DEFAULT_INITIAL_STATES: LeadStatus[] = ['new', 'reviewing', 'rejected', 'qualified', 'open', 'in-progress', 'open-deal', 'citas-locales'];

export function useInfiniteScrollKanban({
  initialLimit = 20,
  loadMoreLimit = 10,
  onLoadMore,
  initialStates,
}: UseInfiniteScrollKanbanProps) {
  const statesToUse = initialStates && initialStates.length > 0 ? initialStates : DEFAULT_INITIAL_STATES;
  const [columnsState, setColumnsState] = useState<ColumnsState>(() => {
    const initialState = {} as ColumnsState;
    statesToUse.forEach((status) => {
      initialState[status] = {
        leads: [],
        page: 1,
        hasMore: true,
        isLoading: false,
        totalCount: 0,
      };
    });
    return initialState;
  });

  const loadingRef = useRef<Set<LeadStatus>>(new Set());

  // Cargar datos iniciales de todas las columnas
  const loadInitialData = useCallback(async () => {
    console.log('[useInfiniteScrollKanban] Iniciando carga de datos iniciales...');
    const promises = statesToUse.map(async (status) => {
      try {
        console.log(`[useInfiniteScrollKanban] Cargando status: ${status}`);
        const result = await onLoadMore({ status, page: 1, limit: initialLimit });
        console.log(`[useInfiniteScrollKanban] Status ${status}: ${result.leads.length} leads cargados`);
        return { status, ...result };
      } catch (error) {
        console.error(`Error loading initial data for ${status}:`, error);
        return { status, leads: [], hasMore: false, total: 0 };
      }
    });

    const results = await Promise.all(promises);
    console.log('[useInfiniteScrollKanban] Resumen de carga:', results.map(r => ({ status: r.status, count: r.leads.length })));

    setColumnsState((prev) => {
      const newState = { ...prev };
      results.forEach(({ status, leads, hasMore, total }) => {
        newState[status] = {
          leads,
          page: 1,
          hasMore,
          isLoading: false,
          totalCount: total,
        };
      });
      return newState;
    });
  }, [onLoadMore, initialLimit, statesToUse]);

  // Cargar más datos de una columna específica
  const loadMoreForColumn = useCallback(
    async (status: LeadStatus) => {
      // Evitar cargas duplicadas
      if (loadingRef.current.has(status)) {
        return;
      }

      const columnState = columnsState[status];
      
      if (!columnState.hasMore || columnState.isLoading) {
        return;
      }

      loadingRef.current.add(status);

      setColumnsState((prev) => ({
        ...prev,
        [status]: { ...prev[status], isLoading: true },
      }));

      try {
        const nextPage = columnState.page + 1;
        const result = await onLoadMore({
          status,
          page: nextPage,
          limit: loadMoreLimit,
        });

        setColumnsState((prev) => ({
          ...prev,
          [status]: {
            leads: [...prev[status].leads, ...result.leads],
            page: nextPage,
            hasMore: result.hasMore,
            isLoading: false,
            totalCount: result.total,
          },
        }));
      } catch (error) {
        console.error(`Error loading more data for ${status}:`, error);
        setColumnsState((prev) => ({
          ...prev,
          [status]: { ...prev[status], isLoading: false },
        }));
      } finally {
        loadingRef.current.delete(status);
      }
    },
    [columnsState, onLoadMore, loadMoreLimit]
  );

  // Refrescar una columna específica
  const refreshColumn = useCallback(
    async (status: LeadStatus) => {
      setColumnsState((prev) => ({
        ...prev,
        [status]: { ...prev[status], isLoading: true },
      }));

      try {
        const result = await onLoadMore({ status, page: 1, limit: initialLimit });
        setColumnsState((prev) => ({
          ...prev,
          [status]: {
            leads: result.leads,
            page: 1,
            hasMore: result.hasMore,
            isLoading: false,
            totalCount: result.total,
          },
        }));
      } catch (error) {
        console.error(`Error refreshing ${status}:`, error);
        setColumnsState((prev) => ({
          ...prev,
          [status]: { ...prev[status], isLoading: false },
        }));
      }
    },
    [onLoadMore, initialLimit]
  );

  // Agregar un lead nuevo a una columna
  const addLead = useCallback((status: LeadStatus, lead: Lead) => {
    setColumnsState((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        leads: [lead, ...prev[status].leads],
        totalCount: prev[status].totalCount + 1,
      },
    }));
  }, []);

  // Mover un lead entre columnas
  const moveLead = useCallback((leadId: string, fromStatus: LeadStatus, toStatus: LeadStatus) => {
    setColumnsState((prev) => {
      const lead = prev[fromStatus].leads.find((l) => l.id === leadId);
      if (!lead) return prev;

      const updatedLead = { ...lead, status: toStatus };

      return {
        ...prev,
        [fromStatus]: {
          ...prev[fromStatus],
          leads: prev[fromStatus].leads.filter((l) => l.id !== leadId),
          totalCount: prev[fromStatus].totalCount - 1,
        },
        [toStatus]: {
          ...prev[toStatus],
          leads: [updatedLead, ...prev[toStatus].leads],
          totalCount: prev[toStatus].totalCount + 1,
        },
      };
    });
  }, []);

  // Actualizar un lead específico
  const updateLead = useCallback((status: LeadStatus, leadId: string, updates: Partial<Lead>) => {
    setColumnsState((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        leads: prev[status].leads.map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        ),
      },
    }));
  }, []);

  // Eliminar un lead
  const removeLead = useCallback((status: LeadStatus, leadId: string) => {
    setColumnsState((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        leads: prev[status].leads.filter((l) => l.id !== leadId),
        totalCount: prev[status].totalCount - 1,
      },
    }));
  }, []);

  return {
    columnsState,
    loadInitialData,
    loadMoreForColumn,
    refreshColumn,
    addLead,
    moveLead,
    updateLead,
    removeLead,
  };
}
