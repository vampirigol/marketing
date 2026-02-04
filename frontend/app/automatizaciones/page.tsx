'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  obtenerReglas, 
  obtenerLogs,
  obtenerEstadisticas,
  type AutomationRule,
  type AutomationLog
} from '@/lib/automation-rules.service';
import { AutomationRuleBuilder } from '@/components/matrix/AutomationRuleBuilder';
import { AutomationRulesList } from '@/components/matrix/AutomationRulesList';
import { AutomationLogsViewer } from '@/components/matrix/AutomationLogsViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Settings, BarChart3 } from 'lucide-react';

export default function AutomatizacionesPage() {
  const [reglas, setReglas] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [reglaEnEdicion, setReglaEnEdicion] = useState<AutomationRule | null>(null);
  const [activeTab, setActiveTab] = useState('reglas');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar reglas al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = useCallback(() => {
    setIsLoading(true);
    try {
      const reglasObtenidas = obtenerReglas();
      setReglas(reglasObtenidas);

      const logsObtenidos = obtenerLogs({ dias: 7 });
      setLogs(logsObtenidos);
    } catch (error) {
      console.error('Error al cargar datos de automatización:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const logsActualizados = obtenerLogs({ dias: 7 });
      setLogs(logsActualizados);
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
  const handleDuplicateRule = useCallback((regla: AutomationRule) => {
    const nuevaRegla = {
      ...regla,
      id: `rule-${Date.now()}`,
      nombre: `${regla.nombre} (Copia)`,
      activa: false,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };
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
        <div className="grid grid-cols-4 gap-4 mb-8">
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
              onRefresh={cargarDatos}
              onClearOldLogs={cargarDatos}
            />
          </TabsContent>
        </Tabs>

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
