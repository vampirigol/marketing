'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

interface PacienteFormData {
  nombreCompleto: string;
  telefono: string;
  whatsapp: string;
  email: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F';
  noAfiliacion: string;
  tipoAfiliacion: 'Titular' | 'Familiar';
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
}

interface PacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente?: any;
  onSave: (data: PacienteFormData) => void;
}

export function PacienteModal({ isOpen, onClose, paciente, onSave }: PacienteModalProps) {
  const [formData, setFormData] = useState<PacienteFormData>({
    nombreCompleto: paciente?.nombreCompleto || '',
    telefono: paciente?.telefono || '',
    whatsapp: paciente?.whatsapp || '',
    email: paciente?.email || '',
    fechaNacimiento: paciente?.fechaNacimiento || '',
    sexo: paciente?.sexo || 'M',
    noAfiliacion: paciente?.noAfiliacion || '',
    tipoAfiliacion: paciente?.tipoAfiliacion || 'Titular',
    calle: paciente?.calle || '',
    colonia: paciente?.colonia || '',
    ciudad: paciente?.ciudad || '',
    estado: paciente?.estado || '',
    codigoPostal: paciente?.codigoPostal || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'Nombre completo es obligatorio';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'Teléfono es obligatorio';
    }
    if (!formData.noAfiliacion.trim()) {
      newErrors.noAfiliacion = 'No. Afiliación es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paciente ? 'Editar Paciente' : 'Nuevo Paciente'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white mr-2">
              👤
            </span>
            Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nombre Completo"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                error={errors.nombreCompleto}
                placeholder="Ej: María González Pérez"
              />
            </div>
            <Input
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              error={errors.telefono}
              placeholder="+52 55 1234-5678"
            />
            <Input
              label="WhatsApp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+52 55 1234-5678"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Fecha de Nacimiento"
              name="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo
              </label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className="input"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
        </div>

        {/* Afiliación */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white mr-2">
              🆔
            </span>
            Datos de Afiliación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="No. Afiliación"
              name="noAfiliacion"
              value={formData.noAfiliacion}
              onChange={handleChange}
              error={errors.noAfiliacion}
              placeholder="RCA-2024-001"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Afiliación
              </label>
              <select
                name="tipoAfiliacion"
                value={formData.tipoAfiliacion}
                onChange={handleChange}
                className="input"
              >
                <option value="Titular">Titular</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white mr-2">
              📍
            </span>
            Dirección
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Calle y Número"
                name="calle"
                value={formData.calle}
                onChange={handleChange}
                placeholder="Av. Insurgentes Sur 123"
              />
            </div>
            <Input
              label="Colonia"
              name="colonia"
              value={formData.colonia}
              onChange={handleChange}
              placeholder="Del Valle"
            />
            <Input
              label="Código Postal"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleChange}
              placeholder="03100"
            />
            <Input
              label="Ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleChange}
              placeholder="CDMX"
            />
            <Input
              label="Estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              placeholder="Ciudad de México"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {paciente ? 'Actualizar' : 'Crear'} Paciente
          </Button>
        </div>
      </form>
    </Modal>
  );
}
