'use client';

import { useState, useMemo } from 'react';
import { Cita } from '@/types';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  Eye,
  Tag,
  StickyNote,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { NotasInline } from './NotasInline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


interface VistaListaProps {
  citas: Cita[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectCita: (cita: Cita) => void;
  onUpdateNota?: (citaId: string, nota: string) => void;
  searchQuery?: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  filterEstado: string;
  onFilterEstadoChange: (estado: string) => void;
}

type SortField = 'fecha' | 'paciente' | 'doctor' | 'estado';
type SortDirection = 'asc' | 'desc';


export function VistaLista({
  citas,
  total,
  page,
  pageSize,
  onPageChange,
  onSelectCita,
  onUpdateNota,
  searchQuery = '',
  sortField,
  sortDirection,
  onSortChange,
  filterEstado,
  onFilterEstadoChange,
}: VistaListaProps) {
  const [expandedCita, setExpandedCita] = useState<string | null>(null);

  const getEstadoConfig = (estado: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      Agendada: { color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: Clock, label: 'Agendada' },
      Pendiente_Confirmacion: { color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: Clock, label: 'Pendiente' },
      Confirmada: { color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: CheckCircle, label: 'Confirmada' },
      Reagendada: { color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300', icon: TrendingUp, label: 'Reagendada' },
      Llegó: { color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300', icon: CheckCircle, label: 'Llegó' },
      En_Atencion: { color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: AlertCircle, label: 'En atención' },
      En_Espera: { color: 'text-sky-700', bg: 'bg-sky-100 border-sky-300', icon: AlertCircle, label: 'En espera' },
      Finalizada: { color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300', icon: CheckCircle, label: 'Finalizada' },
      Cancelada: { color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: XCircle, label: 'Cancelada' },
      Inasistencia: { color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300', icon: AlertCircle, label: 'Inasistencia' },
      Perdido: { color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300', icon: AlertCircle, label: 'Perdido' },
      No_Asistio: { color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300', icon: AlertCircle, label: 'No asistió' }
    };
    return configs[estado] || configs['Agendada'];
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => onSortChange(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Estado:</label>
              <select
                value={filterEstado}
                onChange={(e) => onFilterEstadoChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Todos</option>
                <option value="Agendada">Agendadas</option>
                <option value="Pendiente_Confirmacion">Pendiente confirmación</option>
                <option value="Confirmada">Confirmadas</option>
                <option value="Reagendada">Reagendadas</option>
                <option value="En_Espera">En espera</option>
                <option value="Finalizada">Finalizadas</option>
                <option value="Cancelada">Canceladas</option>
                <option value="Inasistencia">Inasistencia</option>
                <option value="Perdido">Perdidos</option>
                <option value="No_Asistio">No asistió</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{total}</span> cita{total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Header de tabla */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-gray-200 px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
          <div className="col-span-2">
            <SortButton field="fecha" label="Fecha y Hora" />
          </div>
          <div className="col-span-3">
            <SortButton field="paciente" label="Paciente" />
          </div>
          <div className="col-span-3">
            <SortButton field="doctor" label="Doctor/Especialidad" />
          </div>
          <div className="col-span-2">
            <SortButton field="estado" label="Estado" />
          </div>
          <div className="col-span-2 text-center">Acciones</div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="space-y-2">
        {citas.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No se encontraron citas</p>
          </div>
        ) : (
          citas.map((cita) => {
            const estadoConfig = getEstadoConfig(cita.estado);
            const Icon = estadoConfig.icon;
            const isExpanded = expandedCita === cita.id;

            return (
              <div
                key={cita.id}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="grid grid-cols-12 gap-4 p-4 items-center">
                  {/* Fecha y Hora */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {format(new Date(cita.fecha || cita.fechaCita), 'dd MMM', { locale: es })}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cita.hora || cita.horaCita}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Paciente */}
                  <div className="col-span-3">
                    <p className="font-semibold text-gray-800 text-sm">
                      {highlightText(cita.pacienteNombre || '')}
                    </p>
                    {cita.pacienteTelefono && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {cita.pacienteTelefono}
                      </p>
                    )}
                  </div>

                  {/* Doctor y Especialidad */}
                  <div className="col-span-3">
                    <p className="font-semibold text-gray-800 text-sm">
                      {highlightText(cita.doctor || cita.medicoAsignado || '')}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3 h-3" />
                      {highlightText(cita.especialidad)}
                    </p>
                    {(cita.sucursal || cita.sucursalNombre) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {highlightText(cita.sucursal || cita.sucursalNombre || '')}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold ${estadoConfig.color} ${estadoConfig.bg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {estadoConfig.label}
                    </span>
                    {cita.esPromocion && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          <Tag className="w-3 h-3" />
                          Promoción
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => onSelectCita(cita)}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`tel:${cita.pacienteTelefono}`, '_blank')}
                      className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                      title="Llamar"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/${cita.pacienteTelefono?.replace(/\D/g, '')}`, '_blank')}
                      className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedCita(isExpanded ? null : cita.id)}
                      className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                      title={isExpanded ? "Contraer" : "Expandir"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Panel expandido */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Información adicional */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm mb-2">Información Adicional</h4>
                        {cita.pacienteEmail && (
                          <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {cita.pacienteEmail}
                          </p>
                        )}
                        {cita.pacienteNoAfiliacion && (
                          <p className="text-sm text-gray-600">
                            <strong>No. Afiliación:</strong> {cita.pacienteNoAfiliacion}
                          </p>
                        )}
                        {(cita.motivo || cita.motivoCancelacion) && (
                          <p className="text-sm text-gray-600">
                            <strong>Motivo:</strong> {cita.motivo || cita.motivoCancelacion}
                          </p>
                        )}
                      </div>

                      {/* Notas */}
                      <div>
                        <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-1.5">
                          <StickyNote className="w-4 h-4" />
                          Notas Rápidas
                        </h4>
                        {onUpdateNota && (
                          <NotasInline
                            citaId={cita.id}
                            notaInicial={cita.notas}
                            onGuardar={onUpdateNota}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span className="text-sm font-medium">
          Página {page} de {Math.ceil(total / pageSize)}
        </span>
        <button
          className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= Math.ceil(total / pageSize)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
