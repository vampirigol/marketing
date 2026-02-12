"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ConversationHeader from "@/components/matrix/ConversationHeader";
import MessageInput from "@/components/matrix/MessageInput";
import MessageBubble from "@/components/matrix/MessageBubble";
import PlantillasRespuesta from "@/components/matrix/PlantillasRespuesta";
import MatrixWebSocketService from "@/lib/matrix-websocket.service";
import { matrixService } from "@/lib/matrix.service";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversacionId = searchParams.get("id");
  
  const [conversacion, setConversacion] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token") || localStorage.getItem("token") || ""
      : "";

  useEffect(() => {
    if (!conversacionId || !token) return;

    cargarDatos();
    conectarWebSocket();

    return () => {
      MatrixWebSocketService.disconnect();
    };
  }, [conversacionId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar conversación y mensajes
      const [convResp, mensajesData] = await Promise.all([
        matrixService.obtenerConversaciones(token, {}),
        matrixService.obtenerMensajes(token, conversacionId!),
      ]);

      const conv = convResp.find((c: any) => c.id === conversacionId);
      if (conv) {
        setConversacion(conv);
      }

      setMensajes(mensajesData);

      try {
        await matrixService.marcarComoLeida(token, conversacionId!);
      } catch {
        /* ignorar */
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const conectarWebSocket = () => {
    if (!conversacionId) return;
    MatrixWebSocketService.connect(token);

    // Unirse a la sala de la conversación
    MatrixWebSocketService.unirseAConversacion(conversacionId);

    // Escuchar nuevos mensajes
    MatrixWebSocketService.on("mensaje:nuevo", (data: any) => {
      if (data.conversacionId === conversacionId) {
        setMensajes((prev) => [...prev, data.mensaje]);
      }
    });

    // Escuchar actualizaciones de conversación
    MatrixWebSocketService.on("conversacion:actualizada", (data: any) => {
      if (data.conversacionId === conversacionId && data.cambios) {
        setConversacion((prev: any) => ({
          ...prev,
          ...data.cambios,
        }));
      }
    });
  };

  const handleEnviarMensaje = async (mensaje: any) => {
    try {
      await matrixService.enviarMensaje(token, conversacionId!, mensaje);
      
      // El mensaje será agregado automáticamente via WebSocket
      // Opcionalmente agregarlo de inmediato para feedback instantáneo
      const mensajeTemp = {
        id: `temp-${Date.now()}`,
        conversacionId,
        esPaciente: false,
        ...mensaje,
        fechaEnvio: new Date(),
        estadoEntrega: "enviando",
      };
      setMensajes((prev) => [...prev, mensajeTemp]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      alert("Error al enviar el mensaje");
    }
  };

  const handleCambiarPrioridad = async (prioridad: string) => {
    try {
      await matrixService.cambiarPrioridad(token, conversacionId!, prioridad);
      setConversacion((prev: any) => ({ ...prev, prioridad }));
    } catch (error) {
      console.error("Error al cambiar prioridad:", error);
    }
  };

  const handleAgregarEtiqueta = async (etiqueta: string) => {
    try {
      await matrixService.agregarEtiqueta(token, conversacionId!, etiqueta);
      setConversacion((prev: any) => ({
        ...prev,
        etiquetas: [...(prev.etiquetas || []), etiqueta],
      }));
    } catch (error) {
      console.error("Error al agregar etiqueta:", error);
    }
  };

  const handleQuitarEtiqueta = async (etiqueta: string) => {
    try {
      await matrixService.quitarEtiqueta(token, conversacionId!, etiqueta);
      setConversacion((prev: any) => ({
        ...prev,
        etiquetas: (prev.etiquetas || []).filter((e: string) => e !== etiqueta),
      }));
    } catch (error) {
      console.error("Error al quitar etiqueta:", error);
    }
  };

  const handleEscalar = async () => {
    if (confirm("¿Escalar esta conversación a recepción?")) {
      try {
        await matrixService.escalarARecepcion(token, conversacionId!);
        alert("Conversación escalada correctamente");
      } catch (error) {
        console.error("Error al escalar:", error);
      }
    }
  };

  const handleArchivar = async () => {
    if (confirm("¿Archivar esta conversación?")) {
      try {
        await matrixService.archivarConversacion(token, conversacionId!);
        alert("Conversación archivada");
        window.history.back();
      } catch (error) {
        console.error("Error al archivar:", error);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!conversacion) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">Conversación no encontrada</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 rounded-xl bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <ConversationHeader
        conversacion={conversacion}
        onBack={() => window.history.back()}
        onCambiarPrioridad={handleCambiarPrioridad}
        onAgregarEtiqueta={handleAgregarEtiqueta}
        onQuitarEtiqueta={handleQuitarEtiqueta}
        onEscalar={handleEscalar}
        onArchivar={handleArchivar}
      />

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl">
          {mensajes.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg">No hay mensajes aún</p>
                <p className="text-sm">Envía el primer mensaje para iniciar la conversación</p>
              </div>
            </div>
          ) : (
            mensajes.map((mensaje) => (
              <MessageBubble key={mensaje.id} mensaje={mensaje} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <MessageInput
        onEnviarMensaje={handleEnviarMensaje}
        onAbrirPlantillas={() => setMostrarPlantillas(true)}
        token={token}
      />

      {/* Modal de Plantillas */}
      {mostrarPlantillas && (
        <PlantillasRespuesta
          token={token}
          onSeleccionar={(contenido) => {
            handleEnviarMensaje({ contenido, tipoMensaje: "texto" });
            setMostrarPlantillas(false);
          }}
          onCerrar={() => setMostrarPlantillas(false)}
        />
      )}
    </div>
  );
}
