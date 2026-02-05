'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus,
  Edit,
  Trash2,
  Tag,
  Calendar,
  DollarSign,
  PercentIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { useState } from 'react';
import { PromocionModal } from '@/components/configuracion/PromocionModal';

interface Promocion {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  tipo: 'descuento_porcentaje' | 'descuento_fijo' | 'precio_especial';
  valor: number;
  servicios: string[];
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: 'activa' | 'programada' | 'vencida' | 'pausada';
  usosMaximos?: number;
  usosActuales: number;
  sucursales: string[];
  condiciones?: string;
}

export default function ConfiguracionPromocionesPage() {
  const [selectedTab, setSelectedTab] = useState<'activas' | 'programadas' | 'historial'>('activas');
  const [showModal, setShowModal] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);

  const promociones: Promocion[] = [
    {
      id: '1',
      nombre: 'Primera Consulta Gratis',
      codigo: 'PRIMERA2024',
      descripcion: 'Primera consulta de Medicina General sin costo para nuevos pacientes',
      tipo: 'descuento_porcentaje',
      valor: 100,
      servicios: ['Medicina General'],
      vigenciaInicio: '2026-01-01',
      vigenciaFin: '2026-12-31',
      estado: 'activa',
      usosMaximos: 100,
      usosActuales: 34,
      sucursales: ['Todas'],
      condiciones: 'Solo para pacientes nuevos'
    },
    {
      id: '2',
      nombre: '20% OFF Odontología',
      codigo: 'DIENTES20',
      descripcion: 'Descuento del 20% en todos los servicios de odontología',
      tipo: 'descuento_porcentaje',
      valor: 20,
      servicios: ['Odontología', 'Limpieza Dental', 'Ortodoncia'],
      vigenciaInicio: '2026-02-01',
      vigenciaFin: '2026-02-28',
      estado: 'activa',
      usosActuales: 18,
      sucursales: ['Guadalajara', 'Ciudad Juárez'],
      condiciones: 'No acumulable con otras promociones'
    },
    {
      id: '3',
      nombre: 'Pediatría $350',
      codigo: 'NINOS350',
      descripcion: 'Consulta de pediatría a precio especial',
      tipo: 'precio_especial',
      valor: 350,
      servicios: ['Pediatría'],
      vigenciaInicio: '2026-02-01',
      vigenciaFin: '2026-03-31',
      estado: 'activa',
      usosActuales: 45,
      sucursales: ['Todas']
    },
    {
      id: '4',
      nombre: 'Día de las Madres',
      codigo: 'MAMA2026',
      descripcion: 'Paquete especial Ginecología + Nutrición',
      tipo: 'descuento_fijo',
      valor: 500,
      servicios: ['Ginecología', 'Nutrición'],
      vigenciaInicio: '2026-05-01',
      vigenciaFin: '2026-05-31',
      estado: 'programada',
      usosMaximos: 200,
      usosActuales: 0,
      sucursales: ['Todas']
    }
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge variant="success">✅ Activa</Badge>;
      case 'programada':
        return <Badge variant="info">📅 Programada</Badge>;
      case 'vencida':
        return <Badge variant="danger">❌ Vencida</Badge>;
      case 'pausada':
        return <Badge variant="warning">⏸️ Pausada</Badge>;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'descuento_porcentaje':
        return '% Descuento';
      case 'descuento_fijo':
        return '$ Descuento';
      case 'precio_especial':
        return '$ Precio Especial';
      default:
        return tipo;
    }
  };

  const promocionesActivas = promociones.filter(p => p.estado === 'activa');
  const promocionesProgramadas = promociones.filter(p => p.estado === 'programada');
  const promocionesVencidas = promociones.filter(p => p.estado === 'vencida');

  const handleEdit = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedPromocion(null);
    setShowModal(true);
  };

  const promocionesAMostrar = 
    selectedTab === 'activas' ? promocionesActivas :
    selectedTab === 'programadas' ? promocionesProgramadas :
    promocionesVencidas;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏷️ Promociones</h1>
            <p className="text-gray-500 mt-1">Gestión de promociones y descuentos</p>
          </div>
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={handleNew}
          >
            <Plus className="w-5 h-5" />
            Nueva Promoción
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Activas</p>
                  <p className="text-3xl font-bold text-gray-900">{promocionesActivas.length}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Programadas</p>
                  <p className="text-3xl font-bold text-gray-900">{promocionesProgramadas.length}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Usos este mes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {promociones.reduce((sum, p) => sum + p.usosActuales, 0)}
                  </p>
                </div>
                <Tag className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ahorro Total</p>
                  <p className="text-3xl font-bold text-gray-900">$45.2K</p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setSelectedTab('activas')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'activas'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activas ({promocionesActivas.length})
            </button>
            <button
              onClick={() => setSelectedTab('programadas')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'programadas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Programadas ({promocionesProgramadas.length})
            </button>
            <button
              onClick={() => setSelectedTab('historial')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'historial'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial ({promocionesVencidas.length})
            </button>
          </nav>
        </div>

        {/* Lista de Promociones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promocionesAMostrar.map((promocion) => (
            <Card key={promocion.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{promocion.nombre}</h3>
                      {getEstadoBadge(promocion.estado)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{promocion.descripcion}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {promocion.codigo}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Valor y Tipo */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{getTipoLabel(promocion.tipo)}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {promocion.tipo === 'descuento_porcentaje' ? `${promocion.valor}%` : `$${promocion.valor}`}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      {promocion.tipo === 'descuento_porcentaje' ? (
                        <PercentIcon className="w-8 h-8 text-blue-600" />
                      ) : (
                        <DollarSign className="w-8 h-8 text-purple-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalles */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Vigencia:
                    </span>
                    <span className="font-medium text-gray-900">
                      {new Date(promocion.vigenciaInicio).toLocaleDateString('es-MX')} - {new Date(promocion.vigenciaFin).toLocaleDateString('es-MX')}
                    </span>
                  </div>

                  {promocion.usosMaximos && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Usos:</span>
                      <span className="font-medium text-gray-900">
                        {promocion.usosActuales} / {promocion.usosMaximos}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between text-sm">
                    <span className="text-gray-600">Servicios:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {promocion.servicios.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between text-sm">
                    <span className="text-gray-600">Sucursales:</span>
                    <span className="font-medium text-gray-900">
                      {promocion.sucursales.join(', ')}
                    </span>
                  </div>
                </div>

                {promocion.condiciones && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800">{promocion.condiciones}</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar de Usos */}
                {promocion.usosMaximos && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso de usos</span>
                      <span>{Math.round((promocion.usosActuales / promocion.usosMaximos) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(promocion.usosActuales / promocion.usosMaximos) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => handleEdit(promocion)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {promocionesAMostrar.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay promociones {selectedTab}
              </h3>
              <p className="text-gray-500 mb-6">
                Crea una nueva promoción para comenzar
              </p>
              <Button variant="primary" onClick={handleNew}>
                <Plus className="w-5 h-5 mr-2" />
                Nueva Promoción
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <PromocionModal
          promocion={selectedPromocion}
          onClose={() => {
            setShowModal(false);
            setSelectedPromocion(null);
          }}
          onSave={(data: Partial<Promocion>) => {
            console.log('Guardando promoción:', data);
            setShowModal(false);
            setSelectedPromocion(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
