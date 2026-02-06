'use client';

import { AutomationRule } from '@/types/matrix';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Trash2, 
  Edit2, 
  Plus,
  Copy,
  Eye,
  EyeOff,
  History,
  PlayCircle
} from 'lucide-react';
import { 
  eliminarRegla,
  actualizarRegla,
  obtenerImpactoRegla
} from '@/lib/automation-rules.service';
import { SUCURSALES } from '@/lib/doctores-data';

function TooltipBubble({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 z-30">
      {text}
    </span>
  );
}

interface AutomationRulesListProps {
  reglas: AutomationRule[];
  onEdit: (regla: AutomationRule) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, activa: boolean) => void;
  onNew: () => void;
  onDuplicate?: (regla: AutomationRule) => void;
  onShowLogs?: (regla: AutomationRule) => void;
  onSimulate?: (regla: AutomationRule) => void;
  viewMode?: 'list' | 'kanban' | 'grid' | 'flow';
}

export function AutomationRulesList({
  reglas,
  onEdit,
  onDelete,
  onToggleActive,
  onNew,
  onDuplicate,
  onShowLogs,
  onSimulate,
  viewMode = 'list'
}: AutomationRulesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const getRuleTooltip = useCallback((regla: AutomationRule) => {
    const condiciones = regla.condiciones
      .slice(0, 2)
      .map((cond) => cond.label || `${cond.type} ${cond.operator} ${cond.value}`)
      .join(' · ');
    const acciones = regla.acciones
      .slice(0, 2)
      .map((acc) => acc.description || `${acc.type}: ${acc.value}`)
      .join(' · ');
    return `Ejemplo: SI ${condiciones || 'condición'} → ENTONCES ${acciones || 'acción'}`;
  }, []);
  const categoriasOrden = [
    'Nuevas reglas de automatización y disparadores',
    'Elementos recientes',
    'Comunicación con el cliente',
    'Alertas para los empleados',
    'Monitoreo y control de los empleados',
    'Papeleo',
    'Pago',
    'Entrega',
    'Ventas recurrentes',
    'Anuncios',
    'Administrar los elementos del flujo de trabajo',
    'Información del cliente',
    'Productos',
    'Administración de tareas',
    'Almacenamiento y modificación de los datos',
    'Automatización del flujo de trabajo',
    'Otro',
  ];
  const kanbanColumnColors = [
    { header: 'bg-indigo-50 border-indigo-200', body: 'bg-indigo-50/60' },
    { header: 'bg-emerald-50 border-emerald-200', body: 'bg-emerald-50/60' },
    { header: 'bg-amber-50 border-amber-200', body: 'bg-amber-50/60' },
    { header: 'bg-rose-50 border-rose-200', body: 'bg-rose-50/60' },
    { header: 'bg-sky-50 border-sky-200', body: 'bg-sky-50/60' },
    { header: 'bg-purple-50 border-purple-200', body: 'bg-purple-50/60' },
  ];
  const kanbanScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const handleScrollKanban = (direction: 'left' | 'right') => {
    const container = kanbanScrollRef.current;
    if (!container) return;
    const delta = direction === 'left' ? -360 : 360;
    container.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const startAutoScroll = (direction: 'left' | 'right') => {
    const container = kanbanScrollRef.current;
    if (!container) return;
    if (scrollIntervalRef.current) window.clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = window.setInterval(() => {
      container.scrollBy({ left: direction === 'left' ? -16 : 16 });
    }, 40);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      window.clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAutoScroll();
  }, []);
  const reglasPorCategoria = useMemo(() => {
    const grupos: Record<string, AutomationRule[]> = {};
    reglas.forEach((regla) => {
      const categoria = regla.categoria || 'Otro';
      if (!grupos[categoria]) grupos[categoria] = [];
      grupos[categoria].push(regla);
    });
    return grupos;
  }, [reglas]);

  const handleToggle = useCallback(async (id: string, activa: boolean) => {
    await actualizarRegla(id, { activa: !activa });
    onToggleActive(id, !activa);
  }, [onToggleActive]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
      await eliminarRegla(id);
      onDelete(id);
    }
  }, [onDelete]);

  const handleDuplicate = useCallback((regla: AutomationRule) => {
    const nuevaRegla = {
      ...regla,
      id: `rule-${Date.now()}`,
      nombre: `${regla.nombre} (Copia)`,
      activa: false,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };
    onDuplicate?.(nuevaRegla);
  }, [onDuplicate]);

  const handleDuplicateForSucursales = useCallback((regla: AutomationRule) => {
    SUCURSALES.forEach((sucursal) => {
      const nuevaRegla = {
        ...regla,
        id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nombre: `${regla.nombre} · ${sucursal}`,
        activa: false,
        sucursalScope: sucursal,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };
      onDuplicate?.(nuevaRegla);
    });
  }, [onDuplicate]);

  return (
    <div className="space-y-3">
      {/* Botón para crear nueva regla */}
      <button
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        <Plus className="w-5 h-5" />
        Nueva Regla de Automatización
      </button>

      {/* Lista de reglas */}
      {reglas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">No hay reglas creadas aún</p>
          <p className="text-sm text-gray-500">Crea la primera regla para comenzar con automatizaciones</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="relative">
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20"
          >
            <button
              onMouseEnter={() => startAutoScroll('left')}
              onMouseLeave={stopAutoScroll}
              onFocus={() => startAutoScroll('left')}
              onBlur={stopAutoScroll}
              className="h-10 w-10 rounded-full bg-white/80 border border-gray-200 text-gray-600 shadow hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Deslizar a la izquierda"
            >
              ←
            </button>
          </div>
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20"
          >
            <button
              onMouseEnter={() => startAutoScroll('right')}
              onMouseLeave={stopAutoScroll}
              onFocus={() => startAutoScroll('right')}
              onBlur={stopAutoScroll}
              className="h-10 w-10 rounded-full bg-white/80 border border-gray-200 text-gray-600 shadow hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Deslizar a la derecha"
            >
              →
            </button>
          </div>
          <div ref={kanbanScrollRef} className="flex gap-4 overflow-x-auto pb-3 scroll-smooth">
            {categoriasOrden.map((categoria, index) => {
            const reglasCategoria = reglasPorCategoria[categoria] || [];
            if (reglasCategoria.length === 0) return null;
            const color = kanbanColumnColors[index % kanbanColumnColors.length];
            return (
              <div key={categoria} className="w-[320px] flex-shrink-0 space-y-2">
                <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color.header}`}>
                  <h4 className="text-sm font-semibold text-gray-700">{categoria}</h4>
                  <span className="text-xs text-gray-500">{reglasCategoria.length}</span>
                </div>
                <div className={`space-y-2 rounded-lg border border-gray-200 p-2 ${color.body}`}>
                  {reglasCategoria.map((regla: AutomationRule) => (
                    <RuleCard
                      key={regla.id}
                      regla={regla}
                      isExpanded={expandedId === regla.id}
                      onExpand={() => setExpandedId(expandedId === regla.id ? null : regla.id)}
                      onEdit={() => onEdit(regla)}
                      onDelete={() => handleDelete(regla.id)}
                      onToggle={() => handleToggle(regla.id, regla.activa)}
                      onDuplicate={() => handleDuplicate(regla)}
                      onDuplicateForSucursales={() => handleDuplicateForSucursales(regla)}
                      tooltip={getRuleTooltip(regla)}
                      onShowLogs={() => onShowLogs?.(regla)}
                      onSimulate={() => onSimulate?.(regla)}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          {categoriasOrden.map((categoria, index) => {
            const reglasCategoria = reglasPorCategoria[categoria] || [];
            if (reglasCategoria.length === 0) return null;
            const color = kanbanColumnColors[index % kanbanColumnColors.length];
            return (
              <div key={categoria} className="space-y-2">
                <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color.header}`}>
                  <h4 className="text-sm font-semibold text-gray-700">{categoria}</h4>
                  <span className="text-xs text-gray-500">{reglasCategoria.length} reglas</span>
                </div>
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 rounded-lg border border-gray-200 p-3 ${color.body}`}>
                  {reglasCategoria.map((regla: AutomationRule) => (
                    <RuleCard
                      key={regla.id}
                      regla={regla}
                      isExpanded={expandedId === regla.id}
                      onExpand={() => setExpandedId(expandedId === regla.id ? null : regla.id)}
                      onEdit={() => onEdit(regla)}
                      onDelete={() => handleDelete(regla.id)}
                      onToggle={() => handleToggle(regla.id, regla.activa)}
                      onDuplicate={() => handleDuplicate(regla)}
                      onDuplicateForSucursales={() => handleDuplicateForSucursales(regla)}
                      tooltip={getRuleTooltip(regla)}
                      onShowLogs={() => onShowLogs?.(regla)}
                      onSimulate={() => onSimulate?.(regla)}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'flow' ? (
        <div className="space-y-6">
          {categoriasOrden.map((categoria) => {
            const reglasCategoria = reglasPorCategoria[categoria] || [];
            if (reglasCategoria.length === 0) return null;
            return (
              <div key={categoria} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">{categoria}</h4>
                  <span className="text-xs text-gray-500">{reglasCategoria.length} reglas</span>
                </div>
                <div className="space-y-3">
                  {reglasCategoria.map((regla: AutomationRule) => (
                    <div
                      key={regla.id}
                      className={`rounded-xl border p-4 bg-white shadow-sm ${
                        regla.activa ? 'border-emerald-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{regla.nombre}</p>
                          {regla.descripcion && (
                            <p className="text-xs text-gray-500 mt-1">{regla.descripcion}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(regla)}
                            className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(regla.id, regla.activa)}
                            className={`text-xs px-2 py-1 rounded-md ${
                              regla.activa ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {regla.activa ? 'Activa' : 'Pausada'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                          <p className="text-[11px] font-semibold text-blue-700 mb-1">SI</p>
                          <div className="space-y-1 text-xs text-gray-700">
                            {regla.condiciones.map((cond) => (
                              <div key={cond.id}>
                                {cond.label || `Lead ${cond.type} ${cond.operator} ${cond.value}`}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-center text-xs font-semibold text-gray-400">→</div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                          <p className="text-[11px] font-semibold text-emerald-700 mb-1">ENTONCES</p>
                          <div className="space-y-1 text-xs text-gray-700">
                            {regla.acciones.map((acc) => (
                              <div key={acc.id}>
                                {acc.description || `${acc.type}: ${acc.value}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {categoriasOrden.map((categoria) => {
            const reglasCategoria = reglasPorCategoria[categoria] || [];
            if (reglasCategoria.length === 0) return null;
            return (
              <div key={categoria} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">{categoria}</h4>
                  <span className="text-xs text-gray-500">{reglasCategoria.length} reglas</span>
                </div>
                <div className="space-y-2">
                  {reglasCategoria.map((regla: AutomationRule) => (
                    <RuleCard
                      key={regla.id}
                      regla={regla}
                      isExpanded={expandedId === regla.id}
                      onExpand={() => setExpandedId(expandedId === regla.id ? null : regla.id)}
                      onEdit={() => onEdit(regla)}
                      onDelete={() => handleDelete(regla.id)}
                      onToggle={() => handleToggle(regla.id, regla.activa)}
                      onDuplicate={() => handleDuplicate(regla)}
                      onDuplicateForSucursales={() => handleDuplicateForSucursales(regla)}
                      tooltip={getRuleTooltip(regla)}
                      onShowLogs={() => onShowLogs?.(regla)}
                      onSimulate={() => onSimulate?.(regla)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RuleCardProps {
  regla: AutomationRule;
  isExpanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDuplicateForSucursales: () => void;
  tooltip: string;
  onShowLogs: () => void;
  onSimulate: () => void;
  compact?: boolean;
}

function RuleCard({
  regla,
  isExpanded,
  onExpand,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onDuplicateForSucursales,
  tooltip,
  onShowLogs,
  onSimulate,
  compact = false
}: RuleCardProps) {
  const prioridadLabel = regla.prioridad ? regla.prioridad.toUpperCase() : 'MEDIA';
  const prioridadTone =
    regla.prioridad === 'alta'
      ? 'bg-red-100 text-red-700'
      : regla.prioridad === 'baja'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700';
  const horarioTexto = regla.horario
    ? `${regla.horario.dias.join(', ')} · ${regla.horario.inicio}-${regla.horario.fin}`
    : 'Sin horario';
  const impacto = useMemo(() => obtenerImpactoRegla(regla.id), [regla.id]);
  return (
    <div
      className={`border rounded-lg transition-all ${
        regla.activa ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
      } ${compact ? 'shadow-sm' : ''}`}
    >
      {/* Card Header */}
      <div
        onClick={onExpand}
        className={`cursor-pointer hover:bg-opacity-70 transition-colors ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${regla.activa ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="relative group min-w-0">
                  <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'} truncate`}>
                    {regla.nombre}
                  </h3>
                  <TooltipBubble text={tooltip} />
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${prioridadTone}`}>
                  {prioridadLabel}
                </span>
              </div>
              {regla.descripcion && (
                <p className={`text-xs text-gray-600 mt-1 ${compact ? 'line-clamp-2' : ''}`}>
                  {regla.descripcion}
                </p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`relative group p-2 rounded-lg transition-colors ${
                regla.activa
                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {regla.activa ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <TooltipBubble text={regla.activa ? 'Desactivar regla' : 'Activar regla'} />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span>✅ {regla.condiciones.length}</span>
            <span>🔧 {regla.acciones.length}</span>
            <span>📅 {new Date(regla.fechaCreacion).toLocaleDateString()}</span>
            <span className="truncate">🕒 {horarioTexto}</span>
            {regla.sucursalScope && <span>🏥 {regla.sucursalScope}</span>}
            <span>📊 Impacto {impacto.score}</span>
            <span>💰 ROI {impacto.roiEstimado}%</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="relative group p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <TooltipBubble text={`${tooltip}. Haz clic para editar.`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSimulate();
              }}
              className="relative group p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <TooltipBubble text="Simular: ver leads afectados" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowLogs();
              }}
              className="relative group p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
            >
              <History className="w-4 h-4" />
              <TooltipBubble text="Ver historial de esta regla" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="relative group p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <TooltipBubble text={`${tooltip}. Duplica para modificar sin afectar la original.`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="relative group p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <TooltipBubble text="Eliminar regla" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Expandido */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateForSucursales();
              }}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
            >
              Duplicar por sucursal
            </button>
            <span className="text-[11px] text-gray-500">
              Crea copias inactivas para cada sede.
            </span>
          </div>
          {/* Condiciones */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-lg">✅</span> Condiciones (SI...)
            </h4>
            <div className="space-y-2 pl-6">
              {regla.condiciones.map((cond) => (
                <div key={cond.id} className="relative group text-sm text-gray-700 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                  <span className="font-medium">Si:</span> {cond.label || `Lead ${cond.type} ${cond.operator} ${cond.value}`}
                  <TooltipBubble text={cond.label || `Lead ${cond.type} ${cond.operator} ${cond.value}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-lg">🔧</span> Acciones (ENTONCES...)
            </h4>
            <div className="space-y-2 pl-6">
              {regla.acciones.map((acc) => (
                <div key={acc.id} className="relative group text-sm text-gray-700 p-2 bg-green-50 rounded border-l-2 border-green-300">
                  <span className="font-medium">Entonces:</span> {acc.description || `${acc.type}: ${acc.value}`}
                  <TooltipBubble text={acc.description || `${acc.type}: ${acc.value}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
            <p>ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{regla.id}</code></p>
            <p>Creada: {new Date(regla.fechaCreacion).toLocaleString()}</p>
            <p>Actualizada: {new Date(regla.fechaActualizacion).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
