/**
 * Ejecuta la migración 033: Multi-Sucursal WhatsApp (whatsapp_config en sucursales, sucursal_id en conversaciones_matrix).
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureMultiSucursalWhatsApp(): Promise<void> {
  const pool = Database.getInstance().getPool();
  const name = '033_multi_sucursal_whatsapp.sql';
  const filePath = path.join(__dirname, 'migrations', name);
  if (!fs.existsSync(filePath)) return;
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Migración 033 (multi_sucursal_whatsapp) aplicada');
  } catch (err) {
    console.error('⚠️ Migración 033 multi_sucursal_whatsapp:', err);
  }
}
