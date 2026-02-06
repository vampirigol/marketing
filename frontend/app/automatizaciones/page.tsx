'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  obtenerReglas, 
  obtenerLogs,
  obtenerEstadisticas,
  obtenerAlertasRiesgo,
  ejecutarMotorAutomatizaciones,
  seedReglasSiVacio,
  crearRegla,
  simularRegla,
  type AutomationRule,
  type AutomationLog
} from '@/lib/automation-rules.service';
import { AutomationRuleBuilder } from '@/components/matrix/AutomationRuleBuilder';
import { AutomationRulesList } from '@/components/matrix/AutomationRulesList';
import { AutomationLogsViewer } from '@/components/matrix/AutomationLogsViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Settings, BarChart3, LayoutGrid, Columns3, Waypoints, PlayCircle, PauseCircle } from 'lucide-react';
import { Lead } from '@/types/matrix';
import { io, Socket } from 'socket.io-client';

export default function AutomatizacionesPage() {
  const [reglas, setReglas] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [reglaEnEdicion, setReglaEnEdicion] = useState<AutomationRule | null>(null);
  const [activeTab, setActiveTab] = useState('reglas');
  const [logRuleId, setLogRuleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'flow'>('kanban');
  const [engineEnabled, setEngineEnabled] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'idle' | 'running'>('idle');
  const [simulation, setSimulation] = useState<{
    ruleName: string;
    summary: string;
    leads: Lead[];
  } | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Cargar reglas al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      await seedReglasSiVacio();
      const reglasObtenidas = await obtenerReglas();
      setReglas(reglasObtenidas);

      const logsObtenidos = await obtenerLogs({ dias: 7 });
      setLogs(logsObtenidos);
    } catch (error) {
      console.error('Error al cargar datos de automatización:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const websocketEnabled =
      Boolean(process.env.NEXT_PUBLIC_WEBSOCKET_URL) &&
      process.env.NEXT_PUBLIC_WEBSOCKET_URL !== 'disabled';
    if (!websocketEnabled) return;
    const socket: Socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL as string, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 8000,
    });

    socket.on('connect', () => setIsLiveConnected(true));
    socket.on('disconnect', () => setIsLiveConnected(false));
    socket.on('automation:rules_updated', () => cargarDatos());
    socket.on('automation:logs_updated', () => cargarDatos());

    return () => {
      socket.disconnect();
    };
  }, [cargarDatos]);

  // Guardar regla
  const handleSaveRule = useCallback((regla: AutomationRule) => {
    setReglas(prev => {
      const index = prev.findIndex(r => r.id === regla.id);
      if (index >= 0) {
        // Actualización
        return [...prev.slice(0, index), regla, ...prev.slice(index + 1)];
      } else {
        // Nueva
        return [...prev, regla];
      }
    });

    setIsBuilderOpen(false);
    setReglaEnEdicion(null);

    // Recargar logs
    setTimeout(() => {
      obtenerLogs({ dias: 7 }).then((logsActualizados) => setLogs(logsActualizados));
    }, 500);
  }, []);

  // Editar regla
  const handleEditRule = useCallback((regla: AutomationRule) => {
    setReglaEnEdicion(regla);
    setIsBuilderOpen(true);
    setActiveTab('reglas');
  }, []);

  // Eliminar regla
  const handleDeleteRule = useCallback((id: string) => {
    setReglas(prev => prev.filter(r => r.id !== id));
  }, []);

  // Toggle activa/inactiva
  const handleToggleActive = useCallback((id: string, activa: boolean) => {
    setReglas(prev =>
      prev.map(r => r.id === id ? { ...r, activa } : r)
    );
  }, []);

  // Duplicar regla
  const handleDuplicateRule = useCallback(async (regla: AutomationRule) => {
    const nuevaRegla = await crearRegla({
      nombre: `${regla.nombre} (Copia)`,
      descripcion: regla.descripcion,
      activa: false,
      categoria: regla.categoria,
      prioridad: regla.prioridad,
      rolesPermitidos: regla.rolesPermitidos,
      abTest: regla.abTest,
      sucursalScope: regla.sucursalScope,
      horario: regla.horario,
      slaPorEtapa: regla.slaPorEtapa,
      pausa: regla.pausa,
      condiciones: regla.condiciones,
      acciones: regla.acciones,
    });
    setReglas(prev => [...prev, nuevaRegla]);
  }, []);

  // Cancelar editor
  const handleCancelBuilder = useCallback(() => {
    setIsBuilderOpen(false);
    setReglaEnEdicion(null);
  }, []);

  // Estadísticas
  const estadisticas = useMemo(() => {
    return obtenerEstadisticas();
  }, [logs, reglas]);

  const alertasRiesgo = useMemo(() => obtenerAlertasRiesgo(), [logs]);

  useEffect(() => {
    if (!engineEnabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        setEngineStatus('running');
        await ejecutarMotorAutomatizaciones();
        if (!cancelled) {
          cargarDatos();
        }
      } finally {
        if (!cancelled) setEngineStatus('idle');
      }
    };
    const interval = window.setInterval(run, 60_000);
    run();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [engineEnabled, cargarDatos]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Automatizaciones
          </h1>
          <p className="text-gray-600 mt-2">
            Crea y gestiona reglas de automatización IF-THEN para ejecutar acciones en tu CRM
          </p>
        </div>

        {/* Estadísticas de resumen */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">Total de Reglas</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{estadisticas.totalRules}</p>
            <p className="text-xs text-green-600 mt-2">
              ✅ {estadisticas.activeRules} activas
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Ejecuciones Hoy</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{estadisticas.executionsToday}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 font-medium">Tasa de Éxito</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{estadisticas.successRate}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 font-medium">Total Logs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{logs.length}</p>
            <p className="text-xs text-gray-500 mt-2">Últimos 7 días</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 font-medium">Alertas de riesgo</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{alertasRiesgo.tasaFallo}% fallos</p>
            <p className="text-xs text-gray-500 mt-2">Últimos eventos críticos</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
            <p className="text-sm text-gray-600 font-medium">No show detectados</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{alertasRiesgo.noShowLogs}</p>
            <p className="text-xs text-gray-500 mt-2">Reglas de seguimiento</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-600 font-medium">Mensajería bloqueada</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{alertasRiesgo.mensajesBloqueados}</p>
            <p className="text-xs text-gray-500 mt-2">Regla 7 días en redes</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Motor de automatizaciones</p>
            <p className="text-xs text-gray-500">Ejecuta reglas automáticamente cada 60 segundos.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {isLiveConnected ? 'En vivo' : 'Sin conexión'}
            </span>
            <button
              onClick={() => setEngineEnabled((prev) => !prev)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                engineEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {engineEnabled ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              {engineEnabled ? 'Activo' : 'Inactivo'}
            </button>
            <button
              onClick={async () => {
                setEngineStatus('running');
                await ejecutarMotorAutomatizaciones();
                setEngineStatus('idle');
                cargarDatos();
              }}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Ejecutar ahora
            </button>
            <span className="text-xs text-gray-500">
              {engineStatus === 'running' ? 'Procesando...' : 'Listo'}
            </span>
          </div>
        </div>

        {/* Contenido principal con tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border-b">
            <TabsTrigger value="reglas" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Reglas ({reglas.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Historial ({logs.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Reglas */}
          <TabsContent value="reglas" className="space-y-4">
            <div className="grid grid-cols-3 gap-6">
              {/* Lista de reglas - 2/3 */}
              <div className="col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-700">Vistas</div>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-white">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                      viewMode === 'kanban' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Columns3 className="w-4 h-4" />
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                      viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('flow')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                      viewMode === 'flow' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Waypoints className="w-4 h-4" />
                    Flujo
                  </button>
                </div>
              </div>
              <AutomationRulesList
                  reglas={reglas}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  onToggleActive={handleToggleActive}
                  onNew={() => {
                    setReglaEnEdicion(null);
                    setIsBuilderOpen(true);
                  }}
                  onDuplicate={handleDuplicateRule}
                  onShowLogs={(regla) => {
                    setLogRuleId(regla.id);
                    setActiveTab('logs');
                  }}
                  onSimulate={(regla) => {
                    const resultado = simularRegla(regla.id);
                    setSimulation({
                      ruleName: regla.nombre,
                      summary: resultado.resumen,
                      leads: resultado.leads,
                    });
                  }}
                  viewMode={viewMode}
                />
              </div>

              {/* Builder - 1/3 */}
              <div>
                {isBuilderOpen ? (
                  <AutomationRuleBuilder
                    reglaExistente={reglaEnEdicion}
                    onSave={handleSaveRule}
                    onCancel={handleCancelBuilder}
                    isLoading={isLoading}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-dashed border-gray-300 text-center">
                    <div className="text-4xl mb-3">🛠️</div>
                    <p className="text-gray-600 font-medium">Selecciona una regla para editar o crea una nueva</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Logs */}
          <TabsContent value="logs" className="space-y-4">
              <AutomationLogsViewer
                initialRuleId={logRuleId}
              onRefresh={cargarDatos}
              onClearOldLogs={cargarDatos}
            />
          </TabsContent>
        </Tabs>

        {simulation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Simulación · {simulation.ruleName}</p>
                  <p className="text-xs text-gray-500">{simulation.summary}</p>
                </div>
                <button
                  onClick={() => setSimulation(null)}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  Cerrar
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-4">
                {simulation.leads.length === 0 ? (
                  <p className="text-sm text-gray-600">No hay leads que cumplan condiciones.</p>
                ) : (
                  <div className="space-y-2">
                    {simulation.leads.map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{lead.nombre}</p>
                            <p className="text-xs text-gray-500">{lead.email || lead.telefono}</p>
                          </div>
                          <span className="text-xs text-gray-500">{lead.status}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                          <span>Canal: {lead.canal}</span>
                          {typeof lead.customFields?.Sucursal === 'string' && (
                            <span>Sucursal: {lead.customFields?.Sucursal}</span>
                          )}
                          {typeof lead.customFields?.Servicio === 'string' && (
                            <span>Servicio: {lead.customFields?.Servicio}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info y ejemplos */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-4">💡 Cómo usar Automatizaciones</h3>
          <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-2">Paso 1: Crear Regla</p>
              <p>Haz clic en "Nueva Regla" y define un nombre</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Paso 2: Agregar Condiciones</p>
              <p>Define las condiciones (SI tiempo &gt; 48h, SI valor &gt; $10K, etc)</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Paso 3: Definir Acciones</p>
              <p>Especifica qué debe ocurrir (mover, asignar, etiquetar, notificar)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
