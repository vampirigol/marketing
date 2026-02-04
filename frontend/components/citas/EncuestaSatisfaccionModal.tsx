/**
 * Componente: EncuestaSatisfaccionModal
 * Modal para registrar la encuesta de satisfacción post-consulta
 */

'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { OpenTicket } from '@/lib/openTicket.service';

interface EncuestaSatisfaccionModalProps {
  ticket: OpenTicket;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (encuesta: {
    calificacionAtencion: number;
    calificacionMedico?: number;
    calificacionInstalaciones?: number;
    calificacionTiempoEspera?: number;
    recomendaria: boolean;
    comentarios?: string;
    aspectosPositivos?: string[];
    aspectosMejorar?: string[];
  }) => void;
  isLoading?: boolean;
}

export const EncuestaSatisfaccionModal: React.FC<EncuestaSatisfaccionModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [calificacionAtencion, setCalificacionAtencion] = useState(5);
  const [calificacionMedico, setCalificacionMedico] = useState(5);
  const [calificacionInstalaciones, setCalificacionInstalaciones] = useState(5);
  const [calificacionTiempoEspera, setCalificacionTiempoEspera] = useState(5);
  const [recomendaria, setRecomendaria] = useState(true);
  const [comentarios, setComentarios] = useState('');
  const [aspectosPositivos, setAspectosPositivos] = useState<string[]>([]);
  const [aspectosMejorar, setAspectosMejorar] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      calificacionAtencion,
      calificacionMedico,
      calificacionInstalaciones,
      calificacionTiempoEspera,
      recomendaria,
      comentarios: comentarios || undefined,
      aspectosPositivos: aspectosPositivos.length > 0 ? aspectosPositivos : undefined,
      aspectosMejorar: aspectosMejorar.length > 0 ? aspectosMejorar : undefined,
    });
  };

  const toggleAspectoPositivo = (aspecto: string) => {
    setAspectosPositivos(prev => 
      prev.includes(aspecto) 
        ? prev.filter(a => a !== aspecto)
        : [...prev, aspecto]
    );
  };

  const toggleAspectoMejorar = (aspecto: string) => {
    setAspectosMejorar(prev => 
      prev.includes(aspecto)
        ? prev.filter(a => a !== aspecto)
        : [...prev, aspecto]
    );
  };

  const CalificacionEstrellas = ({ 
    valor, 
    onChange, 
    label 
  }: { 
    valor: number; 
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <button
            key={estrella}
            type="button"
            onClick={() => onChange(estrella)}
            className="text-3xl transition-transform hover:scale-110"
          >
            {estrella <= valor ? '⭐' : '☆'}
          </button>
        ))}
        <span className="ml-2 self-center text-sm text-gray-600">
          ({valor}/5)
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">📝 Encuesta de Satisfacción</h2>
          <p className="text-sm text-purple-100 mt-1">
            Tu opinión es muy importante para nosotros
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            
            {/* Información del ticket */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Ticket:</span> {ticket.codigo} • 
                <span className="font-semibold ml-2">Especialidad:</span> {ticket.especialidad}
              </p>
            </div>

            {/* Calificaciones */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">📊 Calificaciones</h3>
              
              <CalificacionEstrellas
                valor={calificacionAtencion}
                onChange={setCalificacionAtencion}
                label="Atención general"
              />

              <CalificacionEstrellas
                valor={calificacionMedico}
                onChange={setCalificacionMedico}
                label="Atención del médico"
              />

              <CalificacionEstrellas
                valor={calificacionInstalaciones}
                onChange={setCalificacionInstalaciones}
                label="Instalaciones y limpieza"
              />

              <CalificacionEstrellas
                valor={calificacionTiempoEspera}
                onChange={setCalificacionTiempoEspera}
                label="Tiempo de espera"
              />
            </div>

            {/* ¿Recomendaría? */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ¿Recomendaría nuestra clínica?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRecomendaria(true)}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                    recomendaria
                      ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600'
                  }`}
                >
                  ✅ Sí, definitivamente
                </button>
                <button
                  type="button"
                  onClick={() => setRecomendaria(false)}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                    !recomendaria
                      ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600'
                  }`}
                >
                  ❌ No
                </button>
              </div>
            </div>

            {/* Aspectos positivos */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ✅ ¿Qué aspectos te gustaron?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Atención rápida',
                  'Personal amable',
                  'Instalaciones limpias',
                  'Explicación clara del médico',
                  'Precio justo',
                  'Fácil acceso',
                ].map((aspecto) => (
                  <button
                    key={aspecto}
                    type="button"
                    onClick={() => toggleAspectoPositivo(aspecto)}
                    className={`px-3 py-2 rounded-full text-sm transition-all ${
                      aspectosPositivos.includes(aspecto)
                        ? 'bg-green-500 text-white font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {aspectosPositivos.includes(aspecto) && '✓ '}{aspecto}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspectos a mejorar */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ⚠️ ¿Qué podríamos mejorar?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Reducir tiempo de espera',
                  'Mejorar comunicación',
                  'Más estacionamiento',
                  'Ampliar horarios',
                  'Mejorar instalaciones',
                  'Más opciones de pago',
                ].map((aspecto) => (
                  <button
                    key={aspecto}
                    type="button"
                    onClick={() => toggleAspectoMejorar(aspecto)}
                    className={`px-3 py-2 rounded-full text-sm transition-all ${
                      aspectosMejorar.includes(aspecto)
                        ? 'bg-orange-500 text-white font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {aspectosMejorar.includes(aspecto) && '✓ '}{aspecto}
                  </button>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Comentarios adicionales (opcional)
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Comparte más detalles sobre tu experiencia..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Mensaje de agradecimiento */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800 text-center">
                🙏 Gracias por tomarte el tiempo de completar esta encuesta. 
                Tu retroalimentación nos ayuda a mejorar nuestros servicios.
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Enviando...' : '✅ Enviar Encuesta'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
