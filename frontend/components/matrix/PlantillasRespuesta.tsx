"use client";

import { useState, useEffect } from "react";
import { Zap, Search, Plus, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Plantilla {
  id: string;
  nombre: string;
  contenido: string;
  etiquetas: string[];
  esGlobal: boolean;
  usoCount: number;
}

interface Props {
  token: string;
  onSeleccionar: (contenido: string) => void;
  onCerrar: () => void;
}

export default function PlantillasRespuesta({ token, onSeleccionar, onCerrar }: Props) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    nombre: "",
    contenido: "",
    etiquetas: [] as string[],
  });

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const res = await fetch(`${API_URL}/matrix/plantillas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlantillas(data.plantillas || []);
      }
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearPlantilla = async () => {
    if (!nuevaPlantilla.nombre || !nuevaPlantilla.contenido) return;

    try {
      const res = await fetch(`${API_URL}/matrix/plantillas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nuevaPlantilla.nombre,
          contenido: nuevaPlantilla.contenido,
          etiquetas: nuevaPlantilla.etiquetas,
          esGlobal: false,
          activa: true,
        }),
      });

      if (res.ok) {
        await cargarPlantillas();
        setMostrarCrear(false);
        setNuevaPlantilla({ nombre: "", contenido: "", etiquetas: [] });
      }
    } catch (error) {
      console.error("Error al crear plantilla:", error);
    }
  };

  const plantillasFiltradas = plantillas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.contenido.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.etiquetas.some((e) => e.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Respuestas Rápidas</h2>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Buscador */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plantillas..."
              className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="max-h-[500px] overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Cargando plantillas...</div>
          ) : mostrarCrear ? (
            <div className="space-y-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
              <input
                type="text"
                value={nuevaPlantilla.nombre}
                onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, nombre: e.target.value })}
                placeholder="Nombre de la plantilla"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={nuevaPlantilla.contenido}
                onChange={(e) =>
                  setNuevaPlantilla({ ...nuevaPlantilla, contenido: e.target.value })
                }
                placeholder="Contenido del mensaje..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={crearPlantilla}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setMostrarCrear(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {plantillasFiltradas.length} plantilla(s) encontrada(s)
                </p>
                <button
                  onClick={() => setMostrarCrear(true)}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Nueva
                </button>
              </div>

              <div className="grid gap-3">
                {plantillasFiltradas.map((plantilla) => (
                  <button
                    key={plantilla.id}
                    onClick={() => {
                      onSeleccionar(plantilla.contenido);
                      onCerrar();
                    }}
                    className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900">{plantilla.nombre}</h4>
                      <div className="flex items-center gap-2">
                        {plantilla.esGlobal && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                            Global
                          </span>
                        )}
                        <span className="text-xs text-gray-500">Usado {plantilla.usoCount}×</span>
                      </div>
                    </div>
                    <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                      {plantilla.contenido}
                    </p>
                    {plantilla.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {plantilla.etiquetas.map((etiqueta) => (
                          <span
                            key={etiqueta}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                          >
                            {etiqueta}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
