import { DOCTORES } from './doctores-data';

export interface HorarioDoctor {
  doctorId: string;
  diaSemana: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  horaInicio: string; // "09:00"
  horaFin: string; // "18:00"
  sucursal: string;
  tiempoConsultaMinutos: number;
  descansoInicio?: string; // "13:00" - Hora de comida
  descansoFin?: string; // "14:00"
  activo: boolean;
}

export interface AusenciaDoctor {
  id: string;
  doctorId: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipoAusencia: 'Vacaciones' | 'Permiso' | 'Incapacidad' | 'Capacitacion' | 'Otro';
  motivo?: string;
  doctorSustituto?: string;
  aprobada: boolean;
}

export interface DiaFestivo {
  fecha: Date;
  nombre: string;
  tipo: 'Federal' | 'Opcional' | 'Religioso';
  esRecurrente: boolean; // Si se repite cada año
}

// Días festivos oficiales de México 2026
export const DIAS_FESTIVOS_2026: DiaFestivo[] = [
  { fecha: new Date(2026, 0, 1), nombre: 'Año Nuevo', tipo: 'Federal', esRecurrente: true },
  { fecha: new Date(2026, 1, 2), nombre: 'Día de la Constitución (primer lunes)', tipo: 'Federal', esRecurrente: false },
  { fecha: new Date(2026, 2, 16), nombre: 'Natalicio de Benito Juárez (tercer lunes)', tipo: 'Federal', esRecurrente: false },
  { fecha: new Date(2026, 4, 1), nombre: 'Día del Trabajo', tipo: 'Federal', esRecurrente: true },
  { fecha: new Date(2026, 8, 16), nombre: 'Día de la Independencia', tipo: 'Federal', esRecurrente: true },
  { fecha: new Date(2026, 10, 16), nombre: 'Día de la Revolución (tercer lunes)', tipo: 'Federal', esRecurrente: false },
  { fecha: new Date(2026, 11, 25), nombre: 'Navidad', tipo: 'Federal', esRecurrente: true },
  // Días opcionales comunes
  { fecha: new Date(2026, 1, 14), nombre: 'Día del Amor y la Amistad', tipo: 'Opcional', esRecurrente: true },
  { fecha: new Date(2026, 4, 10), nombre: 'Día de las Madres', tipo: 'Opcional', esRecurrente: true },
  { fecha: new Date(2026, 10, 2), nombre: 'Día de Muertos', tipo: 'Religioso', esRecurrente: true },
  { fecha: new Date(2026, 11, 12), nombre: 'Día de la Virgen de Guadalupe', tipo: 'Religioso', esRecurrente: true },
];

// Horarios por defecto de doctores (estos deberían venir de la BD)
export const HORARIOS_DOCTORES: HorarioDoctor[] = [
  // Edni González - Odontólogo Ciudad Juárez
  ...generarHorariosSemana('doc-1', [1, 2, 3, 4, 5], '09:00', '18:00', 'Ciudad Juárez', 45, '13:00', '14:00'),
  
  // Iván Oros - Oftalmólogo Ciudad Juárez
  ...generarHorariosSemana('doc-2', [1, 2, 3, 4, 5], '08:00', '17:00', 'Ciudad Juárez', 30, '14:00', '15:00'),
  
  // Dra. Tirsa - Medicina General
  ...generarHorariosSemana('doc-3', [1, 2, 3, 4, 5, 6], '08:00', '14:00', 'General', 30),
  
  // Yamila Arredondo - Medicina Virtual
  ...generarHorariosSemana('doc-4', [1, 2, 3, 4, 5], '10:00', '20:00', 'Clínica Adventista Virtual', 30, '14:00', '15:00'),
  
  // Aslysh Aboyte - Odontóloga Ciudad Obregón
  ...generarHorariosSemana('doc-5', [1, 2, 3, 4, 5, 6], '09:00', '17:00', 'Ciudad Obregón', 45, '13:00', '14:00'),
  
  // Lidia Miranda - Psicóloga Virtual
  ...generarHorariosSemana('doc-6', [1, 2, 3, 4, 5], '11:00', '19:00', 'Clínica Adventista Virtual', 60),
  
  // Daniel Balderas - Odontólogo Ciudad Obregón
  ...generarHorariosSemana('doc-7', [1, 3, 5], '08:00', '18:00', 'Ciudad Obregón', 45, '13:00', '14:00'),
  
  // Alejandro Vargas - Oftalmólogo Ciudad Obregón
  ...generarHorariosSemana('doc-8', [2, 4, 6], '08:00', '16:00', 'Ciudad Obregón', 30, '12:00', '13:00'),
  
  // Adriana Moreno - Odontóloga Ciudad Obregón
  ...generarHorariosSemana('doc-9', [1, 2, 3, 4, 5], '14:00', '20:00', 'Ciudad Obregón', 45),
  
  // Alexis Colleti - Retinólogo Ciudad Obregón
  ...generarHorariosSemana('doc-10', [1, 3, 5], '09:00', '15:00', 'Ciudad Obregón', 45, '12:00', '13:00'),
  
  // Gregorio Pérez - Odontólogo Loreto Héroes
  ...generarHorariosSemana('doc-11', [1, 2, 3, 4, 5, 6], '08:00', '16:00', 'Loreto Héroes', 45, '12:00', '13:00'),
  
  // Gladys López - Odontóloga Loreto Héroes
  ...generarHorariosSemana('doc-12', [1, 2, 3, 4, 5], '10:00', '18:00', 'Loreto Héroes', 45, '14:00', '15:00'),
  
  // Nancy Grijalva - Odontóloga Loreto Centro
  ...generarHorariosSemana('doc-13', [1, 2, 3, 4, 5, 6], '09:00', '17:00', 'Loreto Centro', 45, '13:00', '14:00'),
  
  // Dr. José Ricardo Espinoza - Oftalmología
  ...generarHorariosSemana('doc-14', [1, 2, 3, 4, 5], '08:00', '16:00', 'General', 30, '12:00', '13:00'),
  
  // Fernanda Mendoza - Odontóloga Ciudad Obregón
  ...generarHorariosSemana('doc-15', [2, 4, 6], '09:00', '17:00', 'Ciudad Obregón', 45, '13:00', '14:00'),
  
  // Rubén Mexía - Odontólogo Ciudad Obregón
  ...generarHorariosSemana('doc-16', [1, 3, 5], '08:00', '16:00', 'Ciudad Obregón', 45, '12:00', '13:00'),
  
  // Samseri Sandoval - Optometrista Ciudad Juárez
  ...generarHorariosSemana('doc-17', [1, 2, 3, 4, 5], '10:00', '18:00', 'Ciudad Juárez', 30, '14:00', '15:00'),
  
  // Stephania Vélez - Nutrióloga Ciudad Obregón
  ...generarHorariosSemana('doc-18', [1, 2, 3, 4, 5], '09:00', '17:00', 'Ciudad Obregón', 60, '13:00', '14:00'),
  
  // Eliasib Pérez - Ortodoncista Ciudad Obregón
  ...generarHorariosSemana('doc-19', [2, 4, 6], '10:00', '19:00', 'Ciudad Obregón', 60, '14:00', '15:00'),
  
  // Iván Ornelas - Oftalmólogo Ciudad Juárez
  ...generarHorariosSemana('doc-20', [1, 2, 3, 4, 5], '08:00', '16:00', 'Ciudad Juárez', 30, '12:00', '13:00'),
  
  // Missael Fuentes - Pastor Ciudad Juárez
  ...generarHorariosSemana('doc-21', [6, 0], '09:00', '14:00', 'Ciudad Juárez', 60),
  
  // Swwlet Abigail Barrientos - Psicóloga Ciudad Juárez
  ...generarHorariosSemana('doc-22', [1, 3, 5], '15:00', '20:00', 'Ciudad Juárez', 60),
  
  // Miguel Ahumada - Odontólogo Ciudad Obregón
  ...generarHorariosSemana('doc-23', [1, 2, 3, 4, 5], '08:00', '16:00', 'Ciudad Obregón', 45, '12:00', '13:00'),
  
  // Claudia Córdova - Psicóloga Ciudad Juárez
  ...generarHorariosSemana('doc-24', [2, 4, 6], '10:00', '18:00', 'Ciudad Juárez', 60, '14:00', '15:00'),
];

// Ausencias demo
export const AUSENCIAS_DOCTORES: AusenciaDoctor[] = [
  {
    id: 'aus-1',
    doctorId: 'doc-1',
    fechaInicio: new Date(2026, 1, 10),
    fechaFin: new Date(2026, 1, 14),
    tipoAusencia: 'Vacaciones',
    motivo: 'Vacaciones familiares',
    aprobada: true
  },
  {
    id: 'aus-2',
    doctorId: 'doc-5',
    fechaInicio: new Date(2026, 1, 20),
    fechaFin: new Date(2026, 1, 27),
    tipoAusencia: 'Capacitacion',
    motivo: 'Congreso de odontología',
    aprobada: true
  },
];

// Función helper para generar horarios de semana
function generarHorariosSemana(
  doctorId: string,
  dias: number[],
  horaInicio: string,
  horaFin: string,
  sucursal: string,
  tiempoConsulta: number,
  descansoInicio?: string,
  descansoFin?: string
): HorarioDoctor[] {
  return dias.map(dia => ({
    doctorId,
    diaSemana: dia,
    horaInicio,
    horaFin,
    sucursal,
    tiempoConsultaMinutos: tiempoConsulta,
    descansoInicio,
    descansoFin,
    activo: true
  }));
}

// Utilidades para validación de disponibilidad

export function obtenerHorarioDoctor(doctorId: string, fecha: Date): HorarioDoctor | null {
  const diaSemana = fecha.getDay();
  return HORARIOS_DOCTORES.find(
    h => h.doctorId === doctorId && h.diaSemana === diaSemana && h.activo
  ) || null;
}

export function doctorTrabajaEsteDia(doctorId: string, fecha: Date): boolean {
  return obtenerHorarioDoctor(doctorId, fecha) !== null;
}

export function esDiaFestivo(fecha: Date): DiaFestivo | null {
  return DIAS_FESTIVOS_2026.find(festivo => 
    festivo.fecha.toDateString() === fecha.toDateString()
  ) || null;
}

export function doctorEstaAusente(doctorId: string, fecha: Date): AusenciaDoctor | null {
  return AUSENCIAS_DOCTORES.find(ausencia => {
    const fechaSinHora = new Date(fecha);
    fechaSinHora.setHours(0, 0, 0, 0);
    
    const inicioSinHora = new Date(ausencia.fechaInicio);
    inicioSinHora.setHours(0, 0, 0, 0);
    
    const finSinHora = new Date(ausencia.fechaFin);
    finSinHora.setHours(23, 59, 59, 999);
    
    return ausencia.doctorId === doctorId && 
           ausencia.aprobada &&
           fechaSinHora >= inicioSinHora && 
           fechaSinHora <= finSinHora;
  }) || null;
}

export function horaEstaEnHorarioLaboral(doctorId: string, fecha: Date, hora: string): boolean {
  const horario = obtenerHorarioDoctor(doctorId, fecha);
  if (!horario) return false;
  
  const horaNum = parseInt(hora.split(':')[0]);
  const minutoNum = parseInt(hora.split(':')[1] || '0');
  const horaDecimal = horaNum + (minutoNum / 60);
  
  const inicioDecimal = parseInt(horario.horaInicio.split(':')[0]) + (parseInt(horario.horaInicio.split(':')[1] || '0') / 60);
  const finDecimal = parseInt(horario.horaFin.split(':')[0]) + (parseInt(horario.horaFin.split(':')[1] || '0') / 60);
  
  // Verificar si está en horario laboral
  if (horaDecimal < inicioDecimal || horaDecimal >= finDecimal) return false;
  
  // Verificar si está en descanso
  if (horario.descansoInicio && horario.descansoFin) {
    const descansoInicioDecimal = parseInt(horario.descansoInicio.split(':')[0]) + (parseInt(horario.descansoInicio.split(':')[1] || '0') / 60);
    const descansoFinDecimal = parseInt(horario.descansoFin.split(':')[0]) + (parseInt(horario.descansoFin.split(':')[1] || '0') / 60);
    
    if (horaDecimal >= descansoInicioDecimal && horaDecimal < descansoFinDecimal) return false;
  }
  
  return true;
}

export function validarDisponibilidadDoctor(
  doctorId: string, 
  fecha: Date, 
  hora: string
): { disponible: boolean; motivo?: string } {
  // 1. Verificar día festivo
  const festivo = esDiaFestivo(fecha);
  if (festivo && festivo.tipo === 'Federal') {
    return { disponible: false, motivo: `Día festivo: ${festivo.nombre}` };
  }
  
  // 2. Verificar si el doctor trabaja este día
  if (!doctorTrabajaEsteDia(doctorId, fecha)) {
    return { disponible: false, motivo: 'El doctor no trabaja este día' };
  }
  
  // 3. Verificar ausencias
  const ausencia = doctorEstaAusente(doctorId, fecha);
  if (ausencia) {
    return { 
      disponible: false, 
      motivo: `${ausencia.tipoAusencia}: ${ausencia.motivo || 'No disponible'}` 
    };
  }
  
  // 4. Verificar horario laboral
  if (!horaEstaEnHorarioLaboral(doctorId, fecha, hora)) {
    return { disponible: false, motivo: 'Fuera del horario laboral del doctor' };
  }
  
  return { disponible: true };
}

export function obtenerHorasDisponibles(doctorId: string, fecha: Date): string[] {
  const horario = obtenerHorarioDoctor(doctorId, fecha);
  if (!horario) return [];
  
  const horas: string[] = [];
  const inicio = parseInt(horario.horaInicio.split(':')[0]);
  const fin = parseInt(horario.horaFin.split(':')[0]);
  const intervalo = horario.tiempoConsultaMinutos;
  
  for (let h = inicio; h < fin; h++) {
    for (let m = 0; m < 60; m += intervalo) {
      const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const validacion = validarDisponibilidadDoctor(doctorId, fecha, horaStr);
      if (validacion.disponible) {
        horas.push(horaStr);
      }
    }
  }
  
  return horas;
}

export function obtenerDiasNoDisponibles(doctorId: string, mes: number, año: number): Date[] {
  const diasNoDisponibles: Date[] = [];
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  
  for (let d = new Date(primerDia); d <= ultimoDia; d.setDate(d.getDate() + 1)) {
    const fecha = new Date(d);
    if (!doctorTrabajaEsteDia(doctorId, fecha) || 
        doctorEstaAusente(doctorId, fecha) ||
        (esDiaFestivo(fecha)?.tipo === 'Federal')) {
      diasNoDisponibles.push(new Date(fecha));
    }
  }
  
  return diasNoDisponibles;
}
