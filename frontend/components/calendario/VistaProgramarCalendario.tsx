'use client';

import type { ItemCalendario } from '@/types/calendario';

interface VistaProgramarCalendarioProps {
  items: ItemCalendario[];
  fechaInicio: Date;
  fechaFin: Date;
  onItemClick: (item: ItemCalendario) => void;
}

function formatHora(d: Date): string {
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function etiquetaDia(d: Date): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  const dia = new Date(d);
  dia.setHours(0, 0, 0, 0);
  if (dia.getTime() === hoy.getTime()) return 'hoy';
  if (dia.getTime() === manana.getTime()) return 'mañana';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function VistaProgramarCalendario({ items, fechaInicio, fechaFin, onItemClick }: VistaProgramarCalendarioProps) {
  const grupos = new Map<string, ItemCalendario[]>();
  const ordenDias: string[] = [];

  items
    .filter((item) => {
      const t = item.inicio.getTime();
      return t >= fechaInicio.getTime() && t < fechaFin.getTime();
    })
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
    .forEach((item) => {
      const key = item.inicio.toDateString();
      if (!grupos.has(key)) {
        ordenDias.push(key);
        grupos.set(key, []);
      }
      grupos.get(key)!.push(item);
    });

  const esTodoElDia = (item: ItemCalendario): boolean => {
    if (item.tipo === 'evento' && item.raw && 'esTodoElDia' in item.raw) return !!item.raw.esTodoElDia;
    return false;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="divide-y divide-gray-100">
        {ordenDias.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            No hay eventos en este período. Usa &quot;Crear&quot; para agregar uno.
          </div>
        ) : (
          ordenDias.map((key) => {
            const list = grupos.get(key) || [];
            const primerItem = list[0];
            const dia = new Date(primerItem.inicio);
            const label = etiquetaDia(dia);
            const esHoy = label === 'hoy';
            const esManana = label === 'mañana';

            return (
              <div key={key}>
                <div
                  className={`flex items-center gap-4 px-4 py-3 text-sm font-medium ${
                    esHoy ? 'bg-blue-50 text-blue-800' : esManana ? 'bg-slate-50 text-slate-700' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="w-24 flex-shrink-0 text-right capitalize">{label}</span>
                </div>
                {list.map((item) => (
                  <button
                    key={`${item.tipo}-${item.id}`}
                    type="button"
                    onClick={() => onItemClick(item)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50/80 text-left border-b border-gray-50 last:border-0"
                  >
                    <span className="w-24 flex-shrink-0 text-right text-sm text-gray-500">
                      {esTodoElDia(item) ? 'Todo el día' : formatHora(item.inicio)}
                    </span>
                    <span
                      className="w-3 h-3 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="flex-1 text-gray-900 truncate">{item.titulo}</span>
                    {item.tipo === 'cita' && item.raw?.pacienteNombre && (
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {item.raw.pacienteNombre}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
