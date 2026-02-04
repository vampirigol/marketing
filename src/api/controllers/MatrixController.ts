import { Request, Response } from 'express';
import { WhatsAppService } from '../../infrastructure/messaging/WhatsAppService';
import { FacebookService } from '../../infrastructure/messaging/FacebookService';
import { InstagramService } from '../../infrastructure/messaging/InstagramService';

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
  };
  mensajes: Mensaje[];
  createdAt: Date;
  updatedAt: Date;
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

  // Cache temporal de conversaciones (en producción usar Redis/DB)
  private conversaciones: Map<string, Conversacion> = new Map();

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.facebookService = new FacebookService();
    this.instagramService = new InstagramService();
  }

  /**
   * Obtiene todas las conversaciones activas
   * GET /api/matrix/conversaciones
   */
  async obtenerConversaciones(req: Request, res: Response): Promise<void> {
    try {
      const { canal, estado, busqueda } = req.query;

      // TODO: Obtener de base de datos
      // const conversaciones = await conversacionRepository.obtenerTodas({ canal, estado, busqueda });

      // Simulación temporal
      const conversaciones = Array.from(this.conversaciones.values());

      let resultado = conversaciones;

      // Filtrar por canal
      if (canal) {
        resultado = resultado.filter(c => c.canal === canal);
      }

      // Filtrar por estado
      if (estado) {
        resultado = resultado.filter(c => c.estado === estado);
      }

      // Búsqueda por nombre
      if (busqueda) {
        const term = (busqueda as string).toLowerCase();
        resultado = resultado.filter(c => 
          c.nombreContacto.toLowerCase().includes(term) ||
          c.ultimoMensaje?.toLowerCase().includes(term)
        );
      }

      res.json({
        success: true,
        conversaciones: resultado,
        total: resultado.length
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo conversaciones:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtiene una conversación específica con todos sus mensajes
   * GET /api/matrix/conversaciones/:id
   */
  async obtenerConversacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: Obtener de base de datos
      // const conversacion = await conversacionRepository.obtenerPorId(id);

      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        conversacion
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo conversación:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
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
      const { contenido, tipo = 'texto' } = req.body;

      if (!contenido) {
        res.status(400).json({
          success: false,
          message: 'Contenido del mensaje es requerido'
        });
        return;
      }

      // TODO: Obtener conversación de BD
      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      // Enviar mensaje según el canal
      let resultado;

      switch (conversacion.canal) {
        case 'whatsapp':
          resultado = await this.whatsappService.enviarMensaje({
            to: conversacion.telefono,
            body: contenido,
            type: tipo
          });
          break;

        case 'facebook':
          resultado = await this.facebookService.enviarMensaje(
            conversacion.canalId,
            contenido
          );
          break;

        case 'instagram':
          resultado = await this.instagramService.enviarMensaje(
            conversacion.canalId,
            contenido
          );
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Canal no soportado'
          });
          return;
      }

      if (!resultado.success) {
        res.status(500).json({
          success: false,
          message: resultado.error || 'Error enviando mensaje'
        });
        return;
      }

      // Actualizar conversación con el nuevo mensaje
      conversacion.ultimoMensaje = contenido;
      conversacion.ultimoMensajeFecha = new Date();

      // TODO: Guardar mensaje en BD
      // await mensajeRepository.crear({
      //   conversacionId: id,
      //   contenido,
      //   tipo,
      //   esDeKeila: true,
      //   estado: 'enviado',
      //   messageId: resultado.messageId
      // });

      res.json({
        success: true,
        mensaje: {
          id: resultado.messageId,
          contenido,
          tipo,
          esDeKeila: true,
          estado: 'enviado',
          fechaHora: new Date()
        }
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error enviando mensaje:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
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

      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      conversacion.mensajesNoLeidos = 0;

      // Marcar como leído en el canal
      switch (conversacion.canal) {
        case 'facebook':
          await this.facebookService.marcarComoVisto(conversacion.canalId);
          break;

        case 'instagram':
          await this.instagramService.marcarComoVisto(conversacion.canalId);
          break;
      }

      res.json({
        success: true,
        message: 'Conversación marcada como leída'
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error marcando como leída:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
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

      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      conversacion.estado = estado;

      // TODO: Actualizar en BD
      // await conversacionRepository.actualizar(id, { estado });

      res.json({
        success: true,
        message: `Conversación marcada como ${estado}`
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error cambiando estado:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
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

      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      if (!conversacion.etiquetas) {
        conversacion.etiquetas = [];
      }

      if (!conversacion.etiquetas.includes(etiqueta)) {
        conversacion.etiquetas.push(etiqueta);
      }

      res.json({
        success: true,
        etiquetas: conversacion.etiquetas
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error agregando etiqueta:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
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

      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      if (conversacion.etiquetas) {
        conversacion.etiquetas = conversacion.etiquetas.filter(
          (e: string) => e !== etiqueta
        );
      }

      res.json({
        success: true,
        etiquetas: conversacion.etiquetas || []
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error eliminando etiqueta:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
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

      const conversacion = this.conversaciones.get(id);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
        return;
      }

      conversacion.pacienteId = pacienteId;

      res.json({
        success: true,
        message: 'Paciente vinculado exitosamente'
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error vinculando paciente:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtiene estadísticas del Contact Center
   * GET /api/matrix/estadisticas
   */
  async obtenerEstadisticas(_req: Request, res: Response): Promise<void> {
    try {
      const conversaciones = Array.from(this.conversaciones.values());

      const estadisticas = {
        activas: conversaciones.filter(c => c.estado === 'activa').length,
        pendientes: conversaciones.filter(c => c.estado === 'pendiente').length,
        cerradasHoy: conversaciones.filter(c => {
          if (c.estado !== 'cerrada') return false;
          const hoy = new Date();
          const fechaConv = new Date(c.ultimoMensajeFecha);
          return fechaConv.toDateString() === hoy.toDateString();
        }).length,
        tiempoRespuestaPromedio: 5, // TODO: Calcular real
        whatsappCount: conversaciones.filter(c => c.canal === 'whatsapp').length,
        facebookCount: conversaciones.filter(c => c.canal === 'facebook').length,
        instagramCount: conversaciones.filter(c => c.canal === 'instagram').length
      };

      res.json({
        success: true,
        estadisticas
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error obteniendo estadísticas:', errorMessage);
      res.status(500).json({
        success: false,
        message: error.message
      });
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
          res.status(200).send(challenge);
          return;
        }

        res.status(403).send('Forbidden');
        return;
      }

      // Procesar webhook
      const webhook = this.whatsappService.procesarWebhook(req.body);

      if (webhook.tipo === 'mensaje') {
        // TODO: Guardar mensaje en BD y emitir evento WebSocket
        console.log('📱 Nuevo mensaje WhatsApp:', webhook.datos);
        
        // Actualizar o crear conversación
        const conversacionId = webhook.datos.de;
        let conversacion = this.conversaciones.get(conversacionId);
        
        if (!conversacion) {
          conversacion = {
            id: conversacionId,
            canal: 'whatsapp',
            canalId: webhook.datos.de,
            telefono: webhook.datos.de,
            nombreContacto: webhook.datos.de,
            ultimoMensaje: webhook.datos.texto,
            ultimoMensajeFecha: new Date(),
            estado: 'activa',
            mensajesNoLeidos: 1,
            etiquetas: ['Nueva']
          };
          this.conversaciones.set(conversacionId, conversacion);
        } else {
          conversacion.ultimoMensaje = webhook.datos.texto;
          conversacion.ultimoMensajeFecha = new Date();
          conversacion.mensajesNoLeidos++;
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
   * Webhook para Facebook Messenger
   * POST /api/matrix/webhooks/facebook
   */
  async webhookFacebook(req: Request, res: Response): Promise<void> {
    try {
      // Verificación similar a WhatsApp
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
          res.status(200).send(challenge);
          return;
        }

        res.status(403).send('Forbidden');
        return;
      }

      const webhook = this.facebookService.procesarWebhook(req.body);

      if (webhook.tipo === 'mensaje') {
        console.log('💬 Nuevo mensaje Facebook:', webhook.datos);
        // TODO: Procesar y guardar
      }

      res.status(200).send('OK');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en webhook Facebook:', errorMessage);
      res.status(500).send('Error');
    }
  }

  /**
   * Webhook para Instagram Direct
   * POST /api/matrix/webhooks/instagram
   */
  async webhookInstagram(req: Request, res: Response): Promise<void> {
    try {
      // Verificación similar a otros webhooks
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
          res.status(200).send(challenge);
          return;
        }

        res.status(403).send('Forbidden');
        return;
      }

      const webhook = this.instagramService.procesarWebhook(req.body);

      if (webhook.tipo === 'mensaje') {
        console.log('💜 Nuevo mensaje Instagram:', webhook.datos);
        // TODO: Procesar y guardar
      }

      res.status(200).send('OK');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en webhook Instagram:', errorMessage);
      res.status(500).send('Error');
    }
  }
}
