/**
 * Ejecuta la migración 024/025 y opcionalmente el seed de Brigada 2025 - Ciudad Juárez.
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';
import { seedBrigada2025CiudadJuarezIfEmpty } from './seedBrigada2025';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureBrigadasTable(): Promise<void> {
  const pool = Database.getInstance().getPool();
  const migrations = [
    '024_create_brigadas_medicas.sql',
    '025_create_brigada_atenciones.sql',
    '026_create_brigada_registros.sql',
  ];
  for (const name of migrations) {
    const filePath = path.join(__dirname, 'migrations', name);
    if (!fs.existsSync(filePath)) continue;
    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      await pool.query(sql);
      console.log(`✅ Migración ${name.replace(/\D/g, '')} (${name.replace(/^\d+_/, '')}) aplicada`);
    } catch (err) {
      console.error(`⚠️ Migración ${name}:`, err);
    }
  }
  try {
    await seedBrigada2025CiudadJuarezIfEmpty(pool);
  } catch (err) {
    console.error('⚠️ Seed brigada 2025:', err);
  }
}
