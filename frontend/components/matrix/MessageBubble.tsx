"use client";

import Image from "next/image";
import { Check, CheckCheck, File, Play, Pause, Download } from "lucide-react";
import { useState, useRef } from "react";

interface Mensaje {
  id: string;
  contenido: string;
  esPaciente: boolean;
  tipoMensaje: "texto" | "imagen" | "audio" | "archivo" | "video" | "sistema";
  fechaEnvio: Date;
  estadoEntrega?: "enviando" | "enviado" | "entregado" | "leido" | "fallido";
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamano?: number;
  audioDuracion?: number;
}

interface Props {
  mensaje: Mensaje;
}

export default function MessageBubble({ mensaje }: Props) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (reproduciendo) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setReproduciendo(!reproduciendo);
  };

  const getEstadoIcon = () => {
    if (mensaje.esPaciente) return null;

    switch (mensaje.estadoEntrega) {
      case "enviado":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "entregado":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "leido":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "fallido":
        return <span className="text-xs text-red-500">!</span>;
      default:
        return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatearTiempo = (fecha: Date) => {
    const d = new Date(fecha);
    return d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearTamano = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatearDuracion = (segundos?: number) => {
    if (!segundos) return "0:00";
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Mensaje del sistema
  if (mensaje.tipoMensaje === "sistema") {
    return (
      <div className="my-4 flex justify-center">
        <div className="rounded-full bg-gray-100 px-4 py-1 text-xs text-gray-600">
          {mensaje.contenido}
        </div>
      </div>
    );
  }

  const esPropio = !mensaje.esPaciente;

  return (
    <div className={`mb-3 flex ${esPropio ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${esPropio ? "items-end" : "items-start"}`}>
        {/* Contenido del mensaje */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            esPropio
              ? "bg-indigo-600 text-white"
              : "border border-gray-200 bg-white text-gray-900"
          }`}
        >
          {/* Imagen */}
          {mensaje.tipoMensaje === "imagen" && mensaje.archivoUrl && (
            <div className="relative mb-2 h-64 w-full min-w-0">
              <Image
                src={mensaje.archivoUrl}
                alt={mensaje.archivoNombre || "Imagen"}
                fill
                unoptimized
                className="rounded-lg object-contain"
              />
            </div>
          )}

          {/* Audio */}
          {mensaje.tipoMensaje === "audio" && mensaje.archivoUrl && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  esPropio ? "bg-indigo-500" : "bg-gray-200"
                }`}
              >
                {reproduciendo ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>
              <div className="flex-1">
                <div className="mb-1 h-1 rounded-full bg-gray-300">
                  <div className="h-1 w-1/3 rounded-full bg-indigo-500" />
                </div>
                <p className="text-xs opacity-80">{formatearDuracion(mensaje.audioDuracion)}</p>
              </div>
              <audio
                ref={audioRef}
                src={mensaje.archivoUrl}
                onEnded={() => setReproduciendo(false)}
              />
            </div>
          )}

          {/* Archivo */}
          {mensaje.tipoMensaje === "archivo" && mensaje.archivoUrl && (
            <a
              href={mensaje.archivoUrl}
              download={mensaje.archivoNombre}
              className="flex items-center gap-3 transition hover:opacity-80"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  esPropio ? "bg-indigo-500" : "bg-gray-200"
                }`}
              >
                <File className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{mensaje.archivoNombre}</p>
                <p className="text-xs opacity-80">{formatearTamano(mensaje.archivoTamano)}</p>
              </div>
              <Download className="h-4 w-4 flex-shrink-0" />
            </a>
          )}

          {/* Video */}
          {mensaje.tipoMensaje === "video" && mensaje.archivoUrl && (
            <div className="mb-2">
              <video
                src={mensaje.archivoUrl}
                controls
                className="max-h-64 rounded-lg"
              />
            </div>
          )}

          {/* Texto */}
          {mensaje.contenido && (
            <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
          )}
        </div>

        {/* Hora y estado */}
        <div
          className={`mt-1 flex items-center gap-1 px-2 text-xs text-gray-500 ${
            esPropio ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatearTiempo(mensaje.fechaEnvio)}</span>
          {getEstadoIcon()}
        </div>
      </div>
    </div>
  );
}
