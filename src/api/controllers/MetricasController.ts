import { Request, Response } from 'express';
import { MetricasRepositoryPostgres } from '../../infrastructure/database/repositories/MetricasRepository';

export class MetricasController {
  constructor(private metricasRepo: MetricasRepositoryPostgres) {}

  obtenerKPIDiario = async (req: Request, res: Response) => {
    try {
      const { doctorId, fecha } = req.query;

      if (!doctorId || !fecha) {
        return res.status(400).json({
          error: 'Se requieren doctorId y fecha',
        });
      }

      const kpi = await this.metricasRepo.obtenerKPIDiario(
        doctorId as string,
        fecha as string
      );

      if (!kpi) {
        return res.status(404).json({
          error: 'No se encontraron métricas para este doctor y fecha',
        });
      }

      return res.json({ kpi });
    } catch (error) {
      console.error('Error en obtenerKPIDiario:', error);
      return res.status(500).json({
        error: 'Error al obtener KPI diario',
      });
    }
  };

  obtenerKPISemanal = async (req: Request, res: Response) => {
    try {
      const { doctorId, fechaInicio, fechaFin } = req.query;

      if (!doctorId || !fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: 'Se requieren doctorId, fechaInicio y fechaFin',
        });
      }

      const kpis = await this.metricasRepo.obtenerKPISemanal(
        doctorId as string,
        fechaInicio as string,
        fechaFin as string
      );

      return res.json({ kpis });
    } catch (error) {
      console.error('Error en obtenerKPISemanal:', error);
      return res.status(500).json({
        error: 'Error al obtener KPI semanal',
      });
    }
  };

  obtenerTendencia = async (req: Request, res: Response) => {
    try {
      const { doctorId, fechaInicio, fechaFin } = req.query;

      if (!doctorId || !fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: 'Se requieren doctorId, fechaInicio y fechaFin',
        });
      }

      const tendencia = await this.metricasRepo.obtenerTendenciaSemanal(
        doctorId as string,
        fechaInicio as string,
        fechaFin as string
      );

      return res.json({ tendencia });
    } catch (error) {
      console.error('Error en obtenerTendencia:', error);
      return res.status(500).json({
        error: 'Error al obtener tendencia',
      });
    }
  };

  detectarSaturacion = async (req: Request, res: Response) => {
    try {
      const { doctorId, fecha } = req.query;
      const umbralAlerta = req.query.umbralAlerta
        ? parseInt(req.query.umbralAlerta as string, 10)
        : 80;
      const umbralCritico = req.query.umbralCritico
        ? parseInt(req.query.umbralCritico as string, 10)
        : 100;

      if (!doctorId || !fecha) {
        return res.status(400).json({
          error: 'Se requieren doctorId y fecha',
        });
      }

      const alertas = await this.metricasRepo.detectarSaturacion(
        doctorId as string,
        fecha as string,
        umbralAlerta,
        umbralCritico
      );

      return res.json({
        alertas,
        hayAlertas: alertas.length > 0,
        nivel: alertas.length > 0
          ? alertas.some((a) => a.nivel === 'critico')
            ? 'critico'
            : 'alerta'
          : 'normal',
      });
    } catch (error) {
      console.error('Error en detectarSaturacion:', error);
      return res.status(500).json({
        error: 'Error al detectar saturación',
      });
    }
  };
}
