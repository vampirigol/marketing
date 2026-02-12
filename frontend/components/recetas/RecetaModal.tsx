"use client";

import { useState } from "react";
import FirmaElectronicaModal from "../firma/FirmaElectronicaModal";
import { generarRecetaPDF } from "../../lib/pdf-generator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Medicamento {
  nombreMedicamento: string;
  presentacion: string;
  concentracion: string;
  cantidad: number;
  dosis: string;
  frecuencia: string;
  viaAdministracion: string;
  duracionDias: number;
  indicaciones: string;
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

export default function RecetaModal({
  pacienteId,
  pacienteNombre,
  consultaId,
  token,
  doctorNombre = "Dr. Sistema",
  onClose,
  onCreada,
}: Props) {
  const [diagnostico, setDiagnostico] = useState("");
  const [indicacionesGenerales, setIndicacionesGenerales] = useState("");
  const [notasMedicas, setNotasMedicas] = useState("");
  const [firmaDataURL, setFirmaDataURL] = useState<string | null>(null);
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    {
      nombreMedicamento: "",
      presentacion: "Tabletas",
      concentracion: "",
      cantidad: 1,
      dosis: "",
      frecuencia: "",
      viaAdministracion: "Oral",
      duracionDias: 7,
      indicaciones: "",
    },
  ]);
  const [guardando, setGuardando] = useState(false);

  const agregarMedicamento = () => {
    setMedicamentos([
      ...medicamentos,
      {
        nombreMedicamento: "",
        presentacion: "Tabletas",
        concentracion: "",
        cantidad: 1,
        dosis: "",
        frecuencia: "",
        viaAdministracion: "Oral",
        duracionDias: 7,
        indicaciones: "",
      },
    ]);
  };

  const eliminarMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const actualizarMedicamento = (index: number, campo: keyof Medicamento, valor: any) => {
    const nuevos = [...medicamentos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setMedicamentos(nuevos);
  };

  const guardarReceta = async () => {
    if (!diagnostico || medicamentos.length === 0 || !medicamentos[0].nombreMedicamento) {
      alert("Complete el diagnóstico y al menos un medicamento");
      return;
    }

    setGuardando(true);
    try {
      const resp = await fetch(`${API_URL}/recetas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          consultaId,
          diagnostico,
          indicacionesGenerales,
          notasMedicas,
          medicamentos: medicamentos.filter((m) => m.nombreMedicamento),
        }),
      });

      if (!resp.ok) throw new Error("Error al crear receta");

      const data = await resp.json();
      const receta = data.receta;

      // Si hay firma, firmar la receta
      if (firmaDataURL) {
        await fetch(`${API_URL}/recetas/${receta.id}/firmar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firmaDigital: firmaDataURL.substring(0, 500), // Solo primeros 500 chars como hash
          }),
        });
      }

      // Generar PDF
      const pdf = generarRecetaPDF({
        folio: receta.folio,
        fecha: receta.fechaEmision,
        pacienteNombre,
        doctorNombre,
        diagnostico,
        indicacionesGenerales,
        medicamentos,
        firmaDigital: firmaDataURL ? "Firmado digitalmente" : undefined,
      });

      // Descargar PDF
      pdf.save(`Receta-${receta.folio}.pdf`);

      alert("✅ Receta creada y PDF generado exitosamente");
      onCreada?.();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear receta");
    } finally {
      setGuardando(false);
    }
  };

  const manejarFirma = (firma: string) => {
    setFirmaDataURL(firma);
    setMostrarFirma(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Nueva Receta Médica</h2>
            <p className="text-sm text-emerald-100">{pacienteNombre}</p>
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
          <div className="space-y-4">
            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Diagnóstico *
              </label>
              <textarea
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Diagnóstico que justifica la prescripción"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            {/* Medicamentos */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  💊 Medicamentos ({medicamentos.length})
                </h3>
                <button
                  onClick={agregarMedicamento}
                  className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                >
                  + Agregar
                </button>
              </div>

              <div className="space-y-4">
                {medicamentos.map((med, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-900">
                        Medicamento {idx + 1}
                      </span>
                      {medicamentos.length > 1 && (
                        <button
                          onClick={() => eliminarMedicamento(idx)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Nombre del medicamento *
                        </label>
                        <input
                          value={med.nombreMedicamento}
                          onChange={(e) =>
                            actualizarMedicamento(idx, "nombreMedicamento", e.target.value)
                          }
                          placeholder="Ej: Paracetamol"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Presentación
                          </label>
                          <select
                            value={med.presentacion}
                            onChange={(e) =>
                              actualizarMedicamento(idx, "presentacion", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="Tabletas">Tabletas</option>
                            <option value="Cápsulas">Cápsulas</option>
                            <option value="Jarabe">Jarabe</option>
                            <option value="Suspensión">Suspensión</option>
                            <option value="Crema">Crema</option>
                            <option value="Pomada">Pomada</option>
                            <option value="Gotas">Gotas</option>
                            <option value="Ampolletas">Ampolletas</option>
                            <option value="Parches">Parches</option>
                            <option value="Inhalador">Inhalador</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Concentración
                          </label>
                          <input
                            value={med.concentracion}
                            onChange={(e) =>
                              actualizarMedicamento(idx, "concentracion", e.target.value)
                            }
                            placeholder="Ej: 500mg"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            value={med.cantidad}
                            onChange={(e) =>
                              actualizarMedicamento(idx, "cantidad", parseInt(e.target.value))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Dosis *
                          </label>
                          <input
                            value={med.dosis}
                            onChange={(e) =>
                              actualizarMedicamento(idx, "dosis", e.target.value)
                            }
                            placeholder="Ej: 1 tableta"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Frecuencia *
                          </label>
                          <input
                            value={med.frecuencia}
                            onChange={(e) =>
                              actualizarMedicamento(idx, "frecuencia", e.target.value)
                            }
                            placeholder="Ej: Cada 8 horas"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Vía de administración
                          </label>
                          <select
                            value={med.viaAdministracion}
                            onChange={(e) =>
                              actualizarMedicamento(idx, "viaAdministracion", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="Oral">Oral</option>
                            <option value="Intravenosa">Intravenosa</option>
                            <option value="Intramuscular">Intramuscular</option>
                            <option value="Subcutánea">Subcutánea</option>
                            <option value="Tópica">Tópica</option>
                            <option value="Oftálmica">Oftálmica</option>
                            <option value="Ótica">Ótica</option>
                            <option value="Nasal">Nasal</option>
                            <option value="Rectal">Rectal</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Duración (días)
                          </label>
                          <input
                            type="number"
                            value={med.duracionDias}
                            onChange={(e) =>
                              actualizarMedicamento(
                                idx,
                                "duracionDias",
                                parseInt(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Indicaciones
                        </label>
                        <textarea
                          value={med.indicaciones}
                          onChange={(e) =>
                            actualizarMedicamento(idx, "indicaciones", e.target.value)
                          }
                          placeholder="Ej: Tomar con alimentos, evitar alcohol"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicaciones Generales */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Indicaciones Generales
              </label>
              <textarea
                value={indicacionesGenerales}
                onChange={(e) => setIndicacionesGenerales(e.target.value)}
                placeholder="Indicaciones adicionales para el paciente"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            {/* Notas Médicas */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Notas Médicas (privadas)
              </label>
              <textarea
                value={notasMedicas}
                onChange={(e) => setNotasMedicas(e.target.value)}
                placeholder="Notas internas (no se muestran al paciente)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => setMostrarFirma(true)}
              className="flex items-center gap-2 rounded-lg border-2 border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              {firmaDataURL ? "✓ Firmado" : "✍️ Firmar Receta"}
            </button>
            {firmaDataURL && (
              <span className="text-xs text-emerald-600">Receta firmada digitalmente</span>
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
              onClick={guardarReceta}
              disabled={guardando}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "💾 Guardar y Descargar PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de firma */}
      {mostrarFirma && (
        <FirmaElectronicaModal
          titulo="Firmar Receta Médica"
          onFirmar={manejarFirma}
          onCancelar={() => setMostrarFirma(false)}
        />
      )}
    </div>
  );
}
