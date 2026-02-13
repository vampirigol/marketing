/**
 * Ejecuta la migración 036: Asegurar sucursales para catálogo Agendar Cita (Loreto Héroes, Loreto Centro, Valle de la Trinidad, Clínica Adventista Virtual).
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureSucursalesCatalogoCompleto(): Promise<void> {
  const pool = Database.getInstance().getPool();
  const name = '036_sucursales_catalogo_completo.sql';
  const filePath = path.join(__dirname, 'migrations', name);
  if (!fs.existsSync(filePath)) return;
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Migración 036 (sucursales_catalogo_completo) aplicada');
  } catch (err) {
    console.error('⚠️ Migración 036 sucursales_catalogo:', err);
  }
}
