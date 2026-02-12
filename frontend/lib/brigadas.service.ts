import { api } from './api';
import type { Brigada } from '@/types/brigadas';
import * as XLSX from 'xlsx';

export interface BrigadaApi {
  id: string;
  nombre: string;
  ubicacion: string | null;
  ciudad: string;
  estado_brigada: 'planificada' | 'en_curso' | 'finalizada';
  fecha_inicio: string;
  fecha_fin: string | null;
  sucursal_id: string | null;
  observaciones: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

function mapToBrigada(row: BrigadaApi): Brigada {
  return {
    id: row.id,
    nombre: row.nombre,
    ubicacion: row.ubicacion ?? '',
    ciudad: row.ciudad,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin ?? undefined,
    estado: row.estado_brigada,
  };
}

export async function obtenerBrigadas(): Promise<Brigada[]> {
  const { data } = await api.get<{ success: boolean; brigadas: BrigadaApi[] }>('/brigadas');
  return (data.brigadas ?? []).map(mapToBrigada);
}

export async function obtenerBrigadaPorId(id: string): Promise<Brigada | null> {
  try {
    const { data } = await api.get<{ success: boolean; brigada: BrigadaApi }>(`/brigadas/${id}`);
    return data.brigada ? mapToBrigada(data.brigada) : null;
  } catch {
    return null;
  }
}

export interface CrearBrigadaInput {
  nombre: string;
  ciudad: string;
  fecha_inicio: string;
  ubicacion?: string;
  fecha_fin?: string;
  estado_brigada?: 'planificada' | 'en_curso' | 'finalizada';
  sucursal_id?: string;
  observaciones?: string;
}

export async function crearBrigada(input: CrearBrigadaInput): Promise<Brigada> {
  const { data } = await api.post<{ success: boolean; brigada: BrigadaApi }>('/brigadas', input);
  return mapToBrigada(data.brigada);
}

export interface ActualizarBrigadaInput {
  nombre?: string;
  ciudad?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  ubicacion?: string;
  estado_brigada?: 'planificada' | 'en_curso' | 'finalizada';
  sucursal_id?: string | null;
  observaciones?: string | null;
}

export async function actualizarBrigada(id: string, input: ActualizarBrigadaInput): Promise<Brigada> {
  const { data } = await api.put<{ success: boolean; brigada: BrigadaApi }>(`/brigadas/${id}`, input);
  return mapToBrigada(data.brigada);
}

export async function eliminarBrigada(id: string): Promise<void> {
  await api.delete(`/brigadas/${id}`);
}

// --- Atenciones ---
export interface AtencionApi {
  id: string;
  brigada_id: string;
  fecha: string;
  hora: string | null;
  ubicacion: string | null;
  medico: string | null;
  paciente_id: string | null;
  paciente_nombre: string;
  edad: number | null;
  sexo: string | null;
  domicilio: string | null;
  codigo_postal: string | null;
  localidad: string | null;
  colonia: string | null;
  tipo_sangre: string | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  ta: string | null;
  temp: number | null;
  fc: number | null;
  fr: number | null;
  glu: number | null;
  especialidad: string;
  servicio: string | null;
  lentes_entregados: boolean;
  diagnostico: string | null;
  receta: string | null;
  medicamentos_entregados: string | null;
  observaciones: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Atencion {
  id: string;
  brigadaId: string;
  fecha: string;
  hora: string | null;
  pacienteNombre: string;
  edad: number | null;
  sexo: string | null;
  especialidad: string;
  servicio: string | null;
  medico: string | null;
  localidad: string | null;
  colonia: string | null;
  lentesEntregados: boolean;
  observaciones: string | null;
}

function mapToAtencion(row: AtencionApi): Atencion {
  return {
    id: row.id,
    brigadaId: row.brigada_id,
    fecha: row.fecha,
    hora: row.hora,
    pacienteNombre: row.paciente_nombre,
    edad: row.edad,
    sexo: row.sexo,
    especialidad: row.especialidad,
    servicio: row.servicio,
    medico: row.medico,
    localidad: row.localidad,
    colonia: row.colonia,
    lentesEntregados: row.lentes_entregados,
    observaciones: row.observaciones,
  };
}

export interface FiltrosBrigada {
  fecha_desde?: string;
  fecha_hasta?: string;
}

export async function obtenerAtenciones(
  brigadaId: string,
  filtros?: FiltrosBrigada
): Promise<Atencion[]> {
  const params = new URLSearchParams();
  if (filtros?.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
  if (filtros?.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
  const { data } = await api.get<{ success: boolean; atenciones: AtencionApi[] }>(
    `/brigadas/${brigadaId}/atenciones?${params.toString()}`
  );
  return (data.atenciones ?? []).map(mapToAtencion);
}

export async function obtenerResumenBrigada(
  brigadaId: string,
  filtros?: FiltrosBrigada
): Promise<import('@/types/brigadas').ResumenBrigada> {
  const params = new URLSearchParams();
  if (filtros?.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
  if (filtros?.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
  const { data } = await api.get<{ success: boolean; resumen: import('@/types/brigadas').ResumenBrigada }>(
    `/brigadas/${brigadaId}/resumen?${params.toString()}`
  );
  return data.resumen;
}

export interface CrearAtencionInput {
  fecha: string;
  hora?: string;
  paciente_nombre: string;
  edad?: number;
  sexo?: string;
  especialidad: string;
  servicio?: string;
  medico?: string;
  ubicacion?: string;
  localidad?: string;
  colonia?: string;
  domicilio?: string;
  codigo_postal?: string;
  lentes_entregados?: boolean;
  diagnostico?: string;
  observaciones?: string;
  medicamentos_entregados?: string;
  receta?: string;
}

export async function crearAtencion(brigadaId: string, input: CrearAtencionInput): Promise<Atencion> {
  const { data } = await api.post<{ success: boolean; atencion: AtencionApi }>(
    `/brigadas/${brigadaId}/atenciones`,
    input
  );
  return mapToAtencion(data.atencion);
}

export async function actualizarAtencion(
  brigadaId: string,
  atencionId: string,
  input: Partial<CrearAtencionInput>
): Promise<Atencion> {
  const { data } = await api.put<{ success: boolean; atencion: AtencionApi }>(
    `/brigadas/${brigadaId}/atenciones/${atencionId}`,
    input
  );
  return mapToAtencion(data.atencion);
}

export async function eliminarAtencion(brigadaId: string, atencionId: string): Promise<void> {
  await api.delete(`/brigadas/${brigadaId}/atenciones/${atencionId}`);
}

// --- Registros (plantilla una fila por persona, servicios en columnas) ---

export interface BrigadaRegistro {
  id: string;
  sucursal: string | null;
  fecha: string;
  lugar: string | null;
  no: string | null;
  nombre: string;
  telefono: string | null;
  sexo: string | null;
  edad: number | null;
  medico: string | null;
  dentista: string | null;
  nutricion: string | null;
  psicologia: string | null;
  fisioterapia: string | null;
  cuidados_espirituales: string | null;
  examen_vista: string | null;
  corte_cabello: string | null;
  [key: string]: unknown;
}

export interface ResumenRegistros {
  totalRegistros: number;
  medico: number;
  dentista: number;
  nutricion: number;
  psicologia: number;
  papaniculao: number;
  antigenoProstatico: number;
  fisioterapia: number;
  cuidadosEspirituales: number;
  examenVista: number;
  corteCabello: number;
  quiereEstudiarBiblia: number;
  oracion: number;
  peticionOracion: number;
  porSucursal: { sucursal: string; total: number }[];
}

export async function obtenerRegistrosBrigada(
  brigadaId: string,
  filtros?: { fecha_desde?: string; fecha_hasta?: string; sucursal?: string }
): Promise<BrigadaRegistro[]> {
  const params = new URLSearchParams();
  if (filtros?.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
  if (filtros?.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
  if (filtros?.sucursal) params.set('sucursal', filtros.sucursal);
  const { data } = await api.get<{ success: boolean; registros: BrigadaRegistro[] }>(
    `/brigadas/${brigadaId}/registros?${params.toString()}`
  );
  return data.registros ?? [];
}

export async function obtenerResumenRegistrosBrigada(
  brigadaId: string,
  filtros?: { fecha_desde?: string; fecha_hasta?: string; sucursal?: string }
): Promise<ResumenRegistros> {
  const params = new URLSearchParams();
  if (filtros?.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
  if (filtros?.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
  if (filtros?.sucursal) params.set('sucursal', filtros.sucursal);
  const { data } = await api.get<{ success: boolean; resumen: ResumenRegistros }>(
    `/brigadas/${brigadaId}/resumen-registros?${params.toString()}`
  );
  return data.resumen;
}

// --- Plantilla e importación ---

export interface ImportarBrigadaResult {
  success: boolean;
  brigada: { id: string; nombre: string; ciudad: string; fecha_inicio: string };
  totalAtenciones?: number;
  atencionesInsertadas?: number;
  totalRegistros?: number;
  registrosInsertados?: number;
  errores?: { fila: number; mensaje: string }[];
}

/** Columnas de la plantilla (una fila por persona, servicios en columnas). */
const COLUMNAS_PLANTILLA_REGISTROS = [
  'SUCURSAL',
  'FECHA',
  'LUGAR',
  'NO.',
  'NOMBRE',
  'TELEFONO',
  'Dirección',
  'SEXO',
  'Edad',
  'ASD',
  'No ASD',
  'Quiere estudiar la Biblia',
  'Oración',
  'Medico',
  'Dentista',
  'Nutrición',
  'Psicologia',
  'Papaniculao',
  'Antigeno prostatico',
  'Fisioterapia',
  'Cuidados Espirituales',
  'Examen de la vista',
  'Corte de cabello',
  'Denominación',
  'Petición de oración',
  'Quiere estudiar la Biblia (seg)',
];

/** Mapeo nombre columna Excel -> clave para API (snake_case). */
const MAP_COLUMNA_TO_KEY: Record<string, string> = {
  'SUCURSAL': 'sucursal',
  'FECHA': 'fecha',
  'LUGAR': 'lugar',
  'NO.': 'no',
  'NOMBRE': 'nombre',
  'TELEFONO': 'telefono',
  'Dirección': 'direccion',
  'SEXO': 'sexo',
  'Edad': 'edad',
  'ASD': 'asd',
  'No ASD': 'no_asd',
  'Quiere estudiar la Biblia': 'quiere_estudiar_biblia',
  'Oración': 'oracion',
  'Medico': 'medico',
  'Dentista': 'dentista',
  'Nutrición': 'nutricion',
  'Psicologia': 'psicologia',
  'Papaniculao': 'papaniculao',
  'Antigeno prostatico': 'antigeno_prostatico',
  'Fisioterapia': 'fisioterapia',
  'Cuidados Espirituales': 'cuidados_espirituales',
  'Examen de la vista': 'examen_vista',
  'Corte de cabello': 'corte_cabello',
  'Denominación': 'denominacion',
  'Petición de oración': 'peticion_oracion',
  'Quiere estudiar la Biblia (seg)': 'quiere_estudiar_biblia_2',
};

/** Descarga plantilla Excel con columnas: SUCURSAL, FECHA, LUGAR, NO., NOMBRE, TELEFONO, etc. (una fila por persona). */
export function descargarPlantillaBrigada(): void {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([COLUMNAS_PLANTILLA_REGISTROS]);
  XLSX.utils.book_append_sheet(wb, sheet, 'Registros');
  const nombre = `plantilla-brigada-registros-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, nombre);
}

/**
 * Parsea el Excel de plantilla (columnas SUCURSAL, FECHA, LUGAR, NOMBRE...) y envía a importar-registros.
 * La brigada se arma con la primera fila: nombre = "Brigada {SUCURSAL} - {LUGAR} - {FECHA}", ciudad = SUCURSAL, fecha_inicio = mínima fecha.
 */
export async function importarBrigadaDesdeArchivo(file: File): Promise<ImportarBrigadaResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets['Registros'] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rows.length === 0) {
    throw new Error('El archivo no tiene filas de datos. Use la plantilla con columnas SUCURSAL, FECHA, LUGAR, NOMBRE, etc.');
  }

  const registros: Record<string, unknown>[] = [];
  let fechaMin = '';
  let sucursalPrimera = '';
  let lugarPrimera = '';

  for (const row of rows) {
    const getStr = (key: string) => {
      const v = row[key];
      return v != null ? String(v).trim() : '';
    };
    const nombreKey = Object.keys(row).find((k) => /^nombre$/i.test(k.replace(/\s/g, '')));
    const nombre = (nombreKey ? getStr(nombreKey) : '') || getStr('NOMBRE');
    let fecha = getStr('FECHA');
    const fechaKey = Object.keys(row).find((k) => /^fecha$/i.test(k.replace(/\s/g, '')));
    if (!fecha && fechaKey) fecha = getStr(fechaKey);
    if (fecha && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(fecha)) {
      const parts = fecha.split('/');
      const d = parts[0]!.padStart(2, '0');
      const m = parts[1]!.padStart(2, '0');
      const y = parts[2]!.length === 2 ? `20${parts[2]}` : parts[2];
      fecha = `${y}-${m}-${d}`;
    }
    if (!nombre || !fecha) continue;
    if (!fechaMin || fecha < fechaMin) fechaMin = fecha;
    if (!sucursalPrimera) {
      const s = getStr('SUCURSAL');
      if (s) sucursalPrimera = s;
    }
    if (!lugarPrimera) {
      const l = getStr('LUGAR');
      if (l) lugarPrimera = l;
    }
    const rec: Record<string, unknown> = { nombre, fecha };
    for (const [colName, key] of Object.entries(MAP_COLUMNA_TO_KEY)) {
      if (key === 'nombre' || key === 'fecha') continue;
      const val = row[colName];
      if (val !== undefined && val !== null && String(val).trim() !== '') rec[key] = val;
    }
    const dirKey = Object.keys(row).find((k) => /direcci[oó]n/i.test(k));
    if (dirKey && row[dirKey] != null) rec['direccion'] = row[dirKey];
    const denKey = Object.keys(row).find((k) => /denomi/i.test(k));
    if (denKey && row[denKey] != null) rec['denominacion'] = row[denKey];
    const petKey = Object.keys(row).find((k) => /petici[oó]n/i.test(k));
    if (petKey && row[petKey] != null) rec['peticion_oracion'] = row[petKey];
    registros.push(rec);
  }

  if (registros.length === 0) {
    throw new Error('No se encontraron filas válidas (nombre y fecha requeridos).');
  }

  const brigadaNombre = sucursalPrimera && lugarPrimera
    ? `Brigada ${sucursalPrimera} - ${lugarPrimera} - ${fechaMin}`
    : `Brigada ${fechaMin}`;
  const brigada = {
    nombre: brigadaNombre,
    ciudad: sucursalPrimera || 'Importación',
    fecha_inicio: fechaMin,
  };

  const { data } = await api.post<ImportarBrigadaResult>('/brigadas/importar-registros', { brigada, registros });
  return data;
}
