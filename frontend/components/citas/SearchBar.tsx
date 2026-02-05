'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalResults?: number;
  onFilterClick?: () => void;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Buscar paciente, doctor, especialidad...', 
  totalResults,
  onFilterClick 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo de teclado Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <div 
        className={`
          flex items-center gap-2 bg-white rounded-xl border-2 transition-all duration-200
          ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5">
          <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm"
          />
          
          {value && (
            <button
              onClick={() => onChange('')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className="px-3 py-2.5 border-l-2 border-gray-200 hover:bg-gray-50 transition-colors"
            title="Filtros avanzados"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Resultados */}
      {value && totalResults !== undefined && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-600">
            {totalResults === 0 ? (
              <span className="text-orange-600">No se encontraron resultados</span>
            ) : (
              <span>
                <span className="font-semibold text-blue-600">{totalResults}</span> resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Atajo de teclado hint */}
      {!isFocused && !value && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
            Ctrl+F
          </span>
        </div>
      )}
    </div>
  );
}
