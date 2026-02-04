'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DisponibilidadFormProps {
  sucursalId: string;
  doctorId: string;
  onDateSelect: (fecha: Date, hora: string) => void;
  onCancel: () => void;
}

interface Slot {
  hora: string;
  disponible: boolean;
  cupoDisponible: number;
  capacidad: number;
}

export function DisponibilidadForm({
  sucursalId,
  doctorId,
  onDateSelect,
  onCancel,
}: DisponibilidadFormProps) {
  const [fecha, setFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar disponibilidad cuando cambia la fecha
  useEffect(() => {
    const cargarDisponibilidad = async () => {
      if (!fecha) return;

      setCargando(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          sucursalId,
          doctorId,
          fecha,
        });

        const response = await fetch(
          `http://localhost:3001/api/catalogo/disponibilidad?${params}`
        );

        if (!response.ok) throw new Error('Error cargando disponibilidad');

        const data = await response.json();
        
        // Validar que disponibilidad sea un array
        if (data.disponibilidad && Array.isArray(data.disponibilidad)) {
          setSlots(data.disponibilidad);
        } else {
          console.error('Respuesta sin array de disponibilidad:', data);
          setSlots([]);
          throw new Error('Formato de disponibilidad inválido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    };

    cargarDisponibilidad();
  }, [fecha, sucursalId, doctorId]);

  const handleSeleccionar = () => {
    if (!horaSeleccionada) return;

    const [hora, minuto] = horaSeleccionada.split(':').map(Number);
    const fechaObj = new Date(fecha);
    fechaObj.setHours(hora, minuto, 0, 0);

    onDateSelect(fechaObj, horaSeleccionada);
  };

  const fechaMinima = new Date().toISOString().split('T')[0];
  const fechaMaxima = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Validar que slots sea un array antes de usar filter
  const slotsDisponibles = Array.isArray(slots) ? slots.filter((s) => s.disponible) : [];
  const slotsSinDisponibilidad = Array.isArray(slots) ? slots.filter((s) => !s.disponible) : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Selecciona Fecha y Hora
      </h2>
      <p className="text-gray-600 mb-8">
        Elige una fecha disponible y el horario que mejor se adapte
      </p>

      <div className="space-y-6">
        {/* Selector de fecha */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setHoraSeleccionada('');
            }}
            min={fechaMinima}
            max={fechaMaxima}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            {new Date(fecha).toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Horarios disponibles */}
        {cargando ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Cargando disponibilidad...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        ) : (
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              Horario
              {horaSeleccionada && (
                <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
              )}
            </label>

            {slotsDisponibles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Horarios Disponibles
                </p>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {slotsDisponibles.map((slot) => (
                    <button
                      key={slot.hora}
                      onClick={() => setHoraSeleccionada(slot.hora)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                        horaSeleccionada === slot.hora
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-blue-600 text-gray-700'
                      }`}
                    >
                      {slot.hora}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {slotsSinDisponibilidad.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Horarios Ocupados
                </p>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {slotsSinDisponibilidad.map((slot) => (
                    <div
                      key={slot.hora}
                      className="px-3 py-2 rounded-lg bg-gray-100 border-2 border-gray-200 text-xs font-semibold text-gray-400 cursor-not-allowed"
                      title={`${slot.cupoDisponible}/${slot.capacidad} disponibles`}
                    >
                      {slot.hora}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slots.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-700">
                    No hay disponibilidad para esta fecha. Intenta con otra.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700">
            <strong>Nota:</strong> Puedes agendar hasta 90 días en advance. Los
            horarios se muestran en intervalos de 30 minutos y permiten hasta 3
            citas simultáneas.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSeleccionar}
            disabled={!horaSeleccionada || cargando}
          >
            Confirmar Horario
          </Button>
        </div>
      </div>
    </div>
  );
}
