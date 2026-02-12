/**
 * Tipos alineados al "INFORME REGISTRO BRIGADA MEDICA" (Excel).
 * Los KPIs y datos se filtran por brigada.
 */

export interface Brigada {
  id: string;
  nombre: string;
  ubicacion: string;
  ciudad: string;
  fechaInicio: string;
  fechaFin?: string;
  estado: 'planificada' | 'en_curso' | 'finalizada';
}

/** Resumen de KPIs por brigada (calculado desde registros de atención) */
export interface ResumenBrigada {
  brigadaId: string;
  totalAtendidos: number;
  /** Pacientes por especialidad (P_INTEGRAL, P_OFTALMOLOGIA, etc.) */
  porEspecialidad: {
    medicinaIntegral: number;
    oftalmologia: number;
    fisioterapia: number;
    nutricion: number;
    psicologia: number;
    espirituales: number;
  };
  /** Odontología: desglose */
  odontologia: {
    consultas: number;
    extracciones: number;
    resinas: number;
    profilaxis: number;
    endodoncia: number;
  };
  /** Oftalmología: desglose */
  oftalmologiaDesglose: {
    pacientes: number;
    lentesEntregados: number;
    valoraciones: number;
  };
  fisioterapiaTerapias: number;
  nutricionConsultas: number;
  /** Demográficos */
  rangoEdad: string;
  /** Opcional: distribución por sexo */
  porSexo?: { masculino: number; femenino: number; otro?: number };
}
