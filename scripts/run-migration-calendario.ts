/**
 * Ejecuta la migración 021_create_eventos_calendario.sql
 * Uso: npm run db:migrate:calendario  o  npx tsx scripts/run-migration-calendario.ts
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from '../src/infrastructure/database/Database';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const pool = Database.getInstance().getPool();
  const base = path.join(__dirname, '../src/infrastructure/database/migrations');

  try {
    const sql021 = fs.readFileSync(path.join(base, '021_create_eventos_calendario.sql'), 'utf-8');
    await pool.query(sql021);
    console.log('✅ Migración 021 (eventos_calendario) ejecutada.');
  } catch (err) {
    console.error('❌ Error en migración 021:', err);
    await pool.end();
    process.exit(1);
  }

  try {
    const sql022 = fs.readFileSync(path.join(base, '022_add_recordatorio_enviado_calendario.sql'), 'utf-8');
    await pool.query(sql022);
    console.log('✅ Migración 022 (recordatorio_enviado) ejecutada.');
  } catch (err) {
    console.error('❌ Error en migración 022:', err);
    await pool.end();
    process.exit(1);
  }

  console.log('✅ Calendario: migraciones listas.');
  await pool.end();
}

runMigration();
