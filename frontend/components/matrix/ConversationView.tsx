'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Smile,
  ThumbsUp,
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  User,
  Mic,
} from 'lucide-react';
import { Conversacion } from '@/types/matrix';

interface ConversationViewProps {
  conversacion: Conversacion | null;
  onBack: () => void;
  onEnviarMensaje: (contenido: string) => void;
}

export function ConversationView({ 
  conversacion, 
  onBack,
  onEnviarMensaje 
}: ConversationViewProps) {
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversacion?.mensajes?.length]);

  if (!conversacion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e4e6eb]">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Selecciona una conversación
          </h3>
          <p className="text-sm text-gray-500">
            Elige una conversación del panel izquierdo para comenzar
          </p>
        </div>
      </div>
    );
  }

  const handleEnviar = () => {
    if (nuevoMensaje.trim()) {
      onEnviarMensaje(nuevoMensaje);
      setNuevoMensaje('');
      setEscribiendo(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const nombreDisplay = (() => {
    const canal = conversacion.canal?.toLowerCase();
    const nombre = conversacion.nombreContacto || '';
    if ((canal === 'facebook' || canal === 'instagram') && /^\d{10,}$/.test(nombre.trim())) {
      return canal === 'facebook' ? 'Contacto (Facebook)' : 'Contacto (Instagram)';
    }
    return nombre || 'Sin nombre';
  })();
  const avatarInicial = nombreDisplay[0]?.toUpperCase() || '?';


  // Renderiza el contenido del mensaje según el tipo
  const renderMensajeContenido = (mensaje: any) => {
    if (mensaje.tipo === 'imagen' && mensaje.adjuntos?.[0]?.url) {
      return (
        <img
          src={mensaje.adjuntos[0].url}
          alt="Imagen adjunta"
          className="rounded-lg max-w-xs max-h-60 object-cover border border-gray-200"
        />
      );
    }
    if (mensaje.tipo === 'audio' && mensaje.adjuntos?.[0]?.url) {
      return (
        <audio controls className="w-full mt-1">
          <source src={mensaje.adjuntos[0].url} />
          Tu navegador no soporta audio.
        </audio>
      );
    }
    if (mensaje.tipo === 'video' && mensaje.adjuntos?.[0]?.url) {
      return (
        <video controls className="w-full rounded-lg mt-1 max-w-xs max-h-60">
          <source src={mensaje.adjuntos[0].url} />
          Tu navegador no soporta video.
        </video>
      );
    }
    if (mensaje.tipo === 'documento' && mensaje.adjuntos?.[0]?.url) {
      return (
        <a
          href={mensaje.adjuntos[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-blue-700 underline text-sm mt-1"
        >
          {mensaje.adjuntos[0].nombre || 'Archivo adjunto'}
        </a>
      );
    }
    // Texto por defecto
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{mensaje.contenido}</p>;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e4e6eb] min-w-0">
      {/* Header estilo Messenger: nombre + active now + avatares + + */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors -ml-1"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 mx-2">
          <h2 className="text-base font-semibold text-gray-900 truncate" title={conversacion.nombreContacto}>
            {nombreDisplay}
          </h2>
          <p className="text-xs text-green-600 font-medium">
            {conversacion.canal === 'facebook' || conversacion.canal === 'instagram'
              ? `vía ${conversacion.canal === 'facebook' ? 'Facebook' : 'Instagram'}`
              : 'active now'}
          </p>
        </div>
        <div className="flex items-center -space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
            {avatarInicial}
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs border-2 border-white">
            ?
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border-2 border-white hover:bg-gray-200"
            aria-label="Añadir"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área de mensajes: burbujas con avatar (estilo imagen) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversacion.mensajes?.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`flex ${mensaje.esDeKeila ? 'justify-end' : 'justify-start'} gap-2`}
          >
            {!mensaje.esDeKeila && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold">
                {avatarInicial}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                mensaje.esDeKeila
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-[#e4e6eb] text-gray-900 rounded-bl-md'
              }`}
            >
              {renderMensajeContenido(mensaje)}
              <p
                className={`text-[10px] mt-1 ${
                  mensaje.esDeKeila ? 'text-blue-200' : 'text-gray-400'
                }`}
              >
                {mensaje.esDeKeila ? 'Enviado' : 'Visto'}{' '}
                {new Date(mensaje.fechaHora).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {mensaje.esDeKeila && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                U
              </div>
            )}
          </div>
        ))}
        {escribiendo && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input estilo Messenger: cámara, imagen, clip, mic | Type something here... | emoji, thumbs up */}
      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Cámara">
            <Camera className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Imagen">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Adjuntar">
            <Paperclip className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Micrófono">
            <Mic className="w-5 h-5" />
          </button>
          <div className="flex-1 relative min-w-0">
            <textarea
              value={nuevoMensaje}
              onChange={(e) => {
                setNuevoMensaje(e.target.value);
                setEscribiendo(e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviar();
                }
              }}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full px-4 py-2.5 pr-20 border-0 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button type="button" className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500">
                <Smile className="w-5 h-5" />
              </button>
              <button type="button" className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500">
                <ThumbsUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={handleEnviar}
            disabled={!nuevoMensaje.trim()}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
