/**
 * Caso de Uso: Segmentar Pacientes
 * Clasifica pacientes en: "Nunca atendido", "1 vez", "Múltiples"
 */

import { Paciente } from '../entities/Paciente';

export type SegmentoPaciente = 
  | 'Nunca atendido'    // 0 citas atendidas
  | '1 vez'              // 1 cita atendida
  | 'Múltiples';         // 2+ citas atendidas

export interface PacienteSegmentado extends Paciente {
  segmento: SegmentoPaciente;
  totalCitasAtendidas: number;
  ultimaCitaAtendida?: Date;
  valorVida?: number; // Total gastado
}

export interface EstadisticasSegmentacion {
  nuncaAtendido: {
    total: number;
    porcentaje: number;
    pacientes: PacienteSegmentado[];
  };
  unaVez: {
    total: number;
    porcentaje: number;
    pacientes: PacienteSegmentado[];
  };
  multiples: {
    total: number;
    porcentaje: number;
    pacientes: PacienteSegmentado[];
  };
  totalPacientes: number;
}

export interface ICitaRepository {
  obtenerCitasAtendidasPorPaciente(pacienteId: string): Promise<any[]>;
}

export interface IAbonoRepository {
  obtenerTotalPorPaciente(pacienteId: string): Promise<number>;
}

export class SegmentarPacientesUseCase {
  constructor(
    private citaRepository: ICitaRepository,
    private abonoRepository: IAbonoRepository
  ) {}

  /**
   * Determina el segmento de un paciente
   */
  private determinarSegmento(totalCitasAtendidas: number): SegmentoPaciente {
    if (totalCitasAtendidas === 0) return 'Nunca atendido';
    if (totalCitasAtendidas === 1) return '1 vez';
    return 'Múltiples';
  }

  /**
   * Segmenta un solo paciente
   */
  async segmentarPaciente(paciente: Paciente): Promise<PacienteSegmentado> {
    // Obtener citas atendidas
    const citasAtendidas = await this.citaRepository.obtenerCitasAtendidasPorPaciente(paciente.id);
    const totalCitasAtendidas = citasAtendidas.length;

    // Determinar segmento
    const segmento = this.determinarSegmento(totalCitasAtendidas);

    // Última cita atendida
    const ultimaCitaAtendida = citasAtendidas.length > 0
      ? new Date(citasAtendidas[citasAtendidas.length - 1].fechaCita)
      : undefined;

    // Valor de vida del paciente
    const valorVida = await this.abonoRepository.obtenerTotalPorPaciente(paciente.id);

    return {
      ...paciente,
      segmento,
      totalCitasAtendidas,
      ultimaCitaAtendida,
      valorVida
    };
  }

  /**
   * Segmenta una lista de pacientes
   */
  async segmentarLista(pacientes: Paciente[]): Promise<PacienteSegmentado[]> {
    const segmentados = await Promise.all(
      pacientes.map(p => this.segmentarPaciente(p))
    );
    return segmentados;
  }

  /**
   * Obtiene estadísticas de segmentación
   */
  async obtenerEstadisticas(pacientes: Paciente[]): Promise<EstadisticasSegmentacion> {
    const segmentados = await this.segmentarLista(pacientes);
    const totalPacientes = segmentados.length;

    // Agrupar por segmento
    const nuncaAtendido = segmentados.filter(p => p.segmento === 'Nunca atendido');
    const unaVez = segmentados.filter(p => p.segmento === '1 vez');
    const multiples = segmentados.filter(p => p.segmento === 'Múltiples');

    return {
      nuncaAtendido: {
        total: nuncaAtendido.length,
        porcentaje: totalPacientes > 0 ? (nuncaAtendido.length / totalPacientes) * 100 : 0,
        pacientes: nuncaAtendido
      },
      unaVez: {
        total: unaVez.length,
        porcentaje: totalPacientes > 0 ? (unaVez.length / totalPacientes) * 100 : 0,
        pacientes: unaVez
      },
      multiples: {
        total: multiples.length,
        porcentaje: totalPacientes > 0 ? (multiples.length / totalPacientes) * 100 : 0,
        pacientes: multiples
      },
      totalPacientes
    };
  }

  /**
   * Filtra pacientes por segmento
   */
  async filtrarPorSegmento(
    pacientes: Paciente[],
    segmento: SegmentoPaciente
  ): Promise<PacienteSegmentado[]> {
    const segmentados = await this.segmentarLista(pacientes);
    return segmentados.filter(p => p.segmento === segmento);
  }

  /**
   * Obtiene pacientes de alto valor (Múltiples + alto valor de vida)
   */
  async obtenerPacientesAltoValor(
    pacientes: Paciente[],
    umbralValor: number = 5000
  ): Promise<PacienteSegmentado[]> {
    const segmentados = await this.segmentarLista(pacientes);
    return segmentados
      .filter(p => p.segmento === 'Múltiples' && (p.valorVida || 0) >= umbralValor)
      .sort((a, b) => (b.valorVida || 0) - (a.valorVida || 0));
  }

  /**
   * Obtiene pacientes en riesgo de abandono
   * (Tienen 1 cita pero no han regresado en los últimos 6 meses)
   */
  async obtenerPacientesRiesgoAbandono(
    pacientes: Paciente[],
    mesesSinCita: number = 6
  ): Promise<PacienteSegmentado[]> {
    const segmentados = await this.segmentarLista(pacientes);
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - mesesSinCita);

    return segmentados.filter(p => {
      if (p.segmento !== '1 vez') return false;
      if (!p.ultimaCitaAtendida) return false;
      return p.ultimaCitaAtendida < fechaLimite;
    });
  }

  /**
   * Obtiene leads fríos (nunca han sido atendidos y han pasado más de X días)
   */
  async obtenerLeadsFrios(
    pacientes: Paciente[],
    diasDesdeRegistro: number = 30
  ): Promise<PacienteSegmentado[]> {
    const segmentados = await this.segmentarLista(pacientes);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasDesdeRegistro);

    return segmentados.filter(p => {
      if (p.segmento !== 'Nunca atendido') return false;
      const fechaRegistro = new Date(p.fechaRegistro);
      return fechaRegistro < fechaLimite;
    });
  }
}
