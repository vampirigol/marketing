export type TipoEvento = 'reunion' | 'evento' | 'capacitacion' | 'recordatorio' | 'otro';
export type TipoCalendario = 'personal' | 'compania';

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: TipoEvento;
  calendario: TipoCalendario;
  sucursalId?: string;
  creadoPorId?: string;
  creadoPorNombre?: string;
  ubicacion?: string;
  esTodoElDia: boolean;
  esPrivado: boolean;
  color: string;
  participantes: Array<{ id?: string; nombre: string; email?: string }>;
  recordatorioMinutos?: number;
  citaId?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

/** Item unificado para la vista: cita médica o evento de calendario */
export type ItemCalendario =
  | { tipo: 'cita'; id: string; titulo: string; inicio: Date; fin: Date; color: string; raw: any }
  | { tipo: 'evento'; id: string; titulo: string; inicio: Date; fin: Date; color: string; raw: EventoCalendario };
