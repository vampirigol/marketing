'use client';

import { AutomationLog } from '@/types/matrix';
import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Filter, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { obtenerLogs, limpiarLogsAntiguos } from '@/lib/automation-rules.service';

interface AutomationLogsViewerProps {
  initialRuleId?: string;
  onRefresh?: () => void;
  onClearOldLogs?: () => void;
}

export function AutomationLogsViewer({
  initialRuleId,
  onRefresh,
  onClearOldLogs
}: AutomationLogsViewerProps) {
  const [filtroRuleId, setFiltroRuleId] = useState('');
  useEffect(() => {
    if (initialRuleId !== undefined) {
      setFiltroRuleId(initialRuleId);
    }
  }, [initialRuleId]);
  const [filtroResultado, setFiltroResultado] = useState<'exitosa' | 'fallida' | 'parcial' | ''>('');
  const [filtroDias, setFiltroDias] = useState(7);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [todosLogs, setTodosLogs] = useState<AutomationLog[]>([]);

  // Obtener logs dinámicamente
  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerLogs({
        ruleId: filtroRuleId || undefined,
        resultado: (filtroResultado as 'exitosa' | 'fallida' | 'parcial' | undefined) || undefined,
        dias: filtroDias
      });
      setTodosLogs(data);
    };
    cargar();
  }, [filtroRuleId, filtroResultado, filtroDias]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = todosLogs.length;
    const exitosas = todosLogs.filter(l => l.resultado === 'exitosa').length;
    const fallidas = todosLogs.filter(l => l.resultado === 'fallida').length;
    const parciales = todosLogs.filter(l => l.resultado === 'parcial').length;

    return {
      total,
      exitosas,
      fallidas,
      parciales,
      tasaExito: total > 0 ? ((exitosas / total) * 100).toFixed(1) : '0'
    };
  }, [todosLogs]);

  // Agrupar por fecha
  const logsPorFecha = useMemo(() => {
    const grupos: Record<string, AutomationLog[]> = {};
    todosLogs.forEach(log => {
      const fecha = new Date(log.fecha).toLocaleDateString();
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(log);
    });
    return Object.entries(grupos).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [todosLogs]);

  const handleDownloadCSV = () => {
    const csv = [
      ['ID', 'Regla', 'Lead', 'Acción', 'Resultado', 'Fecha', 'Mensaje'].join(','),
      ...todosLogs.map(log =>
        [
          log.id,
          log.ruleName,
          log.leadNombre,
          log.accion,
          log.resultado,
          new Date(log.fecha).toLocaleString(),
          log.mensaje || ''
        ]
          .map(v => `"${v}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearOldLogs = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar los logs anteriores a 30 días?')) {
      limpiarLogsAntiguos(30);
      onClearOldLogs?.();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Historial de Automatizaciones
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 border-b">
        <StatCard label="Total" value={stats.total} color="bg-blue-100 text-blue-800" />
        <StatCard label="Exitosas" value={stats.exitosas} color="bg-green-100 text-green-800" />
        <StatCard label="Fallidas" value={stats.fallidas} color="bg-red-100 text-red-800" />
        <StatCard label="Parciales" value={stats.parciales} color="bg-yellow-100 text-yellow-800" />
        <StatCard label="Tasa Éxito" value={`${stats.tasaExito}%`} color="bg-purple-100 text-purple-800" />
      </div>

      {/* Filtros */}
      <div className="p-4 bg-white border-b space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4" />
          Filtros
        </div>

        <div className="grid grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Filtrar por ID de regla..."
            value={filtroRuleId}
            onChange={(e) => setFiltroRuleId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={filtroResultado}
            onChange={(e) => setFiltroResultado(e.target.value as 'exitosa' | 'fallida' | 'parcial' | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los resultados</option>
            <option value="exitosa">Exitosas</option>
            <option value="fallida">Fallidas</option>
            <option value="parcial">Parciales</option>
          </select>

          <select
            value={filtroDias}
            onChange={(e) => setFiltroDias(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Últimas 24 horas</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>

        <button
          onClick={handleClearOldLogs}
          className="text-xs text-gray-600 hover:text-gray-800 underline"
        >
          🗑️ Limpiar logs anteriores a 30 días
        </button>
      </div>

      {/* Logs */}
      <div className="max-h-96 overflow-y-auto">
        {logsPorFecha.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No hay logs que mostrar con los filtros aplicados</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {logsPorFecha.map(([fecha, logsDelDia]) => (
              <div key={fecha} className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{fecha}</h3>

                {logsDelDia.map((log) => (
                  <LogCard
                    key={log.id}
                    log={log}
                    isExpanded={expandedLogId === log.id}
                    onExpand={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`${color} p-3 rounded-lg text-center`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

interface LogCardProps {
  log: AutomationLog;
  isExpanded: boolean;
  onExpand: () => void;
}

function LogCard({ log, isExpanded, onExpand }: LogCardProps) {
  const getResultadoIcon = (resultado: string) => {
    switch (resultado) {
      case 'exitosa':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'fallida':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'parcial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'exitosa':
        return 'bg-green-50 border-green-200';
      case 'fallida':
        return 'bg-red-50 border-red-200';
      case 'parcial':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      onClick={onExpand}
      className={`border cursor-pointer transition-all rounded-lg p-3 ${getResultadoColor(log.resultado)} hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        {getResultadoIcon(log.resultado)}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{log.ruleName}</span>
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
              {new Date(log.fecha).toLocaleTimeString()}
            </span>
          </div>

          <p className="text-sm text-gray-700 mt-1">
            <strong>Lead:</strong> {log.leadNombre} •{' '}
            <strong>Acción:</strong> {log.accion}
          </p>

          {log.mensaje && (
            <p className="text-sm text-gray-600 mt-1 italic">{log.mensaje}</p>
          )}
        </div>

        <div className="text-right">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
            log.resultado === 'exitosa'
              ? 'bg-green-200 text-green-800'
              : log.resultado === 'fallida'
              ? 'bg-red-200 text-red-800'
              : 'bg-yellow-200 text-yellow-800'
          }`}>
            {log.resultado}
          </span>
        </div>
      </div>

      {isExpanded && log.detalles && (
        <div className="mt-3 pt-3 border-t border-gray-300 text-sm">
          <p className="font-semibold text-gray-900 mb-2">Detalles:</p>
          <pre className="bg-black/5 p-2 rounded text-xs overflow-x-auto font-mono">
            {JSON.stringify(log.detalles, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
