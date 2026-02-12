"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface OrdenLaboratorio {
  id: string;
  folio: string;
  fechaOrden: string;
  diagnosticoPresuntivo: string;
  esUrgente: boolean;
  estado: string;
  firmado: boolean;
  estudios: Array<{
    estudio?: {
      nombre: string;
      codigo: string;
      categoria: string;
    };
  }>;
  fechaResultadosRecibidos?: string;
  resultadosArchivoUrl?: string;
  resultadosObservaciones?: string;
}

interface Props {
  pacienteId: string;
  pacienteNombre: string;
  token: string;
  onClose: () => void;
}

export default function OrdenesLaboratorioListaModal({
  pacienteId,
  pacienteNombre,
  token,
  onClose,
}: Props) {
  const [ordenes, setOrdenes] = useState<OrdenLaboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenLaboratorio | null>(null);

  useEffect(() => {
    cargarOrdenes();
  }, [pacienteId]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_URL}/ordenes-laboratorio/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setOrdenes(data.ordenes || []);
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
      case "Pendiente":
        return "bg-yellow-100 text-yellow-700";
      case "En_Proceso":
        return "bg-blue-100 text-blue-700";
      case "Completada":
        return "bg-green-100 text-green-700";
      case "Cancelada":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Órdenes de Laboratorio</h2>
            <p className="text-sm text-cyan-100">{pacienteNombre}</p>
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
            <div className="py-12 text-center text-slate-500">Cargando órdenes...</div>
          ) : ordenes.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
              <p className="text-sm text-slate-500">Sin órdenes de laboratorio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenes.map((orden) => (
                <div
                  key={orden.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {orden.folio}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeEstado(orden.estado)}`}>
                          {orden.estado.replace("_", " ")}
                        </span>
                        {orden.esUrgente && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            🚨 Urgente
                          </span>
                        )}
                        {orden.firmado && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            ✓ Firmado
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {formatearFecha(orden.fechaOrden)}
                        </span>
                      </div>

                      <h4 className="mt-2 font-semibold text-slate-900">
                        {orden.diagnosticoPresuntivo}
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {orden.estudios.slice(0, 3).map((est, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-cyan-100 px-2 py-1 text-xs text-cyan-800"
                          >
                            🔬 {est.estudio?.nombre}
                          </span>
                        ))}
                        {orden.estudios.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            +{orden.estudios.length - 3} más
                          </span>
                        )}
                      </div>

                      {orden.fechaResultadosRecibidos && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            ✓ Resultados disponibles
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatearFecha(orden.fechaResultadosRecibidos)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setOrdenSeleccionada(orden)}
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
        {ordenSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Detalle de Orden</h3>
                  <p className="text-sm text-slate-500">{ordenSeleccionada.folio}</p>
                </div>
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Diagnóstico Presuntivo</p>
                  <p className="mt-1 text-sm text-slate-900">{ordenSeleccionada.diagnosticoPresuntivo}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Estudios Solicitados</p>
                  {ordenSeleccionada.estudios.map((est, idx) => (
                    <div key={idx} className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{est.estudio?.nombre}</span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {est.estudio?.codigo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{est.estudio?.categoria}</p>
                    </div>
                  ))}
                </div>

                {ordenSeleccionada.resultadosArchivoUrl && (
                  <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                    <p className="font-semibold text-green-900">✓ Resultados Disponibles</p>
                    <a
                      href={ordenSeleccionada.resultadosArchivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-green-700 underline"
                    >
                      Ver archivo de resultados
                    </a>
                    {ordenSeleccionada.resultadosObservaciones && (
                      <p className="mt-2 text-sm text-slate-600">
                        {ordenSeleccionada.resultadosObservaciones}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
