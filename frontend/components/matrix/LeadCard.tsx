'use client';

import { Lead, CanalType, AlertSettings, CustomFieldsSettings, CustomFieldDefinition } from '@/types/matrix';
import { Phone, Mail, Calendar, DollarSign, MessageSquare, MoreVertical, GripVertical, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { memo, useMemo, useState } from 'react';
import { formatearMoneda, formatearFechaRelativa, obtenerIniciales, compararLeads } from '@/lib/kanban.utils';
import { obtenerPrediccionLead } from '@/lib/predictive.utils';
import { evaluarAlertasContextuales, defaultAlertSettings } from '@/lib/alerts.utils';
import { DEFAULT_CUSTOM_FIELDS_SETTINGS, formatCustomFieldValue } from '@/lib/custom-fields.utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDragContext } from '@/contexts/DragContext';
import { ConversionModal } from './ConversionModal';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  onOpenConversation?: (conversacionId: string) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  viewMode?: 'compact' | 'expanded';
  density?: 'comfortable' | 'compact' | 'dense';
  alertSettings?: AlertSettings;
  customFieldsSettings?: CustomFieldsSettings;
}

// Componentes memoizados para iconos de canal (evita recrearlos en cada render)
const IconoCanal = memo(({ canal }: { canal: CanalType }) => {
  switch (canal) {
    case 'whatsapp':
      return <span className="text-xs font-semibold text-green-600">WA</span>;
    case 'facebook':
      return <span className="text-xs font-semibold text-blue-600">FB</span>;
    case 'instagram':
      return <span className="text-xs font-semibold text-pink-600">IG</span>;
  }
});
IconoCanal.displayName = 'IconoCanal';

// Comparador personalizado para evitar re-renders innecesarios
function arePropsEqual(prevProps: LeadCardProps, nextProps: LeadCardProps): boolean {
  return (
    compararLeads(prevProps.lead, nextProps.lead) &&
    prevProps.style === nextProps.style &&
    prevProps.isDragging === nextProps.isDragging
  );
}

export const LeadCard = memo(function LeadCard({
  lead,
  onClick,
  onOpenConversation,
  style,
  isDragging,
  viewMode = 'expanded',
  density = 'comfortable',
  alertSettings = defaultAlertSettings,
  customFieldsSettings = DEFAULT_CUSTOM_FIELDS_SETTINGS,
}: LeadCardProps) {
  const { isLeadSelected, toggleLeadSelection } = useDragContext();
  const isSelected = isLeadSelected(lead.id);
  const [showConversionModal, setShowConversionModal] = useState(false);

  // Setup drag & drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  // Memoizar valores calculados
  const fechaFormateada = useMemo(() => formatearFechaRelativa(lead.fechaCreacion), [lead.fechaCreacion]);
  const valorFormateado = useMemo(() => 
    lead.valorEstimado ? formatearMoneda(lead.valorEstimado) : null,
    [lead.valorEstimado]
  );
  const iniciales = useMemo(() => obtenerIniciales(lead.nombre), [lead.nombre]);
  const vendedorIniciales = useMemo(() =>
    lead.asignadoA ? obtenerIniciales(lead.asignadoA) : '',
    [lead.asignadoA]
  );

  const prediccion = useMemo(() => obtenerPrediccionLead(lead), [lead]);
  const alertas = useMemo(
    () => evaluarAlertasContextuales(lead, alertSettings),
    [lead, alertSettings]
  );

  const camposVisibles = useMemo(() => {
    const visibleSet = new Set(customFieldsSettings.visibleFieldIds);
    return customFieldsSettings.fields.filter((f) => visibleSet.has(f.id));
  }, [customFieldsSettings]);

  const estadoVendedor = lead.estadoVendedor || 'ausente';
  const estadoVendedorLabel =
    estadoVendedor === 'en-llamada'
      ? '🟢 En llamada'
      : estadoVendedor === 'escribiendo'
      ? '✍️ Escribiendo'
      : '🔕 Ausente';

  const showConflicto = Boolean(lead.conflictoEdicion || (lead.editoresActivos && lead.editoresActivos.length > 1));

  // Memoizar etiquetas visibles
  const etiquetasVisibles = useMemo(() => lead.etiquetas.slice(0, 2), [lead.etiquetas]);
  const etiquetasRestantes = useMemo(() => 
    lead.etiquetas.length > 2 ? lead.etiquetas.length - 2 : 0,
    [lead.etiquetas.length]
  );

  const handleClick = (e: React.MouseEvent) => {
    // Multi-selección con Cmd/Ctrl o Shift
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      e.stopPropagation();
      toggleLeadSelection(lead.id, true);
    } else if (onClick) {
      onClick();
    }
  };

  const densityClasses =
    density === 'dense'
      ? 'p-2'
      : density === 'compact'
      ? 'p-2.5'
      : 'p-3';

  const titleClass = density === 'dense' ? 'text-xs' : 'text-sm';

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      style={{ ...style, ...sortableStyle }}
      className={`bg-white border rounded-lg ${densityClasses} hover:shadow-md transition-all cursor-pointer group relative ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      } ${isDragging || isSortableDragging ? 'shadow-lg scale-105' : ''}`}
    >
      {/* Modal de conversión */}
      <ConversionModal
        lead={lead}
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        onSuccess={() => {
          setShowConversionModal(false);
          // Aquí se puede agregar lógica adicional para refrescar el kanban
        }}
      />

      {/* Checkbox de selección */}
      <label
        onClick={(e) => {
          e.stopPropagation();
          toggleLeadSelection(lead.id, true);
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-4 h-4 cursor-pointer accent-blue-500"
        />
      </label>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-7 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Multi-select indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          ✓
        </div>
      )}

      {/* Botón flotante de conversión */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowConversionModal(true);
        }}
        className="absolute top-2 right-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Convertir a paciente"
      >
        <RotateCw className="w-4 h-4" />
      </button>

      {/* Header con avatar y acciones */}
      <div className={`flex items-start justify-between ${viewMode === 'compact' ? 'mb-1' : 'mb-3'} ml-10`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          {viewMode === 'expanded' && lead.avatar ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
              {lead.avatar}
            </div>
          ) : viewMode === 'expanded' ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {iniciales}
            </div>
          ) : null}
          {viewMode === 'compact' && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-[10px]">
              {iniciales}
            </div>
          )}
          
          {/* Nombre */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 truncate ${titleClass}`}>
              {lead.nombre}
            </h3>
            {viewMode === 'expanded' && (
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {fechaFormateada}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Estado del vendedor y acciones */}
        <div className="flex items-center gap-2">
          {lead.asignadoA && (
            <div className="flex items-center gap-2">
              <div className="relative">
                {lead.asignadoAvatar ? (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-base">
                    {lead.asignadoAvatar}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                    {vendedorIniciales}
                  </div>
                )}
                <span
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    estadoVendedor === 'en-llamada'
                      ? 'bg-emerald-500'
                      : estadoVendedor === 'escribiendo'
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                  }`}
                />
              </div>
              {viewMode === 'expanded' ? (
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {estadoVendedorLabel}
                </span>
              ) : (
                <span className="text-[10px] text-gray-500" title={estadoVendedorLabel}>
                  {estadoVendedorLabel.split(' ')[0]}
                </span>
              )}
            </div>
          )}

          {showConflicto && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold" title="Conflicto: varios editores">
              Conflicto
            </span>
          )}

          <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Información de contacto */}
      {viewMode === 'expanded' && (
        <div className="space-y-1.5 mb-3">
          {lead.telefono && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{lead.telefono}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Valor estimado */}
      {valorFormateado && (
        <div className={`flex items-center gap-1.5 ${viewMode === 'compact' ? 'mb-1' : 'mb-3'} px-2 py-1 bg-green-50 rounded border border-green-200`}>
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className={`font-semibold text-green-700 ${viewMode === 'compact' ? 'text-xs' : 'text-sm'}`}>
            {valorFormateado}
          </span>
        </div>
      )}

      {/* Notas (si hay) */}
      {viewMode === 'expanded' && lead.notas && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {lead.notas}
        </p>
      )}

      {/* Alertas contextuales */}
      {viewMode === 'expanded' && alertas.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {alertas.map((alerta) => (
            <span
              key={alerta.id}
              title={alerta.description}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                alerta.severity === 'high'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : alerta.severity === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {alerta.label}
            </span>
          ))}
        </div>
      )}

      {/* Campos personalizados */}
      {viewMode === 'expanded' && camposVisibles.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {camposVisibles.map((field) => {
            const value = lead.customFields?.[field.id];
            const displayValue = formatCustomFieldValue(field, value);
            if (!displayValue) return null;
            return (
              <div key={field.id} className="text-xs text-gray-700 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  {field.label}:
                </span>
                <span className="font-medium">{displayValue}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Análisis predictivo */}
      {viewMode === 'expanded' && (
        <div className="mb-3 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">
              Análisis Predictivo
            </span>
            <span className="text-xs font-bold text-indigo-700">
              {prediccion.probabilidad}%
            </span>
          </div>
          <p className="text-xs text-indigo-900 font-medium">
            {prediccion.insight}
          </p>
          <div className="mt-1.5 text-[11px] text-indigo-800 space-y-0.5">
            <div>
              <span className="font-semibold">Mejor momento:</span> {prediccion.mejorMomento}
            </div>
            <div>
              <span className="font-semibold">Siguiente mejor acción:</span> {prediccion.siguienteAccion}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {prediccion.razones.slice(0, 3).map((razon) => (
              <span key={razon} className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-indigo-200 text-indigo-700">
                {razon}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Canal, Etiquetas y Conversación */}
      <div className={`flex items-center justify-between ${viewMode === 'compact' ? 'pt-1' : 'pt-2'} border-t border-gray-100`}>
        <div className="flex items-center gap-1.5">
          {/* Canal */}
          <div className="px-2 py-0.5 bg-gray-100 rounded flex items-center gap-1">
            <IconoCanal canal={lead.canal} />
          </div>

          {/* Etiquetas */}
          {viewMode === 'expanded' && (
            <>
              {etiquetasVisibles.map((etiqueta, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {etiqueta}
                </Badge>
              ))}
              {etiquetasRestantes > 0 && (
                <span className="text-xs text-gray-500">+{etiquetasRestantes}</span>
              )}
            </>
          )}
        </div>

        {/* Botón para abrir conversación */}
        {lead.conversacionId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenConversation?.(lead.conversacionId!);
            }}
            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
            title="Ver conversación"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </button>
        )}
      </div>
    </div>
  );
}, arePropsEqual);
