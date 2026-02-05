'use client';

import { CheckCircle2, X, Calendar, Clock, MapPin, User, Stethoscope } from 'lucide-react';
import { Button } from './Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  data: {
    pacienteNombre: string;
    doctorNombre: string;
    fecha: string;
    hora: string;
    sucursalNombre: string;
    servicioNombre?: string;
  };
}

export function SuccessModal({ isOpen, onClose, title = 'Cita agendada exitosamente', data }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200">
          {/* Header con ícono de éxito */}
          <div className="relative pt-10 pb-6">
            {/* Círculo de éxito animado */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-green-400 rounded-full animate-ping opacity-75" />
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center px-8 mt-6">
              {title}
            </h3>
          </div>

          {/* Contenido */}
          <div className="px-8 pb-8">
            <div className="space-y-4">
              {/* Paciente */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-600 uppercase mb-0.5">Paciente</p>
                  <p className="font-semibold text-gray-900 truncate">{data.pacienteNombre}</p>
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-purple-600 uppercase mb-0.5">Doctor</p>
                  <p className="font-semibold text-gray-900 truncate">{data.doctorNombre}</p>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-600 uppercase mb-0.5">Fecha</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{data.fecha}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-orange-600 uppercase mb-0.5">Hora</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{data.hora}</p>
                  </div>
                </div>
              </div>

              {/* Sucursal */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 uppercase mb-0.5">Sucursal</p>
                  <p className="font-semibold text-gray-900 truncate">{data.sucursalNombre}</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={onClose}
              >
                Entendido
              </Button>
            </div>

            {/* Mensaje adicional */}
            <p className="text-center text-xs text-gray-500 mt-4">
              La cita ha sido agregada al calendario
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
