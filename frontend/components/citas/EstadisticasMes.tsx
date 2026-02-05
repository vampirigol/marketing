'use client';

import { useMemo } from 'react';
import { Cita } from '@/types';
import { Calendar, TrendingUp, DollarSign, Activity, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface EstadisticasMesProps {
  citas: Cita[];
  fechaSeleccionada: Date;
}

export function EstadisticasMes({ citas, fechaSeleccionada }: EstadisticasMesProps) {
  const estadisticas = useMemo(() => {
    const inicioMes = startOfMonth(fechaSeleccionada);
    const finMes = endOfMonth(fechaSeleccionada);
    
    // Citas del mes actual
    const citasMes = citas.filter(c => {
      const fechaCita = new Date(c.fecha || c.fechaCita);
      return fechaCita >= inicioMes && fechaCita <= finMes;
    });

    // Citas del mes anterior para comparación
    const inicioMesAnterior = startOfMonth(subMonths(fechaSeleccionada, 1));
    const finMesAnterior = endOfMonth(subMonths(fechaSeleccionada, 1));
    const citasMesAnterior = citas.filter(c => {
      const fechaCita = new Date(c.fecha || c.fechaCita);
      return fechaCita >= inicioMesAnterior && fechaCita <= finMesAnterior;
    });

    // Estadísticas del mes actual
    const total = citasMes.length;
    const confirmadas = citasMes.filter(c => c.estado === 'Confirmada').length;
    const pendientes = citasMes.filter(c =>
      c.estado === 'Agendada' ||
      c.estado === 'Pendiente_Confirmacion' ||
      c.estado === 'Reagendada'
    ).length;
    const canceladas = citasMes.filter(c => c.estado === 'Cancelada').length;
    const noAsistio = citasMes.filter(c =>
      c.estado === 'Inasistencia' ||
      c.estado === 'No_Asistio'
    ).length;
    const finalizadas = citasMes.filter(c => c.estado === 'Finalizada').length;
    
    const ingresos = citasMes.reduce((sum, c) => sum + (c.montoAbonado || 0), 0);
    const ingresosProyectados = citasMes.reduce((sum, c) => sum + (c.costoConsulta || 0), 0);

    // Tasa de ocupación (días con citas / días del mes)
    const diasDelMes = eachDayOfInterval({ start: inicioMes, end: finMes });
    const diasConCitas = diasDelMes.filter(dia => 
      citasMes.some(c => isSameDay(new Date(c.fecha || c.fechaCita), dia))
    ).length;
    const tasaOcupacionDias = (diasConCitas / diasDelMes.length) * 100;

    // Promedio de citas por día con actividad
    const promedioCitasPorDia = diasConCitas > 0 ? total / diasConCitas : 0;

    // Día con más citas
    const citasPorDia = new Map<string, number>();
    citasMes.forEach(c => {
      const fechaKey = new Date(c.fecha || c.fechaCita).toISOString().split('T')[0];
      citasPorDia.set(fechaKey, (citasPorDia.get(fechaKey) || 0) + 1);
    });
    
    let diaMasActivo = { fecha: '', cantidad: 0 };
    citasPorDia.forEach((cantidad, fecha) => {
      if (cantidad > diaMasActivo.cantidad) {
        diaMasActivo = { fecha, cantidad };
      }
    });

    // Comparación con mes anterior
    const totalMesAnterior = citasMesAnterior.length;
    const cambioTotal = totalMesAnterior > 0 
      ? ((total - totalMesAnterior) / totalMesAnterior) * 100 
      : 0;

    const ingresosMesAnterior = citasMesAnterior.reduce((sum, c) => sum + (c.montoAbonado || 0), 0);
    const cambioIngresos = ingresosMesAnterior > 0
      ? ((ingresos - ingresosMesAnterior) / ingresosMesAnterior) * 100
      : 0;

    // Predicción para fin de mes
    const hoy = new Date();
    const diasTranscurridos = hoy.getDate();
    const diasTotalesMes = diasDelMes.length;
    const prediccionTotal = diasTranscurridos > 0 
      ? Math.round((total / diasTranscurridos) * diasTotalesMes)
      : total;
    
    const prediccionIngresos = diasTranscurridos > 0
      ? (ingresos / diasTranscurridos) * diasTotalesMes
      : ingresos;

    // Tasa de conversión
    const tasaConfirmacion = total > 0 ? (confirmadas / total) * 100 : 0;
    const tasaCancelacion = total > 0 ? (canceladas / total) * 100 : 0;
    const tasaNoAsistencia = total > 0 ? (noAsistio / total) * 100 : 0;

    return {
      total,
      confirmadas,
      pendientes,
      canceladas,
      noAsistio,
      finalizadas,
      ingresos,
      ingresosProyectados,
      tasaOcupacionDias,
      promedioCitasPorDia,
      diaMasActivo,
      cambioTotal,
      cambioIngresos,
      prediccionTotal,
      prediccionIngresos,
      tasaConfirmacion,
      tasaCancelacion,
      tasaNoAsistencia
    };
  }, [citas, fechaSeleccionada]);

  const getTrendIcon = (cambio: number) => {
    if (cambio > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (cambio < -5) return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (cambio: number) => {
    if (cambio > 5) return 'text-green-600';
    if (cambio < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Cards principales */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Citas */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">{estadisticas.total}</div>
              <div className="text-xs text-blue-700 font-medium">Citas Total</div>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor(estadisticas.cambioTotal)}`}>
            {getTrendIcon(estadisticas.cambioTotal)}
            <span>{Math.abs(estadisticas.cambioTotal).toFixed(1)}% vs mes anterior</span>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border-2 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-900">
                ${(estadisticas.ingresos / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-emerald-700 font-medium">Ingresos</div>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor(estadisticas.cambioIngresos)}`}>
            {getTrendIcon(estadisticas.cambioIngresos)}
            <span>{Math.abs(estadisticas.cambioIngresos).toFixed(1)}% vs mes anterior</span>
          </div>
        </div>

        {/* Ocupación */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-purple-600" />
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-900">
                {estadisticas.tasaOcupacionDias.toFixed(0)}%
              </div>
              <div className="text-xs text-purple-700 font-medium">Ocupación Días</div>
            </div>
          </div>
          <div className="text-xs text-purple-700 font-semibold">
            {estadisticas.promedioCitasPorDia.toFixed(1)} citas/día activo
          </div>
        </div>

        {/* Confirmación */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">
                {estadisticas.tasaConfirmacion.toFixed(0)}%
              </div>
              <div className="text-xs text-green-700 font-medium">Confirmadas</div>
            </div>
          </div>
          <div className="text-xs text-green-700 font-semibold">
            {estadisticas.confirmadas} de {estadisticas.total}
          </div>
        </div>
      </div>

      {/* Segunda fila: Detalles y predicciones */}
      <div className="grid grid-cols-3 gap-4">
        {/* Día más activo */}
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Día Más Activo
          </h4>
          {estadisticas.diaMasActivo.cantidad > 0 ? (
            <div>
              <div className="text-lg font-bold text-gray-900">
                {format(new Date(estadisticas.diaMasActivo.fecha), 'EEEE d', { locale: es })}
              </div>
              <div className="text-sm text-gray-600">
                {estadisticas.diaMasActivo.cantidad} citas
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No hay datos</div>
          )}
        </div>

        {/* Predicción fin de mes */}
        <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Predicción Fin de Mes
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Citas:</span>
              <span className="font-bold text-gray-900">{estadisticas.prediccionTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ingresos:</span>
              <span className="font-bold text-emerald-700">
                ${estadisticas.prediccionIngresos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Distribución de estados */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Distribución</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Pendientes:</span>
              <span className="font-bold text-orange-700">{estadisticas.pendientes}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Canceladas:</span>
              <span className="font-bold text-red-700">{estadisticas.canceladas}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">No Asistió:</span>
              <span className="font-bold text-red-700">{estadisticas.noAsistio}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Finalizadas:</span>
              <span className="font-bold text-blue-700">{estadisticas.finalizadas}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
