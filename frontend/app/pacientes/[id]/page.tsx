'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
  Eye,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PacienteDetailPage({ params }: { params: { id: string } }) {
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');

  useEffect(() => {
    const savedSucursal = localStorage.getItem('sucursalActual');
    if (savedSucursal) {
      setSucursalActual(savedSucursal);
    }
  }, []);

  // Datos de ejemplo (después conectaremos con el API)
  const paciente = {
    id: params.id,
    nombreCompleto: 'María González Pérez',
    telefono: '+52 55 1234-5678',
    whatsapp: '+52 55 1234-5678',
    email: 'maria.gonzalez@email.com',
    fechaNacimiento: '15/03/1992',
    edad: 32,
    sexo: 'F',
    noAfiliacion: 'RCA-2024-001',
    tipoAfiliacion: 'Titular',
    direccion: {
      calle: 'Av. Insurgentes Sur 123',
      colonia: 'Del Valle',
      ciudad: 'Guadalajara',
      estado: 'Jalisco',
      codigoPostal: '03100',
    },
    estado: 'Activo',
    fechaRegistro: '10 Ene 2024',
    sucursal: 'Guadalajara',
  };

  const citas = [
    {
      id: '1',
      fecha: '15 Feb 2026',
      hora: '10:00 AM',
      servicio: 'Consulta General',
      doctor: 'Dr. Juan Pérez',
      sucursal: 'Guadalajara',
      estado: 'Confirmada',
      tipo: 'presencial',
    },
    {
      id: '2',
      fecha: '28 Ene 2026',
      hora: '2:00 PM',
      servicio: 'Laboratorio',
      doctor: 'Laboratorio RCA',
      sucursal: 'Guadalajara',
      estado: 'Completada',
      tipo: 'presencial',
    },
    {
      id: '3',
      fecha: '15 Ene 2026',
      hora: '11:00 AM',
      servicio: 'Consulta General',
      doctor: 'Dra. María López',
      sucursal: 'Guadalajara',
      estado: 'Completada',
      tipo: 'presencial',
    },
  ];

  const pagos = [
    {
      id: '1',
      fecha: '28 Ene 2026',
      concepto: 'Laboratorio',
      monto: 850.00,
      metodoPago: 'Tarjeta',
      referencia: 'PAY-2026-001',
    },
    {
      id: '2',
      fecha: '15 Ene 2026',
      concepto: 'Consulta General',
      monto: 450.00,
      metodoPago: 'Efectivo',
      referencia: 'PAY-2026-002',
    },
  ];

  const estadoCitaConfig: Record<string, { color: 'success' | 'warning' | 'secondary' | 'danger', icon: any }> = {
    'Confirmada': { color: 'success', icon: CheckCircle },
    'Pendiente': { color: 'warning', icon: Clock },
    'Completada': { color: 'secondary', icon: CheckCircle },
    'Cancelada': { color: 'danger', icon: XCircle },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/pacientes">
              <Button variant="ghost" className="pl-0">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                {paciente.nombreCompleto}
              </h1>
              <p className="text-gray-600 mt-1">
                Expediente #{paciente.noAfiliacion}
              </p>
            </div>
          </div>
          <Button variant="primary" className="shadow-lg">
            <Edit className="w-5 h-5 mr-2" />
            Editar Paciente
          </Button>
        </div>

        {paciente.sucursal !== sucursalActual && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Este paciente pertenece a <strong>{paciente.sucursal}</strong>. Estás viendo la
              sucursal <strong>{sucursalActual}</strong> en modo demo.
            </p>
          </div>
        )}

        {/* Información del Paciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Info Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos Personales */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">{paciente.nombreCompleto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Nacimiento</p>
                    <p className="font-semibold text-gray-900">{paciente.fechaNacimiento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Edad</p>
                    <p className="font-semibold text-gray-900">{paciente.edad} años</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Sexo</p>
                    <p className="font-semibold text-gray-900">
                      {paciente.sexo === 'F' ? 'Femenino' : 'Masculino'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">No. Afiliación</p>
                    <code className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm font-mono">
                      {paciente.noAfiliacion}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tipo de Afiliación</p>
                    <p className="font-semibold text-gray-900">{paciente.tipoAfiliacion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <CardTitle className="flex items-center">
                  <Phone className="w-6 h-6 mr-2 text-purple-600" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-semibold text-gray-900">{paciente.telefono}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">WhatsApp</p>
                      <p className="font-semibold text-gray-900">{paciente.whatsapp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{paciente.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-semibold text-gray-900">
                        {paciente.direccion.calle}, {paciente.direccion.colonia}
                      </p>
                      <p className="text-sm text-gray-600">
                        {paciente.direccion.ciudad}, {paciente.direccion.estado} - CP {paciente.direccion.codigoPostal}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historial de Citas */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-white">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-emerald-600" />
                    Historial de Citas
                  </span>
                  <Button variant="ghost" size="sm">Ver todas</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {citas.map((cita) => {
                    const config = estadoCitaConfig[cita.estado as keyof typeof estadoCitaConfig];
                    const EstadoIcon = config.icon;
                    
                    return (
                      <div key={cita.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{cita.servicio}</h4>
                                <Badge variant={config.color}>
                                  {cita.estado}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{cita.doctor}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {cita.fecha}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {cita.hora}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {cita.sucursal}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha - Resumen */}
          <div className="space-y-6">
            {/* Estado */}
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
                    <Activity className="w-10 h-10 text-white" />
                  </div>
                  <Badge variant="success" className="text-base px-4 py-2">
                    {paciente.estado}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-4">
                    Paciente desde {paciente.fechaRegistro}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas Rápidas */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Total Citas</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{citas.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Completadas</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      {citas.filter(c => c.estado === 'Completada').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">Pagos</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">{pagos.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagos Recientes */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
                  Pagos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pagos.map((pago) => (
                    <div key={pago.id} className="p-3 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold text-gray-900">{pago.concepto}</p>
                        <p className="text-sm font-bold text-emerald-600">
                          ${pago.monto.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{pago.fecha}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {pago.metodoPago}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="primary" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Expediente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
