'use client';

import { useState } from 'react';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Banknote,
  Receipt,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string;
  pacienteNombre: string;
}

type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia';
type ConceptoPago = 'Consulta' | 'Tratamiento' | 'Medicamento' | 'Estudio' | 'Otro';

export function RegistrarPagoModal({
  isOpen,
  onClose,
  pacienteId,
  pacienteNombre
}: RegistrarPagoModalProps) {
  const [concepto, setConcepto] = useState<ConceptoPago>('Consulta');
  const [conceptoOtro, setConceptoOtro] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    const montoNum = parseFloat(monto);
    if (!monto || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (concepto === 'Otro' && !conceptoOtro.trim()) {
      setError('Especifica el concepto del pago');
      return;
    }

    if ((metodoPago === 'Tarjeta' || metodoPago === 'Transferencia') && !referencia.trim()) {
      setError('Ingresa el número de referencia');
      return;
    }

    setGuardando(true);

    try {
      const pagoData = {
        pacienteId,
        pacienteNombre,
        concepto: concepto === 'Otro' ? conceptoOtro : concepto,
        monto: montoNum,
        metodoPago,
        referencia: referencia || undefined,
        notas: notas || undefined,
        fecha: new Date().toISOString(),
        estado: 'Completado'
      };

      // TODO: Implementar llamada a API real
      // const response = await fetch('http://localhost:3001/api/pagos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(pagoData)
      // });

      // if (!response.ok) throw new Error('Error al registrar el pago');

      // Simulación de éxito
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Pago registrado:', pagoData);
      alert('✅ Pago registrado exitosamente');
      handleCerrar();
    } catch (error) {
      setError('Error al registrar el pago: ' + (error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = () => {
    setConcepto('Consulta');
    setConceptoOtro('');
    setMonto('');
    setMetodoPago('Efectivo');
    setReferencia('');
    setNotas('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCerrar}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Registrar Pago</h2>
                <p className="text-green-100 mt-1">{pacienteNombre}</p>
              </div>
              <button
                onClick={handleCerrar}
                className="text-white hover:bg-white/10 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Concepto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Concepto del Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Consulta', 'Tratamiento', 'Medicamento', 'Estudio', 'Otro'] as ConceptoPago[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setConcepto(c)}
                      className={`px-4 py-3 rounded-lg border-2 transition text-left ${
                        concepto === c
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{c}</p>
                    </button>
                  ))}
                </div>
                
                {concepto === 'Otro' && (
                  <input
                    type="text"
                    value={conceptoOtro}
                    onChange={(e) => setConceptoOtro(e.target.value)}
                    placeholder="Especifica el concepto..."
                    className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                )}
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto a Pagar
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('Efectivo')}
                    className={`p-4 rounded-lg border-2 transition ${
                      metodoPago === 'Efectivo'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className={`w-6 h-6 mx-auto mb-2 ${
                      metodoPago === 'Efectivo' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-center">Efectivo</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('Tarjeta')}
                    className={`p-4 rounded-lg border-2 transition ${
                      metodoPago === 'Tarjeta'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                      metodoPago === 'Tarjeta' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-center">Tarjeta</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('Transferencia')}
                    className={`p-4 rounded-lg border-2 transition ${
                      metodoPago === 'Transferencia'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className={`w-6 h-6 mx-auto mb-2 ${
                      metodoPago === 'Transferencia' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-center">Transferencia</p>
                  </button>
                </div>
              </div>

              {/* Referencia (solo para Tarjeta o Transferencia) */}
              {(metodoPago === 'Tarjeta' || metodoPago === 'Transferencia') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {metodoPago === 'Tarjeta' ? 'Últimos 4 dígitos / Autorización' : 'Número de Referencia'}
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder={metodoPago === 'Tarjeta' ? 'ej: 1234 o Auth: 123456' : 'ej: REF123456789'}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas / Comentarios (Opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información adicional sobre el pago..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  Resumen del Pago
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paciente:</span>
                    <span className="font-medium">{pacienteNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Concepto:</span>
                    <span className="font-medium">
                      {concepto === 'Otro' ? conceptoOtro : concepto}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-medium">{metodoPago}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="text-gray-900 font-semibold">Total a Pagar:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${parseFloat(monto || '0').toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCerrar}
                className="flex-1"
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
