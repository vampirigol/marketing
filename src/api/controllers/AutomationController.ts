import { Request, Response } from 'express';
import { automationRepository, PostgresAutomationRepository } from '../../infrastructure/automation/AutomationRepository';
import { AutomationEngine } from '../../infrastructure/automation/AutomationEngine';
import { solicitudContactoRepository } from '../../infrastructure/database/repositories/SolicitudContactoRepository';
import { WhatsAppService } from '../../infrastructure/messaging/WhatsAppService';
import { FacebookService } from '../../infrastructure/messaging/FacebookService';
import { InstagramService } from '../../infrastructure/messaging/InstagramService';
import { AutomationRule } from '../../core/entities/AutomationRule';
import { getWebSocketServer } from '../../infrastructure/websocket/WebSocketServer';

const engine = new AutomationEngine(
  solicitudContactoRepository,
  new WhatsAppService(),
  new FacebookService(),
  new InstagramService()
);

export class AutomationController {
  private repo = process.env.DB_HOST || process.env.DATABASE_URL ? new PostgresAutomationRepository() : automationRepository;

  async listarReglas(_req: Request, res: Response): Promise<void> {
    const reglas = await this.repo.listarReglas();
    res.json({ success: true, reglas });
  }

  async crearRegla(req: Request, res: Response): Promise<void> {
    const regla = req.body as AutomationRule;
    const created = await this.repo.crearRegla({
      ...regla,
      id: regla.id || `rule-${Date.now()}`,
      fechaCreacion: regla.fechaCreacion ? new Date(regla.fechaCreacion) : new Date(),
      fechaActualizacion: new Date(),
    });
    getWebSocketServer()?.notificarTodos('automation:rules_updated', { action: 'created', id: created.id });
    res.status(201).json({ success: true, regla: created });
  }

  async actualizarRegla(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const cambios = req.body as Partial<AutomationRule>;
    const updated = await this.repo.actualizarRegla(id, cambios);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Regla no encontrada' });
      return;
    }
    getWebSocketServer()?.notificarTodos('automation:rules_updated', { action: 'updated', id });
    res.json({ success: true, regla: updated });
  }

  async eliminarRegla(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const ok = await this.repo.eliminarRegla(id);
    if (ok) {
      getWebSocketServer()?.notificarTodos('automation:rules_updated', { action: 'deleted', id });
    }
    res.json({ success: ok });
  }

  async listarLogs(req: Request, res: Response): Promise<void> {
    const { ruleId, limit } = req.query;
    const logs = await this.repo.listarLogs(
      typeof ruleId === 'string' ? ruleId : undefined,
      limit ? Number(limit) : 100
    );
    res.json({ success: true, logs });
  }

  async ejecutar(req: Request, res: Response): Promise<void> {
    const reglas = await this.repo.listarReglas();
    const logs = await engine.ejecutarReglas(reglas);
    for (const log of logs) {
      await this.repo.registrarLog(log);
    }
    getWebSocketServer()?.notificarTodos('automation:logs_updated', { total: logs.length });
    res.json({ success: true, logs, total: logs.length });
  }
}
