'use client';

import { Lead, LeadStatus } from '@/types/matrix';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmMoveModalProps {
  lead: Lead;
  targetStatus: LeadStatus;
  onConfirm: () => void;
  onCancel: () => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  reviewing: 'En Revisión',
  rejected: 'Rechazado',
  qualified: 'Calificado',
  open: 'Abierto',
  'in-progress': 'En Progreso',
  'open-deal': 'Negociación',
};

export function ConfirmMoveModal({
  lead,
  targetStatus,
  onConfirm,
  onCancel,
}: ConfirmMoveModalProps) {
  const isRejecting = targetStatus === 'rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isRejecting ? 'bg-red-50 border-red-200' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            {isRejecting && <AlertTriangle className="w-5 h-5 text-red-600" />}
            <h3 className={`text-lg font-semibold ${
              isRejecting ? 'text-red-900' : 'text-gray-900'
            }`}>
              {isRejecting ? 'Confirmar Rechazo' : 'Confirmar Movimiento'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {isRejecting ? (
              <>
                ¿Estás seguro de que quieres <strong className="text-red-600">rechazar</strong> este lead?
              </>
            ) : (
              <>
                ¿Mover este lead a <strong>{STATUS_LABELS[targetStatus]}</strong>?
              </>
            )}
          </p>

          {/* Lead Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="font-semibold text-gray-900">{lead.nombre}</div>
            <div className="text-sm text-gray-600">{lead.email || lead.telefono}</div>
            {lead.valorEstimado && (
              <div className="text-sm text-gray-600 mt-1">
                Valor estimado: {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(lead.valorEstimado)}
              </div>
            )}
          </div>

          {isRejecting && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                ⚠️ Esta acción moverá el lead a la columna de rechazados. Podrás recuperarlo más tarde si lo necesitas.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isRejecting
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRejecting ? 'Rechazar Lead' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
