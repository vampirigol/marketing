'use client';

import { useState, useRef, useEffect } from 'react';
import type { ItemCalendario } from '@/types/calendario';

interface VistaDiaCalendarioProps {
  items: ItemCalendario[];
  fecha: Date;
  onItemClick: (item: ItemCalendario) => void;
  onSlotClick?: (hora: number) => void;
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 7);
const MAX_LISTA = 5;

export function VistaDiaCalendario({ items, fecha, onItemClick, onSlotClick }: VistaDiaCalendarioProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ahoraRef = useRef<HTMLDivElement>(null);
  const esHoy = fecha.toDateString() === new Date().toDateString();
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  const [mostrarTodosLista, setMostrarTodosLista] = useState(false);

  const itemsDelDia = items
    .filter((item) => item.inicio.toDateString() === fecha.toDateString())
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  const listaVisible = mostrarTodosLista ? itemsDelDia : itemsDelDia.slice(0, MAX_LISTA);
  const hayMas = itemsDelDia.length > MAX_LISTA;

  const itemsPorHora = items.reduce((acc, item) => {
    const h = item.inicio.getHours();
    if (!acc[h]) acc[h] = [];
    acc[h].push(item);
    return acc;
  }, {} as Record<number, ItemCalendario[]>);

  useEffect(() => {
    if (!esHoy || !scrollRef.current || !ahoraRef.current) return;
    ahoraRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [esHoy]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Lista de eventos del día (estilo Bitrix) */}
      <div className="border-b border-gray-200 bg-gray-50/80">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Día</span>
        </div>
        <div className="px-4 pb-3">
          {itemsDelDia.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Sin eventos este día</p>
          ) : (
            <>
              {listaVisible.map((item) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white text-left border-l-4"
                  style={{ borderLeftColor: item.color, backgroundColor: `${item.color}12` }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">{item.titulo}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {item.inicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
              {hayMas && !mostrarTodosLista && (
                <button
                  type="button"
                  onClick={() => setMostrarTodosLista(true)}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Mostrar todo {itemsDelDia.length}
                </button>
              )}
              {hayMas && mostrarTodosLista && (
                <button
                  type="button"
                  onClick={() => setMostrarTodosLista(false)}
                  className="text-sm text-gray-500 hover:underline mt-1"
                >
                  Ver menos
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Timeline por horas */}
      <div ref={scrollRef} className="relative flex-1 overflow-auto max-h-[50vh] min-h-[280px]">
        {HORAS.map((hora) => {
          const list = itemsPorHora[hora] || [];
          const esHoraActual = esHoy && hora === horaActual;

          return (
            <div
              key={hora}
              ref={esHoraActual ? ahoraRef : null}
              className={`flex min-h-[56px] border-b border-gray-100 last:border-0 ${esHoraActual ? 'bg-blue-50/40' : ''}`}
            >
              <div className="w-20 flex-shrink-0 py-2 pr-2 text-right border-r border-gray-100">
                <span className={`text-sm ${esHoraActual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                  {hora.toString().padStart(2, '0')}:00
                </span>
                {esHoraActual && (
                  <div className="text-[10px] text-blue-600 font-medium mt-0.5">Ahora</div>
                )}
              </div>
              <div
                className="flex-1 p-2"
                onClick={() => onSlotClick?.(hora)}
              >
                {list.length === 0 ? (
                  <div className="h-full min-h-[40px]" />
                ) : (
                  <div className="space-y-1">
                    {list.map((item) => (
                      <button
                        key={`${item.tipo}-${item.id}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium truncate border-l-4 transition hover:opacity-90"
                        style={{ borderLeftColor: item.color, backgroundColor: `${item.color}18` }}
                      >
                        <span className="text-gray-900">{item.titulo}</span>
                        {item.tipo === 'cita' && (
                          <span className="ml-2 text-xs text-gray-500">
                            {item.raw?.pacienteNombre || item.raw?.paciente_nombre}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {esHoy && horaActual >= 7 && horaActual <= 21 && (
          <div
            className="absolute left-20 right-0 z-10 pointer-events-none"
            style={{
              top: `${((horaActual - 7) * 56) + (minutoActual / 60 * 56)}px`,
            }}
          >
            <div className="h-0.5 bg-red-500 rounded" />
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
