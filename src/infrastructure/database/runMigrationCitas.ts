/**
 * Ejecuta la migración 023: token confirmación, lista de espera y plantillas de mensajes para citas.
 * Se llama al arrancar el servidor cuando la base de datos está disponible.
 */
import fs from 'fs';
import path from 'path';
import Database from './Database';

const __dirname = path.join(process.cwd(), 'src', 'infrastructure', 'database');

export async function ensureCitasConfirmacionListaEspera(): Promise<void> {
  const pool = Database.getInstance().getPool();
  const migrations = [
    '023_citas_confirmacion_lista_espera_plantillas.sql',
    '027_create_recordatorios_citas.sql',
    '028_create_slots_reservados_temporal.sql',
    '029_add_buffer_config_consultas.sql',
    '030_solicitudes_cita_id_no_afiliacion.sql',
    '031_origen_canales_tiktok_youtube_email.sql',
    '032_add_nombre_contacto_matrix.sql',
  ];
  for (const name of migrations) {
    const filePath = path.join(__dirname, 'migrations', name);
    if (!fs.existsSync(filePath)) continue;
    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      await pool.query(sql);
      console.log(`✅ Migración ${name.replace('.sql', '')} aplicada`);
    } catch (err) {
      console.error(`⚠️ Migración ${name}:`, err);
    }
  }
}
