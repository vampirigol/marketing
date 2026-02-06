'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AlertSettings, CustomFieldsSettings, KanbanBoardSettings, KanbanColumnConfig, Lead, LeadStatus } from '@/types/matrix';
import { KanbanColumn } from './KanbanColumn';
import { HeatmapAnalysisModal } from './HeatmapAnalysisModal';
import { ConfirmMoveModal } from './ConfirmMoveModal';
import { BulkActionsBar } from './BulkActionsBar';
import { Search, SlidersHorizontal, RefreshCw, ArrowUpRight, ArrowDownRight, Activity, Bell, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useInfiniteScrollKanban } from '@/hooks/useInfiniteScrollKanban';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { LeadCard } from './LeadCard';
import { DragProvider, useDragContext } from '@/contexts/DragContext';
import { moverLead } from '@/lib/matrix.service';
import { ejecutarWorkflowQualified } from '@/lib/qualified-workflow.service';
import { io, Socket } from 'socket.io-client';
import { AlertSettingsModal } from './AlertSettingsModal';
import { defaultAlertSettings, getAlertSettings, saveAlertSettings } from '@/lib/alerts.utils';
import { ColumnSettingsModal } from './ColumnSettingsModal';
import { DEFAULT_COLUMN_CONFIGS, getKanbanBoardSettings, saveKanbanBoardSettings } from '@/lib/kanban-settings.utils';
import { CustomFieldsModal } from './CustomFieldsModal';
import { DEFAULT_CUSTOM_FIELDS_SETTINGS, getCustomFieldsSettings, saveCustomFieldsSettings } from '@/lib/custom-fields.utils';

interface MatrixKanbanViewProps {
  onLoadMore: (options: { status: LeadStatus; page: number; limit: number }) => Promise<{ leads: Lead[]; hasMore: boolean; total: number }>;
  onLeadClick?: (lead: Lead) => void;
  onOpenConversation?: (conversacionId: string) => void;
  uiVariant?: 'default' | 'bitrix';
  columnConfigs?: KanbanColumnConfig[];
  boardSettingsKey?: string;
  initialStates?: LeadStatus[];
  getPrimaryAction?: (lead: Lead) => { label: string; actionId: 'confirmar' | 'reagendar' | 'llegada' } | null;
  onPrimaryAction?: (lead: Lead, actionId: 'confirmar' | 'reagendar' | 'llegada') => void;
  hideConversionAction?: boolean;
  onMoveLead?: (leadId: string, fromStatus: LeadStatus, toStatus: LeadStatus, lead: Lead) => Promise<void> | void;
}

interface DashboardStats {
  totalLeads: number;
  valorTotal: number;
  nuevosHoy: number;
  calificados: number;
  dealsActivos: number;
}

interface LiveStatsPayload extends Partial<DashboardStats> {
  previousMonth?: Partial<DashboardStats>;
}

function MatrixKanbanViewContent({
  onLoadMore,
  onLeadClick,
  onOpenConversation,
  uiVariant = 'default',
  columnConfigs,
  boardSettingsKey,
  initialStates,
  getPrimaryAction,
  onPrimaryAction,
  hideConversionAction = false,
  onMoveLead,
}: MatrixKanbanViewProps) {
  const isBitrix = uiVariant === 'bitrix';
  const websocketEnabled =
    Boolean(process.env.NEXT_PUBLIC_WEBSOCKET_URL) &&
    process.env.NEXT_PUBLIC_WEBSOCKET_URL !== 'disabled';
  const [busqueda, setBusqueda] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'whatsapp' | 'facebook' | 'instagram'>('todos');
  const [isChannelMenuOpen, setIsChannelMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded');
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'dense'>('comfortable');
  const [confirmMove, setConfirmMove] = useState<{
    lead: Lead;
    targetStatus: LeadStatus;
  } | null>(null);
  const [analysisModal, setAnalysisModal] = useState<{
    status: LeadStatus;
    titulo: string;
    conversionRate: number | null;
    fromCount: number | null;
    toCount: number | null;
  } | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(defaultAlertSettings);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const columnConfigsToUse = useMemo(
    () => (columnConfigs && columnConfigs.length > 0 ? columnConfigs : DEFAULT_COLUMN_CONFIGS),
    [columnConfigs]
  );
  const statesToUse = useMemo(
    () => (initialStates && initialStates.length > 0 ? initialStates : columnConfigsToUse.map((c) => c.id)),
    [initialStates, columnConfigsToUse]
  );
  const [boardSettings, setBoardSettings] = useState<KanbanBoardSettings>({
    hideEmptyColumns: false,
    columns: columnConfigsToUse,
  });
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [customFieldsSettings, setCustomFieldsSettings] = useState<CustomFieldsSettings>(DEFAULT_CUSTOM_FIELDS_SETTINGS);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);
  const [livePrevStats, setLivePrevStats] = useState<DashboardStats | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [bulkActionNotification, setBulkActionNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { clearSelection, selectedLeads } = useDragContext();

  const {
    columnsState,
    loadInitialData,
    loadMoreForColumn,
    moveLead: moveLeadInState,
    updateLead,
    removeLead,
  } = useInfiniteScrollKanban({
    initialLimit: 20,
    loadMoreLimit: 10,
    onLoadMore,
    initialStates: statesToUse,
  });

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere arrastrar 8px para activar (evita clicks accidentales)
      },
    })
  );

  // Cargar datos iniciales al montar
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    setAlertSettings(getAlertSettings());
  }, []);

  useEffect(() => {
    setBoardSettings(
      getKanbanBoardSettings({
        storageKey: boardSettingsKey,
        defaultColumns: columnConfigsToUse,
      })
    );
  }, [boardSettingsKey, columnConfigsToUse]);

  useEffect(() => {
    setCustomFieldsSettings(getCustomFieldsSettings());
  }, []);

  const handleSaveAlertSettings = useCallback((settings: AlertSettings) => {
    saveAlertSettings(settings);
    setAlertSettings(settings);
    setIsAlertSettingsOpen(false);
  }, []);

  const handleSaveBoardSettings = useCallback((settings: KanbanBoardSettings) => {
    saveKanbanBoardSettings(settings, boardSettingsKey);
    setBoardSettings(settings);
    setIsColumnSettingsOpen(false);
  }, [boardSettingsKey]);

  const handleSaveCustomFields = useCallback((settings: CustomFieldsSettings) => {
    saveCustomFieldsSettings(settings);
    setCustomFieldsSettings(settings);
    setIsCustomFieldsOpen(false);
  }, []);

  // Aplicar filtros locales (búsqueda y canal)
  const columnasConFiltros = useMemo(() => {
    const columnasActivas = boardSettings.columns.filter((c) => c.enabled);
    const columnas = columnasActivas.map((config) => {
      const columnState = columnsState[config.id];
      let leadsFiltrados = columnState.leads;

      // Aplicar búsqueda
      if (busqueda) {
        const searchLower = busqueda.toLowerCase();
        leadsFiltrados = leadsFiltrados.filter(
          (lead) =>
            lead.nombre.toLowerCase().includes(searchLower) ||
            lead.email?.toLowerCase().includes(searchLower) ||
            lead.telefono?.includes(busqueda)
        );
      }

      // Aplicar filtro de canal
      if (filtroCanal !== 'todos') {
        leadsFiltrados = leadsFiltrados.filter((lead) => lead.canal === filtroCanal);
      }

      // Calcular valor total
      const valorTotal = leadsFiltrados.reduce((acc, lead) => acc + (lead.valorEstimado || 0), 0);

      return {
        ...config,
        leads: leadsFiltrados,
        valorTotal,
        totalCount: columnState.totalCount,
        isLoading: columnState.isLoading,
        hasMore: columnState.hasMore,
      };
    });

    if (boardSettings.hideEmptyColumns) {
      return columnas.filter((col) => col.leads.length > 0 || col.isLoading);
    }

    return columnas;
  }, [columnsState, busqueda, filtroCanal, boardSettings]);

  const estadisticas = useMemo((): { actual: DashboardStats; anterior: DashboardStats } => {
    const allLeads = Object.values(columnsState).flatMap((col) => col.leads);
    let leadsFiltrados = allLeads;

    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      leadsFiltrados = leadsFiltrados.filter(
        (lead) =>
          lead.nombre.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.telefono?.includes(busqueda)
      );
    }

    if (filtroCanal !== 'todos') {
      leadsFiltrados = leadsFiltrados.filter((lead) => lead.canal === filtroCanal);
    }

    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999);
    const mismoDiaMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate());

    const leadsMesActual = leadsFiltrados.filter((lead) =>
      lead.fechaCreacion >= inicioMesActual && lead.fechaCreacion <= finMesActual
    );
    const leadsMesAnterior = leadsFiltrados.filter((lead) =>
      lead.fechaCreacion >= inicioMesAnterior && lead.fechaCreacion <= finMesAnterior
    );

    const nuevosHoy = leadsFiltrados.filter((lead) =>
      lead.fechaCreacion.toDateString() === ahora.toDateString()
    ).length;

    const nuevosMismoDiaMesAnterior = leadsFiltrados.filter((lead) =>
      lead.fechaCreacion.toDateString() === mismoDiaMesAnterior.toDateString()
    ).length;

    const buildStats = (leads: Lead[], nuevosDia: number): DashboardStats => ({
      totalLeads: leads.length,
      valorTotal: leads.reduce((acc, lead) => acc + (lead.valorEstimado || 0), 0),
      nuevosHoy: nuevosDia,
      calificados: leads.filter((l) => l.status === 'qualified').length,
      dealsActivos: leads.filter((l) => l.status === 'open-deal').length,
    });

    const actual = buildStats(leadsMesActual, nuevosHoy);
    const anterior = buildStats(leadsMesAnterior, nuevosMismoDiaMesAnterior);

    return { actual, anterior };
  }, [columnsState, busqueda, filtroCanal]);

  const listasInteligentes = useMemo(() => {
    const allLeads = Object.values(columnsState).flatMap((col) => col.leads);
    let leadsFiltrados = allLeads;

    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      leadsFiltrados = leadsFiltrados.filter(
        (lead) =>
          lead.nombre.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.telefono?.includes(busqueda)
      );
    }

    if (filtroCanal !== 'todos') {
      leadsFiltrados = leadsFiltrados.filter((lead) => lead.canal === filtroCanal);
    }

    const ahora = new Date();
    const sinRespuesta = leadsFiltrados.filter((lead) => {
      const referencia = lead.fechaUltimoContacto || lead.fechaActualizacion;
      const diff = ahora.getTime() - referencia.getTime();
      return diff > 7 * 24 * 60 * 60 * 1000;
    }).length;

    const contarEtiqueta = (tag: string) =>
      leadsFiltrados.filter((lead) => lead.etiquetas?.includes(tag)).length;

    return [
      {
        title: 'Inasistencia',
        count: contarEtiqueta('Inasistencia'),
        helper: 'No llegaron y requieren contacto',
        tone: 'text-rose-700 bg-rose-50 border-rose-200',
      },
      {
        title: 'Reagendar',
        count: contarEtiqueta('Reagendar'),
        helper: 'Solicitar nueva fecha',
        tone: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      },
      {
        title: 'En espera',
        count: contarEtiqueta('En espera'),
        helper: 'Pendiente de confirmación',
        tone: 'text-amber-700 bg-amber-50 border-amber-200',
      },
      {
        title: 'Perdido',
        count: contarEtiqueta('Perdido'),
        helper: '7 días sin respuesta',
        tone: 'text-slate-700 bg-slate-100 border-slate-200',
      },
      {
        title: 'Sin respuesta',
        count: sinRespuesta,
        helper: 'Requiere reactivación',
        tone: 'text-gray-700 bg-gray-100 border-gray-200',
      },
    ];
  }, [columnsState, busqueda, filtroCanal]);

  const statsActual = liveStats ?? estadisticas.actual;
  const statsAnterior = livePrevStats ?? estadisticas.anterior;

  const statsActualRef = useRef(statsActual);
  const statsAnteriorRef = useRef(statsAnterior);

  useEffect(() => {
    statsActualRef.current = statsActual;
    statsAnteriorRef.current = statsAnterior;
  }, [statsActual, statsAnterior]);

  const calcularCambio = (actual: number, anterior: number) => {
    if (anterior === 0) {
      return {
        percent: actual === 0 ? 0 : 100,
        isPositive: actual > 0,
        isNeutral: actual === 0,
      };
    }

    const diff = ((actual - anterior) / anterior) * 100;
    return {
      percent: diff,
      isPositive: diff > 0,
      isNeutral: diff === 0,
    };
  };

  const formatearPorcentaje = (valor: number) => {
    const rounded = Math.abs(valor).toFixed(1);
    const sign = valor > 0 ? '+' : valor < 0 ? '-' : '';
    return `${sign}${rounded}%`;
  };

  // Refrescar todas las columnas
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  }, [loadInitialData]);

  // WebSocket: métricas en vivo
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!wsUrl || wsUrl === 'disabled') {
      setIsLiveConnected(false);
      return;
    }

    const socket: Socket = io(wsUrl, { transports: ['websocket'] });

    socket.on('connect', () => {
      setIsLiveConnected(true);
      socket.emit('auth', { userId: 'matrix-dashboard', rol: 'Contact_Center' });
    });

    socket.on('disconnect', () => setIsLiveConnected(false));

    socket.on('estadisticas:actualizacion', (data: LiveStatsPayload) => {
      const hasCurrent =
        data.totalLeads !== undefined ||
        data.valorTotal !== undefined ||
        data.nuevosHoy !== undefined ||
        data.calificados !== undefined ||
        data.dealsActivos !== undefined;

      if (hasCurrent) {
        setLiveStats((prev) => ({
          totalLeads: data.totalLeads ?? prev?.totalLeads ?? statsActualRef.current.totalLeads,
          valorTotal: data.valorTotal ?? prev?.valorTotal ?? statsActualRef.current.valorTotal,
          nuevosHoy: data.nuevosHoy ?? prev?.nuevosHoy ?? statsActualRef.current.nuevosHoy,
          calificados: data.calificados ?? prev?.calificados ?? statsActualRef.current.calificados,
          dealsActivos: data.dealsActivos ?? prev?.dealsActivos ?? statsActualRef.current.dealsActivos,
        }));
      }

      if (data.previousMonth) {
        setLivePrevStats((prev) => ({
          totalLeads: data.previousMonth?.totalLeads ?? prev?.totalLeads ?? statsAnteriorRef.current.totalLeads,
          valorTotal: data.previousMonth?.valorTotal ?? prev?.valorTotal ?? statsAnteriorRef.current.valorTotal,
          nuevosHoy: data.previousMonth?.nuevosHoy ?? prev?.nuevosHoy ?? statsAnteriorRef.current.nuevosHoy,
          calificados: data.previousMonth?.calificados ?? prev?.calificados ?? statsAnteriorRef.current.calificados,
          dealsActivos: data.previousMonth?.dealsActivos ?? prev?.dealsActivos ?? statsAnteriorRef.current.dealsActivos,
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handlers de drag & drop
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveDragId(null);
      return;
    }

    const leadId = active.id as string;
    const targetColumnId = over.id.toString().replace('column-', '') as LeadStatus;

    // Encontrar el lead
    const sourceLead = Object.values(columnsState)
      .flatMap(col => col.leads)
      .find(lead => lead.id === leadId);

    if (!sourceLead || sourceLead.status === targetColumnId) {
      setActiveDragId(null);
      return;
    }

    // Si es movimiento a rechazado, mostrar confirmación
    if (targetColumnId === 'rejected') {
      setConfirmMove({
        lead: sourceLead,
        targetStatus: targetColumnId,
      });
      setActiveDragId(null);
      return;
    }

    // Mover directamente
    try {
      if (onMoveLead) {
        await onMoveLead(leadId, sourceLead.status, targetColumnId, sourceLead);
      } else {
        await moverLead(leadId, targetColumnId);
      }
      moveLeadInState(leadId, sourceLead.status, targetColumnId);
      clearSelection();

      if (targetColumnId === 'qualified') {
        const workflowResult = await ejecutarWorkflowQualified({
          ...sourceLead,
          status: targetColumnId,
        });

        updateLead(targetColumnId, leadId, {
          asignadoA: workflowResult.vendedor.nombre,
          fechaActualizacion: new Date(),
          etiquetas: Array.from(new Set([...(sourceLead.etiquetas || []), 'Workflow:Qualified'])),
        });
      }
    } catch (error) {
      console.error('Error al mover lead:', error);
    }

    setActiveDragId(null);
  }, [columnsState, moveLeadInState, clearSelection, updateLead, ejecutarWorkflowQualified, onMoveLead]);

  const handleConfirmMove = useCallback(async () => {
    if (!confirmMove) return;

    try {
      if (onMoveLead) {
        await onMoveLead(confirmMove.lead.id, confirmMove.lead.status, confirmMove.targetStatus, confirmMove.lead);
      } else {
        await moverLead(confirmMove.lead.id, confirmMove.targetStatus);
      }
      moveLeadInState(confirmMove.lead.id, confirmMove.lead.status, confirmMove.targetStatus);
      clearSelection();
    } catch (error) {
      console.error('Error al mover lead:', error);
    }

    setConfirmMove(null);
  }, [confirmMove, moveLeadInState, clearSelection, onMoveLead]);

  // Encontrar el lead activo para el DragOverlay
  const activeLead = useMemo(() => {
    if (!activeDragId) return null;
    return Object.values(columnsState)
      .flatMap(col => col.leads)
      .find(lead => lead.id === activeDragId);
  }, [activeDragId, columnsState]);

  // Obtener todos los leads seleccionados
  const allLeads = useMemo(() => 
    Object.values(columnsState).flatMap(col => col.leads),
    [columnsState]
  );

  const selectedLeadsArray = useMemo(() => {
    return Array.from(selectedLeads).map(id => 
      allLeads.find(lead => lead.id === id)
    ).filter(Boolean) as Lead[];
  }, [selectedLeads, allLeads]);

  // Handler para acciones masivas
  const handleBulkAction = useCallback((action: string, data?: Record<string, unknown>) => {
    let message = '';
    const leadsSeleccionados = selectedLeadsArray;
    switch (action) {
      case 'move':
        message = data ? `${data.count} leads movidos exitosamente` : 'Leads movidos';
        if (data?.targetStatus) {
          leadsSeleccionados.forEach((lead) => {
            if (lead.status !== data.targetStatus) {
              moveLeadInState(lead.id, lead.status, data.targetStatus as LeadStatus);
            }
          });
        }
        break;
      case 'assign':
        message = data ? `${data.count} leads asignados a ${data.vendedor}` : 'Leads asignados';
        if (data?.vendedor) {
          leadsSeleccionados.forEach((lead) => {
            updateLead(lead.status, lead.id, {
              asignadoA: data.vendedor as string,
              fechaActualizacion: new Date(),
            });
          });
        }
        break;
      case 'tag':
        message = data ? `Etiqueta "${data.tag}" agregada a ${data.count} leads` : 'Etiqueta agregada';
        if (data?.tag) {
          leadsSeleccionados.forEach((lead) => {
            const etiquetas = Array.from(new Set([...(lead.etiquetas || []), data.tag as string]));
            updateLead(lead.status, lead.id, { etiquetas });
          });
        }
        break;
      case 'export':
        message = data ? `${data.count} leads exportados a CSV` : 'Leads exportados';
        break;
      case 'delete':
        message = data ? `${data.count} leads eliminados` : 'Leads eliminados';
        leadsSeleccionados.forEach((lead) => {
          removeLead(lead.status, lead.id);
        });
        break;
    }
    setBulkActionNotification({ message, type: 'success' });
    setTimeout(() => setBulkActionNotification(null), 3000);
  }, [selectedLeadsArray, moveLeadInState, updateLead, removeLead]);

  const formatearValor = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const conversionRates = useMemo(() => {
    const order = boardSettings.columns.filter((c) => c.enabled).map((col) => col.id);
    const counts = order.reduce<Record<LeadStatus, number>>((acc, status) => {
      const column = columnsState[status];
      acc[status] = column.totalCount ?? column.leads.length;
      return acc;
    }, {} as Record<LeadStatus, number>);

    const rates = new Map<LeadStatus, { rate: number | null; fromCount: number | null; toCount: number | null }>();
    order.forEach((status, index) => {
      const toCount = counts[status] ?? 0;
      if (index === 0) {
        rates.set(status, { rate: null, fromCount: null, toCount });
        return;
      }

      const prevStatus = order[index - 1];
      const fromCount = counts[prevStatus] ?? 0;
      const rate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;
      rates.set(status, { rate, fromCount, toCount });
    });

    return rates;
  }, [columnsState, boardSettings]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex flex-col h-full ${isBitrix ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100' : 'bg-gray-50'}`}>
      {/* Header con métricas y controles */}
      <div
        className={`${
          isBitrix
            ? 'bg-white/90 border border-slate-200 rounded-2xl shadow-sm mx-6 mt-4 mb-4'
            : 'bg-white border-b border-gray-200'
        } px-6 py-4`}
      >
        <div className="space-y-4">
          {/* Métricas resumidas */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{statsActual.totalLeads}</div>
                  <div className="text-sm text-gray-500">Leads (Mes)</div>
                </div>
                {(() => {
                  const cambio = calcularCambio(statsActual.totalLeads, statsAnterior.totalLeads);
                  const color = cambio.isNeutral
                    ? 'text-gray-400'
                    : cambio.isPositive
                    ? 'text-emerald-600'
                    : 'text-red-600';
                  const Icon = cambio.isPositive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <div className={`flex items-center gap-1 text-xs ${color}`}>
                      {!cambio.isNeutral && <Icon className="w-3.5 h-3.5" />}
                      <span>{formatearPorcentaje(cambio.percent)} vs mes anterior</span>
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-purple-600">{formatearValor(statsActual.valorTotal)}</div>
                  <div className="text-sm text-gray-500">Valor (Mes)</div>
                </div>
                {(() => {
                  const cambio = calcularCambio(statsActual.valorTotal, statsAnterior.valorTotal);
                  const color = cambio.isNeutral
                    ? 'text-gray-400'
                    : cambio.isPositive
                    ? 'text-emerald-600'
                    : 'text-red-600';
                  const Icon = cambio.isPositive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <div className={`flex items-center gap-1 text-xs ${color}`}>
                      {!cambio.isNeutral && <Icon className="w-3.5 h-3.5" />}
                      <span>{formatearPorcentaje(cambio.percent)} vs mes anterior</span>
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-600">{statsActual.nuevosHoy}</div>
                  <div className="text-sm text-gray-500">Nuevos Hoy</div>
                </div>
                {(() => {
                  const cambio = calcularCambio(statsActual.nuevosHoy, statsAnterior.nuevosHoy);
                  const color = cambio.isNeutral
                    ? 'text-gray-400'
                    : cambio.isPositive
                    ? 'text-emerald-600'
                    : 'text-red-600';
                  const Icon = cambio.isPositive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <div className={`flex items-center gap-1 text-xs ${color}`}>
                      {!cambio.isNeutral && <Icon className="w-3.5 h-3.5" />}
                      <span>{formatearPorcentaje(cambio.percent)} vs mes anterior</span>
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-blue-600">{statsActual.calificados}</div>
                  <div className="text-sm text-gray-500">Calificados (Mes)</div>
                </div>
                {(() => {
                  const cambio = calcularCambio(statsActual.calificados, statsAnterior.calificados);
                  const color = cambio.isNeutral
                    ? 'text-gray-400'
                    : cambio.isPositive
                    ? 'text-emerald-600'
                    : 'text-red-600';
                  const Icon = cambio.isPositive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <div className={`flex items-center gap-1 text-xs ${color}`}>
                      {!cambio.isNeutral && <Icon className="w-3.5 h-3.5" />}
                      <span>{formatearPorcentaje(cambio.percent)} vs mes anterior</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-yellow-600">{statsActual.dealsActivos}</div>
                  <div className="text-sm text-gray-500">Deals (Mes)</div>
                </div>
                {(() => {
                  const cambio = calcularCambio(statsActual.dealsActivos, statsAnterior.dealsActivos);
                  const color = cambio.isNeutral
                    ? 'text-gray-400'
                    : cambio.isPositive
                    ? 'text-emerald-600'
                    : 'text-red-600';
                  const Icon = cambio.isPositive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <div className={`flex items-center gap-1 text-xs ${color}`}>
                      {!cambio.isNeutral && <Icon className="w-3.5 h-3.5" />}
                      <span>{formatearPorcentaje(cambio.percent)} vs mes anterior</span>
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Activity
                  className={`w-4 h-4 ${
                    !websocketEnabled
                      ? 'text-amber-500'
                      : isLiveConnected
                      ? 'text-emerald-500'
                      : 'text-gray-300'
                  }`}
                />
                <span>
                  {!websocketEnabled
                    ? 'WebSocket deshabilitado'
                    : isLiveConnected
                    ? 'En vivo (WebSocket)'
                    : 'Sin conexión'}
                </span>
              </div>
            </div>
          </div>

          {/* Listas inteligentes */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className={isBitrix ? 'flex gap-3 overflow-x-auto pb-1' : 'grid grid-cols-2 lg:grid-cols-5 gap-3'}>
              {listasInteligentes.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-lg border px-3 py-2 ${item.tone} ${isBitrix ? 'min-w-[170px]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{item.title}</p>
                    <span className="text-base font-bold">{item.count}</span>
                  </div>
                  <p className="text-[11px] mt-1 opacity-80">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Controles de búsqueda y filtros */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Búsqueda */}
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar leads por nombre, email o teléfono..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 w-full bg-white"
                  />
                </div>

                {/* Filtro de canal */}
                <div className="relative">
                  <button
                    onClick={() => setIsChannelMenuOpen((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                      filtroCanal === 'todos'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filtroCanal === 'todos'
                      ? 'Todos'
                      : filtroCanal === 'whatsapp'
                      ? 'WhatsApp'
                      : filtroCanal === 'facebook'
                      ? 'Facebook'
                      : 'Instagram'}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isChannelMenuOpen && (
                    <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          setFiltroCanal('todos');
                          setIsChannelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          filtroCanal === 'todos' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          setFiltroCanal('whatsapp');
                          setIsChannelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          filtroCanal === 'whatsapp' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          setFiltroCanal('facebook');
                          setIsChannelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          filtroCanal === 'facebook' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Facebook
                      </button>
                      <button
                        onClick={() => {
                          setFiltroCanal('instagram');
                          setIsChannelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          filtroCanal === 'instagram' ? 'bg-pink-50 text-pink-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Instagram
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de configuración y refresh */}
              <div className="flex items-center gap-2 flex-wrap justify-start">
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Refrescar datos"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'compact'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Compacta
                  </button>
                  <button
                    onClick={() => setViewMode('expanded')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'expanded'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Expandida
                  </button>
                </div>


                <button
                  onClick={() => setIsColumnSettingsOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Configurar columnas"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-medium">Columnas</span>
                </button>

                <button
                  onClick={() => setIsCustomFieldsOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Configurar campos"
                >
                  <span className="text-sm font-medium">Campos</span>
                </button>

                <button
                  onClick={() => setIsAlertSettingsOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Configurar alertas"
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">Alertas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de columnas Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {columnasConFiltros.map((columna) => (
            <div key={columna.id} className="w-[280px] flex-shrink-0">
              <KanbanColumn
                id={columna.id}
                titulo={columna.titulo}
                color={columna.color}
                icono={columna.icono}
                leads={columna.leads}
                valorTotal={columna.valorTotal}
                totalCount={columna.totalCount}
                conversionRate={conversionRates.get(columna.id)?.rate ?? null}
                isLoading={columna.isLoading}
                hasMore={columna.hasMore}
                onLeadClick={onLeadClick}
                onOpenConversation={onOpenConversation}
                onLoadMore={() => loadMoreForColumn(columna.id)}
                viewMode={viewMode}
                density={density}
                alertSettings={alertSettings}
                customFieldsSettings={customFieldsSettings}
                getPrimaryAction={getPrimaryAction}
                onPrimaryAction={onPrimaryAction}
                hideConversionAction={hideConversionAction}
                onOpenAnalysis={() => {
                  const rate = conversionRates.get(columna.id);
                  setAnalysisModal({
                    status: columna.id,
                    titulo: columna.titulo,
                    conversionRate: rate?.rate ?? null,
                    fromCount: rate?.fromCount ?? null,
                    toCount: rate?.toCount ?? null,
                  });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeLead ? (
          <div className="opacity-80 scale-105 cursor-grabbing">
            <LeadCard
              lead={activeLead}
              isDragging
              alertSettings={alertSettings}
              customFieldsSettings={customFieldsSettings}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Modal de confirmación */}
      {confirmMove && (
        <ConfirmMoveModal
          lead={confirmMove.lead}
          targetStatus={confirmMove.targetStatus}
          onConfirm={handleConfirmMove}
          onCancel={() => setConfirmMove(null)}
        />
      )}

      {analysisModal && (
        <HeatmapAnalysisModal
          isOpen
          onClose={() => setAnalysisModal(null)}
          status={analysisModal.status}
          titulo={analysisModal.titulo}
          conversionRate={analysisModal.conversionRate}
          fromCount={analysisModal.fromCount}
          toCount={analysisModal.toCount}
        />
      )}

      <ColumnSettingsModal
        isOpen={isColumnSettingsOpen}
        settings={boardSettings}
        onSave={handleSaveBoardSettings}
        onClose={() => setIsColumnSettingsOpen(false)}
      />

      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        settings={alertSettings}
        onSave={handleSaveAlertSettings}
        onClose={() => setIsAlertSettingsOpen(false)}
      />

      <CustomFieldsModal
        isOpen={isCustomFieldsOpen}
        settings={customFieldsSettings}
        onSave={handleSaveCustomFields}
        onClose={() => setIsCustomFieldsOpen(false)}
      />

      {/* Barra de acciones masivas */}
      {selectedLeadsArray.length > 0 && (
        <BulkActionsBar
          selectedLeads={selectedLeadsArray}
          onAction={handleBulkAction}
          onClearSelection={clearSelection}
          columnConfigs={boardSettings.columns.filter((c) => c.enabled)}
        />
      )}

      {/* Notificación de acción masiva */}
      {bulkActionNotification && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in">
          <span>✓</span>
          <span className="text-sm font-medium">{bulkActionNotification.message}</span>
        </div>
      )}
    </div>
    </DndContext>
  );
}

// Wrapper con DragProvider
export function MatrixKanbanView(props: MatrixKanbanViewProps) {
  return (
    <DragProvider>
      <MatrixKanbanViewContent {...props} />
    </DragProvider>
  );
}
