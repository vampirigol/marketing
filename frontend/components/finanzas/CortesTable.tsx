'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  Calendar,
  DollarSign,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

interface Corte {
  id: string;
  sucursal: string;
  fecha: string;
  fechaCompleta: Date;
  turno: 'matutino' | 'vespertino' | 'completo';
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  total: number;
  citas: number;
  responsable: string;
  estado: 'pendiente' | 'revisado' | 'aprobado' | 'rechazado';
  notas?: string;
}

export function CortesTable() {
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterSucursal, setFilterSucursal] = useState('todas');

  const cortes: Corte[] = [
    {
      id: '1',
      sucursal: 'Guadalajara',
      fecha: 'Ayer',
      fechaCompleta: new Date('2026-02-02'),
      turno: 'completo',
      efectivo: 5200,
      tarjeta: 4800,
      transferencia: 2450,
      total: 12450,
      citas: 28,
      responsable: 'Yaretzi Ramírez',
      estado: 'pendiente',
      notas: 'Pendiente de verificación de 3 transferencias'
    },
    {
      id: '2',
      sucursal: 'Guadalajara',
      fecha: 'Ayer',
      fechaCompleta: new Date('2026-02-02'),
      turno: 'completo',
      efectivo: 3920,
      tarjeta: 3500,
      transferencia: 1500,
      total: 8920,
      citas: 21,
      responsable: 'Antonio López',
      estado: 'revisado',
      notas: 'Todo correcto, listo para aprobar'
    },
    {
      id: '3',
      sucursal: 'Ciudad Juárez',
      fecha: '01-Feb',
      fechaCompleta: new Date('2026-02-01'),
      turno: 'completo',
      efectivo: 6800,
      tarjeta: 5900,
      transferencia: 2600,
      total: 15300,
      citas: 35,
      responsable: 'María González',
      estado: 'aprobado'
    },
    {
      id: '4',
      sucursal: 'Ciudad Obregón',
      fecha: '01-Feb',
      fechaCompleta: new Date('2026-02-01'),
      turno: 'matutino',
      efectivo: 2100,
      tarjeta: 1800,
      transferencia: 900,
      total: 4800,
      citas: 12,
      responsable: 'Carlos Ruiz',
      estado: 'aprobado'
    },
    {
      id: '5',
      sucursal: 'Loreto Héroes',
      fecha: '31-Ene',
      fechaCompleta: new Date('2026-01-31'),
      turno: 'vespertino',
      efectivo: 3400,
      tarjeta: 2900,
      transferencia: 1200,
      total: 7500,
      citas: 18,
      responsable: 'Yaretzi Ramírez',
      estado: 'aprobado'
    }
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendiente
          </Badge>
        );
      case 'revisado':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Revisado
          </Badge>
        );
      case 'aprobado':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Aprobado
          </Badge>
        );
      case 'rechazado':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTurnoText = (turno: string) => {
    switch (turno) {
      case 'matutino':
        return '🌅 Matutino';
      case 'vespertino':
        return '🌆 Vespertino';
      case 'completo':
        return '🌍 Completo';
      default:
        return turno;
    }
  };

  const cortesTotales = cortes.length;
  const cortesPendientes = cortes.filter(c => c.estado === 'pendiente').length;
  const cortesAprobados = cortes.filter(c => c.estado === 'aprobado').length;
  const totalIngresos = cortes.reduce((sum, corte) => sum + corte.total, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cortes</p>
                <p className="text-2xl font-bold text-gray-900">{cortesTotales}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{cortesPendientes}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold text-green-600">{cortesAprobados}</p>
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
                <p className="text-sm text-gray-500">Total Ingresos</p>
                <p className="text-2xl font-bold text-blue-600">${totalIngresos.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={filterSucursal}
              onChange={(e) => setFilterSucursal(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las sucursales</option>
              <option value="gdl">Guadalajara</option>
              <option value="cjs">Ciudad Juárez</option>
              <option value="cob">Ciudad Obregón</option>
              <option value="lor">Loreto Héroes</option>
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="revisado">Revisados</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
            </select>
            <div className="flex-1" />
            <Button variant="secondary" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="space-y-4">
        {cortes.map((corte) => (
          <Card key={corte.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{corte.sucursal}</h3>
                        {getEstadoBadge(corte.estado)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {corte.fecha}
                        </span>
                        <span>{getTurnoText(corte.turno)}</span>
                        <span>{corte.citas} citas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">${corte.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>

                  {/* Payment breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">💵 Efectivo</p>
                      <p className="text-lg font-bold text-green-700">${corte.efectivo.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">💳 Tarjeta</p>
                      <p className="text-lg font-bold text-purple-700">${corte.tarjeta.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">🔄 Transferencia</p>
                      <p className="text-lg font-bold text-blue-700">${corte.transferencia.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Responsable and notes */}
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Responsable:</span> {corte.responsable}
                    </p>
                    {corte.notas && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Notas:</span> {corte.notas}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 lg:w-40">
                  <Button variant="primary" className="flex items-center justify-center gap-2 w-full">
                    <Eye className="w-4 h-4" />
                    Ver Detalle
                  </Button>
                  {corte.estado === 'pendiente' && (
                    <>
                      <Button variant="success" className="flex items-center justify-center gap-2 w-full">
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </Button>
                      <Button variant="danger" className="flex items-center justify-center gap-2 w-full">
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {corte.estado === 'revisado' && (
                    <Button variant="success" className="flex items-center justify-center gap-2 w-full">
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </Button>
                  )}
                  <Button variant="ghost" className="flex items-center justify-center gap-2 w-full">
                    <Download className="w-4 h-4" />
                    Descargar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
