/**
 * Entidad: Abono
 * Representa un pago o abono realizado por un paciente
 */
export interface Abono {
  id: string;
  citaId: string;
  pacienteId: string;
  sucursalId: string;
  
  // Información del pago
  monto: number;
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto';
  referencia?: string; // Número de transacción/autorización
  
  // Detalles mixto (si aplica)
  montosDesglosados?: {
    efectivo?: number;
    tarjeta?: number;
    transferencia?: number;
  };
  
  // Metadata
  fechaPago: Date;
  registradoPor: string; // ID del usuario que registró el pago
  sucursalRegistro: string;
  
  // Recibo
  folioRecibo: string;
  reciboGenerado: boolean;
  rutaRecibo?: string;
  
  // Estado
  estado: 'Aplicado' | 'Pendiente' | 'Cancelado';
  motivoCancelacion?: string;
  
  notas?: string;
}

export class AbonoEntity implements Abono {
  id!: string;
  citaId!: string;
  pacienteId!: string;
  sucursalId!: string;
  monto!: number;
  metodoPago!: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Mixto';
  referencia?: string;
  montosDesglosados?: {
    efectivo?: number;
    tarjeta?: number;
    transferencia?: number;
  };
  fechaPago!: Date;
  registradoPor!: string;
  sucursalRegistro!: string;
  folioRecibo!: string;
  reciboGenerado!: boolean;
  rutaRecibo?: string;
  estado!: 'Aplicado' | 'Pendiente' | 'Cancelado';
  motivoCancelacion?: string;
  notas?: string;

  constructor(data: Abono) {
    if (data.monto <= 0) {
      throw new Error('El monto del abono debe ser mayor a cero');
    }

    // Validar método mixto
    if (data.metodoPago === 'Mixto') {
      if (!data.montosDesglosados) {
        throw new Error('Para método mixto se requiere desglose de montos');
      }
      
      const total = (data.montosDesglosados.efectivo || 0) +
                    (data.montosDesglosados.tarjeta || 0) +
                    (data.montosDesglosados.transferencia || 0);
      
      if (Math.abs(total - data.monto) > 0.01) {
        throw new Error('El desglose de montos no coincide con el total');
      }
    }

    Object.assign(this, data);
  }

  cancelar(motivo: string, usuarioId: string): void {
    if (this.estado === 'Cancelado') {
      throw new Error('El abono ya está cancelado');
    }
    
    this.estado = 'Cancelado';
    this.motivoCancelacion = `${motivo} - Cancelado por usuario ${usuarioId}`;
  }

  generarFolioRecibo(sucursalCodigo: string): string {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${sucursalCodigo}-${año}${mes}${dia}-${random}`;
  }
}
