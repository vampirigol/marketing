'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { CatalogoForm } from '@/components/citas/CatalogoForm';
import { DisponibilidadForm } from '@/components/citas/DisponibilidadForm';
import { DatosPacienteForm } from '@/components/citas/DatosPacienteForm';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { useToast } from '@/components/ui/Toast';
import { validarDisponibilidadDoctor } from '@/lib/horarios-data';

interface AgendarCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId?: string;
  pacienteNombre?: string;
}

type Paso = 'catalogo' | 'disponibilidad' | 'datosPaciente' | 'confirmacion';

interface DatosCatalogo {
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

export function AgendarCitaModal({
  isOpen,
  onClose,
  pacienteId,
  pacienteNombre
}: AgendarCitaModalProps) {
  const [paso, setPaso] = useState<Paso>('catalogo');
  const [datosCatalogo, setDatosCatalogo] = useState<DatosCatalogo | null>(null);
  const [datosDisponibilidad, setDatosDisponibilidad] = useState<DatosDisponibilidad | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { showError, showWarning, showSuccess: showSuccessToast } = useToast();

  if (!isOpen) return null;

  const handleCerrar = () => {
    setPaso('catalogo');
    setDatosCatalogo(null);
    setDatosDisponibilidad(null);
    setError(null);
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSuccessData(null);
    handleCerrar();
  };

  const handleCatalogoComplete = (data: DatosCatalogo) => {
    setDatosCatalogo(data);
    setPaso('disponibilidad');
  };

  const handleDisponibilidadComplete = (fecha: Date, hora: string) => {
    // Validar disponibilidad del doctor antes de continuar
    if (datosCatalogo?.doctorId) {
      const validacion = validarDisponibilidadDoctor(datosCatalogo.doctorId, fecha, hora);
      
      if (!validacion.disponible) {
        // Mostrar notificación de error
        showError('Horario no disponible', validacion.motivo || 'El doctor no está disponible en este horario');
        return;
      } else {
        // Mostrar notificación de éxito
        showSuccessToast('Horario disponible', '✅ Puedes continuar con el agendamiento');
      }
    }

    const datos = { fecha, hora };
    setDatosDisponibilidad(datos);
    // Si ya tenemos el pacienteId, saltamos el paso de datos del paciente
    if (pacienteId) {
      handleConfirmarCita(datos);
    } else {
      setPaso('datosPaciente');
    }
  };

  const handleDatosPacienteComplete = (data: DatosPaciente) => {
    handleConfirmarCita(datosDisponibilidad!, data);
  };

  const handleConfirmarCita = async (disponibilidad: DatosDisponibilidad, datosPac?: DatosPaciente) => {
    try {
      const citaData = {
        sucursalId: datosCatalogo!.sucursalId,
        especialidadId: datosCatalogo!.especialidadId,
        doctorId: datosCatalogo!.doctorId,
        servicioId: datosCatalogo!.servicioId,
        fecha: disponibilidad.fecha.toISOString().split('T')[0],
        hora: disponibilidad.hora,
        paciente: {
          id: pacienteId || 'nuevo',
          nombre: pacienteNombre || (datosPac ? `${datosPac.nombre} ${datosPac.apellidoPaterno} ${datosPac.apellidoMaterno || ''}` : ''),
          telefono: datosPac?.telefono || '',
          email: datosPac?.email || '',
        },
      };

      const response = await fetch('http://localhost:3001/api/catalogo/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al crear la cita');
      }

      const resultado = await response.json();
      
      // Preparar datos para el modal de éxito
      const dataSuccess = {
        pacienteNombre: resultado.cita.paciente.nombre,
        doctorNombre: datosCatalogo!.doctorNombre || 'No especificado',
        fecha: new Date(resultado.cita.fecha).toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        hora: resultado.cita.hora,
        sucursalNombre: datosCatalogo!.sucursalNombre || 'No especificada',
        servicioNombre: datosCatalogo!.servicioNombre
      };
      
      setSuccessData(dataSuccess);
      setShowSuccess(true);
      
      // Emitir evento para refrescar el calendario si existe
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('citaAgendada', { 
          detail: {
            ...resultado.cita,
            sucursalNombre: datosCatalogo!.sucursalNombre,
            doctorNombre: datosCatalogo!.doctorNombre,
            servicioNombre: datosCatalogo!.servicioNombre
          }
        }));
      }
      
    } catch (error) {
      console.error('Error al agendar cita:', error);
      setError((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCerrar}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {pacienteNombre ? `Agendar Cita - ${pacienteNombre}` : 'Agendar Nueva Cita'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {paso === 'catalogo' && 'Paso 1: Seleccionar servicio'}
                  {paso === 'disponibilidad' && 'Paso 2: Elegir fecha y hora'}
                  {paso === 'datosPaciente' && 'Paso 3: Datos del paciente'}
                </p>
              </div>
              <button
                onClick={handleCerrar}
                className="text-white hover:bg-white/10 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 flex gap-2">
              <div className={`h-2 flex-1 rounded-full ${paso === 'catalogo' || paso === 'disponibilidad' || paso === 'datosPaciente' ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`h-2 flex-1 rounded-full ${paso === 'disponibilidad' || paso === 'datosPaciente' ? 'bg-white' : 'bg-white/30'}`} />
              {!pacienteId && (
                <div className={`h-2 flex-1 rounded-full ${paso === 'datosPaciente' ? 'bg-white' : 'bg-white/30'}`} />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Error al agendar la cita</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {paso === 'catalogo' && (
              <CatalogoForm
                onNext={handleCatalogoComplete}
                onCancel={handleCerrar}
              />
            )}

            {paso === 'disponibilidad' && datosCatalogo && (
              <DisponibilidadForm
                sucursalId={datosCatalogo.sucursalId}
                doctorId={datosCatalogo.doctorId}
                onDateSelect={handleDisponibilidadComplete}
                onCancel={handleCerrar}
              />
            )}

            {paso === 'datosPaciente' && datosDisponibilidad && !pacienteId && (
              <DatosPacienteForm
                onNext={handleDatosPacienteComplete}
                onCancel={handleCerrar}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          isOpen={showSuccess}
          onClose={handleSuccessClose}
          data={successData}
        />
      )}
    </div>
  );
}
