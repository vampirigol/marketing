"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Receta {
  id: string;
  folio: string;
  fechaEmision: string;
  diagnostico: string;
  estado: string;
  firmado: boolean;
  medicamentos: Array<{
    nombreMedicamento: string;
    dosis: string;
    frecuencia: string;
    duracionDias: number;
  }>;
}

interface Props {
  pacienteId: string;
  pacienteNombre: string;
  token: string;
  onClose: () => void;
}

export default function RecetasListaModal({
  pacienteId,
  pacienteNombre,
  token,
  onClose,
}: Props) {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(null);

  useEffect(() => {
    cargarRecetas();
  }, [pacienteId]);

  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_URL}/recetas/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setRecetas(data.recetas || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case "Activa":
        return "bg-green-100 text-green-700";
      case "Surtida":
        return "bg-blue-100 text-blue-700";
      case "Cancelada":
        return "bg-red-100 text-red-700";
      case "Vencida":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recetas Médicas</h2>
            <p className="text-sm text-emerald-100">{pacienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white transition hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Cargando recetas...</div>
          ) : recetas.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
              <p className="text-sm text-slate-500">Sin recetas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recetas.map((receta) => (
                <div
                  key={receta.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {receta.folio}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeEstado(receta.estado)}`}>
                          {receta.estado}
                        </span>
                        {receta.firmado && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            ✓ Firmado
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {formatearFecha(receta.fechaEmision)}
                        </span>
                      </div>

                      <h4 className="mt-2 font-semibold text-slate-900">
                        {receta.diagnostico}
                      </h4>

                      <div className="mt-2 space-y-1">
                        {receta.medicamentos.map((med, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="font-medium">💊 {med.nombreMedicamento}</span>
                            <span className="text-xs text-slate-500">
                              {med.dosis} · {med.frecuencia} · {med.duracionDias} días
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setRecetaSeleccionada(receta)}
                      className="ml-4 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal detalle */}
        {recetaSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Detalle de Receta</h3>
                  <p className="text-sm text-slate-500">{recetaSeleccionada.folio}</p>
                </div>
                <button
                  onClick={() => setRecetaSeleccionada(null)}
                  className="text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Diagnóstico</p>
                  <p className="mt-1 text-sm text-slate-900">{recetaSeleccionada.diagnostico}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Medicamentos</p>
                  {recetaSeleccionada.medicamentos.map((med, idx) => (
                    <div key={idx} className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="font-semibold text-slate-900">{med.nombreMedicamento}</p>
                      <p className="text-sm text-slate-600">Dosis: {med.dosis}</p>
                      <p className="text-sm text-slate-600">Frecuencia: {med.frecuencia}</p>
                      <p className="text-sm text-slate-600">Duración: {med.duracionDias} días</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
