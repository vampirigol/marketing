'use client';

import { Clock, User, MapPin, DollarSign, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Cita } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface CitaCardProps {
  cita: Cita;
  onClick?: () => void;
  vista?: 'dia' | 'semana' | 'mes' | 'lista';
}

export function CitaCard({ cita, onClick, vista = 'lista' }: CitaCardProps) {
  const getEstadoColor = (estado: Cita['estado']) => {
    const colores = {
      'Agendada': 'bg-blue-100 text-blue-700 border-blue-200',
      'Confirmada': 'bg-green-100 text-green-700 border-green-200',
      'Llegó': 'bg-purple-100 text-purple-700 border-purple-200',
      'En_Atencion': 'bg-orange-100 text-orange-700 border-orange-200',
      'Finalizada': 'bg-gray-100 text-gray-700 border-gray-200',
      'Cancelada': 'bg-red-100 text-red-700 border-red-200',
      'No_Asistio': 'bg-red-100 text-red-700 border-red-200'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getEstadoIcon = (estado: Cita['estado']) => {
    if (estado === 'Confirmada') return <CheckCircle2 className="w-3 h-3" />;
    if (estado === 'Cancelada' || estado === 'No_Asistio') return <AlertCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const estadoColor = getEstadoColor(cita.estado);
  const estadoIcon = getEstadoIcon(cita.estado);

  // Vista compacta para semana
  if (vista === 'semana') {
    return (
      <div
        className={`text-xs p-1.5 rounded border-l-2 cursor-pointer hover:shadow-sm transition-all ${estadoColor}`}
      >
        <div className="font-medium truncate">{cita.horaCita}</div>
        <div className="text-[10px] opacity-80 truncate">{cita.tipoConsulta}</div>
      </div>
    );
  }

  // Vista completa para día y lista
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${estadoColor} bg-white`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{cita.horaCita}</span>
          {cita.esPromocion && (
            <Badge variant="default" className="bg-purple-600 text-white text-xs px-2 py-0.5">
              🎁 Promo
            </Badge>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${estadoColor}`}>
          {estadoIcon}
          <span className="font-medium">
            {cita.estado.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{cita.pacienteNombre || 'Paciente'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Tag className="w-4 h-4 text-gray-400" />
          <span>{cita.tipoConsulta}</span>
          {cita.especialidad && (
            <>
              <span className="text-gray-400">•</span>
              <span>{cita.especialidad}</span>
            </>
          )}
        </div>

        {cita.medicoAsignado && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>Dr(a). {cita.medicoAsignado}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{cita.sucursalNombre || 'CDMX Centro'}</span>
          </div>
          
          {cita.saldoPendiente > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              <DollarSign className="w-3 h-3" />
              <span className="font-medium">${cita.saldoPendiente}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
