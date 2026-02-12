'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PacienteModal } from '@/components/pacientes/PacienteModal';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Clock,
  Edit,
  Eye,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { pacientesService } from '@/lib/pacientes.service';
import { citasService } from '@/lib/citas.service';
import { obtenerSucursales, SucursalApi } from '@/lib/sucursales.service';
import type { Paciente, Cita } from '@/types';

export default function PacientesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');
  const [sucursales, setSucursales] = useState<SucursalApi[]>([]);
  const [sucursalIdActual, setSucursalIdActual] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);

  useEffect(() => {
    const savedSucursal = localStorage.getItem('sucursalActual');
    if (savedSucursal) {
      setSucursalActual(savedSucursal);
    }
  }, []);

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const data = await obtenerSucursales(true);
        setSucursales(data);
      } catch (error) {
        console.error('Error cargando sucursales:', error);
      }
    };
    cargarSucursales();
  }, []);

  useEffect(() => {
    if (!sucursales.length) return;
    const match = sucursales.find((s) => s.nombre === sucursalActual);
    const seleccion = match || sucursales[0];
    if (!seleccion) return;
    setSucursalIdActual(seleccion.id);
    if (!match) {
      setSucursalActual(seleccion.nombre);
      localStorage.setItem('sucursalActual', seleccion.nombre);
    }
  }, [sucursales, sucursalActual]);

  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const data = await pacientesService.listar(1000, 0);
        setPacientes(data);
      } catch (error) {
        console.error('Error cargando pacientes:', error);
      }
    };
    cargarPacientes();
  }, []);

  useEffect(() => {
    const cargarCitasHoy = async () => {
      if (!sucursalIdActual) {
        setCitasHoy([]);
        return;
      }
      try {
        const fecha = new Date().toISOString().split('T')[0];
        const data = await citasService.obtenerPorSucursalYFecha(sucursalIdActual, fecha);
        setCitasHoy(data);
      } catch (error) {
        console.error('Error cargando citas de hoy:', error);
      }
    };
    cargarCitasHoy();
  }, [sucursalIdActual]);

  const handleCreatePaciente = () => {
    setSelectedPaciente(null);
    setIsModalOpen(true);
  };

  const handleEditPaciente = (paciente: any) => {
    setSelectedPaciente(paciente);
    setIsModalOpen(true);
  };

  const handleSavePaciente = (data: any) => {
    console.log('Guardar paciente:', data);
    // Aquí conectaremos con el API
  };

  const formatFecha = (value?: Date | string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((paciente) => {
      if (sucursalActual && paciente.ciudad && paciente.ciudad !== sucursalActual) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        paciente.nombreCompleto.toLowerCase().includes(query) ||
        paciente.telefono.toLowerCase().includes(query) ||
        paciente.email?.toLowerCase().includes(query) ||
        paciente.noAfiliacion.toLowerCase().includes(query)
      );
    });
  }, [pacientes, searchQuery, sucursalActual]);

  const stats = useMemo(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const nuevosEsteMes = pacientesFiltrados.filter((paciente) => {
      if (!paciente.fechaRegistro) return false;
      const fechaRegistro = new Date(paciente.fechaRegistro);
      return fechaRegistro >= inicioMes;
    }).length;

    const pacientesConCitaHoy = new Set(citasHoy.map((cita) => cita.pacienteId)).size;
    const pendientesHoy = citasHoy.filter((cita) =>
      ['Pendiente_Confirmacion', 'Agendada'].includes(cita.estado)
    ).length;

    return [
      {
        label: 'Total Pacientes',
        value: `${pacientesFiltrados.length}`,
        icon: Users,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
      },
      {
        label: 'Nuevos (Este Mes)',
        value: `${nuevosEsteMes}`,
        icon: Sparkles,
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      {
        label: 'Con Citas Hoy',
        value: `${pacientesConCitaHoy}`,
        icon: Calendar,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Pendientes',
        value: `${pendientesHoy}`,
        icon: Clock,
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
      },
    ];
  }, [pacientesFiltrados, citasHoy]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Pacientes</h1>
            <p className="text-gray-500 mt-1">
              Gestión completa de pacientes · {sucursalActual}
            </p>
          </div>
          <Button variant="primary" className="shadow-lg" onClick={handleCreatePaciente}>
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Búsqueda y Filtros */}
        <Card className="shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Buscar por nombre, teléfono, email o No. Afiliación..."
                  icon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="ghost" className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="ghost" className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Pacientes */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Pacientes</span>
              <span className="text-sm text-gray-500 font-normal">{pacientesFiltrados.length} resultados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No. Afiliación
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Edad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Última Cita
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pacientesFiltrados.map((paciente) => (
                    <tr key={paciente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm">
                              {paciente.nombreCompleto.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{paciente.nombreCompleto}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {paciente.telefono}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {paciente.email || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm font-mono">
                          {paciente.noAfiliacion}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{paciente.edad} años</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {paciente.ciudad || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatFecha(paciente.ultimaActualizacion || paciente.fechaRegistro)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                      <Badge variant={paciente.activo ? 'success' : 'secondary'}>
                        {paciente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link href={`/pacientes/${paciente.id}`}>
                            <button className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleEditPaciente(paciente)}
                            className="p-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Paginación */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">1-4</span> de <span className="font-semibold">1,247</span> pacientes
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Anterior</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="secondary" size="sm">2</Button>
            <Button variant="secondary" size="sm">3</Button>
            <Button variant="secondary" size="sm">...</Button>
            <Button variant="secondary" size="sm">312</Button>
            <Button variant="secondary" size="sm">Siguiente</Button>
          </div>
        </div>
      </div>

      {/* Modal de Paciente */}
      <PacienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paciente={selectedPaciente}
        onSave={handleSavePaciente}
      />
    </DashboardLayout>
  );
}
