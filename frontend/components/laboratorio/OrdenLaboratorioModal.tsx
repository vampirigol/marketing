"use client";

import { useState, useEffect } from "react";
import FirmaElectronicaModal from "../firma/FirmaElectronicaModal";
import { generarOrdenLaboratorioPDF } from "../../lib/pdf-generator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Estudio {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  requiereAyuno: boolean;
  tiempoAyunoHoras?: number;
  preparacionEspecial?: string;
}

interface Laboratorio {
  id: string;
  nombre: string;
  codigo: string;
  tipoIntegracion: string;
}

interface Props {
  pacienteId: string;
  pacienteNombre: string;
  consultaId?: string;
  token: string;
  doctorNombre?: string;
  onClose: () => void;
  onCreada?: () => void;
}

export default function OrdenLaboratorioModal({
  pacienteId,
  pacienteNombre,
  consultaId,
  token,
  doctorNombre = "Dr. Sistema",
  onClose,
  onCreada,
}: Props) {
  const [diagnostico, setDiagnostico] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [esUrgente, setEsUrgente] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [estudiosSeleccionados, setEstudiosSeleccionados] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [firmaDataURL, setFirmaDataURL] = useState<string | null>(null);
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [laboratorioSeleccionado, setLaboratorioSeleccionado] = useState<string>("");

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      const [catResp, estResp, labResp] = await Promise.all([
        fetch(`${API_URL}/ordenes-laboratorio/catalogo/categorias`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/ordenes-laboratorio/catalogo/estudios`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/integracion-laboratorios`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (catResp.ok) {
        const data = await catResp.json();
        setCategorias(data.categorias);
        if (data.categorias.length > 0) {
          setCategoriaSeleccionada(data.categorias[0]);
        }
      }

      if (estResp.ok) {
        const data = await estResp.json();
        setEstudios(data.estudios);
      }

      if (labResp.ok) {
        const data = await labResp.json();
        setLaboratorios(data.integraciones || []);
        if (data.integraciones && data.integraciones.length > 0) {
          setLaboratorioSeleccionado(data.integraciones[0].id);
        }
      }
    } catch (error) {
      console.error("Error al cargar catálogo:", error);
    } finally {
      setCargando(false);
    }
  };

  const toggleEstudio = (estudioId: string) => {
    const nuevos = new Set(estudiosSeleccionados);
    if (nuevos.has(estudioId)) {
      nuevos.delete(estudioId);
    } else {
      nuevos.add(estudioId);
    }
    setEstudiosSeleccionados(nuevos);
  };

  const guardarOrden = async () => {
    if (!diagnostico || estudiosSeleccionados.size === 0) {
      alert("Complete el diagnóstico y seleccione al menos un estudio");
      return;
    }

    setGuardando(true);
    try {
      // Crear orden
      const resp = await fetch(`${API_URL}/ordenes-laboratorio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          consultaId,
          diagnosticoPresuntivo: diagnostico,
          indicacionesEspeciales: indicaciones,
          esUrgente,
          estudios: Array.from(estudiosSeleccionados).map((id) => ({
            estudioId: id,
          })),
        }),
      });

      if (!resp.ok) throw new Error("Error al crear orden");

      const data = await resp.json();
      const orden = data.orden;

      // Si hay firma, firmar la orden
      if (firmaDataURL) {
        await fetch(`${API_URL}/ordenes-laboratorio/${orden.id}/firmar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Enviar a laboratorio externo si está seleccionado
      if (laboratorioSeleccionado) {
        await fetch(`${API_URL}/integracion-laboratorios/enviar/${orden.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laboratorioId: laboratorioSeleccionado,
          }),
        });
      }

      // Generar PDF
      const estudiosParaPDF = estudios.filter((e) =>
        estudiosSeleccionados.has(e.id)
      );
      const pdf = generarOrdenLaboratorioPDF({
        folio: orden.folio,
        fecha: orden.fechaOrden,
        pacienteNombre,
        doctorNombre,
        diagnostico,
        esUrgente,
        estudios: estudiosParaPDF,
        indicaciones,
      });

      // Descargar PDF
      pdf.save(`Orden-Laboratorio-${orden.folio}.pdf`);

      alert("✅ Orden creada, enviada al laboratorio y PDF generado");
      onCreada?.();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear orden de laboratorio");
    } finally {
      setGuardando(false);
    }
  };

  const manejarFirma = (firma: string) => {
    setFirmaDataURL(firma);
    setMostrarFirma(false);
  };

  const estudiosCategoria = categoriaSeleccionada
    ? estudios.filter((e) => e.categoria === categoriaSeleccionada)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Nueva Orden de Laboratorio</h2>
            <p className="text-sm text-cyan-100">{pacienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">
          {cargando ? (
            <div className="py-12 text-center text-slate-500">Cargando catálogo...</div>
          ) : (
            <div className="space-y-4">
              {/* Diagnóstico */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Diagnóstico Presuntivo *
                </label>
                <textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Diagnóstico que justifica los estudios solicitados"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              {/* Urgente */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={esUrgente}
                  onChange={(e) => setEsUrgente(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600"
                />
                <label className="text-sm font-semibold text-slate-700">
                  🚨 Marcar como urgente
                </label>
              </div>

              {/* Selección de estudios */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    🔬 Estudios Seleccionados ({estudiosSeleccionados.size})
                  </h3>
                </div>

                {/* Tabs de categorías */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {categorias.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaSeleccionada(cat)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        categoriaSeleccionada === cat
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Lista de estudios */}
                <div className="grid gap-2">
                  {estudiosCategoria.map((estudio) => {
                    const seleccionado = estudiosSeleccionados.has(estudio.id);
                    return (
                      <div
                        key={estudio.id}
                        onClick={() => toggleEstudio(estudio.id)}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition ${
                          seleccionado
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => {}}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900">{estudio.nombre}</h4>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {estudio.codigo}
                              </span>
                              {estudio.requiereAyuno && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                  ⚠️ Ayuno {estudio.tiempoAyunoHoras}h
                                </span>
                              )}
                            </div>
                            {estudio.preparacionEspecial && (
                              <p className="mt-1 text-xs text-slate-600">
                                {estudio.preparacionEspecial}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {estudiosCategoria.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
                    No hay estudios disponibles en esta categoría
                  </div>
                )}
              </div>

              {/* Indicaciones */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Indicaciones Especiales
                </label>
                <textarea
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
                  placeholder="Instrucciones adicionales para el paciente"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              {/* Laboratorio destino */}
              {laboratorios.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    🏥 Enviar a Laboratorio
                  </label>
                  <select
                    value={laboratorioSeleccionado}
                    onChange={(e) => setLaboratorioSeleccionado(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {laboratorios.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.nombre} ({lab.tipoIntegracion})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    La orden será enviada automáticamente al laboratorio seleccionado
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => setMostrarFirma(true)}
              className="flex items-center gap-2 rounded-lg border-2 border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              {firmaDataURL ? "✓ Firmado" : "✍️ Firmar Orden"}
            </button>
            {firmaDataURL && (
              <span className="text-xs text-emerald-600">Orden firmada digitalmente</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={guardando}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={guardarOrden}
              disabled={guardando || cargando}
              className="flex-1 rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "💾 Crear, Enviar y Descargar PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de firma */}
      {mostrarFirma && (
        <FirmaElectronicaModal
          titulo="Firmar Orden de Laboratorio"
          onFirmar={manejarFirma}
          onCancelar={() => setMostrarFirma(false)}
        />
      )}
    </div>
  );
}
