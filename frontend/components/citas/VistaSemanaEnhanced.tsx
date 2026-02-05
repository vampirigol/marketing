'use client';

import { useState, useRef, useEffect } from 'react';
import { Cita } from '@/types';
import { ZoomLevel, getZoomConfig } from '@/components/citas/ZoomControls';
import { DOCTORES, getDoctorColor } from '@/lib/doctores-data';
import { 
  User, Clock, MapPin, Tag, DollarSign, 
  CheckCircle2, AlertCircle, Phone, MessageSquare,
  Plus, TrendingUp, Users
} from 'lucide-react';

interface VistaSemanaProps {
  citas: Cita[];
  fecha: Date;
  onCitaClick: (cita: Cita) => void;
  onQuickConfirm?: (citaId: string) => void;
  onQuickCancel?: (citaId: string) => void;
  onCreateCita?: (fecha: Date, hora: string) => void;
  onDragCita?: (citaId: string, nuevaFecha: Date, nuevaHora: string) => void;
  zoomLevel?: ZoomLevel;
  vistaMultiDoctor?: boolean;
  selectedDoctores?: string[];
}

interface CitaWithPosition extends Cita {
  overlaps: number;
  position: number;
}

export function VistaSemanaEnhanced({
  citas,
  fecha,
  onCitaClick,
  onQuickConfirm,
  onQuickCancel,
  onCreateCita,
  onDragCita,
  zoomLevel = 'normal',
  vistaMultiDoctor = false,
  selectedDoctores = []
}: VistaSemanaProps) {
  const [hoveredSlot, setHoveredSlot] = useState<{ dia: Date; hora: number } | null>(null);
  const [hoveredCita, setHoveredCita] = useState<string | null>(null);
  const [draggedCita, setDraggedCita] = useState<Cita | null>(null);
  const [selectedCitas, setSelectedCitas] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState({
    agendada: true,
    confirmada: true,
    llegó: true,
    enAtencion: true,
    finalizada: false,
    cancelada: false
  });

  const ahora = new Date();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();

  // Configuración de zoom
  const zoomConfig = getZoomConfig(zoomLevel);

  // Doctores filtrados para vista multi-doctor
  const doctoresFiltrados = selectedDoctores.length > 0
    ? DOCTORES.filter(d => selectedDoctores.includes(d.id))
    : DOCTORES;

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

  // Filtrar citas según toggles
  const citasFiltradas = citas.filter(c => {
    const estado = c.estado.toLowerCase().replace('_', '');
    return showFilters[estado as keyof typeof showFilters] !== false;
  });

  // Detectar citas solapadas y calcular posiciones
  const getCitasConPosiciones = (citasDelDia: Cita[]): CitaWithPosition[] => {
    const citasOrdenadas = [...citasDelDia].sort((a, b) => 
      a.horaCita.localeCompare(b.horaCita)
    );

    return citasOrdenadas.map((cita, index) => {
      const overlappingCitas = citasOrdenadas.filter((c, i) => {
        if (c.id === cita.id) return false;
        const horaC = parseInt(c.horaCita.split(':')[0]) * 60 + parseInt(c.horaCita.split(':')[1]);
        const horaCita = parseInt(cita.horaCita.split(':')[0]) * 60 + parseInt(cita.horaCita.split(':')[1]);
        const duracionC = c.duracionMinutos || 30;
        const duracionCita = cita.duracionMinutos || 30;
        
        return (horaC < horaCita + duracionCita) && (horaC + duracionC > horaCita);
      });

      return {
        ...cita,
        overlaps: overlappingCitas.length,
        position: index % 2
      };
    });
  };

  // Estadísticas por día
  const getEstadisticasDia = (dia: Date) => {
    const citasDelDia = citasFiltradas.filter(c => {
      const fechaCita = new Date(c.fechaCita);
      return fechaCita.toDateString() === dia.toDateString();
    });

    return {
      total: citasDelDia.length,
      confirmadas: citasDelDia.filter(c => c.estado === 'Confirmada').length,
      pendientes: citasDelDia.filter(c => c.estado === 'Agendada').length,
      ocupacion: Math.min((citasDelDia.length / 12) * 100, 100) // Máx 12 citas por día
    };
  };

  // Manejadores drag & drop
  const handleDragStart = (e: React.DragEvent, cita: Cita) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCita(cita);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dia: Date, hora: number) => {
    e.preventDefault();
    if (draggedCita && onDragCita) {
      const nuevaHora = `${hora.toString().padStart(2, '0')}:00`;
      onDragCita(draggedCita.id, dia, nuevaHora);
    }
    setDraggedCita(null);
  };

  // Click en slot vacío
  const handleSlotClick = (dia: Date, hora: number) => {
    if (onCreateCita) {
      const nuevaHora = `${hora.toString().padStart(2, '0')}:00`;
      onCreateCita(dia, nuevaHora);
    }
  };

  // Toggle selección múltiple
  const toggleSelectCita = (citaId: string, shiftKey: boolean) => {
    if (shiftKey) {
      const newSelected = new Set(selectedCitas);
      if (newSelected.has(citaId)) {
        newSelected.delete(citaId);
      } else {
        newSelected.add(citaId);
      }
      setSelectedCitas(newSelected);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Filtros rápidos visuales */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Mostrar:</span>
          {Object.entries(showFilters).map(([key, value]) => {
            const labels = {
              agendada: { label: 'Agendadas', color: 'blue' },
              confirmada: { label: 'Confirmadas', color: 'green' },
              llegó: { label: 'Llegaron', color: 'purple' },
              enAtencion: { label: 'En Atención', color: 'orange' },
              finalizada: { label: 'Finalizadas', color: 'gray' },
              cancelada: { label: 'Canceladas', color: 'red' }
            };
            const config = labels[key as keyof typeof labels];
            
            return (
              <button
                key={key}
                onClick={() => setShowFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`px-2 py-1 text-xs rounded-md transition-all ${
                  value 
                    ? `bg-${config.color}-100 text-${config.color}-700 border border-${config.color}-300`
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
        
        {selectedCitas.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{selectedCitas.size} seleccionadas</span>
            <button
              onClick={() => selectedCitas.forEach(id => onQuickConfirm?.(id))}
              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Confirmar todas
            </button>
            <button
              onClick={() => setSelectedCitas(new Set())}
              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Header con días y estadísticas */}
      <div className="flex border-b-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white sticky top-0 z-20 shadow-sm">
        <div className="w-16 flex-shrink-0" />
        {dias.map((dia) => {
          const esHoy = dia.toDateString() === new Date().toDateString();
          const stats = getEstadisticasDia(dia);
          const colorOcupacion = stats.ocupacion > 80 ? 'red' : stats.ocupacion > 50 ? 'yellow' : 'green';
          
          return (
            <div
              key={dia.toISOString()}
              className={`flex-1 p-3 border-l border-gray-200 ${
                esHoy ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <div className="text-center">
                <div className={`text-xs uppercase font-semibold ${esHoy ? 'text-blue-600' : 'text-gray-500'}`}>
                  {dia.toLocaleDateString('es-MX', { weekday: 'short' })}
                </div>
                <div className={`text-xl font-bold mt-1 ${esHoy ? 'text-blue-600' : 'text-gray-900'}`}>
                  {dia.getDate()}
                </div>
                
                {/* Mini estadísticas */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="font-semibold text-gray-700">{stats.total}</span>
                    <span className="text-gray-500">citas</span>
                  </div>
                  <div className="flex justify-center gap-2 text-[10px]">
                    <span className="text-green-600 font-medium">✓ {stats.confirmadas}</span>
                    <span className="text-orange-600 font-medium">⏳ {stats.pendientes}</span>
                  </div>
                  
                  {/* Barra de ocupación */}
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`bg-${colorOcupacion}-500 h-1 rounded-full transition-all duration-300`}
                      style={{ width: `${stats.ocupacion}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de citas */}
      <div className="flex-1 overflow-auto relative">
        {horas.map((hora) => {
          const esHoraActual = ahora.toDateString() === fecha.toDateString() && hora === horaActual;
          
          return (
            <div 
              key={hora} 
              className="flex border-b border-gray-100 relative"
              style={{ minHeight: `${zoomConfig.slotHeight}px` }}
            >
              <div className={`w-16 flex-shrink-0 p-2 text-right ${zoomConfig.fontSize} border-r border-gray-200 ${
                esHoraActual ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-500'
              }`}>
                {hora.toString().padStart(2, '0')}:00
                {esHoraActual && (
                  <div className="text-[9px] text-red-600 font-bold mt-0.5">AHORA</div>
                )}
                {esHoraActual && (
                  <div className="text-[9px] text-red-600 font-bold mt-0.5">AHORA</div>
                )}
              </div>
              
              {dias.map((dia) => {
                const citasDelSlot = citasFiltradas.filter((c) => {
                  const fechaCita = new Date(c.fechaCita);
                  return fechaCita.toDateString() === dia.toDateString() &&
                         parseInt(c.horaCita.split(':')[0]) === hora;
                });

                const citasConPos = getCitasConPosiciones(citasDelSlot);
                const isHovered = hoveredSlot?.dia.toDateString() === dia.toDateString() && 
                                hoveredSlot?.hora === hora;
                const isDraggedOver = draggedCita && isHovered;
                const esHoy = dia.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={`${dia.toISOString()}-${hora}`}
                    className={`flex-1 p-1 border-l border-gray-100 relative transition-colors ${
                      esHoy && esHoraActual ? 'bg-blue-50/30' : ''
                    } ${
                      isHovered && !citasDelSlot.length ? 'bg-blue-50 border-blue-200 cursor-pointer' : ''
                    } ${
                      isDraggedOver ? 'bg-green-50 border-green-300 border-2' : ''
                    }`}
                    onMouseEnter={() => setHoveredSlot({ dia, hora })}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={() => {
                      if (!citasDelSlot.length) {
                        handleSlotClick(dia, hora);
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dia, hora)}
                  >
                    {/* Indicador de slot vacío clickeable */}
                    {!citasDelSlot.length && isHovered && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-blue-400" />
                      </div>
                    )}

                    {/* Citas */}
                    <div className={`space-y-1 ${citasConPos.some(c => c.overlaps > 0) ? 'grid grid-cols-2 gap-1' : ''}`}>
                      {citasConPos.map((cita) => (
                        <CitaCardSemana
                          key={cita.id}
                          cita={cita}
                          onClick={(e) => {
                            if (e.shiftKey) {
                              toggleSelectCita(cita.id, true);
                            } else {
                              onCitaClick(cita);
                            }
                          }}
                          onDragStart={(e) => handleDragStart(e, cita)}
                          isSelected={selectedCitas.has(cita.id)}
                          isHovered={hoveredCita === cita.id}
                          onMouseEnter={() => setHoveredCita(cita.id)}
                          onMouseLeave={() => setHoveredCita(null)}
                          onQuickConfirm={onQuickConfirm}
                          onQuickCancel={onQuickCancel}
                          hasOverlap={cita.overlaps > 0}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Línea de hora actual atravesando toda la semana */}
        {dias.some(d => d.toDateString() === ahora.toDateString()) && horaActual >= 8 && horaActual <= 20 && (
          <div
            className="absolute left-16 right-0 z-30 pointer-events-none"
            style={{
              top: `${((horaActual - 8) * 80) + (minutoActual / 60 * 80)}px`
            }}
          >
            <div className="relative">
              <div className="h-0.5 bg-red-500 shadow-lg" />
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute -top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md">
                {ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de cita para vista semana
interface CitaCardSemanaProps {
  cita: CitaWithPosition;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  isSelected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onQuickConfirm?: (citaId: string) => void;
  onQuickCancel?: (citaId: string) => void;
  hasOverlap: boolean;
}

function CitaCardSemana({
  cita,
  onClick,
  onDragStart,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onQuickConfirm,
  onQuickCancel,
  hasOverlap
}: CitaCardSemanaProps) {
  const getEstadoColor = (estado: Cita['estado']) => {
    const colores = {
      'Agendada': 'bg-blue-50 border-blue-300 text-blue-800',
      'Confirmada': 'bg-green-50 border-green-300 text-green-800',
      'Llegó': 'bg-purple-50 border-purple-300 text-purple-800',
      'En_Atencion': 'bg-orange-50 border-orange-300 text-orange-800',
      'Finalizada': 'bg-gray-50 border-gray-300 text-gray-800',
      'Cancelada': 'bg-red-50 border-red-300 text-red-800',
      'No_Asistio': 'bg-red-50 border-red-300 text-red-800',
    };
    return colores[estado] || 'bg-gray-50 border-gray-300 text-gray-800';
  };

  const estadoColor = getEstadoColor(cita.estado);
  const hasConflict = hasOverlap;
  const doctorColor = getDoctorColor(cita.doctor || cita.medicoAsignado || '');

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative text-xs p-2 rounded-lg border-l-4 cursor-move transition-all duration-200 ${estadoColor} ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
      } ${
        isHovered ? 'shadow-lg scale-105 z-10' : 'shadow-sm'
      } ${
        hasConflict ? 'border-l-red-500' : ''
      } ${
        cita.estado === 'En_Atencion' ? 'animate-pulse' : ''
      }`}
      style={{
        borderLeftColor: hasConflict ? undefined : doctorColor
      }}
    >
      {/* Checkbox para selección múltiple */}
      {isHovered && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="absolute top-1 left-1 w-3 h-3 z-10"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Contenido principal */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px]">{cita.horaCita}</span>
          {cita.esPromocion && (
            <span className="text-[9px] bg-purple-600 text-white px-1 rounded">🎁</span>
          )}
        </div>
        
        <div className="font-semibold text-[10px] truncate flex items-center gap-1">
          <User className="w-3 h-3 flex-shrink-0" />
          {cita.pacienteNombre}
        </div>
        
        <div className="text-[9px] text-gray-600 truncate flex items-center gap-1">
          <Tag className="w-2.5 h-2.5 flex-shrink-0" />
          {cita.tipoConsulta}
        </div>
        
        {cita.saldoPendiente > 0 && (
          <div className="flex items-center gap-1 text-[9px] bg-orange-100 text-orange-700 px-1 rounded">
            <DollarSign className="w-2.5 h-2.5" />
            ${cita.saldoPendiente}
          </div>
        )}

        {/* Estado visible */}
        <div className="flex items-center gap-1">
          {cita.estado === 'Confirmada' && <CheckCircle2 className="w-3 h-3 text-green-600" />}
          {cita.estado === 'Agendada' && <Clock className="w-3 h-3 text-blue-600" />}
          {hasConflict && <AlertCircle className="w-3 h-3 text-red-500" />}
        </div>
      </div>

      {/* Quick actions en hover */}
      {isHovered && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-xl border border-gray-200 p-1 z-20">
          {cita.estado === 'Agendada' && onQuickConfirm && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickConfirm(cita.id);
              }}
              className="p-1 hover:bg-green-50 rounded"
              title="Confirmar"
            >
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${cita.pacienteTelefono}`, '_self');
            }}
            className="p-1 hover:bg-blue-50 rounded"
            title="Llamar"
          >
            <Phone className="w-3 h-3 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const mensaje = encodeURIComponent('Recordatorio de su cita médica');
              const telefono = cita.pacienteTelefono?.replace(/\D/g, '') || '';
              if (telefono) {
                window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
              }
            }}
            className="p-1 hover:bg-green-50 rounded"
            title="WhatsApp"
          >
            <MessageSquare className="w-3 h-3 text-green-600" />
          </button>
        </div>
      )}

      {/* Tooltip con información completa */}
      {isHovered && (
        <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-2xl z-30 w-64 pointer-events-none">
          <div className="space-y-2">
            <div className="font-bold border-b border-gray-700 pb-2">{cita.pacienteNombre}</div>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {cita.pacienteTelefono}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {cita.horaCita} ({cita.duracionMinutos || 30} min)
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                Dr(a). {cita.medicoAsignado}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                {cita.sucursalNombre}
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3" />
                {cita.tipoConsulta} - {cita.especialidad}
              </div>
              {cita.saldoPendiente > 0 && (
                <div className="flex items-center gap-2 text-orange-400">
                  <DollarSign className="w-3 h-3" />
                  Saldo pendiente: ${cita.saldoPendiente}
                </div>
              )}
            </div>
          </div>
          {/* Flecha del tooltip */}
          <div className="absolute right-full top-2 border-8 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  );
}
