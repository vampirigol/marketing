'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Phone, AlertCircle } from 'lucide-react';
import { CatalogoForm } from '@/components/citas/CatalogoForm';
import { DisponibilidadForm } from '@/components/citas/DisponibilidadForm';
import { DatosPacienteForm } from '@/components/citas/DatosPacienteForm';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { citasService, type CrearCitaPayload } from '@/lib/citas.service';
import { pacientesService } from '@/lib/pacientes.service';
import { contactosService } from '@/lib/contactos.service';
import { obtenerSucursales, obtenerSucursalesDesdeCatalogo } from '@/lib/sucursales.service';
import type { SucursalApi } from '@/lib/sucursales.service';

type TabId = 'agenda' | 'contactar';

type Paso = 'catalogo' | 'disponibilidad' | 'datosPaciente' | 'confirmacion';

interface DatosCatalogo {
  sucursalId: string;
  sucursalNombre?: string;
  sucursalCiudad?: string;
  sucursalEstado?: string;
  especialidadId: string;
  especialidadNombre?: string;
  doctorId: string;
  doctorNombre?: string;
  servicioId: string;
  servicioNombre?: string;
  precioServicio?: number;
  promocionAplicada?: boolean;
  precioPromocion?: number;
}

interface DatosDisponibilidad {
  fecha: Date;
  hora: string;
}

interface DatosPaciente {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono: string;
  email?: string;
  edad: number;
  noAfiliacion: string;
  religion?: string;
}

interface NuevaCitaCrmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitaCreada?: (cita: { id: string; pacienteId?: string }) => void;
}

export function NuevaCitaCrmModal({
  isOpen,
  onClose,
  onCitaCreada,
}: NuevaCitaCrmModalProps) {
  const [tab, setTab] = useState<TabId>('agenda');
  const [paso, setPaso] = useState<Paso>('catalogo');
  const [datosCatalogo, setDatosCatalogo] = useState<DatosCatalogo | null>(null);
  const [datosDisponibilidad, setDatosDisponibilidad] = useState<DatosDisponibilidad | null>(null);
  const [showSuccessCita, setShowSuccessCita] = useState(false);
  const [successCitaData, setSuccessCitaData] = useState<any>(null);
  const [showSuccessContactar, setShowSuccessContactar] = useState(false);
  const [sucursalContactarNombre, setSucursalContactarNombre] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sucursales para "Contactar a un Agente"
  const [sucursales, setSucursales] = useState<SucursalApi[]>([]);
  const [sucursalId, setSucursalId] = useState('');
  const [nombreContactar, setNombreContactar] = useState('');
  const [telefonoContactar, setTelefonoContactar] = useState('');
  const [emailContactar, setEmailContactar] = useState('');
  const [enviandoContactar, setEnviandoContactar] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const cargar = async () => {
      try {
        const list = await obtenerSucursales(true).catch(() => obtenerSucursalesDesdeCatalogo());
        setSucursales(list);
      } catch {
        setSucursales([]);
      }
    };
    cargar();
  }, [isOpen]);

  const handleCerrar = () => {
    setTab('agenda');
    setPaso('catalogo');
    setDatosCatalogo(null);
    setDatosDisponibilidad(null);
    setShowSuccessCita(false);
    setSuccessCitaData(null);
    setShowSuccessContactar(false);
    setSucursalContactarNombre('');
    setError(null);
    setSucursalId('');
    setNombreContactar('');
    setTelefonoContactar('');
    setEmailContactar('');
    onClose();
  };

  const handleSuccessCitaClose = () => {
    setShowSuccessCita(false);
    setSuccessCitaData(null);
    handleCerrar();
  };

  const handleCatalogoComplete = (data: DatosCatalogo) => {
    setDatosCatalogo(data);
    setPaso('disponibilidad');
  };

  const handleDisponibilidadComplete = (fecha: Date, hora: string) => {
    setDatosDisponibilidad({ fecha, hora });
    setPaso('datosPaciente');
  };

  const handleDatosPacienteComplete = (data: DatosPaciente) => {
    confirmarCita(datosDisponibilidad!, data);
  };

  const confirmarCita = async (disponibilidad: DatosDisponibilidad, datosPac: DatosPaciente) => {
    try {
      setError(null);
      const nombreCompleto = `${datosPac.nombre} ${datosPac.apellidoPaterno} ${datosPac.apellidoMaterno || ''}`.trim();
      const paciente = await pacientesService.crear({
        nombreCompleto,
        telefono: datosPac.telefono,
        whatsapp: datosPac.telefono,
        email: datosPac.email || '',
        fechaNacimiento: new Date(
          new Date().getFullYear() - (datosPac.edad || 18),
          0,
          1
        ).toISOString().split('T')[0],
        edad: datosPac.edad || 18,
        sexo: 'Otro',
        noAfiliacion: datosPac.noAfiliacion || `RCA-${Date.now()}`,
        tipoAfiliacion: 'Particular',
        ciudad: datosCatalogo?.sucursalCiudad || 'Guadalajara',
        estado: datosCatalogo?.sucursalEstado || 'Jalisco',
        origenLead: 'Presencial',
      });

      const payload: CrearCitaPayload = {
        pacienteId: paciente.id,
        sucursalId: datosCatalogo!.sucursalId,
        fechaCita: disponibilidad.fecha,
        horaCita: disponibilidad.hora,
        tipoConsulta: 'Primera_Vez',
        especialidad: datosCatalogo!.especialidadNombre || 'Medicina General',
        medicoAsignado: datosCatalogo!.doctorNombre,
        esPromocion: Boolean(datosCatalogo!.promocionAplicada),
        codigoPromocion: datosCatalogo!.promocionAplicada ? 'PRIMERA_VEZ_2026' : undefined,
        creadoPor: 'crm',
        notas: datosCatalogo?.promocionAplicada ? 'Promoción aplicada' : undefined,
      };

      const cita = await citasService.crear(payload);
      onCitaCreada?.({ id: cita.id, pacienteId: cita.pacienteId });

      setSuccessCitaData({
        pacienteNombre: nombreCompleto,
        doctorNombre: datosCatalogo!.doctorNombre || 'No especificado',
        fecha: new Date(cita.fechaCita).toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        hora: cita.horaCita,
        sucursalNombre: datosCatalogo!.sucursalNombre || 'No especificada',
        servicioNombre: datosCatalogo!.servicioNombre,
      });
      setShowSuccessCita(true);

      if (typeof window !== 'undefined') {
        const detail = {
          ...cita,
          sucursalNombre: datosCatalogo!.sucursalNombre,
          doctorNombre: datosCatalogo!.doctorNombre,
          servicioNombre: datosCatalogo!.servicioNombre,
        };
        window.dispatchEvent(new CustomEvent('citaAgendada', { detail }));
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            new BroadcastChannel('crm_citas').postMessage({ type: 'citaAgendada', detail });
          }
        } catch { /* BroadcastChannel no soportado */ }
      }
    } catch (err) {
      console.error('Error al agendar cita:', err);
      setError((err as Error).message);
    }
  };

  const handleContactarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sucursalId || !nombreContactar.trim() || !telefonoContactar.trim()) {
      setError('Completa sucursal, nombre y teléfono.');
      return;
    }
    const suc = sucursales.find((s) => s.id === sucursalId);
    setEnviandoContactar(true);
    try {
      const res = await contactosService.crear({
        nombreCompleto: nombreContactar.trim(),
        telefono: telefonoContactar.trim(),
        email: emailContactar.trim() || undefined,
        whatsapp: telefonoContactar.trim(),
        sucursalId,
        sucursalNombre: suc ? `${suc.nombre} - ${suc.ciudad}` : sucursalId,
        motivo: 'Consulta_General',
        preferenciaContacto: 'Telefono',
        origen: 'CRM',
      });
      if (res.success) {
        setSucursalContactarNombre(suc ? suc.nombre : '');
        setShowSuccessContactar(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviandoContactar(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleCerrar}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Nueva Cita / Contactar Agente</h2>
                <p className="text-blue-100 mt-1">
                  {tab === 'agenda' && (
                    <>
                      {paso === 'catalogo' && 'Paso 1: Sucursal, especialidad/doctor y servicio'}
                      {paso === 'disponibilidad' && 'Paso 2: Fecha y hora (disponibilidad abierta, pueden haber n citas empalmadas)'}
                      {paso === 'datosPaciente' && 'Paso 3: Datos del paciente'}
                    </>
                  )}
                  {tab === 'contactar' && 'Escoge sucursal y datos. En breve se comunicará un asesor contigo.'}
                </p>
              </div>
              <button
                onClick={handleCerrar}
                className="text-white hover:bg-white/10 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab('agenda');
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'agenda' ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Agenda Cita
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('contactar');
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === 'contactar' ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Contactar a un Agente
              </button>
            </div>

            {tab === 'agenda' && (
              <div className="mt-4 flex gap-2">
                <div className={`h-2 flex-1 rounded-full ${paso !== 'catalogo' ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`h-2 flex-1 rounded-full ${paso === 'datosPaciente' ? 'bg-white' : paso === 'disponibilidad' ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`h-2 flex-1 rounded-full ${paso === 'datosPaciente' ? 'bg-white' : 'bg-white/30'}`} />
              </div>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {tab === 'agenda' && (
              <>
                {paso === 'catalogo' && (
                  <CatalogoForm onNext={handleCatalogoComplete} onCancel={handleCerrar} />
                )}
                {paso === 'disponibilidad' && datosCatalogo && (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      Visualización de disponibilidad abierta; pueden existir varias citas en el mismo horario (empalmadas).
                    </div>
                    <DisponibilidadForm
                      sucursalId={datosCatalogo.sucursalId}
                      doctorId={datosCatalogo.doctorId}
                      doctorNombre={datosCatalogo.doctorNombre}
                      onDateSelect={handleDisponibilidadComplete}
                      onCancel={handleCerrar}
                    />
                  </>
                )}
                {paso === 'datosPaciente' && datosDisponibilidad && (
                  <DatosPacienteForm
                    onNext={handleDatosPacienteComplete}
                    onCancel={handleCerrar}
                    requerirApellidoMaterno
                    requerirEmail
                  />
                )}
              </>
            )}

            {tab === 'contactar' && (
              <>
                {!showSuccessContactar ? (
                  <div className="max-w-2xl mx-auto">
                    <p className="text-gray-600 mb-6">
                      Escoge la sucursal y tus datos. Un asesor de esa sucursal se comunicará contigo en breve.
                    </p>
                    <form onSubmit={handleContactarSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sucursal <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={sucursalId}
                          onChange={(e) => setSucursalId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Selecciona sucursal</option>
                          {sucursales.map((s, i) => (
                            <option key={s.id} value={s.id}>
                              {i + 1}. {s.nombre} — {s.ciudad}, {s.estado}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre <span className="text-red-600">*</span>
                        </label>
                        <Input
                          type="text"
                          value={nombreContactar}
                          onChange={(e) => setNombreContactar(e.target.value)}
                          placeholder="Nombre completo"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono <span className="text-red-600">*</span>
                        </label>
                        <Input
                          type="tel"
                          value={telefonoContactar}
                          onChange={(e) => setTelefonoContactar(e.target.value)}
                          placeholder="5551234567"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Correo electrónico
                        </label>
                        <Input
                          type="email"
                          value={emailContactar}
                          onChange={(e) => setEmailContactar(e.target.value)}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" type="button" onClick={handleCerrar}>
                          Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={enviandoContactar}>
                          {enviandoContactar ? 'Enviando...' : 'Solicitar que me contacten'}
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto text-center py-8">
                    <div className="inline-flex w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                      <Phone className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Solicitud enviada</h3>
                    <p className="text-gray-700 mb-6">
                      En breve se comunicará un asesor contigo (de esa sucursal).
                    </p>
                    {sucursalContactarNombre && (
                      <p className="text-sm text-gray-500">Sucursal: {sucursalContactarNombre}</p>
                    )}
                    <Button variant="primary" className="mt-6" onClick={handleCerrar}>
                      Cerrar
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {successCitaData && (
        <SuccessModal
          isOpen={showSuccessCita}
          onClose={handleSuccessCitaClose}
          title="Cita agendada"
          mensajeAdicional="Se ha enviado un mensaje o correo de confirmación."
          data={successCitaData}
        />
      )}
    </div>
  );
}
