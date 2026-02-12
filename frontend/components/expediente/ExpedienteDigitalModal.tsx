"use client";

import { useEffect, useState } from "react";
import GraficaEvolucion from "./GraficaEvolucion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  noAfiliacion: string;
  alergias?: string;
  tipoSangre?: string;
  fotoUrl?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
}

interface Props {
  pacienteId: string;
  token: string;
  onClose: () => void;
}

export default function ExpedienteDigitalModal({ pacienteId, token, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<
    "datos" | "historial" | "recetas" | "lab" | "archivos" | "evolucion"
  >("datos");

  // Estados para pestañas asíncronas
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [errorRecetas, setErrorRecetas] = useState<string | null>(null);

  const [loadingLab, setLoadingLab] = useState(false);
  const [lab, setLab] = useState<any[]>([]);
  const [errorLab, setErrorLab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Datos del paciente
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [antecedentes, setAntecedentes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [archivos, setArchivos] = useState<any[]>([]);
  const [signosVitales, setSignosVitales] = useState<any[]>([]);

  // Formularios
  const [mostrarFormAntecedente, setMostrarFormAntecedente] = useState(false);
  const [mostrarFormMedicamento, setMostrarFormMedicamento] = useState(false);
  const [mostrarFormArchivo, setMostrarFormArchivo] = useState(false);


  useEffect(() => {
    cargarExpediente();
  }, [pacienteId]);

  // Carga asíncrona por pestaña
  useEffect(() => {
    if (activeTab === 'historial' && historial.length === 0 && !loadingHistorial) {
      setLoadingHistorial(true);
      setErrorHistorial(null);
      fetch(`${API_URL}/historial-clinico/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => setHistorial(data.historial || []))
        .catch(e => setErrorHistorial('Error al cargar historial'))
        .finally(() => setLoadingHistorial(false));
    }
    if (activeTab === 'recetas' && recetas.length === 0 && !loadingRecetas) {
      setLoadingRecetas(true);
      setErrorRecetas(null);
      fetch(`${API_URL}/recetas/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => setRecetas(data.recetas || []))
        .catch(e => setErrorRecetas('Error al cargar recetas'))
        .finally(() => setLoadingRecetas(false));
    }
    if (activeTab === 'lab' && lab.length === 0 && !loadingLab) {
      setLoadingLab(true);
      setErrorLab(null);
      fetch(`${API_URL}/laboratorio/paciente/${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => setLab(data.laboratorio || []))
        .catch(e => setErrorLab('Error al cargar laboratorio'))
        .finally(() => setLoadingLab(false));
    }
  }, [activeTab, pacienteId]);

  const cargarExpediente = async () => {
    try {
      setLoading(true);
      
      const [pacResp, histResp, archResp] = await Promise.all([
        fetch(`${API_URL}/pacientes/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/historial-clinico/paciente/${pacienteId}/completo`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/archivos-paciente/paciente/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pacResp.ok) {
        const data = await pacResp.json();
        setPaciente(data.paciente);
      }

      if (histResp.ok) {
        const data = await histResp.json();
        setAntecedentes(data.antecedentes || []);
        setMedicamentos(data.medicamentos || []);
        setSignosVitales(data.signosVitales || []);
      }

      if (archResp.ok) {
        const data = await archResp.json();
        setArchivos(data.archivos || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = (fechaNac: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderDatosPersonales = () => (
    <div className="space-y-6">
      {/* Foto y datos básicos */}
      <div className="flex items-start gap-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
          {paciente?.fotoUrl ? (
            <img src={paciente.fotoUrl} alt={paciente.nombre} className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl font-bold text-white">
              {paciente?.nombre?.charAt(0)}{paciente?.apellido?.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-blue-900">
            {paciente?.nombre} {paciente?.apellido}
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-xs font-semibold text-blue-700">Edad</p>
              <p className="text-sm text-blue-900">
                {paciente?.fechaNacimiento && calcularEdad(paciente.fechaNacimiento)} años
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700">Género</p>
              <p className="text-sm text-blue-900">{paciente?.genero}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700">Fecha de Nacimiento</p>
              <p className="text-sm text-blue-900">
                {paciente?.fechaNacimiento && formatearFecha(paciente.fechaNacimiento)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700">Tipo de Sangre</p>
              <p className="text-sm font-bold text-red-600">
                {paciente?.tipoSangre || "No especificado"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h4 className="mb-4 text-lg font-semibold text-slate-900">Información de Contacto</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">Teléfono</p>
            <p className="text-sm text-slate-900">{paciente?.telefono}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Email</p>
            <p className="text-sm text-slate-900">{paciente?.email || "No especificado"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-slate-500">Dirección</p>
            <p className="text-sm text-slate-900">
              {paciente?.direccion}, {paciente?.ciudad}, {paciente?.estado}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">No. de Afiliación</p>
            <p className="text-sm font-mono font-bold text-slate-900">{paciente?.noAfiliacion}</p>
          </div>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
        <h4 className="mb-4 text-lg font-semibold text-red-900">🚨 Contacto de Emergencia</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-red-700">Nombre</p>
            <p className="text-sm text-red-900">
              {paciente?.contactoEmergenciaNombre || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700">Teléfono</p>
            <p className="text-sm text-red-900">
              {paciente?.contactoEmergenciaTelefono || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700">Parentesco</p>
            <p className="text-sm text-red-900">
              {paciente?.contactoEmergenciaParentesco || "No especificado"}
            </p>
          </div>
        </div>
      </div>

      {/* Alergias */}
      {paciente?.alergias && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
          <h4 className="mb-2 text-lg font-semibold text-amber-900">⚠️ Alergias</h4>
          <p className="text-sm text-amber-900">{paciente.alergias}</p>
        </div>
      )}
    </div>
  );

  const renderAntecedentes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Antecedentes Médicos ({antecedentes.length})
        </h3>
        <button
          onClick={() => setMostrarFormAntecedente(!mostrarFormAntecedente)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          {mostrarFormAntecedente ? "Cancelar" : "+ Agregar"}
        </button>
      </div>

      {mostrarFormAntecedente && (
        <FormAntecedente
          pacienteId={pacienteId}
          token={token}
          onGuardado={() => {
            setMostrarFormAntecedente(false);
            cargarExpediente();
          }}
        />
      )}

      {antecedentes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Sin antecedentes registrados</p>
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
                  <p className="mt-2 text-sm font-semibold text-slate-900">{ant.descripcion}</p>
                  {ant.fechaDiagnostico && (
                    <p className="mt-1 text-xs text-slate-500">
                      Desde: {formatearFecha(ant.fechaDiagnostico)}
                    </p>
                  )}
                  {ant.tratamientoActual && (
                    <p className="mt-1 text-xs text-slate-600">
                      Tratamiento: {ant.tratamientoActual}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMedicamentos = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Medicamentos Actuales ({medicamentos.length})
        </h3>
        <button
          onClick={() => setMostrarFormMedicamento(!mostrarFormMedicamento)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {mostrarFormMedicamento ? "Cancelar" : "+ Agregar"}
        </button>
      </div>

      {mostrarFormMedicamento && (
        <FormMedicamento
          pacienteId={pacienteId}
          token={token}
          onGuardado={() => {
            setMostrarFormMedicamento(false);
            cargarExpediente();
          }}
        />
      )}

      {medicamentos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Sin medicamentos registrados</p>
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
                    <h4 className="font-semibold text-slate-900">{med.nombreMedicamento}</h4>
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
                      <span className="font-semibold">Frecuencia:</span> {med.frecuencia}
                    </p>
                    {med.viaAdministracion && (
                      <p>
                        <span className="font-semibold">Vía:</span> {med.viaAdministracion}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Desde: {formatearFecha(med.fechaInicio)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderArchivos = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Archivos Adjuntos ({archivos.length})
        </h3>
        <button
          onClick={() => setMostrarFormArchivo(!mostrarFormArchivo)}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          {mostrarFormArchivo ? "Cancelar" : "+ Subir Archivo"}
        </button>
      </div>

      {mostrarFormArchivo && (
        <FormArchivo
          pacienteId={pacienteId}
          token={token}
          onGuardado={() => {
            setMostrarFormArchivo(false);
            cargarExpediente();
          }}
        />
      )}

      {archivos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Sin archivos adjuntos</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {archivos.map((archivo) => (
            <a
              key={archivo.id}
              href={archivo.urlArchivo}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-100">
                  <span className="text-2xl">
                    {archivo.categoria === "Radiografia" && "🩻"}
                    {archivo.categoria === "Laboratorio" && "🔬"}
                    {archivo.categoria === "Tomografia" && "🏥"}
                    {archivo.categoria === "Electrocardiograma" && "❤️"}
                    {archivo.categoria === "Receta" && "💊"}
                    {!["Radiografia", "Laboratorio", "Tomografia", "Electrocardiograma", "Receta"].includes(archivo.categoria) && "📄"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{archivo.nombreArchivo}</p>
                  <p className="mt-1 text-xs text-slate-500">{archivo.categoria}</p>
                  {archivo.fechaEstudio && (
                    <p className="text-xs text-slate-400">
                      {formatearFecha(archivo.fechaEstudio)}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderEvolucion = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Gráficas de Evolución</h3>

      {signosVitales.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">Sin datos de evolución</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <GraficaEvolucion signos={signosVitales} tipo="peso" />
          <GraficaEvolucion signos={signosVitales} tipo="presion" />
          <GraficaEvolucion signos={signosVitales} tipo="glucosa" />
          <GraficaEvolucion signos={signosVitales} tipo="temperatura" />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">📋 Expediente Digital</h2>
            <p className="text-sm text-blue-100">{paciente?.nombre} {paciente?.apellido}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          {[
            { id: "datos" as const, label: "Datos Personales", icon: "👤" },
            { id: "historial" as const, label: "Historial", icon: "📖" },
            { id: "recetas" as const, label: "Recetas Previas", icon: "💊" },
            { id: "lab" as const, label: "Lab", icon: "🔬" },
            { id: "archivos" as const, label: "Archivos", icon: "📎" },
            { id: "evolucion" as const, label: "Evolución", icon: "📊" },
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
        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Cargando expediente...</div>
          ) : (
            <>
              {activeTab === "datos" && renderDatosPersonales()}
              {activeTab === "historial" && (
                loadingHistorial ? <div className="py-8 text-center text-slate-500">Cargando historial...</div>
                : errorHistorial ? <div className="py-8 text-center text-red-500">{errorHistorial}</div>
                : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Historial Clínico</h3>
                    {historial.length === 0 ? <div className="text-slate-500">Sin historial</div>
                      : <ul className="space-y-3">{historial.map((h, i) => (
                        <li key={i} className="border-b pb-2">
                          <div className="font-semibold">{h.fecha ? (new Date(h.fecha)).toLocaleDateString('es-MX') : ''}</div>
                          <div className="text-sm text-slate-700">{h.descripcion || h.detalle || JSON.stringify(h)}</div>
                        </li>
                      ))}</ul>}
                  </div>
                )
              )}
              {activeTab === "recetas" && (
                loadingRecetas ? <div className="py-8 text-center text-slate-500">Cargando recetas...</div>
                : errorRecetas ? <div className="py-8 text-center text-red-500">{errorRecetas}</div>
                : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recetas Previas</h3>
                    {recetas.length === 0 ? <div className="text-slate-500">Sin recetas previas</div>
                      : <ul className="space-y-3">{recetas.map((r, i) => (
                        <li key={i} className="border-b pb-2">
                          <div className="font-semibold">{r.fecha ? (new Date(r.fecha)).toLocaleDateString('es-MX') : ''}</div>
                          <div className="text-sm text-slate-700">{r.descripcion || r.medicamentos || JSON.stringify(r)}</div>
                        </li>
                      ))}</ul>}
                  </div>
                )
              )}
              {activeTab === "lab" && (
                loadingLab ? <div className="py-8 text-center text-slate-500">Cargando laboratorio...</div>
                : errorLab ? <div className="py-8 text-center text-red-500">{errorLab}</div>
                : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Estudios de Laboratorio</h3>
                    {lab.length === 0 ? <div className="text-slate-500">Sin estudios de laboratorio</div>
                      : <ul className="space-y-3">{lab.map((l, i) => (
                        <li key={i} className="border-b pb-2">
                          <div className="font-semibold">{l.fecha ? (new Date(l.fecha)).toLocaleDateString('es-MX') : ''}</div>
                          <div className="text-sm text-slate-700">{l.descripcion || l.resultado || JSON.stringify(l)}</div>
                        </li>
                      ))}</ul>}
                  </div>
                )
              )}
              {activeTab === "archivos" && renderArchivos()}
              {activeTab === "evolucion" && renderEvolucion()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Formularios auxiliares (simplificados)
function FormAntecedente({ pacienteId, token, onGuardado }: any) {
  const [tipo, setTipo] = useState("Personal_Patologico");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!descripcion) return;
    setGuardando(true);
    try {
      await fetch(`${API_URL}/historial-clinico/antecedentes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          tipoAntecedente: tipo,
          descripcion,
          estaActivo: true,
        }),
      });
      onGuardado();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
      <div className="grid gap-3">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Personal_Patologico">Personal Patológico</option>
          <option value="Personal_No_Patologico">Personal No Patológico</option>
          <option value="Familiar">Familiar</option>
          <option value="Quirurgico">Quirúrgico</option>
          <option value="Alergico">Alérgico</option>
          <option value="Ginecoobstetrico">Ginecoobstétrico</option>
        </select>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción del antecedente"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          rows={3}
        />
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function FormMedicamento({ pacienteId, token, onGuardado }: any) {
  const [nombre, setNombre] = useState("");
  const [dosis, setDosis] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nombre || !dosis || !frecuencia) return;
    setGuardando(true);
    try {
      await fetch(`${API_URL}/historial-clinico/medicamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          nombreMedicamento: nombre,
          dosis,
          frecuencia,
          fechaInicio: new Date().toISOString().split("T")[0],
          activo: true,
        }),
      });
      onGuardado();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
      <div className="grid gap-3">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del medicamento"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            placeholder="Dosis (ej: 500mg)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value)}
            placeholder="Frecuencia (ej: Cada 8 horas)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function FormArchivo({ pacienteId, token, onGuardado }: any) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Laboratorio");
  const [url, setUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nombre || !url) return;
    setGuardando(true);
    try {
      await fetch(`${API_URL}/archivos-paciente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          nombreArchivo: nombre,
          categoria,
          tipoArchivo: categoria,
          urlArchivo: url,
        }),
      });
      onGuardado();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50 p-4">
      <div className="grid gap-3">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del archivo"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Radiografia">Radiografía</option>
          <option value="Laboratorio">Laboratorio</option>
          <option value="Tomografia">Tomografía</option>
          <option value="Resonancia">Resonancia</option>
          <option value="Ultrasonido">Ultrasonido</option>
          <option value="Electrocardiograma">Electrocardiograma</option>
          <option value="Receta">Receta</option>
          <option value="Otro">Otro</option>
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL del archivo"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
