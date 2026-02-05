'use client';

import { Cita } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Phone, MessageSquare, CheckCircle, Clock, MapPin } from 'lucide-react';
import { DOCTORES } from '@/lib/doctores-data';

interface SidebarDiaDetalleProps {
  fecha: Date;
  citas: Cita[];
  onClose: () => void;
  onCitaClick: (cita: Cita) => void;
}

export function SidebarDiaDetalle({ fecha, citas, onClose, onCitaClick }: SidebarDiaDetalleProps) {
  const citasOrdenadas = [...citas].sort((a, b) => {
    const horaA = a.hora || a.horaCita || '00:00';
    const horaB = b.hora || b.horaCita || '00:00';
    return horaA.localeCompare(horaB);
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'Agendada':
      case 'Pendiente_Confirmacion':
      case 'Reagendada':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'En_Espera':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'Cancelada':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'Finalizada':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'Inasistencia':
      case 'No_Asistio':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const estadisticas = {
    confirmadas: citasOrdenadas.filter(c => c.estado === 'Confirmada').length,
    pendientes: citasOrdenadas.filter(c =>
      c.estado === 'Agendada' ||
      c.estado === 'Pendiente_Confirmacion' ||
      c.estado === 'Reagendada'
    ).length,
    ingresos: citasOrdenadas.reduce((sum, c) => sum + (c.montoAbonado || 0), 0)
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold">{citasOrdenadas.length}</div>
            <div className="text-xs opacity-90">Total</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold">{estadisticas.confirmadas}</div>
            <div className="text-xs opacity-90">Confirmadas</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold">${(estadisticas.ingresos / 1000).toFixed(1)}k</div>
            <div className="text-xs opacity-90">Ingresos</div>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {citasOrdenadas.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No hay citas este día</p>
          </div>
        ) : (
          citasOrdenadas.map((cita) => {
            const doctor = DOCTORES.find(d => d.nombre === (cita.doctor || cita.medicoAsignado));
            
            return (
              <div
                key={cita.id}
                onClick={() => onCitaClick(cita)}
                className={`
                  border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                  hover:shadow-lg hover:scale-[1.02]
                  ${getEstadoColor(cita.estado)}
                `}
              >
                {/* Hora y doctor */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                      {cita.hora || cita.horaCita}
                    </div>
                    {doctor && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: doctor.color }}
                        title={doctor.nombre}
                      />
                    )}
                  </div>
                  <span className={`
                    text-xs font-bold px-2 py-1 rounded-lg
                    ${cita.estado === 'Confirmada' ? 'bg-green-600 text-white' :
                      cita.estado === 'Agendada' || cita.estado === 'Pendiente_Confirmacion' || cita.estado === 'Reagendada'
                        ? 'bg-orange-600 text-white'
                        : cita.estado === 'En_Espera'
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'}
                  `}>
                    {cita.estado.replace('_', ' ')}
                  </span>
                </div>

                {/* Paciente */}
                <div className="mb-2">
                  <div className="font-bold text-lg">{cita.pacienteNombre}</div>
                  <div className="text-sm opacity-75">
                    {cita.tipoConsulta || 'Consulta general'}
                  </div>
                </div>

                {/* Doctor y sucursal */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>{cita.doctor || cita.medicoAsignado}</span>
                  </div>
                  {cita.sucursal && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{cita.sucursal}</span>
                    </div>
                  )}
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${cita.pacienteTelefono}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Llamar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://wa.me/${cita.pacienteTelefono?.replace(/\D/g, '')}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
