'use client';

import { useState, useMemo } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { CanalType } from '@/types/matrix';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_BASE_FALLBACK = API_URL.replace(/\/api\/?$/, '');

/** Canales con soporte OAuth (iniciamos login real) */
const CANALES_OAUTH = ['facebook', 'instagram'];

export const CANALES_CATALOGO: {
  id: CanalType | 'google-ads';
  label: string;
  descripcion: string;
  tag?: 'Popular' | 'Beta';
  categoria: 'mensajeria' | 'llamadas' | 'sms' | 'email' | 'chat' | 'otro';
}[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Business Platform (API)',
    descripcion: 'Conecta WhatsApp Business API a través de Facebook para facilitar la atención al cliente.',
    tag: 'Popular',
    categoria: 'mensajeria',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    descripcion: 'Conecta TikTok Business Messaging para interactuar con una audiencia joven y dinámica.',
    tag: 'Beta',
    categoria: 'mensajeria',
  },
  {
    id: 'facebook',
    label: 'Facebook Messenger',
    descripcion: 'Conecta Facebook Messenger para interactuar con tus clientes en la plataforma más usada.',
    tag: 'Popular',
    categoria: 'mensajeria',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    descripcion: 'Conecta Instagram para responder a mensajes privados y crear fuertes relaciones con tu audiencia.',
    categoria: 'mensajeria',
  },
  {
    id: 'email',
    label: 'Correo Electrónico',
    descripcion: 'Conecta tu correo electrónico empresarial para gestionar consultas por email.',
    categoria: 'email',
  },
  {
    id: 'fan-page',
    label: 'Página web',
    descripcion: 'Conecta el chat de tu página web para capturar leads y atender en tiempo real.',
    categoria: 'chat',
  },
  {
    id: 'google-ads',
    label: 'Google Ads',
    descripcion: 'Integra conversaciones generadas desde tus campañas de Google Ads.',
    categoria: 'otro',
  },
];

export const CANALES_KEILA: { id: CanalType | 'google-ads'; label: string; color: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', color: 'text-green-600' },
  { id: 'facebook', label: 'Facebook', color: 'text-blue-600' },
  { id: 'instagram', label: 'Instagram', color: 'text-pink-600' },
  { id: 'tiktok', label: 'TikTok', color: 'text-gray-900' },
  { id: 'youtube', label: 'YouTube', color: 'text-red-600' },
  { id: 'email', label: 'Email', color: 'text-gray-600' },
  { id: 'fan-page', label: 'Página web', color: 'text-indigo-600' },
  { id: 'google-ads', label: 'Google Ads', color: 'text-blue-700' },
];

const STORAGE_KEY = 'keila.canalesConectados';

export function getCanalesConectadosDefault(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return Object.fromEntries(CANALES_KEILA.map((c) => [c.id, true]));
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      const out: Record<string, boolean> = {};
      CANALES_KEILA.forEach((c) => { out[c.id] = parsed[c.id] !== false; });
      return out;
    }
  } catch { /* localStorage no disponible */ }
  return Object.fromEntries(CANALES_KEILA.map((c) => [c.id, true]));
}

export function guardarCanalesConectados(conectados: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conectados));
  } catch { /* localStorage no disponible */ }
}

const TABS = [
  { id: 'todos', label: 'Todos' },
  { id: 'mensajeria', label: 'Mensajería Empresarial' },
  { id: 'llamadas', label: 'Llamadas' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Correo Electrónico' },
  { id: 'chat', label: 'Chat En Directo' },
] as const;

function getIconoCanal(id: string) {
  const icons: Record<string, string> = {
    whatsapp: '💬',
    facebook: '📘',
    instagram: '📷',
    tiktok: '🎵',
    youtube: '▶️',
    email: '✉️',
    'fan-page': '🌐',
    'google-ads': '📢',
  };
  return icons[id] || '📱';
}

interface RedesSocialesModalProps {
  isOpen: boolean;
  onClose: () => void;
  canalesConectados: Record<string, boolean>;
  onCambiar: (canal: string, conectado: boolean) => void;
}

export function RedesSocialesModal({
  isOpen,
  onClose,
  canalesConectados,
  onCambiar,
}: RedesSocialesModalProps) {
  const [tabActivo, setTabActivo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const canalesFiltrados = useMemo(() => {
    let list = CANALES_CATALOGO;
    if (tabActivo !== 'todos') {
      list = list.filter((c) => c.categoria === tabActivo);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.descripcion.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tabActivo, busqueda]);

  const handleConectar = async (canalId: string) => {
    if (CANALES_OAUTH.includes(canalId)) {
      setOauthLoading(canalId);
      try {
        // Obtener URL OAuth desde el backend (usa META_OAUTH_REDIRECT_BASE para ngrok/túneles)
        const res = await fetch(`${API_URL}/auth/facebook/url`);
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        // Fallback si el endpoint falla
      }
      window.location.href = `${API_BASE_FALLBACK}/api/auth/facebook`;
      return;
    }
    const conectado = canalesConectados[canalId] !== false;
    onCambiar(canalId, !conectado);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="catalogo-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 id="catalogo-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Catálogo de canales
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra tus canales de mensajería y descubre otros nuevos para ayudarte a adquirir más clientes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs + búsqueda */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 overflow-x-auto pb-1 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabActivo(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  tabActivo === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar Catálogo de canales"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Grid de tarjetas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {canalesFiltrados.map((canal) => {
              const conectado = canalesConectados[canal.id] !== false;
              return (
                <div
                  key={canal.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                      {getIconoCanal(canal.id)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {canal.label}
                        </span>
                        {canal.tag && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              canal.tag === 'Popular'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {canal.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {canal.descripcion}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConectar(canal.id)}
                    disabled={oauthLoading === canal.id}
                    className={`mt-auto w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                      conectado && !CANALES_OAUTH.includes(canal.id)
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70'
                    }`}
                  >
                    {oauthLoading === canal.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      conectado && !CANALES_OAUTH.includes(canal.id) ? 'Desconectar' : 'Conectar'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {canalesFiltrados.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No se encontraron canales con ese criterio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
