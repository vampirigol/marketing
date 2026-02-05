'use client';

import { AlertSettings, CustomFieldsSettings, Lead, LeadStatus } from '@/types/matrix';
import { LeadCard } from './LeadCard';
import { Plus, Loader2, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { memo, useMemo } from 'react';
import { formatearMoneda, obtenerClasesColor } from '@/lib/kanban.utils';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface KanbanColumnProps {
  id: LeadStatus;
  titulo: string;
  color: string;
  icono: string;
  leads: Lead[];
  valorTotal?: number;
  totalCount?: number;
  conversionRate?: number | null;
  isLoading?: boolean;
  hasMore?: boolean;
  onLeadClick?: (lead: Lead) => void;
  onOpenConversation?: (conversacionId: string) => void;
  onAddLead?: () => void;
  onLoadMore?: () => void;
  onOpenAnalysis?: () => void;
  viewMode?: 'compact' | 'expanded';
  density?: 'comfortable' | 'compact' | 'dense';
  alertSettings?: AlertSettings;
  customFieldsSettings?: CustomFieldsSettings;
}

// Comparador personalizado para optimizar re-renders
function arePropsEqual(prevProps: KanbanColumnProps, nextProps: KanbanColumnProps): boolean {
  // Solo re-renderizar si cambian los leads, el valor total o el título
  if (
    prevProps.titulo !== nextProps.titulo ||
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.hasMore !== nextProps.hasMore ||
    prevProps.totalCount !== nextProps.totalCount ||
    prevProps.conversionRate !== nextProps.conversionRate ||
    prevProps.viewMode !== nextProps.viewMode ||
    prevProps.density !== nextProps.density
  ) {
    return false;
  }

  // Comparación rápida de IDs de leads (suficiente para detectar cambios)
  for (let i = 0; i < prevProps.leads.length; i++) {
    if (
      prevProps.leads[i].id !== nextProps.leads[i].id ||
      prevProps.leads[i].fechaActualizacion?.getTime() !== nextProps.leads[i].fechaActualizacion?.getTime()
    ) {
      return false;
    }
  }

  return true;
}

export const KanbanColumn = memo(function KanbanColumn({
  id,
  titulo,
  color,
  icono,
  leads,
  valorTotal,
  totalCount,
  conversionRate,
  isLoading = false,
  hasMore = false,
  onLeadClick,
  onOpenConversation,
  onAddLead,
  onLoadMore,
  onOpenAnalysis,
  viewMode = 'expanded',
  density = 'comfortable',
  alertSettings,
  customFieldsSettings,
}: KanbanColumnProps) {
  
  // Setup droppable zone
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
    data: {
      type: 'column',
      status: id,
    },
  });

  // IDs para SortableContext
  const leadIds = useMemo(() => leads.map(lead => lead.id), [leads]);

  // Memoizar clases de color (se calcula una sola vez por color)
  const colors = useMemo(() => obtenerClasesColor(color), [color]);

  // Memoizar valor formateado
  const valorFormateado = useMemo(() => 
    valorTotal && valorTotal > 0 ? formatearMoneda(valorTotal, true) : null,
    [valorTotal]
  );

  // Memoizar texto del contador
  const textoContador = useMemo(() => {
    const base = `${leads.length} ${leads.length === 1 ? 'Lead' : 'Leads'}`;
    if (totalCount !== undefined && totalCount > leads.length) {
      return `${base} / ${totalCount}`;
    }
    return base;
  }, [leads.length, totalCount]);

  const heatClass = useMemo(() => {
    if (conversionRate === null || conversionRate === undefined) return 'bg-gray-100 text-gray-500';
    if (conversionRate > 70) return 'bg-emerald-500 text-white';
    if (conversionRate < 20) return 'bg-red-500 text-white';
    return 'bg-yellow-400 text-gray-900';
  }, [conversionRate]);

  const heatBorderClass = useMemo(() => {
    if (conversionRate === null || conversionRate === undefined) return 'border-gray-200';
    if (conversionRate > 70) return 'border-emerald-400';
    if (conversionRate < 20) return 'border-red-400';
    return 'border-yellow-300';
  }, [conversionRate]);

  // Nota: Row y ITEM_SIZE se comentaron al migrar de virtualización a scroll simple para debug
  // const Row = ... (removed for simpler debugging)
  // const ITEM_SIZE = 220; (removed)
  // const itemCount = ... (removed)

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-lg transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'
      }`}
    >
      {/* Header de la columna */}
      <div className={`${colors.bg} ${colors.border} border-b p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icono}</span>
            <h3 className={`font-semibold text-sm ${colors.text}`}>{titulo}</h3>
          </div>
          
          {onAddLead && (
            <button
              onClick={onAddLead}
              className={`p-1 hover:bg-white/50 rounded transition-colors`}
              title="Agregar lead"
            >
              <Plus className={`w-4 h-4 ${colors.text}`} />
            </button>
          )}
        </div>

        {/* Contador y valor total */}
        <div className="flex items-center justify-between">
          <div className={`px-2 py-0.5 ${colors.badge} rounded-full text-xs font-semibold`}>
            {textoContador}
          </div>
          
          {valorFormateado && (
            <div className={`text-xs font-semibold ${colors.text}`}>
              {valorFormateado}
            </div>
          )}
        </div>

        {/* Heatmap de conversión */}
        <div className="mt-2 flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${heatClass} ${heatBorderClass}`}>
            {conversionRate !== null && conversionRate !== undefined ? (
              <>
                {conversionRate >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(conversionRate).toFixed(1)}%</span>
              </>
            ) : (
              <span>Sin referencia</span>
            )}
          </div>

          {onOpenAnalysis && (
            <button
              onClick={onOpenAnalysis}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
              title="Ver análisis"
            >
              <Info className="w-3.5 h-3.5" />
              Análisis
            </button>
          )}
        </div>
      </div>

      {/* Lista de leads con virtualización y sortable */}
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto">
          {leads.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Sin leads</p>
              <p className="text-xs mt-1">Arrastra leads aquí</p>
            </div>
          ) : isLoading && leads.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            // Versión simplificada sin virtualización para debug
            <div
              className={
                density === 'dense'
                  ? 'space-y-1.5 p-2'
                  : density === 'compact'
                  ? 'space-y-2 p-2.5'
                  : 'space-y-3 p-3'
              }
            >
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick?.(lead)}
                  onOpenConversation={onOpenConversation}
                  viewMode={viewMode}
                  density={density}
                  alertSettings={alertSettings}
                  customFieldsSettings={customFieldsSettings}
                />
              ))}
              
              {hasMore && (
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Cargar más</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}, arePropsEqual);
