'use client';

import { useState, useEffect } from 'react';
import { contactosService } from '@/lib/contactos.service';
import type { ConfiguracionMotivoContacto } from '@/types/contacto';

interface ContactarAgenteFormProps {
  sucursales: Array<{ id: string; nombre: string; ciudad: string; estado: string }>;
  onSuccess?: (solicitudId: string) => void;
  onCancel?: () => void;
}

export default function ContactarAgenteForm({
  sucursales,
  onSuccess,
  onCancel,
}: ContactarAgenteFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [motivos, setMotivos] = useState<ConfiguracionMotivoContacto[]>([]);
  const [tiempoRespuesta, setTiempoRespuesta] = useState(0);

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    email: '',
    whatsapp: '',
    sucursalId: '',
    sucursalNombre: '',
    motivo: '',
    motivoDetalle: '',
    preferenciaContacto: 'WhatsApp' as 'WhatsApp' | 'Telefono' | 'Email',
  });

  useEffect(() => {
    cargarMotivos();
  }, []);

  const cargarMotivos = async () => {
    try {
      const response = await contactosService.obtenerCatalogoMotivos();
      setMotivos(response.motivos);
    } catch (err) {
      console.error('Error cargando motivos:', err);
    }
  };

  const handleSucursalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sucursalId = e.target.value;
    const sucursal = sucursales.find((s) => s.id === sucursalId);
    setFormData({
      ...formData,
      sucursalId,
      sucursalNombre: sucursal ? `${sucursal.nombre} (${sucursal.ciudad})` : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.nombreCompleto.trim()) {
        throw new Error('El nombre completo es requerido');
      }
      if (!formData.telefono.trim()) {
        throw new Error('El teléfono es requerido');
      }
      if (!formData.sucursalId) {
        throw new Error('Debe seleccionar una sucursal');
      }
      if (!formData.motivo) {
        throw new Error('Debe seleccionar un motivo');
      }

      const response = await contactosService.crear({
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        email: formData.email || undefined,
        whatsapp: formData.whatsapp || formData.telefono,
        sucursalId: formData.sucursalId,
        sucursalNombre: formData.sucursalNombre,
        motivo: formData.motivo,
        motivoDetalle: formData.motivoDetalle || undefined,
        preferenciaContacto: formData.preferenciaContacto,
        origen: 'Web',
      });

      if (response.success) {
        setSuccess(true);
        setTiempoRespuesta(response.tiempoRespuestaEstimado);
        
        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.solicitud.id);
          }
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            ¡Solicitud Enviada!
          </h2>
          <p className="text-green-700 mb-4">
            Hemos recibido tu solicitud de contacto exitosamente.
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-gray-700">
              Un asesor de <strong>{formData.sucursalNombre}</strong> se comunicará
              contigo en aproximadamente:
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {tiempoRespuesta < 60
                ? `${tiempoRespuesta} minutos`
                : `${Math.floor(tiempoRespuesta / 60)} hora(s)`}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Por {formData.preferenciaContacto}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Recibirás una confirmación en tu {formData.preferenciaContacto}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            📞 Contactar a un Agente
          </h2>
          <p className="text-gray-600">
            Completa el formulario y un asesor se comunicará contigo pronto
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos Personales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombreCompleto}
              onChange={(e) =>
                setFormData({ ...formData, nombreCompleto: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Pérez García"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5512345678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5512345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico (opcional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Selección de Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sucursal <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sucursalId}
              onChange={handleSucursalChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona una sucursal</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre} - {sucursal.ciudad}, {sucursal.estado}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo del Contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del Contacto <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un motivo</option>
              {motivos.map((motivo) => (
                <option key={motivo.motivo} value={motivo.motivo}>
                  {motivo.descripcion}
                  {motivo.prioridadSugerida === 'Alta' && ' 🔴'}
                </option>
              ))}
            </select>
          </div>

          {/* Detalles Adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detalles Adicionales (opcional)
            </label>
            <textarea
              value={formData.motivoDetalle}
              onChange={(e) =>
                setFormData({ ...formData, motivoDetalle: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Cuéntanos más sobre tu solicitud..."
            />
          </div>

          {/* Preferencia de Contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferencia de Contacto <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="WhatsApp"
                  checked={formData.preferenciaContacto === 'WhatsApp'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferenciaContacto: e.target.value as any,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm">📱 WhatsApp</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Telefono"
                  checked={formData.preferenciaContacto === 'Telefono'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferenciaContacto: e.target.value as any,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm">☎️ Teléfono</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Email"
                  checked={formData.preferenciaContacto === 'Email'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferenciaContacto: e.target.value as any,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm">📧 Email</span>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Enviando...' : '📞 Solicitar Contacto'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Un asesor se comunicará contigo en los próximos minutos.
            Asegúrate de tener tu teléfono disponible.
          </p>
        </div>
      </div>
    </div>
  );
}
