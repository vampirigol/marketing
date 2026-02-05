'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MatrixKanbanView } from '@/components/matrix/MatrixKanbanView';
import { SUCURSALES } from '@/lib/doctores-data';
import { Lead, LeadStatus } from '@/types/matrix';
import {
  crearEmbudoConfigs,
  obtenerLeadsParaEmbudo,
  paginarLeads,
} from '@/lib/crm-funnels.service';
import { BarChart3, Filter, Target } from 'lucide-react';

export default function CrmPage() {
  const embudos = useMemo(() => crearEmbudoConfigs(SUCURSALES), []);
  const [embudoActivoId, setEmbudoActivoId] = useState(embudos[0]?.id || 'contact-center');
  const [leadsActuales, setLeadsActuales] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const embudoActivo = useMemo(
    () => embudos.find((embudo) => embudo.id === embudoActivoId) || embudos[0],
    [embudos, embudoActivoId]
  );

  useEffect(() => {
    const saved = localStorage.getItem('crmEmbudoActual');
    if (saved && embudos.some((e) => e.id === saved)) {
      setEmbudoActivoId(saved);
    }
  }, [embudos]);

  useEffect(() => {
    if (!embudoActivo) return;
    const cargar = async () => {
      setIsLoading(true);
      const leads = await obtenerLeadsParaEmbudo(embudoActivo);
      setLeadsActuales(leads);
      setIsLoading(false);
    };
    cargar();
  }, [embudoActivo]);

  const handleEmbudoChange = (id: string) => {
    setEmbudoActivoId(id);
    localStorage.setItem('crmEmbudoActual', id);
  };

  const handleLoadMore = useCallback(
    async ({ status, page, limit }: { status: LeadStatus; page: number; limit: number }) => {
      const { leads, total, hasMore } = paginarLeads(leadsActuales, status, page, limit);
      return { leads, total, hasMore };
    },
    [leadsActuales]
  );

  const estadisticas = useMemo(() => {
    const total = leadsActuales.length;
    const valorTotal = leadsActuales.reduce((acc, lead) => acc + (lead.valorEstimado || 0), 0);
    const nuevos = leadsActuales.filter((lead) => lead.status === 'new').length;
    const calificados = leadsActuales.filter((lead) => lead.status === 'qualified').length;
    const negociacion = leadsActuales.filter((lead) => lead.status === 'open-deal').length;
    const tasaConversion = total === 0 ? 0 : Math.round((calificados / total) * 100);

    return { total, valorTotal, nuevos, calificados, negociacion, tasaConversion };
  }, [leadsActuales]);

  const etapasConConteo = useMemo(() => {
    if (!embudoActivo) return [];
    return embudoActivo.etapas.map((etapa) => ({
      ...etapa,
      count: leadsActuales.filter((lead) => lead.status === etapa.id).length,
    }));
  }, [embudoActivo, leadsActuales]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">📌 CRM · Embudos por Sucursal</h1>
                {embudoActivo && (
                  <span className={`text-xs px-2 py-1 rounded-full ${embudoActivo.theme.badge}`}>
                    {embudoActivo.nombre}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona una sucursal para ver etapas, procesos y desempeño del pipeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={embudoActivo?.id}
                  onChange={(e) => handleEmbudoChange(e.target.value)}
                  className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none"
                >
                  {embudos.map((embudo) => (
                    <option key={embudo.id} value={embudo.id}>
                      {embudo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {embudoActivo && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className={`bg-gradient-to-br ${embudoActivo.theme.softBg} border ${embudoActivo.theme.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${embudoActivo.theme.text}`}>Meta mensual</p>
                    <p className="text-2xl font-bold text-gray-900">{embudoActivo.metaMensual}</p>
                  </div>
                  <Target className={`w-8 h-8 ${embudoActivo.theme.accent}`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{embudoActivo.descripcion}</p>
              </div>
              <div className={`bg-gradient-to-br ${embudoActivo.theme.softBg} border ${embudoActivo.theme.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${embudoActivo.theme.text}`}>Conversión</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.tasaConversion}%</p>
                  </div>
                  <BarChart3 className={`w-8 h-8 ${embudoActivo.theme.accent}`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {estadisticas.calificados} calificados · {estadisticas.negociacion} en negociación
                </p>
              </div>
              <div className={`bg-gradient-to-br ${embudoActivo.theme.softBg} border ${embudoActivo.theme.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${embudoActivo.theme.text}`}>Valor pipeline</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${estadisticas.valorTotal.toLocaleString('es-MX')}
                    </p>
                  </div>
                  <Target className={`w-8 h-8 ${embudoActivo.theme.accent}`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {estadisticas.total} oportunidades · {estadisticas.nuevos} nuevas
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200" />

        <div className="flex flex-col min-h-[640px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Cargando embudo y etapas...
              </div>
            ) : (
              <MatrixKanbanView
                key={embudoActivo?.id}
                onLoadMore={handleLoadMore}
                uiVariant="bitrix"
              />
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
