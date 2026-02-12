import { Request, Response } from 'express';
import { BloqueoDoctorRepository } from '../../infrastructure/database/repositories/BloqueoDoctorRepository';

class BloqueoDoctorController {
  private repository = new BloqueoDoctorRepository();

  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'No autenticado' });
        return;
      }
      const medicoNombre = req.user.nombreCompleto || req.user.username;
      const bloqueos = await this.repository.listarPorMedico(medicoNombre);
      res.json({ success: true, bloqueos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al listar bloqueos' });
    }
  };

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'No autenticado' });
        return;
      }

      const { tipo, fecha, diaSemana, horaInicio, horaFin, motivo } = req.body;
      if (!tipo || !['fecha', 'semanal'].includes(tipo)) {
        res.status(400).json({ success: false, message: 'Tipo de bloqueo inválido' });
        return;
      }

      if (tipo === 'fecha' && !fecha) {
        res.status(400).json({ success: false, message: 'Fecha requerida' });
        return;
      }

      if (tipo === 'semanal' && (diaSemana === undefined || diaSemana === null)) {
        res.status(400).json({ success: false, message: 'Día de semana requerido' });
        return;
      }

      const bloqueos = await this.repository.crear({
        medicoId: req.user.id,
        medicoNombre: req.user.nombreCompleto || req.user.username,
        tipo,
        fecha: fecha || undefined,
        diaSemana: diaSemana === undefined ? undefined : Number(diaSemana),
        horaInicio: horaInicio || undefined,
        horaFin: horaFin || undefined,
        motivo: motivo || undefined,
        creadoPor: req.user.id,
      });

      res.status(201).json({ success: true, bloqueo: bloqueos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al crear bloqueo' });
    }
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'No autenticado' });
        return;
      }
      const { id } = req.params;
      const medicoNombre = req.user.nombreCompleto || req.user.username;
      await this.repository.eliminar(id, medicoNombre);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al eliminar bloqueo' });
    }
  };
}

export default new BloqueoDoctorController();
