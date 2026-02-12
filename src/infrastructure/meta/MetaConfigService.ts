/**
 * MetaConfigService
 *
 * Configura la integración con Meta (Facebook e Instagram) para recibir mensajes
 * en Keila IA (Matrix). Usa la Graph API según la documentación de Meta:
 * https://developers.facebook.com/docs/permissions
 * https://developers.facebook.com/docs/messenger-platform/webhooks
 *
 * Permisos requeridos:
 * - pages_show_list: listar páginas del usuario
 * - pages_messaging: enviar y recibir mensajes en Messenger
 * - pages_manage_metadata: suscribir webhooks a la página
 * - instagram_manage_messages: para Instagram (depende de instagram_basic, pages_read_engagement, pages_show_list)
 */

import axios from 'axios';

const GRAPH_API = process.env.FACEBOOK_API_URL || 'https://graph.facebook.com';
const API_VERSION = process.env.FACEBOOK_API_VERSION || 'v18.0';

export interface MetaConfigResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export interface PageSubscription {
  success: boolean;
  pageId: string;
  subscribedFields: string[];
  error?: string;
}

export class MetaConfigService {
  /**
   * Obtiene el App Access Token (para llamadas a la API de la app)
   * Formato: app_id|app_secret
   */
  private getAppAccessToken(): string | null {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) return null;
    return `${appId}|${appSecret}`;
  }

  /**
   * Suscribe una Página de Facebook a los webhooks de mensajería.
   * Requiere: pages_manage_metadata y pages_messaging en el Page Access Token.
   *
   * Campos recomendados para recibir mensajes en Keila:
   * - messages: mensajes entrantes (Facebook e Instagram)
   * - message_deliveries: confirmación de entrega
   * - message_reads: confirmación de lectura (Messenger)
   * - messaging_postbacks: clics en botones
   */
  async suscribirPaginaAWebhooks(
    pageId: string,
    pageAccessToken: string,
    subscribedFields: string[] = ['messages', 'message_deliveries', 'message_reads', 'messaging_postbacks']
  ): Promise<PageSubscription> {
    try {
      const url = `${GRAPH_API}/${API_VERSION}/${pageId}/subscribed_apps`;
      const params = new URLSearchParams({
        subscribed_fields: subscribedFields.join(','),
        access_token: pageAccessToken,
      });

      const response = await axios.post(`${url}?${params.toString()}`);

      if (response.data?.success === true) {
        return {
          success: true,
          pageId,
          subscribedFields,
        };
      }

      return {
        success: false,
        pageId,
        subscribedFields,
        error: response.data?.error?.message || 'Respuesta inesperada de Meta',
      };
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message || err.message : String(err);
      return {
        success: false,
        pageId,
        subscribedFields,
        error: msg,
      };
    }
  }

  /**
   * Obtiene las suscripciones actuales de una página
   */
  async obtenerSuscripcionesPagina(pageId: string, pageAccessToken: string): Promise<MetaConfigResult> {
    try {
      const url = `${GRAPH_API}/${API_VERSION}/${pageId}/subscribed_apps`;
      const response = await axios.get(url, {
        params: { access_token: pageAccessToken },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message || err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Verifica la configuración del webhook a nivel de app (solo para object=page).
   * Nota: Instagram y WhatsApp se configuran en el App Dashboard, no por API.
   */
  async obtenerSuscripcionesApp(): Promise<MetaConfigResult> {
    const appToken = this.getAppAccessToken();
    if (!appToken) {
      return { success: false, error: 'Faltan META_APP_ID o META_APP_SECRET en .env' };
    }

    try {
      const appId = process.env.META_APP_ID;
      const url = `${GRAPH_API}/${API_VERSION}/${appId}/subscriptions`;
      const response = await axios.get(url, {
        params: { access_token: appToken },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message || err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Obtiene las páginas del usuario (requiere User Access Token con pages_show_list)
   */
  async obtenerPaginasDelUsuario(userAccessToken: string): Promise<MetaConfigResult> {
    try {
      const url = `${GRAPH_API}/${API_VERSION}/me/accounts`;
      const response = await axios.get(url, {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,tasks',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message || err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Verifica que el Page Access Token funcione y tenga los permisos necesarios
   */
  async verificarTokenPagina(pageId: string, pageAccessToken: string): Promise<MetaConfigResult> {
    try {
      const url = `${GRAPH_API}/${API_VERSION}/${pageId}`;
      const response = await axios.get(url, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,name,access_token',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error?.message || err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
