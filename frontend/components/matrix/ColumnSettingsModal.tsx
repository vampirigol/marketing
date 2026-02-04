'use client';

import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { KanbanBoardSettings, KanbanColumnConfig } from '@/types/matrix';
import { COLOR_CLASSES } from '@/lib/kanban.utils';

interface ColumnSettingsModalProps {
  isOpen: boolean;
  settings: KanbanBoardSettings;
  onSave: (settings: KanbanBoardSettings) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = Object.keys(COLOR_CLASSES);

export function ColumnSettingsModal({
  isOpen,
  settings,
  onSave,
  onClose,
}: ColumnSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<KanbanBoardSettings>(settings);

  useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columnIds = useMemo(() => localSettings.columns.map((c) => c.id), [localSettings.columns]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localSettings.columns.findIndex((c) => c.id === active.id);
    const newIndex = localSettings.columns.findIndex((c) => c.id === over.id);
    setLocalSettings((prev) => ({
      ...prev,
      columns: arrayMove(prev.columns, oldIndex, newIndex),
    }));
  };

  const handleUpdateColumn = (id: KanbanColumnConfig['id'], changes: Partial<KanbanColumnConfig>) => {
    setLocalSettings((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.id === id ? { ...c, ...changes } : c)),
    }));
  };

  const handleSave = () => {
    onSave({
      hideEmptyColumns: localSettings.hideEmptyColumns,
      columns: localSettings.columns,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Personalizar Kanban</h3>
            <p className="text-sm text-gray-500">Columnas, nombres, orden y colores</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={localSettings.hideEmptyColumns}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, hideEmptyColumns: e.target.checked }))
              }
              className="w-4 h-4 accent-blue-500"
            />
            Ocultar columnas vacías
          </label>

          <div className="text-xs text-gray-500 uppercase font-semibold">Orden y configuración</div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {localSettings.columns.map((col) => (
                  <SortableColumnRow
                    key={col.id}
                    column={col}
                    onUpdate={handleUpdateColumn}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

interface SortableColumnRowProps {
  column: KanbanColumnConfig;
  onUpdate: (id: KanbanColumnConfig['id'], changes: Partial<KanbanColumnConfig>) => void;
}

function SortableColumnRow({ column, onUpdate }: SortableColumnRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
    >
      <div className="text-gray-400 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </div>

      <input
        type="checkbox"
        checked={column.enabled}
        onChange={(e) => onUpdate(column.id, { enabled: e.target.checked })}
        className="w-4 h-4 accent-blue-500"
        title={column.enabled ? 'Ocultar columna' : 'Mostrar columna'}
      />

      <span className="text-lg">{column.icono}</span>

      <input
        type="text"
        value={column.titulo}
        onChange={(e) => onUpdate(column.id, { titulo: e.target.value })}
        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={column.color}
        onChange={(e) => onUpdate(column.id, { color: e.target.value })}
        className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {COLOR_OPTIONS.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
    </div>
  );
}
