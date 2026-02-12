import { Request, Response } from 'express';
import { AbonoRepositoryPostgres } from '../../infrastructure/database/repositories/AbonoRepository';
import { CitaRepositoryPostgres } from '../../infrastructure/database/repositories/CitaRepository';
import { CalcularCorteUseCase } from '../../core/use-cases/CalcularCorte';

export class AbonoController {
  private repository: AbonoRepositoryPostgres;
  private citaRepository: CitaRepositoryPostgres;

  constructor() {
    this.repository = new AbonoRepositoryPostgres();
    this.citaRepository = new CitaRepositoryPostgres();
  }

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const abonoData = req.body;

      // Validar que la cita existe
      const cita = await this.citaRepository.obtenerPorId(abonoData.citaId);
      if (!cita) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      // Validar que el monto no exceda el saldo pendiente
      if (abonoData.monto > cita.saldoPendiente) {
        res.status(400).json({
          success: false,
          message: `El monto del abono ($${abonoData.monto}) excede el saldo pendiente ($${cita.saldoPendiente})`,
        });
        return;
      }

      // Crear el abono
      const abono = await this.repository.crear(abonoData);

      // Actualizar el saldo de la cita
      const nuevoMontoAbonado = cita.montoAbonado + abonoData.monto;
      const nuevoSaldo = cita.costoConsulta - nuevoMontoAbonado;

      await this.citaRepository.actualizar(cita.id, {
        montoAbonado: nuevoMontoAbonado,
        saldoPendiente: nuevoSaldo,
      });

      res.status(201).json({
        success: true,
        message: 'Abono registrado exitosamente',
        abono,
        nuevoSaldo,
      });
    } catch (error: unknown) {
      console.error('Error al crear abono:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al registrar el abono',
      });
    }
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const abono = await this.repository.obtenerPorId(id);

      if (!abono) {
        res.status(404).json({
          success: false,
          message: 'Abono no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        abono,
      });
    } catch (error: unknown) {
      console.error('Error al obtener abono:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener el abono',
      });
    }
  }

  async obtenerPorCita(req: Request, res: Response): Promise<void> {
    try {
      const { citaId } = req.params;
      const abonos = await this.repository.obtenerPorCita(citaId);

      res.json({
        success: true,
        count: abonos.length,
        abonos,
      });
    } catch (error: unknown) {
      console.error('Error al obtener abonos de la cita:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener los abonos',
      });
    }
  }

  async obtenerPorSucursalYFecha(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const { fecha } = req.query;

      if (!fecha) {
        res.status(400).json({
          success: false,
          message: 'Fecha requerida',
        });
        return;
      }

      const abonos = await this.repository.obtenerPorSucursalYFecha(
        sucursalId,
        new Date(fecha as string)
      );

      // Calcular totales por método de pago
      const totales = abonos.reduce((acc: any, abono) => {
        if (!acc[abono.metodoPago]) {
          acc[abono.metodoPago] = 0;
        }
        acc[abono.metodoPago] += abono.monto;
        return acc;
      }, {});

      const totalGeneral = abonos.reduce((sum, abono) => sum + abono.monto, 0);

      res.json({
        success: true,
        count: abonos.length,
        totalGeneral,
        totalesPorMetodo: totales,
        abonos,
      });
    } catch (error: unknown) {
      console.error('Error al obtener abonos:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener los abonos',
      });
    }
  }

  /**
   * Calcula el corte de caja del día
   * Usado por Antonio y Yaretzi para generar el reporte diario
   */
  async calcularCorte(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const { fecha, turno } = req.query;

      if (!fecha) {
        res.status(400).json({
          success: false,
          message: 'Fecha requerida',
        });
        return;
      }

      const calcularCorteUseCase = new CalcularCorteUseCase();
      const corte = await calcularCorteUseCase.ejecutar({
        sucursalId,
        fecha: new Date(fecha as string),
        usuarioId: req.body.usuarioId || 'system',
        turno: (turno as 'MATUTINO' | 'VESPERTINO' | 'COMPLETO') || 'COMPLETO',
      });

      res.json({
        success: true,
        corte,
      });
    } catch (error: unknown) {
      console.error('Error al calcular corte:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al calcular el corte',
      });
    }
  }

  /**
   * Valida el corte con el dinero físico
   * Usado por Antonio/Yaretzi al cerrar caja
   */
  async validarCorte(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const { fecha, dineroFisicoEfectivo, dineroFisicoTarjeta, dineroFisicoTransferencia } = req.body;

      if (!fecha || dineroFisicoEfectivo === undefined) {
        res.status(400).json({
          success: false,
          message: 'Fecha y montos físicos son requeridos',
        });
        return;
      }

      // Primero calcular el corte
      const calcularCorteUseCase = new CalcularCorteUseCase();
      const corte = await calcularCorteUseCase.ejecutar({
        sucursalId,
        fecha: new Date(fecha),
        usuarioId: req.body.usuarioId || 'system',
      });

      // Luego validar con dinero físico
      const validacion = await calcularCorteUseCase.validarCorteConDineroFisico(corte, {
        corteId: 'temp-id',
        dineroFisicoEfectivo: parseFloat(dineroFisicoEfectivo),
        dineroFisicoTarjeta: parseFloat(dineroFisicoTarjeta || '0'),
        dineroFisicoTransferencia: parseFloat(dineroFisicoTransferencia || '0'),
      });

      res.json({
        success: validacion.correcto,
        validacion,
        corte,
      });
    } catch (error: unknown) {
      console.error('Error al validar corte:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al validar el corte',
      });
    }
  }

  async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const usuarioId = (req as any).user.id; // Asumiendo middleware de autenticación

      if (!motivo || motivo.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'El motivo de cancelación es obligatorio',
        });
        return;
      }

      const abono = await this.repository.obtenerPorId(id);
      if (!abono) {
        res.status(404).json({
          success: false,
          message: 'Abono no encontrado',
        });
        return;
      }

      if (abono.estado === 'Cancelado') {
        res.status(400).json({
          success: false,
          message: 'El abono ya está cancelado',
        });
        return;
      }

      // Cancelar el abono
      const abonoCancelado = await this.repository.cancelar(id, motivo, usuarioId);

      // Revertir el monto en la cita
      const cita = await this.citaRepository.obtenerPorId(abono.citaId);
      if (cita) {
        const nuevoMontoAbonado = cita.montoAbonado - abono.monto;
        const nuevoSaldo = cita.costoConsulta - nuevoMontoAbonado;

        await this.citaRepository.actualizar(cita.id, {
          montoAbonado: nuevoMontoAbonado,
          saldoPendiente: nuevoSaldo,
        });
      }

      res.json({
        success: true,
        message: 'Abono cancelado exitosamente',
        abono: abonoCancelado,
      });
    } catch (error: unknown) {
      console.error('Error al cancelar abono:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al cancelar el abono',
      });
    }
  }
}
