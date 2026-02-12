'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CalendarView } from '@/components/citas/CalendarView';
import { CitaModal } from '@/components/citas/CitaModal';
import { AgendarCitaModal } from '@/components/matrix/AgendarCitaModal';
import { CitasFilters, CitasFilterState } from '@/components/citas/CitasFilters';
import { MiniCalendar } from '@/components/citas/MiniCalendar';
import { DoctorSelector } from '@/components/citas/DoctorSelector';
import { VistaLista } from '@/components/citas/VistaLista';
import { GestionHorarios } from '@/components/citas/GestionHorarios';
import { GestionAusencias } from '@/components/citas/GestionAusencias';
import { ReportesOcupacion } from '@/components/citas/ReportesOcupacion';
import { DashboardDoctor } from '@/components/citas/DashboardDoctor';
import { SidebarDiaDetalle } from '@/components/citas/SidebarDiaDetalle';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Cita } from '@/types';
import { DOCTORES } from '@/lib/doctores-data';
import { citasService } from '@/lib/citas.service';
import { pacientesService } from '@/lib/pacientes.service';
import { obtenerSucursales, obtenerSucursalesDesdeCatalogo, SucursalApi } from '@/lib/sucursales.service';
import {
  Plus, Calendar, CalendarDays, CalendarRange, LayoutList, X,
  UserX, BarChart3, Clock
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/lib/citas-utils';

export default function CitasPage() {
  // --- 1. ESTADOS INICIALES (Movidas aquí adentro) ---
  const [usuarioRol, setUsuarioRol] = useState<string | null>(null);
  const [vista, setVista] = useState<'dia' | 'semana' | 'mes' | 'lista'>('dia');
  
  // Estados de paginación y filtros server-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<'fecha' | 'paciente' | 'doctor' | 'estado'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterEstado, setFilterEstado] = useState('all');
  const [citasPaginadas, setCitasPaginadas] = useState<Cita[]>([]);

  // Estados generales
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAgendarCita, setModalAgendarCita] = useState(false);
  const [filters, setFilters] = useState<CitasFilterState>({ soloPromociones: false });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctores, setSelectedDoctores] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState<'compact' | 'normal' | 'extended'>('normal');
  const [vistaMultiDoctor, setVistaMultiDoctor] = useState(false);
  
  // Estados de modales extra
  const [showGestionHorarios, setShowGestionHorarios] = useState(false);
  const [showGestionAusencias, setShowGestionAusencias] = useState(false);
  const [showReportesOcupacion, setShowReportesOcupacion] = useState(false);
  const [showDashboardDoctor, setShowDashboardDoctor] = useState(false);
  const [doctorIdSeleccionado, setDoctorIdSeleccionado] = useState<string>('');
  const [showSidebarDia, setShowSidebarDia] = useState(false);
  const [fechaSidebarSeleccionada, setFechaSidebarSeleccionada] = useState<Date | null>(null);
  const [showListaEspera, setShowListaEspera] = useState(false);
  const [listaEspera, setListaEspera] = useState<Array<{ id: string; nombreCompleto: string; telefono: string; email?: string; estado: string; creadoEn: string }>>([]);
  const [modalAgendarPacienteNombre, setModalAgendarPacienteNombre] = useState<string | undefined>(undefined);
  const solicitudIdParaAsignarRef = useRef<string | null>(null);
  
  // Estados de Sucursales y Datos
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');
  const [sucursales, setSucursales] = useState<SucursalApi[]>([]);
  const [sucursalIdActual, setSucursalIdActual] = useState<string | null>(null);
  const [kpi, setKpi] = useState<{
    total: number; confirmadas: number; atendidas: number; noShow: number;
    tasas: { confirmacion: number; asistencia: number; noShow: number };
  } | null>(null);
  const [alertasRiesgo, setAlertasRiesgo] = useState<{
    pendientesConfirmacion: number; riesgoNoShow: number;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Constantes derivadas (useMemo para evitar TDZ en SSR/hidratación) ---
  const esAdmin = usuarioRol === 'Admin';
  const sucursalFiltro = useMemo(
    () => (filters.sucursalId ? sucursales.find((s) => s.id === filters.sucursalId) ?? null : null),
    [filters.sucursalId, sucursales]
  );
  const nombreSucursalFiltro = sucursalFiltro?.nombre ?? null;
  const sucursalIdConsulta = useMemo(
    () => (esAdmin && filters.sucursalId && sucursalFiltro ? filters.sucursalId : undefined),
    [esAdmin, filters.sucursalId, sucursalFiltro]
  );
  const sucursalIdsConsulta = useMemo(
    () =>
      esAdmin
        ? (sucursalIdConsulta ? [sucursalIdConsulta] : sucursales.map((s) => s.id))
        : (sucursalIdActual ? [sucursalIdActual] : []),
    [esAdmin, sucursalIdConsulta, sucursales, sucursalIdActual]
  );
  const nombreSucursalActual = esAdmin
    ? (nombreSucursalFiltro || 'Todas las sucursales')
    : sucursalActual;

  // --- 2. EFECTOS (Hooks useEffect) ---

  // Fetch paginado desde backend real (vista Lista). Usamos filters.sucursalId directamente en el array de deps para evitar TDZ.
  useEffect(() => {
    if (vista !== 'lista') return;
    const sucursalId = esAdmin && filters.sucursalId && sucursales.some((s) => s.id === filters.sucursalId) ? filters.sucursalId : undefined;
    const fetchCitasPaginadas = async () => {
      const inicio = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
      const fin = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth() + 1, 0);
      const fechaInicio = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-${String(inicio.getDate()).padStart(2, '0')}`;
      const fechaFin = `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`;
      try {
        const { data: listData, total: totalCount } = await citasService.listarPaginado({
          page,
          pageSize,
          search: searchQuery,
          estado: filterEstado,
          sucursalId: sucursalId ?? undefined,
          medicoAsignado: filters.medicoAsignado || undefined,
          fechaInicio,
          fechaFin,
          sortField,
          sortDirection,
        });
        setCitasPaginadas(listData || []);
        setTotal(totalCount ?? 0);
      } catch (e) {
        console.error('Error fetching paginated citas', e);
        setCitasPaginadas([]);
        setTotal(0);
      }
    };
    fetchCitasPaginadas();
  }, [page, pageSize, searchQuery, filterEstado, sortField, sortDirection, vista, refreshKey, fechaSeleccionada, esAdmin, filters.sucursalId, filters.medicoAsignado, sucursales]);

  // Cargar Sucursales (con fallback a catálogo si /sucursales falla)
  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const data = await obtenerSucursales(true);
        if (data?.length) {
          setSucursales(data);
          return;
        }
      } catch (error) {
        console.warn('Error cargando sucursales, intentando catálogo:', error);
      }
      try {
        const desdeCatalogo = await obtenerSucursalesDesdeCatalogo();
        if (desdeCatalogo?.length) setSucursales(desdeCatalogo);
      } catch (err) {
        console.error('Error cargando sucursales desde catálogo:', err);
      }
    };
    cargarSucursales();
  }, []);

  // Cargar Rol
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsuarioRol(parsed?.rol || null);
      } catch {
        setUsuarioRol(null);
      }
    }
  }, []);

  // Cargar sucursal desde localStorage
  useEffect(() => {
    const savedSucursal = localStorage.getItem('sucursalActual');
    if (savedSucursal) {
      setSucursalActual(savedSucursal);
    }
  }, []);

  // Mapear nombre sucursal a ID
  useEffect(() => {
    if (!sucursales.length) return;
    const matched = sucursales.find((s) => s.nombre === sucursalActual) || sucursales[0];
    setSucursalIdActual(matched?.id || null);
  }, [sucursales, sucursalActual]);

  // --- Helpers ---
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
    fechaCita: parseFechaCitaLocal(citaBackend.fechaCita),
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

  // Formato YYYY-MM-DD en fecha local (evita que UTC cambie el día al pedir citas pasadas)
  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Parsea fecha del backend como día local (evita que 'YYYY-MM-DD' se interprete como UTC y cambie el día)
  const parseFechaCitaLocal = (val: string | Date): Date => {
    if (val instanceof Date) return val;
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(s);
  };

  // --- Funciones de Carga de Datos ---
  const cargarCitas = async () => {
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

    const fechaInicioStr = toLocalDateStr(inicio);
    const fechaFinStr = toLocalDateStr(fin);

    try {
      let citasBackend: any[];

      // Admin sin filtro de sucursal O sin sucursales cargadas: usar rango para no depender de /sucursales
      const usarRango = esAdmin && !sucursalIdConsulta;
      if (usarRango || sucursalIdsConsulta.length === 0) {
        citasBackend = await citasService.obtenerPorRango({
          fechaInicio: fechaInicioStr,
          fechaFin: fechaFinStr,
          sucursalId: sucursalIdConsulta,
        });
      } else {
        const fechas: Date[] = [];
        const cursor = new Date(inicio);
        while (cursor <= fin) {
          fechas.push(new Date(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
        const citasPorDia = await Promise.all(
          fechas.map((fecha) =>
            Promise.all(
              sucursalIdsConsulta.map((sucursalId) =>
                citasService.obtenerPorSucursalYFecha(
                  sucursalId,
                  toLocalDateStr(fecha)
                )
              )
            )
          )
        );
        citasBackend = citasPorDia.flat().flat();
      }
      const pacienteIds = Array.from(new Set(citasBackend.map((c: any) => c.pacienteId)));
      const pacientes = await Promise.all(
        pacienteIds.map((id) => pacientesService.obtenerPorId(id).catch(() => null))
      );
      const pacientesMap = new Map(pacientes.filter(Boolean).map((p: any) => [p.id, p]));

      const sucursalMap = new Map(sucursales.map((s) => [s.id, s.nombre]));
      const citasMapped = citasBackend.map((cita: any) =>
        mapCitaBackend(
          cita,
          pacientesMap.get(cita.pacienteId),
          sucursalMap.get(cita.sucursalId) || 'Sucursal'
        )
      );

      setCitas(citasMapped);
    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  };

  const cargarKpi = async () => {
    if (!sucursalIdsConsulta.length) return;
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
        sucursalId: esAdmin && !filters.sucursalId ? undefined : sucursalIdsConsulta[0],
        fechaInicio: inicio.toISOString().split('T')[0],
        fechaFin: fin.toISOString().split('T')[0],
      });
      setKpi(data);
    } catch (error) {
      console.error('Error cargando KPI de citas:', error);
    }
  };

  const cargarAlertasRiesgo = async () => {
    if (!sucursalIdsConsulta.length) return;
    try {
      const data = await citasService.obtenerAlertasRiesgo({
        sucursalId: esAdmin && !filters.sucursalId ? undefined : sucursalIdsConsulta[0],
      });
      setAlertasRiesgo(data);
    } catch (error) {
      console.error('Error cargando alertas de riesgo:', error);
    }
  };

  // Carga inicial de citas, KPI y alertas (sync CRM ya no se ejecuta aquí; usar CRM o botón explícito)
  useEffect(() => {
    cargarCitas();
    cargarKpi();
    cargarAlertasRiesgo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalIdActual, vista, fechaSeleccionada, filters.sucursalId, esAdmin, sucursales.length]);

  // Limpiar doctores seleccionados si no pertenecen a la sucursal actual
  useEffect(() => {
    if (!esAdmin) {
      const doctoresSucursal = DOCTORES.filter(d => d.sucursal === sucursalActual).map(d => d.id);
      setSelectedDoctores((prev) => prev.filter(id => doctoresSucursal.includes(id)));
      return;
    }
    if (nombreSucursalFiltro) {
      const doctoresSucursal = DOCTORES.filter(d => d.sucursal === nombreSucursalFiltro).map(d => d.id);
      setSelectedDoctores((prev) => prev.filter(id => doctoresSucursal.includes(id)));
    }
  }, [sucursalActual, nombreSucursalFiltro, esAdmin]);

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
  });

  // Cargar lista de espera cuando se muestra el panel
  const cargarListaEspera = async () => {
    try {
      const data = await citasService.listarListaEspera({ estado: 'Pendiente' });
      setListaEspera(data);
    } catch {
      setListaEspera([]);
    }
  };
  useEffect(() => {
    if (showListaEspera) cargarListaEspera();
  }, [showListaEspera]);

  // Escuchar evento de cita agendada (mismo tab) y BroadcastChannel (otro tab)
  useEffect(() => {
    const handleCitaAgendada = (e?: Event) => {
      const detail = (e instanceof CustomEvent ? e.detail : null) as { id?: string; pacienteId?: string } | undefined;
      const solicitudId = solicitudIdParaAsignarRef.current;
      if (solicitudId && detail?.id) {
        citasService.asignarListaEspera(solicitudId, { citaId: detail.id, pacienteId: detail.pacienteId }).then(() => {
          solicitudIdParaAsignarRef.current = null;
          setModalAgendarPacienteNombre(undefined);
          cargarListaEspera();
        }).catch(() => {});
      }
      cargarCitas();
      cargarKpi();
      cargarAlertasRiesgo();
      setRefreshKey((k) => k + 1); // Refresca vista lista si está activa
    };
    window.addEventListener('citaAgendada', handleCitaAgendada);
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('crm_citas');
      ch.onmessage = (e) => {
        if (e.data?.type === 'citaAgendada') handleCitaAgendada();
      };
    }
    return () => {
      window.removeEventListener('citaAgendada', handleCitaAgendada);
      ch?.close();
    };
  }, [sucursalIdActual, vista, fechaSeleccionada]);

  // --- Lógica de Renderizado ---
  const citasFiltradas = citas.filter((cita) => {
    if (!esAdmin && sucursalActual && cita.sucursalNombre && cita.sucursalNombre !== sucursalActual) {
      return false;
    }
    const fechaCita = new Date(cita.fechaCita);
    
    if (vista === 'dia') {
      if (fechaCita.toDateString() !== fechaSeleccionada.toDateString()) return false;
    } else if (vista === 'semana') {
      const primerDia = new Date(fechaSeleccionada);
      const dia = primerDia.getDay();
      const diff = primerDia.getDate() - dia + (dia === 0 ? -6 : 1);
      primerDia.setDate(diff);
      primerDia.setHours(0, 0, 0, 0);
      const ultimoDia = new Date(primerDia);
      ultimoDia.setDate(primerDia.getDate() + 6);
      ultimoDia.setHours(23, 59, 59, 999);
      if (fechaCita < primerDia || fechaCita > ultimoDia) return false;
    } else if (vista === 'mes') {
      if (
        fechaCita.getMonth() !== fechaSeleccionada.getMonth() ||
        fechaCita.getFullYear() !== fechaSeleccionada.getFullYear()
      ) return false;
    }

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

  const handleQuickConfirm = (citaId: string) => handleConfirmar(citaId);
  const handleQuickCancel = (citaId: string) => handleCancelar(citaId, 'Cancelación rápida');
  const handleCreateCitaFromSlot = (fecha: Date, hora: string) => setModalAgendarCita(true);
  
  const handleDragCita = async (citaId: string, nuevaFecha: Date, nuevaHora: string) => {
    await citasService.reagendar(citaId, {
      nuevaFecha,
      nuevaHora,
      motivo: 'Reagendada desde calendario',
    });
    cargarCitas();
  };

  const handleUpdateNota = (citaId: string, nota: string) => {
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, nota } : c));
  };

  const citasDiaSeleccionado = useMemo(() => {
    if (!fechaSidebarSeleccionada) return [];
    return citas.filter(c => {
      const fechaCita = new Date(c.fecha || c.fechaCita);
      return fechaCita.toDateString() === fechaSidebarSeleccionada.toDateString();
    });
  }, [citas, fechaSidebarSeleccionada]);

  const citasFiltradasCompleto = vista === 'lista' ? citasPaginadas : citasFiltradas.filter(cita => {
    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // CORRECCIÓN: Agregamos ( || '') a todos los campos opcionales
      const matches = 
        (cita.pacienteNombre || '').toLowerCase().includes(query) ||
        (cita.medicoAsignado || '').toLowerCase().includes(query) ||
        (cita.especialidad || '').toLowerCase().includes(query) ||
        (cita.sucursalNombre || '').toLowerCase().includes(query) ||
        (cita.pacienteTelefono || '').toLowerCase().includes(query);
      if (!matches) return false;
    }
    // Filtro de doctores seleccionados
    if (selectedDoctores.length > 0) {
      const doctor = DOCTORES.find(d => d.nombre === cita.medicoAsignado);
      // Validación extra por si el doctor no se encuentra
      if (!doctor || !selectedDoctores.includes(doctor.id)) {
        return false;
      }
    }
    return true;
  });

  const estadisticas = {
    total: citasFiltradasCompleto.length,
    confirmadas: citasFiltradasCompleto.filter(c => c.estado === 'Confirmada').length,
    pendientes: citasFiltradasCompleto.filter(c => c.estado === 'Agendada').length,
    promociones: citasFiltradasCompleto.filter(c => c.esPromocion).length,
    saldoPendiente: citasFiltradasCompleto.reduce((acc, c) => acc + c.saldoPendiente, 0)
  };

  const fechasConCitas = Array.from(new Set(citas.map(c => new Date(c.fechaCita).toDateString())))
    .map(dateString => new Date(dateString));

  // --- RENDER ---
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📅 Agenda de Citas</h1>
            <p className="text-gray-500 mt-1">
            Gestión y calendario de citas médicas · {nombreSucursalActual}
            {selectedDoctores.length > 0 && (
              <span className="ml-1 text-amber-600 font-medium">· Filtro por doctor activo (solo se muestran citas de los doctores seleccionados)</span>
            )}
          </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowListaEspera(!showListaEspera)}>
              <Clock className="w-4 h-4 mr-2" /> Lista de espera
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowReportesOcupacion(true)}>
              <BarChart3 className="w-4 h-4 mr-2" /> Reportes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowGestionAusencias(true)}>
              <UserX className="w-4 h-4 mr-2" /> Ausencias
            </Button>
            <Button variant="primary" onClick={() => { setModalAgendarPacienteNombre(undefined); solicitudIdParaAsignarRef.current = null; setModalAgendarCita(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Cita
            </Button>
          </div>
        </div>

        {/* Filtros de sucursal/doctor - usa sucursales reales del API (UUID) */}
        {esAdmin && sucursales.length > 0 && (
          <CitasFilters
            sucursales={sucursales.map((s) => ({ id: s.id, nombre: s.nombre }))}
            medicos={DOCTORES.map((d) => d.nombre)}
            onFilterChange={setFilters}
          />
        )}

        {/* Selector de vista: Lista · Día · Semana · Mes */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Vista:</span>
          <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setVista('lista')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                vista === 'lista'
                  ? 'bg-white text-blue-600 shadow border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setVista('dia')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                vista === 'dia'
                  ? 'bg-white text-blue-600 shadow border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Día
            </button>
            <button
              type="button"
              onClick={() => setVista('semana')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                vista === 'semana'
                  ? 'bg-white text-blue-600 shadow border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVista('mes')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                vista === 'mes'
                  ? 'bg-white text-blue-600 shadow border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Mes
            </button>
          </div>
          <span className="text-sm text-gray-500 ml-2">
            {vista === 'lista' && 'Listado paginado de citas'}
            {vista === 'dia' && 'Vista por día'}
            {vista === 'semana' && 'Vista semanal'}
            {vista === 'mes' && 'Vista mensual'}
          </span>
        </div>

        <div className={`grid grid-cols-1 gap-6 ${vista === 'lista' ? 'lg:grid-cols-1' : 'lg:grid-cols-4'}`}>
          <div className={vista === 'lista' ? 'space-y-4' : 'lg:col-span-3 space-y-4'}>
             {/* Componentes principales */}
             {vista === 'lista' ? (
              <VistaLista
                citas={citasPaginadas}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onSelectCita={handleCitaClick}
                onUpdateNota={handleUpdateNota}
                searchQuery={searchQuery}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field) => {
                  if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  else { setSortField(field); setSortDirection('asc'); }
                  setPage(1);
                }}
                filterEstado={filterEstado}
                onFilterEstadoChange={(estado) => { setFilterEstado(estado); setPage(1); }}
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
          {vista !== 'lista' && (
            <div className="lg:col-span-1 space-y-4">
              <MiniCalendar selectedDate={fechaSeleccionada} onDateSelect={setFechaSeleccionada} highlightedDates={fechasConCitas} />
              <DoctorSelector selectedDoctores={selectedDoctores} onChange={setSelectedDoctores} multiSelect={true} fixedSucursal={esAdmin ? (nombreSucursalFiltro || undefined) : sucursalActual} />
            </div>
          )}
        </div>

        {/* Panel Lista de espera */}
        {showListaEspera && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Lista de espera (pendientes)</h2>
                <button type="button" onClick={() => setShowListaEspera(false)} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              {listaEspera.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay solicitudes pendientes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Nombre</th>
                        <th className="text-left py-2">Teléfono</th>
                        <th className="text-left py-2">Estado</th>
                        <th className="text-right py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaEspera.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="py-2">{s.nombreCompleto}</td>
                          <td className="py-2">{s.telefono}</td>
                          <td className="py-2">{s.estado}</td>
                          <td className="py-2 text-right">
                            <Button variant="secondary" size="sm" onClick={() => { solicitudIdParaAsignarRef.current = s.id; setModalAgendarPacienteNombre(s.nombreCompleto); setModalAgendarCita(true); }}>Asignar cita</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modales */}
        <CitaModal cita={citaSeleccionada} isOpen={modalAbierto} onClose={() => { setModalAbierto(false); setCitaSeleccionada(null); }} onConfirmar={handleConfirmar} onMarcarLlegada={handleMarcarLlegada} onCancelar={handleCancelar} />
        <AgendarCitaModal
          isOpen={modalAgendarCita}
          onClose={() => { setModalAgendarCita(false); setModalAgendarPacienteNombre(undefined); solicitudIdParaAsignarRef.current = null; }}
          pacienteNombre={modalAgendarPacienteNombre}
          onCitaCreada={() => {
            if (solicitudIdParaAsignarRef.current) cargarListaEspera();
          }}
        />
        {showGestionHorarios && <GestionHorarios onClose={() => setShowGestionHorarios(false)} />}
        {showGestionAusencias && <GestionAusencias onClose={() => setShowGestionAusencias(false)} />}
        {showReportesOcupacion && <ReportesOcupacion citas={citas} onClose={() => setShowReportesOcupacion(false)} />}
        {showDashboardDoctor && doctorIdSeleccionado && <DashboardDoctor doctorId={doctorIdSeleccionado} citas={citas} onClose={() => setShowDashboardDoctor(false)} onEditarHorario={() => { setShowDashboardDoctor(false); setShowGestionHorarios(true); }} onSolicitarAusencia={() => { setShowDashboardDoctor(false); setShowGestionAusencias(true); }} />}
        {showSidebarDia && fechaSidebarSeleccionada && <SidebarDiaDetalle fecha={fechaSidebarSeleccionada} citas={citasDiaSeleccionado} onClose={() => setShowSidebarDia(false)} onCitaClick={(cita) => { setCitaSeleccionada(cita); setModalAbierto(true); setShowSidebarDia(false); }} />}
      </div>
    </DashboardLayout>
  );
}