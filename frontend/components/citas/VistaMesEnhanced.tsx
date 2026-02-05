'use client';

import { useState, useMemo, useEffect } from 'react';
import { Cita } from '@/types';
import { DOCTORES } from '@/lib/doctores-data';
import { obtenerCapacidadPorDoctor } from '@/lib/capacidad-doctor.utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, BadgeDollarSign, Ticket, RefreshCw } from 'lucide-react';

interface VistaMesEnhancedProps {
  citas: Cita[];
  fechaSeleccionada: Date;
  selectedDoctores: string[];
  onDayClick: (fecha: Date) => void;
  densityMode?: boolean;
}

export function VistaMesEnhanced({ 
  citas, 
  fechaSeleccionada, 
  selectedDoctores,
  onDayClick,
  densityMode = true 
}: VistaMesEnhancedProps) {
  // Capacidad máxima diaria por doctor (cache por mes)
  const [capacidadesPorDia, setCapacidadesPorDia] = useState<Record<string, number>>({});
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Obtener días del mes con padding para cuadrícula completa
  const diasDelMes = useMemo(() => {
    const inicio = startOfMonth(fechaSeleccionada);
    const fin = endOfMonth(fechaSeleccionada);
    const inicioSemana = startOfWeek(inicio, { weekStartsOn: 1 });
    const finSemana = endOfWeek(fin, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: inicioSemana, end: finSemana });
  }, [fechaSeleccionada]);

  // Calcular estadísticas por día
  const estadisticasPorDia = useMemo(() => {
    const stats = new Map<string, {
      total: number;
      confirmadas: number;
      pendientes: number;
      canceladas: number;
      noAsistio: number;
      ingresos: number;
      densidad: 'baja' | 'media' | 'alta';
      citasList: Cita[];
      porDoctor: Map<string, number>;
      doctorIds: string[];
    }>();

    diasDelMes.forEach(dia => {
      const diaKey = dia.toISOString().split('T')[0];
      const citasDia = citas.filter(c => {
        const fechaCita = new Date(c.fecha || c.fechaCita);
        return isSameDay(fechaCita, dia);
      });

      const porDoctor = new Map<string, number>();
      const doctorIds: string[] = [];
      citasDia.forEach(c => {
        const doctorNombre = c.doctor || c.medicoAsignado;
        // No hay doctorId explícito, usamos el nombre como identificador único
        if (doctorNombre) {
          porDoctor.set(doctorNombre, (porDoctor.get(doctorNombre) || 0) + 1);
          if (!doctorIds.includes(doctorNombre)) doctorIds.push(doctorNombre);
        }
      });

      const confirmadas = citasDia.filter(c => c.estado === 'Confirmada').length;
      const pendientes = citasDia.filter(c => c.estado === 'Agendada').length;
      const canceladas = citasDia.filter(c => c.estado === 'Cancelada').length;
      const noAsistio = citasDia.filter(c => c.estado === 'No_Asistio').length;
      const ingresos = citasDia.reduce((sum, c) => sum + (c.montoAbonado || 0), 0);

      let densidad: 'baja' | 'media' | 'alta' = 'baja';
      if (citasDia.length > 8) densidad = 'alta';
      else if (citasDia.length > 4) densidad = 'media';

      stats.set(diaKey, {
        total: citasDia.length,
        confirmadas,
        pendientes,
        canceladas,
        noAsistio,
        ingresos,
        densidad,
        citasList: citasDia,
        porDoctor,
        doctorIds
      });
    });

    return stats;
  }, [citas, diasDelMes]);

  // Obtener capacidades máximas por día (solo una vez por mes)
  useEffect(() => {
    async function fetchCapacidades() {
      const capacidades: Record<string, number> = {};
      for (const dia of diasDelMes) {
        const diaKey = dia.toISOString().split('T')[0];
        const stats = estadisticasPorDia.get(diaKey);
        if (!stats) continue;
        // Simulación: sumar 10 por cada doctor (reemplazar por llamada real a la API)
        // const capacidadesDoctores = await obtenerCapacidadPorDoctor(dia, stats.citasList);
        // capacidades[diaKey] = Object.values(capacidadesDoctores).reduce((a, b) => a + b, 0) || 0;
        capacidades[diaKey] = stats.doctorIds.length > 0 ? stats.doctorIds.length * 10 : 60; // fallback
      }
      setCapacidadesPorDia(capacidades);
    }
    fetchCapacidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada, citas]);

  const getDensidadColor = (densidad: 'baja' | 'media' | 'alta', hasHover: boolean) => {
    if (!densityMode) return '';
    
    const colors = {
      baja: hasHover ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200',
      media: hasHover ? 'bg-yellow-100 border-yellow-300' : 'bg-yellow-50 border-yellow-200',
      alta: hasHover ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200'
    };
    
    return colors[densidad];
  };

  const getHeatmapIntensity = (total: number) => {
    if (total === 0) return 'opacity-0';
    if (total <= 2) return 'opacity-20';
    if (total <= 4) return 'opacity-40';
    if (total <= 6) return 'opacity-60';
    if (total <= 8) return 'opacity-80';
    return 'opacity-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
      {/* Encabezado de días de la semana */}
      <div className="grid grid-cols-7 bg-gradient-to-r from-indigo-600 to-purple-600">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
          <div
            key={dia}
            className="text-center py-3 text-sm font-bold text-white"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
        {diasDelMes.map((dia) => {
          const diaKey = dia.toISOString().split('T')[0];
          const stats = estadisticasPorDia.get(diaKey);
          const esHoy = isToday(dia);
          const esMesActual = isSameMonth(dia, fechaSeleccionada);
          const isHovered = hoveredDay && isSameDay(hoveredDay, dia);

          return (
            <div
              key={diaKey}
              onClick={() => onDayClick(dia)}
              onMouseEnter={() => setHoveredDay(dia)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`
                min-h-[140px] p-2 cursor-pointer transition-all duration-200
                ${!esMesActual ? 'bg-gray-50' : 'bg-white'}
                ${esHoy ? 'ring-2 ring-indigo-500 ring-inset' : ''}
                ${isHovered ? 'bg-indigo-50 scale-[1.02] z-10 shadow-lg' : 'hover:bg-gray-50'}
                ${stats && stats.total > 0 && densityMode ? getDensidadColor(stats.densidad, isHovered || false) : ''}
              `}
            >
              {/* Número del día */}
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm font-semibold
                  ${!esMesActual ? 'text-gray-400' : esHoy ? 'text-indigo-600 text-lg' : 'text-gray-900'}
                `}>
                  {format(dia, 'd')}
                </span>
                
                {/* Badge de total */}
                {stats && stats.total > 0 && (
                  <span className={`
                    text-xs font-bold px-2 py-0.5 rounded-full
                    ${stats.densidad === 'alta' ? 'bg-red-600 text-white' :
                      stats.densidad === 'media' ? 'bg-yellow-600 text-white' :
                      'bg-green-600 text-white'}
                  `}>
                    {stats.total}
                  </span>
                )}
              </div>

              {/* Mapa de calor - Fondo animado */}
              {densityMode && stats && stats.total > 0 && (
                <div className={`
                  absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 pointer-events-none
                  ${getHeatmapIntensity(stats.total)}
                  ${isHovered ? 'animate-pulse' : ''}
                `} />
              )}

              {/* Contenido del día: Barra de progreso, texto X/Y Citas e iconografía */}
              <div className="relative z-10 space-y-1">
                {stats && stats.total > 0 ? (
                  <>
                    {/* Barra de progreso y texto */}
                    <div className="flex flex-col items-center gap-1 mt-2">
                      {(() => {
                        const capacidad = capacidadesPorDia[diaKey] || 60;
                        const porcentaje = Math.min(100, Math.round((stats.total / capacidad) * 100));
                        let color = 'bg-green-500';
                        if (porcentaje >= 90) color = 'bg-red-500';
                        else if (porcentaje >= 60) color = 'bg-yellow-500';
                        return (
                          <>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-300 ${color}`}
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 mt-1">
                              {stats.total}/{capacidad} Citas
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    {/* Iconografía de tipos de cita */}
                    <div className="flex gap-1 justify-center mt-1">
                      {/* Si hay alguna cita pagada/abonada */}
                      {stats.citasList.some(c => c.montoAbonado && c.montoAbonado > 0) && (
                        <span title="Cita pagada/abonada" className="text-green-600"><BadgeDollarSign size={16} /></span>
                      )}
                      {/* Si hay alguna cita con promoción */}
                      {stats.citasList.some(c => c.esPromocion) && (
                        <span title="Cita con promoción" className="text-purple-600"><Ticket size={16} /></span>
                      )}
                      {/* Si hay alguna cita reagendada */}
                      {stats.citasList.some(c => c.reagendaciones && c.reagendaciones > 0) && (
                        <span title="Cita reagendada" className="text-orange-500"><RefreshCw size={16} /></span>
                      )}
                    </div>
                  </>
                ) : (
                  esMesActual && (
                    <div className="text-xs text-gray-400 text-center mt-4">
                      Sin citas
                    </div>
                  )
                )}
              </div>

              {/* Tooltip detallado en hover */}
              {isHovered && stats && stats.total > 0 && (
                <div className="absolute -top-2 right-full mr-2 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 min-w-[200px]">
                  <div className="font-bold mb-2 text-sm">
                    {format(dia, 'EEEE d', { locale: es })}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total citas:</span>
                      <span className="font-bold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between text-green-300">
                      <span>Confirmadas:</span>
                      <span className="font-bold">{stats.confirmadas}</span>
                    </div>
                    <div className="flex justify-between text-orange-300">
                      <span>Pendientes:</span>
                      <span className="font-bold">{stats.pendientes}</span>
                    </div>
                    {stats.ingresos > 0 && (
                      <div className="flex justify-between text-emerald-300 mt-2 pt-2 border-t border-gray-700">
                        <span>Ingresos:</span>
                        <span className="font-bold">${stats.ingresos.toLocaleString('es-MX')}</span>
                      </div>
                    )}
                  </div>
                  {/* Flecha del tooltip */}
                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-gray-900 transform rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
