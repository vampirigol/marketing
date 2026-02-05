'use client';

import { useState, useMemo } from 'react';
import { Cita } from '@/types';
import { DOCTORES, Doctor } from '@/lib/doctores-data';
import { 
  HORARIOS_DOCTORES, 
  AUSENCIAS_DOCTORES, 
  obtenerHorasDisponibles 
} from '@/lib/horarios-data';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  Activity,
  PieChart,
  BarChart3,
  Download,
  X,
  AlertCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportesOcupacionProps {
  citas: Cita[];
  onClose?: () => void;
}

export function ReportesOcupacion({ citas, onClose }: ReportesOcupacionProps) {
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'hoy' | 'semana' | 'mes'>('semana');

  const obtenerFechaRango = () => {
    const hoy = new Date();
    switch (periodoSeleccionado) {
      case 'hoy':
        return { inicio: hoy, fin: hoy };
      case 'semana':
        return { inicio: startOfWeek(hoy, { weekStartsOn: 1 }), fin: endOfWeek(hoy, { weekStartsOn: 1 }) };
      case 'mes': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        return { inicio: inicioMes, fin: finMes };
      }
    }
  };

  const estadisticasPorDoctor = useMemo(() => {
    return DOCTORES.map(doctor => {
      const citasDoctor = citas.filter(c => 
        (c.doctor || c.medicoAsignado) === doctor.nombre
      );

      const { inicio, fin } = obtenerFechaRango();
      const citasPeriodo = citasDoctor.filter(c => {
        const fechaCita = new Date(c.fecha || c.fechaCita);
        return fechaCita >= inicio && fechaCita <= fin;
      });

      // Calcular horas disponibles en el periodo
      const diasPeriodo = eachDayOfInterval({ start: inicio, end: fin });
      const horasTotalesDisponibles = diasPeriodo.reduce((total, dia) => {
        const horasDisponibles = obtenerHorasDisponibles(doctor.id, dia);
        return total + horasDisponibles.length;
      }, 0);

      const horasOcupadas = citasPeriodo.length;
      const tasaOcupacion = horasTotalesDisponibles > 0 
        ? (horasOcupadas / horasTotalesDisponibles) * 100 
        : 0;

      const confirmadas = citasPeriodo.filter(c => c.estado === 'Confirmada').length;
      const pendientes = citasPeriodo.filter(c =>
        c.estado === 'Agendada' ||
        c.estado === 'Pendiente_Confirmacion' ||
        c.estado === 'Reagendada'
      ).length;
      const canceladas = citasPeriodo.filter(c => c.estado === 'Cancelada').length;
      const noAsistio = citasPeriodo.filter(c =>
        c.estado === 'Inasistencia' ||
        c.estado === 'No_Asistio'
      ).length;

      const finalizadas = citasPeriodo.filter(c => c.estado === 'Finalizada').length;
      const ingresosPotenciales = citasPeriodo.reduce((sum, c) => sum + (c.costoConsulta || 0), 0);
      const ingresosReales = citasPeriodo
        .filter(c => c.estado === 'Finalizada')
        .reduce((sum, c) => sum + (c.montoAbonado || 0), 0);

      return {
        doctor,
        totalCitas: citasPeriodo.length,
        confirmadas,
        pendientes,
        canceladas,
        noAsistio,
        finalizadas,
        horasTotalesDisponibles,
        horasOcupadas,
        tasaOcupacion,
        ingresosPotenciales,
        ingresosReales,
        promedioTiempoConsulta: citasPeriodo[0]?.duracionMinutos || 30
      };
    });
  }, [citas, periodoSeleccionado]);

  const estadisticasGenerales = useMemo(() => {
    const totalCitas = estadisticasPorDoctor.reduce((sum, e) => sum + e.totalCitas, 0);
    const totalConfirmadas = estadisticasPorDoctor.reduce((sum, e) => sum + e.confirmadas, 0);
    const totalCanceladas = estadisticasPorDoctor.reduce((sum, e) => sum + e.canceladas, 0);
    const totalNoAsistio = estadisticasPorDoctor.reduce((sum, e) => sum + e.noAsistio, 0);
    const totalFinalizadas = estadisticasPorDoctor.reduce((sum, e) => sum + e.finalizadas, 0);
    const totalIngresos = estadisticasPorDoctor.reduce((sum, e) => sum + e.ingresosReales, 0);
    const tasaOcupacionPromedio = estadisticasPorDoctor.reduce((sum, e) => sum + e.tasaOcupacion, 0) / estadisticasPorDoctor.length;

    return {
      totalCitas,
      totalConfirmadas,
      totalCanceladas,
      totalNoAsistio,
      totalFinalizadas,
      totalIngresos,
      tasaOcupacionPromedio,
      tasaConfirmacion: totalCitas > 0 ? (totalConfirmadas / totalCitas) * 100 : 0,
      tasaCancelacion: totalCitas > 0 ? (totalCanceladas / totalCitas) * 100 : 0,
      tasaNoAsistencia: totalCitas > 0 ? (totalNoAsistio / totalCitas) * 100 : 0,
      showRate: totalConfirmadas > 0 ? (totalFinalizadas / totalConfirmadas) * 100 : 0,
      noShowRate: totalConfirmadas > 0 ? (totalNoAsistio / totalConfirmadas) * 100 : 0
    };
  }, [estadisticasPorDoctor]);

  const estadisticasDoctor = doctorSeleccionado 
    ? estadisticasPorDoctor.find(e => e.doctor.id === doctorSeleccionado)
    : null;

  const handleExportarCSV = () => {
    const headers = ['Doctor', 'Especialidad', 'Total Citas', 'Confirmadas', 'Pendientes', 'Canceladas', 'No Asistió', 'Tasa Ocupación %', 'Ingresos'];
    const rows = estadisticasPorDoctor.map(e => [
      e.doctor.nombre,
      e.doctor.especialidad,
      e.totalCitas,
      e.confirmadas,
      e.pendientes,
      e.canceladas,
      e.noAsistio,
      e.tasaOcupacion.toFixed(1),
      `$${e.ingresosReales.toFixed(2)}`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ocupacion-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Reportes de Ocupación</h2>
              <p className="text-indigo-100 text-sm">Estadísticas y métricas por doctor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={doctorSeleccionado}
                onChange={(e) => setDoctorSeleccionado(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Todos los doctores</option>
                {DOCTORES.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.nombre} - {doc.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Periodo
              </label>
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                {(['hoy', 'semana', 'mes'] as const).map(periodo => (
                  <button
                    key={periodo}
                    onClick={() => setPeriodoSeleccionado(periodo)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      periodoSeleccionado === periodo
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Estadísticas Generales */}
          {!doctorSeleccionado && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Resumen General</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-900">{estadisticasGenerales.totalCitas}</span>
                    </div>
                    <p className="text-sm font-medium text-blue-700">Total Citas</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8 text-green-600" />
                      <span className="text-2xl font-bold text-green-900">
                        {estadisticasGenerales.tasaConfirmacion.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-green-700">Tasa Confirmación</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-8 h-8 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-900">
                        {estadisticasGenerales.tasaOcupacionPromedio.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-purple-700">Ocupación Promedio</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border-2 border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                      <span className="text-2xl font-bold text-emerald-900">
                        ${estadisticasGenerales.totalIngresos.toLocaleString('es-MX')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-emerald-700">Ingresos Total</p>
                  </div>

                  <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-4 border-2 border-sky-200">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8 text-sky-600" />
                      <span className="text-2xl font-bold text-sky-900">
                        {estadisticasGenerales.showRate.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-sky-700">Show Rate</p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border-2 border-rose-200">
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle className="w-8 h-8 text-rose-600" />
                      <span className="text-2xl font-bold text-rose-900">
                        {estadisticasGenerales.noShowRate.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-rose-700">No-show</p>
                  </div>
                </div>
              </div>

              {/* Tabla por Doctor */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">👨‍⚕️ Estadísticas por Doctor</h3>
                  <button
                    onClick={handleExportarCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Doctor</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Confirmadas</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Pendientes</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Canceladas</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">No Asistió</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ocupación</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {estadisticasPorDoctor
                        .sort((a, b) => b.totalCitas - a.totalCitas)
                        .map((stat) => (
                        <tr key={stat.doctor.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stat.doctor.color }}
                              />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{stat.doctor.nombre}</p>
                                <p className="text-xs text-gray-600">{stat.doctor.especialidad}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-900">{stat.totalCitas}</td>
                          <td className="px-4 py-3 text-center text-green-700 font-semibold">{stat.confirmadas}</td>
                          <td className="px-4 py-3 text-center text-orange-700 font-semibold">{stat.pendientes}</td>
                          <td className="px-4 py-3 text-center text-red-700 font-semibold">{stat.canceladas}</td>
                          <td className="px-4 py-3 text-center text-red-700 font-semibold">{stat.noAsistio}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    stat.tasaOcupacion > 80 ? 'bg-red-500' :
                                    stat.tasaOcupacion > 50 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(stat.tasaOcupacion, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-700">
                                {stat.tasaOcupacion.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">
                            ${stat.ingresosReales.toLocaleString('es-MX')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Detalle de Doctor Específico */}
          {estadisticasDoctor && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-4 h-12 rounded-full"
                    style={{ backgroundColor: estadisticasDoctor.doctor.color }}
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{estadisticasDoctor.doctor.nombre}</h3>
                    <p className="text-gray-600">{estadisticasDoctor.doctor.especialidad} • {estadisticasDoctor.doctor.sucursal}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">{estadisticasDoctor.totalCitas}</p>
                    <p className="text-sm text-gray-600 mt-1">Citas Totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{estadisticasDoctor.confirmadas}</p>
                    <p className="text-sm text-gray-600 mt-1">Confirmadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{estadisticasDoctor.tasaOcupacion.toFixed(0)}%</p>
                    <p className="text-sm text-gray-600 mt-1">Ocupación</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">${estadisticasDoctor.ingresosReales.toLocaleString('es-MX')}</p>
                    <p className="text-sm text-gray-600 mt-1">Ingresos</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-3">📈 Distribución de Estados</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confirmadas</span>
                      <span className="font-bold text-green-600">{estadisticasDoctor.confirmadas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pendientes</span>
                      <span className="font-bold text-orange-600">{estadisticasDoctor.pendientes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Canceladas</span>
                      <span className="font-bold text-red-600">{estadisticasDoctor.canceladas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">No Asistió</span>
                      <span className="font-bold text-red-600">{estadisticasDoctor.noAsistio}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-3">⏱️ Capacidad</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Horas Disponibles</span>
                      <span className="font-bold text-gray-900">{estadisticasDoctor.horasTotalesDisponibles}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Horas Ocupadas</span>
                      <span className="font-bold text-indigo-600">{estadisticasDoctor.horasOcupadas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Horas Libres</span>
                      <span className="font-bold text-green-600">
                        {estadisticasDoctor.horasTotalesDisponibles - estadisticasDoctor.horasOcupadas}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Duración Consulta</span>
                      <span className="font-bold text-gray-900">{estadisticasDoctor.promedioTiempoConsulta} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
