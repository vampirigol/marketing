'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Cita } from '@/types';
import { ZoomLevel } from '@/components/citas/ZoomControls';
import { Button } from '@/components/ui/Button';
import { CitaCard } from '@/components/citas/CitaCard';
import { VistaSemanaEnhanced } from '@/components/citas/VistaSemanaEnhanced';

interface CalendarViewProps {
  citas: Cita[];
  fechaSeleccionada: Date;
  onFechaChange: (fecha: Date) => void;
  onCitaClick: (cita: Cita) => void;
  vista: 'dia' | 'semana' | 'mes';
  onQuickConfirm?: (citaId: string) => void;
  onQuickCancel?: (citaId: string) => void;
  onCreateCita?: (fecha: Date, hora: string) => void;
  onDragCita?: (citaId: string, nuevaFecha: Date, nuevaHora: string) => void;
  zoomLevel?: ZoomLevel;
  vistaMultiDoctor?: boolean;
  selectedDoctores?: string[];
}

export function CalendarView({
  citas,
  fechaSeleccionada,
  onFechaChange,
  onCitaClick,
  vista,
  onQuickConfirm,
  onQuickCancel,
  onCreateCita,
  onDragCita,
  zoomLevel = 'normal',
  vistaMultiDoctor = false,
  selectedDoctores = []
}: CalendarViewProps) {
  const cambiarDia = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    onFechaChange(nuevaFecha);
  };

  const irHoy = () => {
    onFechaChange(new Date());
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Header de navegación */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={irHoy}>
            Hoy
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cambiarDia(vista === 'dia' ? -1 : vista === 'semana' ? -7 : -30)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cambiarDia(vista === 'dia' ? 1 : vista === 'semana' ? 7 : 30)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {fechaSeleccionada.toLocaleDateString('es-MX', {
              weekday: vista === 'dia' ? 'long' : undefined,
              year: 'numeric',
              month: 'long',
              day: vista !== 'mes' ? 'numeric' : undefined
            })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {citas.length} cita{citas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Contenido del calendario según vista */}
      <div className="flex-1 overflow-y-auto">
        {vista === 'dia' && (
          <VistaDia
            citas={citas}
            fecha={fechaSeleccionada}
            onCitaClick={onCitaClick}
            onQuickConfirm={onQuickConfirm}
            onQuickCancel={onQuickCancel}
          />
        )}
        {vista === 'semana' && (
          <VistaSemanaEnhanced
            citas={citas}
            fecha={fechaSeleccionada}
            onCitaClick={onCitaClick}
            onQuickConfirm={onQuickConfirm}
            onQuickCancel={onQuickCancel}
            onCreateCita={onCreateCita}
            onDragCita={onDragCita}
            zoomLevel={zoomLevel}
            vistaMultiDoctor={vistaMultiDoctor}
            selectedDoctores={selectedDoctores}
          />
        )}
        {vista === 'mes' && (
          <VistaMes
            citas={citas}
            fecha={fechaSeleccionada}
            onFechaChange={onFechaChange}
          />
        )}
      </div>
    </div>
  );
}

// Vista de Día - Timeline con slots de 30 minutos
function VistaDia({ citas, fecha, onCitaClick, onQuickConfirm, onQuickCancel }: {
  citas: Cita[];
  fecha: Date;
  onCitaClick: (cita: Cita) => void;
  onQuickConfirm?: (citaId: string) => void;
  onQuickCancel?: (citaId: string) => void;
}) {
  const horas = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 AM - 8:00 PM
  const ahora = new Date();
  const esHoy = fecha.toDateString() === ahora.toDateString();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const horaActualRef = useRef<HTMLDivElement>(null);

  // Auto-scroll a la hora actual o a la próxima cita
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (esHoy && horaActualRef.current) {
      // Scroll a la hora actual
      horaActualRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (citas.length > 0) {
      // Scroll a la primera cita
      const primeraCita = citas.sort((a, b) => a.horaCita.localeCompare(b.horaCita))[0];
      const horaPrimeraCita = parseInt(primeraCita.horaCita.split(':')[0]);
      const elemento = scrollContainerRef.current.querySelector(`[data-hora="${horaPrimeraCita}"]`);
      elemento?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [esHoy, citas]);

  // Agrupar citas por hora
  const citasPorHora = citas.reduce((acc, cita) => {
    const hora = parseInt(cita.horaCita.split(':')[0]);
    if (!acc[hora]) acc[hora] = [];
    acc[hora].push(cita);
    return acc;
  }, {} as Record<number, Cita[]>);

  const handleQuickCall = (telefono: string) => {
    window.open(`tel:${telefono}`, '_self');
  };

  const handleQuickWhatsApp = (telefono: string) => {
    const mensaje = encodeURIComponent('Hola, le recordamos su cita programada.');
    window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensaje}`, '_blank');
  };

  return (
    <div ref={scrollContainerRef} className="relative">
      {horas.map((hora) => {
        const citasEnHora = citasPorHora[hora] || [];
        const esHoraActual = esHoy && hora === horaActual;

        return (
          <div
            key={hora}
            data-hora={hora}
            ref={esHoraActual ? horaActualRef : null}
            className={`flex border-b border-gray-100 min-h-[80px] transition-colors ${
              esHoraActual ? 'bg-blue-50/30 border-blue-200' : ''
            }`}
          >
            {/* Columna de hora */}
            <div className="w-20 flex-shrink-0 p-3 text-right border-r border-gray-200">
              <span className={`text-sm font-medium ${
                esHoraActual ? 'text-blue-600 font-bold' : 'text-gray-500'
              }`}>
                {hora.toString().padStart(2, '0')}:00
              </span>
              {esHoraActual && (
                <div className="text-[10px] text-blue-600 font-semibold mt-1 animate-pulse">
                  AHORA
                </div>
              )}
            </div>

            {/* Columna de citas */}
            <div className="flex-1 p-2 relative">
              {citasEnHora.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-300">
                  {/* Espacio vacío */}
                </div>
              ) : (
                <div className="space-y-2">
                  {citasEnHora.map((cita) => (
                    <CitaCard
                      key={cita.id}
                      cita={cita}
                      onClick={() => onCitaClick(cita)}
                      vista="dia"
                      onQuickConfirm={onQuickConfirm}
                      onQuickCancel={onQuickCancel}
                      onQuickCall={handleQuickCall}
                      onQuickWhatsApp={handleQuickWhatsApp}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Línea indicadora de hora actual mejorada */}
      {esHoy && horaActual >= 8 && horaActual <= 20 && (
        <div
          className="absolute left-20 right-0 z-20 pointer-events-none"
          style={{
            top: `${((horaActual - 8) * 80) + (minutoActual / 60 * 80)}px`
          }}
        >
          <div className="relative">
            {/* Línea principal */}
            <div className="h-0.5 bg-red-500 shadow-lg animate-pulse" />
            {/* Círculo izquierdo */}
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-md" />
            {/* Badge con hora */}
            <div className="absolute -top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md">
              {ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Vista de Semana - Grid de 7 días
function VistaSemana({ citas, fecha, onCitaClick }: {
  citas: Cita[];
  fecha: Date;
  onCitaClick: (cita: Cita) => void;
}) {
  // Obtener el lunes de la semana actual
  const primerDia = new Date(fecha);
  const dia = primerDia.getDay();
  const diff = primerDia.getDate() - dia + (dia === 0 ? -6 : 1);
  primerDia.setDate(diff);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(primerDia);
    d.setDate(primerDia.getDate() + i);
    return d;
  });

  const horas = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="flex flex-col">
      {/* Header con días */}
      <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="w-16 flex-shrink-0" /> {/* Espacio para horas */}
        {dias.map((dia) => {
          const esHoy = dia.toDateString() === new Date().toDateString();
          return (
            <div
              key={dia.toISOString()}
              className={`flex-1 p-3 text-center border-l border-gray-200 ${
                esHoy ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`text-xs uppercase ${esHoy ? 'text-blue-600' : 'text-gray-500'}`}>
                {dia.toLocaleDateString('es-MX', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                esHoy ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {dia.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de citas */}
      <div className="flex-1 overflow-auto">
        {horas.map((hora) => (
          <div key={hora} className="flex min-h-[60px] border-b border-gray-100">
            <div className="w-16 flex-shrink-0 p-2 text-right text-xs text-gray-500 border-r border-gray-200">
              {hora.toString().padStart(2, '0')}:00
            </div>
            {dias.map((dia) => {
              const citasDelDia = citas.filter((c) => {
                const fechaCita = new Date(c.fechaCita);
                return fechaCita.toDateString() === dia.toDateString() &&
                       parseInt(c.horaCita.split(':')[0]) === hora;
              });

              return (
                <div
                  key={`${dia.toISOString()}-${hora}`}
                  className="flex-1 p-1 border-l border-gray-100 relative"
                >
                  {citasDelDia.map((cita) => (
                    <div
                      key={cita.id}
                      onClick={() => onCitaClick(cita)}
                      className="cursor-pointer mb-1"
                    >
                      <CitaCard cita={cita} vista="semana" />
                    </div>
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

// Vista de Mes - Calendario mensual
function VistaMes({ citas, fecha, onFechaChange }: {
  citas: Cita[];
  fecha: Date;
  onFechaChange: (fecha: Date) => void;
}) {
  const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = primerDia.getDay();

  const dias: (Date | null)[] = [];

  // Días vacíos al inicio
  for (let i = 0; i < primerDiaSemana; i++) {
    dias.push(null);
  }

  // Días del mes
  for (let i = 1; i <= diasEnMes; i++) {
    dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), i));
  }

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="p-4">
      {/* Header de días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {diasSemana.map((dia) => (
          <div key={dia} className="text-center text-xs font-semibold text-gray-500 py-2">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia, index) => {
          if (!dia) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const citasDelDia = citas.filter((c) => {
            const fechaCita = new Date(c.fechaCita);
            return fechaCita.toDateString() === dia.toDateString();
          });

          const esHoy = dia.toDateString() === new Date().toDateString();
          const esSeleccionado = dia.toDateString() === fecha.toDateString();

          return (
            <div
              key={dia.toISOString()}
              onClick={() => onFechaChange(dia)}
              className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                esHoy
                  ? 'border-blue-500 bg-blue-50'
                  : esSeleccionado
                  ? 'border-blue-300 bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${
                esHoy ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {dia.getDate()}
              </div>

              {citasDelDia.length > 0 && (
                <div className="space-y-1">
                  {citasDelDia.slice(0, 2).map((cita) => (
                    <div
                      key={cita.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${
                        cita.appointmentType === 'SPIRITUAL'
                          ? 'bg-violet-100 text-violet-700'
                          : cita.estado === 'Confirmada'
                          ? 'bg-green-100 text-green-700'
                          : cita.estado === 'Pendiente_Confirmacion'
                          ? 'bg-amber-100 text-amber-700'
                          : cita.estado === 'Reagendada'
                          ? 'bg-indigo-100 text-indigo-700'
                          : cita.estado === 'Agendada'
                          ? 'bg-blue-100 text-blue-700'
                          : cita.estado === 'Inasistencia' || cita.estado === 'No_Asistio'
                          ? 'bg-rose-100 text-rose-700'
                          : cita.estado === 'Cancelada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cita.horaCita}
                    </div>
                  ))}
                  {citasDelDia.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{citasDelDia.length - 2} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
