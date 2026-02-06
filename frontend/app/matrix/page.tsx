'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MatrixInbox } from '@/components/matrix/MatrixInbox';
import { ConversationView } from '@/components/matrix/ConversationView';
import { PatientProfile } from '@/components/matrix/PatientProfile';
import { MatrixKanbanView } from '@/components/matrix/MatrixKanbanView';
import { Conversacion, Mensaje, Lead, LeadStatus } from '@/types/matrix';
import { AlertCircle, Clock, LayoutGrid, MessageSquare } from 'lucide-react';
import { obtenerLeadsSimulados, obtenerConversacionesSimuladas } from '@/lib/matrix.service';
import contactosService from '@/lib/contactos.service';
import type { SolicitudContacto } from '@/types/contacto';

export default function MatrixPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<string | undefined>();
  const [vistaActual, setVistaActual] = useState<'inbox' | 'kanban'>('inbox');
  const [colaPendiente, setColaPendiente] = useState<SolicitudContacto[]>([]);
  const [colaVencida, setColaVencida] = useState<SolicitudContacto[]>([]);
  const [cargandoCola, setCargandoCola] = useState(false);

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    cargarConversaciones();
    cargarCola();
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
      // Usar las conversaciones simuladas del servicio
      const { obtenerConversacionesSimuladas } = await import('@/lib/matrix.service');
      const conversacionesDemo = await obtenerConversacionesSimuladas();
      
      // Agregar mensajes de ejemplo a las primeras conversaciones
      if (conversacionesDemo[0]) {
        conversacionesDemo[0].mensajes = [
          {
            id: 'm1',
            conversacionId: '1',
            contenido: 'Hola, quisiera agendar una cita por la promoción de limpieza dental',
            tipo: 'texto',
            esDeKeila: false,
            estado: 'leido',
            fechaHora: new Date(Date.now() - 5 * 60000)
          }
        ];
      }
      
      if (conversacionesDemo[1]) {
        conversacionesDemo[1].mensajes = [
          {
            id: 'm2',
            conversacionId: '2',
            contenido: '¿Tienen horario disponible para mañana? Es urgente',
            tipo: 'texto',
            esDeKeila: false,
            estado: 'leido',
            fechaHora: new Date(Date.now() - 15 * 60000)
          }
        ];
      }
      
      setConversaciones(conversacionesDemo);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  // Función para cargar leads paginados (usada por el infinite scroll)
  const handleLoadMoreLeads = useCallback(async (options: {
    status: LeadStatus;
    page: number;
    limit: number;
  }) => {
    try {
      // Usar la función de leads simulados del servicio
      const response = await obtenerLeadsSimulados(options);
      return {
        leads: response.leads,
        hasMore: response.hasMore,
        total: response.total,
      };
    } catch (error) {
      console.error('Error al cargar leads:', error);
      // En caso de error, retornar vacío para que el UI maneje correctamente
      return {
        leads: [],
        hasMore: false,
        total: 0,
      };
    }
  }, []);

  const cargarLeads = async () => {
    try {
      // TODO: Reemplazar con llamada real a la API
      // const response = await fetch('/api/matrix/leads');
      // const data = await response.json();
      // setLeads(data);
      
      // Datos simulados para demo
      const leadsDemo: Lead[] = [
        {
          id: 'L001',
          nombre: 'Brooklyn Simmons',
          email: 'brooklyn@gmail.com',
          telefono: '(817) 234-9182',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'new',
          canal: 'whatsapp',
          valorEstimado: 2568.24,
          notas: 'Nuevo lead desde el 13/05/24',
          conversacionId: '1',
          etiquetas: ['Promoción', 'Nueva'],
          asignadoA: 'Keila',
        },
        {
          id: 'L002',
          nombre: 'Arlene McCoy',
          email: 'debbie.baker@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'reviewing',
          canal: 'instagram',
          valorEstimado: 2568.24,
          notas: 'Nuevo lead desde el 13/05/24',
          conversacionId: '3',
          etiquetas: ['Urgente'],
        },
        {
          id: 'L003',
          nombre: 'Kristin Watson',
          email: 'nathan.roberts@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'rejected',
          canal: 'facebook',
          valorEstimado: 995.68,
          notas: 'Nuevo lead desde el 13/05/24',
          conversacionId: '4',
          etiquetas: [],
        },
        {
          id: 'L004',
          nombre: 'Arlene McCoy',
          email: 'debbie.baker@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'qualified',
          canal: 'whatsapp',
          valorEstimado: 2568.24,
          notas: 'Nuevo lead desde el 13/05/24',
          etiquetas: ['VIP'],
        },
        {
          id: 'L005',
          nombre: 'Frank Sinatra',
          email: 'Frankie@gmail.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-04-22'),
          fechaActualizacion: new Date(),
          status: 'new',
          canal: 'whatsapp',
          valorEstimado: 1856.68,
          notas: 'Nuevo lead desde el 22/04/24',
          etiquetas: ['Promoción'],
        },
        {
          id: 'L006',
          nombre: 'Marvin McKinney',
          email: 'sara.cruz@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'reviewing',
          canal: 'instagram',
          valorEstimado: 540.23,
          notas: 'Nuevo lead desde el 13/05/24',
          conversacionId: '2',
          etiquetas: [],
        },
        {
          id: 'L007',
          nombre: 'Devon Lane',
          email: 'alma.lawson@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-04-22'),
          fechaActualizacion: new Date(),
          status: 'rejected',
          canal: 'whatsapp',
          valorEstimado: 425.37,
          notas: 'Nuevo lead desde el 22/04/24, algunas notas aquí...',
          etiquetas: [],
        },
        {
          id: 'L008',
          nombre: 'Marvin McKinney',
          email: 'sara.cruz@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'qualified',
          canal: 'facebook',
          valorEstimado: 540.23,
          notas: 'Nuevo lead desde el 13/05/24',
          etiquetas: ['Recurrente'],
        },
        {
          id: 'L009',
          nombre: 'Bob Delan',
          email: 'bob.delan@gmail.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-05-13'),
          fechaActualizacion: new Date(),
          status: 'new',
          canal: 'whatsapp',
          valorEstimado: 2568.24,
          notas: 'Nuevo lead desde el 13/05/24',
          etiquetas: [],
        },
        {
          id: 'L010',
          nombre: 'Courtney Henry',
          email: 'bill.sanders@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-04-22'),
          fechaActualizacion: new Date(),
          status: 'reviewing',
          canal: 'instagram',
          valorEstimado: 354.78,
          notas: 'Nuevo lead desde el 22/04/24',
          etiquetas: ['Promoción'],
        },
        {
          id: 'L011',
          nombre: 'Courtney Henry',
          email: 'bill.sanders@example.com',
          telefono: '(101) 256 78965',
          fechaCreacion: new Date('2024-04-22'),
          fechaActualizacion: new Date(),
          status: 'qualified',
          canal: 'whatsapp',
          valorEstimado: 354.78,
          notas: 'Nuevo lead desde el 22/04/24',
          etiquetas: [],
        },
      ];

      // Ya no almacenamos los leads en el estado local,
      // el infinite scroll hook los gestiona por sí mismo
      // setLeads(leadsDemo);
    } catch (error) {
      console.error('Error al cargar leads:', error);
    }
  };

  const handleSelectConversacion = (id: string) => {
    setConversacionActiva(id);
  };

  const handleEnviarMensaje = async (contenido: string) => {
    if (!conversacionActiva) return;

    try {
      // TODO: Reemplazar con llamada real a la API
      // await fetch(`/api/matrix/conversaciones/${conversacionActiva}/mensajes`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ contenido })
      // });

      // Agregar mensaje localmente (simulación)
      const nuevoMensaje: Mensaje = {
        id: `m${Date.now()}`,
        conversacionId: conversacionActiva,
        contenido,
        tipo: 'texto',
        esDeKeila: true,
        estado: 'enviado',
        fechaHora: new Date()
      };

      setConversaciones(prev => prev.map(conv => {
        if (conv.id === conversacionActiva) {
          return {
            ...conv,
            mensajes: [...(conv.mensajes || []), nuevoMensaje],
            ultimoMensaje: contenido,
            fechaUltimoMensaje: new Date()
          };
        }
        return conv;
      }));

      // Simular cambio de estado a "entregado" después de 1 segundo
      setTimeout(() => {
        setConversaciones(prev => prev.map(conv => {
          if (conv.id === conversacionActiva) {
            return {
              ...conv,
              mensajes: conv.mensajes?.map(m => 
                m.id === nuevoMensaje.id ? { ...m, estado: 'entregado' } : m
              )
            };
          }
          return conv;
        }));
      }, 1000);

      // Simular cambio de estado a "leído" después de 3 segundos
      setTimeout(() => {
        setConversaciones(prev => prev.map(conv => {
          if (conv.id === conversacionActiva) {
            return {
              ...conv,
              mensajes: conv.mensajes?.map(m => 
                m.id === nuevoMensaje.id ? { ...m, estado: 'leido' } : m
              )
            };
          }
          return conv;
        }));
      }, 3000);

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const conversacionSeleccionada = conversaciones.find(c => c.id === conversacionActiva);
  const pacienteId = conversacionSeleccionada?.pacienteId;

  const handleLeadClick = (lead: Lead) => {
    // Si el lead tiene una conversación asociada, abrirla
    if (lead.conversacionId) {
      handleSelectConversacion(lead.conversacionId);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                💬 KEILA IA - Contact Center
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestión unificada de conversaciones multicanal
              </p>
            </div>
            
            {/* Toggle de vista + Indicadores en tiempo real */}
            <div className="flex items-center gap-6">
              {/* Toggle de vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setVistaActual('inbox')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    vistaActual === 'inbox'
                      ? 'bg-white shadow-sm text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Inbox</span>
                </button>
                <button
                  onClick={() => setVistaActual('kanban')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    vistaActual === 'kanban'
                      ? 'bg-white shadow-sm text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm">Kanban</span>
                </button>
              </div>

              {/* Indicadores en tiempo real */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Activas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {conversaciones.filter(c => c.estado === 'activa').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {conversaciones.filter(c => c.estado === 'pendiente').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Sin Leer</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {conversaciones.reduce((acc, c) => acc + c.mensajesNoLeidos, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cola de Contact Center */}
        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Cola de Contacto</h2>
              <p className="text-xs text-gray-500">SLA por solicitudes pendientes y vencidas</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 font-semibold">
                Pendientes: {colaPendiente.length}
              </span>
              <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">
                Vencidas: {colaVencida.length}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cargandoCola ? (
              <div className="text-xs text-gray-500">Cargando cola...</div>
            ) : (
              colaPendiente.slice(0, 6).map((item) => {
                const sla = calcularSlaMin(item.fechaCreacion);
                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.nombreCompleto}</p>
                      <span className={`text-xs font-semibold ${sla > 120 ? 'text-red-600' : 'text-green-600'}`}>
                        <Clock className="inline-block w-3 h-3 mr-1" />
                        {sla} min
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.sucursalNombre}</p>
                    <p className="text-xs text-gray-700 mt-1">{item.motivo}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Advertencia de datos simulados */}
        <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <p className="text-xs">
              <strong>Modo Demo:</strong> Actualmente mostrando {vistaActual === 'inbox' ? 'conversaciones' : 'leads'} simulados. 
              Conecta con la API de WhatsApp Business, Facebook e Instagram para datos reales.
            </p>
          </div>
        </div>

        {/* Contenido principal */}
        {vistaActual === 'inbox' ? (
          // Vista tradicional de Inbox (3 columnas)
          <div className="flex-1 flex overflow-hidden">
            {/* Panel Izquierdo: Inbox */}
            <MatrixInbox
              conversaciones={conversaciones}
              conversacionActiva={conversacionActiva}
              onSelectConversacion={handleSelectConversacion}
            />

            {/* Panel Central: Conversación */}
            <ConversationView
              conversacion={conversacionSeleccionada || null}
              onBack={() => setConversacionActiva(undefined)}
              onEnviarMensaje={handleEnviarMensaje}
            />

            {/* Panel Derecho: Perfil del Paciente */}
            <PatientProfile
              pacienteId={pacienteId}
            />
          </div>
        ) : (
          // Vista Kanban de Leads
          <div className="flex-1 overflow-hidden flex">
            <div className={`${conversacionActiva ? 'w-1/2' : 'flex-1'} h-full overflow-hidden transition-all duration-300`}>
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

