'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lead } from '@/types/matrix';
import { convertirLeadAPaciente } from '@/lib/conversion.service';
import { X, Loader2, CheckCircle2, AlertCircle, Calendar, Clock, User, Phone, Mail, RefreshCw } from 'lucide-react';
import {
  SUCURSALES,
  getServiciosPorSucursal,
  getDoctoresPorSucursal,
  getEspecialidadesPorSucursal,
} from '@/lib/doctores-data';
import { RELIGIONES } from '@/lib/religiones';
import { pacientesService } from '@/lib/pacientes.service';
import { citasService } from '@/lib/citas.service';
import { obtenerSucursales } from '@/lib/sucursales.service';
import type { SucursalApi } from '@/lib/sucursales.service';

interface ConversionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pacienteId: string) => void;
}

interface ConversionResponse {
  paciente: {
    id: string;
    nombreCompleto: string;
    whatsapp: string;
  };
  cita: {
    especialidad: string;
    horaCita: string;
  };
  whatsappEnviado: boolean;
  tiempoTotal: number;
}

type Step = 'form' | 'loading' | 'success' | 'error';

// Helper: obtener valor de customFields o string vacío
function cf(lead: Lead, key: string): string {
  const v = lead.customFields?.[key];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

export function ConversionModal({ lead, isOpen, onClose, onSuccess }: ConversionModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConversionResponse | null>(null);
  const [tiempoTotal, setTiempoTotal] = useState(0);

  // --- AGENDA CITA ---
  const [sucursal, setSucursal] = useState<string>(() => cf(lead, 'Sucursal') || SUCURSALES[0] || '');
  const especialidadesSucursal = useMemo(() => getEspecialidadesPorSucursal(sucursal), [sucursal]);
  const doctoresSucursal = useMemo(() => getDoctoresPorSucursal(sucursal), [sucursal]);
  const [especialidad, setEspecialidad] = useState<string>(() => cf(lead, 'Especialidad') || especialidadesSucursal[0] || '');
  const serviciosDisponibles = useMemo(() => {
    const base = getServiciosPorSucursal(sucursal);
    const conPromo = base.flatMap((s) => [s, `Promoción: ${s}`]);
    return Array.from(new Set(conPromo));
  }, [sucursal]);
  const servicioInicial = cf(lead, 'Servicio') && serviciosDisponibles.includes(cf(lead, 'Servicio'))
    ? cf(lead, 'Servicio')
    : serviciosDisponibles[0];
  const [servicio, setServicio] = useState(servicioInicial);
  const [tipoConsulta, setTipoConsulta] = useState(cf(lead, 'TipoConsulta') || 'Consulta Inicial');
  const [fechaCita, setFechaCita] = useState(() => {
    const f = cf(lead, 'FechaCita');
    if (f) return f;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [horaCita, setHoraCita] = useState(() => cf(lead, 'HoraCita') || '09:00');

  // Datos paciente (nombre puede venir como "Nombre Apellido" en lead.nombre)
  const [nombre, setNombre] = useState(() => lead.nombre?.trim() || '');
  const [apellidoPaterno, setApellidoPaterno] = useState(() => cf(lead, 'ApellidoPaterno'));
  const [apellidoMaterno, setApellidoMaterno] = useState(() => cf(lead, 'ApellidoMaterno'));
  const [telefono, setTelefono] = useState(() => lead.telefono?.trim() || '');
  const [email, setEmail] = useState(() => lead.email?.trim() || '');
  const [edad, setEdad] = useState(() => cf(lead, 'Edad') || '');
  const [religion, setReligion] = useState(() => cf(lead, 'Religion'));
  const [noAfiliacion, setNoAfiliacion] = useState(() => cf(lead, 'NoAfiliacion'));

  // CONTACTAR A UN AGENTE
  const [sucursalContactar, setSucursalContactar] = useState(SUCURSALES[0] || '');
  const [solicitarAgente, setSolicitarAgente] = useState(false);

  // Sucursales desde API (para disponibilidad por sucursalId)
  const [sucursalesApi, setSucursalesApi] = useState<SucursalApi[]>([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>('');
  const [slots, setSlots] = useState<Array<{ hora: string; disponible: boolean }>>([]);
  const [slotsCargando, setSlotsCargando] = useState(false);
  const [agendaDoctor, setAgendaDoctor] = useState<Array<{ fecha: string; horas: string[] }>>([]);

  const sucursalIdParaApi = useMemo(
    () => sucursalesApi.find((s) => s.nombre === sucursal)?.id ?? null,
    [sucursalesApi, sucursal]
  );

  const doctoresFiltrados = useMemo(() => {
    const porSucursal = getDoctoresPorSucursal(sucursal);
    return especialidad
      ? porSucursal.filter((d) => d.especialidad === especialidad)
      : porSucursal;
  }, [sucursal, especialidad]);

  useEffect(() => {
    const lista = getEspecialidadesPorSucursal(sucursal);
    const primera = lista[0];
    if (primera) setEspecialidad(primera);
    setDoctorSeleccionado('');
  }, [sucursal]);

  useEffect(() => {
    if (!doctoresFiltrados.length) return;
    if (!doctorSeleccionado && doctoresFiltrados[0])
      setDoctorSeleccionado(doctoresFiltrados[0].nombre);
  }, [doctoresFiltrados, doctorSeleccionado]);

  // Cargar sucursales API y siguiente no. afiliación al abrir
  useEffect(() => {
    if (!isOpen || step !== 'form') return;
    let cancelled = false;
    (async () => {
      try {
        const list = await obtenerSucursales(true);
        if (!cancelled) setSucursalesApi(list || []);
      } catch {
        if (!cancelled) setSucursalesApi([]);
      }
    })();
    (async () => {
      try {
        const next = await pacientesService.obtenerSiguienteNoAfiliacion();
        if (!cancelled && next) setNoAfiliacion(next);
      } catch {
        if (!cancelled) setNoAfiliacion(`RCA-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, step]);

  // Cargar slots disponibles cuando hay sucursalId, doctor y fecha (fecha y hora = de la cita para la consulta)
  // maxEmpalmes: 1 = un slot con al menos 1 cita del doctor se marca no disponible (no empalmes por doctor)
  useEffect(() => {
    if (!sucursalIdParaApi || !doctorSeleccionado || !fechaCita) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsCargando(true);
    citasService
      .obtenerDisponibilidad({
        sucursalId: sucursalIdParaApi,
        fecha: fechaCita,
        doctorNombre: doctorSeleccionado,
        maxEmpalmes: 1,
      })
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsCargando(false);
      });
    return () => { cancelled = true; };
  }, [sucursalIdParaApi, doctorSeleccionado, fechaCita]);

  // Cargar días (y horas) en que el doctor ya tiene citas — para mostrar "qué días tiene ocupados"
  useEffect(() => {
    if (!doctorSeleccionado) {
      setAgendaDoctor([]);
      return;
    }
    let cancelled = false;
    const hoy = new Date();
    const fin = new Date(hoy);
    fin.setDate(fin.getDate() + 31);
    const fechaInicio = hoy.toISOString().slice(0, 10);
    const fechaFin = fin.toISOString().slice(0, 10);
    citasService
      .obtenerCitasPorDoctorYRango({ medico: doctorSeleccionado, fechaInicio, fechaFin })
      .then((citas) => {
        if (cancelled) return;
        const porDia = new Map<string, string[]>();
        citas.forEach((c) => {
          if (!c.fecha || !c.horaCita) return;
          const list = porDia.get(c.fecha) || [];
          if (!list.includes(c.horaCita)) list.push(c.horaCita);
          list.sort();
          porDia.set(c.fecha, list);
        });
        setAgendaDoctor(
          Array.from(porDia.entries()).map(([fecha, horas]) => ({ fecha, horas })).sort((a, b) => a.fecha.localeCompare(b.fecha))
        );
      })
      .catch(() => {
        if (!cancelled) setAgendaDoctor([]);
      });
    return () => { cancelled = true; };
  }, [doctorSeleccionado]);

  // Si la hora seleccionada no está disponible en los slots actuales, elegir la primera disponible
  useEffect(() => {
    if (slots.length === 0) return;
    const disponibles = slots.filter((s) => s.disponible);
    const sigueDisponible = disponibles.some((s) => s.hora === horaCita);
    if (!sigueDisponible && disponibles[0]) setHoraCita(disponibles[0].hora);
  }, [slots]);

  const handleConvertir = async () => {
    setStep('loading');
    setError(null);
    const nombreCompleto = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ') || lead.nombre;

    try {
      const leadConDatos = {
        ...lead,
        nombre: nombreCompleto,
        telefono: telefono || lead.telefono,
        email: email || lead.email,
        customFields: {
          ...lead.customFields,
          Sucursal: sucursal,
          Especialidad: especialidad,
          Servicio: servicio,
          FechaCita: fechaCita,
          HoraCita: horaCita,
          ApellidoPaterno: apellidoPaterno,
          ApellidoMaterno: apellidoMaterno,
          Edad: edad,
          Religion: religion,
          NoAfiliacion: noAfiliacion,
          TipoConsulta: tipoConsulta,
        },
      };

      if (!sucursalIdParaApi) {
        setError('Selecciona una sucursal válida (debe existir en el sistema) para poder convertir.');
        setStep('form');
        return;
      }
      const response = await convertirLeadAPaciente(leadConDatos, {
        leadId: lead.id,
        sucursalId: sucursalIdParaApi,
        sucursalNombre: sucursal,
        medicoAsignado: doctorSeleccionado,
        fechaCita: fechaCita,
        horaCita,
        especialidad: servicio.replace(/^Promoción: /, ''),
        tipoConsulta,
        esPromocion: servicio.startsWith('Promoción:'),
      });

      setResultado(response);
      setTiempoTotal(response.tiempoTotal);
      setStep('success');
      setTimeout(() => {
        onSuccess?.(response.paciente.id);
        onClose();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en la conversión';
      setError(message);
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10 rounded-t-xl">
          <div>
            <h2 className="text-white font-bold text-lg">🔄 Convertir a Paciente</h2>
            <p className="text-blue-100 text-sm">Lead: {lead.nombre}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 p-2 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {step === 'form' && (
            <div className="space-y-6">
              {/* ——— AGENDA CITA ——— */}
              <section className="border border-gray-200 rounded-lg p-4 bg-slate-50/50">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  AGENDA CITA
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Selecciona sucursal</label>
                    <select
                      value={sucursal}
                      onChange={(e) => setSucursal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {SUCURSALES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Especialidad</label>
                    <select
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {especialidadesSucursal.map((esp) => (
                        <option key={esp} value={esp}>{esp}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor / Especialista</label>
                    <select
                      value={doctorSeleccionado}
                      onChange={(e) => setDoctorSeleccionado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {doctoresFiltrados.map((d) => (
                        <option key={d.id} value={d.nombre}>{d.nombre} — {d.especialidad}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-500 mt-0.5">La disponibilidad depende de la sucursal y el doctor.</p>
                    {agendaDoctor.length > 0 && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 border border-slate-200">
                        <p className="text-[10px] font-semibold text-slate-700 mb-1">Días en que este doctor ya tiene citas (esos horarios aparecerán como no disponibles):</p>
                        <ul className="text-[10px] text-slate-600 space-y-0.5 max-h-20 overflow-y-auto">
                          {agendaDoctor.slice(0, 10).map(({ fecha, horas }) => (
                            <li key={fecha}>
                              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {horas.join(', ')}
                            </li>
                          ))}
                          {agendaDoctor.length > 10 && (
                            <li className="text-slate-500">… y {agendaDoctor.length - 10} días más.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Servicio (con promociones)</label>
                    <select
                      value={servicio}
                      onChange={(e) => setServicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {serviciosDisponibles.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de consulta</label>
                    <select
                      value={tipoConsulta}
                      onChange={(e) => setTipoConsulta(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Consulta Inicial</option>
                      <option>Seguimiento</option>
                      <option>Control</option>
                      <option>Revisión</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de la cita para la consulta</label>
                    <input
                      type="date"
                      value={fechaCita}
                      onChange={(e) => setFechaCita(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hora de la cita — solo horarios disponibles del doctor</label>
                    {!sucursalIdParaApi ? (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">Selecciona una sucursal que exista en el sistema para ver disponibilidad.</p>
                    ) : slotsCargando ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando horarios disponibles...
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">Selecciona sucursal, doctor y fecha para ver horarios.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                          {slots.map((slot) => (
                            <button
                              key={slot.hora}
                              type="button"
                              onClick={() => slot.disponible && setHoraCita(slot.hora)}
                              disabled={!slot.disponible}
                              className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                                slot.disponible
                                  ? horaCita === slot.hora
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.hora}
                              {!slot.disponible && (
                                <span className="block text-[10px] text-gray-400">No disp.</span>
                              )}
                            </button>
                          ))}
                        </div>
                        {slots.some((s) => !s.disponible) && (
                          <p className="text-[10px] text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded">
                            Horarios ya ocupados por el doctor en este día (no seleccionables):{' '}
                            {slots.filter((s) => !s.disponible).map((s) => s.hora).join(', ')}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">Solo se muestran horarios en que el doctor tiene disponibilidad. Los que ya tienen cita aparecen como &quot;No disp.&quot; y no se pueden seleccionar.</p>
                  </div>
                </div>

                {/* Datos Paciente / No. Afiliación */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Datos Paciente / No. Afiliación
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">NOMBRE</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre(s)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">A. PATERNO</label>
                      <input
                        type="text"
                        value={apellidoPaterno}
                        onChange={(e) => setApellidoPaterno(e.target.value)}
                        placeholder="Apellido paterno"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">A. MATERNO *</label>
                      <input
                        type="text"
                        value={apellidoMaterno}
                        onChange={(e) => setApellidoMaterno(e.target.value)}
                        placeholder="Apellido materno"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Teléfono</label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Teléfono"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Correo electrónico *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Edad</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={edad}
                        onChange={(e) => setEdad(e.target.value)}
                        placeholder="Edad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Religión</label>
                      <select
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccione religión</option>
                        {RELIGIONES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">No. Afiliación (auto-generado, sin duplicados)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noAfiliacion}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const next = await pacientesService.obtenerSiguienteNoAfiliacion();
                              setNoAfiliacion(next);
                            } catch {
                              setNoAfiliacion(`RCA-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);
                            }
                          }}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
                          title="Generar nuevo número"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-3 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  FIN — Llega mensaje o correo de confirmación al agendar.
                </p>
              </section>

              {/* ——— CONTACTAR A UN AGENTE ——— */}
              <section className="border border-gray-200 rounded-lg p-4 bg-amber-50/50">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-600" />
                  CONTACTAR A UN AGENTE
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Escoger sucursal</label>
                  <select
                    value={sucursalContactar}
                    onChange={(e) => setSucursalContactar(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {SUCURSALES.map((s, i) => (
                      <option key={s} value={s}>
                        {i + 1}. {s}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-amber-800 mt-2 italic">
                  En breve se comunicará un asesor contigo (de esa sucursal).
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={solicitarAgente}
                    onChange={(e) => setSolicitarAgente(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-700">Solicitar que un agente me contacte</span>
                </label>
              </section>

              {/* Beneficios automáticos */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">✨ Beneficios automáticos al convertir:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✅ Crear perfil de paciente</li>
                  <li>✅ Agendar cita automática</li>
                  <li>✅ Enviar confirmación WhatsApp</li>
                  <li>✅ Generar recepción</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConvertir}
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Convertir Ahora
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-700 font-semibold">Convirtiendo lead...</p>
              <p className="text-gray-500 text-sm mt-2">Creando paciente, cita y enviando confirmación</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-1/3 animate-pulse" />
              </div>
            </div>
          )}

          {step === 'success' && resultado && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-gray-700 font-bold text-lg">¡Conversión exitosa!</p>
              <p className="text-gray-500 text-sm mt-2">Completado en {tiempoTotal}ms</p>
              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-green-900 font-semibold">👤 Paciente</p>
                  <p className="text-green-700">{resultado.paciente.nombreCompleto}</p>
                  <p className="text-green-600 text-xs">ID: {resultado.paciente.id}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-blue-900 font-semibold">📅 Cita creada</p>
                  <p className="text-blue-700">{resultado.cita.especialidad}</p>
                  <p className="text-blue-600 text-xs">Hora: {resultado.cita.horaCita}</p>
                </div>
                <div className={`p-3 rounded ${resultado.whatsappEnviado ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <p className={resultado.whatsappEnviado ? 'text-green-900 font-semibold' : 'text-yellow-900 font-semibold'}>
                    {resultado.whatsappEnviado ? '✅ WhatsApp enviado' : '⏳ WhatsApp pendiente'}
                  </p>
                  <p className={resultado.whatsappEnviado ? 'text-green-700' : 'text-yellow-700'}>
                    {resultado.paciente.whatsapp}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-4">Cerrando en 3 segundos...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-gray-700 font-bold text-lg">Error en conversión</p>
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
              <button
                onClick={() => { setStep('form'); setError(null); }}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
