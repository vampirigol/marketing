'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CitasFiltersProps {
  onFilterChange: (filters: CitasFilterState) => void;
}

export interface CitasFilterState {
  sucursalId?: string;
  medicoAsignado?: string;
  tipoConsulta?: string;
  estado?: string;
  busqueda?: string;
  soloPromociones: boolean;
}

const SUCURSALES = [
  { id: 'suc-1', nombre: 'Guadalajara' },
  { id: 'suc-2', nombre: 'Ciudad Juárez' },
  { id: 'suc-3', nombre: 'Ciudad Obregón' },
  { id: 'suc-4', nombre: 'Loreto Héroes' }
];

const MEDICOS = [
  'Dr. López',
  'Dra. Ramírez',
  'Dr. González',
  'Dra. Torres',
  'Dr. Martínez'
];

const TIPOS_CONSULTA = [
  'Primera Vez',
  'Subsecuente',
  'Urgencia',
  'Control',
  'Especialidad'
];

const ESTADOS = [
  { value: 'Agendada', label: 'Agendada' },
  { value: 'Pendiente_Confirmacion', label: 'Pendiente de Confirmación' },
  { value: 'Confirmada', label: 'Confirmada' },
  { value: 'Reagendada', label: 'Reagendada' },
  { value: 'Llegó', label: 'Llegó' },
  { value: 'En_Atencion', label: 'En Atención' },
  { value: 'En_Espera', label: 'En Espera' },
  { value: 'Finalizada', label: 'Finalizada' },
  { value: 'Cancelada', label: 'Cancelada' },
  { value: 'Inasistencia', label: 'Inasistencia' },
  { value: 'Perdido', label: 'Perdido' },
  { value: 'No_Asistio', label: 'No Asistió' }
];

export function CitasFilters({ onFilterChange }: CitasFiltersProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filters, setFilters] = useState<CitasFilterState>({
    soloPromociones: false
  });

  const handleFilterChange = (key: keyof CitasFilterState, value: unknown) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const limpiarFiltros = () => {
    const newFilters: CitasFilterState = { soloPromociones: false };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const tieneFiltrosActivos = () => {
    return filters.sucursalId ||
           filters.medicoAsignado ||
           filters.tipoConsulta ||
           filters.estado ||
           filters.busqueda ||
           filters.soloPromociones;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar paciente, teléfono, No. Afiliación..."
              value={filters.busqueda || ''}
              onChange={(e) => handleFilterChange('busqueda', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Botón de filtros */}
        <Button
          variant={mostrarFiltros ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {tieneFiltrosActivos() && (
            <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              •
            </span>
          )}
        </Button>

        {/* Limpiar filtros */}
        {tieneFiltrosActivos() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {mostrarFiltros && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select
              value={filters.sucursalId || ''}
              onChange={(e) => handleFilterChange('sucursalId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {SUCURSALES.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Médico
            </label>
            <select
              value={filters.medicoAsignado || ''}
              onChange={(e) => handleFilterChange('medicoAsignado', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los médicos</option>
              {MEDICOS.map((medico) => (
                <option key={medico} value={medico}>
                  {medico}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Consulta
            </label>
            <select
              value={filters.tipoConsulta || ''}
              onChange={(e) => handleFilterChange('tipoConsulta', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_CONSULTA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.estado || ''}
              onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          {/* Solo Promociones */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.soloPromociones}
                onChange={(e) => handleFilterChange('soloPromociones', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Solo Promociones 🎁
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
