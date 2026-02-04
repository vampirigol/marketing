'use client';

import { useEffect, useState } from 'react';
import { AlertSettings } from '@/types/matrix';
import { X } from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  settings: AlertSettings;
  onSave: (settings: AlertSettings) => void;
  onClose: () => void;
}

export function AlertSettingsModal({
  isOpen,
  settings,
  onSave,
  onClose,
}: AlertSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AlertSettings>(settings);

  useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      hotLeadHours: Math.max(1, Number(localSettings.hotLeadHours)),
      stalledDealDays: Math.max(1, Number(localSettings.stalledDealDays)),
      pricePageViews: Math.max(1, Number(localSettings.pricePageViews)),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Alertas contextuales</h3>
            <p className="text-sm text-gray-500">Personaliza los umbrales por usuario</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead caliente: no contactado en (horas)
            </label>
            <input
              type="number"
              min={1}
              value={localSettings.hotLeadHours}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, hotLeadHours: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal estancado: negociación &gt; (días)
            </label>
            <input
              type="number"
              min={1}
              value={localSettings.stalledDealDays}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, stalledDealDays: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Oportunidad: visitas a precios ≥ (veces)
            </label>
            <input
              type="number"
              min={1}
              value={localSettings.pricePageViews}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, pricePageViews: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
