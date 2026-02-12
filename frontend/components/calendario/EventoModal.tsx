'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { EventoCalendario, TipoEvento, TipoCalendario } from '@/types/calendario';

interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EventoCalendario> & { titulo: string; fechaInicio: Date; fechaFin: Date }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  evento?: EventoCalendario | null;
  fechaInicial?: Date;
  horaInicial?: string;
}

const TIPOS: { value: TipoEvento; label: string }[] = [
  { value: 'reunion', label: 'Reunión' },
  { value: 'evento', label: 'Evento' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'otro', label: 'Otro' },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const RECORDATORIOS: { value: number; label: string }[] = [
  { value: 0, label: 'Sin recordatorio' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
];

export function EventoModal({ isOpen, onClose, onSave, onDelete, evento, fechaInicial, horaInicial }: EventoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [fechaFin, setFechaFin] = useState('');
  const [horaFin, setHoraFin] = useState('10:00');
  const [tipo, setTipo] = useState<TipoEvento>('reunion');
  const [calendario, setCalendario] = useState<TipoCalendario>('personal');
  const [ubicacion, setUbicacion] = useState('');
  const [esTodoElDia, setEsTodoElDia] = useState(false);
  const [esPrivado, setEsPrivado] = useState(false);
  const [color, setColor] = useState('#3B82F6');
  const [recordatorioMinutos, setRecordatorioMinutos] = useState(0);
  const [participantes, setParticipantes] = useState<Array<{ nombre: string; email?: string }>>([]);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setConfirmarEliminar(false);
      return;
    }
    const base = evento?.fechaInicio ? new Date(evento.fechaInicio) : (fechaInicial || new Date());
    const fin = evento?.fechaFin ? new Date(evento.fechaFin) : new Date(base.getTime() + 60 * 60 * 1000);
    setTitulo(evento?.titulo ?? '');
    setDescripcion(evento?.descripcion ?? '');
    setFechaInicio(base.toISOString().slice(0, 10));
    setHoraInicio(evento?.esTodoElDia ? '09:00' : base.toTimeString().slice(0, 5));
    setFechaFin(fin.toISOString().slice(0, 10));
    setHoraFin(evento?.esTodoElDia ? '10:00' : fin.toTimeString().slice(0, 5));
    setTipo(evento?.tipo ?? 'reunion');
    setCalendario(evento?.calendario ?? 'personal');
    setUbicacion(evento?.ubicacion ?? '');
    setEsTodoElDia(evento?.esTodoElDia ?? false);
    setEsPrivado(evento?.esPrivado ?? false);
    setColor(evento?.color ?? '#3B82F6');
    setRecordatorioMinutos(evento?.recordatorioMinutos ?? 0);
    setParticipantes(Array.isArray(evento?.participantes) && evento.participantes.length > 0 ? evento.participantes : []);
    if (horaInicial && !evento) {
      setHoraInicio(horaInicial);
      const [h, m] = horaInicial.split(':').map(Number);
      const end = new Date(base);
      end.setHours(h + 1, m, 0, 0);
      setHoraFin(end.toTimeString().slice(0, 5));
    }
  }, [isOpen, evento, fechaInicial, horaInicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setGuardando(true);
    setError('');
    try {
      const inicio = new Date(`${fechaInicio}T${esTodoElDia ? '00:00' : horaInicio}:00`);
      const fin = new Date(`${fechaFin}T${esTodoElDia ? '23:59' : horaFin}:00`);
      await onSave({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaInicio: inicio,
        fechaFin: fin,
        tipo,
        calendario,
        ubicacion: ubicacion.trim() || undefined,
        esTodoElDia,
        esPrivado,
        color,
        recordatorioMinutos: recordatorioMinutos || undefined,
        participantes: participantes.filter((p) => p.nombre.trim()),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'No se pudo guardar el evento.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!evento?.id || !onDelete) return;
    setEliminando(true);
    setError('');
    try {
      await onDelete(evento.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'No se pudo eliminar el evento.');
    } finally {
      setEliminando(false);
      setConfirmarEliminar(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {evento ? 'Editar evento' : 'Nuevo evento'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Reunión de equipo"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  disabled={esTodoElDia}
                />
                {!esTodoElDia && (
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-24"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  disabled={esTodoElDia}
                />
                {!esTodoElDia && (
                  <Input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-24"
                  />
                )}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={esTodoElDia}
              onChange={(e) => setEsTodoElDia(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Todo el día</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEvento)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calendario</label>
            <select
              value={calendario}
              onChange={(e) => setCalendario(e.target.value as TipoCalendario)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="personal">Mi calendario</option>
              <option value="compania">Calendario de la compañía</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <Input
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Sala, enlace o dirección"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Detalles del evento"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recordatorio</label>
            <select
              value={recordatorioMinutos}
              onChange={(e) => setRecordatorioMinutos(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {RECORDATORIOS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participantes</label>
            <div className="space-y-2">
              {participantes.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={p.nombre}
                    onChange={(e) => {
                      const next = [...participantes];
                      next[i] = { ...next[i], nombre: e.target.value };
                      setParticipantes(next);
                    }}
                    placeholder="Nombre"
                    className="flex-1"
                  />
                  <Input
                    value={p.email ?? ''}
                    onChange={(e) => {
                      const next = [...participantes];
                      next[i] = { ...next[i], email: e.target.value };
                      setParticipantes(next);
                    }}
                    type="email"
                    placeholder="Email (opcional)"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setParticipantes(participantes.filter((_, j) => j !== i))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setParticipantes([...participantes, { nombre: '' }])}
              >
                + Añadir participante
              </Button>
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={esPrivado}
              onChange={(e) => setEsPrivado(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Privado (solo tú ves los detalles)</span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {confirmarEliminar ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800 mb-3">¿Eliminar este evento? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setConfirmarEliminar(false)} disabled={eliminando}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleEliminar} disabled={eliminando} className="bg-red-600 hover:bg-red-700">
                  {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              {evento && onDelete && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmarEliminar(true)}
                  disabled={guardando}
                  className="text-red-600 hover:bg-red-50 mr-auto"
                >
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando || !titulo.trim()}>
                {guardando ? 'Guardando…' : evento ? 'Guardar cambios' : 'Crear evento'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
