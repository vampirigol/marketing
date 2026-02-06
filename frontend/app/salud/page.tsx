'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { obtenerHealthPanel, HealthPanel } from '@/lib/health.service';

export default function SaludPage() {
  const [panel, setPanel] = useState<HealthPanel | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerHealthPanel();
        setPanel(data);
      } catch (error) {
        console.error('Error cargando panel de salud:', error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de salud</h1>
          <p className="text-sm text-gray-600">Estado de API, WebSocket, BD y schedulers</p>
        </div>

        {cargando ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
            Cargando estado...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">API</p>
              <p className="text-lg font-semibold text-gray-900">{panel?.api.status}</p>
              <p className="text-xs text-gray-400">{panel?.api.timestamp}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">Base de datos</p>
              <p className={`text-lg font-semibold ${panel?.database.connected ? 'text-emerald-600' : 'text-red-600'}`}>
                {panel?.database.connected ? 'Conectada' : 'Sin conexión'}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">WebSocket</p>
              <p className={`text-lg font-semibold ${panel?.websocket.connected ? 'text-emerald-600' : 'text-red-600'}`}>
                {panel?.websocket.connected ? 'Activo' : 'Inactivo'}
              </p>
              <p className="text-xs text-gray-400">{panel?.websocket.clientes} clientes conectados</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">Schedulers</p>
              <p className="text-lg font-semibold text-gray-900">
                {panel?.schedulers.activos}/{panel?.schedulers.total} activos
              </p>
              <p className="text-xs text-gray-400">
                {panel?.schedulers.schedulers.map((s) => s.nombre).join(', ') || 'Sin schedulers'}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
