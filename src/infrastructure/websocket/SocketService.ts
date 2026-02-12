import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initialize();
  }

  private initialize(): void {
    // Middleware de autenticación
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        socket.userId = decoded.id;
        socket.userRole = decoded.rol;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ Socket conectado: ${socket.id} (Usuario: ${socket.userId})`);

      // Registrar socket del usuario
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);

        // Unirse a sala personal
        socket.join(`user:${socket.userId}`);
      }

      // Eventos de mensajería
      socket.on('conversacion:unirse', (conversacionId: string) => {
        socket.join(`conversacion:${conversacionId}`);
        console.log(`Usuario ${socket.userId} se unió a conversación ${conversacionId}`);
      });

      socket.on('conversacion:salir', (conversacionId: string) => {
        socket.leave(`conversacion:${conversacionId}`);
      });

      socket.on('conversacion:escribiendo', (data: { conversacionId: string }) => {
        socket.to(`conversacion:${data.conversacionId}`).emit('conversacion:escritura', {
          conversacionId: data.conversacionId,
          usuario: socket.userId,
        });
      });

      socket.on('mensaje:marcar-leido', (data: { conversacionId: string; mensajeId: string }) => {
        this.io.to(`conversacion:${data.conversacionId}`).emit('mensaje:leido', data);
      });

      // Desconexión
      socket.on('disconnect', () => {
        console.log(`❌ Socket desconectado: ${socket.id}`);
        
        if (socket.userId) {
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  /**
   * Envía un mensaje nuevo a todos los usuarios en una conversación
   */
  emitNuevoMensaje(conversacionId: string, mensaje: any): void {
    this.io.to(`conversacion:${conversacionId}`).emit('mensaje:nuevo', {
      conversacionId,
      mensaje,
    });
  }

  /**
   * Notifica cambios en una conversación
   */
  emitConversacionActualizada(conversacionId: string, cambios: any): void {
    this.io.to(`conversacion:${conversacionId}`).emit('conversacion:actualizada', {
      conversacionId,
      cambios,
    });
  }

  /**
   * Envía notificación a un usuario específico
   */
  emitNotificacionUsuario(userId: string, notificacion: any): void {
    this.io.to(`user:${userId}`).emit('notificacion:nueva', notificacion);
  }

  /**
   * Envía actualización de cita a usuario
   */
  emitActualizacionCita(usuarioId: string, cita: any): void {
    this.io.to(`user:${usuarioId}`).emit('cita:actualizada', cita);
  }

  /**
   * Broadcast general a todos los usuarios conectados
   */
  broadcast(evento: string, data: any): void {
    this.io.emit(evento, data);
  }

  /**
   * Obtiene instancia de Socket.IO
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Obtiene número de usuarios conectados
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Singleton
  private static instance: SocketService | null = null;

  static getInstance(httpServer?: HTTPServer): SocketService {
    if (!SocketService.instance && httpServer) {
      SocketService.instance = new SocketService(httpServer);
    }
    if (!SocketService.instance) {
      throw new Error('SocketService no ha sido inicializado');
    }
    return SocketService.instance;
  }
}

export default SocketService;
