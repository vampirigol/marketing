'use client';

import { useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { Conversacion, CanalType, ConversacionEstado } from '@/types/matrix';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

// Colores y gradientes para avatares variados
const AVATAR_STYLES = [
  { from: 'from-blue-400', to: 'to-blue-600', emoji: '👤' },
  { from: 'from-purple-400', to: 'to-purple-600', emoji: '👨‍⚕️' },
  { from: 'from-pink-400', to: 'to-pink-600', emoji: '👩‍⚕️' },
  { from: 'from-green-400', to: 'to-green-600', emoji: '🏥' },
  { from: 'from-orange-400', to: 'to-orange-600', emoji: '👨‍💼' },
  { from: 'from-red-400', to: 'to-red-600', emoji: '👩‍💼' },
  { from: 'from-cyan-400', to: 'to-cyan-600', emoji: '💬' },
  { from: 'from-indigo-400', to: 'to-indigo-600', emoji: '📞' },
];

const getAvatarStyle = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_STYLES[hash % AVATAR_STYLES.length];
};

interface MatrixInboxProps {
  conversaciones: Conversacion[];
  conversacionActiva?: string;
  onSelectConversacion: (id: string) => void;
}

export function MatrixInbox({ 
  conversaciones, 
  conversacionActiva,
  onSelectConversacion 
}: MatrixInboxProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<ConversacionEstado | 'todas'>('activa');

  // Filtrar conversaciones
  const conversacionesFiltradas = conversaciones.filter(conv => {
    const matchBusqueda = conv.nombreContacto.toLowerCase().includes(busqueda.toLowerCase()) ||
                          conv.ultimoMensaje.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'todas' || conv.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  // Agrupar por estado
  const activas = conversacionesFiltradas.filter(c => c.estado === 'activa');
  const pendientes = conversacionesFiltradas.filter(c => c.estado === 'pendiente');
  const cerradas = conversacionesFiltradas.filter(c => c.estado === 'cerrada');

  const listasInteligentes = [
    {
      title: 'Inasistencia',
      count: conversacionesFiltradas.filter(c => c.etiquetas.includes('Inasistencia')).length,
      tone: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      title: 'Reagendar',
      count: conversacionesFiltradas.filter(c => c.etiquetas.includes('Reagendar')).length,
      tone: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'En espera',
      count: conversacionesFiltradas.filter(c => c.etiquetas.includes('En espera')).length,
      tone: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: 'Perdido',
      count: conversacionesFiltradas.filter(c => c.etiquetas.includes('Perdido')).length,
      tone: 'text-slate-700 bg-slate-100 border-slate-200',
    },
  ];

  const getIconoCanal = (canal: CanalType) => {
    switch (canal) {
      case 'tiktok':
        return <span className="text-black font-semibold">🎵</span>;
      case 'instagram':
        return <span className="text-pink-600 font-semibold">📷</span>;
      case 'youtube':
        return <span className="text-red-600 font-semibold">▶️</span>;
      case 'fan-page':
        return <span className="text-blue-600 font-semibold">👥</span>;
      case 'facebook':
        return <span className="text-blue-600 font-semibold">f</span>;
      case 'email':
        return <span className="text-gray-600 font-semibold">✉️</span>;
      default:
        return <span className="text-gray-600 font-semibold">?</span>;
    }
  };

  const formatearTiempo = (fecha: Date) => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}min`;
    if (minutos < 1440) return `${Math.floor(minutos / 60)}h`;
    return `${Math.floor(minutos / 1440)}d`;
  };

  return (
    <div className="w-[320px] border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
          <span className="text-xs text-gray-500">{conversaciones.length}</span>
        </div>
        
        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 text-sm bg-gray-50 border-gray-200 rounded-full"
          />
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-full">
          <button
            onClick={() => setFiltroEstado('activa')}
            className={`flex-1 text-xs py-1.5 px-2 rounded-full transition-colors ${
              filtroEstado === 'activa'
                ? 'bg-white text-green-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🟢 Activas
          </button>
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={`flex-1 text-xs py-1.5 px-2 rounded-full transition-colors ${
              filtroEstado === 'pendiente'
                ? 'bg-white text-orange-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⏰ Pendientes
          </button>
          <button
            onClick={() => setFiltroEstado('cerrada')}
            className={`flex-1 text-xs py-1.5 px-2 rounded-full transition-colors ${
              filtroEstado === 'cerrada'
                ? 'bg-white text-gray-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✅ Cerradas
          </button>
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Activas */}
        {filtroEstado === 'activa' && activas.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                🟢 Activas ({activas.length})
              </p>
            </div>
            <div className="px-3 pb-3 space-y-2">
              {activas.map((conv) => (
                <ConversacionCard
                  key={conv.id}
                  conversacion={conv}
                  activa={conv.id === conversacionActiva}
                  onClick={() => onSelectConversacion(conv.id)}
                  getIconoCanal={getIconoCanal}
                  formatearTiempo={formatearTiempo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pendientes */}
        {filtroEstado === 'pendiente' && pendientes.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                ⏰ Pendientes ({pendientes.length})
              </p>
            </div>
            <div className="px-3 pb-3 space-y-2">
              {pendientes.map((conv) => (
                <ConversacionCard
                  key={conv.id}
                  conversacion={conv}
                  activa={conv.id === conversacionActiva}
                  onClick={() => onSelectConversacion(conv.id)}
                  getIconoCanal={getIconoCanal}
                  formatearTiempo={formatearTiempo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cerradas */}
        {filtroEstado === 'cerrada' && cerradas.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                ✅ Cerradas Hoy ({cerradas.length})
              </p>
            </div>
            <div className="px-3 pb-3 space-y-2">
              {cerradas.map((conv) => (
                <ConversacionCard
                  key={conv.id}
                  conversacion={conv}
                  activa={conv.id === conversacionActiva}
                  onClick={() => onSelectConversacion(conv.id)}
                  getIconoCanal={getIconoCanal}
                  formatearTiempo={formatearTiempo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {conversacionesFiltradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay conversaciones</p>
          </div>
        )}
      </div>

      {/* Listas inteligentes */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Listas inteligentes
        </p>
        <div className="grid grid-cols-2 gap-2">
          {listasInteligentes.map((item) => (
            <div key={item.title} className={`rounded-lg border px-2 py-1.5 ${item.tone}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">{item.title}</span>
                <span className="text-xs font-bold">{item.count}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Activas</p>
            <p className="text-lg font-bold text-green-600">{activas.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pendientes</p>
            <p className="text-lg font-bold text-orange-600">{pendientes.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Hoy</p>
            <p className="text-lg font-bold text-gray-600">{cerradas.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConversacionCardProps {
  conversacion: Conversacion;
  activa: boolean;
  onClick: () => void;
  getIconoCanal: (canal: CanalType) => JSX.Element;
  formatearTiempo: (fecha: Date) => string;
}

function ConversacionCard({ 
  conversacion, 
  activa, 
  onClick,
  getIconoCanal,
  formatearTiempo
}: ConversacionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        activa 
          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
          : conversacion.mensajesNoLeidos > 0
          ? 'bg-blue-50/40 border-blue-100'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {(() => {
            const avatarStyle = getAvatarStyle(conversacion.id);
            return (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarStyle.from} ${avatarStyle.to} flex items-center justify-center text-white font-semibold text-lg shadow-sm`}>
                {avatarStyle.emoji}
              </div>
            );
          })()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                {getIconoCanal(conversacion.canal)}
              </span>
              <p className={`text-sm truncate ${
                conversacion.mensajesNoLeidos > 0 ? 'font-semibold text-gray-900' : 'text-gray-700'
              }`}>
                {conversacion.nombreContacto}
              </p>
              {conversacion.enLinea && (
                <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
          {formatearTiempo(conversacion.fechaUltimoMensaje)}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <p className={`text-xs truncate flex-1 ${
          conversacion.mensajesNoLeidos > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
        }`}>
          {conversacion.ultimoMensaje}
        </p>
        {conversacion.mensajesNoLeidos > 0 && (
          <Badge variant="default" className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5">
            {conversacion.mensajesNoLeidos}
          </Badge>
        )}
      </div>

      {/* Etiquetas */}
      {conversacion.etiquetas.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {conversacion.etiquetas.map((etiqueta) => (
            <span key={etiqueta} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {etiqueta}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
