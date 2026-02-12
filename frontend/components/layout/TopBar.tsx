'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { DemoNotification, demoNotifications } from '@/lib/demo-notifications';

export function TopBar() {
  const [notifications, setNotifications] = useState<DemoNotification[]>(demoNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string }>({
    nombre: 'Keila Gardenía Anahi Rodríguez Gallardo',
    rol: 'Contact Center',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const nombre = parsed?.nombreCompleto || parsed?.nombre || parsed?.username || 'Usuario';
        const rol = parsed?.rol || 'Usuario';
        setUsuario({ nombre, rol });
      } catch {
        // ignore parse errors
      }
    }
    const storedAvatar = localStorage.getItem('perfil_avatar');
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const abreviarNombre = (nombre: string) => {
    if (nombre.length <= 32) return nombre;
    const partes = nombre.split(' ').filter(Boolean);
    if (partes.length <= 2) return nombre;
    const nombres = partes.slice(0, 2).join(' ');
    const apellidos = partes.slice(2).map((p) => `${p.charAt(0).toUpperCase()}.`).join(' ');
    return `${nombres} ${apellidos}`.trim();
  };

  const obtenerIniciales = (nombre: string) => {
    const partes = nombre.split(' ').filter(Boolean);
    return partes.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex-1 flex items-center space-x-4">
        <div className="w-96">
          <Input
            type="search"
            placeholder="Buscar pacientes, citas..."
            icon={<Search className="w-5 h-5" />}
            className="shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 relative">
        {/* Notificaciones */}
        <button
          onClick={handleToggle}
          className="relative p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg"></span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-14 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
                <p className="text-xs text-gray-500">{unreadCount} sin leer</p>
              </div>
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Marcar todo leído
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                    n.read ? 'bg-white' : 'bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-600 truncate">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.time}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 py-3 text-center text-xs text-gray-500">
              Modo demo · Notificaciones simuladas
            </div>
          </div>
        )}

        {/* Usuario */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-50 cursor-pointer transition-all duration-200 group"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">
                {abreviarNombre(usuario.nombre)}
              </p>
              <p className="text-xs text-gray-500">{usuario.rol}</p>
            </div>
            <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">{obtenerIniciales(usuario.nombre)}</span>
              )}
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-14 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  window.location.href = '/perfil';
                }}
              >
                Ver perfil
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
