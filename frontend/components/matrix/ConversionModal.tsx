'use client';

import { useState } from 'react';
import { Lead } from '@/types/matrix';
import { convertirLeadAPaciente } from '@/lib/conversion.service';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConversionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pacienteId: string) => void;
}

interface ConversionResponse {
  paciente: {
    id: string;
    nombreCompleto: string;
    whatsapp: string;
  };
  cita: {
    especialidad: string;
    horaCita: string;
  };
  whatsappEnviado: boolean;
  tiempoTotal: number;
}

type Step = 'form' | 'loading' | 'success' | 'error';

export function ConversionModal({ lead, isOpen, onClose, onSuccess }: ConversionModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [especialidad, setEspecialidad] = useState('Consulta General');
  const [tipoConsulta, setTipoConsulta] = useState('Consulta Inicial');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConversionResponse | null>(null);
  const [tiempoTotal, setTiempoTotal] = useState(0);

  const handleConvertir = async () => {
    setStep('loading');
    setError(null);

    try {
      const response = await convertirLeadAPaciente(lead, {
        leadId: lead.id,
        especialidad,
        tipoConsulta,
      });

      setResultado(response);
      setTiempoTotal(response.tiempoTotal);
      setStep('success');

      // Auto-cerrar después de 3 segundos
      setTimeout(() => {
        onSuccess?.(response.paciente.id);
        onClose();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en la conversión';
      setError(message);
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold">🔄 Convertir a Paciente</h2>
            <p className="text-blue-100 text-sm">Lead: {lead.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <div className="space-y-4">
              {/* Info del Lead */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-gray-700">Datos del Lead</p>
                <p className="text-sm text-gray-600 mt-1">
                  📧 {lead.email}
                </p>
                <p className="text-sm text-gray-600">
                  📱 {lead.telefono}
                </p>
                <p className="text-sm text-gray-600">
                  💰 Valor: ${lead.valorEstimado}
                </p>
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Consulta General</option>
                  <option>Odontología</option>
                  <option>Dermatología</option>
                  <option>Oftalmología</option>
                  <option>Ortopedia</option>
                </select>
              </div>

              {/* Tipo de Consulta */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Consulta
                </label>
                <select
                  value={tipoConsulta}
                  onChange={(e) => setTipoConsulta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Consulta Inicial</option>
                  <option>Seguimiento</option>
                  <option>Control</option>
                  <option>Revisión</option>
                </select>
              </div>

              {/* Beneficios */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">✨ Beneficios automáticos:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✅ Crear perfil de paciente</li>
                  <li>✅ Agendar cita automática</li>
                  <li>✅ Enviar confirmación WhatsApp</li>
                  <li>✅ Generar recepción</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConvertir}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Convertir Ahora
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-700 font-semibold">Convirtiendo lead...</p>
              <p className="text-gray-500 text-sm mt-2">Creando paciente, cita y enviando confirmación</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-1/3 animate-pulse" />
              </div>
            </div>
          )}

          {step === 'success' && resultado && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-gray-700 font-bold text-lg">¡Conversión Exitosa!</p>
              <p className="text-gray-500 text-sm mt-2">Completado en {tiempoTotal}ms</p>

              {/* Detalles */}
              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-green-900 font-semibold">👤 Paciente</p>
                  <p className="text-green-700">{resultado.paciente.nombreCompleto}</p>
                  <p className="text-green-600 text-xs">ID: {resultado.paciente.id}</p>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-blue-900 font-semibold">📅 Cita Creada</p>
                  <p className="text-blue-700">{resultado.cita.especialidad}</p>
                  <p className="text-blue-600 text-xs">Hora: {resultado.cita.horaCita}</p>
                </div>

                <div className={`p-3 rounded ${resultado.whatsappEnviado ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <p className={`font-semibold ${resultado.whatsappEnviado ? 'text-green-900' : 'text-yellow-900'}`}>
                    {resultado.whatsappEnviado ? '✅ WhatsApp Enviado' : '⏳ WhatsApp Pendiente'}
                  </p>
                  <p className={resultado.whatsappEnviado ? 'text-green-700' : 'text-yellow-700'}>
                    {resultado.paciente.whatsapp}
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-xs mt-4">Cerrando en 3 segundos...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-gray-700 font-bold text-lg">Error en Conversión</p>
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>

              <button
                onClick={() => {
                  setStep('form');
                  setError(null);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Intentar de Nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
