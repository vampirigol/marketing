"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
}

interface Props {
  token: string;
}

export default function NotificacionesBadge({ token }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (token) {
      cargarNotificaciones();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const cargarNotificaciones = async () => {
    try {
      const resp = await fetch(`${API_URL}/notificaciones/no-leidas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setNotificaciones(data.notificaciones || []);
        setNoLeidas(data.total || 0);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      await fetch(`${API_URL}/notificaciones/${id}/leida`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      await cargarNotificaciones();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await fetch(`${API_URL}/notificaciones/marcar-todas-leidas`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      await cargarNotificaciones();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case "Receta_Lista":
        return "💊";
      case "Resultados_Laboratorio":
        return "🔬";
      case "Recordatorio_Ayuno":
        return "⚠️";
      case "Cita_Confirmada":
        return "✅";
      case "Cita_Cancelada":
        return "❌";
      case "Mensaje_Nuevo":
        return "💬";
      default:
        return "🔔";
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - d.getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative rounded-full p-2 transition hover:bg-slate-100"
      >
        <svg
          className="h-6 w-6 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {mostrar && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[95vw] rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No hay notificaciones nuevas
              </div>
            ) : (
              notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => marcarComoLeida(notif.id)}
                  className="cursor-pointer border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getIcono(notif.tipo)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {notif.titulo}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{notif.mensaje}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatearFecha(notif.creadoEn)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
