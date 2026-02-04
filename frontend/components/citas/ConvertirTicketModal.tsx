/**
 * Componente: ConvertirTicketModal
 * Modal para convertir un ticket abierto en cita cuando llega el paciente
 */

'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { OpenTicket } from '@/lib/openTicket.service';

interface ConvertirTicketModalProps {
  ticket: OpenTicket;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { medicoAsignado?: string; notas?: string }) => void;
  isLoading?: boolean;
}

export const ConvertirTicketModal: React.FC<ConvertirTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [medicoAsignado, setMedicoAsignado] = useState(ticket.medicoPreferido || '');
  const [notas, setNotas] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      medicoAsignado: medicoAsignado || undefined,
      notas: notas || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">🎫 Registrar Llegada de Paciente</h2>
          <p className="text-sm text-blue-100 mt-1">
            Convertir ticket a cita • {ticket.codigo}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            
            {/* Información del ticket */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">📋 Información del Ticket</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Código:</span>
                  <p className="font-mono font-bold text-blue-600">{ticket.codigo}</p>
                </div>
                <div>
                  <span className="text-gray-500">Especialidad:</span>
                  <p className="font-medium text-gray-900">{ticket.especialidad}</p>
                </div>
                <div>
                  <span className="text-gray-500">Costo:</span>
                  <p className="font-medium text-gray-900">
                    ${ticket.costoEstimado.toLocaleString('es-MX')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Requiere pago:</span>
                  <p className="font-medium text-gray-900">
                    {ticket.requierePago ? '✅ Sí' : '❌ No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Consulta anterior */}
            {(ticket.motivoConsultaAnterior || ticket.diagnosticoAnterior || ticket.tratamientoIndicado) && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">🏥 Historial de Consulta Anterior</h3>
                
                {ticket.motivoConsultaAnterior && (
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 font-medium">Motivo:</span>
                    <p className="text-sm text-gray-700">{ticket.motivoConsultaAnterior}</p>
                  </div>
                )}

                {ticket.diagnosticoAnterior && (
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 font-medium">Diagnóstico:</span>
                    <p className="text-sm text-gray-700">{ticket.diagnosticoAnterior}</p>
                  </div>
                )}

                {ticket.tratamientoIndicado && (
                  <div>
                    <span className="text-xs text-blue-600 font-medium">Tratamiento indicado:</span>
                    <p className="text-sm text-gray-700">{ticket.tratamientoIndicado}</p>
                  </div>
                )}
              </div>
            )}

            {/* Médico asignado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👨‍⚕️ Médico que atenderá
                {ticket.medicoPreferido && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Sugerido: {ticket.medicoPreferido})
                  </span>
                )}
              </label>
              <Input
                type="text"
                value={medicoAsignado}
                onChange={(e) => setMedicoAsignado(e.target.value)}
                placeholder="Nombre del médico"
              />
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Notas adicionales (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones sobre la llegada o el estado del paciente..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Aviso importante */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Importante:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>El ticket se marcará como "Utilizado"</li>
                    <li>Se creará una cita automáticamente</li>
                    <li>El paciente pasará directamente a consulta</li>
                    {ticket.requierePago && (
                      <li className="text-red-600">Recordar cobrar: ${ticket.costoEstimado.toLocaleString('es-MX')}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Procesando...' : '✅ Confirmar Llegada'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
