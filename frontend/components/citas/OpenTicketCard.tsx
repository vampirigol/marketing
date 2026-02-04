/**
 * Componente: OpenTicketCard
 * Muestra la información de un ticket abierto en formato tarjeta
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { OpenTicket } from '@/lib/openTicket.service';

interface OpenTicketCardProps {
  ticket: OpenTicket;
  onConvertir?: (ticketId: string) => void;
  onVerDetalles?: (ticketId: string) => void;
  onEncuesta?: (ticketId: string) => void;
  onCancelar?: (ticketId: string) => void;
}

export const OpenTicketCard: React.FC<OpenTicketCardProps> = ({
  ticket,
  onConvertir,
  onVerDetalles,
  onEncuesta,
  onCancelar,
}) => {
  
  const obtenerVariantEstado = (estado: string): 'success' | 'primary' | 'danger' | 'secondary' => {
    switch (estado) {
      case 'Activo': return 'success';
      case 'Utilizado': return 'primary';
      case 'Expirado': return 'danger';
      case 'Cancelado': return 'secondary';
      default: return 'secondary';
    }
  };

  const calcularDiasRestantes = (): number => {
    const ahora = new Date();
    const hasta = new Date(ticket.fechaValidoHasta);
    const diferencia = hasta.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  const diasRestantes = calcularDiasRestantes();
  const estaVigente = ticket.estado === 'Activo' && diasRestantes > 0;
  const proximoAExpirar = diasRestantes <= 3 && diasRestantes > 0;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col gap-3">
        
        {/* Header: Código y Estado */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{ticket.codigo}</h3>
            <p className="text-sm text-gray-500">{ticket.especialidad}</p>
          </div>
          <Badge variant={obtenerVariantEstado(ticket.estado)}>
            {ticket.estado}
          </Badge>
        </div>

        {/* Información de vigencia */}
        {ticket.estado === 'Activo' && (
          <div className={`p-2 rounded-lg ${proximoAExpirar ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {estaVigente ? '✅ Vigente' : '⚠️ Expirado'}
              </span>
              <span className={`text-sm font-bold ${proximoAExpirar ? 'text-orange-600' : 'text-green-600'}`}>
                {diasRestantes > 0 ? `${diasRestantes} días restantes` : 'Vencido'}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Válido hasta: {new Date(ticket.fechaValidoHasta).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        )}

        {/* Información del ticket */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {ticket.medicoPreferido && (
            <div>
              <span className="text-gray-500">Médico preferido:</span>
              <p className="font-medium text-gray-900">{ticket.medicoPreferido}</p>
            </div>
          )}
          
          <div>
            <span className="text-gray-500">Costo estimado:</span>
            <p className="font-medium text-gray-900">
              ${ticket.costoEstimado.toLocaleString('es-MX')}
            </p>
          </div>

          {ticket.motivoConsultaAnterior && (
            <div className="col-span-2">
              <span className="text-gray-500">Motivo anterior:</span>
              <p className="font-medium text-gray-900">{ticket.motivoConsultaAnterior}</p>
            </div>
          )}
        </div>

        {/* Tratamiento indicado */}
        {ticket.tratamientoIndicado && (
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Tratamiento indicado:</p>
            <p className="text-sm text-gray-700">{ticket.tratamientoIndicado}</p>
          </div>
        )}

        {/* Información de uso */}
        {ticket.estado === 'Utilizado' && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Utilizado el:</span>
              <span className="font-medium text-blue-700">
                {new Date(ticket.fechaUtilizado!).toLocaleDateString('es-MX')}
              </span>
            </div>
            {!ticket.encuestaCompletada && (
              <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>Pendiente: Encuesta de satisfacción</span>
              </div>
            )}
            {ticket.encuestaCompletada && ticket.calificacionAtencion && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Calificación:</span>
                <span className="text-sm font-bold text-yellow-600">
                  {'⭐'.repeat(ticket.calificacionAtencion)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-2">
          {estaVigente && onConvertir && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConvertir(ticket.id)}
              className="flex-1"
            >
              🎫 Registrar Llegada
            </Button>
          )}

          {ticket.estado === 'Utilizado' && !ticket.encuestaCompletada && onEncuesta && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEncuesta(ticket.id)}
              className="flex-1"
            >
              📝 Encuesta
            </Button>
          )}

          {onVerDetalles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVerDetalles(ticket.id)}
            >
              👁️ Ver
            </Button>
          )}

          {ticket.estado === 'Activo' && onCancelar && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancelar(ticket.id)}
            >
              ❌
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
