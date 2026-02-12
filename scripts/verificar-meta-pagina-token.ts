/**
 * Verifica el Page Access Token y obtiene el Page ID correcto.
 * Ayuda a diagnosticar errores como "Object with ID does not exist".
 *
 * Uso: npx tsx scripts/verificar-meta-pagina-token.ts
 *
 * Requiere en .env:
 *   FACEBOOK_PAGE_ACCESS_TOKEN - Token de Página (Page Access Token)
 */

import 'dotenv/config';
import axios from 'axios';

const API_VERSION = process.env.FACEBOOK_API_VERSION || 'v18.0';
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;

async function main() {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!token) {
    console.error('❌ Faltan FACEBOOK_PAGE_ACCESS_TOKEN en .env');
    console.log('\nObtén el token en:');
    console.log('  Meta Developers → tu App → Messenger → Configuración → "Tokens de acceso"');
    console.log('  Selecciona tu Página y "Generar token"');
    process.exit(1);
  }

  console.log('🔍 Verificando token y obteniendo Page ID...\n');

  try {
    // Llamar a /me con el token (funciona con Page Token y User Token)
    const me = await axios.get(`${GRAPH_URL}/me`, {
      params: {
        access_token: token,
        fields: 'id,name',
      },
    });

    const data = me.data;
    if (!data?.id) {
      console.error('❌ No se pudo obtener información del token');
      process.exit(1);
    }

    // Intentar listar páginas (solo funciona con User Token)
    let pagesResponse: { data: { data?: Array<{ id: string; name: string; access_token?: string }> } } | null = null;
    try {
      pagesResponse = await axios.get(`${GRAPH_URL}/me/accounts`, {
        params: { access_token: token, fields: 'id,name,access_token' },
      });
    } catch {
      // me/accounts falla con Page Token → asumimos que data es la página
    }

    const pages = pagesResponse?.data?.data || [];

    if (pages.length > 0) {
      // Es User Token: mostrar páginas para que elija
      console.log('📋 Este token es de Usuario. Páginas encontradas:\n');
      pages.forEach((p) => {
        console.log(`  Page ID: ${p.id}`);
        console.log(`  Nombre: ${p.name}`);
        console.log(`  → FACEBOOK_PAGE_ID=${p.id}`);
        console.log(`  → FACEBOOK_PAGE_ACCESS_TOKEN=${p.access_token?.substring(0, 20)}...`);
        console.log('');
      });
      console.log('Usa el Page ID y el access_token de la página que quieras en tu .env');
    } else {
      // Es Page Token: /me devolvió la página
      console.log('✅ Token de Página válido');
      console.log(`  Page ID: ${data.id}`);
      console.log(`  Nombre: ${data.name}`);
      console.log(`\n→ Actualiza tu .env: FACEBOOK_PAGE_ID=${data.id}`);
      console.log('  Si FACEBOOK_PAGE_ID tenía otro valor (ej. App ID), cámbialo por este.');
    }
  } catch (err: unknown) {
    const errData = axios.isAxiosError(err) ? err.response?.data?.error : null;
    const msg = errData?.message || (err instanceof Error ? err.message : String(err));
    console.error('❌ Error:', msg);
    if (errData?.code === 190) {
      console.log('\nEl token puede estar expirado. Genera uno nuevo en Meta Developers.');
    }
    process.exit(1);
  }
}

main();
