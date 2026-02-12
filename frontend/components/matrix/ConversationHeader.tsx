"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Star,
  StarOff,
  Tag,
  AlertCircle,
  UserPlus,
  Archive,
} from "lucide-react";

interface Conversacion {
  id: string;
  nombreContacto: string;
  canal: string;
  estado: string;
  prioridad: string;
  etiquetas: string[];
  asignadoA?: string;
}

interface Props {
  conversacion: Conversacion;
  onBack: () => void;
  onCambiarPrioridad: (prioridad: string) => void;
  onAgregarEtiqueta: (etiqueta: string) => void;
  onQuitarEtiqueta: (etiqueta: string) => void;
  onEscalar: () => void;
  onArchivar: () => void;
}

export default function ConversationHeader({
  conversacion,
  onBack,
  onCambiarPrioridad,
  onAgregarEtiqueta,
  onQuitarEtiqueta,
  onEscalar,
  onArchivar,
}: Props) {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarPrioridad, setMostrarPrioridad] = useState(false);
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(false);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  const prioridades = [
    { valor: "Urgente", color: "bg-red-100 text-red-700 border-red-300" },
    { valor: "Alta", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { valor: "Normal", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { valor: "Baja", color: "bg-gray-100 text-gray-700 border-gray-300" },
  ];

  const etiquetasSugeridas = [
    "Urgente",
    "Cita",
    "Seguimiento",
    "Queja",
    "Consulta",
    "Pago",
    "Resultados",
  ];

  const getPrioridadColor = (prioridad: string) => {
    const p = prioridades.find((pr) => pr.valor === prioridad);
    return p ? p.color : "bg-gray-100 text-gray-700";
  };

  const handleAgregarEtiqueta = () => {
    if (nuevaEtiqueta.trim()) {
      onAgregarEtiqueta(nuevaEtiqueta.trim());
      setNuevaEtiqueta("");
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Izquierda: Nombre y estado */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <span className="text-lg font-semibold">
              {conversacion.nombreContacto.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">{conversacion.nombreContacto}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{conversacion.canal}</span>
              <span className="text-xs text-gray-300">•</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  conversacion.estado === "Activa"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {conversacion.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Controles */}
        <div className="flex items-center gap-2">
          {/* Botón de Prioridad */}
          <div className="relative">
            <button
              onClick={() => setMostrarPrioridad(!mostrarPrioridad)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${getPrioridadColor(
                conversacion.prioridad
              )}`}
            >
              {conversacion.prioridad === "Urgente" ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Star className="h-3 w-3" />
              )}
              {conversacion.prioridad}
            </button>

            {mostrarPrioridad && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="p-2">
                  <p className="mb-2 px-2 text-xs font-semibold text-gray-500">
                    Cambiar prioridad
                  </p>
                  {prioridades.map((p) => (
                    <button
                      key={p.valor}
                      onClick={() => {
                        onCambiarPrioridad(p.valor);
                        setMostrarPrioridad(false);
                      }}
                      className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:opacity-80 ${p.color}`}
                    >
                      {p.valor}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón de Etiquetas */}
          <div className="relative">
            <button
              onClick={() => setMostrarEtiquetas(!mostrarEtiquetas)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <Tag className="h-5 w-5 text-gray-600" />
            </button>

            {mostrarEtiquetas && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Etiquetas</p>

                  {/* Etiquetas actuales */}
                  {conversacion.etiquetas.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {conversacion.etiquetas.map((etiqueta) => (
                        <span
                          key={etiqueta}
                          className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
                        >
                          {etiqueta}
                          <button
                            onClick={() => onQuitarEtiqueta(etiqueta)}
                            className="hover:text-indigo-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Agregar nueva etiqueta */}
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={nuevaEtiqueta}
                      onChange={(e) => setNuevaEtiqueta(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAgregarEtiqueta()}
                      placeholder="Nueva etiqueta..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleAgregarEtiqueta}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      +
                    </button>
                  </div>

                  {/* Etiquetas sugeridas */}
                  <p className="mb-2 text-xs font-semibold text-gray-500">Sugeridas</p>
                  <div className="flex flex-wrap gap-2">
                    {etiquetasSugeridas
                      .filter((e) => !conversacion.etiquetas.includes(e))
                      .map((etiqueta) => (
                        <button
                          key={etiqueta}
                          onClick={() => onAgregarEtiqueta(etiqueta)}
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          + {etiqueta}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setMostrarMenu(!mostrarMenu)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {mostrarMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="py-2">
                  <button
                    onClick={() => {
                      onEscalar();
                      setMostrarMenu(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    Escalar a Recepción
                  </button>
                  <button
                    onClick={() => {
                      onArchivar();
                      setMostrarMenu(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4" />
                    Archivar conversación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Etiquetas visibles */}
      {conversacion.etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {conversacion.etiquetas.slice(0, 3).map((etiqueta) => (
            <span
              key={etiqueta}
              className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700"
            >
              {etiqueta}
            </span>
          ))}
          {conversacion.etiquetas.length > 3 && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
              +{conversacion.etiquetas.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
