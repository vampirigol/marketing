import { Pool } from 'pg';
import Database from '../Database';

export interface BrigadaAtencionEntity {
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

export interface CrearAtencionInput {
  brigada_id: string;
  fecha: string;
  hora?: string;
  ubicacion?: string;
  medico?: string;
  paciente_id?: string;
  paciente_nombre: string;
  edad?: number;
  sexo?: string;
  domicilio?: string;
  codigo_postal?: string;
  localidad?: string;
  colonia?: string;
  tipo_sangre?: string;
  peso?: number;
  altura?: number;
  imc?: number;
  ta?: string;
  temp?: number;
  fc?: number;
  fr?: number;
  glu?: number;
  especialidad: string;
  servicio?: string;
  lentes_entregados?: boolean;
  diagnostico?: string;
  receta?: string;
  medicamentos_entregados?: string;
  observaciones?: string;
}

export interface ResumenBrigadaRow {
  total_atendidos: string;
  medicina_integral: string;
  oftalmologia: string;
  fisioterapia: string;
  nutricion: string;
  psicologia: string;
  espirituales: string;
  odontologia_consultas: string;
  odontologia_extracciones: string;
  odontologia_resinas: string;
  odontologia_profilaxis: string;
  odontologia_endodoncia: string;
  oftalmologia_pacientes: string;
  oftalmologia_lentes: string;
  oftalmologia_valoraciones: string;
  fisioterapia_terapias: string;
  nutricion_consultas: string;
  rango_edad: string;
  masculino: string;
  femenino: string;
}

function mapRow(row: Record<string, unknown>): BrigadaAtencionEntity {
  return {
    id: String(row.id),
    brigada_id: String(row.brigada_id),
    fecha: String(row.fecha),
    hora: row.hora != null ? String(row.hora) : null,
    ubicacion: row.ubicacion != null ? String(row.ubicacion) : null,
    medico: row.medico != null ? String(row.medico) : null,
    paciente_id: row.paciente_id != null ? String(row.paciente_id) : null,
    paciente_nombre: String(row.paciente_nombre),
    edad: row.edad != null ? Number(row.edad) : null,
    sexo: row.sexo != null ? String(row.sexo) : null,
    domicilio: row.domicilio != null ? String(row.domicilio) : null,
    codigo_postal: row.codigo_postal != null ? String(row.codigo_postal) : null,
    localidad: row.localidad != null ? String(row.localidad) : null,
    colonia: row.colonia != null ? String(row.colonia) : null,
    tipo_sangre: row.tipo_sangre != null ? String(row.tipo_sangre) : null,
    peso: row.peso != null ? Number(row.peso) : null,
    altura: row.altura != null ? Number(row.altura) : null,
    imc: row.imc != null ? Number(row.imc) : null,
    ta: row.ta != null ? String(row.ta) : null,
    temp: row.temp != null ? Number(row.temp) : null,
    fc: row.fc != null ? Number(row.fc) : null,
    fr: row.fr != null ? Number(row.fr) : null,
    glu: row.glu != null ? Number(row.glu) : null,
    especialidad: String(row.especialidad),
    servicio: row.servicio != null ? String(row.servicio) : null,
    lentes_entregados: Boolean(row.lentes_entregados),
    diagnostico: row.diagnostico != null ? String(row.diagnostico) : null,
    receta: row.receta != null ? String(row.receta) : null,
    medicamentos_entregados: row.medicamentos_entregados != null ? String(row.medicamentos_entregados) : null,
    observaciones: row.observaciones != null ? String(row.observaciones) : null,
    fecha_creacion: String(row.fecha_creacion),
    fecha_actualizacion: String(row.fecha_actualizacion),
  };
}

export class BrigadaAtencionRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async listarPorBrigada(
    brigadaId: string,
    opts?: { fechaDesde?: string; fechaHasta?: string }
  ): Promise<BrigadaAtencionEntity[]> {
    let query = 'SELECT * FROM brigada_atenciones WHERE brigada_id = $1';
    const params: (string | undefined)[] = [brigadaId];
    if (opts?.fechaDesde) {
      params.push(opts.fechaDesde);
      query += ` AND fecha >= $${params.length}`;
    }
    if (opts?.fechaHasta) {
      params.push(opts.fechaHasta);
      query += ` AND fecha <= $${params.length}`;
    }
    query += ' ORDER BY fecha DESC, hora DESC NULLS LAST';
    const result = await this.pool.query(query, params.filter(Boolean));
    return result.rows.map(mapRow);
  }

  async obtenerPorId(id: string): Promise<BrigadaAtencionEntity | null> {
    const result = await this.pool.query('SELECT * FROM brigada_atenciones WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async crear(datos: CrearAtencionInput): Promise<BrigadaAtencionEntity> {
    const result = await this.pool.query(
      `INSERT INTO brigada_atenciones (
        brigada_id, fecha, hora, ubicacion, medico, paciente_id, paciente_nombre, edad, sexo,
        domicilio, codigo_postal, localidad, colonia, tipo_sangre, peso, altura, imc, ta, temp, fc, fr, glu,
        especialidad, servicio, lentes_entregados, diagnostico, receta, medicamentos_entregados, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        datos.brigada_id,
        datos.fecha,
        datos.hora ?? null,
        datos.ubicacion ?? null,
        datos.medico ?? null,
        datos.paciente_id ?? null,
        datos.paciente_nombre,
        datos.edad ?? null,
        datos.sexo ?? null,
        datos.domicilio ?? null,
        datos.codigo_postal ?? null,
        datos.localidad ?? null,
        datos.colonia ?? null,
        datos.tipo_sangre ?? null,
        datos.peso ?? null,
        datos.altura ?? null,
        datos.imc ?? null,
        datos.ta ?? null,
        datos.temp ?? null,
        datos.fc ?? null,
        datos.fr ?? null,
        datos.glu ?? null,
        datos.especialidad,
        datos.servicio ?? null,
        datos.lentes_entregados ?? false,
        datos.diagnostico ?? null,
        datos.receta ?? null,
        datos.medicamentos_entregados ?? null,
        datos.observaciones ?? null,
      ]
    );
    return mapRow(result.rows[0]);
  }

  async actualizar(
    id: string,
    datos: Partial<CrearAtencionInput> & { brigada_id?: string }
  ): Promise<BrigadaAtencionEntity | null> {
    const current = await this.obtenerPorId(id);
    if (!current) return null;
    const {
      fecha, hora, ubicacion, medico, paciente_id, paciente_nombre, edad, sexo,
      domicilio, codigo_postal, localidad, colonia, tipo_sangre, peso, altura, imc, ta, temp, fc, fr, glu,
      especialidad, servicio, lentes_entregados, diagnostico, receta, medicamentos_entregados, observaciones,
    } = { ...current, ...datos } as BrigadaAtencionEntity & CrearAtencionInput;
    const result = await this.pool.query(
      `UPDATE brigada_atenciones SET
        fecha = $1, hora = $2, ubicacion = $3, medico = $4, paciente_id = $5, paciente_nombre = $6, edad = $7, sexo = $8,
        domicilio = $9, codigo_postal = $10, localidad = $11, colonia = $12, tipo_sangre = $13, peso = $14, altura = $15, imc = $16, ta = $17, temp = $18, fc = $19, fr = $20, glu = $21,
        especialidad = $22, servicio = $23, lentes_entregados = $24, diagnostico = $25, receta = $26, medicamentos_entregados = $27, observaciones = $28,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $29 RETURNING *`,
      [
        fecha, hora ?? null, ubicacion ?? null, medico ?? null, paciente_id ?? null, paciente_nombre, edad ?? null, sexo ?? null,
        domicilio ?? null, codigo_postal ?? null, localidad ?? null, colonia ?? null, tipo_sangre ?? null, peso ?? null, altura ?? null, imc ?? null, ta ?? null, temp ?? null, fc ?? null, fr ?? null, glu ?? null,
        especialidad, servicio ?? null, lentes_entregados ?? false, diagnostico ?? null, receta ?? null, medicamentos_entregados ?? null, observaciones ?? null,
        id,
      ]
    );
    if (result.rows.length === 0) return null;
    return mapRow(result.rows[0]);
  }

  async eliminar(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM brigada_atenciones WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async obtenerResumen(
    brigadaId: string,
    opts?: { fechaDesde?: string; fechaHasta?: string }
  ): Promise<ResumenBrigadaRow> {
    const params: string[] = [brigadaId];
    let whereExtra = '';
    if (opts?.fechaDesde) {
      params.push(opts.fechaDesde);
      whereExtra += ` AND a.fecha >= $${params.length}`;
    }
    if (opts?.fechaHasta) {
      params.push(opts.fechaHasta);
      whereExtra += ` AND a.fecha <= $${params.length}`;
    }
    const query = `
      WITH base AS (
        SELECT a.* FROM brigada_atenciones a WHERE a.brigada_id = $1 ${whereExtra}
      )
      SELECT
        COUNT(DISTINCT (paciente_nombre, fecha))::text AS total_atendidos,
        COUNT(*) FILTER (WHERE especialidad = 'medicina_integral')::text AS medicina_integral,
        COUNT(*) FILTER (WHERE especialidad = 'oftalmologia')::text AS oftalmologia,
        COUNT(*) FILTER (WHERE especialidad = 'fisioterapia')::text AS fisioterapia,
        COUNT(*) FILTER (WHERE especialidad = 'nutricion')::text AS nutricion,
        COUNT(*) FILTER (WHERE especialidad = 'psicologia')::text AS psicologia,
        COUNT(*) FILTER (WHERE especialidad = 'espirituales')::text AS espirituales,
        COUNT(*) FILTER (WHERE especialidad = 'odontologia' AND (servicio ILIKE '%consulta%' OR servicio = 'Consulta'))::text AS odontologia_consultas,
        COUNT(*) FILTER (WHERE especialidad = 'odontologia' AND (servicio ILIKE '%extracc%' OR servicio = 'Extracción'))::text AS odontologia_extracciones,
        COUNT(*) FILTER (WHERE especialidad = 'odontologia' AND (servicio ILIKE '%resina%' OR servicio = 'Resina'))::text AS odontologia_resinas,
        COUNT(*) FILTER (WHERE especialidad = 'odontologia' AND (servicio ILIKE '%profilaxis%' OR servicio = 'Profilaxis'))::text AS odontologia_profilaxis,
        COUNT(*) FILTER (WHERE especialidad = 'odontologia' AND (servicio ILIKE '%endodoncia%' OR servicio = 'Endodoncia'))::text AS odontologia_endodoncia,
        COUNT(*) FILTER (WHERE especialidad = 'oftalmologia')::text AS oftalmologia_pacientes,
        COUNT(*) FILTER (WHERE especialidad = 'oftalmologia' AND lentes_entregados = true)::text AS oftalmologia_lentes,
        COUNT(*) FILTER (WHERE especialidad = 'oftalmologia')::text AS oftalmologia_valoraciones,
        COUNT(*) FILTER (WHERE especialidad = 'fisioterapia')::text AS fisioterapia_terapias,
        COUNT(*) FILTER (WHERE especialidad = 'nutricion')::text AS nutricion_consultas,
        COALESCE(MIN(edad)::text, '') || ' - ' || COALESCE(MAX(edad)::text, '') AS rango_edad,
        COUNT(*) FILTER (WHERE sexo ILIKE '%masc%' OR sexo = 'M')::text AS masculino,
        COUNT(*) FILTER (WHERE sexo ILIKE '%fem%' OR sexo = 'F')::text AS femenino
      FROM base a
    `;
    const result = await this.pool.query(query, params);
    const row = (result.rows[0] ?? {}) as Record<string, string>;
    return {
      total_atendidos: row.total_atendidos ?? '0',
      medicina_integral: row?.medicina_integral ?? '0',
      oftalmologia: row?.oftalmologia ?? '0',
      fisioterapia: row?.fisioterapia ?? '0',
      nutricion: row?.nutricion ?? '0',
      psicologia: row?.psicologia ?? '0',
      espirituales: row?.espirituales ?? '0',
      odontologia_consultas: row?.odontologia_consultas ?? '0',
      odontologia_extracciones: row?.odontologia_extracciones ?? '0',
      odontologia_resinas: row?.odontologia_resinas ?? '0',
      odontologia_profilaxis: row?.odontologia_profilaxis ?? '0',
      odontologia_endodoncia: row?.odontologia_endodoncia ?? '0',
      oftalmologia_pacientes: row?.oftalmologia_pacientes ?? '0',
      oftalmologia_lentes: row?.oftalmologia_lentes ?? '0',
      oftalmologia_valoraciones: row?.oftalmologia_valoraciones ?? '0',
      fisioterapia_terapias: row?.fisioterapia_terapias ?? '0',
      nutricion_consultas: row?.nutricion_consultas ?? '0',
      rango_edad: row?.rango_edad ?? ' - ',
      masculino: row?.masculino ?? '0',
      femenino: row?.femenino ?? '0',
    };
  }
}
