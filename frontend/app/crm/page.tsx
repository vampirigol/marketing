'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MatrixKanbanView } from '@/components/matrix/MatrixKanbanView';
import { SUCURSALES } from '@/lib/doctores-data';
import { Lead, LeadStatus } from '@/types/matrix';
import {
  CRM_COLUMN_CONFIGS,
  crearEmbudoConfigs,
  obtenerAccionPrimariaLead,
  obtenerLeadsParaEmbudo,
  paginarLeads,
  persistirMovimientoLead,
} from '@/lib/crm-funnels.service';
import Link from 'next/link';
import { Filter, Target, UserCheck, UserX, Settings } from 'lucide-react';

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
    const confirmadas = leadsActuales.filter((lead) => lead.status === 'open').length;
    const pendientes = leadsActuales.filter((lead) => lead.status === 'in-progress').length;
    const cierres = leadsActuales.filter((lead) => lead.status === 'qualified').length;
    const atendidas = leadsActuales.filter(
      (lead) => lead.status === 'qualified' && lead.customFields?.CRM_Resultado === 'Atendida'
    ).length;
    const noShow = leadsActuales.filter(
      (lead) => lead.status === 'qualified' && lead.customFields?.CRM_Resultado === 'No show'
    ).length;
    const confirmacionBase = confirmadas + pendientes;
    const confirmacionRate = confirmacionBase === 0 ? 0 : Math.round((confirmadas / confirmacionBase) * 100);
    const asistenciaBase = atendidas + noShow;
    const asistenciaRate = asistenciaBase === 0 ? 0 : Math.round((atendidas / asistenciaBase) * 100);
    const noShowRate = asistenciaBase === 0 ? 0 : Math.round((noShow / asistenciaBase) * 100);

    return {
      total,
      confirmadas,
      pendientes,
      cierres,
      atendidas,
      noShow,
      confirmacionRate,
      asistenciaRate,
      noShowRate,
    };
  }, [leadsActuales]);

  const handleMoveLead = useCallback(
    async (leadId: string, _fromStatus: LeadStatus, toStatus: LeadStatus) => {
      if (!embudoActivo) return;
      const actualizado = await persistirMovimientoLead(embudoActivo.id, leadId, toStatus);
      if (!actualizado) return;
      setLeadsActuales((prev) =>
        prev.map((lead) => (lead.id === leadId ? actualizado : lead))
      );
    },
    [embudoActivo]
  );

  const handlePrimaryAction = useCallback(
    async (lead: Lead, actionId: 'confirmar' | 'reagendar' | 'llegada') => {
      if (!embudoActivo) return;
      let nuevoStatus: LeadStatus = lead.status;
      let resultado: string | undefined = lead.customFields?.CRM_Resultado as string | undefined;

      if (actionId === 'confirmar') {
        nuevoStatus = 'open';
        resultado = undefined;
      }
      if (actionId === 'llegada') {
        nuevoStatus = 'qualified';
        resultado = 'Atendida';
      }
      if (actionId === 'reagendar') {
        nuevoStatus = 'in-progress';
        resultado = undefined;
      }

      const extraFields = resultado ? { CRM_Resultado: resultado } : undefined;
      const actualizado = await persistirMovimientoLead(embudoActivo.id, lead.id, nuevoStatus, extraFields);
      if (!actualizado) return;
      const nextLead = {
        ...actualizado,
        customFields: {
          ...(actualizado.customFields || {}),
          ...(resultado ? { CRM_Resultado: resultado } : {}),
        },
      };
      setLeadsActuales((prev) => prev.map((item) => (item.id === lead.id ? nextLead : item)));
    },
    [embudoActivo]
  );

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
              <Link
                href="/automatizaciones"
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <Settings className="w-4 h-4" />
                Automatizaciones CRM
              </Link>
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
                    <p className={`text-xs font-semibold ${embudoActivo.theme.text}`}>Confirmación</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.confirmacionRate}%</p>
                  </div>
                  <Target className={`w-8 h-8 ${embudoActivo.theme.accent}`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {estadisticas.confirmadas} confirmadas · {estadisticas.pendientes} pendientes
                </p>
              </div>
              <div className={`bg-gradient-to-br ${embudoActivo.theme.softBg} border ${embudoActivo.theme.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${embudoActivo.theme.text}`}>Asistencia</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.asistenciaRate}%</p>
                  </div>
                  <UserCheck className={`w-8 h-8 ${embudoActivo.theme.accent}`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {estadisticas.atendidas} atendidas · {estadisticas.cierres} en cierre
                </p>
              </div>
              <div className={`bg-gradient-to-br ${embudoActivo.theme.softBg} border ${embudoActivo.theme.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${embudoActivo.theme.text}`}>No-show</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.noShowRate}%</p>
                  </div>
                  <UserX className={`w-8 h-8 ${embudoActivo.theme.accent}`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {estadisticas.noShow} no-show · {estadisticas.total} leads
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
                columnConfigs={CRM_COLUMN_CONFIGS}
                boardSettingsKey="crm.kanbanBoardSettings"
                initialStates={CRM_COLUMN_CONFIGS.map((col) => col.id)}
                getPrimaryAction={obtenerAccionPrimariaLead}
                onPrimaryAction={handlePrimaryAction}
                onMoveLead={handleMoveLead}
              />
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
