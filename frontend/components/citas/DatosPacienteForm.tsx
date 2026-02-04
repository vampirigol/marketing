'use client';

import { useState } from 'react';
import { Phone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface DatosPacienteFormProps {
  onNext: (datos: {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    telefono: string;
    email?: string;
    edad: number;
    noAfiliacion: string;
    religion?: string;
  }) => void;
  onCancel: () => void;
}

export function DatosPacienteForm({ onNext, onCancel }: DatosPacienteFormProps) {
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [edad, setEdad] = useState('');
  const [noAfiliacion, setNoAfiliacion] = useState('');
  const [religion, setReligion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!apellidoPaterno.trim()) newErrors.apellidoPaterno = 'El apellido paterno es obligatorio';
    // Apellido Materno es opcional
    if (!telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    // Email es opcional, pero si se proporciona debe ser válido
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    if (!edad) newErrors.edad = 'La edad es obligatoria';
    if (!noAfiliacion.trim()) newErrors.noAfiliacion = 'El No. Afiliación es obligatorio (CRÍTICO)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validar()) return;

    onNext({
      nombre,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno.trim() || undefined,
      telefono,
      email: email.trim() || undefined,
      edad: parseInt(edad, 10),
      noAfiliacion,
      religion: religion || undefined,
    });
  };

  const puedeAvanzar = nombre && apellidoPaterno && telefono && edad && noAfiliacion;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos del Paciente</h2>
      <p className="text-gray-600 mb-6">
        Completa la información del paciente. Los campos marcados con * son obligatorios.
      </p>

      {/* Alerta crítica */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              CRÍTICO: No. Afiliación es obligatorio
            </p>
            <p className="text-xs text-red-700 mt-1">
              Este dato es necesario para generar reportes de finanzas y cumplir con
              regulaciones de auditoría.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre *
          </label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan"
            className={errors.nombre ? 'border-red-500' : ''}
          />
          {errors.nombre && (
            <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Apellido Paterno */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Apellido Paterno *
            </label>
            <Input
              type="text"
              value={apellidoPaterno}
              onChange={(e) => setApellidoPaterno(e.target.value)}
              placeholder="Pérez"
              className={errors.apellidoPaterno ? 'border-red-500' : ''}
            />
            {errors.apellidoPaterno && (
              <p className="text-xs text-red-600 mt-1">{errors.apellidoPaterno}</p>
            )}
          </div>

          {/* Apellido Materno */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Apellido Materno <span className="text-gray-500 font-normal">(Opcional)</span>
            </label>
            <Input
              type="text"
              value={apellidoMaterno}
              onChange={(e) => setApellidoMaterno(e.target.value)}
              placeholder="García"
              className={errors.apellidoMaterno ? 'border-red-500' : ''}
            />
            {errors.apellidoMaterno && (
              <p className="text-xs text-red-600 mt-1">{errors.apellidoMaterno}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Teléfono *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="5551234567"
                className={`pl-10 ${errors.telefono ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.telefono && (
              <p className="text-xs text-red-600 mt-1">{errors.telefono}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correo Electrónico <span className="text-gray-500 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@example.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Edad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Edad *
            </label>
            <Input
              type="number"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="25"
              min="0"
              max="120"
              className={errors.edad ? 'border-red-500' : ''}
            />
            {errors.edad && (
              <p className="text-xs text-red-600 mt-1">{errors.edad}</p>
            )}
          </div>

          {/* Religión */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Religión
            </label>
            <select
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No especificada</option>
              <option value="Adventista">Adventista</option>
              <option value="Cristiana">Cristiana</option>
              <option value="Católica">Católica</option>
              <option value="Otra">Otra</option>
            </select>
          </div>
        </div>

        {/* No. Afiliación (CRÍTICO) */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            No. Afiliación *
          </label>
          <Input
            type="text"
            value={noAfiliacion}
            onChange={(e) => setNoAfiliacion(e.target.value)}
            placeholder="RCA-2024-0001"
            className={`bg-yellow-100 ${errors.noAfiliacion ? 'border-red-500' : ''}`}
          />
          {errors.noAfiliacion && (
            <p className="text-xs text-red-600 mt-1 font-semibold">{errors.noAfiliacion}</p>
          )}
          <p className="text-xs text-gray-600 mt-2">
            Ejemplo: RCA-2024-0001 (formato del sistema de afiliación)
          </p>
        </div>

        {/* Resumen */}
        {puedeAvanzar && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Datos completos y validados
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {nombre} {apellidoPaterno} {apellidoMaterno} • {telefono} {email && `• ${email}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!puedeAvanzar}
          >
            Continuar a Confirmación
          </Button>
        </div>
      </div>
    </div>
  );
}
