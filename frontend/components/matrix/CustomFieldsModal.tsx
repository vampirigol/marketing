'use client';

import { useEffect, useMemo, useState } from 'react';
import { CustomFieldDefinition, CustomFieldsSettings, CustomFieldType } from '@/types/matrix';
import { CUSTOM_FIELD_TYPES, sanitizeFieldId } from '@/lib/custom-fields.utils';
import { Plus, Trash2, X } from 'lucide-react';

interface CustomFieldsModalProps {
  isOpen: boolean;
  settings: CustomFieldsSettings;
  onSave: (settings: CustomFieldsSettings) => void;
  onClose: () => void;
}

export function CustomFieldsModal({
  isOpen,
  settings,
  onSave,
  onClose,
}: CustomFieldsModalProps) {
  const [localSettings, setLocalSettings] = useState<CustomFieldsSettings>(settings);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldType>('text');
  const [newOptions, setNewOptions] = useState('');

  useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  const isDuplicateId = useMemo(() => {
    const id = sanitizeFieldId(newLabel);
    return localSettings.fields.some((f) => f.id === id);
  }, [newLabel, localSettings.fields]);

  if (!isOpen) return null;

  const handleAddField = () => {
    const id = sanitizeFieldId(newLabel);
    if (!newLabel.trim() || !id || isDuplicateId) return;

    const options = newType === 'select'
      ? newOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    const nuevoCampo: CustomFieldDefinition = {
      id,
      label: newLabel.trim(),
      type: newType,
      options,
    };

    setLocalSettings((prev) => ({
      ...prev,
      fields: [...prev.fields, nuevoCampo],
      visibleFieldIds: [...prev.visibleFieldIds, id],
    }));

    setNewLabel('');
    setNewType('text');
    setNewOptions('');
  };

  const handleRemoveField = (id: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
      visibleFieldIds: prev.visibleFieldIds.filter((fid) => fid !== id),
    }));
  };

  const handleToggleVisible = (id: string, visible: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      visibleFieldIds: visible
        ? [...prev.visibleFieldIds, id]
        : prev.visibleFieldIds.filter((fid) => fid !== id),
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Campos personalizados</h3>
            <p className="text-sm text-gray-500">Define campos y elige cuáles mostrar en tarjetas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase font-semibold">Agregar campo</div>
            <div className="grid grid-cols-12 gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nombre del campo"
                className="col-span-6 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CustomFieldType)}
                className="col-span-3 px-2 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CUSTOM_FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddField}
                disabled={!newLabel.trim() || isDuplicateId}
                className="col-span-3 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {newType === 'select' && (
              <input
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                placeholder="Opciones separadas por coma"
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {isDuplicateId && (
              <p className="text-xs text-red-600">Ya existe un campo con ese nombre.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase font-semibold">Campos actuales</div>
            <div className="space-y-2">
              {localSettings.fields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={localSettings.visibleFieldIds.includes(field.id)}
                    onChange={(e) => handleToggleVisible(field.id, e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{field.label}</p>
                    <p className="text-xs text-gray-500">{field.type}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-2 rounded hover:bg-gray-100 text-red-600"
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
