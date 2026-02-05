'use client';

import { useState } from 'react';
import { HorarioDoctor, HORARIOS_DOCTORES } from '@/lib/horarios-data';
import { DOCTORES, Doctor } from '@/lib/doctores-data';
import { Clock, Trash2, Plus, Save, X, Coffee, Calendar } from 'lucide-react';

interface GestionHorariosProps {
  onClose?: () => void;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function GestionHorarios({ onClose }: GestionHorariosProps) {
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>('');
  const [horarios, setHorarios] = useState<HorarioDoctor[]>(HORARIOS_DOCTORES);
  const [editando, setEditando] = useState<string | null>(null);

  const doctor = DOCTORES.find(d => d.id === doctorSeleccionado);
  const horariosDoctor = horarios.filter(h => h.doctorId === doctorSeleccionado);

  const handleAgregarHorario = () => {
    if (!doctorSeleccionado) return;

    const nuevoHorario: HorarioDoctor = {
      doctorId: doctorSeleccionado,
      diaSemana: 1, // Lunes por defecto
      horaInicio: '09:00',
      horaFin: '18:00',
      sucursal: doctor?.sucursal || '',
      tiempoConsultaMinutos: 30,
      activo: true
    };

    setHorarios([...horarios, nuevoHorario]);
  };

  const handleEliminarHorario = (index: number) => {
    const nuevoHorario = horariosDoctor[index];
    setHorarios(horarios.filter(h => 
      !(h.doctorId === nuevoHorario.doctorId && 
        h.diaSemana === nuevoHorario.diaSemana)
    ));
  };

  const handleActualizarHorario = (index: number, campo: keyof HorarioDoctor, valor: any) => {
    const horarioActualizar = horariosDoctor[index];
    const indexGlobal = horarios.findIndex(h => 
      h.doctorId === horarioActualizar.doctorId && 
      h.diaSemana === horarioActualizar.diaSemana
    );

    if (indexGlobal !== -1) {
      const nuevosHorarios = [...horarios];
      nuevosHorarios[indexGlobal] = {
        ...nuevosHorarios[indexGlobal],
        [campo]: valor
      };
      setHorarios(nuevosHorarios);
    }
  };

  const handleGuardar = () => {
    // Aquí se enviaría a la API
    console.log('Guardando horarios:', horarios);
    alert('✅ Horarios guardados correctamente');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Horarios</h2>
              <p className="text-blue-100 text-sm">Configure horarios de atención por doctor</p>
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
          {/* Selector de Doctor */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleccionar Doctor
            </label>
            <select
              value={doctorSeleccionado}
              onChange={(e) => setDoctorSeleccionado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">-- Seleccione un doctor --</option>
              {DOCTORES.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.nombre} - {doc.especialidad} ({doc.sucursal})
                </option>
              ))}
            </select>
          </div>

          {doctorSeleccionado && (
            <>
              {/* Info del Doctor */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-12 rounded-full"
                    style={{ backgroundColor: doctor?.color }}
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">{doctor?.nombre}</h3>
                    <p className="text-sm text-gray-600">{doctor?.especialidad} • {doctor?.sucursal}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de Horarios */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Horarios de Atención</h3>
                <button
                  onClick={handleAgregarHorario}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Horario
                </button>
              </div>

              {horariosDoctor.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No hay horarios configurados</p>
                  <p className="text-sm text-gray-500 mt-1">Haga clic en "Agregar Horario" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {horariosDoctor.map((horario, index) => (
                    <div
                      key={`${horario.doctorId}-${horario.diaSemana}`}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Día de la semana */}
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Día</label>
                          <select
                            value={horario.diaSemana}
                            onChange={(e) => handleActualizarHorario(index, 'diaSemana', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            {DIAS_SEMANA.map((dia, i) => (
                              <option key={i} value={i}>{dia}</option>
                            ))}
                          </select>
                        </div>

                        {/* Hora Inicio */}
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Hora Inicio</label>
                          <input
                            type="time"
                            value={horario.horaInicio}
                            onChange={(e) => handleActualizarHorario(index, 'horaInicio', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        {/* Hora Fin */}
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Hora Fin</label>
                          <input
                            type="time"
                            value={horario.horaFin}
                            onChange={(e) => handleActualizarHorario(index, 'horaFin', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        {/* Tiempo Consulta */}
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Duración (min)</label>
                          <input
                            type="number"
                            value={horario.tiempoConsultaMinutos}
                            onChange={(e) => handleActualizarHorario(index, 'tiempoConsultaMinutos', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            min="15"
                            step="15"
                          />
                        </div>

                        {/* Descanso */}
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                            <Coffee className="w-3 h-3" />
                            Descanso (opcional)
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="time"
                              value={horario.descansoInicio || ''}
                              onChange={(e) => handleActualizarHorario(index, 'descansoInicio', e.target.value)}
                              placeholder="Inicio"
                              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                              type="time"
                              value={horario.descansoFin || ''}
                              onChange={(e) => handleActualizarHorario(index, 'descansoFin', e.target.value)}
                              placeholder="Fin"
                              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleEliminarHorario(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar horario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Los horarios configurados se aplicarán inmediatamente al sistema de citas
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
