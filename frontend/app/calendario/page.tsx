'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarioHeader } from '@/components/calendario/CalendarioHeader';
import { VistaDiaCalendario } from '@/components/calendario/VistaDiaCalendario';
import { VistaSemanaCalendario } from '@/components/calendario/VistaSemanaCalendario';
import { VistaMesCalendario } from '@/components/calendario/VistaMesCalendario';
import { VistaProgramarCalendario } from '@/components/calendario/VistaProgramarCalendario';
import { EventoModal } from '@/components/calendario/EventoModal';
import { MiniCalendar } from '@/components/citas/MiniCalendar';
import type { ItemCalendario } from '@/types/calendario';
import type { EventoCalendario } from '@/types/calendario';
import type { Cita } from '@/types';
import { calendarioService } from '@/lib/calendario.service';
import { citasService } from '@/lib/citas.service';

type VistaCalendario = 'dia' | 'semana' | 'mes' | 'programar';
type TipoCalendario = 'personal' | 'compania';

function citaToItem(cita: Cita): ItemCalendario {
  const fechaCita = typeof cita.fechaCita === 'string' ? new Date(cita.fechaCita) : cita.fechaCita;
  const [h, m] = (cita.horaCita || '09:00').split(':').map(Number);
  const inicio = new Date(fechaCita);
  inicio.setHours(h, m || 0, 0, 0);
  const fin = new Date(inicio.getTime() + (cita.duracionMinutos || 30) * 60 * 1000);
  const color = '#0EA5E9';
  return {
    tipo: 'cita',
    id: cita.id,
    titulo: cita.pacienteNombre || (cita as any).paciente_nombre || 'Cita',
    inicio,
    fin,
    color,
    raw: cita,
  };
}

function eventoToItem(e: EventoCalendario): ItemCalendario {
  const inicio = e.fechaInicio instanceof Date ? e.fechaInicio : new Date(e.fechaInicio);
  const fin = e.fechaFin instanceof Date ? e.fechaFin : new Date(e.fechaFin);
  return {
    tipo: 'evento',
    id: e.id,
    titulo: e.titulo,
    inicio,
    fin,
    color: e.color || '#3B82F6',
    raw: e,
  };
}

export default function CalendarioPage() {
  const [vista, setVista] = useState<VistaCalendario>('semana');
  const [fecha, setFecha] = useState(new Date());
  const [calendario, setCalendario] = useState<TipoCalendario>('personal');
  const [items, setItems] = useState<ItemCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEvento, setModalEvento] = useState(false);
  const [eventoEditar, setEventoEditar] = useState<EventoCalendario | null>(null);
  const [slotInicial, setSlotInicial] = useState<{ fecha?: Date; hora?: number } | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [espaciosDisponibles, setEspaciosDisponibles] = useState(false);

  const rangoInicio = useMemo(() => {
    const d = new Date(fecha);
    if (vista === 'dia') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (vista === 'semana') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (vista === 'programar') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [fecha, vista]);

  const rangoFin = useMemo(() => {
    const d = new Date(rangoInicio);
    if (vista === 'dia') d.setDate(d.getDate() + 1);
    else if (vista === 'semana') d.setDate(d.getDate() + 7);
    else if (vista === 'programar') d.setDate(d.getDate() + 14);
    else d.setMonth(d.getMonth() + 1);
    return d;
  }, [rangoInicio, vista]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [eventos, citas] = await Promise.all([
        calendarioService.listarEventos({
          fechaInicio: rangoInicio.toISOString(),
          fechaFin: rangoFin.toISOString(),
          calendario,
        }),
        citasService.obtenerPorRango({
          fechaInicio: rangoInicio.toISOString().slice(0, 10),
          fechaFin: rangoFin.toISOString().slice(0, 10),
        }),
      ]);

      const citasNorm = Array.isArray(citas) ? citas : [];
      const list: ItemCalendario[] = [
        ...citasNorm.map((c: Cita) => citaToItem(c)),
        ...eventos.map(eventoToItem),
      ];
      setItems(list);
    } catch (e) {
      console.error('Error cargando calendario', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [rangoInicio.toISOString(), rangoFin.toISOString(), calendario]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return items;
    const q = busqueda.toLowerCase();
    return items.filter((item) => item.titulo.toLowerCase().includes(q));
  }, [items, busqueda]);

  const handleSaveEvento = async (
    data: Partial<EventoCalendario> & { titulo: string; fechaInicio: Date; fechaFin: Date }
  ) => {
    if (eventoEditar) {
      await calendarioService.actualizarEvento(eventoEditar.id, data);
    } else {
      await calendarioService.crearEvento(data);
    }
    setEventoEditar(null);
    setModalEvento(false);
    setSlotInicial(null);
    cargar();
  };

  const handleDeleteEvento = async (id: string) => {
    await calendarioService.eliminarEvento(id);
    setEventoEditar(null);
    setModalEvento(false);
    setSlotInicial(null);
    cargar();
  };

  const handleItemClick = (item: ItemCalendario) => {
    if (item.tipo === 'evento') {
      setEventoEditar(item.raw);
      setModalEvento(true);
    }
    if (item.tipo === 'cita') {
      window.location.href = `/citas?fecha=${item.inicio.toISOString().slice(0, 10)}`;
    }
  };

  const abrirCrear = (fechaInicial?: Date, horaInicial?: string) => {
    setEventoEditar(null);
    setModalEvento(true);
    if (fechaInicial) setSlotInicial({ fecha: fechaInicial });
    if (horaInicial !== undefined) {
      const h = typeof horaInicial === 'string' ? parseInt(horaInicial.slice(0, 2), 10) : horaInicial;
      setSlotInicial((s) => ({ ...s, hora: h }));
    }
  };

  const fechaParaSlot = slotInicial?.fecha || fecha;
  const horaParaSlot =
    slotInicial?.hora != null ? `${slotInicial.hora.toString().padStart(2, '0')}:00` : undefined;

  const fechasConEventos = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.inicio.toDateString()));
    return Array.from(set).map((s) => new Date(s));
  }, [items]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 flex flex-col min-h-0">
        <CalendarioHeader
          fecha={fecha}
          vista={vista}
          calendario={calendario}
          onFechaChange={setFecha}
          onVistaChange={setVista}
          onCalendarioChange={setCalendario}
          onIrHoy={() => setFecha(new Date())}
          onCrearEvento={() => abrirCrear()}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          espaciosDisponibles={espaciosDisponibles}
          onEspaciosDisponiblesChange={setEspaciosDisponibles}
          onSincronizar={cargar}
        />

        <div className="flex gap-4 mt-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
                Cargando calendario…
              </div>
            ) : (
              <>
                {vista === 'dia' && (
                  <VistaDiaCalendario
                    items={itemsFiltrados}
                    fecha={fecha}
                    onItemClick={handleItemClick}
                    onSlotClick={(hora) => abrirCrear(fecha, `${hora.toString().padStart(2, '0')}:00`)}
                  />
                )}
                {vista === 'semana' && (
                  <VistaSemanaCalendario
                    items={itemsFiltrados}
                    fecha={fecha}
                    onItemClick={handleItemClick}
                    onSlotClick={(dia, hora) => abrirCrear(dia, `${hora.toString().padStart(2, '0')}:00`)}
                  />
                )}
                {vista === 'mes' && (
                  <VistaMesCalendario
                    items={itemsFiltrados}
                    fecha={fecha}
                    onFechaChange={setFecha}
                    onItemClick={handleItemClick}
                  />
                )}
                {vista === 'programar' && (
                  <VistaProgramarCalendario
                    items={itemsFiltrados}
                    fechaInicio={rangoInicio}
                    fechaFin={rangoFin}
                    onItemClick={handleItemClick}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar derecho: mini calendario y opciones */}
          <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 gap-4">
            <MiniCalendar
              selectedDate={fecha}
              onDateSelect={setFecha}
              highlightedDates={fechasConEventos}
            />
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Leyenda</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
                  Citas
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                  Eventos
                </div>
              </div>
            </div>
          </aside>
        </div>

        <EventoModal
          isOpen={modalEvento}
          onClose={() => {
            setModalEvento(false);
            setEventoEditar(null);
            setSlotInicial(null);
          }}
          onSave={handleSaveEvento}
          onDelete={handleDeleteEvento}
          evento={eventoEditar}
          fechaInicial={fechaParaSlot}
          horaInicial={horaParaSlot}
        />
      </div>
    </DashboardLayout>
  );
}
