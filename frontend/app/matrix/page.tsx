'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import MatrixWebSocketService from '@/lib/matrix-websocket.service';
import { MatrixInbox } from '@/components/matrix/MatrixInbox';
import { ConversationView } from '@/components/matrix/ConversationView';
import { PatientProfile } from '@/components/matrix/PatientProfile';
import { ChatDetailsPanel } from '@/components/matrix/ChatDetailsPanel';
import { AgendarCitaModal } from '@/components/matrix/AgendarCitaModal';
import { MatrixKanbanView } from '@/components/matrix/MatrixKanbanView';
import { Conversacion, Mensaje, Lead, LeadStatus } from '@/types/matrix';
import { AlertCircle, LayoutGrid, MessageSquare, Search, Settings, Moon, Sun } from 'lucide-react';
import { api } from '@/lib/api';
import contactosService from '@/lib/contactos.service';
import { obtenerLeadsCitasLocales } from '@/lib/citas-leads.service';
import type { SolicitudContacto } from '@/types/contacto';
import { guardarCanalesConectados } from '@/components/matrix/RedesSocialesModal';


export default function MatrixPage() {
  return (
    <Suspense fallback={<div>Cargando Matrix...</div>}>
      <SearchParamsWrapper>
        {(searchParams) => <MatrixPageContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}

function SearchParamsWrapper({ children }: { children: (searchParams: ReturnType<typeof useSearchParams>) => JSX.Element }) {
  const searchParams = useSearchParams();
  return children(searchParams);
}

function MatrixPageContent({ searchParams }: { searchParams: ReturnType<typeof useSearchParams> }) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<string | undefined>();
  const [vistaActual, setVistaActual] = useState<'inbox' | 'kanban'>('inbox');
  const [darkMode, setDarkMode] = useState(false);
  const [agendarCitaOpen, setAgendarCitaOpen] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState('');
  const [colaPendiente, setColaPendiente] = useState<SolicitudContacto[]>([]);
  const [colaVencida, setColaVencida] = useState<SolicitudContacto[]>([]);
  const [cargandoCola, setCargandoCola] = useState(false);
  const [leadsFuente, setLeadsFuente] = useState<Lead[]>([]);
  const [estadisticasContactos, setEstadisticasContactos] = useState<{
    total: number;
    pendientes: number;
    asignadas: number;
    enContacto: number;
    resueltas: number;
    canceladas: number;
    tiempoPromedioResolucion: number;
  } | null>(null);

  // Si volvió de OAuth con facebook_conectado=1, marcar Facebook como conectado
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fb = searchParams.get('facebook_conectado');
    const ig = searchParams.get('instagram_conectado');
    if (fb === '1' || ig === '1') {
      try {
        const raw = localStorage.getItem('keila.canalesConectados');
        const prev = raw ? JSON.parse(raw) : {};
        const next = { ...prev, facebook: fb === '1' || prev.facebook, instagram: ig === '1' || prev.instagram };
        guardarCanalesConectados(next);
        window.history.replaceState({}, '', '/matrix');
      } catch { /* ignorar errores de parseo de query params */ }
    }
  }, [searchParams]);

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    cargarConversaciones();
    cargarCola();
    cargarLeadsReales();
    cargarEstadisticasContactos();
  }, []);

  // WebSocket: refrescar inbox cuando llega mensaje nuevo de FB/IG
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    if (!token) return;

    MatrixWebSocketService.connect(token);
    const handler = (data?: any) => {
      console.log('[WS] Evento matrix:conversacion:actualizada recibido:', data);
      cargarConversaciones();
    };
    MatrixWebSocketService.on('matrix:conversacion:actualizada', handler);

    return () => {
      MatrixWebSocketService.off('matrix:conversacion:actualizada', handler);
    };
  }, []);

  const cargarCola = async () => {
    setCargandoCola(true);
    try {
      const [pendientesResp, vencidasResp] = await Promise.all([
        contactosService.obtenerPendientes(),
        contactosService.obtenerVencidas(),
      ]);
      setColaPendiente(pendientesResp.solicitudes || []);
      setColaVencida(vencidasResp.solicitudes || []);
    } catch (error) {
      console.error('Error al cargar cola de contacto:', error);
    } finally {
      setCargandoCola(false);
    }
  };

  const calcularSlaMin = (fechaCreacion: string) => {
    const creado = new Date(fechaCreacion);
    return Math.round((Date.now() - creado.getTime()) / 60000);
  };

  const cargarConversaciones = async () => {
    try {
      const response = await api.get('/matrix/conversaciones');
      const raw = response.data?.conversaciones || [];
      const conversaciones: Conversacion[] = raw.map((c: Record<string, unknown>) => ({
        id: c.id,
        canal: c.canal as Conversacion['canal'],
        nombreContacto: c.nombreContacto || c.canalId || '',
        ultimoMensaje: c.ultimoMensaje || '',
        fechaUltimoMensaje: c.fechaUltimoMensaje ? new Date(c.fechaUltimoMensaje as string) : new Date(),
        estado: (c.estado || 'activa') as Conversacion['estado'],
        mensajesNoLeidos: Number(c.mensajesNoLeidos) || 0,
        etiquetas: (c.etiquetas as string[]) || [],
        asignadoA: c.asignadoA as string | undefined,
        pacienteId: c.pacienteId as string | undefined,
        sucursalId: c.sucursalId as string | undefined,
        enLinea: false,
      }));
      setConversaciones(conversaciones);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      setConversaciones([]);
    }
  };

  const cargarLeadsReales = async () => {
    try {
      const response = await api.get('/crm/leads');
      const raw = (response.data?.leads || []) as Array<Record<string, unknown>>;
      const leads: Lead[] = raw.map((l) => ({
        id: String(l.id ?? ''),
        nombre: String(l.nombre ?? ''),
        email: l.email ? String(l.email) : undefined,
        telefono: l.telefono ? String(l.telefono) : undefined,
        status: (l.status as Lead['status']) ?? 'new',
        canal: (l.canal as Lead['canal']) ?? 'whatsapp',
        etiquetas: Array.isArray(l.etiquetas) ? l.etiquetas as string[] : [],
        customFields: l.customFields as Record<string, string | number | boolean> | undefined,
        fechaCreacion: new Date(l.fechaCreacion as string),
        fechaActualizacion: new Date(l.fechaActualizacion as string),
        fechaUltimoContacto: l.fechaUltimoContacto ? new Date(l.fechaUltimoContacto as string) : undefined,
        fechaUltimoEstado: l.fechaUltimoEstado ? new Date(l.fechaUltimoEstado as string) : undefined,
      }));
      setLeadsFuente(leads);
    } catch (error) {
      console.error('Error al cargar leads reales:', error);
    }
  };

  const cargarEstadisticasContactos = async () => {
    try {
      const response = await contactosService.obtenerEstadisticas();
      setEstadisticasContactos(response.estadisticas);
    } catch (error) {
      console.error('Error al cargar estadísticas de contactos:', error);
    }
  };

  // Función para cargar leads paginados (usada por el infinite scroll)
  const handleLoadMoreLeads = useCallback(async (options: {
    status: LeadStatus;
    page: number;
    limit: number;
  }) => {
    try {
      if (options.status === 'citas-locales') {
        const citasLeads = await obtenerLeadsCitasLocales({
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
        const start = (options.page - 1) * options.limit;
        const paginados = citasLeads.slice(start, start + options.limit);
        return paginados;
      }
      // Aquí puedes agregar lógica para otros status si es necesario
      return [];
    } catch (error) {
      console.error('Error al cargar leads paginados:', error);
      return [];
    }
  }, []);

  const handleEnviarMensaje = async (contenido: string) => {
    if (!conversacionActiva) return;

    try {
      const res = await api.post(`/matrix/conversaciones/${conversacionActiva}/mensajes`, {
        contenido,
        tipo: 'texto',
      });
      const mensaje = res.data?.mensaje;
      if (mensaje) {
        const nuevoMensaje: Mensaje = {
          id: mensaje.id,
          conversacionId: conversacionActiva,
          contenido: mensaje.contenido,
          tipo: 'texto',
          esDeKeila: true,
          estado: (mensaje.estado as Mensaje['estado']) || 'enviado',
          fechaHora: mensaje.fechaHora ? new Date(mensaje.fechaHora) : new Date(),
        };
        setConversaciones((prev) =>
          prev.map((conv) =>
            conv.id === conversacionActiva
              ? {
                  ...conv,
                  mensajes: [...(conv.mensajes || []), nuevoMensaje],
                  ultimoMensaje: contenido,
                  fechaUltimoMensaje: new Date(),
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleSelectConversacion = useCallback((id: string | undefined) => {
    setConversacionActiva(id);
  }, []);

  const conversacionSeleccionada = conversaciones.find(c => c.id === conversacionActiva);
  const pacienteId = conversacionSeleccionada?.pacienteId;

  const handleLeadClick = (lead: Lead) => {
    // Si el lead tiene una conversación asociada, abrirla
    if (lead.conversacionId) {
      handleSelectConversacion(lead.conversacionId);
    }
  };

  const kpiActivas = estadisticasContactos
    ? estadisticasContactos.pendientes + estadisticasContactos.asignadas + estadisticasContactos.enContacto
    : 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-[calc(100vh-4rem)]" style={{ overflowAnchor: 'none' }}>
        {/* Header solo cuando vista Kanban */}
        {vistaActual === 'kanban' && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">💬 KEILA IA - Contact Center</h1>
                  <p className="text-sm text-gray-600 mt-1">Gestión unificada de conversaciones multicanal</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setVistaActual('inbox')}
                      className="flex items-center gap-2 px-4 py-2 rounded-md transition-all text-gray-600 hover:text-gray-900"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">Inbox</span>
                    </button>
                    <button
                      onClick={() => setVistaActual('kanban')}
                      className="flex items-center gap-2 px-4 py-2 rounded-md transition-all bg-white shadow-sm text-blue-600 font-medium"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="text-sm">Kanban</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Activas</p>
                      <p className="text-2xl font-bold text-green-600">{kpiActivas}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Pendientes</p>
                      <p className="text-2xl font-bold text-orange-600">{estadisticasContactos?.pendientes ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Vencidas</p>
                      <p className="text-2xl font-bold text-blue-600">{colaVencida.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800">
                <AlertCircle className="w-4 h-4" />
                <p className="text-xs">
                  <strong>Datos en vivo:</strong> KPIs, cola y analíticas se cargan desde CRM.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Contenido principal */}
        {vistaActual === 'inbox' ? (
          // Vista tipo Messenger: barra superior + 3 columnas
          <div className="flex-1 flex flex-col min-h-0 bg-[#f0f2f5]">
            {/* Barra superior: logo, búsqueda, settings, perfil, dark mode (estilo imagen) */}
            <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  N
                </div>
                <button
                  type="button"
                  onClick={() => setVistaActual('kanban')}
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium hidden sm:block"
                >
                  Kanban
                </button>
              </div>
              <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchGlobal}
                  onChange={(e) => setSearchGlobal(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  title="Configuración"
                  aria-label="Configuración"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm"
                  title="Perfil"
                  aria-label="Perfil"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  title={darkMode ? 'Modo claro' : 'Modo oscuro'}
                  aria-label="Modo oscuro"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Panel Izquierdo: Inbox (estilo imagen) */}
              <MatrixInbox
                conversaciones={conversaciones}
                conversacionActiva={conversacionActiva}
                onSelectConversacion={handleSelectConversacion}
                searchValue={searchGlobal}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode((d) => !d)}
              />

              {/* Panel Central: Conversación */}
              <ConversationView
                conversacion={conversacionSeleccionada || null}
                onBack={() => setConversacionActiva(undefined)}
                onEnviarMensaje={handleEnviarMensaje}
              />

              {/* Panel Derecho: Detalles del chat (estilo imagen) */}
              <ChatDetailsPanel
                conversacion={conversacionSeleccionada || null}
                onAgendarCita={() => setAgendarCitaOpen(true)}
              />
            </div>

            {/* Modal de agendar cita (desde ficha del contacto) */}
            <AgendarCitaModal
              isOpen={agendarCitaOpen}
              onClose={() => setAgendarCitaOpen(false)}
              pacienteId={conversacionSeleccionada?.pacienteId}
              pacienteNombre={conversacionSeleccionada?.nombreContacto}
              onCitaCreada={() => {
                setAgendarCitaOpen(false);
                cargarConversaciones();
              }}
            />
          </div>
        ) : (
          // Vista Kanban de Leads
          <div className="flex-1 flex">
            <div className={`${conversacionActiva ? 'w-1/2' : 'flex-1'} h-full transition-all duration-300`}>
              <MatrixKanbanView
                onLoadMore={handleLoadMoreLeads}
                onLeadClick={handleLeadClick}
                onOpenConversation={handleSelectConversacion}
              />
            </div>

            {conversacionActiva && (
              <div className="w-1/2 h-full border-l border-gray-200 bg-white relative">
                <button
                  onClick={() => setConversacionActiva(undefined)}
                  className="absolute top-3 right-3 z-10 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                >
                  Cerrar chat
                </button>
                <ConversationView
                  conversacion={conversacionSeleccionada || null}
                  onBack={() => setConversacionActiva(undefined)}
                  onEnviarMensaje={handleEnviarMensaje}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

