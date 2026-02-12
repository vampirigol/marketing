'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cambiarPassword, obtenerUsuarioActual } from '@/lib/auth.service';

interface PerfilUsuario {
  nombre: string;
  username: string;
  rol: string;
  email?: string;
  telefono?: string;
  sucursal?: string;
}

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<PerfilUsuario>({
    nombre: 'Usuario',
    username: 'usuario',
    rol: 'Usuario',
    email: '',
    telefono: '',
    sucursal: '',
  });
  const [cargando, setCargando] = useState(true);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferencias, setPreferencias] = useState({
    notificacionesEmail: true,
    notificacionesWhatsApp: true,
    modoCompacto: false,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerUsuarioActual();
        setUsuario({
          nombre: data.nombreCompleto || data.username || 'Usuario',
          username: data.username || data.email || 'usuario',
          rol: data.rol || 'Usuario',
          email: data.email || '',
          telefono: data.telefono || '',
          sucursal: data.sucursalNombre || '',
        });
        localStorage.setItem('auth_user', JSON.stringify(data));
      } catch (err) {
        const stored = localStorage.getItem('auth_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUsuario({
              nombre: parsed?.nombreCompleto || parsed?.nombre || parsed?.username || 'Usuario',
              username: parsed?.username || parsed?.email || 'usuario',
              rol: parsed?.rol || 'Usuario',
              email: parsed?.email || '',
              telefono: parsed?.telefono || '',
              sucursal: parsed?.sucursalNombre || '',
            });
          } catch {
            // ignore parse errors
          }
        }
      } finally {
        setCargando(false);
      }
    };

    const prefs = localStorage.getItem('perfil_preferencias');
    if (prefs) {
      try {
        setPreferencias(JSON.parse(prefs));
      } catch {
        // ignore
      }
    }

    const storedAvatar = localStorage.getItem('perfil_avatar');
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
    }

    cargar();
  }, []);

  const handleGuardarPreferencias = () => {
    localStorage.setItem('perfil_preferencias', JSON.stringify(preferencias));
    setMensaje('Preferencias guardadas');
    setError(null);
  };

  const handleCambiarPassword = async () => {
    setMensaje(null);
    setError(null);
    try {
      const resp = await cambiarPassword({ passwordActual, passwordNuevo });
      setMensaje(resp.mensaje || 'Contraseña actualizada');
      setPasswordActual('');
      setPasswordNuevo('');
      setMostrarPassword(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo cambiar la contraseña');
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      localStorage.setItem('perfil_avatar', result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
          <p className="text-sm text-gray-600">Configura tu información y preferencias</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  usuario.nombre
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0].toUpperCase())
                    .join('')
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{usuario.nombre}</p>
                <p className="text-xs text-gray-500">{usuario.rol}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-600">Cambiar imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="mt-2 block w-full text-xs text-gray-600"
              />
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Usuario:</span> {usuario.username}</p>
              {usuario.sucursal && (
                <p><span className="font-medium text-gray-800">Sucursal:</span> {usuario.sucursal}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-2 space-y-5">
            {cargando ? (
              <div className="text-sm text-gray-500">Cargando información...</div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <Input value={usuario.nombre} disabled className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Usuario</label>
                <Input value={usuario.username} disabled className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <Input value={usuario.email || 'No registrado'} disabled className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <Input value={usuario.telefono || 'No registrado'} disabled className="mt-2" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setMostrarPassword(true)}>
                Cambiar contraseña
              </Button>
              <Button variant="secondary" onClick={handleGuardarPreferencias}>
                Guardar preferencias
              </Button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Preferencias</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencias.notificacionesEmail}
                    onChange={(e) =>
                      setPreferencias((prev) => ({ ...prev, notificacionesEmail: e.target.checked }))
                    }
                  />
                  Notificaciones por email
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencias.notificacionesWhatsApp}
                    onChange={(e) =>
                      setPreferencias((prev) => ({ ...prev, notificacionesWhatsApp: e.target.checked }))
                    }
                  />
                  Notificaciones por WhatsApp
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencias.modoCompacto}
                    onChange={(e) =>
                      setPreferencias((prev) => ({ ...prev, modoCompacto: e.target.checked }))
                    }
                  />
                  Modo compacto
                </label>
              </div>
            </div>

            {mensaje ? (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {mensaje}
              </div>
            ) : null}
            {error ? (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mostrarPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Cambiar contraseña</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
              <Input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
              <Input
                type="password"
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMostrarPassword(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCambiarPassword}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
