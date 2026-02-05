'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarView } from '@/components/citas/CalendarView';
import { CitaModal } from '@/components/citas/CitaModal';
import { AgendarCitaModal } from '@/components/matrix/AgendarCitaModal';
import { CitasFilters, CitasFilterState } from '@/components/citas/CitasFilters';
import { MiniCalendar } from '@/components/citas/MiniCalendar';
import { SearchBar } from '@/components/citas/SearchBar';
import { DoctorSelector } from '@/components/citas/DoctorSelector';
import { VistaLista } from '@/components/citas/VistaLista';
import { ZoomControls, ZoomLevel } from '@/components/citas/ZoomControls';
import { GestionHorarios } from '@/components/citas/GestionHorarios';
import { GestionAusencias } from '@/components/citas/GestionAusencias';
import { ReportesOcupacion } from '@/components/citas/ReportesOcupacion';
import { DashboardDoctor } from '@/components/citas/DashboardDoctor';
import { VistaMesEnhanced } from '@/components/citas/VistaMesEnhanced';
import { EstadisticasMes } from '@/components/citas/EstadisticasMes';
import { LeyendaEstados } from '@/components/citas/LeyendaEstados';
import { SidebarDiaDetalle } from '@/components/citas/SidebarDiaDetalle';
import { Button } from '@/components/ui/Button';
import { Cita } from '@/types';
import { DOCTORES } from '@/lib/doctores-data';
import {
  Plus,
  Calendar,
  List,
  Grid3x3,
  Download,
  AlertCircle,
  TrendingUp,
  X,
  FileDown,
  FileJson,
  FileText,
  Printer,
  Copy,
  ChevronDown,
  Users,
  LayoutList,
  Settings,
  UserX,
  BarChart3,
  UserCircle
} from 'lucide-react';
import { 
  exportToCSV, 
  exportToJSON, 
  copyToClipboard, 
  printAgenda,
  useKeyboardShortcuts 
} from '@/lib/citas-utils';

export default function CitasPage() {
  const [vista, setVista] = useState<'dia' | 'semana' | 'mes' | 'lista'>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAgendarCita, setModalAgendarCita] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filters, setFilters] = useState<CitasFilterState>({ soloPromociones: false });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctores, setSelectedDoctores] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'extended'>('normal');
  const [vistaMultiDoctor, setVistaMultiDoctor] = useState(false);
  const [showGestionHorarios, setShowGestionHorarios] = useState(false);
  const [showGestionAusencias, setShowGestionAusencias] = useState(false);
  const [showReportesOcupacion, setShowReportesOcupacion] = useState(false);
  const [showDashboardDoctor, setShowDashboardDoctor] = useState(false);
  const [doctorIdSeleccionado, setDoctorIdSeleccionado] = useState<string>('');
  const [showSidebarDia, setShowSidebarDia] = useState(false);
  const [fechaSidebarSeleccionada, setFechaSidebarSeleccionada] = useState<Date | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Cargar citas demo al montar
  useEffect(() => {
    cargarCitasDemo();
  }, []);

  // Cerrar menú de exportación al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  // Atajos de teclado
  useKeyboardShortcuts({
    onNextWeek: () => {
      if (vista === 'semana') {
        const nuevaFecha = new Date(fechaSeleccionada);
        nuevaFecha.setDate(nuevaFecha.getDate() + 7);
        setFechaSeleccionada(nuevaFecha);
      }
    },
    onPrevWeek: () => {
      if (vista === 'semana') {
        const nuevaFecha = new Date(fechaSeleccionada);
        nuevaFecha.setDate(nuevaFecha.getDate() - 7);
        setFechaSeleccionada(nuevaFecha);
      }
    },
    onToday: () => setFechaSeleccionada(new Date()),
    onNewCita: () => setModalAgendarCita(true),
    onExport: () => setShowExportMenu(prev => !prev)
  });

  // Escuchar evento de cita agendada para actualizar la lista
  useEffect(() => {
    const handleCitaAgendada = (event: any) => {
      const citaBackend = event.detail;
      
      // Convertir la cita del backend al formato del frontend
      const nuevaCita: Cita = {
        id: citaBackend.id || `cita-${Date.now()}`,
        pacienteId: citaBackend.paciente?.id || citaBackend.pacienteId,
        pacienteNombre: citaBackend.paciente?.nombre || citaBackend.pacienteNombre,
        pacienteTelefono: citaBackend.paciente?.telefono || citaBackend.pacienteTelefono || '',
        pacienteEmail: citaBackend.paciente?.email || citaBackend.pacienteEmail || '',
        pacienteNoAfiliacion: citaBackend.paciente?.noAfiliacion || `RCA-${Date.now()}`,
        sucursalId: citaBackend.sucursalId,
        sucursalNombre: citaBackend.sucursalNombre || 'Sucursal',
        fechaCita: new Date(citaBackend.fecha),
        horaCita: citaBackend.hora,
        duracionMinutos: citaBackend.duracionMinutos || 30,
        tipoConsulta: citaBackend.tipoConsulta || 'Primera Vez',
        especialidad: citaBackend.especialidad || 'Medicina General',
        medicoAsignado: citaBackend.doctorNombre || citaBackend.medicoAsignado || 'Doctor',
        estado: 'Agendada',
        esPromocion: citaBackend.promocionAplicada || false,
        reagendaciones: 0,
        costoConsulta: citaBackend.precio || 500,
        montoAbonado: 0,
        saldoPendiente: citaBackend.precio || 500,
        fechaCreacion: new Date(),
        ultimaActualizacion: new Date()
      };
      
      // Agregar la nueva cita al estado
      setCitas(prev => [nuevaCita, ...prev]);
      
      console.log('✅ Cita agregada al calendario:', nuevaCita);
    };

    window.addEventListener('citaAgendada', handleCitaAgendada);
    return () => window.removeEventListener('citaAgendada', handleCitaAgendada);
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

  const handleCancelar = (citaId: string, motivo?: string) => {
    setCitas(prev => prev.map(c =>
      c.id === citaId ? { ...c, estado: 'Cancelada' as const, motivoCancelacion: motivo || 'Sin motivo' } : c
    ));
  };

  // Quick actions
  const handleQuickConfirm = (citaId: string) => {
    handleConfirmar(citaId);
  };

  const handleQuickCancel = (citaId: string) => {
    handleCancelar(citaId, 'Cancelación rápida');
  };

  // Crear cita desde slot vacío
  const handleCreateCitaFromSlot = (fecha: Date, hora: string) => {
    // Aquí podrías abrir el modal con fecha y hora prellenadas
    // Por ahora solo abrimos el modal normal
    setModalAgendarCita(true);
  };

  // Drag & Drop para reagendar
  const handleDragCita = (citaId: string, nuevaFecha: Date, nuevaHora: string) => {
    setCitas(prev => prev.map(c => {
      if (c.id === citaId) {
        return {
          ...c,
          fechaCita: nuevaFecha,
          horaCita: nuevaHora,
          reagendaciones: (c.reagendaciones || 0) + 1
        };
      }
      return c;
    }));
    
    // Mostrar notificación de éxito
    const cita = citas.find(c => c.id === citaId);
    if (cita) {
      console.log(`✅ Cita reagendada: ${cita.pacienteNombre} - ${nuevaFecha.toLocaleDateString('es-MX')} ${nuevaHora}`);
    }
  };

  // Funciones de exportación
  const handleExportCSV = () => {
    exportToCSV(citasFiltradas, `citas_${vista}`);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    exportToJSON(citasFiltradas, `citas_${vista}`);
    setShowExportMenu(false);
  };

  const handleCopyClipboard = () => {
    copyToClipboard(citasFiltradas);
    alert('✅ Agenda copiada al portapapeles');
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    const titulo = `Agenda ${vista === 'dia' ? 'del Día' : vista === 'semana' ? 'de la Semana' : vista === 'mes' ? 'del Mes' : 'Lista'} - ${fechaSeleccionada.toLocaleDateString('es-MX')}`;
    printAgenda(citasFiltradas, titulo);
    setShowExportMenu(false);
  };

  // Actualizar nota de cita
  const handleUpdateNota = (citaId: string, nota: string) => {
    setCitas(prev => prev.map(c =>
      c.id === citaId ? { ...c, nota } : c
    ));
  };

  // Handler para click en día del mes
  const handleDayClick = (fecha: Date) => {
    setFechaSidebarSeleccionada(fecha);
    setShowSidebarDia(true);
  };

  // Obtener citas del día seleccionado en sidebar
  const citasDiaSeleccionado = useMemo(() => {
    if (!fechaSidebarSeleccionada) return [];
    return citas.filter(c => {
      const fechaCita = new Date(c.fecha || c.fechaCita);
      return fechaCita.toDateString() === fechaSidebarSeleccionada.toDateString();
    });
  }, [citas, fechaSidebarSeleccionada]);

  // Filtrar por búsqueda y doctores seleccionados
  const citasFiltradasCompleto = citasFiltradas.filter(cita => {
    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        cita.pacienteNombre.toLowerCase().includes(query) ||
        cita.doctor.toLowerCase().includes(query) ||
        cita.especialidad.toLowerCase().includes(query) ||
        cita.sucursal?.toLowerCase().includes(query) ||
        cita.pacienteTelefono?.toLowerCase().includes(query);
      
      if (!matches) return false;
    }

    // Filtro de doctores seleccionados
    if (selectedDoctores.length > 0) {
      const doctor = DOCTORES.find(d => d.nombre === cita.doctor);
      if (!doctor || !selectedDoctores.includes(doctor.id)) {
        return false;
      }
    }

    return true;
  });

  // Estadísticas
  const estadisticas = {
    total: citasFiltradasCompleto.length,
    confirmadas: citasFiltradasCompleto.filter(c => c.estado === 'Confirmada').length,
    pendientes: citasFiltradasCompleto.filter(c => c.estado === 'Agendada').length,
    promociones: citasFiltradasCompleto.filter(c => c.esPromocion).length,
    saldoPendiente: citasFiltradasCompleto.reduce((acc, c) => acc + c.saldoPendiente, 0)
  };

  // Obtener fechas con citas para el mini-calendario
  const fechasConCitas = Array.from(new Set(citas.map(c => new Date(c.fechaCita).toDateString())))
    .map(dateString => new Date(dateString));

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
            {/* Botón Dashboard Doctor */}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                // Si hay un solo doctor seleccionado, abrir su dashboard
                if (selectedDoctores.length === 1) {
                  setDoctorIdSeleccionado(selectedDoctores[0]);
                  setShowDashboardDoctor(true);
                } else {
                  // Si no hay selección o hay múltiples, abrir selector
                  const primerDoctor = DOCTORES[0];
                  setDoctorIdSeleccionado(primerDoctor.id);
                  setShowDashboardDoctor(true);
                }
              }}
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Mi Dashboard
            </Button>

            {/* Botón Reportes */}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowReportesOcupacion(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Reportes
            </Button>

            {/* Botón Gestión Horarios */}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowGestionHorarios(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Horarios
            </Button>

            {/* Botón Gestión Ausencias */}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowGestionAusencias(true)}
            >
              <UserX className="w-4 h-4 mr-2" />
              Ausencias
            </Button>

            {/* Menú de exportación */}
            <div className="relative" ref={exportMenuRef}>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Exportar CSV</div>
                        <div className="text-xs text-gray-500">Para Excel/Sheets</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Exportar JSON</div>
                        <div className="text-xs text-gray-500">Formato de datos</div>
                      </div>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">Imprimir/PDF</div>
                        <div className="text-xs text-gray-500">Vista de impresión</div>
                      </div>
                    </button>
                    <div className="border-t border-gray-100 my-2" />
                    <button
                      onClick={handleCopyClipboard}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Copiar al portapapeles</div>
                        <div className="text-xs text-gray-500">Texto plano</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              variant="primary"
              onClick={() => setModalAgendarCita(true)}
            >
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

        {/* Estadísticas - Diseño Minimalista */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Citas */}
          <div className="group relative bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-5 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{estadisticas.total}</h3>
            <p className="text-sm font-medium text-gray-500">Total Citas</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </div>

          {/* Confirmadas */}
          <div className="group relative bg-white border border-gray-200 hover:border-green-400 rounded-xl p-5 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-green-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md">
                {estadisticas.total > 0
                  ? Math.round((estadisticas.confirmadas / estadisticas.total) * 100)
                  : 0}%
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{estadisticas.confirmadas}</h3>
            <p className="text-sm font-medium text-gray-500">Confirmadas</p>
            <p className="text-xs text-gray-400 mt-1">del total programado</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-b-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </div>

          {/* Por Confirmar */}
          <div className="group relative bg-white border border-gray-200 hover:border-orange-400 rounded-xl p-5 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              {estadisticas.pendientes > 0 && (
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  !
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{estadisticas.pendientes}</h3>
            <p className="text-sm font-medium text-gray-500">Por Confirmar</p>
            <p className="text-xs text-gray-400 mt-1">requieren seguimiento</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-b-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </div>

          {/* Promociones */}
          <div className="group relative bg-white border border-gray-200 hover:border-purple-400 rounded-xl p-5 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <span className="text-xl">🎁</span>
              </div>
              <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md">
                $250
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{estadisticas.promociones}</h3>
            <p className="text-sm font-medium text-gray-500">Promociones</p>
            <p className="text-xs text-gray-400 mt-1">
              ${(estadisticas.promociones * 250).toLocaleString('es-MX')} MXN
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-b-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </div>

          {/* Saldo Pendiente */}
          <div className="group relative bg-white border border-gray-200 hover:border-red-400 rounded-xl p-5 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <span className="text-xl font-bold text-red-600">$</span>
              </div>
              {estadisticas.saldoPendiente > 0 && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              ${estadisticas.saldoPendiente.toLocaleString('es-MX')}
            </h3>
            <p className="text-sm font-medium text-gray-500">Saldo Pendiente</p>
            <p className="text-xs text-gray-400 mt-1">por cobrar</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-b-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
            {(filters.sucursalId || filters.medicoAsignado || filters.tipoConsulta || filters.estado || filters.busqueda) && (
              <button
                onClick={() => setFilters({ soloPromociones: false })}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          <CitasFilters onFilterChange={setFilters} />
        </div>

        {/* Layout principal con calendario lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendario principal */}
          <div className="lg:col-span-3 space-y-4">
            {/* Barra de búsqueda */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              totalResults={citasFiltradasCompleto.length}
            />

            {/* Controles de Vista */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-3 gap-4">
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
                  <button
                    onClick={() => setVista('lista')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      vista === 'lista'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutList className="w-4 h-4 inline mr-1" />
                    Lista
                  </button>
                </div>
              </div>

              {/* Vista Multi-Doctor Toggle */}
              {vista === 'semana' && (
                <button
                  onClick={() => setVistaMultiDoctor(!vistaMultiDoctor)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    vistaMultiDoctor
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Multi-Doctor
                </button>
              )}

              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{citasFiltradasCompleto.length}</span> cita
                {citasFiltradasCompleto.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Zoom Controls para vista Semana */}
            {vista === 'semana' && (
              <ZoomControls
                zoomLevel={zoomLevel}
                onChange={setZoomLevel}
              />
            )}

            {/* Calendario o Lista */}
            {vista === 'lista' ? (
              <VistaLista
                citas={citasFiltradasCompleto}
                onSelectCita={handleCitaClick}
                onUpdateNota={handleUpdateNota}
                searchQuery={searchQuery}
              />
            ) : (
              <CalendarView
                citas={citasFiltradasCompleto}
                fechaSeleccionada={fechaSeleccionada}
                onFechaChange={setFechaSeleccionada}
                onCitaClick={handleCitaClick}
                vista={vista}
                onQuickConfirm={handleQuickConfirm}
                onQuickCancel={handleQuickCancel}
                onCreateCita={handleCreateCitaFromSlot}
                onDragCita={handleDragCita}
                zoomLevel={zoomLevel}
                vistaMultiDoctor={vistaMultiDoctor}
                selectedDoctores={selectedDoctores}
              />
            )}
          </div>

          {/* Sidebar con mini-calendario y selector de doctores */}
          <div className="lg:col-span-1 space-y-4">
            <MiniCalendar
              selectedDate={fechaSeleccionada}
              onDateSelect={setFechaSeleccionada}
              highlightedDates={fechasConCitas}
            />

            {/* Selector de Doctores */}
            <DoctorSelector
              selectedDoctores={selectedDoctores}
              onChange={setSelectedDoctores}
              multiSelect={true}
            />

            {/* Resumen rápido */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <h4 className="text-sm font-bold text-blue-900 mb-3">📊 Resumen del Día</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Total</span>
                  <span className="font-bold text-blue-900">{estadisticas.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Confirmadas</span>
                  <span className="font-bold text-green-900">{estadisticas.confirmadas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-700">Pendientes</span>
                  <span className="font-bold text-orange-900">{estadisticas.pendientes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Modal de Agendar Nueva Cita */}
        <AgendarCitaModal
          isOpen={modalAgendarCita}
          onClose={() => setModalAgendarCita(false)}
        />

        {/* Modal de Gestión de Horarios */}
        {showGestionHorarios && (
          <GestionHorarios onClose={() => setShowGestionHorarios(false)} />
        )}

        {/* Modal de Gestión de Ausencias */}
        {showGestionAusencias && (
          <GestionAusencias onClose={() => setShowGestionAusencias(false)} />
        )}

        {/* Modal de Reportes de Ocupación */}
        {showReportesOcupacion && (
          <ReportesOcupacion 
            citas={citas} 
            onClose={() => setShowReportesOcupacion(false)} 
          />
        )}

        {/* Modal de Dashboard del Doctor */}
        {showDashboardDoctor && doctorIdSeleccionado && (
          <DashboardDoctor 
            doctorId={doctorIdSeleccionado}
            citas={citas}
            onClose={() => setShowDashboardDoctor(false)}
            onEditarHorario={() => {
              setShowDashboardDoctor(false);
              setShowGestionHorarios(true);
            }}
            onSolicitarAusencia={() => {
              setShowDashboardDoctor(false);
              setShowGestionAusencias(true);
            }}
          />
        )}

        {/* Sidebar con detalle del día (Vista Mes) */}
        {showSidebarDia && fechaSidebarSeleccionada && (
          <SidebarDiaDetalle
            fecha={fechaSidebarSeleccionada}
            citas={citasDiaSeleccionado}
            onClose={() => setShowSidebarDia(false)}
            onCitaClick={(cita) => {
              setCitaSeleccionada(cita);
              setModalAbierto(true);
              setShowSidebarDia(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
