import { api } from './api';

export interface ConversacionResumen {
  id: string;
  canal: string;
  nombreContacto: string;
  ultimoMensaje: string;
  fechaUltimoMensaje: string;
  mensajesNoLeidos: number;
}

export interface Mensaje {
  id: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'audio' | 'documento';
  esDeKeila: boolean;
  fechaHora: string;
}

export interface ConversacionDetalle extends ConversacionResumen {
  mensajes: Mensaje[];
}

export const matrixService = {
  async listarConversaciones(): Promise<ConversacionResumen[]> {
    const response = await api.get('/matrix/conversaciones');
    return response.data.conversaciones as ConversacionResumen[];
  },

  async obtenerConversacion(id: string): Promise<ConversacionDetalle> {
    const response = await api.get(`/matrix/conversaciones/${id}`);
    return response.data.conversacion as ConversacionDetalle;
  },

  async enviarMensaje(id: string, contenido: string): Promise<void> {
    await api.post(`/matrix/conversaciones/${id}/mensajes`, {
      contenido,
      tipo: 'texto',
    });
  },
};
