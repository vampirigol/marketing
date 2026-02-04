'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarView } from '@/components/citas/CalendarView';
import { CitaModal } from '@/components/citas/CitaModal';
import { CitasFilters, CitasFilterState } from '@/components/citas/CitasFilters';
import { Button } from '@/components/ui/Button';
import { Cita } from '@/types';
import {
  Plus,
  Calendar,
  List,
  Grid3x3,
  Download,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function CitasPage() {
  const [vista, setVista] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filters, setFilters] = useState<CitasFilterState>({ soloPromociones: false });
  const [citas, setCitas] = useState<Cita[]>([]);

  // Cargar citas demo al montar
  useEffect(() => {
    cargarCitasDemo();
  }, []);

  const cargarCitasDemo = () => {
    // Generar citas demo para los próximos 7 días
    const citasDemo: Cita[] = [];
    const hoy = new Date();

    for (let dia = 0; dia < 7; dia++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + dia);

      // 8-12 citas por día
      const numCitas = Math.floor(Math.random() * 5) + 8;

      for (let i = 0; i < numCitas; i++) {
        const hora = Math.floor(Math.random() * 11) + 8; // 8-18
        const minuto = Math.random() > 0.5 ? 0 : 30;
        const horaCita = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

        const estados: Cita['estado'][] = ['Agendada', 'Confirmada', 'Llegó', 'En_Atencion', 'Finalizada'];
        const tiposConsulta = ['Primera Vez', 'Subsecuente', 'Urgencia', 'Control'];
        const medicos = ['Dr. López', 'Dra. Ramírez', 'Dr. González', 'Dra. Torres'];
        const sucursales = [
          { id: 'suc-1', nombre: 'CDMX Centro' },
          { id: 'suc-2', nombre: 'Guadalajara' },
          { id: 'suc-3', nombre: 'Monterrey' }
        ];
        const nombres = [
          'María González', 'Pedro López', 'Ana Martínez', 'Carlos Rodríguez',
          'Laura Fernández', 'Juan Sánchez', 'Sofia Torres', 'Diego Ramírez',
          'Valentina Pérez', 'Mateo García'
        ];

        const esPromocion = Math.random() > 0.7;
        const tipoConsulta = tiposConsulta[Math.floor(Math.random() * tiposConsulta.length)];
        const costoConsulta = esPromocion ? 250 : 500;
        const montoAbonado = Math.random() > 0.3 ? costoConsulta : Math.floor(costoConsulta / 2);
        const sucursal = sucursales[Math.floor(Math.random() * sucursales.length)];

        const cita: Cita = {
          id: `cita-${dia}-${i}`,
          pacienteId: `pac-${Math.floor(Math.random() * 100)}`,
          pacienteNombre: nombres[Math.floor(Math.random() * nombres.length)],
          pacienteTelefono: `555-${Math.floor(Math.random() * 9000 + 1000)}`,
          pacienteEmail: 'paciente@email.com',
          pacienteNoAfiliacion: `RCA-2024-${String(Math.floor(Math.random() * 9000 + 1000)).padStart(4, '0')}`,
          sucursalId: sucursal.id,
          sucursalNombre: sucursal.nombre,
          fechaCita: fecha,
          horaCita,
          duracionMinutos: tipoConsulta === 'Primera Vez' ? 45 : 30,
          tipoConsulta,
          especialidad: 'Medicina General',
          medicoAsignado: medicos[Math.floor(Math.random() * medicos.length)],
          estado: estados[Math.floor(Math.random() * estados.length)],
          esPromocion,
          reagendaciones: Math.random() > 0.8 ? Math.floor(Math.random() * 2) + 1 : 0,
          costoConsulta,
          montoAbonado,
          saldoPendiente: costoConsulta - montoAbonado,
          fechaCreacion: new Date(),
          ultimaActualizacion: new Date()
        };

        citasDemo.push(cita);
      }
    }

    setCitas(citasDemo);
  };

  // Filtrar citas según filtros aplicados
  const citasFiltradas = citas.filter((cita) => {
    // Filtro de fecha según vista
    const fechaCita = new Date(cita.fechaCita);
    
    if (vista === 'dia') {
      if (fechaCita.toDateString() !== fechaSeleccionada.toDateString()) {
        return false;
      }
    } else if (vista === 'semana') {
      const primerDia = new Date(fechaSeleccionada);
      const dia = primerDia.getDay();
      const diff = primerDia.getDate() - dia + (dia === 0 ? -6 : 1);
      primerDia.setDate(diff);
      primerDia.setHours(0, 0, 0, 0);

      const ultimoDia = new Date(primerDia);
      ultimoDia.setDate(primerDia.getDate() + 6);
      ultimoDia.setHours(23, 59, 59, 999);

      if (fechaCita < primerDia || fechaCita > ultimoDia) {
        return false;
      }
    } else if (vista === 'mes') {
      if (
        fechaCita.getMonth() !== fechaSeleccionada.getMonth() ||
        fechaCita.getFullYear() !== fechaSeleccionada.getFullYear()
      ) {
        return false;
      }
    }

    // Filtros adicionales
    if (filters.sucursalId && cita.sucursalId !== filters.sucursalId) return false;
    if (filters.medicoAsignado && cita.medicoAsignado !== filters.medicoAsignado) return false;
    if (filters.tipoConsulta && cita.tipoConsulta !== filters.tipoConsulta) return false;
    if (filters.estado && cita.estado !== filters.estado) return false;
    if (filters.soloPromociones && !cita.esPromocion) return false;

    if (filters.busqueda) {
      const busqueda = filters.busqueda.toLowerCase();
      return (
        cita.pacienteNombre?.toLowerCase().includes(busqueda) ||
        cita.pacienteTelefono?.toLowerCase().includes(busqueda) ||
        cita.pacienteNoAfiliacion?.toLowerCase().includes(busqueda)
      );
    }

    return true;
  });

  const handleCitaClick = (cita: Cita) => {
    setCitaSeleccionada(cita);
    setModalAbierto(true);
  };

  const handleConfirmar = (citaId: string) => {
    setCitas(prev => prev.map(c =>
      c.id === citaId ? { ...c, estado: 'Confirmada' as const } : c
    ));
  };

  const handleMarcarLlegada = (citaId: string) => {
    setCitas(prev => prev.map(c =>
      c.id === citaId ? { ...c, estado: 'Llegó' as const } : c
    ));
  };

  const handleCancelar = (citaId: string, motivo: string) => {
    setCitas(prev => prev.map(c =>
      c.id === citaId ? { ...c, estado: 'Cancelada' as const, motivoCancelacion: motivo } : c
    ));
  };

  // Estadísticas
  const estadisticas = {
    total: citasFiltradas.length,
    confirmadas: citasFiltradas.filter(c => c.estado === 'Confirmada').length,
    pendientes: citasFiltradas.filter(c => c.estado === 'Agendada').length,
    promociones: citasFiltradas.filter(c => c.esPromocion).length,
    saldoPendiente: citasFiltradas.reduce((acc, c) => acc + c.saldoPendiente, 0)
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              📅 Agenda de Citas
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión y calendario de citas médicas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Advertencia Demo */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Modo Demo - Datos Simulados
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Mostrando citas de ejemplo generadas automáticamente para los próximos 7 días.
                Los cambios no se guardan en la base de datos.
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 opacity-80" />
              <TrendingUp className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold">{estadisticas.total}</p>
            <p className="text-xs opacity-90">Total Citas</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <p className="text-2xl font-bold">{estadisticas.confirmadas}</p>
            <p className="text-xs opacity-90">Confirmadas</p>
            <p className="text-xs mt-1 opacity-75">
              {estadisticas.total > 0
                ? Math.round((estadisticas.confirmadas / estadisticas.total) * 100)
                : 0}% del total
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
            <p className="text-xs opacity-90">Por Confirmar</p>
            <p className="text-xs mt-1 opacity-75">
              Requieren seguimiento
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <p className="text-2xl font-bold">{estadisticas.promociones}</p>
            <p className="text-xs opacity-90">🎁 Promociones</p>
            <p className="text-xs mt-1 opacity-75">
              ${estadisticas.promociones * 250} MXN
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
            <p className="text-2xl font-bold">${estadisticas.saldoPendiente}</p>
            <p className="text-xs opacity-90">Saldo Pendiente</p>
            <p className="text-xs mt-1 opacity-75">
              Por cobrar
            </p>
          </div>
        </div>

        {/* Filtros */}
        <CitasFilters onFilterChange={setFilters} />

        {/* Controles de Vista */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Vista:</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setVista('dia')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  vista === 'dia'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Día
              </button>
              <button
                onClick={() => setVista('semana')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  vista === 'semana'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="w-4 h-4 inline mr-1" />
                Semana
              </button>
              <button
                onClick={() => setVista('mes')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  vista === 'mes'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Mes
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{citasFiltradas.length}</span> cita
            {citasFiltradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Calendario */}
        <CalendarView
          citas={citasFiltradas}
          fechaSeleccionada={fechaSeleccionada}
          onFechaChange={setFechaSeleccionada}
          onCitaClick={handleCitaClick}
          vista={vista}
        />

        {/* Modal de Detalle */}
        <CitaModal
          cita={citaSeleccionada}
          isOpen={modalAbierto}
          onClose={() => {
            setModalAbierto(false);
            setCitaSeleccionada(null);
          }}
          onConfirmar={handleConfirmar}
          onMarcarLlegada={handleMarcarLlegada}
          onCancelar={handleCancelar}
        />
      </div>
    </DashboardLayout>
  );
}
