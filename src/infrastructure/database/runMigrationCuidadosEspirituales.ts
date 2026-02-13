/**
 * Ejecuta la migración 035: Cuidados Espirituales (registro de asistencias) + appointment_type en citas.
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureCuidadosEspirituales(): Promise<void> {
  const pool = Database.getInstance().getPool();
  const name = '035_cuidados_espirituales_y_appointment_type.sql';
  const filePath = path.join(__dirname, 'migrations', name);
  if (!fs.existsSync(filePath)) return;
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Migración 035 (cuidados_espirituales_y_appointment_type) aplicada');
  } catch (err) {
    console.error('⚠️ Migración 035 cuidados_espirituales:', err);
  }
}
