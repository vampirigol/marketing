/**
 * Simula un webhook de Facebook para probar que los mensajes se guardan en Keila IA.
 *
 * Uso: npx tsx scripts/test-webhook-facebook.ts
 *
 * Requiere: Backend corriendo en puerto 3001, ngrok/tunnel activo,
 * y la URL en WEBHOOK_URL (o usa localhost si quieres probar solo el backend).
 */

import 'dotenv/config';
import axios from 'axios';

const WEBHOOK_URL = process.env.WEBHOOK_TEST_URL || 'http://localhost:3001/api/matrix/webhooks/facebook';

const payload = {
  object: 'page',
  entry: [
    {
      id: '123456789',
      time: Date.now(),
      messaging: [
        {
          sender: { id: 'TEST_USER_PSID_' + Date.now() },
          recipient: { id: process.env.FACEBOOK_PAGE_ID || 'PAGE_ID' },
          timestamp: Date.now(),
          message: {
            mid: 'mid.test.' + Date.now(),
            text: 'Mensaje de prueba desde script - ' + new Date().toLocaleString('es-MX'),
          },
        },
      ],
    },
  ],
};

async function main() {
  console.log('📤 Enviando webhook de prueba a:', WEBHOOK_URL);
  console.log('   Payload:', JSON.stringify(payload, null, 2).substring(0, 200) + '...');

  try {
    const res = await axios.post(WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    console.log('✅ Respuesta:', res.status, res.data || '(vacío)');
    console.log('\n   Verifica en Keila IA (Matrix) que aparezca la conversación.');
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? err.response?.data || err.message
      : String(err);
    console.error('❌ Error:', msg);
    process.exit(1);
  }
}

main();
