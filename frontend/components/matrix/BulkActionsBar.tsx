'use client';

import { Lead, LeadStatus } from '@/types/matrix';
import { 
  ChevronDown, 
  Users, 
  Tag, 
  Download, 
  Trash2, 
  X,
  ArrowRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { 
  moverLeadsMasiva, 
  asignarVendedorMasiva,
  agregarEtiquetaMasiva,
  exportarLeadsCSV,
  eliminarLeadsMasiva,
  obtenerVendedoresDisponibles,
} from '@/lib/bulk-actions.service';

interface BulkActionData {
  [key: string]: unknown;
}

interface BulkActionsBarProps {
  selectedLeads: Lead[];
  onAction: (action: string, data?: BulkActionData) => void;
  onClearSelection: () => void;
  columnConfigs: Array<{ id: LeadStatus; titulo: string; color: string; icono: string }>;
}

export function BulkActionsBar({
  selectedLeads,
  onAction,
  onClearSelection,
  columnConfigs,
}: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const vendedoresDisponibles = useMemo(() => obtenerVendedoresDisponibles(), []);

  const handleMoveLeads = async (targetStatus: LeadStatus) => {
    setIsLoading(true);
    try {
      const result = await moverLeadsMasiva(selectedLeads, targetStatus);
      if (result.success) {
        onAction('move', { targetStatus, count: result.affectedCount });
        onClearSelection();
      }
    } finally {
      setIsLoading(false);
      setShowMoveMenu(false);
    }
  };

  const handleAssignVendedor = async (vendedor: { id: string; nombre: string; avatar: string }) => {
    setIsLoading(true);
    try {
      const result = await asignarVendedorMasiva(
        selectedLeads,
        vendedor.id,
        vendedor.nombre,
        vendedor.avatar
      );
      if (result.success) {
        onAction('assign', { vendedor: vendedor.nombre, count: result.affectedCount });
      }
    } finally {
      setIsLoading(false);
      setShowAssignMenu(false);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!tag.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await agregarEtiquetaMasiva(selectedLeads, tag);
      if (result.success) {
        onAction('tag', { tag, count: result.affectedCount });
      }
    } finally {
      setIsLoading(false);
      setShowTagMenu(false);
      setNewTag('');
      setShowNewTagInput(false);
    }
  };

  const handleExport = () => {
    try {
      exportarLeadsCSV(selectedLeads, `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
      onAction('export', { count: selectedLeads.length });
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleDeleteLeads = async () => {
    setIsLoading(true);
    try {
      const result = await eliminarLeadsMasiva(selectedLeads);
      if (result.success) {
        onAction('delete', { count: result.affectedCount });
        onClearSelection();
      }
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-300 shadow-2xl z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Información de selección */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-bold text-sm">
            {selectedLeads.length}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} seleccionado{selectedLeads.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Acciones masivas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mover */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mover leads a otra columna"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">Mover</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showMoveMenu && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                <div className="max-h-64 overflow-y-auto">
                  {columnConfigs.map((config) => (
                    <button
                      key={config.id}
                      onClick={() => handleMoveLeads(config.id)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-2">{config.icono}</span>
                      {config.titulo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Asignar vendedor */}
          <div className="relative">
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Asignar vendedor en lote"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Vendedor</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showAssignMenu && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                <div className="max-h-48 overflow-y-auto">
                  {vendedoresDisponibles.map((vendedor) => (
                    <button
                      key={vendedor.id}
                      onClick={() => handleAssignVendedor(vendedor)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-2">{vendedor.avatar}</span>
                      {vendedor.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agregar etiqueta */}
          <div className="relative">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Agregar etiqueta masiva"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Etiqueta</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showTagMenu && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                {!showNewTagInput ? (
                  <button
                    onClick={() => setShowNewTagInput(true)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-blue-600 font-medium transition-colors"
                  >
                    + Nueva etiqueta
                  </button>
                ) : (
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddTag(newTag);
                      }}
                      placeholder="Nombre de etiqueta..."
                      autoFocus
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddTag(newTag)}
                        disabled={isLoading || !newTag.trim()}
                        className="flex-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-medium transition-colors disabled:opacity-50"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => {
                          setShowNewTagInput(false);
                          setNewTag('');
                        }}
                        className="flex-1 px-2 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exportar */}
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Eliminar */}
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg border border-red-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar seleccionados"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>

            {showDeleteConfirm && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-red-300 rounded-lg shadow-lg z-50 min-w-56">
                <div className="p-3 border-b border-red-200">
                  <p className="text-sm font-semibold text-gray-700">
                    ¿Eliminar {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''}?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex gap-2 p-3">
                  <button
                    onClick={handleDeleteLeads}
                    disabled={isLoading}
                    className="flex-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-2 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botón cerrar selección */}
          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="flex items-center justify-center w-9 h-9 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 ml-auto"
            title="Cerrar acciones masivas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
