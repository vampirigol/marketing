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
}

export default function RecepcionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInasistenciaModal, setShowInasistenciaModal] = useState(false);
  const [motivoInasistencia, setMotivoInasistencia] = useState('Trabajo');
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');

  const motivosInasistencia = [
    'Trabajo',
    'Enfermedad',
    'Olvido',
    'Sin transporte',
    'Otro',
  ];

  const [citasHoy, setCitasHoy] = useState<Cita[]>([
    {
      id: '1',
      hora: '08:00',
      paciente: {
        id: 'p1',
        nombre: 'María González López',
        telefono: '555-1234'
      },
      servicio: 'Medicina General',
      doctor: 'Dr. Pérez',
      consultorio: 'Consultorio 1',
      sucursal: 'Guadalajara',
      estado: 'completada',
      llegada: '07:55'
    },
    {
      id: '2',
      hora: '08:30',
      paciente: {
        id: 'p2',
        nombre: 'Pedro Sánchez Ruiz',
        telefono: '555-5678'
      },
      servicio: 'Odontología',
      doctor: 'Dra. Martínez',
      consultorio: 'Consultorio 3',
      sucursal: 'Ciudad Juárez',
      estado: 'atendiendo',
      llegada: '08:25'
    },
    {
      id: '3',
      hora: '09:00',
      paciente: {
        id: 'p3',
        nombre: 'Ana Martínez Díaz',
        telefono: '555-9012'
      },
      servicio: 'Pediatría',
      doctor: 'Dr. López',
      consultorio: 'Consultorio 2',
      sucursal: 'Guadalajara',
      estado: 'en-espera',
      llegada: '08:50'
    },
    {
      id: '4',
      hora: '09:30',
      paciente: {
        id: 'p4',
        nombre: 'Carlos Ruiz Gómez',
        telefono: '555-3456'
      },
      servicio: 'Traumatología',
      doctor: 'Dr. Ramírez',
      consultorio: 'Consultorio 4',
      sucursal: 'Ciudad Obregón',
      estado: 'pendiente'
    },
    {
      id: '5',
      hora: '10:00',
      paciente: {
        id: 'p5',
        nombre: 'Laura Díaz Torres',
        telefono: '555-7890'
      },
      servicio: 'Ginecología',
      doctor: 'Dra. García',
      consultorio: 'Consultorio 5',
      sucursal: 'Guadalajara',
      estado: 'pendiente'
    },
    {
      id: '6',
      hora: '08:15',
      paciente: {
        id: 'p6',
        nombre: 'Roberto Fernández',
        telefono: '555-2468'
      },
      servicio: 'Cardiología',
      doctor: 'Dr. Hernández',
      consultorio: 'Consultorio 6',
      sucursal: 'Ciudad Juárez',
      estado: 'inasistencia',
      notas: 'No se presentó - contactar y registrar motivo'
    },
    {
      id: '7',
      hora: '10:30',
      paciente: {
        id: 'p7',
        nombre: 'Sofía Navarro Ortiz',
        telefono: '555-3321'
      },
      servicio: 'Odontología',
      doctor: 'Gregorio Pérez',
      consultorio: 'Consultorio 1',
      sucursal: 'Loreto Héroes',
      estado: 'pendiente'
    },
    {
      id: '8',
      hora: '11:00',
      paciente: {
        id: 'p8',
        nombre: 'Héctor Salinas Vega',
        telefono: '555-7788'
      },
      servicio: 'Odontología',
      doctor: 'Nancy Grijalva',
      consultorio: 'Consultorio 2',
      sucursal: 'Loreto Centro',
      estado: 'en-espera',
      llegada: '10:50'
    },
    {
      id: '9',
      hora: '11:30',
      paciente: {
        id: 'p9',
        nombre: 'Paula Ríos Sánchez',
        telefono: '555-9901'
      },
      servicio: 'Medicina General',
      doctor: 'Yamila Arredondo',
      consultorio: 'Virtual 1',
      sucursal: 'Clínica Adventista Virtual',
      estado: 'atendiendo',
      llegada: '11:25'
    },
    {
      id: '10',
      hora: '12:00',
      paciente: {
        id: 'p10',
        nombre: 'Daniela Torres Aguilar',
        telefono: '555-1144'
      },
      servicio: 'Oftalmología',
      doctor: 'Dr. José Ricardo Espinoza Vargas',
      consultorio: 'Consultorio 3',
      sucursal: 'General',
      estado: 'pendiente'
    },
    {
      id: '11',
      hora: '12:30',
      paciente: {
        id: 'p11',
        nombre: 'Luis Herrera Cano',
        telefono: '555-2211'
      },
      servicio: 'Medicina General',
      doctor: 'Dra. Tirsa Abisag Espinoza',
      consultorio: 'Consultorio 4',
      sucursal: 'General',
      estado: 'completada',
      llegada: '12:20'
    },
    {
      id: '12',
      hora: '13:00',
      paciente: {
        id: 'p12',
        nombre: 'Karina Mejía Duarte',
        telefono: '555-6633'
      },
      servicio: 'Medicina General',
      doctor: 'Dr. Pérez',
      consultorio: 'Consultorio 7',
      sucursal: 'Valle de la Trinidad',
      estado: 'pendiente'
    }
  ]);

  useEffect(() => {
    const savedSucursal = localStorage.getItem('sucursalActual');
    const defaultSucursal = SUCURSALES[0] || 'Guadalajara';
    if (savedSucursal && SUCURSALES.includes(savedSucursal)) {
      setSucursalActual(savedSucursal);
      return;
    }
    if (savedSucursal || sucursalActual !== defaultSucursal) {
      setSucursalActual(defaultSucursal);
      localStorage.setItem('sucursalActual', defaultSucursal);
    }
  }, [sucursalActual]);

  const handleSucursalChange = (sucursal: string) => {
    setSucursalActual(sucursal);
    localStorage.setItem('sucursalActual', sucursal);
  };

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

  const handleConfirmarLlegada = (citaId: string, data: { horaLlegada: string; notas?: string }) => {
    setCitasHoy(prev =>
      prev.map(c =>
        c.id === citaId
          ? {
              ...c,
              estado: 'en-espera',
              llegada: data.horaLlegada,
              notas: data.notas || c.notas,
            }
          : c
      )
    );
  };

  const handlePasarConsultorio = (citaId: string) => {
    setCitasHoy(prev =>
      prev.map(c => (c.id === citaId ? { ...c, estado: 'atendiendo' } : c))
    );
  };

  const handleCompletarCita = (citaId: string) => {
    setCitasHoy(prev =>
      prev.map(c => (c.id === citaId ? { ...c, estado: 'completada' } : c))
    );
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
                {SUCURSALES.map((sucursal) => (
                  <option key={sucursal} value={sucursal}>
                    {sucursal}
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
                  setCitasHoy(prev =>
                    prev.map(c =>
                      c.id === selectedCita.id
                        ? {
                            ...c,
                            estado: 'inasistencia',
                            notas: `Motivo: ${motivoInasistencia}`,
                          }
                        : c
                    )
                  );
                  setShowInasistenciaModal(false);
                  setSelectedCita(null);
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
