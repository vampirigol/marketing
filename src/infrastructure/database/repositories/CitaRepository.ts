import { Pool } from 'pg';
import { CitaEntity, Cita } from '../../../core/entities/Cita';
import Database from '../Database';

export interface CitaRepository {
  crear(cita: Cita): Promise<CitaEntity>;
  obtenerPorId(id: string): Promise<CitaEntity | null>;
  obtenerPorPaciente(pacienteId: string): Promise<CitaEntity[]>;
  obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<CitaEntity[]>;
  obtenerPorRango(fechaInicio: string, fechaFin: string, sucursalId?: string): Promise<CitaEntity[]>;
  obtenerPorDoctorYFecha(medicoAsignado: string, fecha: string): Promise<CitaEntity[]>;
  obtenerPorDoctorYRango(
    medicoAsignado: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<CitaEntity[]>;
  actualizar(id: string, cita: Partial<Cita>): Promise<CitaEntity>;
  verificarDisponibilidad(
    sucursalId: string,
    fecha: Date,
    hora: string,
    medicoAsignado?: string
  ): Promise<boolean>;
  
  /** Listado paginado con filtros (para vista lista). Incluye datos de paciente y sucursal. */
  listar(filtros: ListarCitasFiltros): Promise<{ citas: CitaListRow[]; total: number }>;

  // Métodos para schedulers
  buscarCitasPendientesVerificacion(): Promise<CitaEntity[]>;
  buscarCitasEnListaEspera(fechaInicio: Date, fechaFin: Date): Promise<CitaEntity[]>;
  obtenerPaciente(pacienteId: string): Promise<any>;
}

export interface ListarCitasFiltros {
  page: number;
  pageSize: number;
  search?: string;
  estado?: string;
  sucursalId?: string;
  medicoAsignado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

/** Fila de listado con datos de paciente y sucursal (camelCase para API) */
export interface CitaListRow {
  id: string;
  pacienteId: string;
  sucursalId: string;
  fechaCita: Date;
  horaCita: string;
  duracionMinutos: number;
  tipoConsulta: string;
  especialidad: string;
  medicoAsignado?: string;
  estado: string;
  esPromocion: boolean;
  reagendaciones: number;
  costoConsulta: number;
  montoAbonado: number;
  saldoPendiente: number;
  creadoPor?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
  notas?: string;
  motivoCancelacion?: string;
  pacienteNombre: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  sucursalNombre: string;
  appointmentType?: 'MEDICAL' | 'SPIRITUAL';
}

export class CitaRepositoryPostgres implements CitaRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(cita: Cita): Promise<CitaEntity> {
    const appointmentType = (cita as any).appointmentType ?? 'MEDICAL';
    const query = `
      INSERT INTO citas (
        paciente_id, sucursal_id, fecha_cita, hora_cita, duracion_minutos,
        tipo_consulta, especialidad, medico_asignado, estado, es_promocion,
        fecha_promocion, reagendaciones, costo_consulta, monto_abonado,
        saldo_pendiente, creado_por, notas, telemedicina_link, preconsulta, documentos,
        token_confirmacion, appointment_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      cita.pacienteId,
      cita.sucursalId,
      cita.fechaCita,
      cita.horaCita,
      cita.duracionMinutos,
      cita.tipoConsulta,
      cita.especialidad,
      cita.medicoAsignado,
      cita.estado,
      cita.esPromocion,
      cita.fechaPromocion,
      cita.reagendaciones,
      cita.costoConsulta,
      cita.montoAbonado,
      cita.saldoPendiente,
      cita.creadoPor,
      cita.notas,
      cita.telemedicinaLink,
      cita.preconsulta,
      cita.documentos,
      (cita as any).tokenConfirmacion ?? null,
      appointmentType,
    ];

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorId(id: string): Promise<CitaEntity | null> {
    const query = 'SELECT * FROM citas WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async obtenerPorPaciente(pacienteId: string): Promise<CitaEntity[]> {
    const query = `
      SELECT * FROM citas 
      WHERE paciente_id = $1
      ORDER BY fecha_cita DESC, hora_cita DESC
    `;

    const result = await this.pool.query(query, [pacienteId]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: Date | string): Promise<CitaEntity[]> {
    const fechaStr = typeof fecha === 'string'
      ? fecha.slice(0, 10)
      : fecha.toISOString().slice(0, 10);
    const query = `
      SELECT * FROM citas 
      WHERE sucursal_id = $1 
      AND fecha_cita = $2::date
      AND estado NOT IN ('Cancelada')
      ORDER BY hora_cita ASC
    `;
    const result = await this.pool.query(query, [sucursalId, fechaStr]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorRango(
    fechaInicio: string,
    fechaFin: string,
    sucursalId?: string
  ): Promise<CitaEntity[]> {
    const query = sucursalId
      ? `
        SELECT * FROM citas 
        WHERE sucursal_id = $1 
        AND fecha_cita BETWEEN $2::date AND $3::date
        AND estado NOT IN ('Cancelada')
        ORDER BY fecha_cita ASC, hora_cita ASC
      `
      : `
        SELECT * FROM citas 
        WHERE fecha_cita BETWEEN $1::date AND $2::date
        AND estado NOT IN ('Cancelada')
        ORDER BY fecha_cita ASC, hora_cita ASC
      `;
    const values = sucursalId
      ? [sucursalId, fechaInicio, fechaFin]
      : [fechaInicio, fechaFin];
    const result = await this.pool.query(query, values);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async listar(filtros: ListarCitasFiltros): Promise<{ citas: CitaListRow[]; total: number }> {
    const {
      page,
      pageSize,
      search,
      estado,
      sucursalId,
      medicoAsignado,
      fechaInicio,
      fechaFin,
      sortField = 'fecha_cita',
      sortDirection = 'desc',
    } = filtros;
    const offset = (page - 1) * pageSize;
    const sortColumnMap: Record<string, string> = {
      fecha: 'c.fecha_cita',
      paciente: 'p.nombre_completo',
      doctor: 'c.medico_asignado',
      estado: 'c.estado',
    };
    const orderColumn = sortColumnMap[sortField] ?? 'c.fecha_cita';
    const dir = sortDirection === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let idx = 1;

    if (estado && estado !== 'all') {
      conditions.push(`c.estado = $${idx++}`);
      values.push(estado);
    }
    if (sucursalId) {
      conditions.push(`c.sucursal_id = $${idx++}`);
      values.push(sucursalId);
    }
    if (medicoAsignado && medicoAsignado.trim()) {
      const param = medicoAsignado.trim();
      conditions.push(
        `(TRIM(REGEXP_REPLACE(COALESCE(c.medico_asignado, ''), '^(Dr\\.?|Dra\\.?)\\s*', '', 'i')) = $${idx} OR c.medico_asignado = $${idx}`
      );
      values.push(param);
      idx++;
    }
    if (fechaInicio) {
      conditions.push(`c.fecha_cita >= $${idx++}::date`);
      values.push(fechaInicio);
    }
    if (fechaFin) {
      conditions.push(`c.fecha_cita <= $${idx++}::date`);
      values.push(fechaFin);
    }
    if (search && search.trim()) {
      conditions.push(
        `(p.nombre_completo ILIKE $${idx} OR p.telefono ILIKE $${idx} OR c.medico_asignado ILIKE $${idx} OR c.especialidad ILIKE $${idx})`
      );
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, values);
    const total = countResult.rows[0]?.total ?? 0;

    const dataQuery = `
      SELECT c.*,
        p.nombre_completo AS paciente_nombre_completo,
        p.telefono AS paciente_telefono,
        p.email AS paciente_email,
        s.nombre AS sucursal_nombre
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN sucursales s ON c.sucursal_id = s.id
      WHERE ${whereClause}
      ORDER BY ${orderColumn} ${dir}, c.hora_cita ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const dataValues = [...values, pageSize, offset];
    const dataResult = await this.pool.query(dataQuery, dataValues);

    const citas: CitaListRow[] = dataResult.rows.map((row: any) => ({
      id: row.id,
      pacienteId: row.paciente_id,
      sucursalId: row.sucursal_id,
      fechaCita: row.fecha_cita,
      horaCita: row.hora_cita,
      duracionMinutos: row.duracion_minutos ?? 30,
      tipoConsulta: row.tipo_consulta ?? 'Primera_Vez',
      especialidad: row.especialidad ?? 'Medicina General',
      medicoAsignado: row.medico_asignado,
      estado: row.estado ?? 'Agendada',
      esPromocion: Boolean(row.es_promocion),
      reagendaciones: row.reagendaciones ?? 0,
      costoConsulta: parseFloat(row.costo_consulta) || 0,
      montoAbonado: parseFloat(row.monto_abonado) || 0,
      saldoPendiente: parseFloat(row.saldo_pendiente) || 0,
      creadoPor: row.creado_por,
      fechaCreacion: row.fecha_creacion,
      ultimaActualizacion: row.ultima_actualizacion,
      notas: row.notas,
      motivoCancelacion: row.motivo_cancelacion,
      pacienteNombre: row.paciente_nombre_completo ?? 'Paciente',
      pacienteTelefono: row.paciente_telefono,
      pacienteEmail: row.paciente_email,
      sucursalNombre: row.sucursal_nombre ?? 'Sucursal',
      appointmentType: row.appointment_type === 'SPIRITUAL' ? 'SPIRITUAL' : 'MEDICAL',
    }));

    return { citas, total };
  }

  async obtenerPorDoctorYFecha(medicoAsignado: string, fecha: string): Promise<CitaEntity[]> {
    const query = `
      SELECT * FROM citas
      WHERE medico_asignado = $1
      AND fecha_cita = $2::date
      AND estado NOT IN ('Cancelada')
      ORDER BY hora_cita ASC
    `;

    const result = await this.pool.query(query, [medicoAsignado, fecha]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async obtenerPorDoctorYRango(
    medicoAsignado: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<CitaEntity[]> {
    const query = `
      SELECT * FROM citas
      WHERE medico_asignado = $1
      AND fecha_cita BETWEEN $2::date AND $3::date
      AND estado NOT IN ('Cancelada')
      ORDER BY fecha_cita ASC, hora_cita ASC
    `;

    const result = await this.pool.query(query, [medicoAsignado, fechaInicio, fechaFin]);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  async actualizar(id: string, cita: Partial<Cita>): Promise<CitaEntity> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(cita).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = this.camelToSnake(key);
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    fields.push(`ultima_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE citas 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async verificarDisponibilidad(
    sucursalId: string,
    fecha: Date,
    hora: string,
    medicoAsignado?: string,
    options?: { duracionMinutos?: number; bufferMinutos?: number; capacidad?: number }
  ): Promise<boolean> {
    const duracion = options?.duracionMinutos ?? 30;
    const buffer = options?.bufferMinutos ?? 5;
    const capacidad = options?.capacidad ?? 3;

    const fechaStr = fecha instanceof Date ? fecha.toISOString().slice(0, 10) : String(fecha).slice(0, 10);

    const query = `
      SELECT hora_cita, duracion_minutos FROM citas 
      WHERE sucursal_id = $1 
      AND fecha_cita = $2::date 
      AND estado NOT IN ('Cancelada', 'No_Asistio')
      AND ($3::text IS NULL OR medico_asignado = $3 OR medico_asignado IS NULL)
    `;
    const result = await this.pool.query(query, [sucursalId, fechaStr, medicoAsignado || null]);

    const horaToMin = (h: string): number => {
      const parts = (h || '00:00').toString().split(':');
      return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
    };

    const newStart = horaToMin(hora);
    const newEnd = newStart + duracion + buffer;

    let overlappingCount = 0;
    for (const row of result.rows) {
      const h = row.hora_cita;
      const startMin = horaToMin(typeof h === 'string' ? h : (h?.toString?.() ?? '00:00'));
      const dur = parseInt(row.duracion_minutos, 10) || 30;
      const endMin = startMin + dur + buffer;
      if (newStart < endMin && newEnd > startMin) overlappingCount++;
    }

    return overlappingCount < capacidad;
  }

  private mapToEntity(row: any): CitaEntity {
    return new CitaEntity({
      id: row.id,
      pacienteId: row.paciente_id,
      sucursalId: row.sucursal_id,
      fechaCita: row.fecha_cita,
      horaCita: row.hora_cita,
      duracionMinutos: row.duracion_minutos,
      tipoConsulta: row.tipo_consulta,
      especialidad: row.especialidad,
      medicoAsignado: row.medico_asignado,
      appointmentType: (row.appointment_type === 'SPIRITUAL' ? 'SPIRITUAL' : 'MEDICAL') as 'MEDICAL' | 'SPIRITUAL',
      estado: row.estado,
      motivoCancelacion: row.motivo_cancelacion,
      esPromocion: row.es_promocion,
      fechaPromocion: row.fecha_promocion,
      reagendaciones: row.reagendaciones,
      horaLlegada: row.hora_llegada,
      horaAtencion: row.hora_atencion,
      horaSalida: row.hora_salida,
      costoConsulta: parseFloat(row.costo_consulta),
      montoAbonado: parseFloat(row.monto_abonado),
      saldoPendiente: parseFloat(row.saldo_pendiente),
      metodoPago: row.metodo_pago,
      creadoPor: row.creado_por,
      fechaCreacion: row.fecha_creacion,
      ultimaActualizacion: row.ultima_actualizacion,
      notas: row.notas,
      telemedicinaLink: row.telemedicina_link || undefined,
      preconsulta: row.preconsulta || undefined,
      documentos: row.documentos || undefined,
      tokenConfirmacion: row.token_confirmacion || undefined,
      confirmadaAt: row.confirmada_at || undefined,
    });
  }

  async obtenerPorTokenConfirmacion(token: string): Promise<CitaEntity | null> {
    const result = await this.pool.query(
      'SELECT * FROM citas WHERE token_confirmacion = $1',
      [token]
    );
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async confirmarPorToken(token: string): Promise<CitaEntity | null> {
    const result = await this.pool.query(
      `UPDATE citas SET estado = 'Confirmada', confirmada_at = CURRENT_TIMESTAMP, ultima_actualizacion = CURRENT_TIMESTAMP
       WHERE token_confirmacion = $1 AND estado = 'Agendada'
       RETURNING *`,
      [token]
    );
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  async buscarCitasPendientesVerificacion(): Promise<CitaEntity[]> {
    // TODO: Implementar búsqueda en base de datos
    return [];
  }

  async buscarCitasEnListaEspera(_fechaInicio: Date, _fechaFin: Date): Promise<CitaEntity[]> {
    // TODO: Implementar búsqueda en base de datos
    return [];
  }

  async obtenerPaciente(pacienteId: string): Promise<any> {
    const query = `
      SELECT id, nombre_completo, telefono, whatsapp, origen_lead
      FROM pacientes
      WHERE id = $1
    `;
    const result = await this.pool.query(query, [pacienteId]);
    if (result.rows.length === 0) {
      return { id: pacienteId, nombre: 'Paciente', canalPreferido: 'whatsapp' };
    }
    const row = result.rows[0];
    const canalPreferido = row.whatsapp || row.telefono ? 'whatsapp' : 'email';
    return {
      id: row.id,
      nombre: row.nombre_completo,
      telefono: row.telefono,
      whatsapp: row.whatsapp,
      origenLead: row.origen_lead,
      canalPreferido,
    };
  }
}

// Implementación en memoria para desarrollo/testing
export class InMemoryCitaRepository implements CitaRepository {
  private citas: Map<string, CitaEntity> = new Map();

  async crear(cita: Cita): Promise<CitaEntity> {
    const entity = new CitaEntity(cita);
    this.citas.set(entity.id, entity);
    return entity;
  }

  async obtenerPorId(id: string): Promise<CitaEntity | null> {
    return this.citas.get(id) || null;
  }

  async obtenerPorPaciente(pacienteId: string): Promise<CitaEntity[]> {
    return Array.from(this.citas.values()).filter(c => c.pacienteId === pacienteId);
  }

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<CitaEntity[]> {
    return Array.from(this.citas.values()).filter(
      c => c.sucursalId === sucursalId && c.fechaCita.toDateString() === fecha.toDateString()
    );
  }

  async obtenerPorRango(
    fechaInicio: string,
    fechaFin: string,
    sucursalId?: string
  ): Promise<CitaEntity[]> {
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T23:59:59');
    return Array.from(this.citas.values()).filter(c => {
      if (c.estado === 'Cancelada') return false;
      if (sucursalId && c.sucursalId !== sucursalId) return false;
      const d = c.fechaCita instanceof Date ? c.fechaCita : new Date(c.fechaCita);
      return d >= inicio && d <= fin;
    });
  }

  async listar(filtros: ListarCitasFiltros): Promise<{ citas: CitaListRow[]; total: number }> {
    let list = Array.from(this.citas.values());
    if (filtros.estado && filtros.estado !== 'all') {
      list = list.filter(c => c.estado === filtros.estado);
    }
    if (filtros.sucursalId) {
      list = list.filter(c => c.sucursalId === filtros.sucursalId);
    }
    if (filtros.medicoAsignado && filtros.medicoAsignado.trim()) {
      list = list.filter(c => (c.medicoAsignado || '') === filtros.medicoAsignado!.trim());
    }
    if (filtros.fechaInicio) {
      const d = new Date(filtros.fechaInicio + 'T00:00:00');
      list = list.filter(c => new Date(c.fechaCita) >= d);
    }
    if (filtros.fechaFin) {
      const d = new Date(filtros.fechaFin + 'T23:59:59');
      list = list.filter(c => new Date(c.fechaCita) <= d);
    }
    const total = list.length;
    const sortField = filtros.sortField ?? 'fecha';
    const sortDir = filtros.sortDirection === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fecha') {
        cmp = new Date(a.fechaCita).getTime() - new Date(b.fechaCita).getTime();
      } else if (sortField === 'paciente') {
        cmp = (a.pacienteId || '').localeCompare(b.pacienteId || '');
      } else if (sortField === 'doctor') {
        cmp = (a.medicoAsignado || '').localeCompare(b.medicoAsignado || '');
      } else if (sortField === 'estado') {
        cmp = (a.estado || '').localeCompare(b.estado || '');
      }
      return cmp * sortDir;
    });
    const page = filtros.page ?? 1;
    const pageSize = filtros.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const slice = list.slice(start, start + pageSize);
    const citas: CitaListRow[] = slice.map(c => ({
      id: c.id,
      pacienteId: c.pacienteId,
      sucursalId: c.sucursalId,
      fechaCita: c.fechaCita,
      horaCita: c.horaCita,
      duracionMinutos: c.duracionMinutos ?? 30,
      tipoConsulta: c.tipoConsulta ?? 'Primera_Vez',
      especialidad: c.especialidad ?? 'Medicina General',
      medicoAsignado: c.medicoAsignado,
      estado: c.estado,
      esPromocion: Boolean(c.esPromocion),
      reagendaciones: c.reagendaciones ?? 0,
      costoConsulta: c.costoConsulta ?? 0,
      montoAbonado: c.montoAbonado ?? 0,
      saldoPendiente: c.saldoPendiente ?? 0,
      creadoPor: c.creadoPor,
      fechaCreacion: c.fechaCreacion,
      ultimaActualizacion: c.ultimaActualizacion,
      notas: c.notas,
      motivoCancelacion: c.motivoCancelacion,
      pacienteNombre: 'Paciente',
      pacienteTelefono: undefined,
      pacienteEmail: undefined,
      sucursalNombre: 'Sucursal',
    }));
    return { citas, total };
  }

  async obtenerPorDoctorYFecha(medicoAsignado: string, fecha: string): Promise<CitaEntity[]> {
    const target = new Date(`${fecha}T00:00:00`);
    return Array.from(this.citas.values()).filter(
      c => c.medicoAsignado === medicoAsignado && c.fechaCita.toDateString() === target.toDateString()
    );
  }

  async obtenerPorDoctorYRango(
    medicoAsignado: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<CitaEntity[]> {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T23:59:59`);
    return Array.from(this.citas.values()).filter(
      c =>
        c.medicoAsignado === medicoAsignado &&
        c.fechaCita >= inicio &&
        c.fechaCita <= fin
    );
  }

  async actualizar(id: string, citaData: Partial<Cita>): Promise<CitaEntity> {
    const cita = this.citas.get(id);
    if (!cita) {
      throw new Error(`Cita ${id} no encontrada`);
    }
    Object.assign(cita, citaData);
    return cita;
  }

  async verificarDisponibilidad(
    sucursalId: string,
    fecha: Date,
    hora: string,
    medicoAsignado?: string
  ): Promise<boolean> {
    const citasEnHorario = Array.from(this.citas.values()).filter(
      c => c.sucursalId === sucursalId && 
           c.fechaCita.toDateString() === fecha.toDateString() &&
           c.horaCita === hora &&
           (!medicoAsignado || c.medicoAsignado === medicoAsignado)
    );
    return citasEnHorario.length < 3;
  }

  async buscarCitasPendientesVerificacion(): Promise<CitaEntity[]> {
    const ahora = new Date();
    return Array.from(this.citas.values()).filter(cita => {
      if (cita.estado !== 'Agendada' && cita.estado !== 'Confirmada') {
        return false;
      }
      
      // Verificar si la cita ya debería haber iniciado
      const [horas, minutos] = cita.horaCita.split(':').map(Number);
      const horaCita = new Date(cita.fechaCita);
      horaCita.setHours(horas, minutos, 0, 0);
      
      return horaCita <= ahora;
    });
  }

  async buscarCitasEnListaEspera(fechaInicio: Date, fechaFin: Date): Promise<CitaEntity[]> {
    return Array.from(this.citas.values()).filter(cita => {
      // Buscar citas que no asistieron en el rango de fechas
      return cita.estado === 'No_Asistio' &&
             cita.fechaCita >= fechaInicio &&
             cita.fechaCita <= fechaFin;
    });
  }

  async obtenerPaciente(pacienteId: string): Promise<any> {
    return { 
      id: pacienteId, 
      nombre: 'Paciente Simulado',
      telefono: '+525512345678',
      canalPreferido: 'whatsapp' 
    };
  }

  /** Para compatibilidad con exportación/ImportExportController */
  async obtenerTodas(): Promise<CitaEntity[]> {
    return Array.from(this.citas.values());
  }
}
