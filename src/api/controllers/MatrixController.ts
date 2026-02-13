import { Request, Response } from 'express';
import { WhatsAppService } from '../../infrastructure/messaging/WhatsAppService';
import { FacebookService } from '../../infrastructure/messaging/FacebookService';
import { InstagramService } from '../../infrastructure/messaging/InstagramService';
import { ConversacionRepositoryPostgres } from '../../infrastructure/database/repositories/ConversacionRepository';
import SocketService from '../../infrastructure/websocket/SocketService';
import { solicitudContactoRepository } from '../../infrastructure/database/repositories/SolicitudContactoRepository';
import { SolicitarContactoAgenteUseCase } from '../../core/use-cases/SolicitarContactoAgente';
import { SucursalRepositoryPostgres } from '../../infrastructure/database/repositories/SucursalRepository';
import { PacienteRepositoryPostgres } from '../../infrastructure/database/repositories/PacienteRepository';
import Database from '../../infrastructure/database/Database';
import { NotificacionRepositoryPostgres } from '../../infrastructure/database/repositories/NotificacionRepository';
import { UsuarioSistemaRepositoryPostgres } from '../../infrastructure/database/repositories/UsuarioSistemaRepository';

/**
 * Tipos para el controlador Matrix
 */
interface Conversacion {
  id: string;
  canal: 'whatsapp' | 'facebook' | 'instagram';
  pacienteId?: string;
  pacienteNombre?: string;
  estado: 'activa' | 'pendiente' | 'cerrada';
  ultimoMensaje?: {
    contenido: string;
    timestamp: Date;
    direccion: 'entrante' | 'saliente';
  } | string;
  ultimoMensajeFecha?: Date;
  mensajesNoLeidos?: number;
  mensajes?: Mensaje[];
  canalId?: string;
  telefono?: string;
  nombreContacto?: string;
  etiquetas?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface Mensaje {
  id: string;
  conversacionId: string;
  contenido: string;
  direccion: 'entrante' | 'saliente';
  timestamp: Date;
  estado: 'enviado' | 'entregado' | 'leido' | 'fallido';
  remitente?: string;
}

/**
 * Controlador Matrix para Contact Center (Keila)
 * 
 * FUNCIONALIDADES:
 * - Gestión unificada de conversaciones (WhatsApp, Facebook, Instagram)
 * - Webhooks para recibir mensajes entrantes
 * - Envío de mensajes salientes
 * - Gestión de estado de conversaciones
 * - Estadísticas en tiempo real
 * 
 * USADO POR: Frontend Matrix Keila
 */

export class MatrixController {
  private whatsappService: WhatsAppService;
  private facebookService: FacebookService;
  private instagramService: InstagramService;
  private conversacionRepo: ConversacionRepositoryPostgres;
  private sucursalRepo: SucursalRepositoryPostgres;

  // Cache temporal de conversaciones (en producción usar Redis/DB)
  private conversaciones: Map<string, Conversacion> = new Map();
  
    /**
     * Sincroniza conversaciones históricas desde Meta (Facebook/Instagram) usando Conversations API.
     * Filtra por ownership usando is_owner.
     * GET /api/matrix/sync-meta
     */
    async sincronizarConversacionesMeta(req: Request, res: Response): Promise<void> {
      try {
        // Facebook
        if (this.facebookService.isConfigured()) {
          const url = `${this.facebookService.apiUrl}/${this.facebookService.apiVersion}/me/conversations`;
          const response = await require('axios').get(url, {
            params: {
              fields: 'messages,is_owner',
              access_token: this.facebookService.pageAccessToken
            }
          });
          const conversaciones = response.data.data || [];
          for (const conv of conversaciones) {
            if (!conv.is_owner) continue;
            // Guardar mensajes en BD
            const mensajes = conv.messages?.data || [];
            for (const m of mensajes) {
              await this.conversacionRepo.asegurarConversacionYMensaje({
                canal: 'Facebook',
                canalId: conv.id,
                contenido: m.message || '',
                tipoMensaje: 'texto',
                nombreContacto: '',
              });
            }
          }
        }
        // Instagram
        if (this.instagramService.isConfigured()) {
          const url = `${this.instagramService.apiUrl}/${this.instagramService.apiVersion}/me/conversations`;
          const response = await require('axios').get(url, {
            params: {
              fields: 'messages,is_owner',
              access_token: this.instagramService.pageAccessToken
            }
          });
          const conversaciones = response.data.data || [];
          for (const conv of conversaciones) {
            if (!conv.is_owner) continue;
            const mensajes = conv.messages?.data || [];
            for (const m of mensajes) {
              await this.conversacionRepo.asegurarConversacionYMensaje({
                canal: 'Instagram',
                canalId: conv.id,
                contenido: m.message || '',
                tipoMensaje: 'texto',
                nombreContacto: '',
              });
            }
          }
        }
        res.json({ success: true, message: 'Sincronización completada' });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error sincronizando conversaciones Meta:', errorMessage);
        res.status(500).json({ success: false, message: errorMessage });
      }
    }

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.facebookService = new FacebookService();
    this.instagramService = new InstagramService();
    this.conversacionRepo = new ConversacionRepositoryPostgres();
    this.sucursalRepo = new SucursalRepositoryPostgres();
  }

  /**
   * Mapea canal/estado de BD (PascalCase) al formato frontend (lowercase)
   */
  private mapConversacionParaFrontend(c: {
    id: string;
    canal: string;
    canalId: string;
    pacienteId?: string;
    nombreContacto: string;
    ultimoMensaje?: string;
    fechaUltimoMensaje?: Date;
    mensajesNoLeidos: number;
    estado: string;
    prioridad: string;
    etiquetas: string[];
    asignadoA?: string;
    fechaCreacion: Date;
    fechaCierre?: Date;
  }) {
    const canalMap: Record<string, string> = { WhatsApp: 'whatsapp', Facebook: 'facebook', Instagram: 'instagram' };
    const estadoMap: Record<string, string> = { Activa: 'activa', Pendiente: 'pendiente', Cerrada: 'cerrada' };
    return {
      id: c.id,
      canal: (canalMap[c.canal] || c.canal.toLowerCase()) as 'whatsapp' | 'facebook' | 'instagram',
      canalId: c.canalId,
      pacienteId: c.pacienteId,
      nombreContacto: c.nombreContacto,
      ultimoMensaje: c.ultimoMensaje || '',
      fechaUltimoMensaje: c.fechaUltimoMensaje,
      mensajesNoLeidos: c.mensajesNoLeidos,
      estado: (estadoMap[c.estado] || c.estado.toLowerCase()) as 'activa' | 'pendiente' | 'cerrada',
      prioridad: c.prioridad,
      etiquetas: c.etiquetas || [],
      asignadoA: c.asignadoA,
      fechaCreacion: c.fechaCreacion,
      fechaCierre: c.fechaCierre,
    };
  }

  /**
   * Verifica que el usuario tenga acceso a la conversación (misma sucursal o Contact_Center/Admin).
   * Devuelve la conversación o envía 403/404 y retorna null.
   */
  private async verificarAccesoConversacion(
    req: Request,
    res: Response,
    conversacionId: string
  ): Promise<{ id: string; canal: string; canalId: string; sucursalId?: string } | null> {
    const conversacion = await this.conversacionRepo.obtenerPorId(conversacionId);
    if (!conversacion) {
      res.status(404).json({ success: false, message: 'Conversación no encontrada' });
      return null;
    }
    const puedeVerTodasSucursales = req.user?.rol === 'Contact_Center' || req.user?.rol === 'Admin';
    if (!puedeVerTodasSucursales && conversacion.sucursalId && conversacion.sucursalId !== req.user?.sucursalId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a conversaciones de otra sucursal' });
      return null;
    }
    return conversacion;
  }

  /**
   * Obtiene todas las conversaciones activas desde BD.
   * Contact_Center y Admin ven todas; el resto solo las de su propia sucursal (y sin sucursal: FB/IG).
   * GET /api/matrix/conversaciones
   */
  async obtenerConversaciones(req: Request, res: Response): Promise<void> {
    try {
      const { canal, estado, busqueda } = req.query;
      const canalMap: Record<string, string> = { whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram' };
      const estadoMap: Record<string, string> = { activa: 'Activa', pendiente: 'Pendiente', cerrada: 'Cerrada' };

      const rol = req.user?.rol;
      const puedeVerTodasSucursales = rol === 'Contact_Center' || rol === 'Admin';
      const sucursalIds: string[] | undefined = puedeVerTodasSucursales
        ? undefined
        : req.user?.sucursalId
          ? [req.user.sucursalId]
          : [];

      const conversaciones = await this.conversacionRepo.obtenerTodas({
        canal: canal ? (canalMap[String(canal)] || String(canal)) : undefined,
        estado: estado ? (estadoMap[String(estado)] || String(estado)) : undefined,
        busqueda: busqueda ? String(busqueda) : undefined,
        sucursalIds,
      });

      const resultado = conversaciones.map((c) => this.mapConversacionParaFrontend(c));

      res.json({
        success: true,
        conversaciones: resultado,
        total: resultado.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo conversaciones:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Obtiene una conversación específica con todos sus mensajes desde BD
   * GET /api/matrix/conversaciones/:id
   */
  async obtenerConversacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const conversacion = await this.verificarAccesoConversacion(req, res, id);
      if (!conversacion) return;

      const mensajes = await this.conversacionRepo.obtenerMensajes(id);

      res.json({
        success: true,
        conversacion: {
          ...this.mapConversacionParaFrontend(conversacion),
          mensajes: mensajes.map((m) => ({
            id: m.id,
            conversacionId: m.conversacionId,
            contenido: m.contenido,
            tipo: m.tipoMensaje,
            esDeKeila: !m.esPaciente,
            estado: m.estadoEntrega || 'enviado',
            fechaHora: m.fechaEnvio,
          })),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo conversación:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Envía un mensaje en una conversación
   * POST /api/matrix/conversaciones/:id/mensajes
   */
  async enviarMensaje(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { contenido, tipo = 'texto', archivoUrl, archivoNombre, archivoTipo, archivoTamano, audioDuracion } = req.body;
      const usuario = req.user;

      if (!contenido) {
        res.status(400).json({
          success: false,
          message: 'Contenido del mensaje es requerido',
        });
        return;
      }

      const conversacion = await this.verificarAccesoConversacion(req, res, id);
      if (!conversacion) return;

      // Persistir mensaje en BD (siempre, datos reales)
      const mensajeGuardado = await this.conversacionRepo.enviarMensaje({
        conversacionId: id,
        esPaciente: false,
        usuarioId: usuario?.id,
        contenido,
        tipoMensaje: (tipo as 'texto' | 'imagen' | 'audio' | 'archivo' | 'sistema') || 'texto',
        archivoUrl,
        archivoNombre,
        archivoTipo,
        archivoTamano,
        audioDuracion,
      });

      // Enviar a Facebook/Instagram via Meta API si es conversación de esos canales
      const textoEnviar = tipo === 'texto' ? contenido : tipo === 'imagen' && archivoUrl ? `[Imagen] ${archivoUrl}` : contenido;
      if (conversacion.canal === 'Facebook' && conversacion.canalId) {
        this.facebookService.enviarMensaje(conversacion.canalId, textoEnviar).catch((err) =>
          console.error('Error enviando a Facebook:', err)
        );
      } else if (conversacion.canal === 'Instagram' && conversacion.canalId) {
        this.instagramService.enviarMensaje(conversacion.canalId, textoEnviar).catch((err) =>
          console.error('Error enviando a Instagram:', err)
        );
      }

      res.json({
        success: true,
        mensaje: {
          id: mensajeGuardado.id,
          contenido: mensajeGuardado.contenido,
          tipo: mensajeGuardado.tipoMensaje,
          esDeKeila: true,
          estado: mensajeGuardado.estadoEntrega || 'enviado',
          fechaHora: mensajeGuardado.fechaEnvio,
        },
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando mensaje:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Marca conversación como leída
   * PUT /api/matrix/conversaciones/:id/leer
   */
  async marcarComoLeida(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      await this.conversacionRepo.marcarComoLeida(id);

      res.json({
        success: true,
        message: 'Conversación marcada como leída',
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error marcando como leída:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Cambia el estado de una conversación
   * PUT /api/matrix/conversaciones/:id/estado
   */
  async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!['activa', 'pendiente', 'cerrada'].includes(estado)) {
        res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
        return;
      }

      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      const estadoMap: Record<string, string> = { activa: 'Activa', pendiente: 'Pendiente', cerrada: 'Cerrada' };
      await this.conversacionRepo.actualizarEstado(id, estadoMap[estado] || estado);

      res.json({
        success: true,
        message: `Conversación marcada como ${estado}`
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error cambiando estado:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Agrega etiqueta a conversación
   * POST /api/matrix/conversaciones/:id/etiquetas
   */
  async agregarEtiqueta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { etiqueta } = req.body;

      if (!etiqueta) {
        res.status(400).json({
          success: false,
          message: 'Etiqueta es requerida'
        });
        return;
      }

      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      await this.conversacionRepo.agregarEtiqueta(id, etiqueta);
      const actualizado = await this.conversacionRepo.obtenerPorId(id);

      res.json({
        success: true,
        etiquetas: actualizado?.etiquetas || [],
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error agregando etiqueta:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Elimina etiqueta de conversación
   * DELETE /api/matrix/conversaciones/:id/etiquetas/:etiqueta
   */
  async eliminarEtiqueta(req: Request, res: Response): Promise<void> {
    try {
      const { id, etiqueta } = req.params;

      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      await this.conversacionRepo.quitarEtiqueta(id, decodeURIComponent(etiqueta));
      const actualizado = await this.conversacionRepo.obtenerPorId(id);

      res.json({
        success: true,
        etiquetas: actualizado?.etiquetas || [],
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error eliminando etiqueta:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Vincula conversación con un paciente
   * PUT /api/matrix/conversaciones/:id/paciente
   */
  async vincularPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { pacienteId } = req.body;

      if (!pacienteId) {
        res.status(400).json({
          success: false,
          message: 'ID de paciente es requerido'
        });
        return;
      }

      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      await this.conversacionRepo.vincularPaciente(id, pacienteId);

      res.json({
        success: true,
        message: 'Paciente vinculado exitosamente'
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error vinculando paciente:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Obtiene estadísticas del Contact Center
   * GET /api/matrix/estadisticas
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const puedeVerTodasSucursales = req.user?.rol === 'Contact_Center' || req.user?.rol === 'Admin';
      const sucursalIds: string[] | undefined = puedeVerTodasSucursales
        ? undefined
        : req.user?.sucursalId
          ? [req.user.sucursalId]
          : [];
      const conversaciones = await this.conversacionRepo.obtenerTodas({ sucursalIds });
      const hoy = new Date().toDateString();

      const estadisticas = {
        activas: conversaciones.filter((c) => c.estado === 'Activa').length,
        pendientes: conversaciones.filter((c) => c.estado === 'Pendiente').length,
        cerradasHoy: conversaciones.filter((c) => {
          if (c.estado !== 'Cerrada') return false;
          const fechaConv = c.fechaCierre ? new Date(c.fechaCierre) : null;
          return fechaConv && fechaConv.toDateString() === hoy;
        }).length,
        tiempoRespuestaPromedio: 5,
        whatsappCount: conversaciones.filter((c) => c.canal === 'WhatsApp').length,
        facebookCount: conversaciones.filter((c) => c.canal === 'Facebook').length,
        instagramCount: conversaciones.filter((c) => c.canal === 'Instagram').length,
      };

      res.json({
        success: true,
        estadisticas,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo estadísticas:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Crea o vincula una solicitud de contacto (lead) desde webhook para que aparezca en el embudo CRM.
   * Si ya existe una solicitud activa con ese teléfono, no crea duplicado.
   */
  /**
   * Persiste mensaje entrante de Facebook/Instagram en BD y emite WebSocket para Keila IA.
   * Obtiene nombre real desde Meta API para mostrar en lugar del PSID.
   */
  private async procesarMensajeEntranteMeta(
    canal: 'Facebook' | 'Instagram',
    canalId: string,
    contenido: string,
    tipoMensaje: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video' = 'texto',
    archivoUrl?: string
  ): Promise<void> {
    let nombreContacto: string | undefined;
    try {
      if (canal === 'Facebook') {
        const perfil = await this.facebookService.obtenerPerfilUsuario(canalId);
        if (perfil.firstName || perfil.lastName) {
          nombreContacto = [perfil.firstName, perfil.lastName].filter(Boolean).join(' ').trim();
        }
      } else if (canal === 'Instagram') {
        const perfil = await this.instagramService.obtenerPerfilUsuario(canalId);
        if (perfil.name) nombreContacto = perfil.name;
      }
    } catch {
      /* Continuar sin nombre si falla la API */
    }

    const { conversacionId, mensaje } = await this.conversacionRepo.asegurarConversacionYMensaje({
      canal,
      canalId,
      contenido,
      tipoMensaje,
      archivoUrl,
      nombreContacto,
    });

    // Si el nombre es un PSID (solo números), intentar actualizarlo usando la API de perfil de Meta
    const esPsid = nombreContacto && /^\d+$/.test(nombreContacto.trim());
    if (!nombreContacto || esPsid) {
      Promise.resolve().then(async () => {
        try {
          if (canal === 'Facebook') {
            const perfil = await this.facebookService.obtenerPerfilUsuario(canalId);
            if (perfil.firstName || perfil.lastName) {
              const nombre = [perfil.firstName, perfil.lastName].filter(Boolean).join(' ').trim();
              await this.conversacionRepo.actualizarNombreContacto(conversacionId, nombre);
              SocketService.getInstance().broadcast('matrix:conversacion:actualizada', { conversacionId });
              console.log('[Meta] Nombre actualizado para Facebook:', nombre);
            }
          } else if (canal === 'Instagram') {
            const perfil = await this.instagramService.obtenerPerfilUsuario(canalId);
            if (perfil.name) {
              await this.conversacionRepo.actualizarNombreContacto(conversacionId, perfil.name);
              SocketService.getInstance().broadcast('matrix:conversacion:actualizada', { conversacionId });
              console.log('[Meta] Nombre actualizado para Instagram:', perfil.name);
            }
          }
        } catch (err) {
          console.warn('[Meta] Error actualizando nombre de contacto:', err);
        }
      });
    }

    try {
      const socket = SocketService.getInstance();
      socket.emitNuevoMensaje(conversacionId, {
        id: mensaje.id,
        contenido: mensaje.contenido,
        tipo: mensaje.tipoMensaje,
        esDeKeila: false,
        timestamp: mensaje.fechaEnvio,
      });
      console.log('[WS] Emitiendo matrix:conversacion:actualizada:', { conversacionId });
      socket.broadcast('matrix:conversacion:actualizada', { conversacionId });
    } catch (err) {
      console.error('[WS] Error al emitir evento matrix:conversacion:actualizada:', err);
    }
  }

  private async asegurarSolicitudDesdeWebhook(
    canal: 'WhatsApp' | 'Facebook' | 'Instagram',
    telefono: string,
    nombreContacto?: string
  ): Promise<void> {
    try {
      const existente = await solicitudContactoRepository.obtenerPendientePorTelefono(telefono);
      if (existente) return;

      const sucursalRepo = new SucursalRepositoryPostgres();
      const sucursales = await sucursalRepo.obtenerTodas();
      const sucursal = sucursales[0];
      if (!sucursal) return;

      let noAfiliacion: string | undefined;
      try {
        const pacienteRepo = new PacienteRepositoryPostgres();
        noAfiliacion = await pacienteRepo.obtenerSiguienteNoAfiliacion();
      } catch {
        /* ignorar */
      }

      const useCase = new SolicitarContactoAgenteUseCase(solicitudContactoRepository);
      const resultado = await useCase.ejecutar({
        nombreCompleto: nombreContacto || `Contacto ${canal}`,
        telefono,
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        motivo: 'Consulta_General',
        preferenciaContacto: 'WhatsApp',
        origen: canal,
        creadoPor: 'Webhook',
        noAfiliacion,
      });

      const pool = Database.getInstance().getPool();
      const notifRepo = new NotificacionRepositoryPostgres(pool);
      const userRepo = new UsuarioSistemaRepositoryPostgres();
      const contactCenter = await userRepo.obtenerPorRol('Contact_Center');
      const admins = await userRepo.obtenerPorRol('Admin');
      const userIds = [...new Set([...contactCenter, ...admins].map((u) => u.id))];
      const titulo = 'Nuevo lead';
      const mensaje = `${resultado.solicitud.nombreCompleto} · ${resultado.solicitud.sucursalNombre} · Origen: ${canal}`;
      for (const usuarioId of userIds) {
        await notifRepo.crear({
          usuarioId,
          tipo: 'nuevo_lead',
          titulo,
          mensaje,
          data: { solicitudId: resultado.solicitud.id },
          canal: 'App',
        });
      }
    } catch (err) {
      console.error('Error asegurando solicitud desde webhook:', err);
    }
  }

  /**
   * Webhook para WhatsApp (recibe mensajes entrantes)
   * POST /api/matrix/webhooks/whatsapp
   */
  async webhookWhatsApp(req: Request, res: Response): Promise<void> {
    try {
      // Verificación de webhook (setup inicial)
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
          res.status(200).send(String(challenge ?? ''));
          return;
        }

        res.status(403).send('Forbidden');
        return;
      }

      // Procesar webhook
      const webhook = this.whatsappService.procesarWebhook(req.body);

      if (webhook.tipo === 'mensaje') {
        const datos = webhook.datos as { de?: string; texto?: string; nombreContacto?: string; phone_number_id?: string };
        const from = String(datos.de ?? '');
        const texto = String(datos.texto ?? '');
        const nombreContacto = String(datos.nombreContacto ?? datos.de ?? from);

        console.log('📱 Nuevo mensaje WhatsApp:', { from, texto: texto?.slice(0, 50), phone_number_id: datos.phone_number_id });

        // Multi-sucursal: enrutar por phone_number_id → sucursal
        const phoneNumberId = datos.phone_number_id ? String(datos.phone_number_id) : '';
        const sucursal = phoneNumberId ? await this.sucursalRepo.findByWhatsAppPhoneNumberId(phoneNumberId) : null;

        await this.asegurarSolicitudDesdeWebhook('WhatsApp', from, nombreContacto || from);

        // Guardar en conversaciones_matrix (con sucursal_id si hay sucursal para este número)
        const { conversacionId, mensaje } = await this.conversacionRepo.asegurarConversacionYMensaje({
          canal: 'WhatsApp',
          canalId: from,
          contenido: texto,
          tipoMensaje: 'texto',
          nombreContacto: nombreContacto || from,
          sucursalId: sucursal?.id,
        });

        try {
          const socket = SocketService.getInstance();
          socket.emitNuevoMensaje(conversacionId, {
            id: mensaje.id,
            contenido: mensaje.contenido,
            tipo: mensaje.tipoMensaje,
            esDeKeila: false,
            timestamp: mensaje.fechaEnvio,
          });
          // Enrutar solo a agentes de esta sucursal (sala sucursal:id)
          if (sucursal?.id) {
            socket.emitToSucursal(sucursal.id, 'matrix:conversacion:actualizada', { conversacionId });
          } else {
            socket.broadcast('matrix:conversacion:actualizada', { conversacionId });
          }
        } catch {
          /* Socket no inicializado */
        }
      }

      res.status(200).send('OK');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en webhook WhatsApp:', errorMessage);
      res.status(500).send('Error');
    }
  }

  /**
   * Webhook unificado para Meta (Facebook Messenger + Instagram)
   * URL: /webhooks/messenger (configurar en Meta: https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger)
   * GET: Verificación. POST: Recibe mensajes de Facebook e Instagram.
   */
  async webhookMessenger(req: Request, res: Response): Promise<void> {
    try {
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const envToken = process.env.INSTAGRAM_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN;

        if (!mode || !token) {
          console.warn('[Meta Webhook] ❌ Faltan parámetros: hub.mode o hub.verify_token');
          res.status(400).send('Bad Request');
          return;
        }

        if (mode === 'subscribe' && envToken && token === envToken) {
          res.status(200).type('text/plain').send(String(challenge ?? ''));
          console.log('[Meta Webhook] ✅ Verificación exitosa');
          return;
        }

        console.warn('[Meta Webhook] ❌ Token incorrecto');
        res.status(403).send('Forbidden');
        return;
      }

      // POST: Responder 200 inmediatamente
      res.status(200).send('OK');

      const body = req.body as { object?: string };
      if (body.object === 'instagram') {
        const mensajes = this.instagramService.extraerMensajes(req.body);
        for (const m of mensajes) {
          console.log('💜 Nuevo mensaje Instagram:', { senderId: m.senderId, texto: m.texto?.substring(0, 50) });
          this.procesarMensajeEntranteMeta('Instagram', m.senderId, m.texto).catch((err) =>
            console.error('Error guardando mensaje Instagram:', err)
          );
          this.asegurarSolicitudDesdeWebhook('Instagram', m.senderId).catch((err) =>
            console.error('Error asegurando solicitud Instagram:', err)
          );
        }
        return;
      }

      if (body.object === 'page') {
        const mensajes = this.facebookService.extraerMensajes(req.body);
        if (mensajes.length > 0) {
          for (const m of mensajes) {
            console.log('💬 Nuevo mensaje Facebook:', { senderId: m.senderId, texto: m.texto?.substring(0, 80) });
            this.procesarMensajeEntranteMeta('Facebook', m.senderId, m.texto, m.tipoMensaje || 'texto').catch((err) =>
              console.error('Error guardando mensaje Facebook:', err)
            );
            this.asegurarSolicitudDesdeWebhook('Facebook', m.senderId).catch((err) =>
              console.error('Error asegurando solicitud Facebook:', err)
            );
          }
        } else {
          // object page sin mensajes de Facebook: intentar extraer Instagram (Meta puede enviar IG en formato page)
          const msgIg = this.instagramService.extraerMensajes(req.body);
          for (const m of msgIg) {
            console.log('💜 Nuevo mensaje Instagram (page):', { senderId: m.senderId, texto: m.texto?.substring(0, 50) });
            this.procesarMensajeEntranteMeta('Instagram', m.senderId, m.texto).catch((err) =>
              console.error('Error guardando mensaje Instagram:', err)
            );
            this.asegurarSolicitudDesdeWebhook('Instagram', m.senderId).catch((err) =>
              console.error('Error asegurando solicitud Instagram:', err)
            );
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en webhook Messenger:', errorMessage);
      if (!res.headersSent) res.status(500).send('Error');
    }
  }

  /**
   * Webhook para Facebook Messenger
   * GET  /api/matrix/webhooks/facebook → Verificación (Facebook envía hub.mode, hub.verify_token, hub.challenge)
   * POST /api/matrix/webhooks/facebook → Recepción de mensajes
   */
  async webhookFacebook(req: Request, res: Response): Promise<void> {
    try {
      // ------------------------------------------------------------------
      // VERIFICACIÓN GET: Lo que Facebook necesita al hacer "Verificar y guardar"
      // ------------------------------------------------------------------
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const envToken = process.env.FACEBOOK_VERIFY_TOKEN;

        // 1. Si faltan parámetros → 400
        if (!mode || !token) {
          console.warn('[Facebook Webhook] ❌ Faltan parámetros: hub.mode o hub.verify_token');
          res.status(400).send('Bad Request');
          return;
        }

        // 2. Verificar que el token coincida con FACEBOOK_VERIFY_TOKEN del .env
        if (mode === 'subscribe' && envToken && token === envToken) {
          const challengeStr = String(challenge ?? '');
          res.status(200).type('text/plain').send(challengeStr);
          console.log('[Facebook Webhook] ✅ Verificación exitosa');
          return;
        }

        // 3. Token incorrecto o modo inválido → 403
        console.warn('[Facebook Webhook] ❌ Token incorrecto o FACEBOOK_VERIFY_TOKEN no definido en .env');
        res.status(403).send('Forbidden');
        return;
      }

      // ------------------------------------------------------------------
      // POST: Recepción de mensajes (Servidor a Servidor)
      // Responder 200 de inmediato; procesar en background y GUARDAR en BD
      // ------------------------------------------------------------------
      res.status(200).send('OK');

      const body = req.body as { object?: string };
      if (body.object !== 'page') {
        console.log('[Facebook Webhook] POST ignorado: object != page');
        return;
      }

      const mensajes = this.facebookService.extraerMensajes(req.body);
      if (mensajes.length === 0) {
        console.log('[Facebook Webhook] POST sin mensajes extraíbles (payload puede ser delivery/read/postback)');
        return;
      }

      for (const m of mensajes) {
        console.log('💬 Nuevo mensaje Facebook:', { senderId: m.senderId, texto: m.texto?.substring(0, 80), tipo: m.tipoMensaje });
        this.procesarMensajeEntranteMeta('Facebook', m.senderId, m.texto, m.tipoMensaje || 'texto').catch((err) =>
          console.error('Error guardando mensaje Facebook:', err)
        );
        this.asegurarSolicitudDesdeWebhook('Facebook', m.senderId).catch((err) =>
          console.error('Error asegurando solicitud Facebook:', err)
        );
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en webhook Facebook:', errorMessage);
      if (!res.headersSent) res.status(500).send('Error');
    }
  }

  /**
   * Webhook para Instagram Direct
   * GET  /api/matrix/webhooks/instagram → Verificación (Meta envía hub.mode, hub.verify_token, hub.challenge)
   * POST /api/matrix/webhooks/instagram → Recepción de mensajes
   */
  async webhookInstagram(req: Request, res: Response): Promise<void> {
    try {
      // Verificación GET: Meta requiere esto al configurar el webhook de Instagram
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const envToken = process.env.INSTAGRAM_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN;

        if (!mode || !token) {
          console.warn('[Instagram Webhook] ❌ Faltan parámetros: hub.mode o hub.verify_token');
          res.status(400).send('Bad Request');
          return;
        }

        if (mode === 'subscribe' && envToken && token === envToken) {
          res.status(200).type('text/plain').send(String(challenge ?? ''));
          console.log('[Instagram Webhook] ✅ Verificación exitosa');
          return;
        }

        console.warn('[Instagram Webhook] ❌ Token incorrecto o INSTAGRAM_VERIFY_TOKEN no definido');
        res.status(403).send('Forbidden');
        return;
      }

      // POST: Responder 200 inmediatamente; procesar en background y GUARDAR en BD
      res.status(200).send('OK');

      const body = req.body as { object?: string };
      if (body.object !== 'instagram' && body.object !== 'page') return;

      const mensajes = this.instagramService.extraerMensajes(req.body);
      for (const m of mensajes) {
        console.log('💜 Nuevo mensaje Instagram:', { senderId: m.senderId, texto: m.texto?.substring(0, 50) });
        this.procesarMensajeEntranteMeta('Instagram', m.senderId, m.texto).catch((err) =>
          console.error('Error guardando mensaje Instagram:', err)
        );
        this.asegurarSolicitudDesdeWebhook('Instagram', m.senderId).catch((err) =>
          console.error('Error asegurando solicitud Instagram:', err)
        );
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en webhook Instagram:', errorMessage);
      if (!res.headersSent) res.status(500).send('Error');
    }
  }

  /**
   * Cambia la prioridad de una conversación
   * PUT /api/matrix/conversaciones/:id/prioridad
   */
  async cambiarPrioridad(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { prioridad } = req.body;

      if (!['Urgente', 'Alta', 'Normal', 'Baja'].includes(prioridad)) {
        res.status(400).json({
          success: false,
          message: 'Prioridad inválida',
        });
        return;
      }

      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      await this.conversacionRepo.actualizarPrioridad(id, prioridad);

      res.json({
        success: true,
        message: `Prioridad actualizada a ${prioridad}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error cambiando prioridad:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Asigna o escala conversación a otro usuario
   * PUT /api/matrix/conversaciones/:id/asignar
   */
  async asignarConversacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { usuarioId } = req.body;

      if (!usuarioId) {
        res.status(400).json({
          success: false,
          message: 'Usuario ID es requerido',
        });
        return;
      }

      const existe = await this.verificarAccesoConversacion(req, res, id);
      if (!existe) return;

      await this.conversacionRepo.asignar(id, usuarioId);

      res.json({
        success: true,
        message: 'Conversación asignada exitosamente',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error asignando conversación:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Obtiene plantillas de respuestas rápidas
   * GET /api/matrix/plantillas
   */
  async obtenerPlantillas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const plantillas = await this.conversacionRepo.obtenerPlantillas(usuarioId);

      res.json({
        success: true,
        plantillas,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo plantillas:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Crea una nueva plantilla de respuesta
   * POST /api/matrix/plantillas
   */
  async crearPlantilla(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, contenido, etiquetas, esGlobal } = req.body;

      if (!nombre || !contenido) {
        res.status(400).json({
          success: false,
          message: 'Nombre y contenido son requeridos',
        });
        return;
      }

      const usuarioId = req.user?.id;
      const plantilla = await this.conversacionRepo.crearPlantilla({
        usuarioId: esGlobal ? undefined : usuarioId,
        nombre,
        contenido,
        etiquetas: etiquetas || [],
        esGlobal: esGlobal || false,
        activa: true,
        creadoPor: usuarioId,
      });

      res.status(201).json({
        success: true,
        plantilla,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error creando plantilla:', errorMessage);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }
}
