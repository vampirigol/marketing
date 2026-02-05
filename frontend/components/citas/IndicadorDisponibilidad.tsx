'use client';

import { 
  validarDisponibilidadDoctor, 
  esDiaFestivo, 
  doctorEstaAusente,
  obtenerHorarioDoctor 
} from '@/lib/horarios-data';
import { AlertCircle, Clock, Coffee, Flag, X } from 'lucide-react';

interface IndicadorDisponibilidadProps {
  doctorId: string;
  fecha: Date;
  hora: string;
  mostrarDetalle?: boolean;
}

export function IndicadorDisponibilidad({ 
  doctorId, 
  fecha, 
  hora, 
  mostrarDetalle = false 
}: IndicadorDisponibilidadProps) {
  const validacion = validarDisponibilidadDoctor(doctorId, fecha, hora);
  
  if (validacion.disponible) {
    return mostrarDetalle ? (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Disponible</span>
      </div>
    ) : null;
  }

  const festivo = esDiaFestivo(fecha);
  const ausencia = doctorEstaAusente(doctorId, fecha);
  const horario = obtenerHorarioDoctor(doctorId, fecha);

  return (
    <div className={`flex items-center gap-2 ${mostrarDetalle ? 'text-sm' : 'text-xs'} text-red-600`}>
      {festivo && <Flag className="w-3 h-3" />}
      {ausencia && <X className="w-3 h-3" />}
      {!horario && <Clock className="w-3 h-3" />}
      {horario && !validacion.disponible && <Coffee className="w-3 h-3" />}
      <span className="font-medium">{validacion.motivo}</span>
    </div>
  );
}

interface BloqueNoDisponibleProps {
  motivo: string;
  tipo: 'festivo' | 'ausencia' | 'descanso' | 'fuera-horario';
}

export function BloqueNoDisponible({ motivo, tipo }: BloqueNoDisponibleProps) {
  const configs = {
    'festivo': {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-700',
      icon: <Flag className="w-4 h-4" />
    },
    'ausencia': {
      bg: 'bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-700',
      icon: <X className="w-4 h-4" />
    },
    'descanso': {
      bg: 'bg-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      icon: <Coffee className="w-4 h-4" />
    },
    'fuera-horario': {
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-600',
      icon: <Clock className="w-4 h-4" />
    }
  };

  const config = configs[tipo];

  return (
    <div className={`
      absolute inset-0 ${config.bg} ${config.border} border-2 rounded-lg
      flex items-center justify-center pointer-events-none z-10
      opacity-90
    `}>
      <div className={`flex items-center gap-2 ${config.text} font-medium text-xs`}>
        {config.icon}
        <span>{motivo}</span>
      </div>
    </div>
  );
}

interface AlertaDisponibilidadProps {
  doctorId: string;
  fecha: Date;
}

export function AlertaDisponibilidad({ doctorId, fecha }: AlertaDisponibilidadProps) {
  const festivo = esDiaFestivo(fecha);
  const ausencia = doctorEstaAusente(doctorId, fecha);
  const horario = obtenerHorarioDoctor(doctorId, fecha);

  if (!festivo && !ausencia && horario) return null;

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-red-900 text-sm mb-1">No Disponible</h4>
          {festivo && (
            <p className="text-sm text-red-700 mb-1">
              <Flag className="w-3 h-3 inline mr-1" />
              Día festivo: <strong>{festivo.nombre}</strong>
            </p>
          )}
          {ausencia && (
            <p className="text-sm text-red-700 mb-1">
              <X className="w-3 h-3 inline mr-1" />
              {ausencia.tipoAusencia}: <strong>{ausencia.motivo || 'No disponible'}</strong>
            </p>
          )}
          {!horario && !festivo && (
            <p className="text-sm text-red-700">
              <Clock className="w-3 h-3 inline mr-1" />
              El doctor no trabaja este día
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
