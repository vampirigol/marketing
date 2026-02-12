"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PacienteModal } from "../../components/pacientes/PacienteModal";
import { t, Locale } from "../../lib/i18n";
import { OfflineCache, useOnlineStatus } from "../../lib/offline-cache";
import HistorialClinicoModal from "../../components/historial/HistorialClinicoModal";
import RecetaModal from "../../components/recetas/RecetaModal";
import OrdenLaboratorioModal from "../../components/laboratorio/OrdenLaboratorioModal";
import RecetasListaModal from "../../components/recetas/RecetasListaModal";
import OrdenesLaboratorioListaModal from "../../components/laboratorio/OrdenesLaboratorioListaModal";
import NotificacionesBadge from "../../components/notificaciones/NotificacionesBadge";
import ExpedienteDigitalModal from "../../components/expediente/ExpedienteDigitalModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ==========================================
// 1. FUNCIONES AUXILIARES (Fuera del componente)
// ==========================================
const formatearFecha = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const sumarDias = (fecha: string, delta: number) => {
  const [yyyy, mm, dd] = fecha.split("-").map(Number);
  const base = new Date(yyyy, mm - 1, dd);
  base.setDate(base.getDate() + delta);
  return formatearFecha(base);
};

const rangoSemana = (fecha: string) => {
  const [yyyy, mm, dd] = fecha.split("-").map(Number);
  const base = new Date(yyyy, mm - 1, dd);
  const day = base.getDay();
  const start = new Date(base);
  start.setDate(base.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { inicio: formatearFecha(start), fin: formatearFecha(end) };
};

const rangoMes = (fecha: string) => {
  const [yyyy, mm] = fecha.split("-").map(Number);
  const start = new Date(yyyy, mm - 1, 1);
  const end = new Date(yyyy, mm, 0);
  return { inicio: formatearFecha(start), fin: formatearFecha(end) };
};

const formatearTitulo = (fecha: string) => {
  const [yyyy, mm, dd] = fecha.split("-").map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  try {
    const month = date.toLocaleString("es-MX", { month: "long" });
    return `${month.charAt(0).toUpperCase() + month.slice(1)}, ${date.getFullYear()}`;
  } catch (e) {
    return fecha;
  }
};

const obtenerSemana = (fecha: string) => {
  const [yyyy, mm, dd] = fecha.split("-").map(Number);
  const base = new Date(yyyy, mm - 1, dd);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const labels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label,
      day: String(date.getDate()).padStart(2, "0"),
      value: formatearFecha(date),
    };
  });
};

const obtenerMesConOffset = (fecha: string) => {
  const [yyyy, mm] = fecha.split("-").map(Number);
  const first = new Date(yyyy, mm - 1, 1);
  const last = new Date(yyyy, mm, 0);
  const startDay = first.getDay();
  const days: Array<{ label: string; value: string } | null> = [];
  for (let i = 0; i < startDay; i += 1) {
    days.push(null);
  }
  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = new Date(yyyy, mm - 1, day);
    days.push({ label: String(day), value: formatearFecha(date) });
  }
  return days;
};

const agruparPorFecha = (citas: CitaItem[]) =>
  citas.reduce<Record<string, CitaItem[]>>((acc, cita) => {
    const key = cita.fecha || "";
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cita);
    return acc;
  }, {});

const TabIcon = ({ id }: { id: TabId }) => {
  const icons: any = {
    inicio: <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />,
    agenda: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    citas: <><path d="M6 5h9l3 3v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /><path d="M8 12h8M8 16h5" /></>,
    pacientes: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    mensajes: <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />,
    perfil: <><circle cx="12" cy="8" r="3.5" /><path d="M6 20c1.8-3 10.2-3 12 0" /></>,
    config: <><circle cx="12" cy="12" r="3.5" /><path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4" /></>
  };

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[id] || null}
    </svg>
  );
};

// --- Tipos ---
type DoctorUser = {
  id: string;
  username: string;
  nombreCompleto?: string;
  rol: string;
  fotoUrl?: string;
};

type CitaItem = {
  id: string;
  pacienteId: string;
  horaCita: string;
  especialidad: string;
  estado: string;
  fecha?: string;
  fechaCita?: string;
  notas?: string;
  telemedicinaLink?: string;
  preconsulta?: {
    motivo?: string;
    sintomas?: string;
    notas?: string;
  };
  documentos?: Array<{ nombre?: string; url: string }>;
  pacienteNombre?: string;
  pacienteTelefono?: string;
};

type ConversacionResumen = {
  id: string;
  canal: string;
  nombreContacto: string;
  ultimoMensaje: string;
  fechaUltimoMensaje: string;
  mensajesNoLeidos: number;
};

type Mensaje = {
  id: string;
  contenido: string;
  tipo: string;
  esDeKeila: boolean;
  fechaHora: string;
};

type ConversacionDetalle = ConversacionResumen & {
  mensajes: Mensaje[];
};

type TabId = "inicio" | "agenda" | "citas" | "pacientes" | "mensajes" | "perfil" | "config";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "inicio", label: "Inicio" },
  { id: "agenda", label: "Agenda" },
  { id: "citas", label: "Citas" },
  { id: "pacientes", label: "Pacientes" },
  { id: "mensajes", label: "Mensajes" },
  { id: "perfil", label: "Perfil" },
  { id: "config", label: "Config" },
];

const especialidades = ['Medicina General', 'Pediatría', 'Ginecología', 'Cardiología'];
const estados = ['Activo', 'Inactivo', 'Pendiente'];

export default function DoctorPortalPage() {
  // ==========================================
  // 2. ESTADOS
  // ==========================================
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<DoctorUser | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("inicio");

  // --- Estados Agenda ---
  const [agendaMode, setAgendaMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [agendaFecha, setAgendaFecha] = useState(formatearFecha(new Date()));
  const [agendaCitas, setAgendaCitas] = useState<CitaItem[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [citasRango, setCitasRango] = useState<CitaItem[]>([]);
  const [citasRangoLoading, setCitasRangoLoading] = useState(false);
  const [accionLoading, setAccionLoading] = useState<string | null>(null);

  // --- Estados Acciones Citas ---
  const [reagendarCita, setReagendarCita] = useState<CitaItem | null>(null);
  const [reagendarFecha, setReagendarFecha] = useState("");
  const [reagendarHora, setReagendarHora] = useState("");
  const [reagendarMotivo, setReagendarMotivo] = useState("");
  const [notaCita, setNotaCita] = useState<CitaItem | null>(null);
  const [notaTexto, setNotaTexto] = useState("");
  const [telemedCita, setTelemedCita] = useState<CitaItem | null>(null);
  const [telemedLink, setTelemedLink] = useState("");
  const [telemedMotivo, setTelemedMotivo] = useState("");
  const [telemedSintomas, setTelemedSintomas] = useState("");
  const [telemedNotas, setTelemedNotas] = useState("");
  const [telemedDocs, setTelemedDocs] = useState("");

  // --- Estados Pacientes ---
  const [pacienteDetalle, setPacienteDetalle] = useState<any | null>(null);
  const [paginaPacientes, setPaginaPacientes] = useState(1);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busquedaPaciente, setBusquedaPaciente] = useState('');

  // --- Estados Perfil ---
  const [perfilPasswordActual, setPerfilPasswordActual] = useState("");
  const [perfilPasswordNuevo, setPerfilPasswordNuevo] = useState("");
  const [perfilPasswordConfirm, setPerfilPasswordConfirm] = useState("");
  const [perfilFotoUrl, setPerfilFotoUrl] = useState("");
  const [perfilMensaje, setPerfilMensaje] = useState<string | null>(null);

  // --- Estados Mensajes ---
  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<ConversacionDetalle | null>(null);
  const [mensajeDraft, setMensajeDraft] = useState("");
  const [mensajesLoading, setMensajesLoading] = useState(false);
  const [mensajesError, setMensajesError] = useState<string | null>(null);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");
  const [mensajeCanal, setMensajeCanal] = useState<"todos" | "whatsapp" | "facebook" | "instagram">("todos");

  // --- Estados Bloqueos ---
  const [bloqueos, setBloqueos] = useState<any[]>([]);
  const [bloqueoTipo, setBloqueoTipo] = useState<"fecha" | "semanal">("fecha");
  const [bloqueoCategoria, setBloqueoCategoria] = useState<"vacaciones" | "comida" | "urgencia" | "personal" | "otro">("personal");
  const [bloqueoFecha, setBloqueoFecha] = useState(formatearFecha(new Date()));
  const [bloqueoDia, setBloqueoDia] = useState(1);
  const [bloqueoInicio, setBloqueoInicio] = useState("");
  const [bloqueoFin, setBloqueoFin] = useState("");
  const [bloqueoMotivo, setBloqueoMotivo] = useState("");
  const [bloqueoError, setBloqueoError] = useState<string | null>(null);

  // --- Estados Configuración ---
  const [configNotificaciones, setConfigNotificaciones] = useState(true);
  const [configTema, setConfigTema] = useState<"claro" | "oscuro">("claro");
  const [configIdioma, setConfigIdioma] = useState<Locale>("es");
  const [configTamanoTexto, setConfigTamanoTexto] = useState<"pequeno" | "normal" | "grande">("normal");
  const [configAltoContraste, setConfigAltoContraste] = useState(false);
  const isOnline = useOnlineStatus();

  // --- Estados Métricas ---
  const [kpiDiario, setKpiDiario] = useState<any | null>(null);
  const [alertasSaturacion, setAlertasSaturacion] = useState<any[]>([]);
  const [kpiLoading, setKpiLoading] = useState(false);

  // --- Estados Modales Auxiliares ---
  const [historialPacienteId, setHistorialPacienteId] = useState<string | null>(null);
  const [historialPacienteNombre, setHistorialPacienteNombre] = useState<string>("");
  const [recetaPacienteId, setRecetaPacienteId] = useState<string | null>(null);
  const [recetaPacienteNombre, setRecetaPacienteNombre] = useState<string>("");
  const [ordenLabPacienteId, setOrdenLabPacienteId] = useState<string | null>(null);
  const [ordenLabPacienteNombre, setOrdenLabPacienteNombre] = useState<string>("");
  const [verRecetasPacienteId, setVerRecetasPacienteId] = useState<string | null>(null);
  const [verRecetasPacienteNombre, setVerRecetasPacienteNombre] = useState<string>("");
  const [verOrdenesPacienteId, setVerOrdenesPacienteId] = useState<string | null>(null);
  const [verOrdenesPacienteNombre, setVerOrdenesPacienteNombre] = useState<string>("");
  const [expedientePacienteId, setExpedientePacienteId] = useState<string | null>(null);

  // ==========================================
  // 3. LÓGICA DE NEGOCIO
  // ==========================================

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data?.error || "Credenciales invalidas.");
        return;
      }
      if (data?.usuario?.rol !== "Medico") {
        setError("Esta cuenta no tiene acceso a la vista de doctores.");
        return;
      }
      localStorage.setItem("doctor_auth_token", data.token);
      localStorage.setItem("doctor_auth_user", JSON.stringify(data.usuario));
      setToken(data.token);
      setUsuario(data.usuario);
    } catch {
      setError("No se pudo iniciar sesion. Verifica el backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctor_auth_token");
    localStorage.removeItem("doctor_auth_user");
    setToken(null);
    setUsuario(null);
    setUsername("");
    setPassword("");
    setAgendaCitas([]);
    setCitasRango([]);
    setActiveTab("inicio");
  };

  const cargarCitasRango = async (token: string, usuario: DoctorUser, agendaFecha: string) => {
    setCitasRangoLoading(true);
    try {
      const medico = encodeURIComponent(usuario.nombreCompleto || usuario.username);
      const rango = rangoSemana(agendaFecha);
      const response = await fetch(
        `${API_URL}/citas/doctor/rango?medico=${medico}&fechaInicio=${rango.inicio}&fechaFin=${rango.fin}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      setCitasRango((data?.citas || []) as CitaItem[]);
    } catch (e) {
      console.error("Error al cargar rango de citas:", e);
    }
    setCitasRangoLoading(false);
  };

  const cargarAgenda = async (
    authToken: string,
    user: DoctorUser,
    fechaActual: string,
    modo: "daily" | "weekly" | "monthly"
  ) => {
    const cacheKey = `${user.id}_${modo}_${fechaActual}`;

    if (!isOnline) {
      const cached = OfflineCache.get<CitaItem[]>("agenda", cacheKey);
      if (cached) {
        setAgendaCitas(cached);
        setAgendaError(t(configIdioma, "common.modoOffline"));
        return;
      }
      setAgendaError(t(configIdioma, "common.offline"));
      return;
    }

    try {
      setAgendaLoading(true);
      setAgendaError(null);
      const medico = encodeURIComponent(user.nombreCompleto || user.username);
      let url = `${API_URL}/citas/doctor?medico=${medico}&fecha=${fechaActual}`;
      if (modo === "weekly") {
        const rango = rangoSemana(fechaActual);
        url = `${API_URL}/citas/doctor/rango?medico=${medico}&fechaInicio=${rango.inicio}&fechaFin=${rango.fin}`;
      }
      if (modo === "monthly") {
        const rango = rangoMes(fechaActual);
        url = `${API_URL}/citas/doctor/rango?medico=${medico}&fechaInicio=${rango.inicio}&fechaFin=${rango.fin}`;
      }
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!resp.ok) {
        setAgendaError("No se pudieron cargar las citas.");
        const cached = OfflineCache.get<CitaItem[]>("agenda", cacheKey);
        if (cached) {
          setAgendaCitas(cached);
        }
        return;
      }
      const data = await resp.json();
      const citas = (data?.citas || []) as CitaItem[];
      setAgendaCitas(citas);
      OfflineCache.set("agenda", cacheKey, citas);
    } catch {
      setAgendaError("No se pudieron cargar las citas.");
      const cached = OfflineCache.get<CitaItem[]>("agenda", cacheKey);
      if (cached) {
        setAgendaCitas(cached);
      }
    } finally {
      setAgendaLoading(false);
    }
  };

  // --- AQUÍ ESTÁ LA FUNCIÓN CANCELAR CITA ---
  const cancelarCita = async (cita: CitaItem) => {
    if (!token) return;
    const motivo = window.prompt("Motivo de cancelación");
    if (!motivo) return;
    try {
      setAccionLoading(cita.id);
      const resp = await fetch(`${API_URL}/citas/${cita.id}/cancelar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motivo }),
      });
      if (!resp.ok) {
        setAgendaError("No se pudo cancelar la cita.");
        return;
      }
      if (usuario) {
        await cargarAgenda(token, usuario, agendaFecha, agendaMode);
        await cargarCitasRango(token, usuario, agendaFecha);
      }
    } catch {
      setAgendaError("No se pudo cancelar la cita.");
    } finally {
      setAccionLoading(null);
    }
  };

  const cargarConversaciones = async (authToken: string) => {
    try {
      setMensajesLoading(true);
      setMensajesError(null);
      const resp = await fetch(`${API_URL}/matrix/conversaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!resp.ok) {
        setMensajesError("No se pudieron cargar las conversaciones.");
        return;
      }
      const data = await resp.json();
      setConversaciones((data?.conversaciones || []) as ConversacionResumen[]);
    } catch {
      setMensajesError("No se pudieron cargar las conversaciones.");
    } finally {
      setMensajesLoading(false);
    }
  };

  const abrirConversacion = async (id: string) => {
    if (!token) return;
    try {
      setMensajesLoading(true);
      const resp = await fetch(`${API_URL}/matrix/conversaciones/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setMensajesError("No se pudo abrir la conversación.");
        return;
      }
      const data = await resp.json();
      setConversacionActiva(data?.conversacion as ConversacionDetalle);
      await fetch(`${API_URL}/matrix/conversaciones/${id}/leer`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    } catch {
      setMensajesError("No se pudo abrir la conversación.");
    } finally {
      setMensajesLoading(false);
    }
  };

  const enviarMensaje = async () => {
    if (!token || !conversacionActiva || !mensajeDraft.trim()) return;
    try {
      setMensajesLoading(true);
      const resp = await fetch(
        `${API_URL}/matrix/conversaciones/${conversacionActiva.id}/mensajes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contenido: mensajeDraft, tipo: "texto" }),
        }
      );
      if (!resp.ok) {
        setMensajesError("No se pudo enviar el mensaje.");
        return;
      }
      setMensajeDraft("");
      await abrirConversacion(conversacionActiva.id);
    } catch {
      setMensajesError("No se pudo enviar el mensaje.");
    } finally {
      setMensajesLoading(false);
    }
  };

  const cargarBloqueos = async () => {
    if (!token) return;
    try {
      setBloqueoError(null);
      const resp = await fetch(`${API_URL}/bloqueos-doctor`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setBloqueoError("No se pudieron cargar los bloqueos.");
        return;
      }
      const data = await resp.json();
      setBloqueos(data?.bloqueos || []);
    } catch {
      setBloqueoError("No se pudieron cargar los bloqueos.");
    }
  };

  const crearBloqueo = async () => {
    if (!token) return;
    try {
      setBloqueoError(null);
      const payload: any = {
        tipo: bloqueoTipo,
        categoria: bloqueoCategoria,
        motivo: bloqueoMotivo || undefined,
      };
      if (bloqueoTipo === "fecha") {
        payload.fecha = bloqueoFecha;
      } else {
        payload.diaSemana = bloqueoDia;
      }
      if (bloqueoInicio) payload.horaInicio = bloqueoInicio;
      if (bloqueoFin) payload.horaFin = bloqueoFin;
      const resp = await fetch(`${API_URL}/bloqueos-doctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        setBloqueoError("No se pudo crear el bloqueo.");
        return;
      }
      setBloqueoMotivo("");
      setBloqueoInicio("");
      setBloqueoFin("");
      await cargarBloqueos();
    } catch {
      setBloqueoError("No se pudo crear el bloqueo.");
    }
  };

  const eliminarBloqueo = async (id: string) => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_URL}/bloqueos-doctor/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        setBloqueoError("No se pudo eliminar el bloqueo.");
        return;
      }
      await cargarBloqueos();
    } catch {
      setBloqueoError("No se pudo eliminar el bloqueo.");
    }
  };

  const confirmarCita = async (cita: CitaItem) => {
    if (!token) return;
    try {
      setAccionLoading(cita.id);
      const resp = await fetch(`${API_URL}/citas/${cita.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: "Confirmada" }),
      });
      if (!resp.ok) {
        setAgendaError("No se pudo confirmar la cita.");
        return;
      }
      if (usuario) {
        await cargarAgenda(token, usuario, agendaFecha, agendaMode);
        await cargarCitasRango(token, usuario, agendaFecha);
      }
    } catch {
      setAgendaError("No se pudo confirmar la cita.");
    } finally {
      setAccionLoading(null);
    }
  };

  const abrirReagendar = (cita: CitaItem) => {
    setReagendarCita(cita);
    setReagendarFecha(cita.fecha || agendaFecha);
    setReagendarHora(cita.horaCita || "");
    setReagendarMotivo("");
  };

  const abrirNota = (cita: CitaItem) => {
    setNotaCita(cita);
    setNotaTexto(cita.notas || "");
  };

  const abrirTelemed = (cita: CitaItem) => {
    setTelemedCita(cita);
    setTelemedLink(cita.telemedicinaLink || "");
    setTelemedMotivo(cita.preconsulta?.motivo || "");
    setTelemedSintomas(cita.preconsulta?.sintomas || "");
    setTelemedNotas(cita.preconsulta?.notas || "");
    const docs = (cita.documentos || []).map((doc) => doc.url).join("\n");
    setTelemedDocs(docs);
  };

  const cargarKPIDiario = async () => {
    if (!token || !usuario) return;
    try {
      setKpiLoading(true);
      const resp = await fetch(
        `${API_URL}/metricas/kpi/diario?doctorId=${usuario.id}&fecha=${agendaFecha}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) {
        setKpiDiario(null);
        return;
      }
      const data = await resp.json();
      setKpiDiario(data.kpi || null);
    } catch {
      setKpiDiario(null);
    } finally {
      setKpiLoading(false);
    }
  };

  const cargarAlertasSaturacion = async () => {
    if (!token || !usuario) return;
    try {
      const resp = await fetch(
        `${API_URL}/metricas/saturacion?doctorId=${usuario.id}&fecha=${agendaFecha}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) {
        setAlertasSaturacion([]);
        return;
      }
      const data = await resp.json();
      setAlertasSaturacion(data.alertas || []);
    } catch {
      setAlertasSaturacion([]);
    }
  };

  const guardarNota = async () => {
    if (!token || !notaCita) return;
    try {
      setAccionLoading(notaCita.id);
      const resp = await fetch(`${API_URL}/citas/${notaCita.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notas: notaTexto }),
      });
      if (!resp.ok) {
        setAgendaError("No se pudo guardar la nota clínica.");
        return;
      }
      setNotaCita(null);
      if (usuario) {
        await cargarAgenda(token, usuario, agendaFecha, agendaMode);
        await cargarCitasRango(token, usuario, agendaFecha);
      }
    } catch {
      setAgendaError("No se pudo guardar la nota clínica.");
    } finally {
      setAccionLoading(null);
    }
  };

  const guardarTelemed = async () => {
    if (!token || !telemedCita) return;
    const documentos = telemedDocs
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
    try {
      setAccionLoading(telemedCita.id);
      const resp = await fetch(`${API_URL}/citas/${telemedCita.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telemedicinaLink: telemedLink || undefined,
          preconsulta: {
            motivo: telemedMotivo || undefined,
            sintomas: telemedSintomas || undefined,
            notas: telemedNotas || undefined,
          },
          documentos,
        }),
      });
      if (!resp.ok) {
        setAgendaError("No se pudo guardar la telemedicina.");
        return;
      }
      setTelemedCita(null);
      if (usuario) {
        await cargarAgenda(token, usuario, agendaFecha, agendaMode);
        await cargarCitasRango(token, usuario, agendaFecha);
      }
    } catch {
      setAgendaError("No se pudo guardar la telemedicina.");
    } finally {
      setAccionLoading(null);
    }
  };

  const enviarReagendar = async () => {
    if (!token || !reagendarCita) return;
    if (!reagendarFecha || !reagendarHora) {
      setAgendaError("Selecciona fecha y hora nuevas.");
      return;
    }
    try {
      setAccionLoading(reagendarCita.id);
      const resp = await fetch(`${API_URL}/citas/${reagendarCita.id}/reagendar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nuevaFecha: reagendarFecha,
          nuevaHora: reagendarHora,
          motivo: reagendarMotivo || "Reagendado por doctor",
        }),
      });
      if (!resp.ok) {
        setAgendaError("No se pudo reagendar la cita.");
        return;
      }
      setReagendarCita(null);
      if (usuario) {
        await cargarAgenda(token, usuario, agendaFecha, agendaMode);
        await cargarCitasRango(token, usuario, agendaFecha);
      }
    } catch {
      setAgendaError("No se pudo reagendar la cita.");
    } finally {
      setAccionLoading(null);
    }
  };

  const abrirPaciente = async (pacienteId?: string) => {
    if (!token || !pacienteId) return;
    try {
      setPacienteDetalle(null);
      const resp = await fetch(`${API_URL}/pacientes/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      setPacienteDetalle(data?.paciente || null);
    } catch (e) {
      console.error(e);
      setPacienteDetalle(null);
    }
  };

  const abrirHistorialClinico = (pacienteId: string, nombrePaciente: string) => {
    setHistorialPacienteId(pacienteId);
    setHistorialPacienteNombre(nombrePaciente);
  };

  const abrirReceta = (pacienteId: string, nombrePaciente: string, consultaId?: string) => {
    setRecetaPacienteId(pacienteId);
    setRecetaPacienteNombre(nombrePaciente);
  };

  const abrirOrdenLaboratorio = (pacienteId: string, nombrePaciente: string, consultaId?: string) => {
    setOrdenLabPacienteId(pacienteId);
    setOrdenLabPacienteNombre(nombrePaciente);
  };

  const verRecetasPaciente = (pacienteId: string, nombrePaciente: string) => {
    setVerRecetasPacienteId(pacienteId);
    setVerRecetasPacienteNombre(nombrePaciente);
  };

  const verOrdenesLaboratorio = (pacienteId: string, nombrePaciente: string) => {
    setVerOrdenesPacienteId(pacienteId);
    setVerOrdenesPacienteNombre(nombrePaciente);
  };

  const abrirExpedienteCompleto = (pacienteId: string) => {
    setExpedientePacienteId(pacienteId);
  };

  const actualizarPassword = async () => {
    if (!token) return;
    if (!perfilPasswordActual || !perfilPasswordNuevo || !perfilPasswordConfirm) {
      setPerfilMensaje("Completa todos los campos de contraseña.");
      return;
    }
    if (perfilPasswordNuevo !== perfilPasswordConfirm) {
      setPerfilMensaje("La nueva contraseña no coincide.");
      return;
    }
    try {
      setPerfilMensaje(null);
      const resp = await fetch(`${API_URL}/auth/cambiar-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passwordActual: perfilPasswordActual,
          passwordNuevo: perfilPasswordNuevo,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setPerfilMensaje(data?.error || "No se pudo cambiar la contraseña.");
        return;
      }
      setPerfilMensaje("Contraseña actualizada.");
      setPerfilPasswordActual("");
      setPerfilPasswordNuevo("");
      setPerfilPasswordConfirm("");
    } catch {
      setPerfilMensaje("No se pudo cambiar la contraseña.");
    }
  };

  const actualizarFoto = async () => {
    if (!token || !perfilFotoUrl) return;
    try {
      setPerfilMensaje(null);
      const resp = await fetch(`${API_URL}/auth/perfil/foto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fotoUrl: perfilFotoUrl }),
      });
      if (!resp.ok) {
        setPerfilMensaje("No se pudo actualizar la foto.");
        return;
      }
      setPerfilMensaje("Foto actualizada.");
      setUsuario((prev) => (prev ? { ...prev, fotoUrl: perfilFotoUrl } : prev));
      setPerfilFotoUrl("");
    } catch {
      setPerfilMensaje("No se pudo actualizar la foto.");
    }
  };

  // ==========================================
  // 4. EFECTOS
  // ==========================================
  useEffect(() => {
    const savedToken = localStorage.getItem("doctor_auth_token");
    const savedUser = localStorage.getItem("doctor_auth_user");
    const savedNotif = localStorage.getItem("doctor_config_notif");
    const savedTema = localStorage.getItem("doctor_config_tema");
    const savedIdioma = localStorage.getItem("doctor_config_idioma");
    const savedTamano = localStorage.getItem("doctor_config_tamano");
    const savedContraste = localStorage.getItem("doctor_config_contraste");

    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      try {
        setUsuario(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
        localStorage.removeItem("doctor_auth_user");
      }
    }
    if (savedNotif) {
      setConfigNotificaciones(savedNotif === "true");
    }
    if (savedTema === "oscuro" || savedTema === "claro") {
      setConfigTema(savedTema);
    }
    if (savedIdioma === "es" || savedIdioma === "en") {
      setConfigIdioma(savedIdioma);
    }
    if (savedTamano === "pequeno" || savedTamano === "normal" || savedTamano === "grande") {
      setConfigTamanoTexto(savedTamano);
    }
    if (savedContraste) {
      setConfigAltoContraste(savedContraste === "true");
    }

    if (savedToken && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        cargarCitasRango(savedToken, userObj, agendaFecha);
      } catch (e) {
        console.error("Error parsing saved user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!token || !usuario) return;
    if (activeTab !== "mensajes") return;
    void cargarConversaciones(token);
  }, [token, usuario, activeTab]);

  useEffect(() => {
    if (!token || !usuario) return;
    if (activeTab !== "config") return;
    void cargarBloqueos();
  }, [token, usuario, activeTab]);

  useEffect(() => {
    if (!token || !usuario) return;
    if (activeTab !== "inicio") return;
    void cargarKPIDiario();
    void cargarAlertasSaturacion();
  }, [token, usuario, activeTab, agendaFecha]);

  useEffect(() => {
    localStorage.setItem("doctor_config_tema", configTema);
    localStorage.setItem("doctor_config_idioma", configIdioma);
    localStorage.setItem("doctor_config_tamano", configTamanoTexto);
    localStorage.setItem("doctor_config_contraste", configAltoContraste.toString());

    if (configTema === "oscuro") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    document.documentElement.style.fontSize =
      configTamanoTexto === "pequeno" ? "14px" :
        configTamanoTexto === "grande" ? "18px" : "16px";

    if (configAltoContraste) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [configTema, configIdioma, configTamanoTexto, configAltoContraste]);

  useEffect(() => {
    localStorage.setItem(
      "doctor_config_notif",
      configNotificaciones ? "true" : "false"
    );
  }, [configNotificaciones]);

  // Escuchar cita agendada (desde CRM/Matrix) para refrescar agenda del doctor
  useEffect(() => {
    if (!token || !usuario) return;
    const refrescar = () => {
      cargarAgenda(token, usuario, agendaFecha, agendaMode);
      cargarCitasRango(token, usuario, agendaFecha);
    };
    const handleCitaAgendada = () => refrescar();
    window.addEventListener("citaAgendada", handleCitaAgendada);
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel("crm_citas");
      ch.onmessage = (e) => {
        if (e.data?.type === "citaAgendada") refrescar();
      };
    }
    return () => {
      window.removeEventListener("citaAgendada", handleCitaAgendada);
      ch?.close();
    };
  }, [token, usuario, agendaFecha, agendaMode]);

  // ==========================================
  // 5. MEMOS
  // ==========================================
  const nombreDoctor = useMemo(
    () => usuario?.nombreCompleto || usuario?.username || "Doctor",
    [usuario]
  );
  const agendaTitulo = useMemo(
    () => formatearTitulo(agendaFecha),
    [agendaFecha]
  );
  const resumenCitas = useMemo(() => agendaCitas.slice(0, 3), [agendaCitas]);
  const kpiDia = useMemo(() => {
    const total = agendaCitas.length;
    const confirmadas = agendaCitas.filter((c) => c.estado === "Confirmada").length;
    const atendidas = agendaCitas.filter((c) => c.estado === "Atendida").length;
    const canceladas = agendaCitas.filter((c) => c.estado === "Cancelada").length;
    return { total, confirmadas, atendidas, canceladas };
  }, [agendaCitas]);

  const pacientesResumen = useMemo(() => {
    const map = new Map<
      string,
      { id?: string; nombre: string; telefono?: string; especialidad?: string; estado?: string }
    >();
    citasRango.forEach((cita) => {
      if (!cita.pacienteNombre) return;
      if (!map.has(cita.pacienteNombre)) {
        map.set(cita.pacienteNombre, {
          id: cita.pacienteId,
          nombre: cita.pacienteNombre,
          telefono: cita.pacienteTelefono,
          especialidad: cita.especialidad,
          estado: 'Activo'
        });
      }
    });
    return Array.from(map.values());
  }, [citasRango]);

  const calendarioMes = useMemo(
    () => obtenerMesConOffset(agendaFecha),
    [agendaFecha]
  );
  const citasPorFecha = useMemo(() => agruparPorFecha(agendaCitas), [agendaCitas]);

  const conversacionesFiltradas = useMemo(() => {
    const term = mensajeBusqueda.trim().toLowerCase();
    return conversaciones.filter((conv) => {
      if (mensajeCanal !== "todos" && conv.canal !== mensajeCanal) return false;
      if (!term) return true;
      return (
        conv.nombreContacto?.toLowerCase().includes(term) ||
        conv.ultimoMensaje?.toLowerCase().includes(term)
      );
    });
  }, [conversaciones, mensajeBusqueda, mensajeCanal]);

  // ==========================================
  // 6. RENDER HELPERS
  // ==========================================
  const renderInicio = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Bienvenido
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{nombreDoctor}</h2>
            <p className="text-xs text-slate-500">{agendaTitulo}</p>
          </div>
          <div className="mt-3 space-y-2">
            {alertasSaturacion.slice(0, 3).map((alerta, idx) => (
              <div
                key={idx}
                className={`rounded-xl border px-3 py-2 ${alerta.nivel === 'critico'
                  ? 'border-rose-300 bg-rose-100'
                  : 'border-amber-300 bg-amber-100'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    {alerta.hora}
                  </span>
                  <span className="text-xs text-slate-700">
                    {alerta.citasSimultaneas} cita(s)
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-600">
                  Saturación: {alerta.porcentajeSaturacion}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {kpiLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
          Cargando métricas...
        </div>
      ) : kpiDiario ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700">Citas hoy</p>
              <p className="text-xl font-semibold text-blue-900">
                {kpiDiario.totalCitas}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">Atendidas</p>
              <p className="text-xl font-semibold text-emerald-900">
                {kpiDiario.citasAtendidas}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] text-slate-400">Confirmadas</p>
              <p className="text-sm font-semibold text-slate-800">
                {kpiDiario.citasConfirmadas}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] text-slate-400">Canceladas</p>
              <p className="text-sm font-semibold text-rose-700">
                {kpiDiario.citasCanceladas}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] text-slate-400">No-show</p>
              <p className="text-sm font-semibold text-amber-700">
                {kpiDiario.citasNoShow}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] text-slate-400">Pendientes</p>
              <p className="text-sm font-semibold text-blue-700">
                {kpiDiario.citasPendientes}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-purple-50 px-4 py-3">
              <p className="text-xs text-purple-700">Tiempo promedio</p>
              <p className="text-lg font-semibold text-purple-900">
                {kpiDiario.tiempoPromedioMinutos} min
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-indigo-50 px-4 py-3">
              <p className="text-xs text-indigo-700">Tasa atención</p>
              <p className="text-lg font-semibold text-indigo-900">
                {kpiDiario.tasaAtencion}%
              </p>
            </div>
          </div>
        </>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Próximas citas</h3>
          <button
            onClick={() => setActiveTab("agenda")}
            className="text-xs font-semibold text-blue-600"
          >
            Ver agenda
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {agendaLoading ? (
            <p className="text-xs text-slate-400">Cargando...</p>
          ) : agendaCitas.length === 0 ? (
            <p className="text-xs text-slate-400">Sin citas próximas.</p>
          ) : (
            agendaCitas.slice(0, 5).map((cita) => (
              <div
                key={cita.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                <span className="font-semibold text-slate-700">{cita.horaCita}</span>
                <span className="text-slate-500">
                  {cita.pacienteNombre || "Paciente"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <button
          onClick={() => setAgendaFecha(sumarDias(agendaFecha, -1))}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
        >
          ◀
        </button>
        <span className="font-semibold text-slate-700">{agendaFecha}</span>
        <button
          onClick={() => setAgendaFecha(sumarDias(agendaFecha, 1))}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
        >
          ▶
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { id: "daily", label: "Diario" },
          { id: "weekly", label: "Semanal" },
          { id: "monthly", label: "Mensual" },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setAgendaMode(mode.id as typeof agendaMode)}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${agendaMode === mode.id
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-600"
              }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <button
        onClick={() =>
          token && usuario && cargarAgenda(token, usuario, agendaFecha, agendaMode)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
      >
        {agendaLoading ? "Actualizando..." : "Actualizar"}
      </button>

      {agendaError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {agendaError}
        </div>
      ) : null}

      {agendaMode === "daily" ? (
        <div className="space-y-3">
          {agendaLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cargando citas...
            </div>
          ) : agendaCitas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Sin citas para este día.
            </div>
          ) : (
            agendaCitas.map((cita) => (
              <div
                key={cita.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-700">
                    {cita.horaCita}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    {cita.estado}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {cita.pacienteNombre || "Paciente"}
                </p>
                <p className="text-xs text-slate-500">{cita.especialidad}</p>
                {cita.telemedicinaLink ||
                  cita.preconsulta?.motivo ||
                  cita.preconsulta?.sintomas ||
                  (cita.documentos && cita.documentos.length > 0) ? (
                  <p className="text-[11px] font-semibold text-teal-700">
                    {cita.telemedicinaLink ? "Telemedicina" : "Preconsulta"}
                    {cita.documentos && cita.documentos.length > 0
                      ? ` · Docs: ${cita.documentos.length}`
                      : ""}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => abrirPaciente(cita.pacienteId)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500"
                  >
                    Ver paciente
                  </button>
                  <button
                    onClick={() => abrirHistorialClinico(cita.pacienteId, cita.pacienteNombre || "Paciente")}
                    className="flex-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-[11px] font-semibold text-purple-700"
                  >
                    📋 Historial
                  </button>
                  <button
                    onClick={() => abrirNota(cita)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500"
                  >
                    Nota clínica
                  </button>
                  <button
                    onClick={() => abrirTelemed(cita)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500"
                  >
                    Telemedicina
                  </button>
                  <button
                    onClick={() => confirmarCita(cita)}
                    disabled={accionLoading === cita.id}
                    className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => abrirReagendar(cita)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500"
                  >
                    Reagendar
                  </button>
                  <button
                    onClick={() => cancelarCita(cita)}
                    disabled={accionLoading === cita.id}
                    className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {agendaMode === "weekly" ? (
        <div className="space-y-3">
          {obtenerSemana(agendaFecha).map((dia) => {
            const citasDia = citasPorFecha[dia.value] || [];
            return (
              <div
                key={dia.value}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    {dia.label} {dia.day}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    {citasDia.length}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {citasDia.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin citas</p>
                  ) : (
                    citasDia.slice(0, 3).map((cita) => (
                      <div
                        key={cita.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-slate-700">
                          {cita.horaCita}
                        </span>
                        <span className="text-slate-500">
                          {cita.pacienteNombre || "Paciente"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {agendaMode === "monthly" ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            {["D", "L", "M", "M", "J", "V", "S"].map((label) => (
              <span key={label} className="w-8 text-center">
                {label}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {calendarioMes.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-10 w-8" />;
              }
              const count = citasPorFecha[day.value]?.length || 0;
              return (
                <div
                  key={day.value}
                  className="relative flex h-10 w-8 items-center justify-center rounded-lg border border-slate-200 text-xs text-slate-700"
                >
                  {day.label}
                  {count > 0 ? (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">
                      {count}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {reagendarCita ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">Reagendar cita</p>
          <p className="text-xs text-slate-500">
            {reagendarCita.pacienteNombre || "Paciente"} · {reagendarCita.horaCita}
          </p>
          <div className="mt-3 space-y-2">
            <input
              type="date"
              value={reagendarFecha}
              onChange={(event) => setReagendarFecha(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            />
            <input
              type="time"
              value={reagendarHora}
              onChange={(event) => setReagendarHora(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            />
            <input
              value={reagendarMotivo}
              onChange={(event) => setReagendarMotivo(event.target.value)}
              placeholder="Motivo"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setReagendarCita(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500"
            >
              Cancelar
            </button>
            <button
              onClick={enviarReagendar}
              disabled={accionLoading === reagendarCita.id}
              className="flex-1 rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      {notaCita ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">Nota clínica</p>
          <p className="text-xs text-slate-500">
            {notaCita.pacienteNombre || "Paciente"} · {notaCita.horaCita}
          </p>
          <textarea
            value={notaTexto}
            onChange={(event) => setNotaTexto(event.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            rows={4}
            placeholder="Escribe la nota clínica..."
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setNotaCita(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500"
            >
              Cancelar
            </button>
            <button
              onClick={guardarNota}
              disabled={accionLoading === notaCita.id}
              className="flex-1 rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      {telemedCita ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">Telemedicina</p>
          <p className="text-xs text-slate-500">
            {telemedCita.pacienteNombre || "Paciente"} · {telemedCita.horaCita}
          </p>
          <input
            value={telemedLink}
            onChange={(event) => setTelemedLink(event.target.value)}
            placeholder="Link de videollamada"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
          />
          <input
            value={telemedMotivo}
            onChange={(event) => setTelemedMotivo(event.target.value)}
            placeholder="Motivo"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
          />
          <textarea
            value={telemedSintomas}
            onChange={(event) => setTelemedSintomas(event.target.value)}
            placeholder="Síntomas"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            rows={3}
          />
          <textarea
            value={telemedNotas}
            onChange={(event) => setTelemedNotas(event.target.value)}
            placeholder="Notas preconsulta"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            rows={2}
          />
          <textarea
            value={telemedDocs}
            onChange={(event) => setTelemedDocs(event.target.value)}
            placeholder="Documentos (URLs, uno por línea)"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            rows={3}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setTelemedCita(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500"
            >
              Cancelar
            </button>
            <button
              onClick={guardarTelemed}
              disabled={accionLoading === telemedCita.id}
              className="flex-1 rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderCitas = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        Citas de la semana
      </div>
      {citasRangoLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Cargando citas...
        </div>
      ) : citasRango.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Sin citas programadas.
        </div>
      ) : (
        citasRango.map((cita) => (
          <div
            key={cita.id}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{cita.fecha || agendaFecha}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {cita.pacienteNombre || "Paciente"}
                </p>
                <p className="text-xs text-slate-500">{cita.especialidad}</p>
                {cita.telemedicinaLink ||
                  cita.preconsulta?.motivo ||
                  cita.preconsulta?.sintomas ||
                  (cita.documentos && cita.documentos.length > 0) ? (
                  <p className="text-[11px] font-semibold text-teal-700">
                    {cita.telemedicinaLink ? "Telemedicina" : "Preconsulta"}
                    {cita.documentos && cita.documentos.length > 0
                      ? ` · Docs: ${cita.documentos.length}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                {cita.horaCita}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => abrirExpedienteCompleto(cita.pacienteId)}
                className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 text-xs font-semibold text-blue-700"
              >
                📋 Expediente
              </button>
              <button
                onClick={() => abrirHistorialClinico(cita.pacienteId, cita.pacienteNombre || "Paciente")}
                className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700"
              >
                Consultas
              </button>
              <button
                onClick={() => abrirReceta(cita.pacienteId, cita.pacienteNombre || "Paciente", cita.id)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              >
                💊 Receta
              </button>
              <button
                onClick={() => abrirOrdenLaboratorio(cita.pacienteId, cita.pacienteNombre || "Paciente", cita.id)}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700"
              >
                🔬 Estudios
              </button>
              <button
                onClick={() => abrirNota(cita)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500"
              >
                Nota
              </button>
              <button
                onClick={() => abrirTelemed(cita)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500"
              >
                Telemed
              </button>
              <button
                onClick={() => confirmarCita(cita)}
                disabled={accionLoading === cita.id}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              >
                Confirmar
              </button>
              <button
                onClick={() => abrirReagendar(cita)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500"
              >
                Reagendar
              </button>
              <button
                onClick={() => cancelarCita(cita)}
                disabled={accionLoading === cita.id}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPacientes = () => {
    const pacientesFiltrados = pacientesResumen.filter((p) => {
      let match = true;
      if (filtroEspecialidad) match = match && (p.especialidad === filtroEspecialidad);
      if (filtroEstado) match = match && (p.estado === filtroEstado);
      if (busquedaPaciente.trim()) {
        const term = busquedaPaciente.trim().toLowerCase();
        const nombreIncluye = p.nombre?.toLowerCase().includes(term) || false;
        const telefonoIncluye = p.telefono?.toLowerCase().includes(term) || false;
        match = match && (nombreIncluye || telefonoIncluye);
      }
      return match;
    });

    const pacientesPorPagina = 10;
    const totalPaginas = Math.ceil(pacientesFiltrados.length / pacientesPorPagina);
    const pacientesPaginados = pacientesFiltrados.slice(
      (paginaPacientes - 1) * pacientesPorPagina,
      paginaPacientes * pacientesPorPagina
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Pacientes recientes</span>
            <button
              onClick={() => setPacienteDetalle({})}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
            >
              + Nuevo Paciente
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={busquedaPaciente}
              onChange={e => { setBusquedaPaciente(e.target.value); setPaginaPacientes(1); }}
              placeholder="Buscar paciente por nombre o teléfono"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            />
            <select
              value={filtroEspecialidad}
              onChange={e => { setFiltroEspecialidad(e.target.value); setPaginaPacientes(1); }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map(es => (
                <option key={es} value={es}>{es}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={e => { setFiltroEstado(e.target.value); setPaginaPacientes(1); }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            >
              <option value="">Todos los estados</option>
              {estados.map(es => (
                <option key={es} value={es}>{es}</option>
              ))}
            </select>
          </div>
        </div>

        {citasRangoLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Cargando pacientes...
          </div>
        ) : pacientesResumen.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Sin pacientes recientes.
          </div>
        ) : (
          <>
            {pacientesPaginados.map((paciente) => (
              <div
                key={paciente.nombre}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">{paciente.nombre}</p>
                <p className="text-xs text-slate-500">
                  {paciente.telefono || "Teléfono no disponible"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => abrirExpedienteCompleto(paciente.id!)}
                    className="flex-1 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 text-[11px] font-semibold text-blue-700"
                  >
                    📋 Expediente
                  </button>
                  <button
                    onClick={() => verRecetasPaciente(paciente.id!, paciente.nombre)}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-[11px] font-semibold text-emerald-700"
                  >
                    💊
                  </button>
                  <button
                    onClick={() => verOrdenesLaboratorio(paciente.id!, paciente.nombre)}
                    className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-[11px] font-semibold text-cyan-700"
                  >
                    🔬
                  </button>
                  <button
                    onClick={() => setPacienteDetalle(paciente)}
                    className="rounded-xl border border-yellow-200 bg-yellow-50 px-2 py-2 text-[11px] font-semibold text-yellow-700"
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPaginaPacientes((p) => Math.max(1, p - 1))}
                disabled={paginaPacientes === 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-slate-700">
                Página {paginaPacientes} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaPacientes((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaPacientes === totalPaginas}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {/* Modal para Crear/Editar Paciente */}
        {pacienteDetalle && (
          <PacienteModal
            isOpen={!!pacienteDetalle}
            onClose={() => setPacienteDetalle(null)}
            paciente={pacienteDetalle && pacienteDetalle.id ? pacienteDetalle : undefined}
            onSave={async (data: any) => {
              if (!token) return;
              try {
                let resp;
                if (pacienteDetalle && pacienteDetalle.id) {
                  // Edición
                  resp = await fetch(`${API_URL}/pacientes/${pacienteDetalle.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                  });
                } else {
                  // Creación
                  resp = await fetch(`${API_URL}/pacientes`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                  });
                }
                if (resp.ok) {
                  setPacienteDetalle(null);
                  // Recargar pacientes
                  if (usuario) await cargarCitasRango(token, usuario, agendaFecha);
                }
              } catch (error) {
                console.error(error);
              }
            }}
          />
        )}
      </div>
    );
  };

  const renderMensajes = () => (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          value={mensajeBusqueda}
          onChange={(event) => setMensajeBusqueda(event.target.value)}
          placeholder="Buscar conversación..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
        />
      </div>

      {/* Lista de conversaciones */}
      <div className="space-y-2">
        {mensajesLoading ? (
          <p className="text-xs text-slate-400 text-center">Cargando mensajes...</p>
        ) : conversacionesFiltradas.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">No hay conversaciones.</p>
        ) : !conversacionActiva ? (
          conversacionesFiltradas.map((conv) => (
            <button
              key={conv.id}
              onClick={() => abrirConversacion(conv.id)}
              className="w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  {conv.nombreContacto}
                </span>
                {conv.mensajesNoLeidos > 0 ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {conv.mensajesNoLeidos}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                {conv.ultimoMensaje}
              </p>
            </button>
          ))
        ) : (
          /* Vista de Chat Activo */
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 h-[500px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <p className="text-sm font-semibold text-slate-900">
                {conversacionActiva.nombreContacto}
              </p>
              <button
                onClick={() => setConversacionActiva(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Volver
              </button>
            </div>

            {/* Lista de mensajes del chat */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {conversacionActiva.mensajes?.length ? (
                conversacionActiva.mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.esDeKeila ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${msg.esDeKeila
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-slate-100 text-slate-700 rounded-bl-none"
                        }`}
                    >
                      {msg.contenido}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center mt-4">Sin mensajes aún.</p>
              )}
            </div>

            {/* Input para enviar mensaje */}
            <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
              <input
                value={mensajeDraft}
                onChange={(event) => setMensajeDraft(event.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
              />
              <button
                onClick={enviarMensaje}
                disabled={mensajesLoading || !mensajeDraft.trim()}
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Perfil</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">{nombreDoctor}</h2>
        <p className="text-xs text-slate-500">Usuario: {usuario?.username}</p>
        <p className="text-xs text-slate-500">Rol: {usuario?.rol}</p>
        {usuario?.fotoUrl ? (
          <Image
            src={usuario.fotoUrl}
            alt="Foto perfil"
            width={64}
            height={64}
            className="mt-3 h-16 w-16 rounded-full border border-slate-200 object-cover"
            unoptimized
          />
        ) : null}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold text-slate-600">Actualizar foto (URL)</p>
        <input
          value={perfilFotoUrl}
          onChange={(event) => setPerfilFotoUrl(event.target.value)}
          placeholder="https://..."
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
        />
        <button
          onClick={actualizarFoto}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Guardar foto
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold text-slate-600">Cambiar contraseña</p>
        <input
          type="password"
          value={perfilPasswordActual}
          onChange={(event) => setPerfilPasswordActual(event.target.value)}
          placeholder="Actual"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
        />
        <input
          type="password"
          value={perfilPasswordNuevo}
          onChange={(event) => setPerfilPasswordNuevo(event.target.value)}
          placeholder="Nueva"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
        />
        <input
          type="password"
          value={perfilPasswordConfirm}
          onChange={(event) => setPerfilPasswordConfirm(event.target.value)}
          placeholder="Confirmar"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
        />
        <button
          onClick={actualizarPassword}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Actualizar contraseña
        </button>
        {perfilMensaje ? (
          <p className="mt-2 text-xs text-slate-500">{perfilMensaje}</p>
        ) : null}
      </div>
      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600"
      >
        Cerrar sesión
      </button>
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Preferencias</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-700">Notificaciones</span>
          <button
            onClick={() => setConfigNotificaciones((prev) => !prev)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${configNotificaciones
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
              }`}
          >
            {configNotificaciones ? "Activadas" : "Desactivadas"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-700">{t(configIdioma, "config.tema")}</span>
          <div className="flex gap-2">
            {["claro", "oscuro"].map((tema) => (
              <button
                key={tema}
                onClick={() => setConfigTema(tema as "claro" | "oscuro")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${configTema === tema
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400"
                  }`}
              >
                {t(configIdioma, `config.${tema}` as any)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-700">{t(configIdioma, "config.idioma")}</span>
          <div className="flex gap-2">
            {(["es", "en"] as Locale[]).map((idioma) => (
              <button
                key={idioma}
                onClick={() => setConfigIdioma(idioma)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${configIdioma === idioma
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400"
                  }`}
              >
                {idioma.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-700">{t(configIdioma, "config.tamanoTexto")}</span>
          <div className="flex gap-2">
            {["pequeno", "normal", "grande"].map((tamano) => (
              <button
                key={tamano}
                onClick={() => setConfigTamanoTexto(tamano as "pequeno" | "normal" | "grande")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${configTamanoTexto === tamano
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400"
                  }`}
              >
                {t(configIdioma, `config.${tamano}` as any)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-700">{t(configIdioma, "config.altoContraste")}</span>
          <button
            onClick={() => setConfigAltoContraste((prev) => !prev)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${configAltoContraste
              ? "bg-yellow-600 text-white"
              : "bg-slate-100 text-slate-400"
              }`}
          >
            {configAltoContraste ? "Activado" : "Desactivado"}
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-400">
        Guardado local en este navegador.
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
          Bloqueos de agenda
        </p>
        <div className="mt-3 grid gap-2">
          <select
            value={bloqueoTipo}
            onChange={(event) => setBloqueoTipo(event.target.value as "fecha" | "semanal")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            <option value="fecha">Fecha específica</option>
            <option value="semanal">Semanal</option>
          </select>
          <select
            value={bloqueoCategoria}
            onChange={(event) =>
              setBloqueoCategoria(
                event.target.value as "vacaciones" | "comida" | "urgencia" | "personal" | "otro"
              )
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            <option value="personal">Personal</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="comida">Comida</option>
            <option value="urgencia">Urgencia</option>
            <option value="otro">Otro</option>
          </select>
          {bloqueoTipo === "fecha" ? (
            <input
              type="date"
              value={bloqueoFecha}
              onChange={(event) => setBloqueoFecha(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            />
          ) : (
            <select
              value={bloqueoDia}
              onChange={(event) => setBloqueoDia(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
            >
              {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((dia, idx) => (
                <option key={dia} value={idx}>
                  {dia}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={bloqueoInicio}
              onChange={(event) => setBloqueoInicio(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
              placeholder="Inicio"
            />
            <input
              type="time"
              value={bloqueoFin}
              onChange={(event) => setBloqueoFin(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
              placeholder="Fin"
            />
          </div>
          <input
            value={bloqueoMotivo}
            onChange={(event) => setBloqueoMotivo(event.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700"
          />
          <button
            onClick={crearBloqueo}
            className="w-full rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
          >
            Guardar bloqueo
          </button>
        </div>
        {bloqueoError ? (
          <p className="mt-2 text-xs text-rose-500">{bloqueoError}</p>
        ) : null}
        <div className="mt-4 space-y-2">
          {bloqueos.length === 0 ? (
            <p className="text-xs text-slate-400">Sin bloqueos registrados.</p>
          ) : (
            bloqueos.map((bloqueo) => {
              const categoriaColors = {
                vacaciones: "bg-purple-100 text-purple-700 border-purple-200",
                comida: "bg-amber-100 text-amber-700 border-amber-200",
                urgencia: "bg-rose-100 text-rose-700 border-rose-200",
                personal: "bg-blue-100 text-blue-700 border-blue-200",
                otro: "bg-slate-100 text-slate-700 border-slate-200",
              };
              const categoria = bloqueo.categoria || "personal";
              return (
                <div
                  key={bloqueo.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-700">
                        {bloqueo.tipo === "fecha"
                          ? bloqueo.fecha
                          : `Semanal ${["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"][bloqueo.diaSemana || 0]}`}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoriaColors[categoria as keyof typeof categoriaColors]
                          }`}
                      >
                        {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                      </span>
                    </div>
                    <p className="text-slate-500">
                      {bloqueo.horaInicio || "00:00"} - {bloqueo.horaFin || "24:00"}
                    </p>
                    {bloqueo.motivo ? (
                      <p className="mt-1 text-slate-400">{bloqueo.motivo}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => eliminarBloqueo(bloqueo.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        return renderInicio();
      case "agenda":
        return renderAgenda();
      case "citas":
        return renderCitas();
      case "pacientes":
        return renderPacientes();
      case "mensajes":
        return renderMensajes();
      case "perfil":
        return renderPerfil();
      case "config":
        return renderConfig();
      default:
        return null;
    }
  };

  const themeClasses = configTema === "oscuro"
    ? "dark bg-slate-900"
    : "bg-gradient-to-br from-slate-50 via-white to-blue-50";
  const contrastClasses = configAltoContraste ? "high-contrast" : "";

  // ==========================================
  // 7. RENDERIZADO PRINCIPAL
  // ==========================================

  // Si no hay token, mostrar pantalla de LOGIN
  if (!token || !usuario) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <Image src="/logo-clinicas.png" alt="Logo" width={64} height={64} className="mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-blue-700">PERFIL Agenda</h2>
          <p className="text-sm text-gray-500 mb-6">Inicia sesión como doctor</p>
          <form
            className="w-full flex flex-col gap-4"
            onSubmit={handleLogin}
          >
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 mt-2 transition"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
          <button
            className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg px-4 py-2 transition"
            onClick={() => window.location.href = "/"}
          >
            Volver a Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-12 ${themeClasses} ${contrastClasses}`}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
        <div className={`flex items-center gap-4 rounded-2xl border px-6 py-4 shadow-sm backdrop-blur ${configTema === "oscuro"
          ? "border-slate-700 bg-slate-800/80"
          : "border-slate-200/70 bg-white/80"
          }`}>
          <Image src="/logo-clinicas.png" alt="Clínicas Adventistas" width={48} height={48} className="h-12 w-12" />
          <div className="flex-1">
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${configTema === "oscuro" ? "text-slate-400" : "text-slate-500"
              }`}>
              {t(configIdioma, "nav.perfil")}
            </p>
            <h1 className={`text-2xl font-semibold ${configTema === "oscuro" ? "text-white" : "text-slate-900"
              }`}>
              {t(configIdioma, "nav.agenda")}
            </h1>
          </div>
          {!isOnline ? (
            <div className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[10px] font-semibold text-amber-700">
              {t(configIdioma, "common.offline")}
            </div>
          ) : null}
        </div>

        <div className={`w-full max-w-[430px] overflow-hidden rounded-[32px] border shadow-xl ${configTema === "oscuro"
          ? "border-slate-700 bg-slate-800"
          : "border-slate-200/70 bg-white"
          }`}>
          <>
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                Doctor
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{nombreDoctor}</p>
                  <p className="text-xs text-slate-500">{agendaTitulo}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
                >
                  Salir
                </button>
              </div>
            </div>

            <div className="h-[520px] overflow-y-auto px-5 py-4">
              {renderContent()}
              {pacienteDetalle && !pacienteDetalle.id && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {pacienteDetalle.nombreCompleto || "Paciente"}
                    </p>
                    <button
                      onClick={() => setPacienteDetalle(null)}
                      className="text-xs font-semibold text-slate-400"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Teléfono: {pacienteDetalle.telefono || "No disponible"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Email: {pacienteDetalle.email || "No disponible"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Afiliación: {pacienteDetalle.noAfiliacion || "No disponible"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold ${activeTab === tab.id
                    ? "text-blue-600"
                    : "text-slate-400"
                    }`}
                >
                  <span className="text-base">
                    <TabIcon id={tab.id} />
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        </div>
      </div>

      {/* Modales Auxiliares */}
      {historialPacienteId && token && (
        <HistorialClinicoModal
          pacienteId={historialPacienteId}
          pacienteNombre={historialPacienteNombre}
          token={token as string}
          onClose={() => setHistorialPacienteId(null)}
        />
      )}

      {recetaPacienteId && token && (
        <RecetaModal
          pacienteId={recetaPacienteId}
          pacienteNombre={recetaPacienteNombre}
          token={token as string}
          doctorNombre={nombreDoctor}
          onClose={() => setRecetaPacienteId(null)}
          onCreada={() => alert("Receta creada correctamente")}
        />
      )}

      {ordenLabPacienteId && token && (
        <OrdenLaboratorioModal
          pacienteId={ordenLabPacienteId}
          pacienteNombre={ordenLabPacienteNombre}
          token={token as string}
          doctorNombre={nombreDoctor}
          onClose={() => setOrdenLabPacienteId(null)}
          onCreada={() => alert("Orden de laboratorio creada")}
        />
      )}

      {verRecetasPacienteId && token && (
        <RecetasListaModal
          pacienteId={verRecetasPacienteId}
          pacienteNombre={verRecetasPacienteNombre}
          token={token as string}
          onClose={() => setVerRecetasPacienteId(null)}
        />
      )}

      {verOrdenesPacienteId && token && (
        <OrdenesLaboratorioListaModal
          pacienteId={verOrdenesPacienteId}
          pacienteNombre={verOrdenesPacienteNombre}
          token={token as string}
          onClose={() => setVerOrdenesPacienteId(null)}
        />
      )}

      {expedientePacienteId && token && (
        <ExpedienteDigitalModal
          pacienteId={expedientePacienteId}
          token={token as string}
          onClose={() => setExpedientePacienteId(null)}
        />
      )}
    </div>
  );
}