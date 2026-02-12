'use client';

import { useRef, useEffect } from 'react';
import type { ItemCalendario } from '@/types/calendario';

interface VistaSemanaCalendarioProps {
  items: ItemCalendario[];
  fecha: Date;
  onItemClick: (item: ItemCalendario) => void;
  onSlotClick?: (dia: Date, hora: number) => void;
}

function getLunes(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  return x;
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 7);

function esTodoElDia(item: ItemCalendario): boolean {
  if (item.tipo === 'evento' && item.raw && 'esTodoElDia' in item.raw) return !!item.raw.esTodoElDia;
  return false;
}

export function VistaSemanaCalendario({ items, fecha, onItemClick, onSlotClick }: VistaSemanaCalendarioProps) {
  const lunes = getLunes(fecha);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const ahora = new Date();
  const esHoy = (d: Date) => d.toDateString() === ahora.toDateString();

  const itemsTodoElDia = (dia: Date): ItemCalendario[] => {
    return items.filter((item) => {
      if (!esTodoElDia(item)) return false;
      const di = new Date(item.inicio);
      di.setHours(0, 0, 0, 0);
      const df = new Date(item.fin);
      df.setHours(0, 0, 0, 0);
      const dd = new Date(dia);
      dd.setHours(0, 0, 0, 0);
      return dd.getTime() >= di.getTime() && dd.getTime() <= df.getTime();
    });
  };

  const itemsEnCelda = (dia: Date, hora: number): ItemCalendario[] => {
    return items.filter((item) => {
      if (esTodoElDia(item)) return false;
      const d = item.inicio.toDateString();
      const h = item.inicio.getHours();
      return d === dia.toDateString() && h === hora;
    });
  };

  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  const hoyDate = ahora.toDateString();
  const posHoraActual = horaActual >= 7 && horaActual <= 21 ? (horaActual - 7) * 52 + (minutoActual / 60) * 52 : null;

  useEffect(() => {
    if (!scrollRef.current || !esHoy(dias[1])) return;
    const idx = dias.findIndex((d) => d.toDateString() === hoyDate);
    if (idx === -1) return;
    const cell = scrollRef.current.querySelector(`[data-hoy-col="${idx}"]`);
    cell?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [fecha]);

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Header con días */}
      <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="w-14 flex-shrink-0 border-r border-gray-200" />
        {dias.map((dia, idx) => (
          <div
            key={dia.toISOString()}
            className={`flex-1 min-w-0 py-2.5 text-center border-l border-gray-200 ${
              esHoy(dia) ? 'bg-blue-50' : ''
            }`}
          >
            <div className={`text-[11px] uppercase ${esHoy(dia) ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              {dia.toLocaleDateString('es-MX', { weekday: 'short' })}
            </div>
            <div
              className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                esHoy(dia) ? 'bg-blue-500 text-white' : 'text-gray-900'
              }`}
            >
              {dia.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Fila de eventos todo el día */}
      <div className="flex border-b border-gray-200 bg-amber-50/30 flex-shrink-0">
        <div className="w-14 flex-shrink-0 border-r border-gray-200 py-1 text-[10px] text-gray-400 text-right pr-1">
          Todo el día
        </div>
        {dias.map((dia) => {
          const list = itemsTodoElDia(dia);
          return (
            <div
              key={dia.toISOString()}
              className="flex-1 min-w-0 p-1 border-l border-gray-100 flex flex-wrap gap-1"
            >
              {list.slice(0, 2).map((item) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium truncate max-w-full border-l-2"
                  style={{ borderLeftColor: item.color, backgroundColor: `${item.color}25` }}
                >
                  {item.titulo}
                </button>
              ))}
              {list.length > 2 && (
                <span className="text-[10px] text-gray-500">+{list.length - 2}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid de horas */}
      <div ref={scrollRef} className="relative flex-1 overflow-auto max-h-[55vh] min-h-[300px]">
        {posHoraActual != null && dias.some((d) => d.toDateString() === hoyDate) && (
          <div
            className="absolute left-14 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ top: `${posHoraActual}px` }}
          >
            <div className="absolute left-0 -top-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}
        {HORAS.map((hora) => (
          <div key={hora} className="flex min-h-[52px] border-b border-gray-100 relative">
            <div className="w-14 flex-shrink-0 py-1 text-right text-xs text-gray-500 border-r border-gray-200 pr-1">
              {hora.toString().padStart(2, '0')}:00
            </div>
            {dias.map((dia, colIdx) => {
              const list = itemsEnCelda(dia, hora);
              const esHoyCelda = dia.toDateString() === hoyDate && hora === horaActual;
              return (
                <div
                  key={`${dia.toISOString()}-${hora}`}
                  data-hoy-col={esHoy(dia) ? colIdx : undefined}
                  className={`flex-1 min-w-0 p-1 border-l border-gray-100 relative ${
                    esHoyCelda ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => onSlotClick?.(dia, hora)}
                >
                  {list.map((item) => (
                    <button
                      key={`${item.tipo}-${item.id}`}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                      className="w-full text-left px-2 py-1.5 rounded text-xs font-medium truncate border-l-2 block"
                      style={{ borderLeftColor: item.color, backgroundColor: `${item.color}22` }}
                    >
                      {item.titulo}
                      <span className="text-[10px] text-gray-500 ml-1">
                        {item.inicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {item.fin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}
