import { Pool } from 'pg';
import { CitaEntity, Cita } from '../../../core/entities/Cita';
import Database from '../Database';

export interface CitaRepository {
  crear(cita: Cita): Promise<CitaEntity>;
  obtenerPorId(id: string): Promise<CitaEntity | null>;
  obtenerPorPaciente(pacienteId: string): Promise<CitaEntity[]>;
  obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<CitaEntity[]>;
  actualizar(id: string, cita: Partial<Cita>): Promise<CitaEntity>;
  verificarDisponibilidad(sucursalId: string, fecha: Date, hora: string): Promise<boolean>;
  
  // Métodos para schedulers
  buscarCitasPendientesVerificacion(): Promise<CitaEntity[]>;
  buscarCitasEnListaEspera(fechaInicio: Date, fechaFin: Date): Promise<CitaEntity[]>;
  obtenerPaciente(pacienteId: string): Promise<any>;
}

export class CitaRepositoryPostgres implements CitaRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async crear(cita: Cita): Promise<CitaEntity> {
    const query = `
      INSERT INTO citas (
        paciente_id, sucursal_id, fecha_cita, hora_cita, duracion_minutos,
        tipo_consulta, especialidad, medico_asignado, estado, es_promocion,
        fecha_promocion, reagendaciones, costo_consulta, monto_abonado,
        saldo_pendiente, creado_por, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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

  async obtenerPorSucursalYFecha(sucursalId: string, fecha: Date): Promise<CitaEntity[]> {
    const query = `
      SELECT * FROM citas 
      WHERE sucursal_id = $1 
      AND fecha_cita = $2
      AND estado NOT IN ('Cancelada')
      ORDER BY hora_cita ASC
    `;

    const result = await this.pool.query(query, [sucursalId, fecha]);
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
    hora: string
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM citas 
      WHERE sucursal_id = $1 
      AND fecha_cita = $2 
      AND hora_cita = $3
      AND estado NOT IN ('Cancelada', 'No_Asistio')
    `;

    const result = await this.pool.query(query, [sucursalId, fecha, hora]);
    const count = parseInt(result.rows[0].count);

    // Permitir máximo 3 citas en el mismo horario (overbooking)
    return count < 3;
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
    });
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
    // TODO: Implementar obtención de paciente
    return { id: pacienteId, nombre: 'Paciente', canalPreferido: 'whatsapp' };
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

  async actualizar(id: string, citaData: Partial<Cita>): Promise<CitaEntity> {
    const cita = this.citas.get(id);
    if (!cita) {
      throw new Error(`Cita ${id} no encontrada`);
    }
    Object.assign(cita, citaData);
    return cita;
  }

  async verificarDisponibilidad(sucursalId: string, fecha: Date, hora: string): Promise<boolean> {
    const citasEnHorario = Array.from(this.citas.values()).filter(
      c => c.sucursalId === sucursalId && 
           c.fechaCita.toDateString() === fecha.toDateString() &&
           c.horaCita === hora
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
}
