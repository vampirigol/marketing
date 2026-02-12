/**
 * Ejecuta la migración de eventos_calendario si la tabla no existe.
 * Se llama al arrancar el servidor cuando la base de datos está disponible.
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureCalendarioTable(): Promise<void> {
  const pool = Database.getInstance().getPool();
  try {
    const check = await pool.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'eventos_calendario'
    `);
    if (check.rows.length === 0) {
      const migrationPath = path.join(
        __dirname,
        'migrations',
        '021_create_eventos_calendario.sql'
      );
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      await pool.query(sql);
      console.log('✅ Tabla eventos_calendario creada (migración 021)');
    }

    // Migración 022: columna recordatorio_enviado (seguro ejecutar siempre)
    const migration022 = path.join(__dirname, 'migrations', '022_add_recordatorio_enviado_calendario.sql');
    if (fs.existsSync(migration022)) {
      const sql022 = fs.readFileSync(migration022, 'utf-8');
      await pool.query(sql022);
    }
  } catch (err) {
    console.error('⚠️ Migración calendario:', err);
  }
}
