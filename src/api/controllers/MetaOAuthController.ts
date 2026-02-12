/**
 * MetaOAuthController
 *
 * Flujo OAuth para conectar Facebook e Instagram (Meta) al CRM.
 * Permite a los usuarios iniciar sesión con Meta y autorizar páginas/cuentas
 * para recibir mensajes en el Matrix.
 *
 * Configuración requerida en .env:
 * - META_APP_ID
 * - META_APP_SECRET
 * - META_OAUTH_REDIRECT_BASE (ej: https://unoffered-overstrongly-fermin.ngrok-free.dev)
 *
 * En Meta Developers → Facebook Login → Valid OAuth Redirect URIs:
 * - https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook/callback
 *
 * Facebook e Instagram usan el mismo callback OAuth.
 */

import { Request, Response } from 'express';
import axios from 'axios';

const GRAPH_API = process.env.FACEBOOK_API_URL || 'https://graph.facebook.com';
const API_VERSION = process.env.FACEBOOK_API_VERSION || 'v18.0';

/** Path del callback OAuth (Facebook e Instagram usan el mismo) */
const OAUTH_CALLBACK_PATH = '/api/auth/facebook/callback';

export class MetaOAuthController {
  private getRedirectBase(): string {
    const base = process.env.META_OAUTH_REDIRECT_BASE || process.env.API_URL || 'http://localhost:3001';
    return base.replace(/\/$/, '');
  }

  private getCallbackUrl(): string {
    const base = this.getRedirectBase();
    return `${base}${OAUTH_CALLBACK_PATH}`;
  }

  /**
   * GET /api/auth/facebook/url
   * Devuelve la URL de inicio OAuth para que el frontend redirija correctamente.
   * Usa META_OAUTH_REDIRECT_BASE (URL pública del backend) para que el flujo funcione con ngrok/túneles.
   */
  async getOAuthUrl(req: Request, res: Response): Promise<void> {
    const base = this.getRedirectBase();
    const url = `${base}/api/auth/facebook`;
    res.json({ url });
  }

  /**
   * GET /api/auth/facebook
   * Redirige al usuario al diálogo de login de Facebook/Meta
   */
  async iniciarFacebook(req: Request, res: Response): Promise<void> {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      res.status(500).json({
        success: false,
        error: 'META_APP_ID y META_APP_SECRET deben estar configurados en .env',
      });
      return;
    }

    const callbackUrl = this.getCallbackUrl();
    const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64');

    // Scopes para Messenger e Instagram Messaging
    const scope = [
      'pages_show_list',
      'pages_messaging',
      'pages_manage_metadata',
      'instagram_basic',
      'instagram_manage_messages',
      'pages_read_engagement',
    ].join(',');

    const authUrl = `https://www.facebook.com/${API_VERSION}/dialog/oauth?` + new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      state,
      scope,
      response_type: 'code',
    });

    console.log('[Meta OAuth] Redirigiendo a Facebook. Callback:', callbackUrl);
    res.redirect(authUrl);
  }

  /**
   * GET /api/auth/facebook/callback
   * Recibe el código de Facebook, intercambia por token y obtiene páginas
   */
  async callbackFacebook(req: Request, res: Response): Promise<void> {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      res.status(500).send(`
        <html><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;">
          <h1>Error de configuración</h1>
          <p>META_APP_ID y META_APP_SECRET deben estar configurados en .env</p>
        </body></html>
      `);
      return;
    }

    const { code, error, error_description } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';

    if (error) {
      console.warn('[Meta OAuth] Error:', error, error_description);
      res.status(400).send(`
        <html><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;">
          <h1>Autorización cancelada</h1>
          <p>${String(error_description || error)}</p>
          <p><a href="${frontendUrl}/matrix" style="color:#1877f2;">Volver al Matrix</a></p>
        </body></html>
      `);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).send(`
        <html><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;">
          <h1>Falta código de autorización</h1>
          <p>Facebook no devolvió un código. Intenta de nuevo.</p>
          <p><a href="${this.getRedirectBase()}/api/auth/facebook" style="color:#1877f2;">Iniciar conexión con Meta</a></p>
          <p><a href="${frontendUrl}/matrix" style="color:#1877f2;">Volver al Matrix</a></p>
        </body></html>
      `);
      return;
    }

    const callbackUrl = this.getCallbackUrl();

    try {
      // 1. Intercambiar code por access_token
      const tokenRes = await axios.get(`${GRAPH_API}/${API_VERSION}/oauth/access_token`, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: callbackUrl,
          code,
        },
      });

      const userAccessToken = tokenRes.data?.access_token;
      if (!userAccessToken) {
        throw new Error('No se recibió access_token de Meta');
      }

      // 2. Obtener páginas del usuario (Page Access Tokens)
      const pagesRes = await axios.get(`${GRAPH_API}/${API_VERSION}/me/accounts`, {
        params: { access_token: userAccessToken, fields: 'id,name,access_token,instagram_business_account' },
      });

      const pages = pagesRes.data?.data || [];
      const frontendUrlForSuccess = process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000';

      if (pages.length === 0) {
        res.send(`
          <html><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;">
            <h1>Sin páginas disponibles</h1>
            <p>No tienes páginas de Facebook asociadas a tu cuenta que puedan conectarse.</p>
            <p>Crea una página en <a href="https://www.facebook.com/pages/create">Facebook</a> e intenta de nuevo.</p>
            <p><a href="${frontendUrlForSuccess}/matrix">Volver al Matrix</a></p>
          </body></html>
        `);
        return;
      }

      // Mostrar resultado y tokens para copiar (en dev) o mensaje de éxito
      const firstPage = pages[0];
      const pageToken = firstPage.access_token;

      // Nota: En producción, guardarías el token en BD. Aquí mostramos instrucciones
      const html = `
        <html><body style="font-family:sans-serif;padding:2rem;max-width:700px;margin:auto;">
          <h1>✅ Conexión con Meta exitosa</h1>
          <p>Página detectada: <strong>${firstPage.name}</strong> (ID: ${firstPage.id})</p>
          <p>Para completar la configuración, agrega el siguiente token a tu archivo <code>.env</code>:</p>
          <pre style="background:#f5f5f5;padding:1rem;overflow-x:auto;font-size:12px;">FACEBOOK_PAGE_ID=${firstPage.id}
FACEBOOK_PAGE_ACCESS_TOKEN=${pageToken}</pre>
          ${firstPage.instagram_business_account ? `
          <p>Esta página tiene Instagram Business vinculado. Si usas INSTAGRAM_BUSINESS_ACCOUNT_ID en .env, los mensajes de IG también llegarán al Matrix.</p>
          ` : ''}
          <p><a href="${frontendUrlForSuccess}/matrix?facebook_conectado=1" style="display:inline-block;margin-top:1rem;padding:0.5rem 1rem;background:#1877f2;color:white;text-decoration:none;border-radius:6px;">Volver al Matrix</a></p>
        </body></html>
      `;

      res.send(html);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      const detail = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : '';
      console.error('[Meta OAuth] Error en callback:', msg, detail);

      res.status(500).send(`
        <html><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;">
          <h1>Error al conectar con Meta</h1>
          <p>${msg}</p>
          ${detail ? `<pre style="font-size:11px;color:#666;">${detail}</pre>` : ''}
          <p><a href="${this.getRedirectBase()}/api/auth/facebook" style="color:#1877f2;">Reintentar</a> | <a href="${frontendUrl}/matrix" style="color:#1877f2;">Volver al Matrix</a></p>
        </body></html>
      `);
    }
  }
}
