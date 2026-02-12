'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  FileText,
  DollarSign,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Cita } from '@/types';
import { citasService } from '@/lib/citas.service';

interface HistorialPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string;
  pacienteNombre: string;
}

type FiltroEstado = 'todos' | Cita['estado'];

export function HistorialPacienteModal({
  isOpen,
  onClose,
  pacienteId,
  pacienteNombre
}: HistorialPacienteModalProps) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (isOpen && pacienteId) {
      cargarHistorial();
    }
  }, [isOpen, pacienteId]);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const raw = await citasService.obtenerPorPaciente(pacienteId);
      const citasMapeadas: Cita[] = (raw || []).map((c: Record<string, unknown>) => ({
        id: String(c.id ?? ''),
        pacienteId,
        pacienteNombre,
        pacienteTelefono: c.pacienteTelefono as string | undefined,
        pacienteEmail: c.pacienteEmail as string | undefined,
        sucursalId: String(c.sucursalId ?? ''),
        sucursalNombre: c.sucursalNombre as string | undefined,
        fechaCita: c.fechaCita ? new Date(c.fechaCita as string) : new Date(),
        horaCita: String(c.horaCita ?? ''),
        duracionMinutos: Number(c.duracionMinutos) ?? 30,
        tipoConsulta: String(c.tipoConsulta ?? c.especialidad ?? 'Consulta'),
        especialidad: String(c.especialidad ?? ''),
        medicoAsignado: c.medicoAsignado as string | undefined,
        estado: (c.estado as Cita['estado']) ?? 'Agendada',
        esPromocion: Boolean(c.esPromocion),
        costoConsulta: Number(c.costoConsulta) ?? 0,
        montoAbonado: Number(c.montoAbonado) ?? 0,
        saldoPendiente: Number(c.saldoPendiente) ?? 0,
        metodoPago: c.metodoPago as string | undefined,
        notas: c.notas as string | undefined,
        reagendaciones: Number(c.reagendaciones) ?? 0,
        fechaCreacion: c.fechaCreacion ? new Date(c.fechaCreacion as string) : new Date(),
        ultimaActualizacion: c.ultimaActualizacion ? new Date(c.ultimaActualizacion as string) : new Date(),
      }));
      setCitas(citasMapeadas);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setCitas([]);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  const citasFiltradas = citas.filter(cita => {
    const coincideFiltro = filtroEstado === 'todos' || cita.estado === filtroEstado;
    const coincideBusqueda = busqueda === '' || 
      cita.tipoConsulta.toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.medicoAsignado && cita.medicoAsignado.toLowerCase().includes(busqueda.toLowerCase())) ||
      cita.especialidad.toLowerCase().includes(busqueda.toLowerCase());
    
    return coincideFiltro && coincideBusqueda;
  });

  const estadisticas = {
    total: citas.length,
    finalizadas: citas.filter(c => c.estado === 'Finalizada').length,
    agendadas: citas.filter(c => c.estado === 'Agendada' || c.estado === 'Confirmada').length,
    canceladas: citas.filter(c => c.estado === 'Cancelada' || c.estado === 'No_Asistio').length,
    totalGastado: citas
      .filter(c => c.estado === 'Finalizada' && c.montoAbonado)
      .reduce((sum, c) => sum + (c.montoAbonado || 0), 0)
  };

  const getEstadoBadge = (estado: Cita['estado']) => {
    const configs: Record<string, { color: string; icon: typeof Clock; label: string }> = {
      'Agendada': { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Agendada' },
      'Pendiente_Confirmacion': { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pendiente' },
      'Confirmada': { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Confirmada' },
      'Reagendada': { color: 'bg-indigo-100 text-indigo-700', icon: Clock, label: 'Reagendada' },
      'Llegó': { color: 'bg-purple-100 text-purple-700', icon: User, label: 'Llegó' },
      'En_Atencion': { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'En Atención' },
      'En_Espera': { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En Espera' },
      'Finalizada': { color: 'bg-gray-100 text-gray-700', icon: CheckCircle2, label: 'Finalizada' },
      'Cancelada': { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelada' },
      'Inasistencia': { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Inasistencia' },
      'Perdido': { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Perdido' },
      'No_Asistio': { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'No Asistió' }
    };
    return configs[estado] || configs['Agendada'];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Historial Completo</h2>
                <p className="text-blue-100 mt-1">{pacienteNombre}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Estadísticas */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Total Citas</p>
                <p className="text-2xl font-bold">{estadisticas.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Finalizadas</p>
                <p className="text-2xl font-bold">{estadisticas.finalizadas}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Próximas</p>
                <p className="text-2xl font-bold">{estadisticas.agendadas}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Total Gastado</p>
                <p className="text-2xl font-bold">${estadisticas.totalGastado}</p>
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-4 items-center">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por servicio, doctor o especialidad..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtro Estado */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="No_Asistio">No Asistió</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Citas */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
            {cargando ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando historial...</p>
                </div>
              </div>
            ) : citasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron citas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {citasFiltradas.map((cita) => {
                  const estadoConfig = getEstadoBadge(cita.estado);
                  const EstadoIcon = estadoConfig.icon;

                  return (
                    <div
                      key={cita.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {cita.tipoConsulta}
                            </h3>
                            {cita.esPromocion && (
                              <Badge variant="default" className="bg-purple-100 text-purple-700 text-xs">
                                🎁 Promo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {cita.medicoAsignado || 'Sin asignar'} • {cita.especialidad}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {cita.sucursalNombre}
                          </p>
                        </div>
                        <Badge className={`${estadoConfig.color} flex items-center gap-1`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estadoConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(cita.fechaCita).toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{cita.horaCita}</span>
                          </div>
                          {cita.montoAbonado > 0 && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${cita.montoAbonado}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {cita.notas && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {cita.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <Button onClick={onClose} variant="secondary">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
