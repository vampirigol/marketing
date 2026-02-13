/**
 * Ejecuta la migración 034: Pipeline Contact Center (lead_status, en_lista_recovery, contact_center_kpis).
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureLeadPipeline(): Promise<void> {
  const pool = Database.getInstance().getPool();
  const name = '034_lead_pipeline_contact_center.sql';
  const filePath = path.join(__dirname, 'migrations', name);
  if (!fs.existsSync(filePath)) return;
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Migración 034 (lead_pipeline_contact_center) aplicada');
  } catch (err) {
    console.error('⚠️ Migración 034 lead_pipeline_contact_center:', err);
  }
}
