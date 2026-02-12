/**
 * MetaConfigController
 *
 * Endpoints para configurar la integración con Meta (Facebook e Instagram):
 * - Suscribir páginas a webhooks de mensajería
 * - Verificar tokens y suscripciones
 * - Listar páginas del usuario
 *
 * Permisos Meta requeridos: pages_show_list, pages_messaging, pages_manage_metadata
 * Docs: https://developers.facebook.com/docs/permissions
 */

import { Request, Response } from 'express';
import { MetaConfigService } from '../../infrastructure/meta/MetaConfigService';

const metaConfigService = new MetaConfigService();

export class MetaConfigController {
  /**
   * Indica qué canales Facebook/Instagram tienen tokens configurados en .env.
   * El frontend usa esto para mostrar conversaciones en la bandeja de entrada.
   * GET /api/meta-config/canales-conectados
   */
  async obtenerCanalesConectados(_req: Request, res: Response): Promise<void> {
    const facebook = Boolean(
      process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()
    );
    const instagram = Boolean(
      process.env.INSTAGRAM_PAGE_ACCESS_TOKEN?.trim() ||
        (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim())
    );
    res.json({ facebook, instagram });
  }
  /**
   * Suscribe una Página de Facebook a los webhooks de mensajería.
   * POST /api/meta-config/suscribir-pagina
   * Body: { pageId, pageAccessToken, subscribedFields?: string[] }
   */
  async suscribirPagina(req: Request, res: Response): Promise<void> {
    try {
      const { pageId, pageAccessToken, subscribedFields } = req.body;

      if (!pageId || !pageAccessToken) {
        res.status(400).json({
          success: false,
          message: 'Se requieren pageId y pageAccessToken',
        });
        return;
      }

      const result = await metaConfigService.suscribirPaginaAWebhooks(
        pageId,
        pageAccessToken,
        subscribedFields || ['messages', 'message_deliveries', 'message_reads', 'messaging_postbacks']
      );

      if (result.success) {
        res.json({
          success: true,
          message: `Página ${pageId} suscrita correctamente a webhooks`,
          subscribedFields: result.subscribedFields,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Error al suscribir página',
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error suscribiendo página Meta:', msg);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * Obtiene las suscripciones actuales de una página.
   * GET /api/meta-config/suscripciones-pagina?pageId=...&pageAccessToken=...
   */
  async obtenerSuscripcionesPagina(req: Request, res: Response): Promise<void> {
    try {
      const { pageId, pageAccessToken } = req.query;

      if (!pageId || !pageAccessToken) {
        res.status(400).json({
          success: false,
          message: 'Se requieren pageId y pageAccessToken en query',
        });
        return;
      }

      const result = await metaConfigService.obtenerSuscripcionesPagina(
        String(pageId),
        String(pageAccessToken)
      );

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * Obtiene las suscripciones a nivel de app.
   * GET /api/meta-config/suscripciones-app
   */
  async obtenerSuscripcionesApp(req: Request, res: Response): Promise<void> {
    try {
      const result = await metaConfigService.obtenerSuscripcionesApp();

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * Lista las páginas que el usuario gestiona (requiere User Access Token).
   * GET /api/meta-config/paginas?userAccessToken=...
   */
  async obtenerPaginas(req: Request, res: Response): Promise<void> {
    try {
      const userAccessToken = req.query.userAccessToken as string;
      if (!userAccessToken) {
        res.status(400).json({
          success: false,
          message: 'Se requiere userAccessToken en query',
        });
        return;
      }

      const result = await metaConfigService.obtenerPaginasDelUsuario(userAccessToken);

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * Verifica que el Page Access Token sea válido.
   * GET /api/meta-config/verificar-token?pageId=...&pageAccessToken=...
   */
  async verificarTokenPagina(req: Request, res: Response): Promise<void> {
    try {
      const { pageId, pageAccessToken } = req.query;

      if (!pageId || !pageAccessToken) {
        res.status(400).json({
          success: false,
          message: 'Se requieren pageId y pageAccessToken',
        });
        return;
      }

      const result = await metaConfigService.verificarTokenPagina(
        String(pageId),
        String(pageAccessToken)
      );

      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, message: msg });
    }
  }
}
