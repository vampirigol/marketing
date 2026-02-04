/**
 * Servicio para gestionar conversaciones de Matrix Keila
 */

import { api } from './api';
import { 
  Conversacion, 
  Mensaje, 
  EstadisticasMatrix,
  FiltrosConversacion,
  CanalType,
  ConversacionEstado 
} from '@/types/matrix';

/**
 * Obtener todas las conversaciones
 */
export async function obtenerConversaciones(
  filtros?: FiltrosConversacion
): Promise<Conversacion[]> {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.canales && filtros.canales.length > 0) {
      params.append('canales', filtros.canales.join(','));
    }
    if (filtros?.estados && filtros.estados.length > 0) {
      params.append('estados', filtros.estados.join(','));
    }
    if (filtros?.etiquetas && filtros.etiquetas.length > 0) {
      params.append('etiquetas', filtros.etiquetas.join(','));
    }
    if (filtros?.sucursalId) {
      params.append('sucursalId', filtros.sucursalId);
    }
    if (filtros?.busqueda) {
      params.append('q', filtros.busqueda);
    }

    const url = `/matrix/conversaciones${params.toString() ? `?${params}` : ''}`;
    const response = await api.get<Conversacion[]>(url);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((conv: any) => ({
      ...conv,
      fechaUltimoMensaje: new Date(conv.fechaUltimoMensaje)
    }));
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    throw error;
  }
}

/**
 * Obtener una conversación específica con todos sus mensajes
 */
export async function obtenerConversacion(id: string): Promise<Conversacion> {
  try {
    const response = await api.get<Conversacion>(`/matrix/conversaciones/${id}`);
    
    return {
      ...response.data,
      fechaUltimoMensaje: new Date(response.data.fechaUltimoMensaje),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mensajes: response.data.mensajes?.map((m: any) => ({
        ...m,
        fechaHora: new Date(m.fechaHora)
      }))
    };
  } catch (error) {
    console.error('Error al obtener conversación:', error);
    throw error;
  }
}

/**
 * Enviar un mensaje en una conversación
 */
export async function enviarMensaje(
  conversacionId: string,
  contenido: string,
  tipo: 'texto' | 'imagen' | 'audio' | 'documento' = 'texto'
): Promise<Mensaje> {
  try {
    const response = await api.post<Mensaje>(
      `/matrix/conversaciones/${conversacionId}/mensajes`,
      { contenido, tipo }
    );
    
    return {
      ...response.data,
      fechaHora: new Date(response.data.fechaHora)
    };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw error;
  }
}

/**
 * Marcar mensajes como leídos
 */
export async function marcarComoLeido(conversacionId: string): Promise<void> {
  try {
    await api.put(`/matrix/conversaciones/${conversacionId}/leer`, {});
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    throw error;
  }
}

/**
 * Cambiar el estado de una conversación
 */
export async function cambiarEstadoConversacion(
  conversacionId: string,
  estado: ConversacionEstado
): Promise<void> {
  try {
    await api.put(`/matrix/conversaciones/${conversacionId}/estado`, { estado });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    throw error;
  }
}

/**
 * Agregar etiquetas a una conversación
 */
export async function agregarEtiqueta(
  conversacionId: string,
  etiqueta: string
): Promise<void> {
  try {
    await api.post(`/matrix/conversaciones/${conversacionId}/etiquetas`, { etiqueta });
  } catch (error) {
    console.error('Error al agregar etiqueta:', error);
    throw error;
  }
}

/**
 * Eliminar etiqueta de una conversación
 */
export async function eliminarEtiqueta(
  conversacionId: string,
  etiqueta: string
): Promise<void> {
  try {
    await api.delete(`/matrix/conversaciones/${conversacionId}/etiquetas/${etiqueta}`);
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas del Contact Center
 */
export async function obtenerEstadisticasMatrix(): Promise<EstadisticasMatrix> {
  try {
    const response = await api.get<EstadisticasMatrix>('/matrix/estadisticas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}

/**
 * Vincular conversación con un paciente
 */
export async function vincularPaciente(
  conversacionId: string,
  pacienteId: string
): Promise<void> {
  try {
    await api.put(`/matrix/conversaciones/${conversacionId}/paciente`, { pacienteId });
  } catch (error) {
    console.error('Error al vincular paciente:', error);
    throw error;
  }
}

/**
 * Buscar conversaciones por texto
 */
export async function buscarConversaciones(query: string): Promise<Conversacion[]> {
  try {
    const response = await api.get<Conversacion[]>(`/matrix/conversaciones/buscar?q=${encodeURIComponent(query)}`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((conv: any) => ({
      ...conv,
      fechaUltimoMensaje: new Date(conv.fechaUltimoMensaje)
    }));
  } catch (error) {
    console.error('Error al buscar conversaciones:', error);
    throw error;
  }
}

/**
 * Obtener conversaciones sin leer (para notificaciones)
 */
export async function obtenerConversacionesSinLeer(): Promise<number> {
  try {
    const response = await api.get<{ count: number }>('/matrix/conversaciones/sin-leer/count');
    return response.data.count;
  } catch (error) {
    console.error('Error al obtener conversaciones sin leer:', error);
    return 0;
  }
}

/**
 * Cerrar una conversación
 */
export async function cerrarConversacion(
  conversacionId: string,
  razon?: string
): Promise<void> {
  try {
    await api.put(`/matrix/conversaciones/${conversacionId}/cerrar`, { razon });
  } catch (error) {
    console.error('Error al cerrar conversación:', error);
    throw error;
  }
}

/**
 * Reabrir una conversación cerrada
 */
export async function reabrirConversacion(conversacionId: string): Promise<void> {
  try {
    await api.put(`/matrix/conversaciones/${conversacionId}/reabrir`, {});
  } catch (error) {
    console.error('Error al reabrir conversación:', error);
    throw error;
  }
}

// ============= LEADS KANBAN CON PAGINACIÓN =============

import { Lead, LeadStatus } from '@/types/matrix';

interface ObtenerLeadsParams {
  status?: LeadStatus;
  page?: number;
  limit?: number;
  busqueda?: string;
  canal?: 'whatsapp' | 'facebook' | 'instagram';
}

interface ObtenerLeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Obtener leads con paginación
 */
export async function obtenerLeadsPaginados(
  params: ObtenerLeadsParams = {}
): Promise<ObtenerLeadsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.busqueda) queryParams.append('q', params.busqueda);
    if (params.canal) queryParams.append('canal', params.canal);

    const url = `/matrix/leads${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await api.get<ObtenerLeadsResponse>(url);
    
    return {
      ...response.data,
      leads: response.data.leads.map((lead) => ({
        ...lead,
        fechaCreacion: new Date(lead.fechaCreacion),
        fechaActualizacion: new Date(lead.fechaActualizacion),
      })),
    };
  } catch (error) {
    console.error('Error al obtener leads paginados:', error);
    throw error;
  }
}

/**
 * Crear un nuevo lead
 */
export async function crearLead(lead: Omit<Lead, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Lead> {
  try {
    const response = await api.post<Lead>('/matrix/leads', lead);
    return {
      ...response.data,
      fechaCreacion: new Date(response.data.fechaCreacion),
      fechaActualizacion: new Date(response.data.fechaActualizacion),
    };
  } catch (error) {
    console.error('Error al crear lead:', error);
    throw error;
  }
}

/**
 * Actualizar un lead
 */
export async function actualizarLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
  try {
    const response = await api.put<Lead>(`/matrix/leads/${leadId}`, updates);
    return {
      ...response.data,
      fechaCreacion: new Date(response.data.fechaCreacion),
      fechaActualizacion: new Date(response.data.fechaActualizacion),
    };
  } catch (error) {
    console.error('Error al actualizar lead:', error);
    throw error;
  }
}

/**
 * Mover lead a otra columna (cambiar status)
 */
export async function moverLead(leadId: string, newStatus: LeadStatus): Promise<Lead> {
  try {
    const response = await api.patch<Lead>(`/matrix/leads/${leadId}/status`, { status: newStatus });
    return {
      ...response.data,
      fechaCreacion: new Date(response.data.fechaCreacion),
      fechaActualizacion: new Date(response.data.fechaActualizacion),
    };
  } catch (error) {
    console.error('Error al mover lead:', error);
    throw error;
  }
}

/**
 * Eliminar un lead
 */
export async function eliminarLead(leadId: string): Promise<void> {
  try {
    await api.delete(`/matrix/leads/${leadId}`);
  } catch (error) {
    console.error('Error al eliminar lead:', error);
    throw error;
  }
}

// ============= SIMULACIÓN DE LEADS DESDE CONVERSACIONES =============

/**
 * Generar leads simulados a partir de las conversaciones del inbox
 * Esta función convierte conversaciones de mensajería en leads para el kanban
 */
export function generarLeadsDesdeConversaciones(conversaciones: Conversacion[]): Lead[] {
  const statusMapping: { [key: string]: LeadStatus } = {
    'activa': 'new',
    'pendiente': 'reviewing',
    'cerrada': 'qualified'
  };

  const valorEstimadoPorCanal: Record<CanalType, number> = {
    whatsapp: 2500,
    facebook: 2000,
    instagram: 3000,
    email: 1500,
    tiktok: 2800,
    youtube: 3500,
    'fan-page': 2200
  };

  const vendedores = [
    { nombre: 'Lucía Paredes', avatar: '🧑‍💼' },
    { nombre: 'Marco Ruiz', avatar: '👨‍💼' },
    { nombre: 'Sofía Díaz', avatar: '👩‍💼' },
  ];

  const estadosVendedor: Array<'en-llamada' | 'escribiendo' | 'ausente'> = [
    'en-llamada',
    'escribiendo',
    'ausente',
  ];

  return conversaciones.map((conv, index) => {
    // Asignar status basado en etiquetas o estado de conversación
    let status: LeadStatus = statusMapping[conv.estado] || 'new';
    
    // Si tiene etiqueta "Promoción", es calificado
    if (conv.etiquetas.includes('Promoción')) {
      status = 'qualified';
    }
    
    // Si tiene etiqueta "Urgente", está en progreso
    if (conv.etiquetas.includes('Urgente')) {
      status = 'in-progress';
    }
    
    // Si tiene etiqueta "Negociación", está en open-deal
    if (conv.etiquetas.includes('Negociación')) {
      status = 'open-deal';
    }

    // Calcular valor estimado con variación
    const baseValue = valorEstimadoPorCanal[conv.canal];
    const variation = Math.floor(Math.random() * 1000) - 500; // ±500
    const valorEstimado = baseValue + variation;

    const vendedor = vendedores[index % vendedores.length];
    const estadoVendedor = estadosVendedor[index % estadosVendedor.length];
    const conflictoEdicion = index % 7 === 0;

    return {
      id: `lead-${conv.id}`,
      nombre: conv.nombreContacto,
      telefono: conv.telefono,
      avatar: conv.avatar,
      email: `${conv.nombreContacto.toLowerCase().replace(/\s/g, '.')}@example.com`,
      fechaCreacion: new Date(conv.fechaUltimoMensaje.getTime() - (index * 1000 * 60 * 60)), // Distribución temporal
      fechaActualizacion: conv.fechaUltimoMensaje,
      status,
      canal: conv.canal,
      valorEstimado,
      notas: conv.ultimoMensaje,
      conversacionId: conv.id,
      etiquetas: conv.etiquetas,
      asignadoA: conv.enLinea ? vendedor.nombre : undefined,
      asignadoAvatar: conv.enLinea ? vendedor.avatar : undefined,
      estadoVendedor: conv.enLinea ? estadoVendedor : 'ausente',
      editoresActivos: conflictoEdicion ? ['Keila', vendedor.nombre] : [vendedor.nombre],
      conflictoEdicion
    };
  });
}

/**
 * Obtener leads simulados con paginación
 * Usa las conversaciones como fuente de datos
 */
export async function obtenerLeadsSimulados(
  params: ObtenerLeadsParams = {}
): Promise<ObtenerLeadsResponse> {
  try {
    // Obtener conversaciones del inbox
    const conversaciones = await obtenerConversacionesSimuladas();
    
    // Convertir a leads
    let leads = generarLeadsDesdeConversaciones(conversaciones);

    // Debug: Mostrar en consola
    console.log(`[obtenerLeadsSimulados] Conversaciones: ${conversaciones.length}, Leads generados: ${leads.length}`);
    if (params.status) {
      console.log(`[obtenerLeadsSimulados] Filtrando por status: ${params.status}`);
    }

    // Aplicar filtros
    if (params.status) {
      leads = leads.filter(lead => lead.status === params.status);
      console.log(`[obtenerLeadsSimulados] Leads después de filtro status: ${leads.length}`);
    }

    if (params.canal) {
      leads = leads.filter(lead => lead.canal === params.canal);
    }

    if (params.busqueda) {
      const searchLower = params.busqueda.toLowerCase();
      leads = leads.filter(lead => 
        lead.nombre.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.telefono?.includes(params.busqueda || '')
      );
    }

    // Paginación
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedLeads = leads.slice(startIndex, endIndex);
    const hasMore = endIndex < leads.length;

    console.log(`[obtenerLeadsSimulados] Total final: ${leads.length}, Paginados: ${paginatedLeads.length}`);

    return {
      leads: paginatedLeads,
      total: leads.length,
      page,
      limit,
      hasMore
    };
  } catch (error) {
    console.error('Error al obtener leads simulados:', error);
    throw error;
  }
}

/**
 * Obtener conversaciones simuladas para demo
 */
export function obtenerConversacionesSimuladas(): Promise<Conversacion[]> {
  // Datos simulados más completos para demo
  const conversacionesDemo: Conversacion[] = [
    {
      id: '1',
      canal: 'instagram',
      nombreContacto: 'María González',
      telefono: '+52 555-1234-5678',
      avatar: '👩',
      ultimoMensaje: 'Hola, quisiera agendar una cita por la promoción de limpieza dental',
      fechaUltimoMensaje: new Date(Date.now() - 5 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 1,
      etiquetas: ['Promoción', 'Nueva'],
      pacienteId: 'PAC-001',
      enLinea: true
    },
    {
      id: '2',
      canal: 'facebook',
      nombreContacto: 'Pedro López',
      telefono: '+52 555-9876-5432',
      avatar: '👨',
      ultimoMensaje: '¿Tienen horario disponible para mañana? Es urgente',
      fechaUltimoMensaje: new Date(Date.now() - 15 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 2,
      etiquetas: ['Urgente'],
      enLinea: false
    },
    {
      id: '3',
      canal: 'email',
      nombreContacto: 'Ana Martínez',
      telefono: '+52 555-5555-1111',
      avatar: '👱‍♀️',
      ultimoMensaje: '💜 Me interesa la promoción de blanqueamiento',
      fechaUltimoMensaje: new Date(Date.now() - 25 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 0,
      etiquetas: ['Promoción'],
      enLinea: true
    },
    {
      id: '4',
      canal: 'fan-page',
      nombreContacto: 'Carlos Ramírez',
      telefono: '+52 555-2222-3333',
      avatar: '👨‍💼',
      ultimoMensaje: 'Vi su publicación sobre ortodoncia, ¿cuánto cuesta?',
      fechaUltimoMensaje: new Date(Date.now() - 45 * 60000),
      estado: 'pendiente',
      mensajesNoLeidos: 3,
      etiquetas: ['Ortodoncia'],
      enLinea: false
    },
    {
      id: '5',
      canal: 'youtube',
      nombreContacto: 'Laura Hernández',
      telefono: '+52 555-4444-5555',
      avatar: '👩‍🦰',
      ultimoMensaje: 'Estoy lista para confirmar mi cita, estamos en negociación del costo',
      fechaUltimoMensaje: new Date(Date.now() - 60 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 0,
      etiquetas: ['Negociación', 'Promoción'],
      enLinea: true
    },
    {
      id: '6',
      canal: 'tiktok',
      nombreContacto: 'Roberto Silva',
      telefono: '+52 555-6666-7777',
      avatar: '🧔',
      ultimoMensaje: 'Gracias por la información, me interesa mucho',
      fechaUltimoMensaje: new Date(Date.now() - 90 * 60000),
      estado: 'cerrada',
      mensajesNoLeidos: 0,
      etiquetas: ['Promoción', 'Seguimiento'],
      enLinea: false
    },
    {
      id: '7',
      canal: 'instagram',
      nombreContacto: 'Sofia Torres',
      telefono: '+52 555-8888-9999',
      avatar: '👩‍🎓',
      ultimoMensaje: 'Buenos días, necesito información sobre implantes dentales',
      fechaUltimoMensaje: new Date(Date.now() - 120 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 1,
      etiquetas: ['Nueva', 'Implantes'],
      enLinea: true
    },
    {
      id: '8',
      canal: 'email',
      nombreContacto: 'Miguel Ángel Ruiz',
      telefono: '+52 555-1111-2222',
      avatar: '👨‍🔧',
      ultimoMensaje: 'Me urge una cita para hoy mismo si es posible',
      fechaUltimoMensaje: new Date(Date.now() - 180 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 4,
      etiquetas: ['Urgente', 'Emergencia'],
      enLinea: false
    },
    {
      id: '9',
      canal: 'youtube',
      nombreContacto: 'Valentina Castro',
      telefono: '+52 555-3333-4444',
      avatar: '👩‍🎨',
      ultimoMensaje: '¿Aceptan seguro dental? Estoy interesada en la promoción',
      fechaUltimoMensaje: new Date(Date.now() - 240 * 60000),
      estado: 'pendiente',
      mensajesNoLeidos: 2,
      etiquetas: ['Promoción', 'Seguros'],
      enLinea: true
    },
    {
      id: '10',
      canal: 'facebook',
      nombreContacto: 'Diego Morales',
      telefono: '+52 555-5555-6666',
      avatar: '👨‍🎤',
      ultimoMensaje: 'Ya agendé mi cita, gracias por su atención',
      fechaUltimoMensaje: new Date(Date.now() - 300 * 60000),
      estado: 'cerrada',
      mensajesNoLeidos: 0,
      etiquetas: ['Confirmada'],
      enLinea: false
    },
    {
      id: '11',
      canal: 'tiktok',
      nombreContacto: 'Camila Vargas',
      telefono: '+52 555-7777-8888',
      avatar: '👩‍💻',
      ultimoMensaje: '¿Tienen sucursal cerca de mi zona?',
      fechaUltimoMensaje: new Date(Date.now() - 360 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 1,
      etiquetas: ['Nueva', 'Ubicación'],
      enLinea: true
    },
    {
      id: '12',
      canal: 'fan-page',
      nombreContacto: 'Fernando Jiménez',
      telefono: '+52 555-9999-0000',
      avatar: '👨‍🏫',
      ultimoMensaje: 'Excelente servicio, me gustaría negociar un paquete familiar',
      fechaUltimoMensaje: new Date(Date.now() - 420 * 60000),
      estado: 'activa',
      mensajesNoLeidos: 0,
      etiquetas: ['Negociación', 'Paquete'],
      enLinea: true
    }
  ];

  return Promise.resolve(conversacionesDemo);
}
