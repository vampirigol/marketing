'use client';

import { useState } from 'react';
import { AusenciaDoctor, AUSENCIAS_DOCTORES, DIAS_FESTIVOS_2026 } from '@/lib/horarios-data';
import { DOCTORES } from '@/lib/doctores-data';
import { Calendar, Trash2, Plus, Save, X, AlertCircle, User, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GestionAusenciasProps {
  onClose?: () => void;
}

const TIPOS_AUSENCIA = ['Vacaciones', 'Permiso', 'Incapacidad', 'Capacitacion', 'Otro'] as const;

export function GestionAusencias({ onClose }: GestionAusenciasProps) {
  const [ausencias, setAusencias] = useState<AusenciaDoctor[]>(AUSENCIAS_DOCTORES);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ausenciaEditando, setAusenciaEditando] = useState<AusenciaDoctor | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'ausencias' | 'festivos'>('ausencias');

  const [formulario, setFormulario] = useState<Partial<AusenciaDoctor>>({
    doctorId: '',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    tipoAusencia: 'Vacaciones',
    motivo: '',
    doctorSustituto: '',
    aprobada: false
  });

  const handleAgregarAusencia = () => {
    setFormulario({
      doctorId: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
      tipoAusencia: 'Vacaciones',
      motivo: '',
      doctorSustituto: '',
      aprobada: false
    });
    setAusenciaEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarAusencia = (ausencia: AusenciaDoctor) => {
    setFormulario(ausencia);
    setAusenciaEditando(ausencia);
    setMostrarFormulario(true);
  };

  const handleGuardarAusencia = () => {
    if (!formulario.doctorId || !formulario.fechaInicio || !formulario.fechaFin) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const nuevaAusencia: AusenciaDoctor = {
      id: ausenciaEditando?.id || `aus-${Date.now()}`,
      doctorId: formulario.doctorId!,
      fechaInicio: formulario.fechaInicio!,
      fechaFin: formulario.fechaFin!,
      tipoAusencia: formulario.tipoAusencia || 'Vacaciones',
      motivo: formulario.motivo,
      doctorSustituto: formulario.doctorSustituto,
      aprobada: formulario.aprobada || false
    };

    if (ausenciaEditando) {
      setAusencias(ausencias.map(a => a.id === ausenciaEditando.id ? nuevaAusencia : a));
    } else {
      setAusencias([...ausencias, nuevaAusencia]);
    }

    setMostrarFormulario(false);
    setFormulario({});
  };

  const handleEliminarAusencia = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta ausencia?')) {
      setAusencias(ausencias.filter(a => a.id !== id));
    }
  };

  const handleAprobar = (id: string) => {
    setAusencias(ausencias.map(a => 
      a.id === id ? { ...a, aprobada: !a.aprobada } : a
    ));
  };

  const ausenciasOrdenadas = [...ausencias].sort((a, b) => 
    new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
  );

  const getColorTipoAusencia = (tipo: string) => {
    const colores = {
      'Vacaciones': 'bg-blue-100 text-blue-700 border-blue-300',
      'Permiso': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Incapacidad': 'bg-red-100 text-red-700 border-red-300',
      'Capacitacion': 'bg-green-100 text-green-700 border-green-300',
      'Otro': 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colores[tipo as keyof typeof colores] || colores['Otro'];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Ausencias y Días Festivos</h2>
              <p className="text-purple-100 text-sm">Vacaciones, permisos y días no laborables</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-gray-200 bg-gray-50 px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setVistaActiva('ausencias')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                vistaActiva === 'ausencias'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Ausencias de Doctores
            </button>
            <button
              onClick={() => setVistaActiva('festivos')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                vistaActiva === 'festivos'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Flag className="w-4 h-4 inline mr-2" />
              Días Festivos México
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {vistaActiva === 'ausencias' ? (
            <>
              {/* Botón Agregar */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAgregarAusencia}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Ausencia
                </button>
              </div>

              {/* Formulario */}
              {mostrarFormulario && (
                <div className="mb-6 p-6 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {ausenciaEditando ? 'Editar' : 'Nueva'} Ausencia
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Doctor */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Doctor *
                      </label>
                      <select
                        value={formulario.doctorId}
                        onChange={(e) => setFormulario({ ...formulario, doctorId: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        <option value="">-- Seleccione un doctor --</option>
                        {DOCTORES.map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.nombre} - {doc.especialidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Ausencia *
                      </label>
                      <select
                        value={formulario.tipoAusencia}
                        onChange={(e) => setFormulario({ ...formulario, tipoAusencia: e.target.value as any })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        {TIPOS_AUSENCIA.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    {/* Doctor Sustituto */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Doctor Sustituto (opcional)
                      </label>
                      <select
                        value={formulario.doctorSustituto || ''}
                        onChange={(e) => setFormulario({ ...formulario, doctorSustituto: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        <option value="">Sin sustituto</option>
                        {DOCTORES.filter(d => d.id !== formulario.doctorId).map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha Inicio */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        value={formulario.fechaInicio ? format(new Date(formulario.fechaInicio), 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFormulario({ ...formulario, fechaInicio: new Date(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    {/* Fecha Fin */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        value={formulario.fechaFin ? format(new Date(formulario.fechaFin), 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFormulario({ ...formulario, fechaFin: new Date(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    {/* Motivo */}
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Motivo
                      </label>
                      <textarea
                        value={formulario.motivo || ''}
                        onChange={(e) => setFormulario({ ...formulario, motivo: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                        placeholder="Descripción breve del motivo..."
                      />
                    </div>

                    {/* Aprobada */}
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formulario.aprobada || false}
                          onChange={(e) => setFormulario({ ...formulario, aprobada: e.target.checked })}
                          className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Ausencia aprobada</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleGuardarAusencia}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => setMostrarFormulario(false)}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Ausencias */}
              {ausenciasOrdenadas.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No hay ausencias registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ausenciasOrdenadas.map(ausencia => {
                    const doctor = DOCTORES.find(d => d.id === ausencia.doctorId);
                    const sustituto = DOCTORES.find(d => d.id === ausencia.doctorSustituto);
                    const colorTipo = getColorTipoAusencia(ausencia.tipoAusencia);

                    return (
                      <div
                        key={ausencia.id}
                        className={`p-4 rounded-xl border-2 transition-colors ${
                          ausencia.aprobada 
                            ? 'bg-white border-gray-200' 
                            : 'bg-yellow-50 border-yellow-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-gray-900">{doctor?.nombre}</h4>
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 ${colorTipo}`}>
                                {ausencia.tipoAusencia}
                              </span>
                              {!ausencia.aprobada && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-300 rounded-lg text-xs font-semibold">
                                  Pendiente Aprobación
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Inicio:</span> {format(new Date(ausencia.fechaInicio), 'dd MMM yyyy', { locale: es })}
                              </div>
                              <div>
                                <span className="font-medium">Fin:</span> {format(new Date(ausencia.fechaFin), 'dd MMM yyyy', { locale: es })}
                              </div>
                              {ausencia.motivo && (
                                <div className="col-span-2">
                                  <span className="font-medium">Motivo:</span> {ausencia.motivo}
                                </div>
                              )}
                              {sustituto && (
                                <div className="col-span-2">
                                  <span className="font-medium">Sustituto:</span> {sustituto.nombre}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!ausencia.aprobada && (
                              <button
                                onClick={() => handleAprobar(ausencia.id)}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Aprobar
                              </button>
                            )}
                            <button
                              onClick={() => handleEditarAusencia(ausencia)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarAusencia(ausencia.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Vista Días Festivos */
            <div className="space-y-3">
              <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Días Festivos Oficiales de México 2026.</strong> Estos días se bloquean automáticamente en el sistema de citas.
                </p>
              </div>

              {DIAS_FESTIVOS_2026.map((festivo, index) => {
                const colorTipo = festivo.tipo === 'Federal' 
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : festivo.tipo === 'Religioso'
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-blue-100 text-blue-700 border-blue-300';

                return (
                  <div
                    key={index}
                    className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Flag className="w-5 h-5 text-gray-400" />
                          <div>
                            <h4 className="font-bold text-gray-900">{festivo.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              {format(festivo.fecha, 'EEEE, dd MMMM yyyy', { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 ${colorTipo}`}>
                        {festivo.tipo}
                      </span>
                    </div>
                  </div>
                );
              })}
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
