'use client';

import { useState, useMemo } from 'react';
import { Cita } from '@/types';
import { DOCTORES, Doctor, obtenerDoctorPorId } from '@/lib/doctores-data';
import { 
  HORARIOS_DOCTORES, 
  AUSENCIAS_DOCTORES, 
  obtenerHorarioDoctor,
  obtenerHorasDisponibles,
  doctorEstaAusente,
  esDiaFestivo,
  DIAS_FESTIVOS_2026
} from '@/lib/horarios-data';
import { 
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  CalendarOff,
  Plus,
  ChevronRight,
  Activity,
  Phone,
  MessageSquare,
  X
} from 'lucide-react';
import { format, isToday, isThisWeek, startOfDay, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardDoctorProps {
  doctorId: string;
  citas: Cita[];
  onClose?: () => void;
  onEditarHorario?: () => void;
  onSolicitarAusencia?: () => void;
}

export function DashboardDoctor({ 
  doctorId, 
  citas, 
  onClose,
  onEditarHorario,
  onSolicitarAusencia
}: DashboardDoctorProps) {
  const [vistaSeleccionada, setVistaSeleccionada] = useState<'hoy' | 'semana'>('hoy');
  
  const doctor = useMemo(() => obtenerDoctorPorId(doctorId), [doctorId]);
  
  // Filtrar citas del doctor
  const citasDoctor = useMemo(() => {
    if (!doctor) return [];
    return citas.filter(c => 
      (c.doctor || c.medicoAsignado) === doctor.nombre
    );
  }, [citas, doctor]);

  // Citas de hoy
  const citasHoy = useMemo(() => {
    return citasDoctor.filter(c => {
      const fechaCita = new Date(c.fecha || c.fechaCita);
      return isToday(fechaCita);
    }).sort((a, b) => {
      const horaA = a.hora || a.horaCita || '';
      const horaB = b.hora || b.horaCita || '';
      return horaA.localeCompare(horaB);
    });
  }, [citasDoctor]);

  // Citas de esta semana
  const citasSemana = useMemo(() => {
    return citasDoctor.filter(c => {
      const fechaCita = new Date(c.fecha || c.fechaCita);
      return isThisWeek(fechaCita, { weekStartsOn: 1 });
    }).sort((a, b) => {
      const fechaA = new Date(a.fecha || a.fechaCita);
      const fechaB = new Date(b.fecha || b.fechaCita);
      return fechaA.getTime() - fechaB.getTime();
    });
  }, [citasDoctor]);

  // Próxima cita
  const proximaCita = useMemo(() => {
    const ahora = new Date();
    return citasHoy.find(c => {
      const hora = c.hora || c.horaCita || '00:00';
      const [horaNum, minutos] = hora.split(':');
      const fechaHoraCita = new Date();
      fechaHoraCita.setHours(parseInt(horaNum), parseInt(minutos), 0, 0);
      return fechaHoraCita > ahora;
    });
  }, [citasHoy]);

  // Horario de hoy
  const horarioHoy = useMemo(() => {
    if (!doctor) return null;
    return obtenerHorarioDoctor(doctor.id, new Date());
  }, [doctor]);

  // Ausencias del doctor
  const ausenciasDoctor = useMemo(() => {
    if (!doctor) return [];
    return AUSENCIAS_DOCTORES.filter(a => a.doctorId === doctor.id);
  }, [doctor]);

  // Ausencias próximas (futuras o en curso)
  const ausenciasProximas = useMemo(() => {
    const hoy = startOfDay(new Date());
    return ausenciasDoctor.filter(a => {
      const fin = startOfDay(new Date(a.fechaFin));
      return fin >= hoy;
    }).sort((a, b) => {
      return new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
    });
  }, [ausenciasDoctor]);

  // Estadísticas rápidas
  const estadisticas = useMemo(() => {
    const pendientesConfirmacion = citasHoy.filter(c => 
      c.estado === 'Agendada'
    ).length;
    const confirmadas = citasHoy.filter(c => c.estado === 'Confirmada').length;
    const completadas = citasDoctor.filter(c => c.estado === 'Finalizada').length;
    const noAsistio = citasDoctor.filter(c => c.estado === 'No_Asistio').length;

    return {
      citasHoy: citasHoy.length,
      citasSemana: citasSemana.length,
      pendientesConfirmacion,
      confirmadas,
      completadas,
      noAsistio
    };
  }, [citasHoy, citasSemana, citasDoctor]);

  // Próximos 7 días con disponibilidad
  const proximosDias = useMemo(() => {
    if (!doctor) return [];
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = addDays(new Date(), i);
      const horasDisponibles = obtenerHorasDisponibles(doctor.id, fecha);
      const citasDia = citasDoctor.filter(c => {
        const fechaCita = new Date(c.fecha || c.fechaCita);
        return isSameDay(fechaCita, fecha);
      });
      const estaAusente = doctorEstaAusente(doctor.id, fecha);
      const esFestivo = esDiaFestivo(fecha);

      dias.push({
        fecha,
        horasDisponibles: horasDisponibles.length,
        citasAgendadas: citasDia.length,
        estaAusente,
        esFestivo,
        tasaOcupacion: horasDisponibles.length > 0 
          ? (citasDia.length / horasDisponibles.length) * 100 
          : 0
      });
    }
    return dias;
  }, [doctor, citasDoctor]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Confirmada':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'Agendada':
      case 'Pendiente':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Cancelada':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Finalizada':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'No_Asistio':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (!doctor) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">Doctor no encontrado</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ 
            background: `linear-gradient(135deg, ${doctor.color}dd 0%, ${doctor.color} 100%)` 
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{doctor.nombre}</h2>
              <p className="text-white/90 text-sm">{doctor.especialidad} • {doctor.sucursal}</p>
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
          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">{estadisticas.citasHoy}</span>
              </div>
              <p className="text-sm font-medium text-blue-700">Citas Hoy</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-purple-900">{estadisticas.citasSemana}</span>
              </div>
              <p className="text-sm font-medium text-purple-700">Esta Semana</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <span className="text-2xl font-bold text-orange-900">{estadisticas.pendientesConfirmacion}</span>
              </div>
              <p className="text-sm font-medium text-orange-700">Por Confirmar</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{estadisticas.confirmadas}</span>
              </div>
              <p className="text-sm font-medium text-green-700">Confirmadas</p>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={onEditarHorario}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              <Settings className="w-5 h-5" />
              Editar Mi Horario
            </button>
            <button
              onClick={onSolicitarAusencia}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              <CalendarOff className="w-5 h-5" />
              Solicitar Ausencia
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Columna Izquierda: Horario de Hoy */}
            <div className="col-span-2 space-y-6">
              {/* Próxima Cita Destacada */}
              {proximaCita && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-indigo-900">🔔 Próxima Cita</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-indigo-900">{proximaCita.hora || proximaCita.horaCita}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{proximaCita.pacienteNombre}</p>
                      <p className="text-sm text-gray-600">{proximaCita.motivo || proximaCita.tipoConsulta || 'Consulta general'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista Toggle */}
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setVistaSeleccionada('hoy')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaSeleccionada === 'hoy'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📅 Hoy ({citasHoy.length})
                </button>
                <button
                  onClick={() => setVistaSeleccionada('semana')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vistaSeleccionada === 'semana'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📆 Esta Semana ({citasSemana.length})
                </button>
              </div>

              {/* Lista de Citas */}
              <div className="space-y-3">
                {vistaSeleccionada === 'hoy' && (
                  <>
                    {citasHoy.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No tienes citas agendadas para hoy</p>
                      </div>
                    ) : (
                      citasHoy.map((cita, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{cita.hora || cita.horaCita}</div>
                                <div className="text-xs text-gray-600">{cita.duracionMinutos || 30} min</div>
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-lg">{cita.pacienteNombre}</p>
                                <p className="text-sm text-gray-600">{cita.motivo || cita.tipoConsulta || 'Consulta general'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Tel: {cita.pacienteTelefono || 'No disponible'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 text-xs font-bold rounded-lg border-2 ${getEstadoColor(cita.estado)}`}>
                                {cita.estado}
                              </span>
                              <div className="flex gap-1">
                                <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                  <Phone className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {vistaSeleccionada === 'semana' && (
                  <>
                    {citasSemana.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No tienes citas esta semana</p>
                      </div>
                    ) : (
                      citasSemana.map((cita, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-indigo-600">
                                  {format(new Date(cita.fecha || cita.fechaCita), 'EEE dd', { locale: es })}
                                </div>
                                <div className="text-sm text-gray-600">{cita.hora || cita.horaCita}</div>
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{cita.pacienteNombre}</p>
                                <p className="text-sm text-gray-600">{cita.motivo || cita.tipoConsulta || 'Consulta general'}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-lg border-2 ${getEstadoColor(cita.estado)}`}>
                              {cita.estado}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Columna Derecha: Info Adicional */}
            <div className="space-y-6">
              {/* Mi Horario de Hoy */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Mi Horario Hoy
                </h3>
                {!horarioHoy ? (
                  <p className="text-sm text-gray-600">No trabajas hoy</p>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {horarioHoy.horaInicio} - {horarioHoy.horaFin}
                        </span>
                        <span className="text-xs text-gray-600">{horarioHoy.tiempoConsultaMinutos}min</span>
                      </div>
                      {horarioHoy.descansoInicio && horarioHoy.descansoFin && (
                        <div className="text-xs text-gray-500 ml-4">
                          Descanso: {horarioHoy.descansoInicio} - {horarioHoy.descansoFin}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Próximas Ausencias */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarOff className="w-5 h-5 text-orange-600" />
                  Mis Ausencias
                </h3>
                {ausenciasProximas.length === 0 ? (
                  <p className="text-sm text-gray-600">No tienes ausencias próximas</p>
                ) : (
                  <div className="space-y-2">
                    {ausenciasProximas.slice(0, 3).map((ausencia, idx) => (
                      <div key={idx} className="text-sm bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-orange-900 text-xs">{ausencia.tipoAusencia}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            ausencia.aprobada 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ausencia.aprobada ? 'Aprobada' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700">
                          {format(new Date(ausencia.fechaInicio), 'dd MMM', { locale: es })} - {format(new Date(ausencia.fechaFin), 'dd MMM', { locale: es })}
                        </div>
                        {ausencia.motivo && (
                          <div className="text-xs text-gray-600 mt-1">{ausencia.motivo}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disponibilidad Próximos 7 Días */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Próximos 7 Días
                </h3>
                <div className="space-y-2">
                  {proximosDias.map((dia, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {format(dia.fecha, 'EEE dd', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-600">
                          {dia.estaAusente ? '🚫 Ausente' : 
                           dia.esFestivo ? '🎉 Festivo' :
                           `${dia.citasAgendadas}/${dia.horasDisponibles} citas`}
                        </div>
                      </div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dia.estaAusente || dia.esFestivo ? 'bg-gray-400' :
                            dia.tasaOcupacion > 80 ? 'bg-red-500' :
                            dia.tasaOcupacion > 50 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(dia.tasaOcupacion, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Última actualización: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </div>
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
