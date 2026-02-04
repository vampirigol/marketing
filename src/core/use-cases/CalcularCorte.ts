import { AbonoEntity } from '../entities/Abono';

/**
 * Caso de Uso: Calcular Corte de Caja
 * 
 * OBJETIVO (Documentación Gemini - Punto 12):
 * - Generar reporte de corte para Antonio y Yaretzi
 * - Reflejar TODOS los abonos del día
 * - Desglosar por método de pago
 * - Validar que dinero físico = dinero en sistema
 * - Detectar discrepancias para auditoría
 * 
 * Usado por Antonio y Yaretzi para generar reportes financieros diarios
 */

export interface CalcularCorteDTO {
  sucursalId: string;
  fecha: Date;
  usuarioId: string; // Antonio o Yaretzi
  turno?: 'MATUTINO' | 'VESPERTINO' | 'COMPLETO';
}

export interface ResultadoCorte {
  sucursalId: string;
  fecha: Date;
  turno: string;
  
  // Totales por método de pago
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalMixto: number;
  totalGeneral: number;
  
  // Estadísticas
  numeroTransacciones: number;
  numeroCitasAtendidas: number;
  numeroCitasNoAsistieron: number;
  
  // Detalle de transacciones
  abonos: AbonoEntity[];
  
  // Comparación con citas
  citasConAbono: number;
  citasSinAbono: number; // Alerta para Antonio/Yaretzi
  
  // Auditoría
  generadoPor: string;
  fechaGeneracion: Date;
  
  // Alertas
  alertas: string[];
}

export interface ValidacionCorteDTO {
  corteId: string;
  dineroFisicoEfectivo: number;
  dineroFisicoTarjeta: number;
  dineroFisicoTransferencia: number;
}

export interface ResultadoValidacion {
  correcto: boolean;
  diferencias: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  };
  mensaje: string;
  requiereAuditoria: boolean;
}

export class CalcularCorteUseCase {
  /**
   * Calcula el corte de caja del día para una sucursal
   */
  async ejecutar(dto: CalcularCorteDTO): Promise<ResultadoCorte> {
    // TODO: Obtener todos los abonos del día de la sucursal
    // const abonos = await this.abonoRepository.obtenerPorSucursalYFecha(
    //   dto.sucursalId,
    //   dto.fecha
    // );

    // Simulación temporal
    const abonos = this.obtenerAbonosSimulados(dto.sucursalId);

    // TODO: Obtener citas del día para comparar
    // const citas = await this.citaRepository.obtenerPorSucursalYFecha(
    //   dto.sucursalId,
    //   dto.fecha
    // );

    // Filtrar solo abonos aplicados
    const abonosAplicados = abonos.filter(abono => abono.estado === 'Aplicado');

    // Calcular totales por método de pago
    const totales = this.calcularTotalesPorMetodo(abonosAplicados);

    // TODO: Comparar con citas atendidas
    const numeroCitasAtendidas = 15; // Simulado
    const numeroCitasNoAsistieron = 3; // Simulado
    const citasConAbono = abonosAplicados.length;
    const citasSinAbono = numeroCitasAtendidas - citasConAbono;

    // Generar alertas
    const alertas: string[] = [];
    
    if (citasSinAbono > 0) {
      alertas.push(
        `⚠️ ${citasSinAbono} cita(s) marcada(s) como "Llegó" pero sin abono registrado. ` +
        `Revisar con recepcionista.`
      );
    }

    if (totales.totalGeneral === 0 && numeroCitasAtendidas > 0) {
      alertas.push(
        `🚨 CRÍTICO: Hay citas atendidas pero no hay abonos registrados. ` +
        `Posible error en el registro de pagos.`
      );
    }

    // Validación: El total debe coincidir con la suma de abonos
    const sumaAbonos = abonosAplicados.reduce((sum, abono) => sum + abono.monto, 0);
    
    if (Math.abs(totales.totalGeneral - sumaAbonos) > 0.01) {
      alertas.push(
        `🚨 ERROR EN CÁLCULO: Total general (${totales.totalGeneral}) ` +
        `no coincide con suma de abonos (${sumaAbonos})`
      );
    }

    return {
      sucursalId: dto.sucursalId,
      fecha: dto.fecha,
      turno: dto.turno || 'COMPLETO',
      ...totales,
      numeroTransacciones: abonosAplicados.length,
      numeroCitasAtendidas,
      numeroCitasNoAsistieron,
      abonos: abonosAplicados,
      citasConAbono,
      citasSinAbono,
      generadoPor: dto.usuarioId,
      fechaGeneracion: new Date(),
      alertas,
    };
  }

  /**
   * Valida que el dinero físico coincida con el sistema
   * Usado al cierre del día por Antonio/Yaretzi
   */
  async validarCorteConDineroFisico(
    corte: ResultadoCorte,
    dto: ValidacionCorteDTO
  ): Promise<ResultadoValidacion> {
    const diferenciaEfectivo = dto.dineroFisicoEfectivo - corte.totalEfectivo;
    const diferenciaTarjeta = dto.dineroFisicoTarjeta - corte.totalTarjeta;
    const diferenciaTransferencia = dto.dineroFisicoTransferencia - corte.totalTransferencia;

    const hayDiferencias = 
      Math.abs(diferenciaEfectivo) > 0.01 ||
      Math.abs(diferenciaTarjeta) > 0.01 ||
      Math.abs(diferenciaTransferencia) > 0.01;

    let mensaje = '';
    const requiereAuditoria = Math.abs(diferenciaEfectivo) > 100; // Más de $100 de diferencia

    if (!hayDiferencias) {
      mensaje = '✅ Corte cuadrado. El dinero físico coincide con el sistema.';
    } else {
      mensaje = '⚠️ DISCREPANCIAS DETECTADAS:\n';
      
      if (Math.abs(diferenciaEfectivo) > 0.01) {
        const signo = diferenciaEfectivo > 0 ? 'SOBRANTE' : 'FALTANTE';
        mensaje += `  • Efectivo: ${signo} de $${Math.abs(diferenciaEfectivo).toFixed(2)} MXN\n`;
      }
      
      if (Math.abs(diferenciaTarjeta) > 0.01) {
        const signo = diferenciaTarjeta > 0 ? 'SOBRANTE' : 'FALTANTE';
        mensaje += `  • Tarjeta: ${signo} de $${Math.abs(diferenciaTarjeta).toFixed(2)} MXN\n`;
      }
      
      if (Math.abs(diferenciaTransferencia) > 0.01) {
        const signo = diferenciaTransferencia > 0 ? 'SOBRANTE' : 'FALTANTE';
        mensaje += `  • Transferencia: ${signo} de $${Math.abs(diferenciaTransferencia).toFixed(2)} MXN\n`;
      }

      if (requiereAuditoria) {
        mensaje += '\n🚨 Requiere auditoría inmediata por monto significativo.';
      }
    }

    return {
      correcto: !hayDiferencias,
      diferencias: {
        efectivo: diferenciaEfectivo,
        tarjeta: diferenciaTarjeta,
        transferencia: diferenciaTransferencia,
      },
      mensaje,
      requiereAuditoria,
    };
  }

  /**
   * Calcula totales por método de pago
   */
  private calcularTotalesPorMetodo(abonos: AbonoEntity[]): {
    totalEfectivo: number;
    totalTarjeta: number;
    totalTransferencia: number;
    totalMixto: number;
    totalGeneral: number;
  } {
    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;
    let totalMixto = 0;

    abonos.forEach(abono => {
      if (abono.metodoPago === 'Efectivo') {
        totalEfectivo += abono.monto;
      } else if (abono.metodoPago === 'Tarjeta') {
        totalTarjeta += abono.monto;
      } else if (abono.metodoPago === 'Transferencia') {
        totalTransferencia += abono.monto;
      } else if (abono.metodoPago === 'Mixto') {
        totalMixto += abono.monto;
        // Desglosar el mixto si tiene detalle
        if (abono.montosDesglosados) {
          totalEfectivo += abono.montosDesglosados.efectivo || 0;
          totalTarjeta += abono.montosDesglosados.tarjeta || 0;
          totalTransferencia += abono.montosDesglosados.transferencia || 0;
        }
      }
    });

    const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia;

    return {
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalMixto,
      totalGeneral,
    };
  }

  /**
   * Genera reporte en PDF para imprimir
   */
  async generarReportePDF(corte: ResultadoCorte): Promise<string> {
    // TODO: Implementar generación de PDF con PDFKit
    // return await this.pdfService.generarCorte(corte);
    
    return `reporte-corte-${corte.sucursalId}-${corte.fecha.toISOString().split('T')[0]}.pdf`;
  }

  /**
   * Método simulado para obtener abonos (temporal)
   */
  private obtenerAbonosSimulados(sucursalId: string): AbonoEntity[] {
    return [
      new AbonoEntity({
        id: 'abn-001',
        citaId: 'cit-001',
        pacienteId: 'pac-001',
        sucursalId: sucursalId,
        monto: 350,
        metodoPago: 'Efectivo',
        fechaPago: new Date(),
        registradoPor: 'yaretzi',
        sucursalRegistro: sucursalId,
        folioRecibo: 'RCA-260203-0001',
        reciboGenerado: true,
        estado: 'Aplicado',
      }),
      new AbonoEntity({
        id: 'abn-002',
        citaId: 'cit-002',
        pacienteId: 'pac-002',
        sucursalId: sucursalId,
        monto: 450,
        metodoPago: 'Tarjeta',
        referencia: '123456',
        fechaPago: new Date(),
        registradoPor: 'yaretzi',
        sucursalRegistro: sucursalId,
        folioRecibo: 'RCA-260203-0002',
        reciboGenerado: true,
        estado: 'Aplicado',
      }),
    ];
  }
}
