"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Send, Paperclip, Mic, Zap, X, File } from "lucide-react";
import { uploadService } from "@/lib/upload.service";

interface Props {
  onEnviarMensaje: (mensaje: {
    contenido: string;
    tipoMensaje: "texto" | "imagen" | "audio" | "archivo" | "video";
    archivoUrl?: string;
    archivoNombre?: string;
    archivoTipo?: string;
    archivoTamano?: number;
    audioDuracion?: number;
  }) => void;
  onAbrirPlantillas: () => void;
  token: string;
  disabled?: boolean;
}

export default function MessageInput({ onEnviarMensaje, onAbrirPlantillas, token, disabled }: Props) {
  const [mensaje, setMensaje] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnviar = async () => {
    if (archivo) {
      try {
        setSubiendo(true);
        
        // Subir archivo al servidor
        const archivoSubido = await uploadService.subirArchivoMensaje(archivo, token);
        
        const tipo = archivo.type.startsWith("image/")
          ? "imagen"
          : archivo.type.startsWith("video/")
          ? "video"
          : "archivo";

        onEnviarMensaje({
          contenido: mensaje || `Archivo: ${archivoSubido.nombre}`,
          tipoMensaje: tipo,
          archivoUrl: archivoSubido.url,
          archivoNombre: archivoSubido.nombre,
          archivoTipo: archivoSubido.tipo,
          archivoTamano: archivoSubido.tamano,
        });

        setArchivo(null);
        setPrevisualizacion(null);
        setMensaje("");
      } catch (error) {
        console.error("Error al subir archivo:", error);
        alert("Error al subir el archivo");
      } finally {
        setSubiendo(false);
      }
    } else if (mensaje.trim()) {
      onEnviarMensaje({
        contenido: mensaje,
        tipoMensaje: "texto",
      });
      setMensaje("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validacion = uploadService.validarArchivo(file);
    if (!validacion.valido) {
      alert(validacion.error);
      return;
    }

    setArchivo(file);

    // Generar preview si es imagen
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setPrevisualizacion(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPrevisualizacion(null);
    }
  };

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);

        onEnviarMensaje({
          contenido: `Audio de voz (${tiempoGrabacion}s)`,
          tipoMensaje: "audio",
          archivoUrl: url,
          archivoNombre: `audio-${Date.now()}.webm`,
          archivoTipo: "audio/webm",
          archivoTamano: audioBlob.size,
          audioDuracion: tiempoGrabacion,
        });

        stream.getTracks().forEach((track) => track.stop());
        setGrabando(false);
        setTiempoGrabacion(0);
      };

      mediaRecorder.start();
      setGrabando(true);
      setTiempoGrabacion(0);

      // Timer
      timerRef.current = setInterval(() => {
        setTiempoGrabacion((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      alert("No se pudo acceder al micrófono");
    }
  };

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabando) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelarGrabacion = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    setGrabando(false);
    setTiempoGrabacion(0);
  };

  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (grabando) {
    return (
      <div className="border-t border-gray-200 bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 shadow-lg">
              <Mic className="h-6 w-6 animate-pulse text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">Grabando audio...</p>
              <p className="text-xs text-red-700">{formatearTiempo(tiempoGrabacion)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancelarGrabacion}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={detenerGrabacion}
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4">
      {/* Preview de archivo */}
      {archivo && (
        <div className="mb-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {previsualizacion ? (
                <Image
                  src={previsualizacion}
                  alt="Vista previa del archivo"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
                  <File className="h-8 w-8 text-indigo-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-indigo-900">{archivo.name}</p>
                <p className="text-xs text-indigo-600">
                  {(archivo.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setArchivo(null);
                setPrevisualizacion(null);
              }}
              className="rounded-full p-2 text-indigo-700 transition hover:bg-indigo-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Input principal */}
      <div className="flex items-end gap-3">
        {/* Botones de acciones */}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="rounded-full p-3 text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
            title="Adjuntar archivo"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />

          <button
            onClick={onAbrirPlantillas}
            disabled={disabled}
            className="rounded-full p-3 text-yellow-600 transition hover:bg-yellow-50 disabled:opacity-50"
            title="Respuestas rápidas"
          >
            <Zap className="h-5 w-5" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          rows={1}
          className="min-h-[48px] flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-gray-50"
        />

        {/* Botón de enviar / Botón de voz */}
        {mensaje.trim() || archivo ? (
          <button
            onClick={handleEnviar}
            disabled={disabled || subiendo}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {subiendo ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        ) : (
          <button
            onClick={iniciarGrabacion}
            disabled={disabled}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 disabled:opacity-50"
            title="Grabar mensaje de voz"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
