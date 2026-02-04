'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  X, 
  CheckCircle, 
  XCircle,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowUpDown,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';

interface CorteModalProps {
  corteId: string;
  onClose: () => void;
}

interface DetalleTransaccion {
  id: string;
  hora: string;
  paciente: string;
  cita: string;
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  referencia?: string;
  estado: 'verificado' | 'pendiente' | 'problema';
}

export function CorteModal({ corteId, onClose }: CorteModalProps) {
  // Datos de ejemplo - en producción vendrían del API
  const corte = {
    id: corteId,
    sucursal: 'CDMX Centro',
    fecha: '02 Feb 2026',
    turno: 'Completo',
    responsable: 'Yaretzi Ramírez',
    horaInicio: '08:00',
    horaFin: '20:00',
    efectivo: 5200,
    tarjeta: 4800,
    transferencia: 2450,
    total: 12450,
    citasTotal: 28,
    citasAtendidas: 26,
    citasNoShow: 2,
    estado: 'pendiente' as const,
    notas: 'Pendiente de verificación de 3 transferencias',
    discrepancias: 1
  };

  const transacciones: DetalleTransaccion[] = [
    {
      id: '1',
      hora: '08:30',
      paciente: 'María González',
      cita: 'Medicina General',
      monto: 250,
      metodoPago: 'efectivo',
      estado: 'verificado'
    },
    {
      id: '2',
      hora: '09:15',
      paciente: 'Pedro Sánchez',
      cita: 'Odontología',
      monto: 350,
      metodoPago: 'tarjeta',
      referencia: '**** 4532',
      estado: 'verificado'
    },
    {
      id: '3',
      hora: '10:00',
      paciente: 'Ana Martínez',
      cita: 'Pediatría',
      monto: 200,
      metodoPago: 'transferencia',
      referencia: 'REF:12345',
      estado: 'pendiente'
    },
    {
      id: '4',
      hora: '11:30',
      paciente: 'Carlos Ruiz',
      cita: 'Traumatología',
      monto: 500,
      metodoPago: 'efectivo',
      estado: 'verificado'
    }
  ];

  const handleAprobar = () => {
    console.log('Aprobando corte:', corteId);
    onClose();
  };

  const handleRechazar = () => {
    console.log('Rechazando corte:', corteId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Corte de Caja - {corte.sucursal}</h2>
              <p className="text-blue-100 mt-1">{corte.fecha} • {corte.turno}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resumen Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info General */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información General
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Responsable:</span>
                  <span className="font-medium text-gray-900">{corte.responsable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horario:</span>
                  <span className="font-medium text-gray-900">{corte.horaInicio} - {corte.horaFin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Citas atendidas:</span>
                  <span className="font-medium text-gray-900">{corte.citasAtendidas} / {corte.citasTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No show:</span>
                  <span className="font-medium text-orange-600">{corte.citasNoShow}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge variant="warning">Pendiente</Badge>
                </div>
              </div>
            </div>

            {/* Total y Métodos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen Financiero
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <p className="text-sm text-blue-700 mb-2">Total del Corte</p>
                <p className="text-4xl font-bold text-blue-900">${corte.total.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <Banknote className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Efectivo</p>
                  <p className="text-lg font-bold text-green-700">${corte.efectivo.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <CreditCard className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Tarjeta</p>
                  <p className="text-lg font-bold text-purple-700">${corte.tarjeta.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <ArrowUpDown className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Transfer.</p>
                  <p className="text-lg font-bold text-blue-700">${corte.transferencia.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas/Notas */}
          {corte.discrepancias > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Atención requerida</p>
                <p className="text-sm text-orange-700 mt-1">{corte.notas}</p>
              </div>
            </div>
          )}

          {/* Detalle de Transacciones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalle de Transacciones
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transacciones.map((transaccion) => (
                    <tr key={transaccion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{transaccion.hora}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{transaccion.paciente}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{transaccion.cita}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">${transaccion.monto}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-700 capitalize">
                          {transaccion.metodoPago === 'efectivo' && <Banknote className="w-4 h-4" />}
                          {transaccion.metodoPago === 'tarjeta' && <CreditCard className="w-4 h-4" />}
                          {transaccion.metodoPago === 'transferencia' && <ArrowUpDown className="w-4 h-4" />}
                          {transaccion.metodoPago}
                        </div>
                        {transaccion.referencia && (
                          <div className="text-xs text-gray-500">{transaccion.referencia}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {transaccion.estado === 'verificado' ? (
                          <Badge variant="success" className="text-xs">✓ Verificado</Badge>
                        ) : transaccion.estado === 'pendiente' ? (
                          <Badge variant="warning" className="text-xs">⏰ Pendiente</Badge>
                        ) : (
                          <Badge variant="danger" className="text-xs">⚠ Problema</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                className="flex items-center gap-2"
                onClick={handleRechazar}
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </Button>
              <Button 
                variant="success" 
                className="flex items-center gap-2"
                onClick={handleAprobar}
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar Corte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
