/**
 * Seed Brigada 2025 - Ciudad Juárez y atenciones según informe.
 * Se ejecuta al arrancar el backend si no hay brigadas (o se puede llamar desde script).
 */
import type { Pool } from 'pg';

const NOMBRE_BRIGADA = 'Brigada 2025 - Ciudad Juárez';
const CIUDAD = 'Ciudad Juárez';
const UBICACION = 'DIF Municipal / puntos de brigada';

const ESPECIALIDADES: { especialidad: string; servicio?: string; count: number; lentes?: number }[] = [
  { especialidad: 'medicina_integral', count: 85 },
  { especialidad: 'oftalmologia', count: 62, lentes: 38 },
  { especialidad: 'fisioterapia', count: 28 },
  { especialidad: 'nutricion', count: 45 },
  { especialidad: 'psicologia', count: 32 },
  { especialidad: 'espirituales', count: 41 },
  { especialidad: 'odontologia', servicio: 'Consulta', count: 120 },
  { especialidad: 'odontologia', servicio: 'Extracción', count: 48 },
  { especialidad: 'odontologia', servicio: 'Resina', count: 35 },
  { especialidad: 'odontologia', servicio: 'Profilaxis', count: 72 },
  { especialidad: 'odontologia', servicio: 'Endodoncia', count: 12 },
];

const NOMBRES = [
  'María García', 'José López', 'Ana Martínez', 'Carlos Hernández', 'Laura González', 'Miguel Rodríguez',
  'Sofía Pérez', 'Luis Sánchez', 'Elena Ramírez', 'Jorge Torres', 'Carmen Flores', 'Antonio Díaz',
  'Isabel Morales', 'Francisco Reyes', 'Rosa Gutiérrez', 'Pedro Ortiz', 'Martha Cruz', 'Roberto Ruiz',
  'Lucía Mendoza', 'Daniel Chávez', 'Adriana Vargas', 'Fernando Romero', 'Gloria Soto', 'Javier López',
  'Patricia Herrera', 'Ricardo Medina', 'Claudia Guerrero', 'Andrés Ríos', 'Gabriela Luna', 'Raúl Delgado',
];

function nombreAleatorio(seed: number): string {
  const i = seed % NOMBRES.length;
  const j = Math.floor(seed / NOMBRES.length) % 50;
  return j === 0 ? NOMBRES[i] : `${NOMBRES[i]} ${j}`;
}

function fechaAleatoria2025(seed: number): string {
  const day = 1 + (seed % 28);
  const month = 1 + (Math.floor(seed / 30) % 12);
  const m = month < 10 ? `0${month}` : String(month);
  const d = day < 10 ? `0${day}` : String(day);
  return `2025-${m}-${d}`;
}

function horaAleatoria(seed: number): string {
  const h = 8 + (seed % 10);
  const min = (seed * 7) % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
}

export async function seedBrigada2025CiudadJuarezIfEmpty(pool: Pool): Promise<void> {
  const countBrigadas = await pool.query('SELECT COUNT(*) as n FROM brigadas_medicas');
  const n = parseInt(countBrigadas.rows[0]?.n ?? '0', 10);
  if (n > 0) {
    const countAtenciones = await pool.query('SELECT COUNT(*) as n FROM brigada_atenciones');
    const na = parseInt(countAtenciones.rows[0]?.n ?? '0', 10);
    if (na >= 200) return;
  }

  let brigadaId: string;
  const existente = await pool.query(
    "SELECT id FROM brigadas_medicas WHERE nombre = $1 LIMIT 1",
    [NOMBRE_BRIGADA]
  );

  if (existente.rows.length > 0) {
    brigadaId = existente.rows[0].id as string;
    const countA = await pool.query('SELECT COUNT(*) as n FROM brigada_atenciones WHERE brigada_id = $1', [brigadaId]);
    if (parseInt(countA.rows[0]?.n ?? '0', 10) >= 200) return;
  } else {
    const ins = await pool.query(
      `INSERT INTO brigadas_medicas (nombre, ubicacion, ciudad, estado_brigada, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, 'en_curso', '2025-01-01', '2025-12-31')
       RETURNING id`,
      [NOMBRE_BRIGADA, UBICACION, CIUDAD]
    );
    brigadaId = ins.rows[0].id as string;
    console.log('✅ Brigada creada (seed):', NOMBRE_BRIGADA);
  }

  let idx = 0;
  const sexos = ['M', 'F'];
  for (const item of ESPECIALIDADES) {
    for (let k = 0; k < item.count; k++) {
      const nombre = nombreAleatorio(idx);
      const fecha = fechaAleatoria2025(idx);
      const sexo = sexos[idx % 2];
      const edad = 18 + (idx % 55);
      const lentes = item.especialidad === 'oftalmologia' && item.lentes != null && k < item.lentes;
      await pool.query(
        `INSERT INTO brigada_atenciones (
          brigada_id, fecha, hora, medico, paciente_nombre, edad, sexo,
          localidad, colonia, especialidad, servicio, lentes_entregados
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          brigadaId,
          fecha,
          horaAleatoria(idx),
          'Dr. ' + NOMBRES[idx % NOMBRES.length].split(' ')[0],
          nombre,
          edad,
          sexo,
          CIUDAD,
          'Col. Centro',
          item.especialidad,
          item.servicio ?? null,
          lentes,
        ]
      );
      idx++;
    }
  }
  console.log('✅ Seed brigada 2025: ' + idx + ' atenciones insertadas');
}
