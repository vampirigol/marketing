/**
 * Repositorio: KPIs Contact Center (confirmed_count, revenue por sucursal y fecha).
 */
import { Pool } from 'pg';
import Database from '../Database';

export interface ContactCenterKpisRepository {
  incrementarConfirmedCount(sucursalId: string): Promise<void>;
  incrementarRevenue(sucursalId: string, monto: number): Promise<void>;
  obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<{ confirmedCount: number; revenue: number } | null>;
}

export class ContactCenterKpisRepositoryPostgres implements ContactCenterKpisRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  private fechaStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  async incrementarConfirmedCount(sucursalId: string): Promise<void> {
    const hoy = this.fechaStr(new Date());
    await this.pool.query(
      `INSERT INTO contact_center_kpis (sucursal_id, fecha, confirmed_count, revenue, updated_at)
       VALUES ($1, $2::date, 1, 0, CURRENT_TIMESTAMP)
       ON CONFLICT (sucursal_id, fecha) DO UPDATE SET
         confirmed_count = contact_center_kpis.confirmed_count + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [sucursalId, hoy]
    );
  }

  async incrementarRevenue(sucursalId: string, monto: number): Promise<void> {
    const hoy = this.fechaStr(new Date());
    await this.pool.query(
      `INSERT INTO contact_center_kpis (sucursal_id, fecha, confirmed_count, revenue, updated_at)
       VALUES ($1, $2::date, 0, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (sucursal_id, fecha) DO UPDATE SET
         revenue = contact_center_kpis.revenue + EXCLUDED.revenue,
         updated_at = CURRENT_TIMESTAMP`,
      [sucursalId, hoy, monto]
    );
  }

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<{ confirmedCount: number; revenue: number } | null> {
    const f = this.fechaStr(fecha);
    const result = await this.pool.query(
      'SELECT confirmed_count, revenue FROM contact_center_kpis WHERE sucursal_id = $1 AND fecha = $2::date',
      [sucursalId, f]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      confirmedCount: parseInt(row.confirmed_count, 10) || 0,
      revenue: parseFloat(row.revenue) || 0,
    };
  }
}
