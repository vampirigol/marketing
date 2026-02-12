'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HeartPulse,
  MapPin,
  FileBarChart,
  Stethoscope,
  Users,
  X,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Eye,
  Activity,
  Apple,
  Brain,
  Heart,
  Smile,
  Glasses,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Brigada, ResumenBrigada } from '@/types/brigadas';
import {
  obtenerBrigadas,
  obtenerResumenBrigada,
  obtenerAtenciones,
  crearAtencion,
  eliminarAtencion,
  descargarPlantillaBrigada,
  importarBrigadaDesdeArchivo,
  obtenerResumenRegistrosBrigada,
  type Atencion,
  type CrearAtencionInput,
  type ResumenRegistros,
} from '@/lib/brigadas.service';
import { Plus, Trash2, Download, Upload, FileSpreadsheet } from 'lucide-react';

// Especialidades y servicios para brigadas médicas (modal)
const ESPECIALIDADES_Y_SERVICIOS: { id: string; nombre: string; servicios: string[] }[] = [
  { id: 'medicina-integral', nombre: 'Medicina integral', servicios: ['Consulta general', 'Valoración integral', 'Detección de factores de riesgo', 'Seguimiento de crónicos'] },
  { id: 'odontologia', nombre: 'Odontología', servicios: ['Limpieza dental', 'Extracciones', 'Obturaciones', 'Revisión bucal'] },
  { id: 'oftalmologia', nombre: 'Oftalmología', servicios: ['Revisión de agudeza visual', 'Detección de glaucoma', 'Fondo de ojo', 'Prescripción de lentes'] },
  { id: 'fisioterapia', nombre: 'Fisioterapia', servicios: ['Valoración musculoesquelética', 'Terapia de rehabilitación', 'Ejercicio terapéutico', 'Educación postural'] },
  { id: 'nutricion', nombre: 'Nutrición', servicios: ['Valoración nutricional', 'Plan alimentario', 'Educación nutricional', 'Seguimiento de peso'] },
  { id: 'cuidados-espirituales', nombre: 'Cuidados espirituales', servicios: ['Acompañamiento espiritual', 'Consejería', 'Oración', 'Lectura reflexiva'] },
  { id: 'optica', nombre: 'Óptica', servicios: ['Graduación de lentes', 'Adaptación de lentes de contacto', 'Lectura de receta', 'Entrega de armazón'] },
  { id: 'psicologia', nombre: 'Psicología', servicios: ['Entrevista inicial', 'Terapia individual', 'Terapia breve', 'Apoyo en crisis'] },
];


const ESPECIALIDADES_IDS = ESPECIALIDADES_Y_SERVICIOS.map((e) => ({ id: e.id, nombre: e.nombre }));

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
  iconBgClass?: string;
}

function KpiCard({ label, value, icon, colorClass = 'text-gray-900', iconBgClass = 'bg-gray-100' }: KpiCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBgClass}`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${colorClass}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ESTADOS_LABEL: Record<string, string> = {
  planificada: 'Planificada',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
};

function formatFecha(s: string): string {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}

function ModalRegistrarAtencion({
  brigadaId,
  especialidades,
  onClose,
  onGuardado,
}: {
  brigadaId: string;
  especialidades: { id: string; nombre: string }[];
  onClose: () => void;
  onGuardado: () => void | Promise<void>;
}) {
  const [paciente_nombre, setPacienteNombre] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('');
  const [especialidad, setEspecialidad] = useState(especialidades[0]?.id ?? '');
  const [servicio, setServicio] = useState('');
  const [medico, setMedico] = useState('');
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [colonia, setColonia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lentes_entregados, setLentesEntregados] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!paciente_nombre.trim()) {
      setError('Nombre del paciente es requerido');
      return;
    }
    setGuardando(true);
    try {
      await crearAtencion(brigadaId, {
        paciente_nombre: paciente_nombre.trim(),
        fecha,
        hora: hora || undefined,
        especialidad,
        servicio: servicio || undefined,
        medico: medico || undefined,
        edad: edad ? parseInt(edad, 10) : undefined,
        sexo: sexo || undefined,
        localidad: localidad || undefined,
        colonia: colonia || undefined,
        observaciones: observaciones || undefined,
        lentes_entregados: especialidad === 'oftalmologia' ? lentes_entregados : undefined,
      });
      await onGuardado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Registrar atención</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Paciente *</span>
            <input type="text" value={paciente_nombre} onChange={(e) => setPacienteNombre(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Fecha *</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hora</span>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Especialidad *</span>
            <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" required>
              {especialidades.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Servicio</span>
            <input type="text" value={servicio} onChange={(e) => setServicio(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ej. Consulta, Extracción, Valoración" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Médico / profesional</span>
            <input type="text" value={medico} onChange={(e) => setMedico(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Edad</span>
              <input type="number" min={0} max={120} value={edad} onChange={(e) => setEdad(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Sexo</span>
              <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Localidad</span>
              <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Colonia</span>
              <input type="text" value={colonia} onChange={(e) => setColonia(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
          </div>
          {especialidad === 'oftalmologia' && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={lentes_entregados} onChange={(e) => setLentesEntregados(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Lentes entregados</span>
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Observaciones</span>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalReportes({
  brigadas,
  brigadaActual,
  fechaDesde,
  fechaHasta,
  resumen,
  atenciones,
  onClose,
  onImportado,
}: {
  brigadas: Brigada[];
  brigadaActual: Brigada | null;
  fechaDesde: string;
  fechaHasta: string;
  resumen: ResumenBrigada;
  atenciones: Atencion[];
  onClose: () => void;
  onImportado?: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<{
    ok: boolean;
    mensaje: string;
    detalle?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportarExcelBrigada = () => {
    if (!brigadaActual) return;
    const headers = ['Fecha', 'Hora', 'Paciente', 'Edad', 'Sexo', 'Especialidad', 'Servicio', 'Médico', 'Localidad', 'Colonia'];
    const rows = atenciones.map((a) => [
      a.fecha,
      a.hora ?? '',
      a.pacienteNombre,
      a.edad ?? '',
      a.sexo ?? '',
      a.especialidad,
      a.servicio ?? '',
      a.medico ?? '',
      a.localidad ?? '',
      a.colonia ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brigada-atenciones-${brigadaActual.nombre.replace(/\s+/g, '-')}-${fechaDesde || 'todo'}-${fechaHasta || 'todo'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDFBrigada = () => {
    if (!brigadaActual) return;
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte Brigada - ${brigadaActual.nombre}</title>
      <style>body{font-family:sans-serif;padding:20px;} table{border-collapse:collapse;width:100%;margin-top:16px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;}</style>
      </head><body>
      <h1>Reporte de Brigada Médica</h1>
      <p><strong>Brigada:</strong> ${brigadaActual.nombre}</p>
      <p><strong>Período:</strong> ${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}</p>
      <h2>Resumen</h2>
      <p>Total atendidos: ${resumen.totalAtendidos} | Rango edad: ${resumen.rangoEdad}</p>
      <h2>Atenciones (${atenciones.length})</h2>
      <table>
      <tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Edad</th><th>Sexo</th><th>Especialidad</th><th>Servicio</th><th>Médico</th></tr>
      ${atenciones.map((a) => `<tr><td>${a.fecha}</td><td>${a.hora ?? ''}</td><td>${a.pacienteNombre}</td><td>${a.edad ?? ''}</td><td>${a.sexo ?? ''}</td><td>${a.especialidad}</td><td>${a.servicio ?? ''}</td><td>${a.medico ?? ''}</td></tr>`).join('')}
      </table>
      </body></html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 250);
  };

  const exportarListadoBrigadas = () => {
    const headers = ['Nombre', 'Ciudad', 'Fecha inicio', 'Fecha fin', 'Estado'];
    const rows = brigadas.map((b) => [
      b.nombre,
      b.ciudad,
      b.fechaInicio,
      b.fechaFin ?? '',
      b.estado,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listado-brigadas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDescargarPlantilla = () => {
    setResultadoImportacion(null);
    descargarPlantillaBrigada();
  };

  const handleSubirPlantilla = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResultadoImportacion(null);
    setSubiendo(true);
    try {
      const result = await importarBrigadaDesdeArchivo(file);
      setResultadoImportacion({
        ok: true,
        mensaje: `Brigada "${result.brigada.nombre}" creada correctamente.`,
        detalle: result.registrosInsertados != null
          ? `${result.registrosInsertados} de ${result.totalRegistros ?? 0} registros importados.${result.errores?.length ? ` ${result.errores.length} fila(s) con errores.` : ''}`
          : `${result.atencionesInsertadas ?? 0} de ${result.totalAtenciones ?? 0} atenciones importadas.${result.errores?.length ? ` ${result.errores.length} fila(s) con errores.` : ''}`,
      });
      onImportado?.();
    } catch (err) {
      setResultadoImportacion({
        ok: false,
        mensaje: err instanceof Error ? err.message : 'Error al importar el archivo',
      });
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Reportes y datos</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Plantilla para próxima brigada */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Plantilla para próxima brigada
            </h3>
            <p className="text-xs text-gray-500">
              La plantilla incluye las columnas: SUCURSAL, FECHA, LUGAR, NO., NOMBRE, TELEFONO, Dirección, SEXO, Edad, ASD, No ASD, Quiere estudiar la Biblia, Oración, Medico, Dentista, Nutrición, Psicología, Papanicolao, Antígeno prostático, Fisioterapia, Cuidados espirituales, Examen de la vista, Corte de cabello, Denominación, Petición de oración. Descárguela, complétela en la brigada y súbala para cargar los datos.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="secondary" className="flex-1 justify-center gap-2" onClick={handleDescargarPlantilla}>
                <Download className="w-4 h-4" />
                Descargar plantilla Excel
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleSubirPlantilla}
                  disabled={subiendo}
                />
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendo}
                >
                  <Upload className="w-4 h-4" />
                  {subiendo ? 'Cargando…' : 'Subir plantilla rellenada'}
                </Button>
              </div>
            </div>
            {resultadoImportacion && (
              <div
                className={`rounded-lg border p-3 text-sm ${resultadoImportacion.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}
              >
                <p className="font-medium">{resultadoImportacion.mensaje}</p>
                {resultadoImportacion.detalle && <p className="mt-1 text-xs opacity-90">{resultadoImportacion.detalle}</p>}
              </div>
            )}
          </section>

          {/* 2. Reportes de la brigada actual */}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-blue-600" />
              Reportes de la brigada seleccionada
            </h3>
            {brigadaActual ? (
              <>
                <p className="text-xs text-gray-500">
                  <strong>{brigadaActual.nombre}</strong> — Período: {fechaDesde || 'Todo'} — {fechaHasta || 'Hoy'}
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="w-full justify-center" onClick={exportarExcelBrigada}>
                    Exportar Excel (CSV)
                  </Button>
                  <Button variant="secondary" className="w-full justify-center" onClick={exportarPDFBrigada}>
                    Exportar / Imprimir PDF
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">Seleccione una brigada en el selector superior para exportar sus atenciones.</p>
            )}
          </section>

          {/* 3. Listado de brigadas (por sucursal/ciudad) */}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700">Listado de brigadas</h3>
            <p className="text-xs text-gray-500">
              Exporte un listado en CSV de todas las brigadas (nombre, ciudad, fechas). Útil para reportes por sucursal o ciudad.
            </p>
            <Button variant="secondary" className="w-full justify-center" onClick={exportarListadoBrigadas} disabled={!brigadas.length}>
              Exportar listado de brigadas (CSV)
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function BrigadasMedicasPage() {
  const [brigadas, setBrigadas] = useState<Brigada[]>([]);
  const [brigadaSeleccionada, setBrigadaSeleccionada] = useState<string>('');
  const [modalEspecialidadOpen, setModalEspecialidadOpen] = useState(false);
  const [especialidadExpandida, setEspecialidadExpandida] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [resumenApi, setResumenApi] = useState<ResumenBrigada | null>(null);
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [cargandoAtenciones, setCargandoAtenciones] = useState(false);
  const [modalAtencionOpen, setModalAtencionOpen] = useState(false);
  const [modalReportesOpen, setModalReportesOpen] = useState(false);
  const [resumenRegistros, setResumenRegistros] = useState<ResumenRegistros | null>(null);

  const filtros = useCallback(() => {
    const f: { fecha_desde?: string; fecha_hasta?: string } = {};
    if (fechaDesde) f.fecha_desde = fechaDesde;
    if (fechaHasta) f.fecha_hasta = fechaHasta;
    return Object.keys(f).length ? f : undefined;
  }, [fechaDesde, fechaHasta]);

  const cargarBrigadas = useCallback(async () => {
    setCargando(true);
    setErrorApi(null);
    try {
      const list = await obtenerBrigadas();
      setBrigadas(list);
      setBrigadaSeleccionada((prev) => {
        if (!list.length) return '';
        if (!prev || !list.find((b) => b.id === prev)) return list[0].id;
        return prev;
      });
    } catch (e) {
      setErrorApi(e instanceof Error ? e.message : 'Error al cargar brigadas');
      setBrigadas([]);
      setBrigadaSeleccionada('');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarBrigadas();
  }, [cargarBrigadas]);

  useEffect(() => {
    if (!brigadaSeleccionada) {
      setResumenApi(null);
      setAtenciones([]);
      setResumenRegistros(null);
      return;
    }
    let mounted = true;
    setCargandoResumen(true);
    setCargandoAtenciones(true);
    const f = filtros();
    obtenerResumenBrigada(brigadaSeleccionada, f)
      .then((r) => { if (mounted) setResumenApi(r); })
      .catch(() => { if (mounted) setResumenApi(null); })
      .finally(() => { if (mounted) setCargandoResumen(false); });
    obtenerAtenciones(brigadaSeleccionada, f)
      .then((list) => { if (mounted) setAtenciones(list); })
      .catch(() => { if (mounted) setAtenciones([]); })
      .finally(() => { if (mounted) setCargandoAtenciones(false); });
    obtenerResumenRegistrosBrigada(brigadaSeleccionada, f)
      .then((r) => { if (mounted) setResumenRegistros(r); })
      .catch(() => { if (mounted) setResumenRegistros(null); });
    return () => { mounted = false; };
  }, [brigadaSeleccionada, filtros]);

  const brigada = brigadas.find((b) => b.id === brigadaSeleccionada);
  const resumenOrEmpty: ResumenBrigada = resumenApi ?? {
    brigadaId: brigadaSeleccionada,
    totalAtendidos: 0,
    porEspecialidad: { medicinaIntegral: 0, oftalmologia: 0, fisioterapia: 0, nutricion: 0, psicologia: 0, espirituales: 0 },
    odontologia: { consultas: 0, extracciones: 0, resinas: 0, profilaxis: 0, endodoncia: 0 },
    oftalmologiaDesglose: { pacientes: 0, lentesEntregados: 0, valoraciones: 0 },
    fisioterapiaTerapias: 0,
    nutricionConsultas: 0,
    rangoEdad: '—',
    porSexo: { masculino: 0, femenino: 0 },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header: selector de brigada y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <HeartPulse className="w-8 h-8 text-emerald-600" />
              Brigadas Médicas
            </h1>
            <p className="text-gray-500 mt-1">Indicadores y datos por brigada (según informe de registro)</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <select
                value={brigadaSeleccionada}
                onChange={(e) => setBrigadaSeleccionada(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[240px]"
              >
                <option value="">Seleccionar brigada</option>
                {brigadas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="secondary" className="flex items-center gap-2" onClick={() => setModalReportesOpen(true)}>
              <FileBarChart className="w-4 h-4" />
              Reportes
            </Button>
            <Button
              variant="primary"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => { setModalEspecialidadOpen(true); setEspecialidadExpandida(null); }}
            >
              <Stethoscope className="w-4 h-4" />
              Especialidad
            </Button>
          </div>
        </div>

        {errorApi && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 text-center text-red-800">
              <p className="font-medium">{errorApi}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={cargarBrigadas}>Reintentar</Button>
            </CardContent>
          </Card>
        )}

        {!brigadaSeleccionada && !cargando && brigadas.length === 0 && !errorApi && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 text-center text-amber-800">
              <p className="font-medium">No hay brigadas registradas. Crea una brigada para comenzar.</p>
            </CardContent>
          </Card>
        )}

        {!brigadaSeleccionada && brigadas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4 text-center text-amber-800">
              <p className="font-medium">Selecciona una brigada arriba para ver los KPIs.</p>
            </CardContent>
          </Card>
        )}

        {/* Tabla de brigadas médicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              Brigadas médicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <p className="text-sm text-gray-500 py-4">Cargando brigadas...</p>
            ) : brigadas.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No hay brigadas registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-medium">
                      <th className="py-3 px-2">Nombre</th>
                      <th className="py-3 px-2">Ciudad</th>
                      <th className="py-3 px-2">Ubicación</th>
                      <th className="py-3 px-2">Fecha inicio</th>
                      <th className="py-3 px-2">Fecha fin</th>
                      <th className="py-3 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brigadas.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${brigadaSeleccionada === b.id ? 'bg-emerald-50' : ''}`}
                      >
                        <td className="py-3 px-2 font-medium text-gray-900">{b.nombre}</td>
                        <td className="py-3 px-2 text-gray-600">{b.ciudad}</td>
                        <td className="py-3 px-2 text-gray-600 max-w-[180px] truncate" title={b.ubicacion}>{b.ubicacion || '—'}</td>
                        <td className="py-3 px-2 text-gray-600">{formatFecha(b.fechaInicio)}</td>
                        <td className="py-3 px-2 text-gray-600">{formatFecha(b.fechaFin ?? '')}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.estado === 'en_curso' ? 'bg-emerald-100 text-emerald-800' :
                            b.estado === 'finalizada' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ESTADOS_LABEL[b.estado] ?? b.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {brigada && (
          <>
            {/* Filtros por fechas */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Filtrar por rango de fechas</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Desde</span>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Hasta</span>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="mt-5">
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumen general de la brigada — diseño mejorado */}
            <section aria-labelledby="resumen-general-heading">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="resumen-general-heading" className="text-lg font-semibold text-gray-900">
                  Resumen general de la brigada
                </h2>
                {!cargandoResumen && resumenOrEmpty.totalAtendidos > 0 && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                    Período actual
                  </span>
                )}
              </div>
            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-emerald-50/30">
              <CardContent className="p-0">
                {cargandoResumen && (
                  <div className="p-8 text-center text-gray-500">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <p className="mt-2 text-sm">Cargando resumen…</p>
                  </div>
                )}
                {!cargandoResumen && !resumenApi && (
                  <p className="p-6 text-center text-sm text-gray-500">No hay registros de atención para esta brigada en el período seleccionado.</p>
                )}
                {!cargandoResumen && (
                  <div className="flex flex-col lg:flex-row">
                    {/* Bloque principal: Total atendidos */}
                    <div className="flex flex-1 items-center gap-6 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white/80 px-8 py-8 lg:py-10">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <Users className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total de pacientes atendidos</p>
                        <p className="mt-1 text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
                          {resumenOrEmpty.totalAtendidos.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">En el período seleccionado</p>
                      </div>
                    </div>
                    {/* Demografía: edad y sexo */}
                    <div className="flex flex-1 flex-col justify-center gap-0 px-8 py-6 lg:py-8">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Demografía</p>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                            <Heart className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Rango de edad</dt>
                            <dd className="mt-0.5 text-lg font-semibold text-gray-900">{resumenOrEmpty.rangoEdad}</dd>
                          </div>
                        </div>
                        {resumenOrEmpty.porSexo && (
                          <>
                            <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                <Users className="h-5 w-5 text-slate-600" />
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-gray-500">Hombres</dt>
                                <dd className="mt-0.5 text-lg font-semibold text-gray-900">{resumenOrEmpty.porSexo.masculino.toLocaleString()}</dd>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100">
                                <Users className="h-5 w-5 text-pink-600" />
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-gray-500">Mujeres</dt>
                                <dd className="mt-0.5 text-lg font-semibold text-gray-900">{resumenOrEmpty.porSexo.femenino.toLocaleString()}</dd>
                              </div>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </section>

            {/* Pacientes por especialidad — diseño compacto en una sola tarjeta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Pacientes por especialidad
                </CardTitle>
                <p className="mt-1 text-xs text-gray-500">Resumen por especialidad y desglose de odontología y oftalmología</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Por especialidad: 6 KPIs en grid compacto */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Por especialidad</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Medicina integral', value: resumenOrEmpty.porEspecialidad.medicinaIntegral, icon: Stethoscope, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                      { label: 'Oftalmología', value: resumenOrEmpty.porEspecialidad.oftalmologia, icon: Eye, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
                      { label: 'Fisioterapia', value: resumenOrEmpty.porEspecialidad.fisioterapia, icon: Activity, bg: 'bg-violet-50', iconColor: 'text-violet-600' },
                      { label: 'Nutrición', value: resumenOrEmpty.porEspecialidad.nutricion, icon: Apple, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
                      { label: 'Psicología', value: resumenOrEmpty.porEspecialidad.psicologia, icon: Brain, bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                      { label: 'Cuidados espirituales', value: resumenOrEmpty.porEspecialidad.espirituales, icon: Heart, bg: 'bg-rose-50', iconColor: 'text-rose-600' },
                    ].map(({ label, value, icon: Icon, bg, iconColor }) => (
                      <div key={label} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bg}`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-xs text-gray-600">{label}</span>
                        <span className="shrink-0 text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Odontología + Oftalmología en una fila (desglose compacto) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-100 bg-cyan-50/30 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-700">
                      <Smile className="h-3.5 w-3.5" />
                      Odontología (desglose)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {[
                        { label: 'Consultas', value: resumenOrEmpty.odontologia.consultas },
                        { label: 'Extracciones', value: resumenOrEmpty.odontologia.extracciones },
                        { label: 'Resinas', value: resumenOrEmpty.odontologia.resinas },
                        { label: 'Profilaxis', value: resumenOrEmpty.odontologia.profilaxis },
                        { label: 'Endodoncia', value: resumenOrEmpty.odontologia.endodoncia },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between rounded bg-white/80 px-2 py-1.5 text-xs">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-semibold text-gray-900">{value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-blue-50/30 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                      <Eye className="h-3.5 w-3.5" />
                      Oftalmología (desglose)
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Pacientes', value: resumenOrEmpty.oftalmologiaDesglose.pacientes },
                        { label: 'Lentes entregados', value: resumenOrEmpty.oftalmologiaDesglose.lentesEntregados },
                        { label: 'Valoraciones', value: resumenOrEmpty.oftalmologiaDesglose.valoraciones },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center rounded bg-white/80 px-2 py-2 text-center">
                          <span className="text-lg font-semibold text-gray-900">{value.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-500">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fisioterapia y Nutrición: una sola fila */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-violet-50/50 px-3 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100">
                      <Activity className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-600">Fisioterapia (terapias)</span>
                    <span className="text-sm font-semibold text-gray-900">{resumenOrEmpty.fisioterapiaTerapias.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-amber-50/50 px-3 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100">
                      <Apple className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-600">Nutrición (consultas)</span>
                    <span className="text-sm font-semibold text-gray-900">{resumenOrEmpty.nutricionConsultas.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose por registro (plantilla): KPIs de la plantilla SUCURSAL, FECHA, NOMBRE, Medico, Dentista, etc. */}
            {resumenRegistros && resumenRegistros.totalRegistros > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    Desglose por registro (plantilla)
                  </CardTitle>
                  <p className="mt-1 text-xs text-gray-500">
                    KPIs a partir de la plantilla cargada (una fila por persona, servicios en columnas). Por sucursal y por servicio.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border border-teal-100 bg-teal-50/50 px-4 py-3">
                    <Users className="h-8 w-8 text-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total registros (personas)</p>
                      <p className="text-2xl font-bold text-gray-900">{resumenRegistros.totalRegistros.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Servicios marcados (Sí/X/1)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {[
                      { label: 'Médico', value: resumenRegistros.medico },
                      { label: 'Dentista', value: resumenRegistros.dentista },
                      { label: 'Nutrición', value: resumenRegistros.nutricion },
                      { label: 'Psicología', value: resumenRegistros.psicologia },
                      { label: 'Papanicolao', value: resumenRegistros.papaniculao },
                      { label: 'Antígeno prostático', value: resumenRegistros.antigenoProstatico },
                      { label: 'Fisioterapia', value: resumenRegistros.fisioterapia },
                      { label: 'Cuidados espirituales', value: resumenRegistros.cuidadosEspirituales },
                      { label: 'Examen de la vista', value: resumenRegistros.examenVista },
                      { label: 'Corte de cabello', value: resumenRegistros.corteCabello },
                      { label: 'Quiere estudiar la Biblia', value: resumenRegistros.quiereEstudiarBiblia },
                      { label: 'Oración', value: resumenRegistros.oracion },
                      { label: 'Petición de oración', value: resumenRegistros.peticionOracion },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 text-sm">
                        <span className="text-gray-600 truncate">{label}</span>
                        <span className="font-semibold text-gray-900 shrink-0 ml-2">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {resumenRegistros.porSucursal && resumenRegistros.porSucursal.length > 0 && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Por sucursal</p>
                      <div className="flex flex-wrap gap-2">
                        {resumenRegistros.porSucursal.map(({ sucursal, total }) => (
                          <span key={sucursal || 'sin-sucursal'} className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
                            {sucursal || 'Sin sucursal'}: {total}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Registro de atenciones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    Registro de atenciones
                  </CardTitle>
                  <Button
                    size="sm"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setModalAtencionOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Registrar atención
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cargandoAtenciones ? (
                  <p className="text-sm text-gray-500 py-4">Cargando atenciones…</p>
                ) : atenciones.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No hay atenciones registradas en el período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-medium">
                          <th className="py-2 px-2">Fecha</th>
                          <th className="py-2 px-2">Hora</th>
                          <th className="py-2 px-2">Paciente</th>
                          <th className="py-2 px-2">Edad</th>
                          <th className="py-2 px-2">Sexo</th>
                          <th className="py-2 px-2">Especialidad</th>
                          <th className="py-2 px-2">Servicio</th>
                          <th className="py-2 px-2">Médico</th>
                          <th className="py-2 px-2 w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {atenciones.map((a) => (
                          <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-2">{formatFecha(a.fecha)}</td>
                            <td className="py-2 px-2">{a.hora ? a.hora.toString().slice(0, 5) : '—'}</td>
                            <td className="py-2 px-2 font-medium">{a.pacienteNombre}</td>
                            <td className="py-2 px-2">{a.edad ?? '—'}</td>
                            <td className="py-2 px-2">{a.sexo ?? '—'}</td>
                            <td className="py-2 px-2">{ESPECIALIDADES_IDS.find((e) => e.id === a.especialidad)?.nombre ?? a.especialidad}</td>
                            <td className="py-2 px-2">{a.servicio ?? '—'}</td>
                            <td className="py-2 px-2">{a.medico ?? '—'}</td>
                            <td className="py-2 px-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!brigadaSeleccionada || !confirm('¿Eliminar esta atención?')) return;
                                  await eliminarAtencion(brigadaSeleccionada, a.id);
                                  const list = await obtenerAtenciones(brigadaSeleccionada, filtros());
                                  setAtenciones(list);
                                  const r = await obtenerResumenBrigada(brigadaSeleccionada, filtros());
                                  setResumenApi(r);
                                }}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal Registrar atención */}
      {modalAtencionOpen && brigadaSeleccionada && (
        <ModalRegistrarAtencion
          brigadaId={brigadaSeleccionada}
          especialidades={ESPECIALIDADES_IDS}
          onClose={() => setModalAtencionOpen(false)}
          onGuardado={async () => {
            setModalAtencionOpen(false);
            const f = filtros();
            const [list, r] = await Promise.all([
              obtenerAtenciones(brigadaSeleccionada, f),
              obtenerResumenBrigada(brigadaSeleccionada, f),
            ]);
            setAtenciones(list);
            setResumenApi(r);
          }}
        />
      )}

      {/* Modal Reportes y datos (plantilla, subir, reportes) */}
      {modalReportesOpen && (
        <ModalReportes
          brigadas={brigadas}
          brigadaActual={brigada ?? null}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          resumen={resumenOrEmpty}
          atenciones={atenciones}
          onClose={() => setModalReportesOpen(false)}
          onImportado={cargarBrigadas}
        />
      )}

      {/* Modal Especialidades y Servicios */}
      {modalEspecialidadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalEspecialidadOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Especialidades y Servicios</h2>
                    <p className="text-sm text-gray-500">Selecciona una especialidad para ver sus servicios</p>
                  </div>
                </div>
                <button onClick={() => setModalEspecialidadOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Cerrar">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {ESPECIALIDADES_Y_SERVICIOS.map((esp) => {
                const isOpen = especialidadExpandida === esp.id;
                return (
                  <div key={esp.id} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                    <button type="button" onClick={() => setEspecialidadExpandida(isOpen ? null : esp.id)} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50">
                      <span className="font-medium text-gray-900">{esp.nombre}</span>
                      {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Servicios</p>
                        <ul className="space-y-2">
                          {esp.servicios.map((s, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <CircleDot className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <Button variant="secondary" className="w-full" onClick={() => setModalEspecialidadOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
