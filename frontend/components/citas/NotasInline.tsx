'use client';

import { useState } from 'react';
import { StickyNote, Save, X, Clock } from 'lucide-react';

interface NotasInlineProps {
  citaId: string;
  notaInicial?: string;
  onGuardar: (citaId: string, nota: string) => void;
  compact?: boolean;
}

export function NotasInline({ citaId, notaInicial = '', onGuardar, compact = false }: NotasInlineProps) {
  const [nota, setNota] = useState(notaInicial);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGuardar = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simular guardado
    onGuardar(citaId, nota);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancelar = () => {
    setNota(notaInicial);
    setIsEditing(false);
  };

  if (!isEditing && !nota) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`
          flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors group
          ${compact ? 'text-xs' : 'text-sm'}
        `}
      >
        <StickyNote className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="group-hover:underline">Agregar nota</span>
      </button>
    );
  }

  if (!isEditing && nota) {
    return (
      <div className="group relative">
        <div
          onClick={() => setIsEditing(true)}
          className={`
            bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg cursor-pointer
            hover:bg-yellow-100 transition-colors
            ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
          `}
        >
          <div className="flex items-start gap-2">
            <StickyNote className={`flex-shrink-0 text-yellow-600 ${compact ? 'w-3.5 h-3.5 mt-0.5' : 'w-4 h-4 mt-0.5'}`} />
            <p className={`text-gray-700 flex-1 ${compact ? 'text-xs' : 'text-sm'} whitespace-pre-wrap`}>
              {nota}
            </p>
          </div>
        </div>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
            Click para editar
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Escribe una nota rápida..."
        className={`
          w-full bg-yellow-50 border-2 border-yellow-400 rounded-lg 
          focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none
          text-gray-700 placeholder-yellow-600/50 resize-none
          ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
        `}
        rows={compact ? 2 : 3}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleGuardar}
          disabled={isSaving}
          className={`
            flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white
            rounded-lg font-medium transition-colors disabled:opacity-50
            ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
          `}
        >
          {isSaving ? (
            <>
              <Clock className={compact ? 'w-3 h-3 animate-spin' : 'w-3.5 h-3.5 animate-spin'} />
              Guardando...
            </>
          ) : (
            <>
              <Save className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              Guardar
            </>
          )}
        </button>
        <button
          onClick={handleCancelar}
          disabled={isSaving}
          className={`
            flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700
            rounded-lg font-medium transition-colors disabled:opacity-50
            ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
          `}
        >
          <X className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cancelar
        </button>
      </div>
    </div>
  );
}
