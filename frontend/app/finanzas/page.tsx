'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  DollarSign, 
  CreditCard, 
  Banknote, 
  ArrowUpDown,
  TrendingUp,
  AlertCircle,
  Download,
  Clock,
  Building2
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CortesTable } from '@/components/finanzas/CortesTable';
import { AbonosTable } from '@/components/finanzas/AbonosTable';
import { CorteModal } from '@/components/finanzas/CorteModal';

interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

export default function FinanzasPage() {
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'abonos' | 'cortes'>('resumen');
  const [showCorteModal, setShowCorteModal] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  const [selectedPeriodo, setSelectedPeriodo] = useState('hoy');

  const kpis: KPI[] = [
    {
      label: 'Total del Día',
      value: '$45,280',
      change: '+12%',
      trend: 'up',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'blue'
    },
    {
      label: 'Tarjeta',
      value: '$17,200',
      change: '38%',
      trend: 'up',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'purple'
    },
    {
      label: 'Efectivo',
      value: '$19,080',
      change: '42%',
      trend: 'up',
      icon: <Banknote className="w-5 h-5" />,
      color: 'green'
    },
    {
      label: 'Transferencia',
      value: '$9,000',
      change: '20%',
      trend: 'up',
      icon: <ArrowUpDown className="w-5 h-5" />,
      color: 'orange'
    }
  ];

  const ingresosPorSucursal = [
    { sucursal: 'Guadalajara', monto: 15450, porcentaje: 34 },
    { sucursal: 'Ciudad Juárez', monto: 12800, porcentaje: 28 },
    { sucursal: 'Ciudad Obregón', monto: 10230, porcentaje: 23 },
    { sucursal: 'Loreto Héroes', monto: 6800, porcentaje: 15 }
  ];

  const cortesPendientes = [
    {
      id: '1',
      sucursal: 'Guadalajara',
      fecha: 'Ayer',
      monto: 12450,
      estado: 'pendiente' as const
    },
    { 
      id: '2',
      sucursal: 'Guadalajara Sur',
      fecha: 'Ayer',
      monto: 8920,
      estado: 'pendiente' as const
    },
    {
      id: '3',
      sucursal: 'Ciudad Juárez',
      fecha: '01-Feb',
      monto: 15300,
      estado: 'pendiente' as const
    }
  ];

  const actividadReciente = [
    {
      tiempo: '10:25',
      usuario: 'Yaretzi',
      accion: 'registró abono',
      detalle: 'María G. - $250'
    },
    {
      tiempo: '10:18',
      usuario: 'Antonio',
      accion: 'aprobó corte',
      detalle: 'Ciudad Juárez - $15,300'
    },
    {
      tiempo: '10:05',
      usuario: 'Recepción',
      accion: 'registró',
      detalle: 'Pedro S. - $350'
    },
    {
      tiempo: '09:45',
      usuario: 'Yaretzi',
      accion: 'registró abono',
      detalle: 'Ana M. - $200'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      purple: 'bg-purple-50 text-purple-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Finanzas</h1>
            <p className="text-gray-500 mt-1">Gestión de abonos y cortes de caja</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las sucursales</option>
              <option value="gdl">Guadalajara</option>
              <option value="cjs">Ciudad Juárez</option>
              <option value="cob">Ciudad Obregón</option>
              <option value="lor">Loreto Héroes</option>
            </select>
            <select 
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>
            <Button variant="primary" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Generar Reporte
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setSelectedTab('resumen')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'resumen'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setSelectedTab('abonos')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'abonos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Abonos
            </button>
            <button
              onClick={() => setSelectedTab('cortes')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'cortes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cortes de Caja
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'resumen' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {kpis.map((kpi, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                        {kpi.icon}
                      </div>
                      <span className={`text-xs font-medium flex items-center gap-1 ${
                        kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {kpi.change}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Meta del día */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📊 Meta del Día</h3>
                  <span className="text-2xl font-bold text-blue-600">78%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progreso: $45,280 / $58,000</span>
                    <span className="text-gray-500">Faltan $12,720</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: '78%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos por sucursal y Cortes pendientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ingresos por sucursal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Ingresos por Sucursal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ingresosPorSucursal.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-700">{item.sucursal}</span>
                          <span className="font-bold text-gray-900">${item.monto.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${item.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cortes pendientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      Cortes Pendientes
                    </span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                      {cortesPendientes.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cortesPendientes.map((corte) => (
                      <div 
                        key={corte.id}
                        className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{corte.sucursal}</p>
                          <p className="text-sm text-gray-600">{corte.fecha} • ${corte.monto.toLocaleString()}</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setShowCorteModal(true)}
                          className="bg-orange-600 text-white hover:bg-orange-700"
                        >
                          Revisar
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700">
                      Ver todos los cortes →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actividad reciente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actividadReciente.map((actividad, index) => (
                    <div key={index} className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-0">
                      <div className="text-xs text-gray-500 font-medium w-12">{actividad.tiempo}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{actividad.usuario}</span>
                          {' '}{actividad.accion}
                        </p>
                        <p className="text-sm text-gray-600">{actividad.detalle}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700">
                    Ver más actividad →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {selectedTab === 'abonos' && (
          <AbonosTable />
        )}

        {selectedTab === 'cortes' && (
          <CortesTable />
        )}
      </div>

      {/* Modal de Corte */}
      {showCorteModal && (
        <CorteModal
          corteId="1"
          onClose={() => setShowCorteModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
