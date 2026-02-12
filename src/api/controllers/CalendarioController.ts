import { Request, Response } from 'express';
import { EventoCalendarioRepositoryPostgres } from '../../infrastructure/database/repositories/EventoCalendarioRepository';

const repository = new EventoCalendarioRepositoryPostgres();

export class CalendarioController {
  /**
   * GET /calendario/eventos?fechaInicio=&fechaFin=&calendario=personal|compania&sucursalId=
   */
  async listarEventos(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, calendario, sucursalId } = req.query;
      const user = (req as any).user;
      if (!fechaInicio || !fechaFin) {
        res.status(400).json({ success: false, error: 'fechaInicio y fechaFin son requeridos' });
        return;
      }
      const inicio = new Date(fechaInicio as string);
      const fin = new Date(fechaFin as string);
      const opts: { calendario?: 'personal' | 'compania'; creadoPorId?: string; sucursalId?: string } = {};
      if (calendario === 'personal' || calendario === 'compania') opts.calendario = calendario as any;
      if (calendario === 'personal' && user?.id) opts.creadoPorId = user.id;
      if (sucursalId) opts.sucursalId = sucursalId as string;
      const eventos = await repository.obtenerPorRango(inicio, fin, opts);
      res.json({ success: true, eventos });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Error al listar eventos' });
    }
  }

  /**
   * POST /calendario/eventos
   */
  async crearEvento(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const body = req.body;
      const evento = await repository.crear({
        titulo: body.titulo,
        descripcion: body.descripcion,
        fechaInicio: new Date(body.fechaInicio),
        fechaFin: new Date(body.fechaFin),
        tipo: body.tipo || 'reunion',
        calendario: body.calendario || 'personal',
        sucursalId: body.sucursalId,
        creadoPorId: user?.id,
        creadoPorNombre: user?.username || body.creadoPorNombre,
        ubicacion: body.ubicacion,
        esTodoElDia: !!body.esTodoElDia,
        esPrivado: !!body.esPrivado,
        color: body.color || '#3B82F6',
        participantes: body.participantes || [],
        recordatorioMinutos: body.recordatorioMinutos,
        citaId: body.citaId,
      });
      res.status(201).json({ success: true, evento });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Error al crear evento' });
    }
  }

  /**
   * GET /calendario/eventos/:id
   */
  async obtenerEvento(req: Request, res: Response): Promise<void> {
    try {
      const evento = await repository.obtenerPorId(req.params.id);
      if (!evento) {
        res.status(404).json({ success: false, error: 'Evento no encontrado' });
        return;
      }
      res.json({ success: true, evento });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Error al obtener evento' });
    }
  }

  /**
   * PUT /calendario/eventos/:id
   */
  async actualizarEvento(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const updates: any = {};
      if (body.titulo !== undefined) updates.titulo = body.titulo;
      if (body.descripcion !== undefined) updates.descripcion = body.descripcion;
      if (body.fechaInicio !== undefined) updates.fechaInicio = new Date(body.fechaInicio);
      if (body.fechaFin !== undefined) updates.fechaFin = new Date(body.fechaFin);
      if (body.tipo !== undefined) updates.tipo = body.tipo;
      if (body.calendario !== undefined) updates.calendario = body.calendario;
      if (body.ubicacion !== undefined) updates.ubicacion = body.ubicacion;
      if (body.esTodoElDia !== undefined) updates.esTodoElDia = body.esTodoElDia;
      if (body.esPrivado !== undefined) updates.esPrivado = body.esPrivado;
      if (body.color !== undefined) updates.color = body.color;
      if (body.participantes !== undefined) updates.participantes = body.participantes;
      if (body.recordatorioMinutos !== undefined) updates.recordatorioMinutos = body.recordatorioMinutos;
      const evento = await repository.actualizar(req.params.id, updates);
      res.json({ success: true, evento });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Error al actualizar evento' });
    }
  }

  /**
   * DELETE /calendario/eventos/:id
   */
  async eliminarEvento(req: Request, res: Response): Promise<void> {
    try {
      await repository.eliminar(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Error al eliminar evento' });
    }
  }
}
