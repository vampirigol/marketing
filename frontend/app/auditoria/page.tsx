'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { obtenerAuditoria, AuditoriaEvento } from '@/lib/auditoria.service';

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<AuditoriaEvento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerAuditoria({ limit: 50 });
        setEventos(data);
      } catch (error) {
        console.error('Error cargando auditoría:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Historial de cambios</h1>
          <p className="text-sm text-gray-600">Últimos eventos registrados en el sistema</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {cargando ? (
            <div className="p-6 text-sm text-gray-500">Cargando auditoría...</div>
          ) : eventos.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No hay eventos registrados.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Entidad</th>
                  <th className="text-left px-4 py-3">Acción</th>
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(evento.fechaEvento).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{evento.entidad}</td>
                    <td className="px-4 py-3 text-gray-700">{evento.accion}</td>
                    <td className="px-4 py-3 text-gray-700">{evento.usuarioNombre || 'Sistema'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {evento.detalles ? JSON.stringify(evento.detalles) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
