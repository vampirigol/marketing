'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  Calendar,
  CalendarRange,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  MapPin,
  User,
  UserCheck,
  ChevronDown,
  FileText,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { SUCURSALES } from '@/lib/doctores-data';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CRM', href: '/crm', icon: Layers },
  { name: 'Recepción', href: '/recepcion', icon: UserCheck },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Citas', href: '/citas', icon: Calendar },
  { name: 'Calendario', href: '/calendario', icon: CalendarRange },
  { name: 'Keila IA', href: '/matrix', icon: MessageSquare },
  { name: 'Mensajero', href: '/mensajero', icon: MessageSquare },
  { name: 'Brigadas Médicas', href: '/brigadas-medicas', icon: HeartPulse },
  { name: 'Finanzas', href: '/finanzas', icon: DollarSign },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Salud', href: '/salud', icon: Activity },
  { name: 'Auditoría', href: '/auditoria', icon: FileText },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [sucursalActual, setSucursalActual] = useState('Guadalajara');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string }>({
    nombre: 'Keila IA',
    rol: 'Contact Center',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Cargar sucursal del localStorage
  useEffect(() => {
    const savedSucursal = localStorage.getItem('sucursalActual');
    if (savedSucursal) {
      setSucursalActual(savedSucursal);
    }
  }, []);

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

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen, isUserMenuOpen]);

  const abreviarNombre = (nombre: string) => {
    if (nombre.length <= 28) return nombre;
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

  const handleSucursalChange = (sucursal: string) => {
    setSucursalActual(sucursal);
    localStorage.setItem('sucursalActual', sucursal);
    setIsDropdownOpen(false);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm ring-1 ring-gray-200 group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo-clinicas.png"
              alt="Clínicas Adventistas"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900">CRM RCA</span>
            <span className="text-xs text-gray-500">Clínicas Adventistas</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
              <Icon className={cn(
                'w-5 h-5 transition-all duration-200',
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <span className={cn(
                'text-sm font-medium',
                isActive ? 'font-semibold' : ''
              )}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        {/* Sucursal Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
          >
            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-gray-500">Sucursal</p>
              <p className="text-sm font-medium text-gray-900 truncate">{sucursalActual}</p>
            </div>
            <ChevronDown 
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )} 
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {SUCURSALES.map((sucursal) => (
                <button
                  key={sucursal}
                  onClick={() => handleSucursalChange(sucursal)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm transition-all duration-200',
                    sucursalActual === sucursal
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {sucursal}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 text-white text-sm font-semibold overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                obtenerIniciales(usuario.nombre)
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {abreviarNombre(usuario.nombre)}
              </p>
              <p className="text-xs text-gray-500 truncate">{usuario.rol}</p>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
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
    </aside>
  );
}
