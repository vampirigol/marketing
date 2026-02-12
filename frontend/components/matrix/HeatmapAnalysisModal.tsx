'use client';

import { LeadStatus } from '@/types/matrix';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HeatmapAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: LeadStatus;
  titulo: string;
  conversionRate: number | null;
  fromCount: number | null;
  toCount: number | null;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Leads Nuevos',
  reviewing: 'En Revisión',
  rejected: 'Rechazados',
  qualified: 'Calificados',
  open: 'Abiertos',
  'in-progress': 'En Progreso',
  'open-deal': 'Negociación',
  'agendados-mobile': 'Agendados Mobile',
  'citas-locales': 'Citas Locales',
};

function obtenerInsights(conversionRate: number | null) {
  if (conversionRate === null) {
    return {
      titulo: 'Sin referencia previa',
      tipo: 'neutral' as const,
      causas: ['No hay columna anterior para calcular conversión.'],
      acciones: ['Define un paso anterior o habilita tracking histórico.'],
    };
  }

  if (conversionRate < 20) {
    return {
      titulo: 'Cuello de botella detectado',
      tipo: 'critico' as const,
      causas: [
        'Tiempo de respuesta alto en este paso.',
        'Falta de seguimiento del vendedor asignado.',
        'Lead sin información completa (teléfono/email).',
      ],
      acciones: [
        'Automatizar recordatorio de seguimiento en 2h.',
        'Revisar guiones de llamada/WhatsApp.',
        'Enriquecer datos del lead con validación rápida.',
      ],
    };
  }

  if (conversionRate > 70) {
    return {
      titulo: 'Alta conversión',
      tipo: 'positivo' as const,
      causas: [
        'Flujo y mensajes efectivos.',
        'Asignación oportuna del equipo.',
        'Lead con intención clara.',
      ],
      acciones: [
        'Replicar este enfoque en otras columnas.',
        'Documentar mejores prácticas del equipo.',
      ],
    };
  }

  return {
    titulo: 'Conversión moderada',
    tipo: 'neutral' as const,
    causas: [
      'Hay oportunidades de optimización en este paso.',
      'Algunos leads requieren más seguimiento.',
    ],
    acciones: [
      'Ajustar tiempos de contacto inicial.',
      'Probar variantes de mensaje y oferta.',
    ],
  };
}

export function HeatmapAnalysisModal({
  isOpen,
  onClose,
  status,
  titulo,
  conversionRate,
  fromCount,
  toCount,
}: HeatmapAnalysisModalProps) {
  if (!isOpen) return null;

  const insights = obtenerInsights(conversionRate);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Análisis de Conversión</h3>
            <p className="text-sm text-gray-500">{STATUS_LABELS[status]} · {titulo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Columna anterior</p>
              <p className="text-lg font-semibold text-gray-900">{fromCount ?? '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Columna actual</p>
              <p className="text-lg font-semibold text-gray-900">{toCount ?? '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Conversión</p>
              <p className="text-lg font-semibold text-gray-900">
                {conversionRate === null ? '-' : `${conversionRate.toFixed(1)}%`}
              </p>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${insights.tipo === 'critico' ? 'bg-red-50' : insights.tipo === 'positivo' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              {insights.tipo === 'critico' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              <h4 className="font-semibold text-gray-900">{insights.titulo}</h4>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Posibles causas</p>
              <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc list-inside">
                {insights.causas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Acciones sugeridas</p>
              <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc list-inside">
                {insights.acciones.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}