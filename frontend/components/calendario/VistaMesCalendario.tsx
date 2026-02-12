'use client';

import { useState } from 'react';
import type { ItemCalendario } from '@/types/calendario';

interface VistaMesCalendarioProps {
  items: ItemCalendario[];
  fecha: Date;
  onFechaChange: (fecha: Date) => void;
  onItemClick: (item: ItemCalendario) => void;
}

function getLunes(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  return x;
}

function getNumeroSemana(d: Date): string {
  const firstDay = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
  return String(Math.ceil((days + firstDay.getDay() + 1) / 7)).padStart(2, '0');
}

export function VistaMesCalendario({ items, fecha, onFechaChange, onItemClick }: VistaMesCalendarioProps) {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const inicioSemana = primerDia.getDay();
  const diasMes = ultimoDia.getDate();
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const dias: (Date | null)[] = [];
  const offset = inicioSemana === 0 ? 6 : inicioSemana - 1;
  for (let i = 0; i < offset; i++) dias.push(null);
  for (let i = 1; i <= diasMes; i++) dias.push(new Date(year, month, i));

  const itemsPorDia = (dia: Date): ItemCalendario[] => {
    return items.filter((item) => item.inicio.toDateString() === dia.toDateString());
  };

  const [diaExpandido, setDiaExpandido] = useState<string | null>(null);
  const MAX_VISIBLE = 3;

  const numRows = Math.ceil(dias.length / 7);
  const weekNumbers = Array.from({ length: numRows }, (_, i) => {
    const lun = new Date(year, month, 1 + i * 7);
    const day = lun.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    lun.setDate(lun.getDate() + diff);
    return getNumeroSemana(lun);
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[auto_1fr] gap-0">
        {/* Columna de números de semana */}
        <div className="w-10 flex-shrink-0 border-r border-gray-200 bg-gray-50/50 flex flex-col">
          <div className="h-9" />
          {weekNumbers.map((num, i) => (
            <div key={i} className="flex-1 min-h-[100px] flex items-start justify-center pt-2 text-xs text-gray-400 font-medium">
              {num}
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
            {diasSemana.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {dias.map((dia, idx) => {
              if (!dia) {
                return (
                  <div
                    key={`e-${idx}`}
                    className="min-h-[100px] border-b border-r border-gray-100 last:border-r-0"
                  />
                );
              }
              const list = itemsPorDia(dia);
              const esHoy = dia.toDateString() === new Date().toDateString();
              const key = dia.toISOString();
              const expandido = diaExpandido === key;
              const visible = expandido ? list : list.slice(0, MAX_VISIBLE);
              const restante = list.length - MAX_VISIBLE;

              return (
                <div
                  key={key}
                  className={`min-h-[100px] border-b border-r border-gray-100 last:border-r-0 p-1.5 flex flex-col ${
                    esHoy ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onFechaChange(dia)}
                    className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1 ${
                      esHoy ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {dia.getDate()}
                  </button>
                  <div className="flex-1 min-h-0 space-y-0.5">
                    {visible.map((item) => (
                      <button
                        key={`${item.tipo}-${item.id}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                        className="w-full flex items-center gap-1.5 text-left text-xs rounded px-1.5 py-0.5 truncate hover:bg-white/80"
                      >
                        <span
                          className="w-1.5 h-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-gray-800">{item.titulo}</span>
                      </button>
                    ))}
                    {!expandido && list.length > MAX_VISIBLE && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDiaExpandido(key); }}
                        className="w-full text-left text-xs text-blue-600 hover:underline px-1.5 py-0.5"
                      >
                        Mostrar todo {list.length}
                      </button>
                    )}
                    {expandido && list.length > MAX_VISIBLE && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDiaExpandido(null); }}
                        className="w-full text-left text-xs text-gray-500 hover:underline px-1.5 py-0.5"
                      >
                        Ver menos
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
