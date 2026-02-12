import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface Conversacion {
  id: string;
  canal: string;
  canalId: string;
  nombreContacto: string;
  ultimoMensaje?: string;
  fechaUltimoMensaje?: Date;
  mensajesNoLeidos: number;
  estado: string;
  prioridad: string;
  etiquetas: string[];
  asignadoA?: string;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  esPaciente: boolean;
  contenido: string;
  tipoMensaje: "texto" | "imagen" | "audio" | "archivo" | "video" | "sistema";
  fechaEnvio: Date;
  estadoEntrega?: "enviando" | "enviado" | "entregado" | "leido" | "fallido";
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamano?: number;
  audioDuracion?: number;
}

export const matrixService = {
  async obtenerConversaciones(token: string, filtros?: {
    canal?: string;
    estado?: string;
    prioridad?: string;
    busqueda?: string;
  }): Promise<Conversacion[]> {
    const params = new URLSearchParams();
    if (filtros?.canal) params.append("canal", filtros.canal);
    if (filtros?.estado) params.append("estado", filtros.estado);
    if (filtros?.prioridad) params.append("prioridad", filtros.prioridad);
    if (filtros?.busqueda) params.append("busqueda", filtros.busqueda);

    const res = await fetch(`${API_URL}/matrix/conversaciones?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener conversaciones");
    const data = await res.json();
    return data.conversaciones || [];
  },

  async obtenerMensajes(token: string, conversacionId: string): Promise<Mensaje[]> {
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al obtener mensajes");
    const data = await res.json();
    const conv = data.conversacion;
    const mensajes = conv?.mensajes ?? data.mensajes ?? [];
    return Array.isArray(mensajes) ? mensajes : [];
  },

  async enviarMensaje(token: string, conversacionId: string, mensaje: {
    contenido: string;
    tipoMensaje: string;
    archivoUrl?: string;
    archivoNombre?: string;
    archivoTipo?: string;
    archivoTamano?: number;
    audioDuracion?: number;
  }): Promise<Mensaje> {
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}/mensajes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(mensaje),
    });

    if (!res.ok) throw new Error("Error al enviar mensaje");
    const data = await res.json();
    return data.mensaje;
  },

  async cambiarPrioridad(token: string, conversacionId: string, prioridad: string): Promise<void> {
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}/prioridad`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prioridad }),
    });

    if (!res.ok) throw new Error("Error al cambiar prioridad");
  },

  async agregarEtiqueta(token: string, conversacionId: string, etiqueta: string): Promise<void> {
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}/etiquetas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ etiqueta }),
    });

    if (!res.ok) throw new Error("Error al agregar etiqueta");
  },

  async quitarEtiqueta(token: string, conversacionId: string, etiqueta: string): Promise<void> {
    const res = await fetch(
      `${API_URL}/matrix/conversaciones/${conversacionId}/etiquetas/${encodeURIComponent(etiqueta)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error("Error al quitar etiqueta");
  },

  async escalarARecepcion(token: string, conversacionId: string): Promise<void> {
    // Obtener ID del usuario de recepción (simplificado - en producción buscar por rol)
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}/asignar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ usuarioId: "recepcion-id" }),
    });

    if (!res.ok) throw new Error("Error al escalar conversación");
  },

  async marcarComoLeida(token: string, conversacionId: string): Promise<void> {
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}/leer`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al marcar como leída");
  },

  async archivarConversacion(token: string, conversacionId: string): Promise<void> {
    const res = await fetch(`${API_URL}/matrix/conversaciones/${conversacionId}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: "Cerrada" }),
    });

    if (!res.ok) throw new Error("Error al archivar conversación");
  },
};

/** Mueve un lead a otra columna (estado) del Kanban. Usa API CRM. */
export async function moverLead(leadId: string, targetStatus: string): Promise<void> {
  await api.put(`/crm/leads/${leadId}`, { status: targetStatus });
}

/** Obtiene leads desde la API CRM (para debug y pruebas). */
export async function obtenerLeadsSimulados(options?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ leads: import('@/types/matrix').Lead[] }> {
  const res = await api.get('/crm/leads');
  const raw = (res.data?.leads || []) as Array<Record<string, unknown>>;
  const leads = raw.map((l) => ({
    id: String(l.id ?? ''),
    nombre: String(l.nombre ?? ''),
    email: l.email ? String(l.email) : undefined,
    telefono: l.telefono ? String(l.telefono) : undefined,
    status: (l.status as import('@/types/matrix').LeadStatus) ?? 'new',
    canal: (l.canal as import('@/types/matrix').CanalType) ?? 'whatsapp',
    etiquetas: Array.isArray(l.etiquetas) ? (l.etiquetas as string[]) : [],
    fechaCreacion: new Date(l.fechaCreacion as string),
    fechaActualizacion: new Date(l.fechaActualizacion as string),
  }));
  return { leads };
}
