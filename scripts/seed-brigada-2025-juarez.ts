/**
 * Seed: Brigada 2025 - Ciudad Juárez y atenciones según informe.
 * Uso: npm run db:seed:brigada
 */
import dotenv from 'dotenv';
import Database from '../src/infrastructure/database/Database';
import { seedBrigada2025CiudadJuarezIfEmpty } from '../src/infrastructure/database/seedBrigada2025';

dotenv.config();

async function runSeed() {
  const pool = Database.getInstance().getPool();
  try {
    await seedBrigada2025CiudadJuarezIfEmpty(pool);
    console.log('✅ Seed brigada 2025 finalizado.');
  } catch (err) {
    console.error('❌ Error en seed brigada:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
