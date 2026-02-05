'use client';

import { CheckCircle, Clock, XCircle, AlertCircle, Activity } from 'lucide-react';

export function LeyendaEstados() {
  const estados = [
    { nombre: 'Confirmada', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { nombre: 'Pendiente', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { nombre: 'Cancelada', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { nombre: 'No Asistió', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { nombre: 'En Atención', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' }
  ];

  const densidades = [
    { nombre: 'Baja', color: 'bg-green-500', rango: '1-4 citas' },
    { nombre: 'Media', color: 'bg-yellow-500', rango: '5-8 citas' },
    { nombre: 'Alta', color: 'bg-red-500', rango: '9+ citas' }
  ];

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Leyenda de Estados */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">📋 Estados de Citas</h4>
          <div className="space-y-2">
            {estados.map(({ nombre, icon: Icon, color, bg }) => (
              <div key={nombre} className="flex items-center gap-2">
                <div className={`${bg} rounded-lg p-1.5`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm text-gray-700">{nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda de Densidad */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">🔥 Densidad de Ocupación</h4>
          <div className="space-y-2">
            {densidades.map(({ nombre, color, rango }) => (
              <div key={nombre} className="flex items-center gap-2">
                <div className={`${color} w-5 h-5 rounded`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{nombre}</div>
                  <div className="text-xs text-gray-500">{rango}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips adicionales */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
            <span>Hover sobre un día para ver detalles completos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span>Click en un día para ver lista de citas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Los colores de fondo indican el mapa de calor de ocupación</span>
          </div>
        </div>
      </div>
    </div>
  );
}
