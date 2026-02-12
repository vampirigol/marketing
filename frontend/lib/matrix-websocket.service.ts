import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export interface MensajeNuevo {
  conversacionId: string;
  mensaje: {
    id: string;
    contenido: string;
    esPaciente: boolean;
    tipoMensaje: string;
    fechaEnvio: Date;
  };
}

export interface ConversacionActualizada {
  conversacionId: string;
  cambios: {
    prioridad?: string;
    etiquetas?: string[];
    estado?: string;
    asignadoA?: string;
  };
}

export class MatrixWebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("✅ WebSocket conectado para Matrix");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ WebSocket desconectado");
    });

    // Eventos de mensajería
    this.socket.on("mensaje:nuevo", (data: MensajeNuevo) => {
      this.emit("mensaje:nuevo", data);
    });

    this.socket.on("conversacion:actualizada", (data: ConversacionActualizada) => {
      this.emit("conversacion:actualizada", data);
    });

    this.socket.on("conversacion:escritura", (data: { conversacionId: string; usuario: string }) => {
      this.emit("conversacion:escritura", data);
    });

    this.socket.on("mensaje:leido", (data: { conversacionId: string; mensajeId: string }) => {
      this.emit("mensaje:leido", data);
    });

    /** Actualización de inbox (nuevo mensaje FB/IG) - recargar lista de conversaciones */
    this.socket.on("matrix:conversacion:actualizada", (data: { conversacionId: string }) => {
      this.emit("matrix:conversacion:actualizada", data);
    });
  }

  /** Emitir al servidor (p.ej. unirse a sala de conversación) */
  emitToServer(evento: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(evento, data);
    }
  }

  /** Unirse a la sala de una conversación para recibir mensajes en tiempo real */
  unirseAConversacion(conversacionId: string): void {
    this.emitToServer("conversacion:unirse", conversacionId);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Emitir eventos
  enviarEscritura(conversacionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("conversacion:escribiendo", { conversacionId });
    }
  }

  marcarComoLeido(conversacionId: string, mensajeId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("mensaje:marcar-leido", { conversacionId, mensajeId });
    }
  }

  // Sistema de eventos
  on(evento: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(evento)) {
      this.listeners.set(evento, new Set<(data: unknown) => void>());
    }
    this.listeners.get(evento)!.add(callback);
  }

  off(evento: string, callback: (data: unknown) => void): void {
    const eventListeners = this.listeners.get(evento);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(evento: string, data: unknown): void {
    const eventListeners = this.listeners.get(evento);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  // Singleton
  private static instance: MatrixWebSocketService | null = null;

  static getInstance(): MatrixWebSocketService {
    if (!MatrixWebSocketService.instance) {
      MatrixWebSocketService.instance = new MatrixWebSocketService();
    }
    return MatrixWebSocketService.instance;
  }
}

export default MatrixWebSocketService.getInstance();
