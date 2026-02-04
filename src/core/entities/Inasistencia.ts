/**
 * Entidad: Inasistencia
 * Gestiona los casos de no asistencia a citas y su seguimiento
 */

export type MotivoInasistencia = 
  | 'Economico'
  | 'Transporte'
  | 'Salud'
  | 'Olvido'
  | 'Competencia'
  | 'No_Responde'
  | 'Raza_Brava'
  | 'Otro';

export type EstadoSeguimiento =
  | 'Pendiente_Contacto'
  | 'En_Seguimiento'
  | 'Reagendada'
  | 'Perdido'
  | 'Bloqueado';

export interface CatalogoMotivo {
  motivo: MotivoInasistencia;
  descripcion: string;
  requiereRemarketing: boolean;
  diasEsperaRecontacto: number;
  prioridad: 'Alta' | 'Media' | 'Baja';
}

export interface Inasistencia {
  id: string;
  citaId: string;
  pacienteId: string;
  sucursalId: string;
  
  // Información de la inasistencia
  fechaCitaPerdida: Date;
  horaCitaPerdida: string;
  
  // Motivo y seguimiento
  motivo?: MotivoInasistencia;
  motivoDetalle?: string;
  estadoSeguimiento: EstadoSeguimiento;
  
  // Intentos de contacto
  intentosContacto: number;
  ultimoIntentoContacto?: Date;
  proximoIntentoContacto?: Date;
  notasContacto: string[];
  
  // Remarketing
  enListaRemarketing: boolean;
  fechaIngresoRemarketing?: Date;
  campaignRemarketing?: string;
  
  // Protocolo 7 días
  fechaLimiteRespuesta: Date; // 7 días después de la inasistencia
  marcadoComoPerdido: boolean;
  fechaMarcadoPerdido?: Date;
  
  // Bloqueo "raza brava"
  bloqueadoMarketing: boolean;
  motivoBloqueo?: string;
  fechaBloqueo?: Date;
  
  // Nueva cita agendada
  nuevaCitaId?: string;
  fechaReagendacion?: Date;
  
  // Metadata
  creadoPor: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

/**
 * Catálogo de motivos de inasistencia con configuración
 */
export const CATALOGO_MOTIVOS: CatalogoMotivo[] = [
  {
    motivo: 'Economico',
    descripcion: 'No cuenta con recursos económicos suficientes',
    requiereRemarketing: true,
    diasEsperaRecontacto: 2,
    prioridad: 'Alta'
  },
  {
    motivo: 'Transporte',
    descripcion: 'Problemas de transporte o movilidad',
    requiereRemarketing: true,
    diasEsperaRecontacto: 1,
    prioridad: 'Alta'
  },
  {
    motivo: 'Salud',
    descripcion: 'Problemas de salud que impidieron asistir',
    requiereRemarketing: true,
    diasEsperaRecontacto: 3,
    prioridad: 'Media'
  },
  {
    motivo: 'Olvido',
    descripcion: 'Olvidó la cita',
    requiereRemarketing: true,
    diasEsperaRecontacto: 1,
    prioridad: 'Alta'
  },
  {
    motivo: 'Competencia',
    descripcion: 'Se atendió en otra clínica',
    requiereRemarketing: false,
    diasEsperaRecontacto: 0,
    prioridad: 'Baja'
  },
  {
    motivo: 'No_Responde',
    descripcion: 'No responde llamadas ni mensajes',
    requiereRemarketing: true,
    diasEsperaRecontacto: 2,
    prioridad: 'Media'
  },
  {
    motivo: 'Raza_Brava',
    descripcion: 'Paciente conflictivo, grosero o amenazante',
    requiereRemarketing: false,
    diasEsperaRecontacto: 0,
    prioridad: 'Baja'
  },
  {
    motivo: 'Otro',
    descripcion: 'Otro motivo no especificado',
    requiereRemarketing: true,
    diasEsperaRecontacto: 2,
    prioridad: 'Media'
  }
];

export class InasistenciaEntity implements Inasistencia {
  id!: string;
  citaId!: string;
  pacienteId!: string;
  sucursalId!: string;
  fechaCitaPerdida!: Date;
  horaCitaPerdida!: string;
  motivo?: MotivoInasistencia;
  motivoDetalle?: string;
  estadoSeguimiento!: EstadoSeguimiento;
  intentosContacto!: number;
  ultimoIntentoContacto?: Date;
  proximoIntentoContacto?: Date;
  notasContacto!: string[];
  enListaRemarketing!: boolean;
  fechaIngresoRemarketing?: Date;
  campaignRemarketing?: string;
  fechaLimiteRespuesta!: Date;
  marcadoComoPerdido!: boolean;
  fechaMarcadoPerdido?: Date;
  bloqueadoMarketing!: boolean;
  motivoBloqueo?: string;
  fechaBloqueo?: Date;
  nuevaCitaId?: string;
  fechaReagendacion?: Date;
  creadoPor!: string;
  fechaCreacion!: Date;
  ultimaActualizacion!: Date;

  constructor(data: Inasistencia) {
    Object.assign(this, data);
    
    // Si no tiene fecha límite, calcularla (7 días)
    if (!this.fechaLimiteRespuesta) {
      this.calcularFechaLimite();
    }
    
    // Verificar si debe marcarse como perdido
    this.verificarProtocoloPerdido();
  }

  /**
   * Calcula la fecha límite de respuesta (7 días después de la inasistencia)
   */
  private calcularFechaLimite(): void {
    const limite = new Date(this.fechaCitaPerdida);
    limite.setDate(limite.getDate() + 7);
    this.fechaLimiteRespuesta = limite;
  }

  /**
   * Verifica si se cumplió el protocolo de 7 días sin respuesta
   */
  verificarProtocoloPerdido(): boolean {
    const ahora = new Date();
    if (ahora > this.fechaLimiteRespuesta && !this.marcadoComoPerdido) {
      this.marcarComoPerdido('Protocolo 7 días sin respuesta');
      return true;
    }
    return false;
  }

  /**
   * Registra un intento de contacto
   */
  registrarIntentoContacto(nota: string): void {
    this.intentosContacto++;
    this.ultimoIntentoContacto = new Date();
    this.notasContacto.push(`[${new Date().toISOString()}] ${nota}`);
    
    // Calcular próximo intento según el motivo
    if (this.motivo) {
      const catalogo = CATALOGO_MOTIVOS.find(c => c.motivo === this.motivo);
      if (catalogo && catalogo.diasEsperaRecontacto > 0) {
        const proximo = new Date();
        proximo.setDate(proximo.getDate() + catalogo.diasEsperaRecontacto);
        this.proximoIntentoContacto = proximo;
      }
    }
    
    this.estadoSeguimiento = 'En_Seguimiento';
    this.ultimaActualizacion = new Date();
  }

  /**
   * Asigna un motivo de inasistencia
   */
  asignarMotivo(motivo: MotivoInasistencia, detalle?: string): void {
    this.motivo = motivo;
    this.motivoDetalle = detalle;
    
    const catalogo = CATALOGO_MOTIVOS.find(c => c.motivo === motivo);
    
    if (catalogo) {
      // Agregar a remarketing si aplica
      if (catalogo.requiereRemarketing) {
        this.agregarARemarketing();
      }
      
      // Bloquear si es "raza brava"
      if (motivo === 'Raza_Brava') {
        this.bloquearMarketing('Paciente clasificado como raza brava - comportamiento inapropiado');
      }
      
      // Calcular próximo intento
      if (catalogo.diasEsperaRecontacto > 0) {
        const proximo = new Date();
        proximo.setDate(proximo.getDate() + catalogo.diasEsperaRecontacto);
        this.proximoIntentoContacto = proximo;
      }
    }
    
    this.ultimaActualizacion = new Date();
  }

  /**
   * Agrega el paciente a la lista de remarketing
   */
  agregarARemarketing(): void {
    if (!this.bloqueadoMarketing) {
      this.enListaRemarketing = true;
      this.fechaIngresoRemarketing = new Date();
      this.campaignRemarketing = `RECOVERY_${this.motivo || 'GENERAL'}`;
      this.ultimaActualizacion = new Date();
    }
  }

  /**
   * Remueve el paciente de la lista de remarketing
   */
  removerDeRemarketing(): void {
    this.enListaRemarketing = false;
    this.ultimaActualizacion = new Date();
  }

  /**
   * Marca al paciente como perdido
   */
  marcarComoPerdido(razon: string): void {
    this.marcadoComoPerdido = true;
    this.fechaMarcadoPerdido = new Date();
    this.estadoSeguimiento = 'Perdido';
    this.removerDeRemarketing();
    this.notasContacto.push(`[${new Date().toISOString()}] MARCADO COMO PERDIDO: ${razon}`);
    this.ultimaActualizacion = new Date();
  }

  /**
   * Bloquea al paciente de recibir marketing (raza brava)
   */
  bloquearMarketing(motivo: string): void {
    this.bloqueadoMarketing = true;
    this.motivoBloqueo = motivo;
    this.fechaBloqueo = new Date();
    this.estadoSeguimiento = 'Bloqueado';
    this.removerDeRemarketing();
    this.notasContacto.push(`[${new Date().toISOString()}] BLOQUEADO DE MARKETING: ${motivo}`);
    this.ultimaActualizacion = new Date();
  }

  /**
   * Registra que se reagendó una nueva cita
   */
  registrarReagendacion(nuevaCitaId: string): void {
    this.nuevaCitaId = nuevaCitaId;
    this.fechaReagendacion = new Date();
    this.estadoSeguimiento = 'Reagendada';
    this.removerDeRemarketing();
    this.notasContacto.push(`[${new Date().toISOString()}] REAGENDADA - Nueva cita: ${nuevaCitaId}`);
    this.ultimaActualizacion = new Date();
  }

  /**
   * Obtiene el estado del seguimiento
   */
  obtenerEstadoSeguimiento(): {
    estado: EstadoSeguimiento;
    diasDesdeInasistencia: number;
    diasRestantesLimite: number;
    requiereAccion: boolean;
    mensaje: string;
  } {
    const ahora = new Date();
    const diasDesde = Math.floor((ahora.getTime() - this.fechaCitaPerdida.getTime()) / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.floor((this.fechaLimiteRespuesta.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    
    let requiereAccion = false;
    let mensaje = '';
    
    if (this.estadoSeguimiento === 'Bloqueado') {
      mensaje = 'Paciente bloqueado - No contactar';
    } else if (this.estadoSeguimiento === 'Perdido') {
      mensaje = 'Paciente perdido - Protocolo 7 días cumplido';
    } else if (this.estadoSeguimiento === 'Reagendada') {
      mensaje = 'Paciente recuperado - Nueva cita agendada';
    } else if (diasRestantes <= 0) {
      mensaje = 'URGENTE: Límite de 7 días cumplido - Marcar como perdido';
      requiereAccion = true;
    } else if (diasRestantes <= 2) {
      mensaje = `ALERTA: Quedan ${diasRestantes} días para marcar como perdido`;
      requiereAccion = true;
    } else if (this.proximoIntentoContacto && ahora >= this.proximoIntentoContacto) {
      mensaje = 'Requiere nuevo intento de contacto';
      requiereAccion = true;
    } else {
      mensaje = `En seguimiento - ${diasRestantes} días restantes`;
    }
    
    return {
      estado: this.estadoSeguimiento,
      diasDesdeInasistencia: diasDesde,
      diasRestantesLimite: diasRestantes,
      requiereAccion,
      mensaje
    };
  }

  /**
   * Verifica si el paciente está bloqueado
   */
  estaBloqueado(): boolean {
    return this.bloqueadoMarketing;
  }

  /**
   * Verifica si está en remarketing
   */
  estaEnRemarketing(): boolean {
    return this.enListaRemarketing && !this.bloqueadoMarketing;
  }

  /**
   * Obtiene la configuración del motivo
   */
  obtenerConfigMotivo(): CatalogoMotivo | undefined {
    if (!this.motivo) return undefined;
    return CATALOGO_MOTIVOS.find(c => c.motivo === this.motivo);
  }
}
