import { Pool } from 'pg';
import Database from '../Database';

export interface BrigadaRegistroEntity {
  id: string;
  brigada_id: string;
  sucursal: string | null;
  fecha: string;
  lugar: string | null;
  no: string | null;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  sexo: string | null;
  edad: number | null;
  asd: string | null;
  no_asd: string | null;
  quiere_estudiar_biblia: string | null;
  oracion: string | null;
  medico: string | null;
  dentista: string | null;
  nutricion: string | null;
  psicologia: string | null;
  papaniculao: string | null;
  antigeno_prostatico: string | null;
  fisioterapia: string | null;
  cuidados_espirituales: string | null;
  examen_vista: string | null;
  corte_cabello: string | null;
  denominacion: string | null;
  peticion_oracion: string | null;
  quiere_estudiar_biblia_2: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CrearRegistroInput {
  brigada_id: string;
  sucursal?: string;
  fecha: string;
  lugar?: string;
  no?: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  sexo?: string;
  edad?: number;
  asd?: string;
  no_asd?: string;
  quiere_estudiar_biblia?: string;
  oracion?: string;
  medico?: string;
  dentista?: string;
  nutricion?: string;
  psicologia?: string;
  papaniculao?: string;
  antigeno_prostatico?: string;
  fisioterapia?: string;
  cuidados_espirituales?: string;
  examen_vista?: string;
  corte_cabello?: string;
  denominacion?: string;
  peticion_oracion?: string;
  quiere_estudiar_biblia_2?: string;
}

/** Considera valor "marcado" para servicios: Sí, X, 1, true, si, x */
function _esMarcado(v: string | null | undefined): boolean {
  if (v == null || String(v).trim() === '') return false;
  const s = String(v).trim().toLowerCase();
  return s === 'sí' || s === 'si' || s === 'x' || s === '1' || s === 'true' || s === 's';
}

export interface ResumenRegistrosRow {
  total_registros: string;
  medico: string;
  dentista: string;
  nutricion: string;
  psicologia: string;
  papaniculao: string;
  antigeno_prostatico: string;
  fisioterapia: string;
  cuidados_espirituales: string;
  examen_vista: string;
  corte_cabello: string;
  quiere_estudiar_biblia: string;
  oracion: string;
  peticion_oracion: string;
  por_sucursal: string; /* JSON array */
}

function mapRow(row: Record<string, unknown>): BrigadaRegistroEntity {
  return {
    id: String(row.id),
    brigada_id: String(row.brigada_id),
    sucursal: row.sucursal != null ? String(row.sucursal) : null,
    fecha: String(row.fecha),
    lugar: row.lugar != null ? String(row.lugar) : null,
    no: row.no != null ? String(row.no) : null,
    nombre: String(row.nombre),
    telefono: row.telefono != null ? String(row.telefono) : null,
    direccion: row.direccion != null ? String(row.direccion) : null,
    sexo: row.sexo != null ? String(row.sexo) : null,
    edad: row.edad != null ? Number(row.edad) : null,
    asd: row.asd != null ? String(row.asd) : null,
    no_asd: row.no_asd != null ? String(row.no_asd) : null,
    quiere_estudiar_biblia: row.quiere_estudiar_biblia != null ? String(row.quiere_estudiar_biblia) : null,
    oracion: row.oracion != null ? String(row.oracion) : null,
    medico: row.medico != null ? String(row.medico) : null,
    dentista: row.dentista != null ? String(row.dentista) : null,
    nutricion: row.nutricion != null ? String(row.nutricion) : null,
    psicologia: row.psicologia != null ? String(row.psicologia) : null,
    papaniculao: row.papaniculao != null ? String(row.papaniculao) : null,
    antigeno_prostatico: row.antigeno_prostatico != null ? String(row.antigeno_prostatico) : null,
    fisioterapia: row.fisioterapia != null ? String(row.fisioterapia) : null,
    cuidados_espirituales: row.cuidados_espirituales != null ? String(row.cuidados_espirituales) : null,
    examen_vista: row.examen_vista != null ? String(row.examen_vista) : null,
    corte_cabello: row.corte_cabello != null ? String(row.corte_cabello) : null,
    denominacion: row.denominacion != null ? String(row.denominacion) : null,
    peticion_oracion: row.peticion_oracion != null ? String(row.peticion_oracion) : null,
    quiere_estudiar_biblia_2: row.quiere_estudiar_biblia_2 != null ? String(row.quiere_estudiar_biblia_2) : null,
    fecha_creacion: String(row.fecha_creacion),
    fecha_actualizacion: String(row.fecha_actualizacion),
  };
}

export class BrigadaRegistroRepositoryPostgres {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async listarPorBrigada(
    brigadaId: string,
    opts?: { fechaDesde?: string; fechaHasta?: string; sucursal?: string }
  ): Promise<BrigadaRegistroEntity[]> {
    let query = 'SELECT * FROM brigada_registros WHERE brigada_id = $1';
    const params: (string | undefined)[] = [brigadaId];
    if (opts?.fechaDesde) {
      params.push(opts.fechaDesde);
      query += ` AND fecha >= $${params.length}`;
    }
    if (opts?.fechaHasta) {
      params.push(opts.fechaHasta);
      query += ` AND fecha <= $${params.length}`;
    }
    if (opts?.sucursal) {
      params.push(opts.sucursal);
      query += ` AND sucursal = $${params.length}`;
    }
    query += ' ORDER BY fecha DESC, no ASC NULLS LAST, nombre ASC';
    const result = await this.pool.query(query, params.filter(Boolean));
    return result.rows.map(mapRow);
  }

  async crear(datos: CrearRegistroInput): Promise<BrigadaRegistroEntity> {
    const result = await this.pool.query(
      `INSERT INTO brigada_registros (
        brigada_id, sucursal, fecha, lugar, no, nombre, telefono, direccion, sexo, edad,
        asd, no_asd, quiere_estudiar_biblia, oracion, medico, dentista, nutricion, psicologia,
        papaniculao, antigeno_prostatico, fisioterapia, cuidados_espirituales, examen_vista,
        corte_cabello, denominacion, peticion_oracion, quiere_estudiar_biblia_2
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *`,
      [
        datos.brigada_id,
        datos.sucursal ?? null,
        datos.fecha,
        datos.lugar ?? null,
        datos.no ?? null,
        datos.nombre,
        datos.telefono ?? null,
        datos.direccion ?? null,
        datos.sexo ?? null,
        datos.edad ?? null,
        datos.asd ?? null,
        datos.no_asd ?? null,
        datos.quiere_estudiar_biblia ?? null,
        datos.oracion ?? null,
        datos.medico ?? null,
        datos.dentista ?? null,
        datos.nutricion ?? null,
        datos.psicologia ?? null,
        datos.papaniculao ?? null,
        datos.antigeno_prostatico ?? null,
        datos.fisioterapia ?? null,
        datos.cuidados_espirituales ?? null,
        datos.examen_vista ?? null,
        datos.corte_cabello ?? null,
        datos.denominacion ?? null,
        datos.peticion_oracion ?? null,
        datos.quiere_estudiar_biblia_2 ?? null,
      ]
    );
    return mapRow(result.rows[0]);
  }

  async crearVarios(brigadaId: string, registros: Omit<CrearRegistroInput, 'brigada_id'>[]): Promise<number> {
    let insertadas = 0;
    for (const r of registros) {
      try {
        await this.crear({ ...r, brigada_id: brigadaId });
        insertadas++;
      } catch {
        // skip fila con error
      }
    }
    return insertadas;
  }

  /**
   * Resumen KPIs desde brigada_registros: total y conteos por servicio (marcado = Sí/X/1).
   */
  async obtenerResumen(
    brigadaId: string,
    opts?: { fechaDesde?: string; fechaHasta?: string; sucursal?: string }
  ): Promise<ResumenRegistrosRow> {
    let where = 'WHERE brigada_id = $1';
    const params: string[] = [brigadaId];
    if (opts?.fechaDesde) {
      params.push(opts.fechaDesde);
      where += ` AND fecha >= $${params.length}`;
    }
    if (opts?.fechaHasta) {
      params.push(opts.fechaHasta);
      where += ` AND fecha <= $${params.length}`;
    }
    if (opts?.sucursal) {
      params.push(opts.sucursal);
      where += ` AND sucursal = $${params.length}`;
    }
    const sql = `
      SELECT
        COUNT(*)::text AS total_registros,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(medico,''))) IN ('sí','si','x','1','true','s'))::text AS medico,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(dentista,''))) IN ('sí','si','x','1','true','s'))::text AS dentista,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(nutricion,''))) IN ('sí','si','x','1','true','s'))::text AS nutricion,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(psicologia,''))) IN ('sí','si','x','1','true','s'))::text AS psicologia,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(papaniculao,''))) IN ('sí','si','x','1','true','s'))::text AS papaniculao,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(antigeno_prostatico,''))) IN ('sí','si','x','1','true','s'))::text AS antigeno_prostatico,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(fisioterapia,''))) IN ('sí','si','x','1','true','s'))::text AS fisioterapia,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(cuidados_espirituales,''))) IN ('sí','si','x','1','true','s'))::text AS cuidados_espirituales,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(examen_vista,''))) IN ('sí','si','x','1','true','s'))::text AS examen_vista,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(corte_cabello,''))) IN ('sí','si','x','1','true','s'))::text AS corte_cabello,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(quiere_estudiar_biblia,''))) IN ('sí','si','x','1','true','s') OR LOWER(TRIM(COALESCE(quiere_estudiar_biblia_2,''))) IN ('sí','si','x','1','true','s'))::text AS quiere_estudiar_biblia,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(oracion,''))) IN ('sí','si','x','1','true','s'))::text AS oracion,
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(peticion_oracion,''))) IN ('sí','si','x','1','true','s'))::text AS peticion_oracion,
        (SELECT COALESCE(json_agg(json_build_object('sucursal', sub.sucursal, 'total', sub.total) ORDER BY sub.sucursal), '[]'::json)::text
          FROM (SELECT sucursal, COUNT(*)::int AS total FROM brigada_registros ${where} GROUP BY sucursal) sub) AS por_sucursal
      FROM brigada_registros
      ${where}
    `;
    const result = await this.pool.query(sql, params);
    const row = result.rows[0] ?? {};
    return {
      total_registros: String(row.total_registros ?? '0'),
      medico: String(row.medico ?? '0'),
      dentista: String(row.dentista ?? '0'),
      nutricion: String(row.nutricion ?? '0'),
      psicologia: String(row.psicologia ?? '0'),
      papaniculao: String(row.papaniculao ?? '0'),
      antigeno_prostatico: String(row.antigeno_prostatico ?? '0'),
      fisioterapia: String(row.fisioterapia ?? '0'),
      cuidados_espirituales: String(row.cuidados_espirituales ?? '0'),
      examen_vista: String(row.examen_vista ?? '0'),
      corte_cabello: String(row.corte_cabello ?? '0'),
      quiere_estudiar_biblia: String(row.quiere_estudiar_biblia ?? '0'),
      oracion: String(row.oracion ?? '0'),
      peticion_oracion: String(row.peticion_oracion ?? '0'),
      por_sucursal: String(row.por_sucursal ?? '[]'),
    };
  }
}
