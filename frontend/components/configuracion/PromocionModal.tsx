'use client';

import { Button } from '@/components/ui/Button';
import { X, Save } from 'lucide-react';
import { useState } from 'react';

interface Promocion {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  tipo: 'descuento_porcentaje' | 'descuento_fijo' | 'precio_especial';
  valor: number;
  servicios: string[];
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: 'activa' | 'programada' | 'vencida' | 'pausada';
  usosMaximos?: number;
  usosActuales: number;
  sucursales: string[];
  condiciones?: string;
}

interface PromocionModalProps {
  promocion: Promocion | null;
  onClose: () => void;
  onSave: (data: Partial<Promocion>) => void;
}

export function PromocionModal({ promocion, onClose, onSave }: PromocionModalProps) {
  const [formData, setFormData] = useState({
    nombre: promocion?.nombre || '',
    codigo: promocion?.codigo || '',
    descripcion: promocion?.descripcion || '',
    tipo: promocion?.tipo || 'descuento_porcentaje',
    valor: promocion?.valor || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {promocion ? 'Editar Promoción' : 'Nueva Promoción'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-purple-500 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="success" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
