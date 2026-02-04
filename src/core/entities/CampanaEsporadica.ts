/**
 * Entidad: Campaña Esporádica
 * Representa una campaña de broadcast manual
 */

export type EstadoCampana = 
  | 'Borrador'
  | 'Programada'
  | 'En Progreso'
  | 'Completada'
  | 'Cancelada'
  | 'Fallida';

export type CanalCampana = 
  | 'WhatsApp'
  | 'Facebook'
  | 'Instagram'
  | 'SMS'
  | 'Email';

export type TipoAudiencia =
  | 'Todos'
  | 'Segmento'
  | 'Personalizada'
  | 'Importada';

export interface AudienciaCampana {
  tipo: TipoAudiencia;
  segmento?: 'Nunca atendido' | '1 vez' | 'Múltiples';
  sucursalIds?: string[];
  pacienteIds?: string[];
  filtros?: {
    edad?: { min?: number; max?: number };
    genero?: 'Masculino' | 'Femenino';
    ultimaCitaDesde?: Date;
    ultimaCitaHasta?: Date;
  };
}

export interface MensajeCampana {
  canal: CanalCampana;
  asunto?: string; // Para email
  contenido: string;
  mediaUrl?: string; // URL de imagen/video
  incluirNombre?: boolean; // Personalizar con nombre del paciente
  incluirPromocion?: boolean;
  codigoPromocion?: string;
}

export interface EstadisticasCampana {
  totalEnviados: number;
  totalEntregados: number;
  totalFallidos: number;
  totalLeidos: number;
  totalRespuestas: number;
  totalConversiones: number; // Citasagendadas
  tasaEntrega: number;
  tasaApertura: number;
  tasaRespuesta: number;
  tasaConversion: number;
}

export interface CampanaEsporadica {
  id: string;
  nombre: string;
  descripcion?: string;
  
  // Audiencia
  audiencia: AudienciaCampana;
  totalAudiencia: number;
  
  // Mensaje
  mensaje: MensajeCampana;
  
  // Programación
  fechaProgramada?: Date;
  fechaInicio?: Date;
  fechaFin?: Date;
  
  // Estado
  estado: EstadoCampana;
  progreso: number; // 0-100
  
  // Estadísticas
  estadisticas: EstadisticasCampana;
  
  // Metadata
  creadoPor: string;
  sucursalId?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

/**
 * Entidad con lógica de negocio
 */
export class CampanaEsporadicaEntity implements CampanaEsporadica {
  id: string;
  nombre: string;
  descripcion?: string;
  audiencia: AudienciaCampana;
  totalAudiencia: number;
  mensaje: MensajeCampana;
  fechaProgramada?: Date;
  fechaInicio?: Date;
  fechaFin?: Date;
  estado: EstadoCampana;
  progreso: number;
  estadisticas: EstadisticasCampana;
  creadoPor: string;
  sucursalId?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;

  constructor(data: CampanaEsporadica) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.audiencia = data.audiencia;
    this.totalAudiencia = data.totalAudiencia;
    this.mensaje = data.mensaje;
    this.fechaProgramada = data.fechaProgramada;
    this.fechaInicio = data.fechaInicio;
    this.fechaFin = data.fechaFin;
    this.estado = data.estado;
    this.progreso = data.progreso;
    this.estadisticas = data.estadisticas;
    this.creadoPor = data.creadoPor;
    this.sucursalId = data.sucursalId;
    this.fechaCreacion = data.fechaCreacion;
    this.ultimaActualizacion = data.ultimaActualizacion;
  }

  /**
   * Iniciar campaña
   */
  iniciar(): void {
    if (this.estado !== 'Programada' && this.estado !== 'Borrador') {
      throw new Error('Solo se pueden iniciar campañas en estado Borrador o Programada');
    }
    
    this.estado = 'En Progreso';
    this.fechaInicio = new Date();
    this.progreso = 0;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Actualizar progreso
   */
  actualizarProgreso(enviados: number, entregados: number, fallidos: number): void {
    this.estadisticas.totalEnviados = enviados;
    this.estadisticas.totalEntregados = entregados;
    this.estadisticas.totalFallidos = fallidos;
    
    this.progreso = this.totalAudiencia > 0 
      ? Math.round((enviados / this.totalAudiencia) * 100)
      : 0;
    
    // Calcular tasas
    if (enviados > 0) {
      this.estadisticas.tasaEntrega = (entregados / enviados) * 100;
    }
    
    this.ultimaActualizacion = new Date();
  }

  /**
   * Completar campaña
   */
  completar(): void {
    this.estado = 'Completada';
    this.fechaFin = new Date();
    this.progreso = 100;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Cancelar campaña
   */
  cancelar(): void {
    if (this.estado === 'Completada') {
      throw new Error('No se puede cancelar una campaña completada');
    }
    
    this.estado = 'Cancelada';
    this.fechaFin = new Date();
    this.ultimaActualizacion = new Date();
  }

  /**
   * Marcar como fallida
   */
  marcarFallida(): void {
    this.estado = 'Fallida';
    this.fechaFin = new Date();
    this.ultimaActualizacion = new Date();
  }

  /**
   * Programar campaña
   */
  programar(fecha: Date): void {
    if (this.estado !== 'Borrador') {
      throw new Error('Solo se pueden programar campañas en estado Borrador');
    }
    
    if (fecha <= new Date()) {
      throw new Error('La fecha programada debe ser futura');
    }
    
    this.estado = 'Programada';
    this.fechaProgramada = fecha;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Verificar si la campaña está lista para enviar
   */
  estaListaParaEnviar(): boolean {
    return this.estado === 'Programada' || this.estado === 'Borrador';
  }

  /**
   * Verificar si la campaña está en progreso
   */
  estaEnProgreso(): boolean {
    return this.estado === 'En Progreso';
  }

  /**
   * Verificar si la campaña está finalizada
   */
  estaFinalizada(): boolean {
    return ['Completada', 'Cancelada', 'Fallida'].includes(this.estado);
  }

  /**
   * Calcular ROI estimado
   */
  calcularROI(): number {
    const conversiones = this.estadisticas.totalConversiones;
    const costoEstimadoPorConversion = 500; // Valor promedio de una cita
    const ingresosEstimados = conversiones * costoEstimadoPorConversion;
    
    // Costo estimado: $0.50 por mensaje WhatsApp
    const costoEnvio = this.estadisticas.totalEnviados * 0.5;
    
    if (costoEnvio === 0) return 0;
    return ((ingresosEstimados - costoEnvio) / costoEnvio) * 100;
  }
}
