'use client';

import { useEffect, useState } from 'react';
import { Doctor, DOCTORES } from '@/lib/doctores-data';
import { Check, Users, MapPin, Stethoscope } from 'lucide-react';

interface DoctorSelectorProps {
  selectedDoctores: string[];
  onChange: (doctorIds: string[]) => void;
  multiSelect?: boolean;
  fixedSucursal?: string;
}

export function DoctorSelector({
  selectedDoctores,
  onChange,
  multiSelect = true,
  fixedSucursal,
}: DoctorSelectorProps) {
  const [filterSucursal, setFilterSucursal] = useState<string>(fixedSucursal || 'all');
  const [filterEspecialidad, setFilterEspecialidad] = useState<string>('all');

  useEffect(() => {
    if (fixedSucursal) {
      setFilterSucursal(fixedSucursal);
    }
  }, [fixedSucursal]);

  const sucursales = Array.from(new Set(DOCTORES.map(d => d.sucursal))).sort();
  const especialidades = Array.from(new Set(DOCTORES.map(d => d.especialidad))).sort();

  const doctoresFiltrados = DOCTORES.filter(doctor => {
    if (fixedSucursal && doctor.sucursal !== fixedSucursal) return false;
    if (filterSucursal !== 'all' && doctor.sucursal !== filterSucursal) return false;
    if (filterEspecialidad !== 'all' && doctor.especialidad !== filterEspecialidad) return false;
    return true;
  });

  const handleToggleDoctor = (doctorId: string) => {
    if (multiSelect) {
      if (selectedDoctores.includes(doctorId)) {
        onChange(selectedDoctores.filter(id => id !== doctorId));
      } else {
        onChange([...selectedDoctores, doctorId]);
      }
    } else {
      onChange([doctorId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDoctores.length === doctoresFiltrados.length) {
      onChange([]);
    } else {
      onChange(doctoresFiltrados.map(d => d.id));
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Seleccionar Doctores</h3>
          </div>
          {multiSelect && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedDoctores.length === doctoresFiltrados.length ? 'Deseleccionar' : 'Seleccionar'} todos
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
        <div className="flex gap-3">
          {/* Filtro Sucursal */}
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Sucursal
            </label>
            <select
              value={filterSucursal}
              onChange={(e) => setFilterSucursal(e.target.value)}
              disabled={Boolean(fixedSucursal)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">Todas las sucursales</option>
              {sucursales.map(sucursal => (
                <option key={sucursal} value={sucursal}>{sucursal}</option>
              ))}
            </select>
          </div>

          {/* Filtro Especialidad */}
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Especialidad
            </label>
            <select
              value={filterEspecialidad}
              onChange={(e) => setFilterEspecialidad(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">Todas las especialidades</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Doctores */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        {doctoresFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay doctores con estos filtros</p>
          </div>
        ) : (
          <div className="space-y-1">
            {doctoresFiltrados.map(doctor => {
              const isSelected = selectedDoctores.includes(doctor.id);
              return (
                <button
                  key={doctor.id}
                  onClick={() => handleToggleDoctor(doctor.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${isSelected 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Color indicator */}
                  <div 
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: doctor.color }}
                  />

                  {/* Checkbox */}
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}
                  `}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {doctor.nombre}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                      <span className="truncate">{doctor.especialidad}</span>
                      <span className="text-gray-400">•</span>
                      <span className="truncate text-gray-500">{doctor.sucursal}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer con contador */}
      {selectedDoctores.length > 0 && (
        <div className="px-4 py-2.5 bg-blue-50 border-t-2 border-blue-200">
          <p className="text-sm text-center text-blue-700">
            <span className="font-bold">{selectedDoctores.length}</span> doctor{selectedDoctores.length !== 1 ? 'es' : ''} seleccionado{selectedDoctores.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
