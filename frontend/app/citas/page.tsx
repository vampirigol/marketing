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
import { citasService } from '@/lib/citas.service';
import { pacientesService } from '@/lib/pacientes.service';
import { obtenerSucursales, SucursalApi } from '@/lib/sucursales.service';
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
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');
  const [sucursales, setSucursales] = useState<SucursalApi[]>([]);
  const [sucursalIdActual, setSucursalIdActual] = useState<string | null>(null);
  const [kpi, setKpi] = useState<{
    total: number;
    confirmadas: number;
    atendidas: number;
    noShow: number;
    tasas: { confirmacion: number; asistencia: number; noShow: number };
  } | null>(null);
  const [alertasRiesgo, setAlertasRiesgo] = useState<{
    pendientesConfirmacion: number;
    riesgoNoShow: number;
  } | null>(null);

  const automatizacionesDemo = [
    {
      titulo: 'Confirmación T-24h',
      detalle: 'WhatsApp · Solicitar asistencia',
      estado: 'Activo',
    },
    {
      titulo: 'Recordatorio T-3h',
      detalle: 'SMS · Mensaje final',
      estado: 'Activo',
    },
    {
      titulo: 'Check-in T+15m',
      detalle: 'Recepción · En espera',
      estado: 'Activo',
    },
  ];

  const reglasClave = [
    'Promo: 1 re-agendo con beneficio',
    'Segundo re-agendo sin promoción',
    'Empalmes permitidos por médico',
  ];

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

  // Cargar sucursal desde localStorage
  useEffect(() => {
    const savedSucursal = localStorage.getItem('sucursalActual');
    if (savedSucursal) {
      setSucursalActual(savedSucursal);
    }
  }, []);

  useEffect(() => {
    if (!sucursales.length) return;
    const matched = sucursales.find((s) => s.nombre === sucursalActual) || sucursales[0];
    setSucursalIdActual(matched?.id || null);
  }, [sucursales, sucursalActual]);

  const mapTipoConsulta = (tipo: string) => {
    if (tipo === 'Primera_Vez') return 'Primera Vez';
    if (tipo === 'Subsecuente') return 'Subsecuente';
    if (tipo === 'Urgencia') return 'Urgencia';
    return tipo;
  };

  const mapCitaBackend = (citaBackend: any, paciente: any, sucursalNombre: string): Cita => ({
    id: citaBackend.id,
    pacienteId: citaBackend.pacienteId,
    pacienteNombre: paciente?.nombreCompleto || 'Paciente',
    pacienteTelefono: paciente?.telefono || '',
    pacienteEmail: paciente?.email || '',
    pacienteNoAfiliacion: paciente?.noAfiliacion || '',
    sucursalId: citaBackend.sucursalId,
    sucursalNombre,
    fechaCita: new Date(citaBackend.fechaCita),
    horaCita: citaBackend.horaCita,
    duracionMinutos: citaBackend.duracionMinutos || 30,
    tipoConsulta: mapTipoConsulta(citaBackend.tipoConsulta || 'Primera_Vez'),
    especialidad: citaBackend.especialidad || 'Medicina General',
    medicoAsignado: citaBackend.medicoAsignado || 'Doctor',
    estado: citaBackend.estado || 'Agendada',
    esPromocion: Boolean(citaBackend.esPromocion),
    reagendaciones: citaBackend.reagendaciones || 0,
    costoConsulta: citaBackend.costoConsulta || 0,
    montoAbonado: citaBackend.montoAbonado || 0,
    saldoPendiente: citaBackend.saldoPendiente || 0,
    fechaCreacion: new Date(citaBackend.fechaCreacion || new Date()),
    ultimaActualizacion: new Date(citaBackend.ultimaActualizacion || new Date()),
    motivoCancelacion: citaBackend.motivoCancelacion,
  });

  const cargarCitas = async () => {
    if (!sucursalIdActual) return;

    const fechaBase = new Date(fechaSeleccionada);
    let inicio = new Date(fechaBase);
    let fin = new Date(fechaBase);

    if (vista === 'semana') {
      const dia = inicio.getDay();
      const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
      inicio.setDate(diff);
      inicio.setHours(0, 0, 0, 0);
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
    } else if (vista === 'mes') {
      inicio = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
      fin = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
    }

    const fechas: Date[] = [];
    const cursor = new Date(inicio);
    while (cursor <= fin) {
      fechas.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    try {
      const citasPorDia = await Promise.all(
        fechas.map((fecha) =>
          citasService.obtenerPorSucursalYFecha(
            sucursalIdActual,
            fecha.toISOString().split('T')[0]
          )
        )
      );

      const citasBackend = citasPorDia.flat();
      const pacienteIds = Array.from(new Set(citasBackend.map((c: any) => c.pacienteId)));
      const pacientes = await Promise.all(
        pacienteIds.map((id) => pacientesService.obtenerPorId(id).catch(() => null))
      );
      const pacientesMap = new Map(pacientes.filter(Boolean).map((p: any) => [p.id, p]));

      const sucursalNombre = sucursales.find((s) => s.id === sucursalIdActual)?.nombre || 'Sucursal';
      const citasMapped = citasBackend.map((cita: any) =>
        mapCitaBackend(cita, pacientesMap.get(cita.pacienteId), sucursalNombre)
      );

      setCitas(citasMapped);
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  };

  const cargarKpi = async () => {
    if (!sucursalIdActual) return;
    const fechaBase = new Date(fechaSeleccionada);
    let inicio = new Date(fechaBase);
    let fin = new Date(fechaBase);

    if (vista === 'semana') {
      const dia = inicio.getDay();
      const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
      inicio.setDate(diff);
      inicio.setHours(0, 0, 0, 0);
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
    } else if (vista === 'mes') {
      inicio = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
      fin = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
    }

    try {
      const data = await citasService.obtenerKpi({
        sucursalId: sucursalIdActual,
        fechaInicio: inicio.toISOString().split('T')[0],
        fechaFin: fin.toISOString().split('T')[0],
      });
      setKpi(data);
    } catch (error) {
      console.error('Error cargando KPI de citas:', error);
    }
  };

  const cargarAlertasRiesgo = async () => {
    if (!sucursalIdActual) return;
    try {
      const data = await citasService.obtenerAlertasRiesgo({
        sucursalId: sucursalIdActual,
      });
      setAlertasRiesgo(data);
    } catch (error) {
      console.error('Error cargando alertas de riesgo:', error);
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarKpi();
    cargarAlertasRiesgo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalIdActual, vista, fechaSeleccionada]);

  // Limpiar doctores seleccionados si no pertenecen a la sucursal actual
  useEffect(() => {
    const doctoresSucursal = DOCTORES.filter(d => d.sucursal === sucursalActual).map(d => d.id);
    setSelectedDoctores((prev) => prev.filter(id => doctoresSucursal.includes(id)));
  }, [sucursalActual]);

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
    const handleCitaAgendada = () => {
      cargarCitas();
    };

    window.addEventListener('citaAgendada', handleCitaAgendada);
    return () => window.removeEventListener('citaAgendada', handleCitaAgendada);
  }, [sucursalIdActual, vista, fechaSeleccionada]);

  // Filtrar citas según filtros aplicados
  const citasFiltradas = citas.filter((cita) => {
    if (sucursalActual && cita.sucursalNombre && cita.sucursalNombre !== sucursalActual) {
      return false;
    }
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

  const handleConfirmar = async (citaId: string) => {
    await citasService.actualizar(citaId, { estado: 'Confirmada' as any });
    cargarCitas();
  };

  const handleMarcarLlegada = async (citaId: string) => {
    await citasService.marcarLlegada(citaId);
    cargarCitas();
  };

  const handleCancelar = async (citaId: string, motivo?: string) => {
    await citasService.cancelar(citaId, motivo || 'Cancelada');
    cargarCitas();
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
  const handleDragCita = async (citaId: string, nuevaFecha: Date, nuevaHora: string) => {
    await citasService.reagendar(citaId, {
      nuevaFecha,
      nuevaHora,
      motivo: 'Reagendada desde calendario',
    });
    cargarCitas();
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
        (cita.medicoAsignado || '').toLowerCase().includes(query) ||
        cita.especialidad.toLowerCase().includes(query) ||
        (cita.sucursalNombre || '').toLowerCase().includes(query) ||
        cita.pacienteTelefono?.toLowerCase().includes(query);
      
      if (!matches) return false;
    }

    // Filtro de doctores seleccionados
    if (selectedDoctores.length > 0) {
      const doctor = DOCTORES.find(d => d.nombre === cita.medicoAsignado);
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
              Gestión y calendario de citas médicas · {sucursalActual}
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

        {/* Estado de datos */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-900">
                Datos en vivo
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Agenda conectada a base de datos con disponibilidad y promociones reales.
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

        {/* KPI de citas */}
        {kpi && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">Confirmación</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.tasas.confirmacion}%</p>
              <p className="text-xs text-gray-400">{kpi.confirmadas} confirmadas de {kpi.total}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">Asistencia</p>
              <p className="text-2xl font-bold text-emerald-600">{kpi.tasas.asistencia}%</p>
              <p className="text-xs text-gray-400">{kpi.atendidas} atendidas</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500">No-show</p>
              <p className="text-2xl font-bold text-red-600">{kpi.tasas.noShow}%</p>
              <p className="text-xs text-gray-400">{kpi.noShow} no asistieron</p>
            </div>
          </div>
        )}

        {/* Automatizaciones y reglas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Automatizaciones demo</h3>
            <div className="space-y-3">
              {automatizacionesDemo.map((item) => (
                <div key={item.titulo} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                    <p className="text-xs text-gray-500">{item.detalle}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Reglas clave</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {reglasClave.map((regla) => (
                <li key={regla} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>{regla}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Alertas activas</h3>
            <p className="text-xs text-blue-700">
              {alertasRiesgo
                ? `Se muestran ${alertasRiesgo.pendientesConfirmacion} citas con confirmación pendiente y ${alertasRiesgo.riesgoNoShow} con riesgo de inasistencia.`
                : 'Cargando alertas en tiempo real...'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-800">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Monitoreo en tiempo real
            </div>
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
          <CitasFilters
            onFilterChange={setFilters}
            sucursales={sucursales.map((s) => ({ id: s.id, nombre: s.nombre }))}
            medicos={Array.from(new Set(citas.map((c) => c.medicoAsignado).filter(Boolean)))}
            estados={[
              { value: 'Agendada', label: 'Agendada' },
              { value: 'Confirmada', label: 'Confirmada' },
              { value: 'En_Consulta', label: 'En Consulta' },
              { value: 'Atendida', label: 'Atendida' },
              { value: 'Cancelada', label: 'Cancelada' },
              { value: 'No_Asistio', label: 'No Asistió' },
            ]}
            tiposConsulta={['Primera Vez', 'Subsecuente', 'Urgencia']}
          />
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
              fixedSucursal={sucursalActual}
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
