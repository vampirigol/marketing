'use client';

import { Button } from '@/components/ui/Button';
import { 
  X, 
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileText
} from 'lucide-react';
import { useState } from 'react';

interface Cita {
  id: string;
  hora: string;
  paciente: {
    id: string;
    nombre: string;
    telefono: string;
  };
  servicio: string;
  doctor: string;
  consultorio: string;
}

interface MarcarLlegadaModalProps {
  cita: Cita;
  onClose: () => void;
  onConfirm: (data: {
    horaLlegada: string;
    notas?: string;
    requierePago: boolean;
    montoAdeudado?: number;
  }) => void;
}

export function MarcarLlegadaModal({ cita, onClose, onConfirm }: MarcarLlegadaModalProps) {
  const [horaLlegada, setHoraLlegada] = useState(
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  );
  const [notas, setNotas] = useState('');
  const [requierePago, setRequierePago] = useState(false);
  const [montoAdeudado, setMontoAdeudado] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      horaLlegada,
      notas: notas || undefined,
      requierePago,
      montoAdeudado: requierePago ? parseFloat(montoAdeudado) : undefined
    });
  };

  const esRetrasada = () => {
    const horaCita = cita.hora.split(':');
    const horaLlegadaArray = horaLlegada.split(':');
    const minutosRetraso = 
      (parseInt(horaLlegadaArray[0]) * 60 + parseInt(horaLlegadaArray[1])) -
      (parseInt(horaCita[0]) * 60 + parseInt(horaCita[1]));
    return minutosRetraso > 15;
  };

  const esAnticipada = () => {
    const horaCita = cita.hora.split(':');
    const horaLlegadaArray = horaLlegada.split(':');
    const minutosAnticipacion = 
      (parseInt(horaCita[0]) * 60 + parseInt(horaCita[1])) -
      (parseInt(horaLlegadaArray[0]) * 60 + parseInt(horaLlegadaArray[1]));
    return minutosAnticipacion > 5;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Marcar Llegada</h2>
                <p className="text-green-100 mt-1">Registrar asistencia del paciente</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-green-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información de la Cita */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información de la Cita
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Paciente:</p>
                <p className="font-medium text-gray-900">{cita.paciente.nombre}</p>
              </div>
              <div>
                <p className="text-gray-600">Hora programada:</p>
                <p className="font-medium text-gray-900">{cita.hora}</p>
              </div>
              <div>
                <p className="text-gray-600">Servicio:</p>
                <p className="font-medium text-gray-900">{cita.servicio}</p>
              </div>
              <div>
                <p className="text-gray-600">Doctor:</p>
                <p className="font-medium text-gray-900">{cita.doctor}</p>
              </div>
            </div>
          </div>

          {/* Hora de Llegada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de Llegada
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="time"
                value={horaLlegada}
                onChange={(e) => setHoraLlegada(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium"
                required
              />
            </div>
            
            {/* Alertas de horario */}
            {esRetrasada() && (
              <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900">Llegada retrasada</p>
                  <p className="text-orange-700">El paciente llegó más de 15 minutos tarde.</p>
                </div>
              </div>
            )}
            
            {esAnticipada() && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Llegada anticipada</p>
                  <p className="text-blue-700">El paciente llegó antes de la hora programada.</p>
                </div>
              </div>
            )}
          </div>

          {/* Pago Pendiente */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 font-medium text-gray-900">
                <CreditCard className="w-5 h-5" />
                ¿Requiere pago?
              </label>
              <button
                type="button"
                onClick={() => setRequierePago(!requierePago)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  requierePago ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    requierePago ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {requierePago && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Adeudado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    value={montoAdeudado}
                    onChange={(e) => setMontoAdeudado(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required={requierePago}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Paciente llegó con síntomas de gripe..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button 
              type="button"
              variant="secondary" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              variant="success" 
              className="flex items-center gap-2"
              onClick={handleSubmit}
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Llegada
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
