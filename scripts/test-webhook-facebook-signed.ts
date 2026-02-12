import 'dotenv/config';
import axios from 'axios';
import crypto from 'crypto';

// URL de webhook (asegúrate que el servidor esté en http://localhost:3001)
const WEBHOOK_URL = process.env.WEBHOOK_TEST_URL || process.env.WEBHOOK_URL || 'http://localhost:3001/api/webhooks/facebook';
const APP_SECRET = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;

if (!APP_SECRET) {
  console.error('❌ META_APP_SECRET no está definido en .env');
  process.exit(1);
}

const payload = {
  object: 'page',
  entry: [
    {
      id: process.env.FACEBOOK_PAGE_ID || 'PAGE_ID',
      time: Date.now(),
      messaging: [
        {
          sender: { id: 'TEST_USER_PSID_' + Date.now() },
          recipient: { id: process.env.FACEBOOK_PAGE_ID || 'PAGE_ID' },
          timestamp: Date.now(),
          message: {
            mid: 'mid.test.' + Date.now(),
            text: 'Mensaje de prueba firmado desde script - ' + new Date().toLocaleString('es-MX'),
          },
        },
      ],
    },
  ],
};

async function main() {
  const bodyString = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', APP_SECRET).update(bodyString).digest('hex');
  const header = `sha256=${sig}`;

  console.log('📤 Enviando webhook firmado a:', WEBHOOK_URL);
  try {
    const res = await axios.post(WEBHOOK_URL, bodyString, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': header,
      },
      timeout: 10000,
    });
    console.log('✅ Respuesta:', res.status, res.data || '(vacío)');
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? (err.response?.data || err.message) : String(err);
    console.error('❌ Error enviando webhook firmado:', msg);
    process.exit(1);
  }
}

main();
