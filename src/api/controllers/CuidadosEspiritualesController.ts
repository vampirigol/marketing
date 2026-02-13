import { Request, Response } from 'express';
import { CuidadosEspiritualesRepositoryPostgres } from '../../infrastructure/database/repositories/CuidadosEspiritualesRepository';

export class CuidadosEspiritualesController {
  private repository: CuidadosEspiritualesRepositoryPostgres;

  constructor() {
    this.repository = new CuidadosEspiritualesRepositoryPostgres();
  }

  /**
   * POST /api/cuidados-espirituales/paciente/:pacienteId/marcar-asistencia
   * Registra que el paciente asistió a Cuidados Espirituales.
   */
  async marcarAsistencia(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = req.params.pacienteId;
      if (!pacienteId) {
        res.status(400).json({ success: false, error: 'pacienteId requerido' });
        return;
      }
      const registro = await this.repository.registrarAsistencia(pacienteId);
      res.status(201).json({ success: true, registro });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al marcar asistencia';
      res.status(500).json({ success: false, error: msg });
    }
  }

  /**
   * GET /api/cuidados-espirituales/paciente/:pacienteId
   * Estado de Cuidados Espirituales del paciente (hasAttended, ultimaAsistencia).
   */
  async estadoPaciente(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = req.params.pacienteId;
      if (!pacienteId) {
        res.status(400).json({ success: false, error: 'pacienteId requerido' });
        return;
      }
      const [hasAttended, ultimaAsistencia] = await Promise.all([
        this.repository.tieneAsistencia(pacienteId),
        this.repository.ultimaAsistencia(pacienteId),
      ]);
      res.json({
        success: true,
        hasAttended,
        ultimaAsistencia: ultimaAsistencia ? new Date(ultimaAsistencia).toISOString().slice(0, 10) : null,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al obtener estado';
      res.status(500).json({ success: false, error: msg });
    }
  }

  /**
   * GET /api/cuidados-espirituales/kpi
   * KPI: total de atendidos. Query: desde, hasta (YYYY-MM-DD).
   */
  async kpi(req: Request, res: Response): Promise<void> {
    try {
      const desde = req.query.desde as string | undefined;
      const hasta = req.query.hasta as string | undefined;
      const total = await this.repository.contarAtendidos({ desde, hasta });
      res.json({ success: true, totalAtendidos: total });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al obtener KPI';
      res.status(500).json({ success: false, error: msg });
    }
  }
}
