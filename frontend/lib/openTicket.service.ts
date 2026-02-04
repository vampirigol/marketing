/**
 * Servicio: Open Tickets
 * Gestiona las llamadas API para tickets abiertos de citas subsecuentes
 */

import { api } from './api';
import type { Cita } from '../types';

export interface OpenTicket {
  id: string;
  codigo: string;
  pacienteId: string;
  sucursalId: string;
  tipoConsulta: 'Subsecuente';
  especialidad: string;
  medicoPreferido?: string;
  fechaEmision: Date;
  fechaValidoDesde: Date;
  fechaValidoHasta: Date;
  diasValidez: number;
  estado: 'Activo' | 'Utilizado' | 'Expirado' | 'Cancelado';
  fechaUtilizado?: Date;
  citaGeneradaId?: string;
  horaLlegada?: Date;
  citaOrigenId: string;
  motivoConsultaAnterior?: string;
  diagnosticoAnterior?: string;
  tratamientoIndicado?: string;
  costoEstimado: number;
  requierePago: boolean;
  encuestaCompletada: boolean;
  calificacionAtencion?: number;
  comentariosEncuesta?: string;
  creadoPor: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
  notas?: string;
}

export interface CrearOpenTicketRequest {
  pacienteId: string;
  sucursalId: string;
  especialidad: string;
  medicoPreferido?: string;
  citaOrigenId: string;
  diasValidez?: number;
  fechaValidoDesde?: Date;
  motivoConsultaAnterior?: string;
  diagnosticoAnterior?: string;
  tratamientoIndicado?: string;
  costoEstimado: number;
  requierePago?: boolean;
  notas?: string;
}

export interface ConvertirTicketRequest {
  medicoAsignado?: string;
  notas?: string;
}

export interface EncuestaSatisfaccionRequest {
  calificacionAtencion: number;
  calificacionMedico?: number;
  calificacionInstalaciones?: number;
  calificacionTiempoEspera?: number;
  recomendaria: boolean;
  comentarios?: string;
  aspectosPositivos?: string[];
  aspectosMejorar?: string[];
}

class OpenTicketService {
  
  /**
   * Crear un nuevo Open Ticket
   */
  async crear(data: CrearOpenTicketRequest): Promise<OpenTicket> {
    const response = await api.post('/open-tickets', data);
    return response.data.data;
  }

  /**
   * Obtener ticket por ID
   */
  async obtenerPorId(id: string): Promise<OpenTicket> {
    const response = await api.get(`/open-tickets/${id}`);
    return response.data.data;
  }

  /**
   * Obtener ticket por código
   */
  async obtenerPorCodigo(codigo: string): Promise<{
    ticket: OpenTicket;
    vigencia: { valido: boolean; razon?: string };
    diasRestantes: number;
  }> {
    const response = await api.get(`/open-tickets/codigo/${codigo}`);
    return response.data.data;
  }

  /**
   * Listar tickets con filtros
   */
  async listar(filtros?: {
    pacienteId?: string;
    sucursalId?: string;
    estado?: string;
    especialidad?: string;
    vigentes?: boolean;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<OpenTicket[]> {
    const params = new URLSearchParams();
    
    if (filtros?.pacienteId) params.append('pacienteId', filtros.pacienteId);
    if (filtros?.sucursalId) params.append('sucursalId', filtros.sucursalId);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.especialidad) params.append('especialidad', filtros.especialidad);
    if (filtros?.vigentes !== undefined) params.append('vigentes', String(filtros.vigentes));
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde.toISOString());
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta.toISOString());

    const response = await api.get(`/open-tickets?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Obtener tickets activos de un paciente
   */
  async obtenerTicketsActivosPaciente(pacienteId: string): Promise<OpenTicket[]> {
    const response = await api.get(`/open-tickets/paciente/${pacienteId}/activos`);
    return response.data.data;
  }

  /**
   * Convertir ticket a cita cuando llega el paciente
   */
  async convertirACita(ticketId: string, data: ConvertirTicketRequest): Promise<{
    cita: Cita;
    ticket: OpenTicket;
  }> {
    const response = await api.post(`/open-tickets/${ticketId}/convertir`, data);
    return response.data.data;
  }

  /**
   * Registrar encuesta de satisfacción
   */
  async registrarEncuesta(
    ticketId: string, 
    encuesta: EncuestaSatisfaccionRequest
  ): Promise<{
    ticket: OpenTicket;
    promedioCalificacion: number;
  }> {
    const response = await api.post(`/open-tickets/${ticketId}/encuesta`, encuesta);
    return response.data.data;
  }

  /**
   * Cancelar ticket
   */
  async cancelar(ticketId: string, motivo?: string): Promise<OpenTicket> {
    const response = await api.put(`/open-tickets/${ticketId}/cancelar`, { motivo });
    return response.data.data;
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(sucursalId?: string): Promise<{
    total: number;
    activos: number;
    utilizados: number;
    expirados: number;
    cancelados: number;
    con_encuesta: number;
    promedio_calificacion: number;
    promedio_dias_uso: number;
  }> {
    const params = sucursalId ? `?sucursalId=${sucursalId}` : '';
    const response = await api.get(`/open-tickets/estadisticas${params}`);
    return response.data.data;
  }

  /**
   * Calcular días restantes de un ticket
   */
  calcularDiasRestantes(ticket: OpenTicket): number {
    const ahora = new Date();
    const fechaHasta = new Date(ticket.fechaValidoHasta);
    const diferencia = fechaHasta.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Verificar si un ticket está vigente
   */
  estaVigente(ticket: OpenTicket): boolean {
    const ahora = new Date();
    const desde = new Date(ticket.fechaValidoDesde);
    const hasta = new Date(ticket.fechaValidoHasta);
    
    return (
      ticket.estado === 'Activo' &&
      ahora >= desde &&
      ahora <= hasta
    );
  }

  /**
   * Obtener color del estado
   */
  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'Activo':
        return 'green';
      case 'Utilizado':
        return 'blue';
      case 'Expirado':
        return 'red';
      case 'Cancelado':
        return 'gray';
      default:
        return 'gray';
    }
  }
}

export const openTicketService = new OpenTicketService();
