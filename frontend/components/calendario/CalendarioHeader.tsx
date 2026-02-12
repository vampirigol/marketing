'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, ChevronDown, Search, Settings, RefreshCw } from 'lucide-react';

export type VistaCalendario = 'dia' | 'semana' | 'mes' | 'programar';
export type TipoCalendario = 'personal' | 'compania';

interface CalendarioHeaderProps {
  fecha: Date;
  vista: VistaCalendario;
  calendario: TipoCalendario;
  onFechaChange: (fecha: Date) => void;
  onVistaChange: (v: VistaCalendario) => void;
  onCalendarioChange: (c: TipoCalendario) => void;
  onIrHoy: () => void;
  onCrearEvento: () => void;
  busqueda?: string;
  onBusquedaChange?: (q: string) => void;
  espaciosDisponibles?: boolean;
  onEspaciosDisponiblesChange?: (v: boolean) => void;
  onSincronizar?: () => void;
}

const formatTitulo = (fecha: Date, vista: VistaCalendario): string => {
  if (vista === 'mes') {
    return fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
  if (vista === 'semana') {
    const lunes = new Date(fecha);
    const d = lunes.getDay();
    const diff = lunes.getDate() - d + (d === 0 ? -6 : 1);
    lunes.setDate(diff);
    const numSemana = getNumeroSemana(lunes);
    return `${fecha.toLocaleDateString('es-MX', { month: 'long' })}, semana ${numSemana}`;
  }
  if (vista === 'programar') {
    return fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
  return fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

function getNumeroSemana(d: Date): string {
  const firstDay = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
  return String(Math.ceil((days + firstDay.getDay() + 1) / 7)).padStart(2, '0');
}

const VISTAS: { id: VistaCalendario; label: string }[] = [
  { id: 'dia', label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'programar', label: 'Programar' },
];

export function CalendarioHeader({
  fecha,
  vista,
  calendario,
  onFechaChange,
  onVistaChange,
  onCalendarioChange,
  onIrHoy,
  onCrearEvento,
  busqueda = '',
  onBusquedaChange,
  espaciosDisponibles = false,
  onEspaciosDisponiblesChange,
  onSincronizar,
}: CalendarioHeaderProps) {
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [calendariosAbierto, setCalendariosAbierto] = useState(false);
  const crearRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (crearRef.current && !crearRef.current.contains(e.target as Node)) setCrearAbierto(false);
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalendariosAbierto(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const avanza = () => {
    const next = new Date(fecha);
    if (vista === 'dia') next.setDate(next.getDate() + 1);
    else if (vista === 'semana') next.setDate(next.getDate() + 7);
    else if (vista === 'programar') next.setDate(next.getDate() + 14);
    else next.setMonth(next.getMonth() + 1);
    onFechaChange(next);
  };
  const retrocede = () => {
    const prev = new Date(fecha);
    if (vista === 'dia') prev.setDate(prev.getDate() - 1);
    else if (vista === 'semana') prev.setDate(prev.getDate() - 7);
    else if (vista === 'programar') prev.setDate(prev.getDate() - 14);
    else prev.setMonth(prev.getMonth() - 1);
    onFechaChange(prev);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Fila 1: Título, Crear, Buscar, Controles */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mr-2">Calendario</h1>

        <div className="relative" ref={crearRef}>
          <button
            type="button"
            onClick={() => { setCrearAbierto(!crearAbierto); onCrearEvento(); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear
            <ChevronDown className="w-4 h-4 opacity-80" />
          </button>
        </div>

        {onBusquedaChange && (
          <div className="flex-1 min-w-[180px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => onBusquedaChange(e.target.value)}
                placeholder="Filtrar y buscar"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative" ref={calRef}>
            <button
              type="button"
              onClick={() => setCalendariosAbierto(!calendariosAbierto)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg border border-blue-200"
            >
              {calendario === 'personal' ? 'Mi calendario' : 'Calendario de la compañía'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {calendariosAbierto && (
              <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => { onCalendarioChange('personal'); setCalendariosAbierto(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                >
                  Mi calendario
                </button>
                <button
                  type="button"
                  onClick={() => { onCalendarioChange('compania'); setCalendariosAbierto(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                >
                  Calendario de la compañía
                </button>
              </div>
            )}
          </div>
          {onSincronizar && (
            <button
              type="button"
              onClick={onSincronizar}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Actualizar calendario"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronizar
            </button>
          )}
          <button type="button" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Configuración" aria-label="Configuración">
            <Settings className="w-4 h-4" />
          </button>
          {onEspaciosDisponiblesChange && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-sm text-gray-600">Espacios disponibles</span>
              <button
                type="button"
                role="switch"
                aria-checked={espaciosDisponibles}
                onClick={() => onEspaciosDisponiblesChange(!espaciosDisponibles)}
                className={`relative w-10 h-5 rounded-full transition-colors ${espaciosDisponibles ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${espaciosDisponibles ? 'left-5 translate-x-[-100%]' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fila 2: Pestañas de vista + Navegación de fecha */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-gray-50/80">
        <div className="flex rounded-lg bg-white border border-gray-200 p-0.5">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onVistaChange(v.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                vista === v.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={retrocede}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onIrHoy}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={avanza}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900 capitalize min-w-[180px]">
            {formatTitulo(fecha, vista)}
          </span>
        </div>
      </div>
    </div>
  );
}
