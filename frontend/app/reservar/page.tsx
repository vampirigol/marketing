"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { citasService } from "@/lib/citas.service";
import Link from "next/link";

type Sucursal = { id: string; nombre: string };

function generateSessionId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function ReservarPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalId, setSucursalId] = useState("");
  const [fecha, setFecha] = useState("");
  const [slots, setSlots] = useState<Array<{ hora: string; disponible: boolean }>>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [paso, setPaso] = useState<"sucursal-fecha" | "hora" | "datos" | "lista-espera" | "exito" | "exito-lista">("sucursal-fecha");
  const [horaElegida, setHoraElegida] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [reservandoSlot, setReservandoSlot] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    api.get("/sucursales/public").then((r) => {
      const list = (r.data as { sucursales?: Sucursal[] }).sucursales ?? [];
      setSucursales(list);
      if (list.length === 1) setSucursalId(list[0].id);
    }).catch(() => setSucursales([]));
  }, []);

  useEffect(() => {
    if (!sucursalId || !fecha) {
      setSlots([]);
      return;
    }
    setCargandoSlots(true);
    api.get(`/citas/publica/disponibilidad/${sucursalId}`, { params: { fecha } })
      .then((r) => {
        const s = (r.data as { slots?: Array<{ hora: string; disponible: boolean }> }).slots ?? [];
        setSlots(s);
        setCargandoSlots(false);
      })
      .catch(() => {
        setSlots([]);
        setCargandoSlots(false);
      });
  }, [sucursalId, fecha]);

  const slotsDisponibles = slots.filter((s) => s.disponible);
  const sinDisponibilidad = !cargandoSlots && fecha && sucursalId && slots.length > 0 && slotsDisponibles.length === 0;

  const enviarReserva = () => {
    setError("");
    if (!nombre.trim() || !telefono.trim()) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    setEnviando(true);
    const sid = sessionIdRef.current || sessionId || generateSessionId();
    citasService
      .crearCitaPublica({
        sucursalId,
        fechaCita: fecha,
        horaCita: horaElegida,
        nombreCompleto: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        notas: notas.trim() || undefined,
        sessionId: sid,
      })
      .then(() => setPaso("exito"))
      .catch((err: any) => {
        setError(err.response?.data?.message || "No se pudo agendar. Intente de nuevo.");
      })
      .finally(() => setEnviando(false));
  };

  const enviarListaEspera = () => {
    setError("");
    if (!nombre.trim() || !telefono.trim()) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    setEnviando(true);
    citasService
      .crearSolicitudListaEspera({
        nombreCompleto: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        sucursalId: sucursalId || undefined,
        notas: notas.trim() || undefined,
      })
      .then(() => setPaso("exito-lista"))
      .catch(() => setError("No se pudo registrar en la lista de espera."))
      .finally(() => setEnviando(false));
  };

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Reservar cita</h1>

        {paso === "sucursal-fecha" && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                >
                  <option value="">Seleccione sucursal</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  min={hoy}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>
            {cargandoSlots && <p className="text-slate-500 text-sm mt-2">Cargando horarios...</p>}
            {sinDisponibilidad && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-amber-800 text-sm">No hay horarios disponibles en esta fecha.</p>
                <button
                  type="button"
                  className="mt-2 text-sm text-amber-700 underline"
                  onClick={() => setPaso("lista-espera")}
                >
                  Registrarme en lista de espera
                </button>
              </div>
            )}
            {slotsDisponibles.length > 0 && (
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-slate-800 text-white py-2.5"
                onClick={() => {
                  sessionIdRef.current = generateSessionId();
                  setPaso("hora");
                }}
              >
                Elegir horario
              </button>
            )}
          </>
        )}

        {paso === "hora" && (
          <>
            <p className="text-slate-600 text-sm mb-2">Seleccione un horario para el {fecha}</p>
            <div className="flex flex-wrap gap-2">
              {slotsDisponibles.map((s) => (
                <button
                  key={s.hora}
                  type="button"
                  disabled={reservandoSlot}
                  className={`rounded-lg border px-3 py-2 text-sm ${horaElegida === s.hora ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300"}`}
                  onClick={async () => {
                    if (horaElegida === s.hora) return;
                    setReservandoSlot(true);
                    setError("");
                    const sid = sessionIdRef.current;
                    try {
                      await citasService.reservarSlot({
                        sucursalId,
                        fechaCita: fecha,
                        horaCita: s.hora,
                        sessionId: sid,
                      });
                      setHoraElegida(s.hora);
                    } catch {
                      setError("El horario ya no está disponible. Elija otro.");
                    } finally {
                      setReservandoSlot(false);
                    }
                  }}
                >
                  {s.hora}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2" onClick={() => setPaso("sucursal-fecha")}>
                Atrás
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-800 text-white px-4 py-2 disabled:opacity-50"
                disabled={!horaElegida}
                onClick={() => setPaso("datos")}
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {paso === "datos" && (
          <>
            <p className="text-slate-600 text-sm mb-4">Datos para la cita</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Teléfono *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              <input
                type="email"
                placeholder="Correo (opcional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <textarea
                placeholder="Notas (opcional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2" onClick={() => setPaso("hora")}>
                Atrás
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-800 text-white px-4 py-2 disabled:opacity-50"
                disabled={enviando}
                onClick={enviarReserva}
              >
                {enviando ? "Enviando..." : "Confirmar reserva"}
              </button>
            </div>
          </>
        )}

        {paso === "lista-espera" && (
          <>
            <p className="text-slate-600 text-sm mb-4">Registro en lista de espera (le avisaremos cuando haya lugar).</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Teléfono *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              <input
                type="email"
                placeholder="Correo (opcional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <textarea
                placeholder="Notas o preferencia de fechas (opcional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2" onClick={() => setPaso("sucursal-fecha")}>
                Atrás
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-800 text-white px-4 py-2 disabled:opacity-50"
                disabled={enviando}
                onClick={enviarListaEspera}
              >
                {enviando ? "Enviando..." : "Enviar a lista de espera"}
              </button>
            </div>
          </>
        )}

        {paso === "exito" && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">Reserva registrada.</p>
            <p className="text-slate-600 text-sm mt-1">Recibirá un enlace para confirmar la cita por mensaje.</p>
            <Link href="/" className="inline-block mt-4 rounded-lg bg-slate-800 text-white px-4 py-2">Volver al inicio</Link>
          </div>
        )}

        {paso === "exito-lista" && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">Registrado en la lista de espera.</p>
            <p className="text-slate-600 text-sm mt-1">Le contactaremos cuando haya disponibilidad.</p>
            <Link href="/" className="inline-block mt-4 rounded-lg bg-slate-800 text-white px-4 py-2">Volver al inicio</Link>
          </div>
        )}

        <p className="mt-6 text-center">
          <Link href="/" className="text-slate-500 text-sm underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
