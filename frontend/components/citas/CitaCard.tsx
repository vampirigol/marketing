'use client';

import { Clock, User, MapPin, DollarSign, Tag, AlertCircle, CheckCircle2, Phone, MessageSquare, Calendar, CheckCheck, XCircle } from 'lucide-react';
import { Cita } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';

interface CitaCardProps {
  cita: Cita;
  onClick?: () => void;
  vista?: 'dia' | 'semana' | 'mes' | 'lista';
  onQuickConfirm?: (citaId: string) => void;
  onQuickCancel?: (citaId: string) => void;
  onQuickCall?: (telefono: string) => void;
  onQuickWhatsApp?: (telefono: string) => void;
}

export function CitaCard({ cita, onClick, vista = 'lista', onQuickConfirm, onQuickCancel, onQuickCall, onQuickWhatsApp }: CitaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`group relative p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${estadoColor} bg-white ${isHovered ? 'scale-[1.02]' : ''}`}
    >
      {/* Quick Actions - Aparecen en hover */}
      {isHovered && vista === 'lista' && (
        <div className="absolute -top-2 right-2 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          {cita.estado === 'Agendada' && onQuickConfirm && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickConfirm(cita.id);
              }}
              className="p-1.5 hover:bg-green-50 rounded-md transition-colors group/btn"
              title="Confirmar cita"
            >
              <CheckCheck className="w-4 h-4 text-green-600 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
          {onQuickCall && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickCall(cita.pacienteTelefono);
              }}
              className="p-1.5 hover:bg-blue-50 rounded-md transition-colors group/btn"
              title="Llamar"
            >
              <Phone className="w-4 h-4 text-blue-600 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
          {onQuickWhatsApp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickWhatsApp(cita.pacienteTelefono);
              }}
              className="p-1.5 hover:bg-green-50 rounded-md transition-colors group/btn"
              title="WhatsApp"
            >
              <MessageSquare className="w-4 h-4 text-green-600 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
          {cita.estado !== 'Cancelada' && cita.estado !== 'Finalizada' && onQuickCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('¿Cancelar esta cita?')) {
                  onQuickCancel(cita.id);
                }
              }}
              className="p-1.5 hover:bg-red-50 rounded-md transition-colors group/btn"
              title="Cancelar cita"
            >
              <XCircle className="w-4 h-4 text-red-600 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{cita.horaCita}</span>
          {cita.esPromocion && (
            <Badge variant="default" className="bg-purple-600 text-white text-xs px-2 py-0.5 animate-pulse">
              🎁 Promo
            </Badge>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${estadoColor} ${cita.estado === 'En_Atencion' ? 'animate-pulse' : ''}`}>
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
