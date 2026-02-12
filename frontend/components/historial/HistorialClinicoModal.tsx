"use client";

import { useEffect, useState } from "react";
import TimelineConsultas from "./TimelineConsultas";
import SignosVitalesChart from "./SignosVitalesChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Consulta {
  id: string;
  fechaConsulta: string;
  tipoConsulta: string;
  especialidad: string;
  motivoConsulta: string;
  diagnosticos: Array<{ nombre: string; tipo?: string }>;
  notasEvolucion?: string;
  firmado?: boolean;
}

interface SignosVitales {
  id: string;
  fechaRegistro: string;
  temperatura?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  saturacionOxigeno?: number;
  peso?: number;
  glucosa?: number;
}

interface Antecedente {
  id: string;
  tipoAntecedente: string;
  descripcion: string;
  estaActivo: boolean;
  fechaDiagnostico?: string;
}

interface Medicamento {
  id: string;
  nombreMedicamento: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  esCronico: boolean;
}

interface Props {
  pacienteId: string;
  pacienteNombre: string;
  token: string;
  onClose: () => void;
}

export default function HistorialClinicoModal({
  pacienteId,
  pacienteNombre,
  token,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"consultas" | "signos" | "antecedentes" | "medicamentos">("consultas");
  const [loading, setLoading] = useState(true);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [signos, setSignos] = useState<SignosVitales[]>([]);
  const [antecedentes, setAntecedentes] = useState<Antecedente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<Consulta | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Formulario nueva consulta
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<string>("Subsecuente");
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");
  const [nuevaExploracion, setNuevaExploracion] = useState("");
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState("");
  const [nuevoPlan, setNuevoPlan] = useState("");
  const [nuevasIndicaciones, setNuevasIndicaciones] = useState("");
  const [nuevasNotas, setNuevasNotas] = useState("");

  // Signos vitales para nueva consulta
  const [temperatura, setTemperatura] = useState("");
  const [presionSist, setPresionSist] = useState("");
  const [presionDiast, setPresionDiast] = useState("");
  const [frecCardiaca, setFrecCardiaca] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");

  useEffect(() => {
    void cargarHistorial();
  }, [pacienteId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const resp = await fetch(
        `${API_URL}/historial-clinico/paciente/${pacienteId}/completo`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) throw new Error("Error al cargar historial");
      const data = await resp.json();
      setConsultas(data.consultas || []);
      setSignos(data.signosVitales || []);
      setAntecedentes(data.antecedentes || []);
      setMedicamentos(data.medicamentos || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearConsulta = async () => {
    try {
      if (!nuevoMotivo || !nuevaEspecialidad) {
        alert("Completa los campos obligatorios");
        return;
      }

      const diagnosticos = nuevoDiagnostico
        ? [{ nombre: nuevoDiagnostico, tipo: "principal" as const }]
        : [];

      const signosVitales: any = {};
      if (temperatura) signosVitales.temperatura = parseFloat(temperatura);
      if (presionSist && presionDiast)
        signosVitales.presionArterial = `${presionSist}/${presionDiast}`;
      if (frecCardiaca)
        signosVitales.frecuenciaCardiaca = parseInt(frecCardiaca, 10);
      if (saturacion)
        signosVitales.saturacionOxigeno = parseInt(saturacion, 10);
      if (peso) signosVitales.peso = parseFloat(peso);
      if (talla) signosVitales.talla = parseFloat(talla);

      const payload = {
        pacienteId,
        tipoConsulta: nuevoTipo,
        especialidad: nuevaEspecialidad,
        motivoConsulta: nuevoMotivo,
        exploracionFisica: nuevaExploracion || undefined,
        diagnosticos,
        planTratamiento: nuevoPlan || undefined,
        indicaciones: nuevasIndicaciones || undefined,
        notasEvolucion: nuevasNotas || undefined,
        signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : undefined,
        requiereSeguimiento: false,
        diasIncapacidad: 0,
        firmado: false,
      };

      const resp = await fetch(`${API_URL}/historial-clinico/consultas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error("Error al crear consulta");

      // Limpiar formulario
      setNuevoMotivo("");
      setNuevoTipo("Subsecuente");
      setNuevaEspecialidad("");
      setNuevaExploracion("");
      setNuevoDiagnostico("");
      setNuevoPlan("");
      setNuevasIndicaciones("");
      setNuevasNotas("");
      setTemperatura("");
      setPresionSist("");
      setPresionDiast("");
      setFrecCardiaca("");
      setSaturacion("");
      setPeso("");
      setTalla("");
      setMostrarFormulario(false);

      await cargarHistorial();
      alert("Consulta creada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear consulta");
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Historial Clínico</h2>
            <p className="text-sm text-blue-100">{pacienteNombre}</p>
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          {[
            { id: "consultas" as const, label: "Consultas", icon: "📋" },
            { id: "signos" as const, label: "Signos Vitales", icon: "💓" },
            { id: "antecedentes" as const, label: "Antecedentes", icon: "📝" },
            { id: "medicamentos" as const, label: "Medicamentos", icon: "💊" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              Cargando historial...
            </div>
          ) : (
            <>
              {activeTab === "consultas" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Consultas Previas ({consultas.length})
                    </h3>
                    <button
                      onClick={() => setMostrarFormulario(!mostrarFormulario)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {mostrarFormulario ? "Cancelar" : "+ Nueva Consulta"}
                    </button>
                  </div>

                  {mostrarFormulario && (
                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                      <h4 className="mb-3 font-semibold text-blue-900">
                        Nueva Consulta Médica
                      </h4>
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700">
                              Tipo *
                            </label>
                            <select
                              value={nuevoTipo}
                              onChange={(e) => setNuevoTipo(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                              <option value="Primera_Vez">Primera Vez</option>
                              <option value="Subsecuente">Subsecuente</option>
                              <option value="Urgencia">Urgencia</option>
                              <option value="Telemedicina">Telemedicina</option>
                              <option value="Seguimiento">Seguimiento</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700">
                              Especialidad *
                            </label>
                            <input
                              value={nuevaEspecialidad}
                              onChange={(e) => setNuevaEspecialidad(e.target.value)}
                              placeholder="Ej: Medicina General"
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Motivo de Consulta *
                          </label>
                          <textarea
                            value={nuevoMotivo}
                            onChange={(e) => setNuevoMotivo(e.target.value)}
                            placeholder="Describe el motivo de la consulta"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="mb-2 text-xs font-semibold text-slate-700">
                            Signos Vitales
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            <input
                              value={temperatura}
                              onChange={(e) => setTemperatura(e.target.value)}
                              placeholder="Temp °C"
                              type="number"
                              step="0.1"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <input
                              value={presionSist}
                              onChange={(e) => setPresionSist(e.target.value)}
                              placeholder="TA Sist"
                              type="number"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <input
                              value={presionDiast}
                              onChange={(e) => setPresionDiast(e.target.value)}
                              placeholder="TA Diast"
                              type="number"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <input
                              value={frecCardiaca}
                              onChange={(e) => setFrecCardiaca(e.target.value)}
                              placeholder="FC lpm"
                              type="number"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <input
                              value={saturacion}
                              onChange={(e) => setSaturacion(e.target.value)}
                              placeholder="SpO2 %"
                              type="number"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <input
                              value={peso}
                              onChange={(e) => setPeso(e.target.value)}
                              placeholder="Peso kg"
                              type="number"
                              step="0.1"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <input
                              value={talla}
                              onChange={(e) => setTalla(e.target.value)}
                              placeholder="Talla cm"
                              type="number"
                              step="0.1"
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Exploración Física
                          </label>
                          <textarea
                            value={nuevaExploracion}
                            onChange={(e) => setNuevaExploracion(e.target.value)}
                            placeholder="Hallazgos de la exploración física"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Diagnóstico
                          </label>
                          <input
                            value={nuevoDiagnostico}
                            onChange={(e) => setNuevoDiagnostico(e.target.value)}
                            placeholder="Diagnóstico principal"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Plan de Tratamiento
                          </label>
                          <textarea
                            value={nuevoPlan}
                            onChange={(e) => setNuevoPlan(e.target.value)}
                            placeholder="Plan terapéutico"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Indicaciones
                          </label>
                          <textarea
                            value={nuevasIndicaciones}
                            onChange={(e) => setNuevasIndicaciones(e.target.value)}
                            placeholder="Indicaciones para el paciente"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Notas de Evolución
                          </label>
                          <textarea
                            value={nuevasNotas}
                            onChange={(e) => setNuevasNotas(e.target.value)}
                            placeholder="Notas adicionales"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>

                        <button
                          onClick={crearConsulta}
                          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                        >
                          Guardar Consulta
                        </button>
                      </div>
                    </div>
                  )}

                  <TimelineConsultas
                    consultas={consultas}
                    onVerDetalle={(consulta) => setConsultaSeleccionada(consulta)}
                  />
                </div>
              )}

              {activeTab === "signos" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Signos Vitales ({signos.length})
                  </h3>
                  {signos.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
                      <p className="text-sm text-slate-500">
                        Sin signos vitales registrados
                      </p>
                    </div>
                  ) : (
                    <>
                      <SignosVitalesChart signos={signos} />
                      
                      <div className="mt-6">
                        <h4 className="mb-3 text-sm font-semibold text-slate-700">
                          Últimos registros
                        </h4>
                        <div className="space-y-3">
                          {signos.slice(0, 5).map((signo) => (
                            <div
                              key={signo.id}
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">
                                  {formatearFecha(signo.fechaRegistro)}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                {signo.temperatura && (
                                  <div className="rounded-lg bg-red-50 p-2">
                                    <p className="text-[10px] text-red-700">Temperatura</p>
                                    <p className="text-lg font-bold text-red-900">
                                      {signo.temperatura}°C
                                    </p>
                                  </div>
                                )}
                                {signo.presionSistolica && signo.presionDiastolica && (
                                  <div className="rounded-lg bg-blue-50 p-2">
                                    <p className="text-[10px] text-blue-700">Presión Arterial</p>
                                    <p className="text-lg font-bold text-blue-900">
                                      {signo.presionSistolica}/{signo.presionDiastolica}
                                    </p>
                                  </div>
                                )}
                                {signo.frecuenciaCardiaca && (
                                  <div className="rounded-lg bg-pink-50 p-2">
                                    <p className="text-[10px] text-pink-700">Frec. Cardíaca</p>
                                    <p className="text-lg font-bold text-pink-900">
                                      {signo.frecuenciaCardiaca} lpm
                                    </p>
                                  </div>
                                )}
                                {signo.saturacionOxigeno && (
                                  <div className="rounded-lg bg-cyan-50 p-2">
                                    <p className="text-[10px] text-cyan-700">SpO2</p>
                                    <p className="text-lg font-bold text-cyan-900">
                                      {signo.saturacionOxigeno}%
                                    </p>
                                  </div>
                                )}
                                {signo.peso && (
                                  <div className="rounded-lg bg-purple-50 p-2">
                                    <p className="text-[10px] text-purple-700">Peso</p>
                                    <p className="text-lg font-bold text-purple-900">
                                      {signo.peso} kg
                                    </p>
                                  </div>
                                )}
                                {signo.glucosa && (
                                  <div className="rounded-lg bg-amber-50 p-2">
                                    <p className="text-[10px] text-amber-700">Glucosa</p>
                                    <p className="text-lg font-bold text-amber-900">
                                      {signo.glucosa} mg/dL
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "antecedentes" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Antecedentes Médicos ({antecedentes.length})
                  </h3>
                  {antecedentes.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
                      <p className="text-sm text-slate-500">
                        Sin antecedentes registrados
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {antecedentes.map((ant) => (
                        <div
                          key={ant.id}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                  {ant.tipoAntecedente.replace(/_/g, " ")}
                                </span>
                                {ant.estaActivo ? (
                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                    Activo
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-slate-900">
                                {ant.descripcion}
                              </p>
                              {ant.fechaDiagnostico && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Desde: {new Date(ant.fechaDiagnostico).toLocaleDateString("es-MX")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "medicamentos" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Medicamentos Actuales ({medicamentos.length})
                  </h3>
                  {medicamentos.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
                      <p className="text-sm text-slate-500">
                        Sin medicamentos registrados
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {medicamentos.map((med) => (
                        <div
                          key={med.id}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900">
                                  {med.nombreMedicamento}
                                </h4>
                                {med.esCronico && (
                                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                                    Crónico
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 grid gap-1 text-sm text-slate-600">
                                <p>
                                  <span className="font-semibold">Dosis:</span> {med.dosis}
                                </p>
                                <p>
                                  <span className="font-semibold">Frecuencia:</span>{" "}
                                  {med.frecuencia}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Inicio: {new Date(med.fechaInicio).toLocaleDateString("es-MX")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal consulta detallada */}
        {consultaSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Detalle de Consulta
                  </h3>
                  <p className="text-sm text-slate-500">
                    {formatearFecha(consultaSeleccionada.fechaConsulta)}
                  </p>
                </div>
                <button
                  onClick={() => setConsultaSeleccionada(null)}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Motivo</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {consultaSeleccionada.motivoConsulta}
                  </p>
                </div>

                {consultaSeleccionada.diagnosticos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Diagnósticos</p>
                    <div className="mt-1 space-y-1">
                      {consultaSeleccionada.diagnosticos.map((dx, idx) => (
                        <p key={idx} className="text-sm text-slate-900">
                          • {dx.nombre} ({dx.tipo})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {consultaSeleccionada.notasEvolucion && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Notas</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {consultaSeleccionada.notasEvolucion}
                    </p>
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
