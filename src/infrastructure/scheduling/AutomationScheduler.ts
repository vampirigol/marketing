import cron from 'node-cron';
import { AutomationEngine } from '../automation/AutomationEngine';
import { AutomationRepository } from '../automation/AutomationRepository';
import { getWebSocketServer } from '../websocket/WebSocketServer';

export class AutomationScheduler {
  private job?: cron.ScheduledTask;

  constructor(
    private readonly engine: AutomationEngine,
    private readonly repository: AutomationRepository,
    private readonly cronExpression: string = '*/1 * * * *'
  ) {}

  start(): void {
    this.job = cron.schedule(this.cronExpression, async () => {
      await this.ejecutar();
    });
    console.log(`✅ AutomationScheduler iniciado (${this.cronExpression})`);
  }

  stop(): void {
    this.job?.stop();
    console.log('⏹️ AutomationScheduler detenido');
  }

  async ejecutar(): Promise<void> {
    const reglas = await this.repository.listarReglas();
    const logs = await this.engine.ejecutarReglas(reglas);
    for (const log of logs) {
      await this.repository.registrarLog(log);
    }
    if (logs.length > 0) {
      getWebSocketServer()?.notificarTodos('automation:logs_updated', { total: logs.length });
    }
  }
}
