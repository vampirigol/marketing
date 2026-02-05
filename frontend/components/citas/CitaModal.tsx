'use client';

import { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Tag,
  Phone,
  Mail,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History
} from 'lucide-react';
import { Cita } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface CitaModalProps {
  cita: Cita | null;
  isOpen: boolean;
  onClose: () => void;
  onEditar?: (cita: Cita) => void;
  onCancelar?: (citaId: string, motivo: string) => void;
  onConfirmar?: (citaId: string) => void;
  onMarcarLlegada?: (citaId: string) => void;
}

export function CitaModal({
  cita,
  isOpen,
  onClose,
  onEditar,
  onCancelar,
  onConfirmar,
  onMarcarLlegada
}: CitaModalProps) {
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  if (!isOpen || !cita) return null;

  const handleCancelar = () => {
    if (motivoCancelacion.trim() && onCancelar) {
      onCancelar(cita.id, motivoCancelacion);
      setMostrarCancelar(false);
      setMotivoCancelacion('');
      onClose();
    }
  };

  const getEstadoInfo = (estado: Cita['estado']) => {
    const info = {
      Agendada: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Agendada' },
      Pendiente_Confirmacion: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pendiente de confirmación' },
      Confirmada: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Confirmada' },
      Reagendada: { color: 'bg-indigo-100 text-indigo-700', icon: History, label: 'Reagendada' },
      Llegó: { color: 'bg-purple-100 text-purple-700', icon: User, label: 'Paciente llegó' },
      En_Atencion: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'En atención' },
      En_Espera: { color: 'bg-sky-100 text-sky-700', icon: AlertCircle, label: 'En espera' },
      Finalizada: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle2, label: 'Finalizada' },
      Cancelada: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelada' },
      Inasistencia: { color: 'bg-rose-100 text-rose-700', icon: AlertCircle, label: 'Inasistencia' },
      Perdido: { color: 'bg-slate-100 text-slate-700', icon: AlertCircle, label: 'Perdido' },
      No_Asistio: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'No asistió' }
    };
    return info[estado] || info.Agendada;
  };

  const estadoInfo = getEstadoInfo(cita.estado);
  const EstadoIcon = estadoInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Detalle de Cita</h2>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${estadoInfo.color} bg-white/20 backdrop-blur-sm`}>
                    <EstadoIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold text-white">{estadoInfo.label}</span>
                  </div>
                  {cita.esPromocion && (
                    <Badge variant="default" className="bg-purple-600 text-white">
                      🎁 Promoción
                    </Badge>
                  )}
                  {cita.reagendaciones > 0 && (
                    <Badge variant="default" className="bg-orange-600 text-white">
                      {cita.reagendaciones} reagendación{cita.reagendaciones > 1 ? 'es' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Información Principal */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Fecha y Hora
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-semibold">
                      {new Date(cita.fechaCita).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-semibold">
                      {cita.horaCita}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({cita.duracionMinutos} min)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Ubicación
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold">{cita.sucursalNombre || 'Guadalajara'}</p>
                    <p className="text-sm text-gray-600">
                      Consultorio {cita.especialidad || 'General'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Paciente */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Información del Paciente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-semibold">{cita.pacienteNombre || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-semibold">{cita.pacienteTelefono || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-sm">{cita.pacienteEmail || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">No. Afiliación</p>
                    <p className="font-semibold font-mono text-sm">
                      {cita.pacienteNoAfiliacion || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de la Consulta */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Tipo de Consulta
                </h3>
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold">{cita.tipoConsulta}</span>
                </div>
                {cita.medicoAsignado && (
                  <div className="flex items-center gap-3 mt-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Médico Asignado</p>
                      <p className="font-semibold">Dr(a). {cita.medicoAsignado}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Información de Pago
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo Consulta:</span>
                    <span className="font-semibold">${cita.costoConsulta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto Abonado:</span>
                    <span className="font-semibold text-green-600">${cita.montoAbonado}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-medium">Saldo Pendiente:</span>
                    <span className={`font-bold text-lg ${
                      cita.saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      ${cita.saldoPendiente}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Reagendaciones */}
            {cita.reagendaciones > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">
                    Historial de Reagendaciones
                  </h3>
                </div>
                <p className="text-sm text-orange-700">
                  Esta cita ha sido reagendada {cita.reagendaciones} vez{cita.reagendaciones > 1 ? 'es' : ''}.
                  {!cita.esPromocion && cita.reagendaciones >= 1 && (
                    <span className="block mt-1 font-medium">
                      ⚠️ Promoción agotada por límite de re-agendo.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Motivo de Cancelación */}
            {cita.motivoCancelacion && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Motivo de Cancelación</h3>
                </div>
                <p className="text-sm text-red-700">{cita.motivoCancelacion}</p>
              </div>
            )}

            {/* Formulario de Cancelación */}
            {mostrarCancelar && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-3">Cancelar Cita</h3>
                <textarea
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Ingresa el motivo de cancelación..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelar}
                    variant="danger"
                    size="sm"
                    disabled={!motivoCancelacion.trim()}
                  >
                    Confirmar Cancelación
                  </Button>
                  <Button
                    onClick={() => {
                      setMostrarCancelar(false);
                      setMotivoCancelacion('');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex gap-2">
              {(['Agendada', 'Pendiente_Confirmacion', 'Reagendada'] as Cita['estado'][]).includes(cita.estado) && onConfirmar && (
                <Button
                  onClick={() => {
                    onConfirmar(cita.id);
                    onClose();
                  }}
                  variant="primary"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Cita
                </Button>
              )}
              {cita.estado === 'Confirmada' && onMarcarLlegada && (
                <Button
                  onClick={() => {
                    onMarcarLlegada(cita.id);
                    onClose();
                  }}
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Marcar Llegada
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onEditar && !['Finalizada', 'Cancelada', 'No_Asistio', 'Inasistencia', 'Perdido'].includes(cita.estado) && (
                <Button
                  onClick={() => {
                    onEditar(cita);
                    onClose();
                  }}
                  variant="secondary"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
              {onCancelar && !['Finalizada', 'Cancelada', 'No_Asistio', 'Inasistencia', 'Perdido'].includes(cita.estado) && !mostrarCancelar && (
                <Button
                  onClick={() => setMostrarCancelar(true)}
                  variant="danger"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Cita
                </Button>
              )}
              <Button onClick={onClose} variant="secondary" size="sm">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
