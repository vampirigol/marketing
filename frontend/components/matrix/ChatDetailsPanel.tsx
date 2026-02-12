'use client';

import { Search, Phone, Video, Image as ImageIcon, Info, CalendarPlus } from 'lucide-react';
import { Conversacion } from '@/types/matrix';
import { User } from 'lucide-react';

interface ChatDetailsPanelProps {
  conversacion: Conversacion | null;
  /** Al hacer clic en "Agendar cita" se abre el modal de agendamiento */
  onAgendarCita?: () => void;
}

const AVATAR_STYLES = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
];

export function ChatDetailsPanel({ conversacion, onAgendarCita }: ChatDetailsPanelProps) {
  if (!conversacion) {
    return (
      <div className="w-[320px] border-l border-gray-200 bg-white flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm">Selecciona una conversación para ver detalles</p>
      </div>
    );
  }

  const avatarClass = AVATAR_STYLES[conversacion.id.length % 3];

  return (
    <div className="w-[320px] border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Perfil del chat */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarClass} flex items-center justify-center text-white text-2xl font-semibold shadow-lg mb-3`}
          >
            {conversacion.nombreContacto?.[0]?.toUpperCase() || '?'}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 truncate w-full">
            {conversacion.nombreContacto}
          </h3>
          <p className="text-xs text-green-600 font-medium mt-0.5">active now</p>
        </div>

        {/* Call Group / Video Chat */}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-blue-500 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Llamar
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-blue-500 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>

        {/* Agendar cita: abre modal de agendamiento */}
        {onAgendarCita && (
          <button
            type="button"
            onClick={onAgendarCita}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Agendar cita
          </button>
        )}
      </div>

      {/* Search in Conversation */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en la conversación"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Change Color / Change Emoji (estilo Messenger: paleta de colores) */}
      <div className="p-3 border-b border-gray-100 space-y-3">
        <div>
          <span className="text-sm text-gray-700 block mb-2">Cambiar color</span>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { color: 'bg-blue-500', border: 'ring-2 ring-blue-500 ring-offset-2' },
              { color: 'bg-gray-900', border: '' },
              { color: 'bg-red-500', border: '' },
              { color: 'bg-yellow-400', border: '' },
              { color: 'bg-green-500', border: '' },
            ].map((c, i) => (
              <button
                key={i}
                type="button"
                className={`w-8 h-8 rounded-full ${c.color} ${i === 0 ? c.border : ''} border-2 border-white shadow hover:scale-110 transition-transform`}
                title="Seleccionar color"
                aria-label="Color"
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700">Cambiar emoji</span>
          <span className="text-xl">😀</span>
        </div>
      </div>

      {/* Shared photos */}
      <div className="p-3 border-b border-gray-100 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Fotos compartidas</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center"
            >
              <ImageIcon className="w-6 h-6 text-gray-300" />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm text-blue-600 font-medium hover:underline"
        >
          Ver más
        </button>
      </div>

      {/* Privacy & Support */}
      <div className="p-3 border-t border-gray-100">
        <a
          href="#"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Info className="w-4 h-4" />
          Privacidad y soporte
        </a>
      </div>
    </div>
  );
}
