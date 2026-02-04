'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Users,
  Stethoscope,
  Package,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CatalogoFormProps {
  onNext: (data: {
    sucursalId: string;
    sucursalNombre?: string;
    especialidadId: string;
    especialidadNombre?: string;
    doctorId: string;
    doctorNombre?: string;
    servicioId: string;
    servicioNombre?: string;
    precioServicio?: number;
    promocionAplicada?: boolean;
    precioPromocion?: number;
  }) => void;
  onCancel: () => void;
}

interface Catalogo {
  sucursales: Array<{
    id: string;
    nombre: string;
    ciudad: string;
    estado: string;
  }>;
  especialidades: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
  }>;
  doctores: Array<{
    id: string;
    nombre: string;
    especialidadId: string;
    sucursalId: string;
    horario: { inicio: string; fin: string; intervaloMin: number };
    capacidadEmpalmes: number;
  }>;
  servicios: Array<{
    id: string;
    nombre: string;
    especialidadId: string;
    doctorId?: string;
    precioBase: number;
    duracionMinutos: number;
    promocionActiva?: boolean;
    codigoPromocion?: string;
    precioPromocion?: number;
  }>;
  promociones: Array<{
    id: string;
    codigo: string;
    nombre: string;
    descuentoPorcentaje?: number;
  }>;
}

export function CatalogoForm({ onNext, onCancel }: CatalogoFormProps) {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selecciones del usuario
  const [sucursalId, setSucursalId] = useState('');
  const [especialidadId, setEspecialidadId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [sinHorario, setSinHorario] = useState(false);

  // Cargar catálogo
  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        // Construir URL con filtro de sucursal si está seleccionada
        const url = sucursalId 
          ? `http://localhost:3001/api/catalogo?sucursalId=${sucursalId}`
          : 'http://localhost:3001/api/catalogo';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error cargando catálogo');
        const data = await response.json();
        setCatalogo(data.catalogo);
        
        // Resetear selecciones dependientes al cambiar de sucursal
        if (sucursalId) {
          setEspecialidadId('');
          setDoctorId('');
          setServicioId('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogo();
  }, [sucursalId]);

  const sucursalSeleccionada = catalogo?.sucursales.find((s) => s.id === sucursalId);
  const especialidadSeleccionada = catalogo?.especialidades.find((e) => e.id === especialidadId);
  const doctoresDisponibles = catalogo?.doctores.filter(
    (d) => d.sucursalId === sucursalId && d.especialidadId === especialidadId
  );
  const doctorSeleccionado = catalogo?.doctores.find((d) => d.id === doctorId);
  const serviciosDisponibles = catalogo?.servicios.filter(
    (s) => s.especialidadId === especialidadId && (!s.doctorId || s.doctorId === doctorId)
  );
  const servicioSeleccionado = catalogo?.servicios.find((s) => s.id === servicioId);

  const puedeAvanzar = sucursalId && especialidadId && doctorId && servicioId && !cargando;

  const handleNext = () => {
    if (!puedeAvanzar) return;

    onNext({
      sucursalId,
      sucursalNombre: sucursalSeleccionada?.nombre,
      especialidadId,
      especialidadNombre: especialidadSeleccionada?.nombre,
      doctorId,
      doctorNombre: doctorSeleccionado?.nombre,
      servicioId,
      servicioNombre: servicioSeleccionado?.nombre,
      precioServicio: servicioSeleccionado?.precioPromocion || servicioSeleccionado?.precioBase,
      promocionAplicada: servicioSeleccionado?.promocionActiva,
      precioPromocion: servicioSeleccionado?.precioPromocion,
    });
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando catálogo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendar Cita</h2>
      <p className="text-gray-600 mb-8">Selecciona sucursal, especialidad, doctor y servicio</p>

      <div className="space-y-6">
        {/* 1. Sucursal */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            Sucursal
            {sucursalId && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {catalogo?.sucursales.map((suc) => (
              <button
                key={suc.id}
                onClick={() => setSucursalId(suc.id)}
                className={`text-left px-4 py-3 rounded-lg border-2 transition ${
                  sucursalId === suc.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold">{suc.nombre}</p>
                <p className="text-sm text-gray-600">
                  {suc.ciudad}, {suc.estado}
                </p>
              </button>
            ))}
          </div>
        </div>

        {sucursalId && (
          <>
            {/* 2. Especialidad */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Especialidad
                {especialidadId && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {catalogo?.especialidades.map((esp) => (
                  <button
                    key={esp.id}
                    onClick={() => {
                      setEspecialidadId(esp.id);
                      setDoctorId('');
                      setServicioId('');
                    }}
                    className={`text-left px-4 py-3 rounded-lg border-2 transition ${
                      especialidadId === esp.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">{esp.nombre}</p>
                    {esp.descripcion && (
                      <p className="text-xs text-gray-600">{esp.descripcion}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {especialidadId && doctoresDisponibles && doctoresDisponibles.length > 0 && (
              <>
                {/* 3. Doctor */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    Doctor/Especialista
                    {doctorId && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {doctoresDisponibles.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setDoctorId(doc.id);
                          setServicioId('');
                        }}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition ${
                          doctorId === doc.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold">{doc.nombre}</p>
                        <p className="text-xs text-gray-600">
                          {doc.horario.inicio} - {doc.horario.fin}
                          {' ('}
                          {doc.capacidadEmpalmes} citas simultaneas
                          {')'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {doctorId && serviciosDisponibles && serviciosDisponibles.length > 0 && (
                  <>
                    {/* 4. Servicio */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Package className="w-4 h-4 text-blue-600" />
                        Servicio
                        {servicioId && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {serviciosDisponibles.map((srv) => (
                          <button
                            key={srv.id}
                            onClick={() => setServicioId(srv.id)}
                            className={`text-left px-4 py-3 rounded-lg border-2 transition ${
                              servicioId === srv.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">{srv.nombre}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {srv.duracionMinutos} min
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {srv.promocionActiva ? (
                                  <div className="flex flex-col items-end gap-1">
                                    <p className="text-sm line-through text-gray-400">
                                      ${srv.precioBase}
                                    </p>
                                    <p className="text-lg font-bold text-green-600">
                                      ${srv.precioPromocion}
                                    </p>
                                    <p className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                      🎁 Promoción
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-lg font-bold text-gray-900">
                                    ${srv.precioBase}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opción: Sin horario */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sinHorario}
                          onChange={(e) => setSinHorario(e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <div>
                          <p className="text-sm font-semibold text-orange-900">
                            Cita Subsecuente sin Horario
                          </p>
                          <p className="text-xs text-orange-700">
                            Paciente entra cuando quiera (sin horario fijo)
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Resumen */}
                    {servicioSeleccionado && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Resumen</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sucursal:</span>
                            <span className="font-semibold">{sucursalSeleccionada?.nombre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Especialidad:</span>
                            <span className="font-semibold">{especialidadSeleccionada?.nombre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Doctor:</span>
                            <span className="font-semibold">{doctorSeleccionado?.nombre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Servicio:</span>
                            <span className="font-semibold">{servicioSeleccionado.nombre}</span>
                          </div>
                          {sinHorario && (
                            <div className="flex justify-between text-orange-700">
                              <span className="text-gray-600">Tipo:</span>
                              <span className="font-semibold">Sin Horario</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-blue-200 flex justify-between">
                            <span className="text-gray-600 font-semibold">Precio:</span>
                            <div className="text-right">
                              {servicioSeleccionado.promocionActiva ? (
                                <div>
                                  <p className="line-through text-gray-400 text-xs">
                                    ${servicioSeleccionado.precioBase}
                                  </p>
                                  <p className="text-lg font-bold text-green-600">
                                    ${servicioSeleccionado.precioPromocion}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-lg font-bold text-gray-900">
                                  ${servicioSeleccionado.precioBase}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="ghost" onClick={onCancel}>
                        Cancelar
                      </Button>
                      <Button variant="primary" onClick={handleNext} disabled={!puedeAvanzar}>
                        Continuar
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
