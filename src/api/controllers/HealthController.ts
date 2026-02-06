import { Request, Response } from 'express';
import Database from '../../infrastructure/database/Database';
import { getWebSocketServer } from '../../infrastructure/websocket/WebSocketServer';
import { obtenerSchedulerManager } from '../../infrastructure/scheduling';

export class HealthController {
  async panel(req: Request, res: Response): Promise<void> {
    try {
      const dbOk = await Database.getInstance().testConnection();
      const wsServer = getWebSocketServer();
      const wsClientes = wsServer ? wsServer.getConnectedCount() : 0;
      const schedulerEstado = obtenerSchedulerManager().obtenerEstado();

      res.json({
        success: true,
        api: {
          status: 'ok',
          timestamp: new Date().toISOString(),
        },
        database: {
          connected: dbOk,
        },
        websocket: {
          connected: Boolean(wsServer),
          clientes: wsClientes,
        },
        schedulers: schedulerEstado,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener panel de salud',
      });
    }
  }
}
