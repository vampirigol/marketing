/**
 * Script para suscribir la Página de Facebook a los webhooks de Meta.
 * Necesario para que los mensajes de Messenger e Instagram lleguen a Keila IA.
 *
 * Uso: npx tsx scripts/suscribir-meta-webhooks.ts
 *
 * Requiere en .env:
 *   FACEBOOK_PAGE_ID - ID de la Página (no el App ID)
 *   FACEBOOK_PAGE_ACCESS_TOKEN - Token de acceso de la Página
 */

import 'dotenv/config';
import axios from 'axios';

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

async function main() {
  if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
    console.error('❌ Faltan FACEBOOK_PAGE_ID o FACEBOOK_PAGE_ACCESS_TOKEN en .env');
    process.exit(1);
  }

  console.log('📤 Suscribiendo página', PAGE_ID, 'a webhooks...');
  console.log('   Backend:', `${API_URL}/api/meta-config/suscribir-pagina`);
  console.log('');

  try {
    const response = await axios.post(`${API_URL}/api/meta-config/suscribir-pagina`, {
      pageId: PAGE_ID,
      pageAccessToken: PAGE_ACCESS_TOKEN,
      subscribedFields: [
        'messages',
        'message_deliveries',
        'message_reads',
        'messaging_postbacks',
      ],
    });

    if (response.data?.success) {
      console.log('✅ Página suscrita correctamente a webhooks');
      console.log('   Campos:', response.data.subscribedFields?.join(', ') || 'messages, ...');
    } else {
      console.error('❌ Error:', response.data?.message || 'Respuesta inesperada');
      process.exit(1);
    }
  } catch (err: unknown) {
    let msg = 'Error desconocido';
    if (axios.isAxiosError(err)) {
      msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message;
      if (err.code === 'ECONNREFUSED') {
        msg = `No se pudo conectar al backend en ${API_URL}. ¿Está corriendo? (npm run dev o npm start)`;
      } else if (err.response?.data && !msg) {
        msg = JSON.stringify(err.response.data);
      }
    } else if (err instanceof Error) {
      msg = err.message;
    }
    console.error('❌ Error:', msg || '(sin mensaje)');
    process.exit(1);
  }
}

main();
