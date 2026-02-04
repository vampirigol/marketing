'use client';

import { AutomationRule } from '@/types/matrix';
import { useState, useCallback } from 'react';
import { 
  Trash2, 
  Edit2, 
  Plus,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  eliminarRegla,
  actualizarRegla
} from '@/lib/automation-rules.service';

interface AutomationRulesListProps {
  reglas: AutomationRule[];
  onEdit: (regla: AutomationRule) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, activa: boolean) => void;
  onNew: () => void;
  onDuplicate?: (regla: AutomationRule) => void;
}

export function AutomationRulesList({
  reglas,
  onEdit,
  onDelete,
  onToggleActive,
  onNew,
  onDuplicate
}: AutomationRulesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string, activa: boolean) => {
    actualizarRegla(id, { activa: !activa });
    onToggleActive(id, !activa);
  }, [onToggleActive]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
      eliminarRegla(id);
      onDelete(id);
    }
  }, [onDelete]);

  const handleDuplicate = useCallback((regla: AutomationRule) => {
    const nuevaRegla = {
      ...regla,
      id: `rule-${Date.now()}`,
      nombre: `${regla.nombre} (Copia)`,
      activa: false,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };
    onDuplicate?.(nuevaRegla);
  }, [onDuplicate]);

  return (
    <div className="space-y-3">
      {/* Botón para crear nueva regla */}
      <button
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        <Plus className="w-5 h-5" />
        Nueva Regla de Automatización
      </button>

      {/* Lista de reglas */}
      {reglas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">No hay reglas creadas aún</p>
          <p className="text-sm text-gray-500">Crea la primera regla para comenzar con automatizaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reglas.map((regla) => (
            <RuleCard
              key={regla.id}
              regla={regla}
              isExpanded={expandedId === regla.id}
              onExpand={() => setExpandedId(expandedId === regla.id ? null : regla.id)}
              onEdit={() => onEdit(regla)}
              onDelete={() => handleDelete(regla.id)}
              onToggle={() => handleToggle(regla.id, regla.activa)}
              onDuplicate={() => handleDuplicate(regla)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RuleCardProps {
  regla: AutomationRule;
  isExpanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

function RuleCard({
  regla,
  isExpanded,
  onExpand,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate
}: RuleCardProps) {
  return (
    <div className={`border rounded-lg transition-all ${regla.activa ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
      {/* Card Header */}
      <div
        onClick={onExpand}
        className="p-4 cursor-pointer hover:bg-opacity-70 transition-colors flex items-center justify-between"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${regla.activa ? 'bg-green-500' : 'bg-gray-400'}`} />
            <h3 className="font-semibold text-gray-900">{regla.nombre}</h3>
            {regla.descripcion && (
              <p className="text-sm text-gray-600 ml-2">— {regla.descripcion.substring(0, 50)}</p>
            )}
          </div>
          <div className="mt-1 flex gap-4 text-xs text-gray-600">
            <span>✅ {regla.condiciones.length} condición(es)</span>
            <span>🔧 {regla.acciones.length} acción(es)</span>
            <span>📅 {new Date(regla.fechaCreacion).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`p-2 rounded-lg transition-colors ${
              regla.activa 
                ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={regla.activa ? 'Desactivar' : 'Activar'}
          >
            {regla.activa ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Expandido */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4 bg-white">
          {/* Condiciones */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-lg">✅</span> Condiciones (SI...)
            </h4>
            <div className="space-y-2 pl-6">
              {regla.condiciones.map((cond) => (
                <div key={cond.id} className="text-sm text-gray-700 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                  <span className="font-medium">Si:</span> {cond.label || `Lead ${cond.type} ${cond.operator} ${cond.value}`}
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-lg">🔧</span> Acciones (ENTONCES...)
            </h4>
            <div className="space-y-2 pl-6">
              {regla.acciones.map((acc) => (
                <div key={acc.id} className="text-sm text-gray-700 p-2 bg-green-50 rounded border-l-2 border-green-300">
                  <span className="font-medium">Entonces:</span> {acc.description || `${acc.type}: ${acc.value}`}
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
            <p>ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{regla.id}</code></p>
            <p>Creada: {new Date(regla.fechaCreacion).toLocaleString()}</p>
            <p>Actualizada: {new Date(regla.fechaActualizacion).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
