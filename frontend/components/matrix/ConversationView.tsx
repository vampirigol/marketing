'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  MoreVertical,
  Star,
  Tag,
  ArrowLeft,
  Check,
  CheckCheck,
  Phone,
  Video
} from 'lucide-react';
import { Conversacion, CanalType } from '@/types/matrix';
import { Button } from '@/components/ui/Button';

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
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversacion?.mensajes]);

  if (!conversacion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            💬
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

  const getIconoCanal = (canal: CanalType) => {
    switch (canal) {
      case 'whatsapp':
        return <span className="text-green-600 font-semibold">WhatsApp</span>;
      case 'facebook':
        return <span className="text-blue-600 font-semibold">Facebook</span>;
      case 'instagram':
        return <span className="text-pink-600 font-semibold">Instagram</span>;
    }
  };

  const getEstadoMensaje = (estado: string) => {
    switch (estado) {
      case 'enviado':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'entregado':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'leido':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {conversacion.avatar || conversacion.nombreContacto[0].toUpperCase()}
                </div>
                {conversacion.enLinea && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {conversacion.nombreContacto}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100">
                    {getIconoCanal(conversacion.canal)}
                  </span>
                  {conversacion.telefono && (
                    <span className="text-gray-500">{conversacion.telefono}</span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      conversacion.enLinea
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {conversacion.enLinea ? 'En línea' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Tag className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-3">
        {conversacion.mensajes?.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`flex ${mensaje.esDeKeila ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                mensaje.esDeKeila
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm'
              }`}
            >
              {!mensaje.esDeKeila && (
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {conversacion.nombreContacto}
                </p>
              )}
              
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {mensaje.contenido}
              </p>
              
              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                mensaje.esDeKeila ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span>
                  {new Date(mensaje.fechaHora).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {mensaje.esDeKeila && getEstadoMensaje(mensaje.estado)}
              </div>
            </div>
          </div>
        ))}
        
        {escribiendo && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={mensajesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <textarea
              value={nuevoMensaje}
              onChange={(e) => {
                setNuevoMensaje(e.target.value);
                setEscribiendo(e.target.value.length > 0);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full px-4 py-2.5 pr-20 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5"
              >
                <Smile className="w-5 h-5 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5"
              >
                <Mic className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleEnviar}
            disabled={!nuevoMensaje.trim()}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-11 h-11 p-0 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Indicador de escritura */}
        {escribiendo && (
          <p className="text-xs text-gray-500 mt-2">
            Presiona Enter para enviar, Shift + Enter para nueva línea
          </p>
        )}
      </div>
    </div>
  );
}
