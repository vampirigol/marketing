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
  Edit,
  Eye,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function PacientesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);

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

  // Datos de ejemplo (después conectaremos con el API)
  const pacientes = [
    {
      id: '1',
      nombreCompleto: 'María González Pérez',
      telefono: '+52 55 1234-5678',
      email: 'maria.gonzalez@email.com',
      noAfiliacion: 'RCA-2024-001',
      edad: 32,
      ciudad: 'CDMX',
      ultimaCita: '15 Ene 2026',
      estado: 'Activo'
    },
    {
      id: '2',
      nombreCompleto: 'Pedro Sánchez López',
      telefono: '+52 55 2345-6789',
      email: 'pedro.sanchez@email.com',
      noAfiliacion: 'RCA-2024-002',
      edad: 45,
      ciudad: 'Guadalajara',
      ultimaCita: '28 Ene 2026',
      estado: 'Activo'
    },
    {
      id: '3',
      nombreCompleto: 'Ana Martínez Rodríguez',
      telefono: '+52 55 3456-7890',
      email: 'ana.martinez@email.com',
      noAfiliacion: 'RCA-2024-003',
      edad: 28,
      ciudad: 'Monterrey',
      ultimaCita: '01 Feb 2026',
      estado: 'Activo'
    },
    {
      id: '4',
      nombreCompleto: 'Carlos López García',
      telefono: '+52 55 4567-8901',
      email: 'carlos.lopez@email.com',
      noAfiliacion: 'RCA-2024-004',
      edad: 55,
      ciudad: 'CDMX',
      ultimaCita: '10 Dic 2025',
      estado: 'Inactivo'
    },
  ];

  const stats = [
    { label: 'Total Pacientes', value: '1,247', icon: '👥', color: 'from-blue-500 to-blue-600' },
    { label: 'Nuevos (Este Mes)', value: '47', icon: '✨', color: 'from-purple-500 to-purple-600' },
    { label: 'Con Citas Hoy', value: '23', icon: '📅', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Pendientes', value: '8', icon: '⏰', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Pacientes</h1>
            <p className="text-gray-600 mt-1">Gestión completa de pacientes y expedientes</p>
          </div>
          <Button variant="primary" className="shadow-lg" onClick={handleCreatePaciente}>
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className={`bg-gradient-to-br ${stat.color} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/90 font-medium">{stat.label}</p>
                    <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="text-5xl opacity-80">{stat.icon}</div>
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
              <span className="text-sm text-gray-500 font-normal">{pacientes.length} resultados</span>
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
                  {pacientes.map((paciente) => (
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
                            {paciente.email}
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
                          {paciente.ciudad}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {paciente.ultimaCita}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={paciente.estado === 'Activo' ? 'success' : 'secondary'}>
                          {paciente.estado}
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
