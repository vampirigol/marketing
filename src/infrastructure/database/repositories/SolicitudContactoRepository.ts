/**
 * Repositorio: Solicitud de Contacto
 * Gestiona el almacenamiento y recuperación de solicitudes de contacto
 */

import { Pool } from 'pg';
import Database from '../Database';
import { 
  SolicitudContacto, 
  EstadoSolicitud 
} from '../../../core/entities/SolicitudContacto';

export interface SolicitudContactoRepository {
  crear(solicitud: SolicitudContacto): Promise<SolicitudContacto>;
  obtenerPorId(id: string): Promise<SolicitudContacto | null>;
  obtenerPorSucursal(sucursalId: string): Promise<SolicitudContacto[]>;
  obtenerPorSucursalNombre(sucursalNombre: string): Promise<SolicitudContacto[]>;
  obtenerPorEstado(estado: EstadoSolicitud): Promise<SolicitudContacto[]>;
  obtenerPorAgente(agenteId: string): Promise<SolicitudContacto[]>;
  obtenerPendientes(): Promise<SolicitudContacto[]>;
  obtenerVencidas(): Promise<SolicitudContacto[]>;
  actualizar(id: string, datos: Partial<SolicitudContacto>): Promise<SolicitudContacto>;
  obtenerTodas(): Promise<SolicitudContacto[]>;
  /** Leads sin cita_id (aún no convertidos). Contact Center solo muestra estos. */
  obtenerPendientesConversion(): Promise<SolicitudContacto[]>;
  /** Busca una solicitud activa (no resuelta/cancelada, sin cita) por teléfono/whatsapp para vincular desde webhooks. */
  obtenerPendientePorTelefono(telefono: string): Promise<SolicitudContacto | null>;
  obtenerEstadisticas(sucursalId?: string): Promise<{
    total: number;
    pendientes: number;
    asignadas: number;
    enContacto: number;
    resueltas: number;
    canceladas: number;
    tiempoPromedioResolucion: number;
  }>;
}

/**
 * Implementación PostgreSQL
 */
export class SolicitudContactoRepositoryPostgres implements SolicitudContactoRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(solicitud: SolicitudContacto): Promise<SolicitudContacto> {
    const query = `
      INSERT INTO solicitudes_contacto (
        id, paciente_id, nombre_completo, telefono, email, whatsapp,
        sucursal_id, sucursal_nombre, motivo, motivo_detalle, preferencia_contacto,
        estado, prioridad, agente_asignado_id, agente_asignado_nombre, intentos_contacto,
        ultimo_intento, notas, resolucion, origen, creado_por, fecha_creacion,
        fecha_asignacion, fecha_resolucion, ultima_actualizacion, crm_status, crm_resultado,
        no_afiliacion, cita_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      ) RETURNING *
    `;

    const values = [
      solicitud.id,
      solicitud.pacienteId || null,
      solicitud.nombreCompleto,
      solicitud.telefono,
      solicitud.email || null,
      solicitud.whatsapp || null,
      solicitud.sucursalId,
      solicitud.sucursalNombre,
      solicitud.motivo,
      solicitud.motivoDetalle || null,
      solicitud.preferenciaContacto,
      solicitud.estado,
      solicitud.prioridad,
      solicitud.agenteAsignadoId || null,
      solicitud.agenteAsignadoNombre || null,
      solicitud.intentosContacto,
      solicitud.ultimoIntento || null,
      solicitud.notas || null,
      solicitud.resolucion || null,
      solicitud.origen,
      solicitud.creadoPor,
      solicitud.fechaCreacion,
      solicitud.fechaAsignacion || null,
      solicitud.fechaResolucion || null,
      solicitud.ultimaActualizacion,
      solicitud.crmStatus || null,
      solicitud.crmResultado || null,
      solicitud.noAfiliacion || null,
      solicitud.citaId || null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<SolicitudContacto | null> {
    const result = await this.pool.query('SELECT * FROM solicitudes_contacto WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorSucursal(sucursalId: string): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_contacto WHERE sucursal_id = $1 ORDER BY fecha_creacion DESC',
      [sucursalId]
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorSucursalNombre(sucursalNombre: string): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_contacto WHERE sucursal_nombre = $1 ORDER BY fecha_creacion DESC',
      [sucursalNombre]
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorEstado(estado: EstadoSolicitud): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_contacto WHERE estado = $1 ORDER BY fecha_creacion DESC',
      [estado]
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorAgente(agenteId: string): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_contacto WHERE agente_asignado_id = $1 ORDER BY fecha_creacion DESC',
      [agenteId]
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPendientes(): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      `SELECT * FROM solicitudes_contacto 
       WHERE estado IN ('Pendiente', 'Asignada')
       ORDER BY fecha_creacion ASC`
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerVencidas(): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      `SELECT * FROM solicitudes_contacto 
       WHERE estado = 'Pendiente'
       AND fecha_creacion <= NOW() - INTERVAL '2 hours'
       ORDER BY fecha_creacion ASC`
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async actualizar(id: string, datos: Partial<SolicitudContacto>): Promise<SolicitudContacto> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const mapField = (key: string) => {
      const mapping: Record<string, string> = {
        pacienteId: 'paciente_id',
        nombreCompleto: 'nombre_completo',
        sucursalId: 'sucursal_id',
        sucursalNombre: 'sucursal_nombre',
        motivoDetalle: 'motivo_detalle',
        preferenciaContacto: 'preferencia_contacto',
        agenteAsignadoId: 'agente_asignado_id',
        agenteAsignadoNombre: 'agente_asignado_nombre',
        intentosContacto: 'intentos_contacto',
        ultimoIntento: 'ultimo_intento',
        fechaCreacion: 'fecha_creacion',
        fechaAsignacion: 'fecha_asignacion',
        fechaResolucion: 'fecha_resolucion',
        ultimaActualizacion: 'ultima_actualizacion',
        crmStatus: 'crm_status',
        crmResultado: 'crm_resultado',
        citaId: 'cita_id',
        noAfiliacion: 'no_afiliacion',
      };
      return mapping[key] || key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    };

    Object.entries(datos).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${mapField(key)} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    fields.push(`ultima_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE solicitudes_contacto
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerTodas(): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_contacto ORDER BY fecha_creacion DESC'
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  /** Leads aún no convertidos (sin cita creada). Usado por Contact Center. */
  async obtenerPendientesConversion(): Promise<SolicitudContacto[]> {
    const result = await this.pool.query(
      `SELECT * FROM solicitudes_contacto WHERE cita_id IS NULL ORDER BY fecha_creacion DESC`
    );
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPendientePorTelefono(telefono: string): Promise<SolicitudContacto | null> {
    const normalized = telefono.replace(/\D/g, '').slice(-10);
    if (normalized.length < 10) return null;
    const result = await this.pool.query(
      `SELECT * FROM solicitudes_contacto
       WHERE cita_id IS NULL AND estado IN ('Pendiente','Asignada','En_Contacto')
         AND (
           RIGHT(REGEXP_REPLACE(COALESCE(telefono,''), '[^0-9]', '', 'g'), 10) = $1
           OR RIGHT(REGEXP_REPLACE(COALESCE(whatsapp,''), '[^0-9]', '', 'g'), 10) = $1
         )
       ORDER BY fecha_creacion DESC LIMIT 1`,
      [normalized]
    );
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerEstadisticas(sucursalId?: string): Promise<{
    total: number;
    pendientes: number;
    asignadas: number;
    enContacto: number;
    resueltas: number;
    canceladas: number;
    tiempoPromedioResolucion: number;
  }> {
    const result = sucursalId
      ? await this.pool.query('SELECT * FROM solicitudes_contacto WHERE sucursal_id = $1', [sucursalId])
      : await this.pool.query('SELECT * FROM solicitudes_contacto');

    const solicitudes = result.rows.map((row) => this.mapToEntity(row));
    const total = solicitudes.length;
    const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente').length;
    const asignadas = solicitudes.filter((s) => s.estado === 'Asignada').length;
    const enContacto = solicitudes.filter((s) => s.estado === 'En_Contacto').length;
    const resueltas = solicitudes.filter((s) => s.estado === 'Resuelta').length;
    const canceladas = solicitudes.filter((s) => s.estado === 'Cancelada').length;

    const resueltasCompletas = solicitudes.filter((s) => s.estado === 'Resuelta' && s.fechaResolucion);
    let tiempoPromedioResolucion = 0;
    if (resueltasCompletas.length > 0) {
      const tiempos = resueltasCompletas.map((s) => {
        if (!s.fechaResolucion) return 0;
        return (s.fechaResolucion.getTime() - s.fechaCreacion.getTime()) / (1000 * 60);
      });
      tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    }

    return {
      total,
      pendientes,
      asignadas,
      enContacto,
      resueltas,
      canceladas,
      tiempoPromedioResolucion: Math.round(tiempoPromedioResolucion),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntity(row: any): SolicitudContacto {
    return {
      id: row.id,
      pacienteId: row.paciente_id || undefined,
      nombreCompleto: row.nombre_completo,
      telefono: row.telefono,
      email: row.email || undefined,
      whatsapp: row.whatsapp || undefined,
      sucursalId: row.sucursal_id,
      sucursalNombre: row.sucursal_nombre,
      motivo: row.motivo,
      motivoDetalle: row.motivo_detalle || undefined,
      preferenciaContacto: row.preferencia_contacto,
      estado: row.estado,
      prioridad: row.prioridad,
      agenteAsignadoId: row.agente_asignado_id || undefined,
      agenteAsignadoNombre: row.agente_asignado_nombre || undefined,
      intentosContacto: row.intentos_contacto || 0,
      ultimoIntento: row.ultimo_intento || undefined,
      notas: row.notas || undefined,
      resolucion: row.resolucion || undefined,
      origen: row.origen,
      creadoPor: row.creado_por,
      fechaCreacion: row.fecha_creacion,
      fechaAsignacion: row.fecha_asignacion || undefined,
      fechaResolucion: row.fecha_resolucion || undefined,
      ultimaActualizacion: row.ultima_actualizacion,
      crmStatus: row.crm_status || undefined,
      crmResultado: row.crm_resultado || undefined,
      citaId: row.cita_id || undefined,
      noAfiliacion: row.no_afiliacion || undefined,
    };
  }
}

/**
 * Implementación en memoria (para desarrollo)
 * En producción, usar MongoDB, PostgreSQL, etc.
 */
export class InMemorySolicitudContactoRepository implements SolicitudContactoRepository {
  private solicitudes: Map<string, SolicitudContacto> = new Map();

  async crear(solicitud: SolicitudContacto): Promise<SolicitudContacto> {
    this.solicitudes.set(solicitud.id, { ...solicitud });
    return { ...solicitud };
  }

  async obtenerPorId(id: string): Promise<SolicitudContacto | null> {
    const solicitud = this.solicitudes.get(id);
    return solicitud ? { ...solicitud } : null;
  }

  async obtenerPorSucursal(sucursalId: string): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.sucursalId === sucursalId)
      .map(s => ({ ...s }));
  }

  async obtenerPorSucursalNombre(sucursalNombre: string): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.sucursalNombre === sucursalNombre)
      .map(s => ({ ...s }));
  }

  async obtenerPorEstado(estado: EstadoSolicitud): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.estado === estado)
      .map(s => ({ ...s }));
  }

  async obtenerPorAgente(agenteId: string): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.agenteAsignadoId === agenteId)
      .map(s => ({ ...s }));
  }

  async obtenerPendientes(): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => s.estado === 'Pendiente' || s.estado === 'Asignada')
      .map(s => ({ ...s }));
  }

  async obtenerVencidas(): Promise<SolicitudContacto[]> {
    const ahora = new Date();
    return Array.from(this.solicitudes.values())
      .filter(s => {
        if (s.estado !== 'Pendiente') return false;
        const diffMs = ahora.getTime() - s.fechaCreacion.getTime();
        const diffMinutos = diffMs / (1000 * 60);
        return diffMinutos > 120; // Vencidas después de 2 horas
      })
      .map(s => ({ ...s }));
  }

  async actualizar(id: string, datos: Partial<SolicitudContacto>): Promise<SolicitudContacto> {
    const solicitud = this.solicitudes.get(id);
    
    if (!solicitud) {
      throw new Error(`Solicitud ${id} no encontrada`);
    }

    const actualizada = {
      ...solicitud,
      ...datos,
      ultimaActualizacion: new Date()
    };

    this.solicitudes.set(id, actualizada);
    return { ...actualizada };
  }

  async obtenerTodas(): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values()).map(s => ({ ...s }));
  }

  async obtenerPendientesConversion(): Promise<SolicitudContacto[]> {
    return Array.from(this.solicitudes.values())
      .filter(s => !s.citaId)
      .map(s => ({ ...s }));
  }

  async obtenerPendientePorTelefono(telefono: string): Promise<SolicitudContacto | null> {
    const normalized = telefono.replace(/\D/g, '').slice(-10);
    if (normalized.length < 10) return null;
    const activos = Array.from(this.solicitudes.values()).filter(
      (s) =>
        !s.citaId &&
        ['Pendiente', 'Asignada', 'En_Contacto'].includes(s.estado) &&
        (s.telefono?.replace(/\D/g, '').slice(-10) === normalized ||
          s.whatsapp?.replace(/\D/g, '').slice(-10) === normalized)
    );
    activos.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
    return activos[0] ? { ...activos[0] } : null;
  }

  async obtenerEstadisticas(sucursalId?: string): Promise<{
    total: number;
    pendientes: number;
    asignadas: number;
    enContacto: number;
    resueltas: number;
    canceladas: number;
    tiempoPromedioResolucion: number;
  }> {
    let solicitudes = Array.from(this.solicitudes.values());
    
    if (sucursalId) {
      solicitudes = solicitudes.filter(s => s.sucursalId === sucursalId);
    }

    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const asignadas = solicitudes.filter(s => s.estado === 'Asignada').length;
    const enContacto = solicitudes.filter(s => s.estado === 'En_Contacto').length;
    const resueltas = solicitudes.filter(s => s.estado === 'Resuelta').length;
    const canceladas = solicitudes.filter(s => s.estado === 'Cancelada').length;

    // Calcular tiempo promedio de resolución
    const resueltas_completas = solicitudes.filter(
      s => s.estado === 'Resuelta' && s.fechaResolucion
    );
    
    let tiempoPromedioResolucion = 0;
    if (resueltas_completas.length > 0) {
      const tiempos = resueltas_completas.map(s => {
        if (!s.fechaResolucion) return 0;
        return (s.fechaResolucion.getTime() - s.fechaCreacion.getTime()) / (1000 * 60);
      });
      tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    }

    return {
      total,
      pendientes,
      asignadas,
      enContacto,
      resueltas,
      canceladas,
      tiempoPromedioResolucion: Math.round(tiempoPromedioResolucion)
    };
  }

  /**
   * Método auxiliar para limpiar datos (útil en testing)
   */
  async limpiar(): Promise<void> {
    this.solicitudes.clear();
  }
}

// Instancia singleton para usar en toda la aplicación
export let solicitudContactoRepository: SolicitudContactoRepository = new InMemorySolicitudContactoRepository();

const initSolicitudContactoRepository = async (): Promise<void> => {
  try {
    const db = Database.getInstance();
    const connected = await db.testConnection();
    if (connected) {
      solicitudContactoRepository = new SolicitudContactoRepositoryPostgres();
    }
  } catch {
    // Mantener repositorio en memoria si DB no está disponible
  }
};

void initSolicitudContactoRepository();
