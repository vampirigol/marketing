'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle,
  Clock,
  Search,
  User,
  Calendar,
  Phone,
  MapPin,
  AlertCircle,
  UserCheck,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MarcarLlegadaModal } from '@/components/recepcion/MarcarLlegadaModal';
import { citasService } from '@/lib/citas.service';
import { pacientesService } from '@/lib/pacientes.service';
import { obtenerSucursales, SucursalApi } from '@/lib/sucursales.service';
import { SUCURSALES } from '@/lib/doctores-data';

interface Cita {
  id: string;
  hora: string;
  paciente: {
    id: string;
    nombre: string;
    telefono: string;
    foto?: string;
  };
  servicio: string;
  doctor: string;
  consultorio: string;
  sucursal: string;
  estado: 'pendiente' | 'en-espera' | 'atendiendo' | 'completada' | 'inasistencia';
  llegada?: string;
  notas?: string;
  slaMin?: number;
}

export default function RecepcionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInasistenciaModal, setShowInasistenciaModal] = useState(false);
  const [motivoInasistencia, setMotivoInasistencia] = useState('Trabajo');
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');
  const [sucursales, setSucursales] = useState<SucursalApi[]>([]);
  const [sucursalIdActual, setSucursalIdActual] = useState<string | null>(null);

  const motivosInasistencia = [
    'Trabajo',
    'Enfermedad',
    'Olvido',
    'Sin transporte',
    'Otro',
  ];

  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);

  useEffect(() => {
    const fallbackSucursales: SucursalApi[] = SUCURSALES.map((nombre, index) => ({
      id: `fallback-${index}`,
      nombre,
      ciudad: '',
      estado: '',
      direccion: '',
      telefono: '',
      zonaHoraria: 'America/Mexico_City',
      activa: true,
    }));

    const cargarSucursales = async () => {
      try {
        const data = await obtenerSucursales(true);
        if (!data || data.length === 0) {
          setSucursales(fallbackSucursales);
        } else {
          const nombresApi = new Set(data.map((s) => s.nombre));
          const merged = [...data];
          fallbackSucursales.forEach((fallback) => {
            if (!nombresApi.has(fallback.nombre)) {
              merged.push(fallback);
            }
          });
          setSucursales(merged);
        }
      } catch (error) {
        console.error('Error cargando sucursales:', error);
        setSucursales(fallbackSucursales);
      }
    };
    cargarSucursales();
  }, []);

  useEffect(() => {
    if (!sucursales.length) return;
    const savedSucursal = localStorage.getItem('sucursalActual');
    const defaultSucursal = sucursales[0]?.nombre || 'Guadalajara';
    if (savedSucursal) {
      setSucursalActual(savedSucursal);
      return;
    }
    setSucursalActual(defaultSucursal);
    localStorage.setItem('sucursalActual', defaultSucursal);
  }, [sucursales]);

  useEffect(() => {
    if (!sucursales.length) return;
    const matched = sucursales.find((s) => s.nombre === sucursalActual) || sucursales[0];
    setSucursalIdActual(matched?.id || null);
  }, [sucursales, sucursalActual]);

  const handleSucursalChange = (sucursal: string) => {
    setSucursalActual(sucursal);
    localStorage.setItem('sucursalActual', sucursal);
  };

  const mapEstadoBackend = (estado: string): Cita['estado'] => {
    if (estado === 'Agendada') return 'pendiente';
    if (estado === 'Confirmada') return 'en-espera';
    if (estado === 'En_Consulta') return 'atendiendo';
    if (estado === 'Atendida') return 'completada';
    if (estado === 'No_Asistio' || estado === 'Cancelada') return 'inasistencia';
    return 'pendiente';
  };

  const calcularSlaMin = (horaCita: string) => {
    const [hora, minuto] = horaCita.split(':').map(Number);
    const ahora = new Date();
    const citaDate = new Date();
    citaDate.setHours(hora, minuto, 0, 0);
    const diff = Math.round((ahora.getTime() - citaDate.getTime()) / 60000);
    return diff;
  };

  const cargarCitasHoy = async () => {
    if (!sucursalIdActual) return;
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const citasBackend = await citasService.obtenerPorSucursalYFecha(sucursalIdActual, fecha);
      const pacienteIds = Array.from(new Set(citasBackend.map((c: { pacienteId: string }) => c.pacienteId))) as string[];
      const pacientes = await Promise.all(
        pacienteIds.map((id) => pacientesService.obtenerPorId(id).catch(() => null))
      );
      const pacientesMap = new Map(pacientes.filter(Boolean).map((p: any) => [p.id, p]));
      const sucursalNombre = sucursales.find((s) => s.id === sucursalIdActual)?.nombre || 'Sucursal';

      const citasMapped: Cita[] = citasBackend.map((cita: any) => {
        const paciente = pacientesMap.get(cita.pacienteId);
        return {
          id: cita.id,
          hora: cita.horaCita,
          paciente: {
            id: cita.pacienteId,
            nombre: paciente?.nombreCompleto || 'Paciente',
            telefono: paciente?.telefono || '',
          },
          servicio: cita.especialidad || 'Consulta',
          doctor: cita.medicoAsignado || 'Doctor',
          consultorio: cita.medicoAsignado ? `Consultorio ${cita.medicoAsignado}` : 'Consultorio',
          sucursal: sucursalNombre,
          estado: mapEstadoBackend(cita.estado),
          llegada: cita.horaLlegada ? new Date(cita.horaLlegada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : undefined,
          slaMin: calcularSlaMin(cita.horaCita),
        };
      });

      setCitasHoy(citasMapped);
    } catch (error) {
      console.error('Error cargando citas de recepción:', error);
    }
  };

  useEffect(() => {
    cargarCitasHoy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalIdActual]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="warning">⏰ Pendiente</Badge>;
      case 'en-espera':
        return <Badge variant="info">👤 En Espera</Badge>;
      case 'atendiendo':
        return <Badge variant="primary">🩺 Atendiendo</Badge>;
      case 'completada':
        return <Badge variant="success">✅ Completada</Badge>;
      case 'inasistencia':
        return <Badge variant="danger">❌ Inasistencia</Badge>;
      default:
        return null;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'border-l-yellow-500';
      case 'en-espera':
        return 'border-l-blue-500';
      case 'atendiendo':
        return 'border-l-purple-500';
      case 'completada':
        return 'border-l-green-500';
      case 'inasistencia':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const handleMarcarLlegada = (cita: Cita) => {
    setSelectedCita(cita);
    setShowModal(true);
  };

  const handleConfirmarLlegada = async (citaId: string, data: { horaLlegada: string; notas?: string }) => {
    try {
      await citasService.marcarLlegada(citaId, { horaLlegada: data.horaLlegada });
      await citasService.actualizar(citaId, { notas: data.notas });
      cargarCitasHoy();
    } catch (error) {
      console.error('Error al marcar llegada:', error);
    }
  };

  const handlePasarConsultorio = async (citaId: string) => {
    try {
      await citasService.actualizar(citaId, { estado: 'En_Consulta' as any });
      cargarCitasHoy();
    } catch (error) {
      console.error('Error al pasar a consultorio:', error);
    }
  };

  const handleCompletarCita = async (citaId: string) => {
    try {
      await citasService.actualizar(citaId, { estado: 'Atendida' as any });
      cargarCitasHoy();
    } catch (error) {
      console.error('Error al completar cita:', error);
    }
  };

  const handleMarcarInasistencia = (cita: Cita) => {
    setSelectedCita(cita);
    setShowInasistenciaModal(true);
  };

  const citasPendientes = citasHoy.filter(c => c.estado === 'pendiente').length;
  const citasEnEspera = citasHoy.filter(c => c.estado === 'en-espera').length;
  const citasAtendiendo = citasHoy.filter(c => c.estado === 'atendiendo').length;
  const citasCompletadas = citasHoy.filter(c => c.estado === 'completada').length;
  const citasNoShow = citasHoy.filter(c => c.estado === 'inasistencia').length;

  const citasFiltradas = citasHoy.filter((cita) => {
    if (sucursalActual && cita.sucursal !== sucursalActual) return false;
    if (filterEstado !== 'todos' && cita.estado !== filterEstado) {
      return false;
    }
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      cita.paciente.nombre.toLowerCase().includes(query) ||
      cita.paciente.telefono.toLowerCase().includes(query) ||
      cita.servicio.toLowerCase().includes(query) ||
      cita.doctor.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👋 Recepción</h1>
            <p className="text-gray-500 mt-1">
              Gestión de llegadas y atención · {sucursalActual}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <select
                value={sucursalActual}
                onChange={(e) => handleSucursalChange(e.target.value)}
                className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none"
              >
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.nombre}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Hoy: {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900">{citasPendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">En Espera</p>
                  <p className="text-3xl font-bold text-gray-900">{citasEnEspera}</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Atendiendo</p>
                  <p className="text-3xl font-bold text-gray-900">{citasAtendiendo}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completadas</p>
                  <p className="text-3xl font-bold text-gray-900">{citasCompletadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Inasistencia</p>
                  <p className="text-3xl font-bold text-gray-900">{citasNoShow}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en-espera">En Espera</option>
                <option value="atendiendo">Atendiendo</option>
                <option value="completada">Completadas</option>
                <option value="inasistencia">Inasistencia</option>
              </select>
            </div>
          </CardContent>
        </Card>

      {/* Lista de Citas */}
        <div className="space-y-3">
          {citasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-600">
                No hay pacientes/citas para la sucursal seleccionada con los filtros actuales.
              </CardContent>
            </Card>
          ) : (
            citasFiltradas.map((cita) => (
              <Card 
                key={cita.id} 
                className={`border-l-4 ${getEstadoColor(cita.estado)} hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Hora */}
                    <div className="flex items-center lg:w-24">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{cita.hora}</p>
                        {cita.llegada && (
                          <p className="text-xs text-gray-500">Llegó: {cita.llegada}</p>
                        )}
                        {typeof cita.slaMin === 'number' && cita.estado !== 'completada' && (
                          <p className={`text-xs font-semibold ${
                            cita.slaMin > 15 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            SLA: {cita.slaMin} min
                          </p>
                        )}
                      </div>
                    </div>

                  {/* Paciente */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{cita.paciente.nombre}</h3>
                          {getEstadoBadge(cita.estado)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {cita.paciente.telefono}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {cita.doctor}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {cita.consultorio}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{cita.servicio}</p>
                        {cita.notas && (
                          <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {cita.notas}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {cita.estado === 'pendiente' && (
                          <Button 
                            variant="primary" 
                            size="lg"
                            onClick={() => handleMarcarLlegada(cita)}
                            className="flex items-center gap-2"
                          >
                            <UserCheck className="w-5 h-5" />
                            Marcar Llegada
                          </Button>
                        )}
                        {cita.estado === 'en-espera' && (
                          <Button 
                            variant="secondary" 
                            className="flex items-center gap-2"
                            onClick={() => handlePasarConsultorio(cita.id)}
                          >
                            <UserCheck className="w-4 h-4" />
                            Pasar a Consultorio
                          </Button>
                        )}
                        {cita.estado === 'atendiendo' && (
                          <Button 
                            variant="ghost"
                            className="flex items-center gap-2 text-purple-600"
                            onClick={() => handleCompletarCita(cita.id)}
                          >
                            <Clock className="w-4 h-4" />
                            Finalizar
                          </Button>
                        )}
                        {cita.estado === 'pendiente' && (
                          <Button 
                            variant="danger" 
                            className="flex items-center gap-2"
                            onClick={() => handleMarcarInasistencia(cita)}
                          >
                            <XCircle className="w-4 h-4" />
                            Inasistencia
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal Marcar Llegada */}
      {showModal && selectedCita && (
        <MarcarLlegadaModal
          cita={selectedCita}
          onClose={() => {
            setShowModal(false);
            setSelectedCita(null);
          }}
          onConfirm={(data: {
            horaLlegada: string;
            notas?: string;
            requierePago: boolean;
            montoAdeudado?: number;
          }) => {
            handleConfirmarLlegada(selectedCita.id, {
              horaLlegada: data.horaLlegada,
              notas: data.notas,
            });
            setShowModal(false);
            setSelectedCita(null);
          }}
        />
      )}

      {showInasistenciaModal && selectedCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrar inasistencia</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona el motivo de inasistencia para {selectedCita.paciente.nombre}.
            </p>
            <select
              value={motivoInasistencia}
              onChange={(e) => setMotivoInasistencia(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            >
              {motivosInasistencia.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowInasistenciaModal(false);
                  setSelectedCita(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  citasService
                    .actualizar(selectedCita.id, {
                      estado: 'No_Asistio' as any,
                      notas: `Motivo: ${motivoInasistencia}`,
                    })
                    .then(() => cargarCitasHoy())
                    .catch((error) => console.error('Error registrando inasistencia:', error))
                    .finally(() => {
                      setShowInasistenciaModal(false);
                      setSelectedCita(null);
                    });
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
