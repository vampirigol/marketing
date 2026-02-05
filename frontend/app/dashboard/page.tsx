'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock,
  Users,
  Mail,
  PhoneCall,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';

const funnelStages = [
  { label: 'Leads', value: 1260, color: 'bg-blue-500', note: 'WhatsApp + redes' },
  { label: 'Prospectos', value: 842, color: 'bg-indigo-500', note: 'Interés confirmado' },
  { label: 'Citas', value: 512, color: 'bg-emerald-500', note: 'Agendadas' },
  { label: 'Atendidos', value: 378, color: 'bg-teal-500', note: 'Check-in' },
  { label: 'Seguimiento', value: 214, color: 'bg-amber-500', note: 'Reactivación' },
];

const smartLists = [
  { title: 'Inasistencia', count: 37, helper: 'No llegaron al cierre', tone: 'text-rose-600 bg-rose-50' },
  { title: 'En espera', count: 18, helper: '15 min sin check-in', tone: 'text-amber-600 bg-amber-50' },
  { title: 'Reagendamiento', count: 24, helper: 'Con promo disponible', tone: 'text-indigo-600 bg-indigo-50' },
  { title: 'Remarketing', count: 61, helper: 'Sin respuesta 7 días', tone: 'text-slate-600 bg-slate-100' },
];

const automations = [
  {
    title: 'Confirmación T-24h',
    channel: 'WhatsApp',
    status: 'Activo',
    icon: MessageCircle,
  },
  {
    title: 'Recordatorio T-3h',
    channel: 'SMS',
    status: 'Activo',
    icon: PhoneCall,
  },
  {
    title: 'Reactivación T+7d',
    channel: 'Email',
    status: 'Activo',
    icon: Mail,
  },
  {
    title: 'Check-in T+15m',
    channel: 'Recepción',
    status: 'Activo',
    icon: Clock,
  },
];

const rules = [
  {
    title: 'Promoción con 1 re-agendo',
    detail: 'Segunda vez sin promoción',
  },
  {
    title: 'Empalmes permitidos',
    detail: 'Hasta 3 citas por hora/doctor',
  },
  {
    title: 'Tolerancia de llegada',
    detail: '15 min antes de lista de espera',
  },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Vista general del sistema - Keila (Contact Center)</p>
          </div>
          <div className="text-sm text-gray-500">
            Última actualización: hace 10 minutos
          </div>
        </div>

        {/* KPIs Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Page Views */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +14.5%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Nuevos Leads</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">47</p>
                  <span className="text-xs text-gray-400">vs ayer</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visitors */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +6.4%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Citas Hoy</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">128</p>
                  <span className="text-xs text-gray-400">sucursales</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clicks */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3" />
                  -1.9%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Conversaciones</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">23</p>
                  <span className="text-xs text-gray-400">activas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +4%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Confirmadas</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">96</p>
                  <span className="text-xs text-gray-400">75% tasa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Embudo + Listas inteligentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Embudo de atención (demo)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Flujo unificado desde contacto hasta seguimiento
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <span className="font-medium text-gray-900">{stage.label}</span>
                      <span className="text-xs text-gray-400">{stage.note}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stage.value.toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${(stage.value / funnelStages[0].value) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Reglas demo activas: confirmaciones, recordatorios, re-agendos.
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Listas inteligentes
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Seguimiento automático por estado
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {smartLists.map((list) => (
                <div key={list.title} className={`rounded-lg px-4 py-3 ${list.tone}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{list.title}</p>
                    <span className="text-lg font-bold">{list.count}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">{list.helper}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Automatizaciones + Reglas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Automatizaciones activas
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Mensajería omnicanal y tareas operativas
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automations.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.channel}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Reglas clave
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Configurables por sucursal
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.title} className="rounded-lg border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900">{rule.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{rule.detail}</p>
                </div>
              ))}
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Demo: los cambios se reflejan en agenda y recepción.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Gráficos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Total Profit */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Total Profit</CardTitle>
                  <button className="text-sm text-gray-500 hover:text-gray-700">1M</button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-4xl font-bold text-gray-900">$446.7K</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <ArrowUp className="w-4 h-4" />
                      +24.4%
                    </span>
                    <span className="text-sm text-gray-500">vs last period</span>
                  </div>
                </div>
                {/* Simulación de gráfico */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-end justify-center p-4">
                  <div className="w-full h-full flex items-end justify-around gap-2">
                    {[40, 60, 45, 70, 55, 80, 65, 75, 70, 85, 75, 90].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customers Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500 mb-2">Total</p>
                  <p className="text-2xl font-bold text-gray-900">2,884</p>
                  <p className="text-xs text-gray-400 mt-1">pacientes</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500 mb-2">Nuevos</p>
                  <p className="text-2xl font-bold text-gray-900">1,432</p>
                  <p className="text-xs text-gray-400 mt-1">este mes</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm border-l-4 border-l-orange-500">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500 mb-2">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">562</p>
                  <p className="text-xs text-gray-400 mt-1">hoy</p>
                </CardContent>
              </Card>
            </div>

            {/* Best Selling Products */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Próximas Citas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Pedro Sánchez', specialty: 'Medicina General', time: '09:00', revenue: '$500', rating: 4.5 },
                    { name: 'Laura Martínez', specialty: 'Odontología', time: '10:00', revenue: '$250', rating: 4.8, isPromo: true },
                    { name: 'Carlos López', specialty: 'Pediatría', time: '10:30', revenue: '$500', rating: 4.2 },
                    { name: 'Ana García', specialty: 'Medicina General', time: '11:00', revenue: '$500', rating: 4.6 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.specialty}</p>
                        </div>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-semibold text-gray-900">{item.time}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${item.isPromo ? 'text-purple-600' : 'text-gray-900'}`}>
                          {item.revenue}
                        </p>
                        {item.isPromo && (
                          <span className="text-xs text-purple-600">Promo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Most Day Active */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Día Más Activo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#E5E7EB"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.72)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">Mar</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                    <div key={i} className={i === 2 ? 'font-bold text-blue-600' : 'text-gray-400'}>
                      {day}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Repeat Customer Rate */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Tasa de Retorno</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    {/* Gauge circular */}
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background arc */}
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#E5E7EB"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${Math.PI * 70 * 1.5}`}
                        strokeDashoffset={`${Math.PI * 70 * 0.25}`}
                      />
                      {/* Progress arc - gradient */}
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#gradient)"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${Math.PI * 70 * 1.5}`}
                        strokeDashoffset={`${Math.PI * 70 * (1.5 - 1.5 * 0.68)}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-gray-900">68%</span>
                      <span className="text-xs text-gray-500 mt-1">retorno</span>
                    </div>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Show Details
                </button>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">AI Assistant</h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center">
                    <Activity className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    className="w-full px-4 py-2 pr-10 bg-white border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
