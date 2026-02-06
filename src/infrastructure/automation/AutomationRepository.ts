import { AutomationRule, AutomationLog } from '../../core/entities/AutomationRule';
import Database from '../database/Database';

export interface AutomationRepository {
  listarReglas(): Promise<AutomationRule[]>;
  crearRegla(regla: AutomationRule): Promise<AutomationRule>;
  actualizarRegla(id: string, cambios: Partial<AutomationRule>): Promise<AutomationRule | null>;
  eliminarRegla(id: string): Promise<boolean>;
  registrarLog(log: AutomationLog): Promise<void>;
  listarLogs(ruleId?: string, limite?: number): Promise<AutomationLog[]>;
}

export class InMemoryAutomationRepository implements AutomationRepository {
  private reglas: Map<string, AutomationRule> = new Map();
  private logs: AutomationLog[] = [];

  async listarReglas(): Promise<AutomationRule[]> {
    return Array.from(this.reglas.values()).sort(
      (a, b) => (a.fechaActualizacion?.getTime() || 0) - (b.fechaActualizacion?.getTime() || 0)
    );
  }

  async crearRegla(regla: AutomationRule): Promise<AutomationRule> {
    const id = regla.id || `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const created = { ...regla, id };
    this.reglas.set(created.id, created);
    return created;
  }

  async actualizarRegla(id: string, cambios: Partial<AutomationRule>): Promise<AutomationRule | null> {
    const actual = this.reglas.get(id);
    if (!actual) return null;
    const actualizado = {
      ...actual,
      ...cambios,
      fechaActualizacion: new Date(),
    };
    this.reglas.set(id, actualizado);
    return actualizado;
  }

  async eliminarRegla(id: string): Promise<boolean> {
    return this.reglas.delete(id);
  }

  async registrarLog(log: AutomationLog): Promise<void> {
    this.logs.push(log);
  }

  async listarLogs(ruleId?: string, limite: number = 100): Promise<AutomationLog[]> {
    let data = [...this.logs];
    if (ruleId) data = data.filter((log) => log.ruleId === ruleId);
    data.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    return data.slice(0, limite);
  }
}

export const automationRepository = new InMemoryAutomationRepository();

export class PostgresAutomationRepository implements AutomationRepository {
  private db = Database.getInstance();

  async listarReglas(): Promise<AutomationRule[]> {
    const result = await this.db.query('SELECT * FROM automation_rules ORDER BY fecha_actualizacion DESC');
    return result.rows.map(this.mapRule);
  }

  async crearRegla(regla: AutomationRule): Promise<AutomationRule> {
    const result = await this.db.query(
      `INSERT INTO automation_rules (
        nombre, descripcion, activa, categoria, prioridad, roles_permitidos, ab_test, horario,
        sucursal_scope, sla_por_etapa, pausa, condiciones, acciones
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        regla.nombre,
        regla.descripcion || null,
        regla.activa,
        regla.categoria || null,
        regla.prioridad || 'media',
        regla.rolesPermitidos || [],
        regla.abTest ? JSON.stringify(regla.abTest) : null,
        regla.horario ? JSON.stringify(regla.horario) : null,
        regla.sucursalScope || null,
        regla.slaPorEtapa ? JSON.stringify(regla.slaPorEtapa) : null,
        regla.pausa ? JSON.stringify(regla.pausa) : null,
        JSON.stringify(regla.condiciones),
        JSON.stringify(regla.acciones),
      ]
    );
    return this.mapRule(result.rows[0]);
  }

  async actualizarRegla(id: string, cambios: Partial<AutomationRule>): Promise<AutomationRule | null> {
    const result = await this.db.query(
      `UPDATE automation_rules
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           activa = COALESCE($3, activa),
           categoria = COALESCE($4, categoria),
           prioridad = COALESCE($5, prioridad),
           roles_permitidos = COALESCE($6, roles_permitidos),
           ab_test = COALESCE($7, ab_test),
           horario = COALESCE($8, horario),
           sucursal_scope = COALESCE($9, sucursal_scope),
           sla_por_etapa = COALESCE($10, sla_por_etapa),
           pausa = COALESCE($11, pausa),
           condiciones = COALESCE($12, condiciones),
           acciones = COALESCE($13, acciones),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        cambios.nombre ?? null,
        cambios.descripcion ?? null,
        cambios.activa ?? null,
        cambios.categoria ?? null,
        cambios.prioridad ?? null,
        cambios.rolesPermitidos ?? null,
        cambios.abTest ? JSON.stringify(cambios.abTest) : null,
        cambios.horario ? JSON.stringify(cambios.horario) : null,
        cambios.sucursalScope ?? null,
        cambios.slaPorEtapa ? JSON.stringify(cambios.slaPorEtapa) : null,
        cambios.pausa ? JSON.stringify(cambios.pausa) : null,
        cambios.condiciones ? JSON.stringify(cambios.condiciones) : null,
        cambios.acciones ? JSON.stringify(cambios.acciones) : null,
        id,
      ]
    );
    if (result.rowCount === 0) return null;
    return this.mapRule(result.rows[0]);
  }

  async eliminarRegla(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM automation_rules WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async registrarLog(log: AutomationLog): Promise<void> {
    await this.db.query(
      `INSERT INTO automation_logs (
        rule_id, rule_name, target_id, target_nombre, accion, resultado, mensaje, detalles
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        log.ruleId,
        log.ruleName,
        log.targetId,
        log.targetNombre,
        log.accion,
        log.resultado,
        log.mensaje || null,
        log.detalles ? JSON.stringify(log.detalles) : null,
      ]
    );
  }

  async listarLogs(ruleId?: string, limite: number = 100): Promise<AutomationLog[]> {
    const result = await this.db.query(
      `SELECT * FROM automation_logs
       ${ruleId ? 'WHERE rule_id = $1' : ''}
       ORDER BY fecha DESC
       LIMIT ${limite}`,
      ruleId ? [ruleId] : []
    );
    return result.rows.map(this.mapLog);
  }

  private mapRule(row: any): AutomationRule {
    const parse = (value: any) => {
      if (!value) return undefined;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
      return value;
    };
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      activa: row.activa,
      categoria: row.categoria,
      prioridad: row.prioridad,
      rolesPermitidos: row.roles_permitidos || [],
      abTest: parse(row.ab_test),
      horario: parse(row.horario),
      sucursalScope: row.sucursal_scope || undefined,
      slaPorEtapa: parse(row.sla_por_etapa),
      pausa: parse(row.pausa),
      condiciones: parse(row.condiciones) || [],
      acciones: parse(row.acciones) || [],
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
    };
  }

  private mapLog(row: any): AutomationLog {
    const parse = (value: any) => {
      if (!value) return undefined;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
      return value;
    };
    return {
      id: row.id,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      targetId: row.target_id,
      targetNombre: row.target_nombre,
      accion: row.accion,
      resultado: row.resultado,
      mensaje: row.mensaje,
      fecha: row.fecha,
      detalles: parse(row.detalles),
    };
  }
}
