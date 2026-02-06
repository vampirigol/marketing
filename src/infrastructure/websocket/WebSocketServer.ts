import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * Tipos para WebSocket
 */
interface ClientInfo {
  socketId: string;
  userId: string;
  rol?: string;
  conectadoEn: Date;
}

/**
 * WebSocket Server para comunicación en tiempo real
 * 
 * FUNCIONALIDADES:
 * - Notificaciones en tiempo real de nuevos mensajes
 * - Actualizaciones de estado de conversaciones
 * - Indicadores de "escribiendo..."
 * - Sincronización multi-dispositivo para Keila
 * - Alertas de citas y eventos importantes
 * 
 * USADO POR: Frontend Matrix Keila
 */

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: Map<string, ClientInfo>;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.connectedClients = new Map();
    this.initializeSocketHandlers();
  }

  /**
   * Inicializa los manejadores de eventos de Socket.IO
   */
  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Autenticación del cliente
      socket.on('auth', (data: { userId: string; rol: string }) => {
        this.connectedClients.set(socket.id, {
          socketId: socket.id,
          userId: data.userId,
          rol: data.rol,
          conectadoEn: new Date()
        });

        console.log(`✅ Usuario autenticado: ${data.userId} (${data.rol})`);
        
        // Unirse a sala específica del usuario
        socket.join(`user:${data.userId}`);
        
        // Si es Keila o admin, unirse a sala de contact center
        if (data.rol === 'Contact_Center' || data.rol === 'Admin') {
          socket.join('contact-center');
        }

        // Enviar confirmación
        socket.emit('auth:success', {
          message: 'Autenticación exitosa',
          clientId: socket.id
        });
      });

      // Keila está escribiendo en una conversación
      socket.on('conversacion:escribiendo', (data: { conversacionId: string }) => {
        // Broadcast a otros clientes de Keila
        socket.to('contact-center').emit('conversacion:escribiendo', {
          conversacionId: data.conversacionId,
          userId: this.connectedClients.get(socket.id)?.userId
        });
      });

      // Marcar conversación como leída
      socket.on('conversacion:leida', (data: { conversacionId: string }) => {
        socket.to('contact-center').emit('conversacion:leida', {
          conversacionId: data.conversacionId
        });
      });

      // Cliente se desconecta
      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });

    console.log('✅ WebSocket Server inicializado');
  }

  /**
   * Notifica nuevo mensaje entrante a todos los clientes de contact center
   */
  notificarNuevoMensaje(mensaje: {
    conversacionId: string;
    contenido: string;
    canal: string;
    de: string;
    timestamp: Date;
  }): void {
    this.io.to('contact-center').emit('mensaje:nuevo', mensaje);
    console.log(`📬 Mensaje nuevo emitido: ${mensaje.conversacionId}`);
  }

  /**
   * Notifica cambio de estado de conversación
   */
  notificarCambioEstado(conversacionId: string, nuevoEstado: string): void {
    this.io.to('contact-center').emit('conversacion:estado', {
      conversacionId,
      estado: nuevoEstado,
      timestamp: new Date()
    });
  }

  /**
   * Notifica nueva conversación creada
   */
  notificarNuevaConversacion(conversacion: Record<string, unknown>): void {
    this.io.to('contact-center').emit('conversacion:nueva', conversacion);
    console.log(`🆕 Nueva conversación: ${conversacion.id}`);
  }

  /**
   * Notifica actualización de estadísticas
   */
  notificarEstadisticas(estadisticas: Record<string, unknown>): void {
    this.io.to('contact-center').emit('estadisticas:actualizacion', estadisticas);
  }

  /**
   * Notifica alerta de cita (recordatorio, no llegada, etc.)
   */
  notificarAlertaCita(alerta: {
    tipo: 'recordatorio' | 'no_llegada' | 'confirmacion';
    citaId: string;
    pacienteNombre: string;
    mensaje: string;
  }): void {
    // Notificar a contact center y finanzas
    this.io.emit('cita:alerta', alerta);
    console.log(`⏰ Alerta de cita emitida: ${alerta.tipo}`);
  }

  /**
   * Notifica a un usuario específico
   */
  notificarUsuario(userId: string, evento: string, data: Record<string, unknown>): void {
    this.io.to(`user:${userId}`).emit(evento, data);
  }

  /**
   * Notifica a todos los clientes conectados
   */
  notificarTodos(evento: string, data: Record<string, unknown>): void {
    this.io.emit(evento, data);
  }

  /**
   * Obtiene estadísticas de conexiones actuales
   */
  getEstadisticasConexiones(): {
    totalClientes: number;
    clientesPorRol: Record<string, number>;
  } {
    const stats = {
      totalClientes: this.connectedClients.size,
      clientesPorRol: {} as Record<string, number>
    };

    for (const client of this.connectedClients.values()) {
      const rol = client.rol || 'desconocido';
      stats.clientesPorRol[rol] = (stats.clientesPorRol[rol] || 0) + 1;
    }

    return stats;
  }

  /**
   * Desconecta todos los clientes (útil para shutdown)
   */
  desconectarTodos(): void {
    this.io.disconnectSockets();
    this.connectedClients.clear();
    console.log('🔌 Todos los clientes desconectados');
  }

  /**
   * Obtiene la instancia de Socket.IO
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  getConnectedCount(): number {
    return this.io.engine.clientsCount;
  }
}

// Singleton instance (se inicializa en index.ts)
let webSocketServer: WebSocketServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  if (!webSocketServer) {
    webSocketServer = new WebSocketServer(httpServer);
  }
  return webSocketServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return webSocketServer;
}
