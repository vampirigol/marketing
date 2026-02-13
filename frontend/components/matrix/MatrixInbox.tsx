'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, MessageSquare, Plus, User, Moon } from 'lucide-react';
import { Conversacion, CanalType, ConversacionEstado } from '@/types/matrix';
import { Badge } from '@/components/ui/Badge';
import {
  RedesSocialesModal,
  CANALES_KEILA,
  getCanalesConectadosDefault,
  guardarCanalesConectados,
} from './RedesSocialesModal';
import { api } from '@/lib/api';

// Avatar por defecto cuando no hay foto de perfil
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

type FiltroCanalType = CanalType | 'google-ads' | null;

interface MatrixInboxProps {
  conversaciones: Conversacion[];
  conversacionActiva?: string;
  onSelectConversacion: (id: string) => void;
  /** Búsqueda desde la barra superior (opcional) */
  searchValue?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function MatrixInbox({
  conversaciones,
  conversacionActiva,
  onSelectConversacion,
  searchValue = '',
  darkMode = false,
  onToggleDarkMode,
}: MatrixInboxProps) {
  const [busquedaLocal, setBusquedaLocal] = useState('');
  const busqueda = typeof searchValue === 'string' && searchValue.trim() !== '' ? searchValue : busquedaLocal;
  const [filtroEstado, setFiltroEstado] = useState<ConversacionEstado | 'todas'>('activa');
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanalType>(null);
  const [canalesConectados, setCanalesConectados] = useState<Record<string, boolean>>(getCanalesConectadosDefault);
  const [modalRedesOpen, setModalRedesOpen] = useState(false);

  // Sincronizar canales conectados: si backend tiene tokens, mostrar FB/IG en bandeja
  useEffect(() => {
    const base = getCanalesConectadosDefault();
    api
      .get<{ facebook?: boolean; instagram?: boolean }>('/meta-config/canales-conectados')
      .then((res) => {
        const { facebook, instagram } = res.data || {};
        setCanalesConectados((prev) => ({
          ...prev,
          ...base,
          facebook: facebook === true || prev.facebook !== false,
          instagram: instagram === true || prev.instagram !== false,
        }));
      })
      .catch(() => setCanalesConectados(base));
  }, []);

  const handleCambiarCanalConectado = (canal: string, conectado: boolean) => {
    const next = { ...canalesConectados, [canal]: conectado };
    setCanalesConectados(next);
    guardarCanalesConectados(next);
  };

  // Solo conversaciones de canales conectados; luego filtro por canal seleccionado y búsqueda/estado
  const conversacionesFiltradas = conversaciones.filter((conv) => {
    const canalConectado = canalesConectados[conv.canal] !== false;
    const matchCanal = filtroCanal === null || conv.canal === filtroCanal;
    const matchBusqueda =
      !busqueda.trim() ||
      conv.nombreContacto.toLowerCase().includes(busqueda.toLowerCase()) ||
      (conv.ultimoMensaje || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'todas' || conv.estado === filtroEstado;
    return canalConectado && matchCanal && matchBusqueda && matchEstado;
  });

  // Agrupar por estado
  const activas = conversacionesFiltradas.filter(c => c.estado === 'activa');
  const pendientes = conversacionesFiltradas.filter(c => c.estado === 'pendiente');
  const cerradas = conversacionesFiltradas.filter(c => c.estado === 'cerrada');

  const getIconoCanal = (canal: CanalType | 'google-ads') => {
    switch (canal) {
      case 'whatsapp':
        return <span className="text-green-600 font-semibold text-xs">WA</span>;
      case 'facebook':
        return <span className="text-blue-600 font-semibold text-xs">FB</span>;
      case 'instagram':
        return <span className="text-pink-600 font-semibold text-xs">IG</span>;
      case 'tiktok':
        return <span className="text-black font-semibold text-xs">TT</span>;
      case 'youtube':
        return <span className="text-red-600 font-semibold text-xs">YT</span>;
      case 'email':
        return <span className="text-gray-600 font-semibold text-xs">✉</span>;
      case 'fan-page':
        return <span className="text-indigo-600 font-semibold text-xs">Web</span>;
      case 'google-ads':
        return <span className="text-blue-700 font-semibold text-xs">Ads</span>;
      default:
        return <span className="text-gray-600 font-semibold text-xs">?</span>;
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

  const solicitudesNuevas = conversaciones.filter((c) => c.estado === 'pendiente' || c.mensajesNoLeidos > 0).length;

  return (
    <div className="w-[340px] border-r border-gray-200 bg-white flex flex-col h-full shrink-0 shadow-sm">
      {/* New Message Requests (estilo imagen) */}
      <div className="p-3 border-b border-gray-100">
        <button
          type="button"
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
              ?
            </div>
            {solicitudesNuevas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
                {solicitudesNuevas > 99 ? '99+' : solicitudesNuevas}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Solicitudes nuevas</p>
            <p className="text-xs text-gray-500 truncate">
              {solicitudesNuevas === 0 ? 'Sin solicitudes' : `${solicitudesNuevas} mensaje(s) sin leer`}
            </p>
          </div>
        </button>
      </div>

      {/* Todos los mensajes + iconos de redes */}
      <div className="px-3 py-2 border-b border-gray-100 space-y-2">
        <button
          type="button"
          onClick={() => setFiltroCanal(null)}
          className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            filtroCanal === null
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          Todos los mensajes
        </button>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin items-center" style={{ scrollbarWidth: 'thin' }}>
          {CANALES_KEILA.map((c) => {
            const activo = filtroCanal === c.id;
            const conectado = canalesConectados[c.id] !== false;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFiltroCanal(filtroCanal === c.id ? null : (c.id as FiltroCanalType))}
                title={`${c.label}${!conectado ? ' (desconectado)' : ''}`}
                className={`flex-shrink-0 min-w-[36px] h-9 rounded-full px-2.5 border flex items-center justify-center text-xs font-semibold transition-all ${
                  activo
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : conectado
                    ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-100 border-gray-200 text-gray-400 opacity-70'
                }`}
              >
                {c.id === 'email' ? <span className="text-gray-600">✉ Email</span> : getIconoCanal(c.id)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setModalRedesOpen(true)}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
            title="Conectar o desconectar redes sociales"
            aria-label="Configurar redes"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Búsqueda local (si no viene de la barra) */}
      {(!searchValue || searchValue.trim() === '') && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Filtros de estado (compactos) */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => setFiltroEstado('activa')}
          className={`flex-1 text-xs py-1.5 px-2 rounded-full transition-colors ${
            filtroEstado === 'activa' ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => setFiltroEstado('pendiente')}
          className={`flex-1 text-xs py-1.5 px-2 rounded-full transition-colors ${
            filtroEstado === 'pendiente' ? 'bg-amber-100 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFiltroEstado('cerrada')}
          className={`flex-1 text-xs py-1.5 px-2 rounded-full transition-colors ${
            filtroEstado === 'cerrada' ? 'bg-gray-200 text-gray-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Cerradas
        </button>
      </div>

      {/* Lista de conversaciones (estilo imagen: barra azul a la izquierda en seleccionado) */}
      <div className="flex-1 overflow-y-auto bg-white min-h-0">
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

      {/* Pie del panel: Dark Mode toggle (estilo Messenger) */}
      <div className="p-3 border-t border-gray-200 bg-white shrink-0">
        {onToggleDarkMode && (
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-3 text-gray-700">
              <Moon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Modo oscuro</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition ${darkMode ? 'translate-x-5 left-0.5' : 'translate-x-0 left-0.5'}`}
              />
            </button>
          </div>
        )}
      </div>

      <RedesSocialesModal
        isOpen={modalRedesOpen}
        onClose={() => setModalRedesOpen(false)}
        canalesConectados={canalesConectados}
        onCambiar={handleCambiarCanalConectado}
      />
    </div>
  );
}

interface ConversacionCardProps {
  conversacion: Conversacion;
  activa: boolean;
  onClick: () => void;
  getIconoCanal: (canal: CanalType | 'google-ads') => JSX.Element;
  formatearTiempo: (fecha: Date) => string;
}

/** Detecta si el texto parece un PSID (ID numérico de Meta) en lugar de un nombre real */
function esPsidONumero(texto: string): boolean {
  if (!texto || texto.length < 10) return false;
  return /^\d+$/.test(texto.trim());
}

function getNombreDisplay(conv: Conversacion): string {
  const canal = conv.canal?.toLowerCase();
  const esMeta = canal === 'facebook' || canal === 'instagram';
  const nombre = conv.nombreContacto || '';
  if (esMeta && esPsidONumero(nombre)) {
    return canal === 'facebook' ? 'Contacto (Facebook)' : 'Contacto (Instagram)';
  }
  return nombre || 'Sin nombre';
}

function ConversacionCard({
  conversacion,
  activa,
  onClick,
  getIconoCanal,
  formatearTiempo,
}: ConversacionCardProps) {
  const avatarStyle = getAvatarStyle(conversacion.id);
  const nombreDisplay = getNombreDisplay(conversacion);
  return (
    <div
      onClick={onClick}
      className={`relative pl-1 pr-3 py-3 rounded-r-lg cursor-pointer transition-all hover:bg-gray-50 ${
        activa ? 'bg-blue-50/80' : conversacion.mensajesNoLeidos > 0 ? 'bg-blue-50/40' : 'bg-white'
      } ${activa ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {conversacion.avatar ? (
            conversacion.avatar === '/client-avatar.png' ? (
              <img
                src="https://ui-avatars.com/api/?name=Cliente&background=F0F2F5&color=0084FF&size=128"
                alt="Avatar"
                width={40}
                height={40}
                className="flex-shrink-0 w-10 h-10 rounded-full object-cover border border-gray-200"
                style={{ objectFit: 'cover', borderRadius: '9999px', border: '1px solid #e5e7eb', width: '40px', height: '40px' }}
              />
            ) : (
              <Image
                src={conversacion.avatar}
                alt="Avatar"
                width={40}
                height={40}
                unoptimized
                className="flex-shrink-0 w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            )
          ) : (
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarStyle.from} ${avatarStyle.to} flex items-center justify-center text-white shadow-sm`}
              title="Sin foto de perfil"
            >
              <User className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                {getIconoCanal(conversacion.canal)}
              </span>
              <p className={`text-sm truncate ${
                conversacion.mensajesNoLeidos > 0 ? 'font-semibold text-gray-900' : 'text-gray-700'
              }`} title={conversacion.nombreContacto || nombreDisplay}>
                {nombreDisplay}
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
