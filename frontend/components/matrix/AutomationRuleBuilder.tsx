'use client';

import { AutomationRule, AutomationCondition, AutomationAction } from '@/types/matrix';
import { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Save, X, ChevronDown, Grip } from 'lucide-react';
import { 
  crearRegla, 
  actualizarRegla,
  obtenerOpcionesCondiciones,
  obtenerOpcionesAcciones
} from '@/lib/automation-rules.service';

interface AutomationRuleBuilderProps {
  reglaExistente?: AutomationRule | null;
  onSave: (regla: AutomationRule) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ROLE_OPTIONS = ['Admin', 'Contact_Center', 'Recepcion', 'Medico', 'Finanzas'] as const;
type RoleOption = typeof ROLE_OPTIONS[number];

export function AutomationRuleBuilder({
  reglaExistente,
  onSave,
  onCancel,
  isLoading = false
}: AutomationRuleBuilderProps) {
  const [nombre, setNombre] = useState(reglaExistente?.nombre || '');
  const [descripcion, setDescripcion] = useState(reglaExistente?.descripcion || '');
  const [activa, setActiva] = useState(reglaExistente?.activa ?? true);
  const [prioridad, setPrioridad] = useState(reglaExistente?.prioridad || 'media');
  const [sucursalScope, setSucursalScope] = useState(reglaExistente?.sucursalScope || 'Todas');
  const [categoria, setCategoria] = useState(reglaExistente?.categoria || 'Comunicación con el cliente');
  const [horario, setHorario] = useState(reglaExistente?.horario || { dias: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'], inicio: '08:00', fin: '19:00' });
  const [slaPorEtapa, setSlaPorEtapa] = useState(
    reglaExistente?.slaPorEtapa || { new: 2, reviewing: 6, 'in-progress': 12, open: 24, qualified: 24 }
  );
  const [pausaActiva, setPausaActiva] = useState(Boolean(reglaExistente?.pausa));
  const [pausa, setPausa] = useState(
    reglaExistente?.pausa || { tipo: 'sucursal' as const, id: '', desde: '', hasta: '' }
  );
  const [rolesPermitidos, setRolesPermitidos] = useState<RoleOption[]>(
    reglaExistente?.rolesPermitidos || []
  );
  const [abTest, setAbTest] = useState(
    reglaExistente?.abTest || { enabled: false, ratio: 50, variantA: 'Mensaje A', variantB: 'Mensaje B' }
  );
  const [condiciones, setCondiciones] = useState<AutomationCondition[]>(
    reglaExistente?.condiciones || []
  );
  const [acciones, setAcciones] = useState<AutomationAction[]>(
    reglaExistente?.acciones || []
  );
  const [expandedSections, setExpandedSections] = useState({
    condiciones: true,
    acciones: true
  });

  const opcionesCondiciones = useMemo(() => obtenerOpcionesCondiciones(), []);
  const opcionesAcciones = useMemo(() => obtenerOpcionesAcciones(), []);

  // Agregar condición
  const agregarCondicion = useCallback(() => {
    const nuevaCondicion: AutomationCondition = {
      id: `cond-${Date.now()}`,
      type: 'canal',
      operator: '=',
      value: 'whatsapp',
      label: 'Nueva condición'
    };
    setCondiciones([...condiciones, nuevaCondicion]);
  }, [condiciones]);

  // Actualizar condición
  const actualizarCondicion = useCallback((id: string, cambios: Partial<AutomationCondition>) => {
    setCondiciones(condiciones.map(c => c.id === id ? { ...c, ...cambios } : c));
  }, [condiciones]);

  // Eliminar condición
  const eliminarCondicion = useCallback((id: string) => {
    setCondiciones(condiciones.filter(c => c.id !== id));
  }, [condiciones]);

  // Agregar acción
  const agregarAccion = useCallback(() => {
    const nuevaAccion: AutomationAction = {
      id: `accion-${Date.now()}`,
      type: 'add-etiqueta',
      value: '',
      description: 'Nueva acción'
    };
    setAcciones([...acciones, nuevaAccion]);
  }, [acciones]);

  // Actualizar acción
  const actualizarAccion = useCallback((id: string, cambios: Partial<AutomationAction>) => {
    setAcciones(acciones.map(a => a.id === id ? { ...a, ...cambios } : a));
  }, [acciones]);

  // Eliminar acción
  const eliminarAccion = useCallback((id: string) => {
    setAcciones(acciones.filter(a => a.id !== id));
  }, [acciones]);

  // Guardar regla
  const handleSave = useCallback(async () => {
    if (!nombre.trim()) {
      alert('El nombre de la regla es obligatorio');
      return;
    }

    if (condiciones.length === 0) {
      alert('Debe agregar al menos una condición');
      return;
    }

    if (acciones.length === 0) {
      alert('Debe agregar al menos una acción');
      return;
    }

    let regla: AutomationRule;

    if (reglaExistente) {
      regla = await actualizarRegla(reglaExistente.id, {
        nombre,
        descripcion,
        activa,
        categoria,
        prioridad,
        rolesPermitidos: rolesPermitidos?.length ? rolesPermitidos : undefined,
        abTest: abTest.enabled ? abTest : undefined,
        sucursalScope: sucursalScope === 'Todas' ? undefined : sucursalScope,
        horario,
        slaPorEtapa,
        pausa: pausaActiva ? pausa : undefined,
        condiciones,
        acciones
      }) || reglaExistente;
    } else {
      regla = await crearRegla({
        nombre,
        descripcion,
        activa,
        categoria,
        prioridad,
        rolesPermitidos: rolesPermitidos?.length ? rolesPermitidos : undefined,
        abTest: abTest.enabled ? abTest : undefined,
        sucursalScope: sucursalScope === 'Todas' ? undefined : sucursalScope,
        horario,
        slaPorEtapa,
        pausa: pausaActiva ? pausa : undefined,
        condiciones,
        acciones
      });
    }

    onSave(regla);
  }, [
    nombre,
    descripcion,
    activa,
    categoria,
    prioridad,
    rolesPermitidos,
    abTest,
    sucursalScope,
    horario,
    slaPorEtapa,
    pausaActiva,
    pausa,
    condiciones,
    acciones,
    reglaExistente,
    onSave,
  ]);

  const toggleSection = (section: 'condiciones' | 'acciones') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {reglaExistente ? '✏️ Editar Regla' : '➕ Nueva Regla'}
        </h2>
        <button onClick={onCancel} className="hover:bg-white/20 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la Regla *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej: Leads premium por valor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe qué hace esta regla..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Regla activa</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as 'alta' | 'media' | 'baja')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sucursal</label>
              <select
                value={sucursalScope}
                onChange={(e) => setSucursalScope(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todas">Todas</option>
                {opcionesCondiciones.sucursales?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                'Nuevas reglas de automatización y disparadores',
                'Elementos recientes',
                'Comunicación con el cliente',
                'Alertas para los empleados',
                'Monitoreo y control de los empleados',
                'Papeleo',
                'Pago',
                'Entrega',
                'Ventas recurrentes',
                'Anuncios',
                'Administrar los elementos del flujo de trabajo',
                'Información del cliente',
                'Productos',
                'Administración de tareas',
                'Almacenamiento y modificación de los datos',
                'Automatización del flujo de trabajo',
                'Otro',
              ].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Horario laboral</label>
              <div className="flex flex-wrap gap-2">
                {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((dia) => (
                  <label key={dia} className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={horario.dias.includes(dia)}
                      onChange={(e) => {
                        setHorario((prev) => ({
                          ...prev,
                          dias: e.target.checked
                            ? [...prev.dias, dia]
                            : prev.dias.filter((d) => d !== dia),
                        }));
                      }}
                      className="w-3 h-3 accent-blue-500"
                    />
                    {dia}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Inicio</label>
                <input
                  type="time"
                  value={horario.inicio}
                  onChange={(e) => setHorario((prev) => ({ ...prev, inicio: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fin</label>
                <input
                  type="time"
                  value={horario.fin}
                  onChange={(e) => setHorario((prev) => ({ ...prev, fin: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SLA por etapa (horas)</label>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {[
                { id: 'new', label: 'Lead' },
                { id: 'reviewing', label: 'Prospecto' },
                { id: 'in-progress', label: 'Cita' },
                { id: 'open', label: 'Confirmada' },
                { id: 'qualified', label: 'Cierre' },
              ].map((etapa) => (
                <div key={etapa.id}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{etapa.label}</label>
                  <input
                    type="number"
                    value={slaPorEtapa?.[etapa.id as keyof typeof slaPorEtapa] ?? ''}
                    onChange={(e) =>
                      setSlaPorEtapa((prev) => ({
                        ...prev,
                        [etapa.id]: e.target.value === '' ? undefined : Number(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-3 bg-amber-50/60">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={pausaActiva}
                onChange={(e) => setPausaActiva(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              Pausar por vacaciones
            </label>
            {pausaActiva && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <select
                  value={pausa.tipo}
                  onChange={(e) => setPausa((prev) => ({ ...prev, tipo: e.target.value as 'sucursal' | 'asesor' }))}
                  className="px-2 py-1 border border-amber-200 rounded"
                >
                  <option value="sucursal">Sucursal</option>
                  <option value="asesor">Asesor</option>
                </select>
                <input
                  type="text"
                  value={pausa.id}
                  onChange={(e) => setPausa((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="ID o nombre"
                  className="px-2 py-1 border border-amber-200 rounded"
                />
                <input
                  type="date"
                  value={pausa.desde}
                  onChange={(e) => setPausa((prev) => ({ ...prev, desde: e.target.value }))}
                  className="px-2 py-1 border border-amber-200 rounded"
                />
                <input
                  type="date"
                  value={pausa.hasta}
                  onChange={(e) => setPausa((prev) => ({ ...prev, hasta: e.target.value }))}
                  className="px-2 py-1 border border-amber-200 rounded"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Roles permitidos</label>
              <div className="flex flex-wrap gap-2 text-xs">
                {ROLE_OPTIONS.map((rol) => (
                  <label key={rol} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={rolesPermitidos?.includes(rol)}
                      onChange={(e) => {
                        setRolesPermitidos((prev) => {
                          const current = prev || [];
                          if (e.target.checked) return [...current, rol];
                          return current.filter((item) => item !== rol);
                        });
                      }}
                      className="w-3 h-3 accent-blue-500"
                    />
                    {rol}
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Si no seleccionas ninguno, aplica a todos.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">A/B Testing (mensajes)</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={abTest.enabled}
                  onChange={(e) => setAbTest((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-purple-500"
                />
                Activar A/B
              </label>
              {abTest.enabled && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={abTest.variantA}
                    onChange={(e) => setAbTest((prev) => ({ ...prev, variantA: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="Mensaje variante A"
                  />
                  <input
                    type="text"
                    value={abTest.variantB}
                    onChange={(e) => setAbTest((prev) => ({ ...prev, variantB: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="Mensaje variante B"
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Ratio A</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={abTest.ratio}
                      onChange={(e) => setAbTest((prev) => ({ ...prev, ratio: Number(e.target.value) }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    <span>%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Condiciones */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection('condiciones')}
            className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <span className="font-semibold text-gray-900">
              ✅ Condiciones (SI...)
            </span>
            <ChevronDown 
              className={`w-5 h-5 transition-transform ${expandedSections.condiciones ? 'rotate-180' : ''}`} 
            />
          </button>

          {expandedSections.condiciones && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-300">
              {condiciones.map((cond) => (
                <CondicionBuilder
                  key={cond.id}
                  condicion={cond}
                  opciones={opcionesCondiciones}
                  onUpdate={(cambios) => actualizarCondicion(cond.id, cambios)}
                  onDelete={() => eliminarCondicion(cond.id)}
                />
              ))}

              <button
                onClick={agregarCondicion}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Condición
              </button>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection('acciones')}
            className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <span className="font-semibold text-gray-900">
              🔧 Acciones (ENTONCES...)
            </span>
            <ChevronDown 
              className={`w-5 h-5 transition-transform ${expandedSections.acciones ? 'rotate-180' : ''}`} 
            />
          </button>

          {expandedSections.acciones && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-green-300">
              {acciones.map((acc) => (
                <AccionBuilder
                  key={acc.id}
                  accion={acc}
                  opciones={opcionesAcciones}
                  onUpdate={(cambios) => actualizarAccion(acc.id, cambios)}
                  onDelete={() => eliminarAccion(acc.id)}
                />
              ))}

              <button
                onClick={agregarAccion}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Acción
              </button>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 border-t border-gray-200 pt-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Guardar Regla
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para construir condiciones individuales
interface CondicionBuilderProps {
  condicion: AutomationCondition;
  opciones: ReturnType<typeof obtenerOpcionesCondiciones>;
  onUpdate: (cambios: Partial<AutomationCondition>) => void;
  onDelete: () => void;
}

function CondicionBuilder({ condicion, opciones, onUpdate, onDelete }: CondicionBuilderProps) {
  const operadoresDisponibles = opciones.operadores[condicion.type as keyof typeof opciones.operadores] || [];
  const selectOptions =
    condicion.type === 'canal'
      ? opciones.canales
      : condicion.type === 'estado'
      ? opciones.estados
      : condicion.type === 'sucursal'
      ? opciones.sucursales
      : condicion.type === 'campana'
      ? opciones.campanas
      : condicion.type === 'servicio'
      ? opciones.servicios
      : condicion.type === 'origen'
      ? opciones.origenes
      : null;
  const isNumeric =
    condicion.type === 'time-in-status' ||
    condicion.type === 'valor-leads' ||
    condicion.type === 'intentos' ||
    condicion.type === 'dias-sin-respuesta' ||
    condicion.type === 'ventana-mensajeria';

  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-2">
      <div className="flex items-center gap-2">
        <Grip className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-blue-700">CONDICIÓN</span>
        <button
          onClick={onDelete}
          className="ml-auto p-1 hover:bg-blue-100 rounded text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Tipo */}
        <select
          value={condicion.type}
          onChange={(e) => onUpdate({ type: e.target.value as AutomationCondition['type'] })}
          className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {opciones.tipos.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Operador */}
        <select
          value={condicion.operator}
          onChange={(e) => onUpdate({ operator: e.target.value as AutomationCondition['operator'] })}
          className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {operadoresDisponibles.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Valor */}
        {selectOptions ? (
          <select
            value={String(condicion.value)}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {selectOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <input
            type={isNumeric ? 'number' : 'text'}
            value={String(condicion.value)}
            onChange={(e) => onUpdate({ value: isNumeric ? parseFloat(e.target.value) : e.target.value })}
            placeholder="Valor..."
            className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    </div>
  );
}

// Componente para construir acciones individuales
interface AccionBuilderProps {
  accion: AutomationAction;
  opciones: ReturnType<typeof obtenerOpcionesAcciones>;
  onUpdate: (cambios: Partial<AutomationAction>) => void;
  onDelete: () => void;
}

function AccionBuilder({ accion, opciones, onUpdate, onDelete }: AccionBuilderProps) {
  return (
    <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-2">
      <div className="flex items-center gap-2">
        <Grip className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-green-700">ACCIÓN</span>
        <button
          onClick={onDelete}
          className="ml-auto p-1 hover:bg-green-100 rounded text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Tipo de acción */}
        <select
          value={accion.type}
          onChange={(e) => onUpdate({ type: e.target.value as AutomationAction['type'] })}
          className="px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {opciones.tipos.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Valor */}
        <input
          type="text"
          value={accion.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="Valor/Descripción..."
          className="px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
  );
}
