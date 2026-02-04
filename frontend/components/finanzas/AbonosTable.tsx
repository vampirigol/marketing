'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Search,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  ArrowUpDown
} from 'lucide-react';
import { useState } from 'react';

interface Abono {
  id: string;
  hora: string;
  paciente: string;
  telefono: string;
  cita: string;
  monto: number;
  montoPendiente?: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  referencia?: string;
  estado: 'aplicado' | 'pendiente' | 'rechazado';
}

export function AbonosTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterMetodo, setFilterMetodo] = useState('todos');

  const abonos: Abono[] = [
    {
      id: '1',
      hora: '10:25',
      paciente: 'María González',
      telefono: '555-1234',
      cita: 'Medicina General',
      monto: 250,
      metodoPago: 'efectivo',
      estado: 'aplicado'
    },
    {
      id: '2',
      hora: '10:18',
      paciente: 'Pedro Sánchez',
      telefono: '555-5678',
      cita: 'Odontología - Consulta',
      monto: 350,
      metodoPago: 'tarjeta',
      referencia: '**** 4532',
      estado: 'aplicado'
    },
    {
      id: '3',
      hora: '10:05',
      paciente: 'Ana Martínez',
      telefono: '555-9012',
      cita: 'Pediatría - Urgencia',
      monto: 200,
      montoPendiente: 150,
      metodoPago: 'transferencia',
      referencia: 'REF:12345',
      estado: 'pendiente'
    },
    {
      id: '4',
      hora: '09:45',
      paciente: 'Carlos Ruiz',
      telefono: '555-3456',
      cita: 'Traumatología',
      monto: 500,
      metodoPago: 'efectivo',
      estado: 'aplicado'
    },
    {
      id: '5',
      hora: '09:30',
      paciente: 'Laura Díaz',
      telefono: '555-7890',
      cita: 'Ginecología',
      monto: 450,
      metodoPago: 'tarjeta',
      referencia: '**** 8901',
      estado: 'aplicado'
    }
  ];

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'efectivo':
        return <Banknote className="w-4 h-4" />;
      case 'tarjeta':
        return <CreditCard className="w-4 h-4" />;
      case 'transferencia':
        return <ArrowUpDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aplicado':
        return <Badge variant="success">✅ Aplicado</Badge>;
      case 'pendiente':
        return <Badge variant="warning">⏰ Pendiente</Badge>;
      case 'rechazado':
        return <Badge variant="danger">❌ Rechazado</Badge>;
      default:
        return null;
    }
  };

  const totalAbonos = abonos.reduce((sum, abono) => sum + abono.monto, 0);
  const abonosAplicados = abonos.filter(a => a.estado === 'aplicado').length;
  const abonosPendientes = abonos.filter(a => a.estado === 'pendiente').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Abonos</p>
                <p className="text-2xl font-bold text-gray-900">${totalAbonos.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Banknote className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aplicados</p>
                <p className="text-2xl font-bold text-green-600">{abonosAplicados}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{abonosPendientes}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por paciente, teléfono o referencia..."
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
              <option value="aplicado">Aplicados</option>
              <option value="pendiente">Pendientes</option>
              <option value="rechazado">Rechazados</option>
            </select>
            <select
              value={filterMetodo}
              onChange={(e) => setFilterMetodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Abono
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abonos.map((abono) => (
                  <tr key={abono.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {abono.hora}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{abono.paciente}</div>
                        <div className="text-sm text-gray-500">{abono.telefono}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {abono.cita}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">${abono.monto}</div>
                      {abono.montoPendiente && (
                        <div className="text-xs text-orange-600">Pend: ${abono.montoPendiente}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMetodoPagoIcon(abono.metodoPago)}
                        <div>
                          <div className="text-sm text-gray-900 capitalize">{abono.metodoPago}</div>
                          {abono.referencia && (
                            <div className="text-xs text-gray-500">{abono.referencia}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(abono.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        {abono.estado === 'pendiente' && (
                          <Button size="sm" variant="primary" className="ml-2">
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
