/**
 * Ejecuta el seed 020_seed_datos_reales.sql
 * Uso: npx tsx scripts/run-seed.ts
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from '../src/infrastructure/database/Database';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSeed() {
  const pool = Database.getInstance().getPool();
  const seedPath = path.join(__dirname, '../src/infrastructure/database/migrations/020_seed_datos_reales.sql');
  const sql = fs.readFileSync(seedPath, 'utf-8');

  try {
    await pool.query(sql);
    console.log('✅ Seed ejecutado correctamente');
  } catch (err) {
    console.error('❌ Error ejecutando seed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
