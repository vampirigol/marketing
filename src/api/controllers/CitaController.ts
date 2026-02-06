import { Request, Response } from 'express';
import { CitaRepositoryPostgres } from '../../infrastructure/database/repositories/CitaRepository';
import Database from '../../infrastructure/database/Database';
import { AuditoriaRepositoryPostgres } from '../../infrastructure/database/repositories/AuditoriaRepository';
import { PacienteRepositoryPostgres } from '../../infrastructure/database/repositories/PacienteRepository';
import { ReagendarPromocionUseCase } from '../../core/use-cases/ReagendarPromocion';
import { MarcarLlegadaUseCase } from '../../core/use-cases/MarcarLlegada';

export class CitaController {
  private repository: CitaRepositoryPostgres;
  private pacienteRepository: PacienteRepositoryPostgres;
  private auditoriaRepository: AuditoriaRepositoryPostgres;

  constructor() {
    this.repository = new CitaRepositoryPostgres();
    this.pacienteRepository = new PacienteRepositoryPostgres();
    this.auditoriaRepository = new AuditoriaRepositoryPostgres();
  }

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const citaData = req.body;
      const sinHorario = Boolean(citaData.sinHorario);
      const horaCita = sinHorario ? '00:00' : citaData.horaCita;
      const notasSinHorario = sinHorario
        ? `${citaData.notas ? `${citaData.notas} ` : ''}[SIN_HORARIO]`
        : citaData.notas;

      // Validar que el paciente existe
      const paciente = await this.pacienteRepository.obtenerPorId(citaData.pacienteId);
      if (!paciente) {
        res.status(404).json({
          success: false,
          message: 'Paciente no encontrado',
        });
        return;
      }

      // Usar el caso de uso CrearCita con todas las validaciones
      const { CrearCitaUseCase } = await import('../../core/use-cases/CrearCita');
      const crearCitaUseCase = new CrearCitaUseCase();
      
      const resultado = await crearCitaUseCase.ejecutar({
        pacienteId: citaData.pacienteId,
        sucursalId: citaData.sucursalId,
        fechaCita: new Date(citaData.fechaCita),
        horaCita,
        tipoConsulta: citaData.tipoConsulta,
        especialidad: citaData.especialidad,
        medicoAsignado: citaData.medicoAsignado,
        esPromocion: citaData.esPromocion || false,
        codigoPromocion: citaData.codigoPromocion,
        creadoPor: req.body.usuarioId || 'system',
        notas: notasSinHorario,
      });

      // Guardar en base de datos
      const cita = await this.repository.crear({
        ...resultado.cita,
        pacienteId: citaData.pacienteId,
        sucursalId: citaData.sucursalId,
        horaCita,
        duracionMinutos: sinHorario ? 0 : resultado.cita.duracionMinutos,
        notas: notasSinHorario,
      });

      await this.auditoriaRepository.registrar({
        entidad: 'cita',
        entidadId: cita.id,
        accion: 'crear',
        usuarioId: req.user?.id,
        usuarioNombre: req.user?.username,
        detalles: {
          sucursalId: cita.sucursalId,
          pacienteId: cita.pacienteId,
          fechaCita: cita.fechaCita,
          horaCita: cita.horaCita,
        },
      });

      res.status(201).json({
        success: true,
        message: resultado.mensaje,
        cita,
        advertencias: resultado.advertencias,
        confirmacionEnviada: resultado.confirmacionEnviada,
      });
    } catch (error: unknown) {
      console.error('Error al crear cita:', error);
      const statusCode = error instanceof Error && error.message.includes('CRÍTICO') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear la cita',
      });
    }
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cita = await this.repository.obtenerPorId(id);

      if (!cita) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        cita,
      });
    } catch (error: unknown) {
      console.error('Error al obtener cita:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener la cita',
      });
    }
  }

  async obtenerPorPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;
      const citas = await this.repository.obtenerPorPaciente(pacienteId);

      res.json({
        success: true,
        count: citas.length,
        citas,
      });
    } catch (error: unknown) {
      console.error('Error al obtener citas del paciente:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener las citas',
      });
    }
  }

  async obtenerPorSucursalYFecha(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const { fecha } = req.query;

      if (!fecha) {
        res.status(400).json({
          success: false,
          message: 'Fecha requerida',
        });
        return;
      }

      const citas = await this.repository.obtenerPorSucursalYFecha(
        sucursalId,
        new Date(fecha as string)
      );

      res.json({
        success: true,
        count: citas.length,
        citas,
      });
    } catch (error: unknown) {
      console.error('Error al obtener citas:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener las citas',
      });
    }
  }

  async obtenerDisponibilidad(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId, fecha, doctorId, inicio, fin, intervaloMin, maxEmpalmes } = req.query;

      if (!sucursalId || !fecha) {
        res.status(400).json({
          success: false,
          message: 'sucursalId y fecha son requeridos',
        });
        return;
      }

      const intervalo = intervaloMin ? parseInt(intervaloMin as string, 10) : 30;
      const capacidad = maxEmpalmes ? parseInt(maxEmpalmes as string, 10) : 3;
      const inicioHorario = (inicio as string) || '08:00';
      const finHorario = (fin as string) || '19:00';

      const citas = await this.repository.obtenerPorSucursalYFecha(
        sucursalId as string,
        new Date(fecha as string)
      );

      const citasFiltradas = doctorId
        ? citas.filter((cita) => cita.medicoAsignado === doctorId || cita.medicoAsignado === String(doctorId))
        : citas;

      const slots = this.generarSlots(inicioHorario, finHorario, intervalo).map((hora) => {
        const ocupadas = citasFiltradas.filter((cita) => cita.horaCita === hora && cita.horaCita !== '00:00').length;
        const cupoDisponible = Math.max(capacidad - ocupadas, 0);
        return {
          hora,
          disponible: cupoDisponible > 0,
          cupoDisponible,
          capacidad,
        };
      });

      res.json({
        success: true,
        sucursalId,
        fecha,
        doctorId: doctorId || null,
        intervaloMin: intervalo,
        maxEmpalmes: capacidad,
        slots,
      });
    } catch (error: unknown) {
      console.error('Error al obtener disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener disponibilidad',
      });
    }
  }

  async obtenerKpi(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId, fechaInicio, fechaFin } = req.query;
      const filtros: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (sucursalId) {
        filtros.push(`sucursal_id = $${idx}`);
        values.push(sucursalId);
        idx += 1;
      }

      if (fechaInicio) {
        filtros.push(`fecha_cita >= $${idx}`);
        values.push(fechaInicio);
        idx += 1;
      }

      if (fechaFin) {
        filtros.push(`fecha_cita <= $${idx}`);
        values.push(fechaFin);
        idx += 1;
      }

      const whereClause = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
      const pool = Database.getInstance().getPool();

      const query = `
        SELECT estado, COUNT(*)::int AS total
        FROM citas
        ${whereClause}
        GROUP BY estado
      `;

      const result = await pool.query(query, values);
      const totals: Record<string, number> = {};
      result.rows.forEach((row) => {
        totals[row.estado] = row.total;
      });

      const total = Object.values(totals).reduce((acc, val) => acc + val, 0);
      const confirmadas = totals.Confirmada || 0;
      const atendidas = totals.Atendida || 0;
      const noShow = totals.No_Asistio || 0;

      res.json({
        success: true,
        rango: { fechaInicio: fechaInicio || null, fechaFin: fechaFin || null },
        total,
        confirmadas,
        atendidas,
        noShow,
        tasas: {
          confirmacion: total > 0 ? Math.round((confirmadas / total) * 100) : 0,
          asistencia: confirmadas > 0 ? Math.round((atendidas / confirmadas) * 100) : 0,
          noShow: confirmadas > 0 ? Math.round((noShow / confirmadas) * 100) : 0,
        },
      });
    } catch (error: unknown) {
      console.error('Error al obtener KPI de citas:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener KPI',
      });
    }
  }

  async obtenerAlertasRiesgo(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.query;
      const values: any[] = [];
      let idx = 1;
      const filtroSucursal = sucursalId ? `AND sucursal_id = $${idx}` : '';
      if (sucursalId) {
        values.push(sucursalId);
        idx += 1;
      }

      const pool = Database.getInstance().getPool();
      const pendientesQuery = `
        SELECT COUNT(*)::int AS total
        FROM citas
        WHERE estado = 'Agendada'
        AND fecha_cita BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '1 day')
        ${filtroSucursal}
      `;
      const riesgoQuery = `
        SELECT COUNT(*)::int AS total
        FROM citas
        WHERE estado = 'Agendada'
        AND fecha_cita = CURRENT_DATE
        AND hora_cita <= (CURRENT_TIME + INTERVAL '2 hours')
        ${filtroSucursal}
      `;

      const [pendientesRes, riesgoRes] = await Promise.all([
        pool.query(pendientesQuery, values),
        pool.query(riesgoQuery, values),
      ]);

      res.json({
        success: true,
        pendientesConfirmacion: pendientesRes.rows[0]?.total || 0,
        riesgoNoShow: riesgoRes.rows[0]?.total || 0,
      });
    } catch (error: unknown) {
      console.error('Error al obtener alertas de riesgo:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener alertas',
      });
    }
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const citaActual = await this.repository.obtenerPorId(id);

      if (!citaActual) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      const sinHorario = Boolean(req.body.sinHorario);
      const horaCita = sinHorario
        ? '00:00'
        : req.body.horaCita || citaActual.horaCita;
      const notas = sinHorario
        ? `${req.body.notas ? `${req.body.notas} ` : ''}[SIN_HORARIO]`
        : req.body.notas;

      const citaActualizada = await this.repository.actualizar(id, {
        fechaCita: req.body.fechaCita ? new Date(req.body.fechaCita) : undefined,
        horaCita,
        tipoConsulta: req.body.tipoConsulta,
        especialidad: req.body.especialidad,
        medicoAsignado: req.body.medicoAsignado,
        notas,
        esPromocion: req.body.esPromocion,
        codigoPromocion: req.body.codigoPromocion,
      } as any);

      await this.auditoriaRepository.registrar({
        entidad: 'cita',
        entidadId: id,
        accion: 'actualizar',
        usuarioId: req.user?.id,
        usuarioNombre: req.user?.username,
        detalles: req.body,
      });

      res.json({
        success: true,
        message: 'Cita actualizada exitosamente',
        cita: citaActualizada,
      });
    } catch (error: unknown) {
      console.error('Error al actualizar cita:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar la cita',
      });
    }
  }

  async reagendar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nuevaFecha, nuevaHora, motivo, precioRegular } = req.body;

      // Validar campos requeridos
      if (!nuevaFecha || !nuevaHora) {
        res.status(400).json({
          success: false,
          message: 'Nueva fecha y hora son requeridas',
        });
        return;
      }

      const cita = await this.repository.obtenerPorId(id);
      if (!cita) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      // Validar disponibilidad del nuevo horario
      const disponible = await this.repository.verificarDisponibilidad(
        cita.sucursalId,
        nuevaFecha,
        nuevaHora
      );

      if (!disponible) {
        res.status(409).json({
          success: false,
          message: 'El nuevo horario no está disponible',
        });
        return;
      }

      // Usar el caso de uso para aplicar la REGLA DE ORO
      const reagendarUseCase = new ReagendarPromocionUseCase();
      const resultado = await reagendarUseCase.ejecutar({
        citaId: id,
        nuevaFecha: new Date(nuevaFecha),
        nuevaHora,
        usuarioId: req.body.usuarioId || 'system',
        sucursalId: cita.sucursalId,
        motivo,
        precioRegular: precioRegular || cita.costoConsulta // Si no viene, usar el actual
      });

      // Actualizar en base de datos con los cambios del caso de uso
      const citaActualizada = await this.repository.actualizar(id, {
        fechaCita: new Date(nuevaFecha),
        horaCita: nuevaHora,
        reagendaciones: resultado.cita.reagendaciones,
        esPromocion: resultado.cita.esPromocion,
        costoConsulta: resultado.cita.costoConsulta,
        saldoPendiente: resultado.cita.saldoPendiente,
      });

      await this.auditoriaRepository.registrar({
        entidad: 'cita',
        entidadId: id,
        accion: 'reagendar',
        usuarioId: req.user?.id,
        usuarioNombre: req.user?.username,
        detalles: {
          nuevaFecha,
          nuevaHora,
          motivo,
          precioRegular,
        },
      });

      res.json({
        success: true,
        message: resultado.mensaje,
        cita: citaActualizada,
        detalles: {
          promocionPerdida: resultado.promocionPerdida,
          precioAnterior: resultado.precioAnterior,
          precioNuevo: resultado.precioNuevo,
        }
      });
    } catch (error: unknown) {
      console.error('Error al reagendar cita:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al reagendar la cita',
      });
    }
  }

  async marcarLlegada(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cita = await this.repository.obtenerPorId(id);
      if (!cita) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      const marcarLlegadaUseCase = new MarcarLlegadaUseCase();
      const resultado = await marcarLlegadaUseCase.ejecutar({
        citaId: id,
        usuarioId: req.body.usuarioId || 'system',
        sucursalId: cita.sucursalId,
        horaLlegada: req.body.horaLlegada ? new Date(req.body.horaLlegada) : new Date()
      });

      // Determinar el nuevo estado basado en el resultado
      const nuevoEstado = resultado.estado === 'LISTA_ESPERA' ? 'No_Asistio' : 'Confirmada';

      const citaActualizada = await this.repository.actualizar(id, {
        estado: nuevoEstado,
        horaLlegada: resultado.cita.horaLlegada,
      });

      await this.auditoriaRepository.registrar({
        entidad: 'cita',
        entidadId: id,
        accion: 'llegada',
        usuarioId: req.user?.id,
        usuarioNombre: req.user?.username,
        detalles: {
          horaLlegada: req.body.horaLlegada || new Date(),
        },
      });

      res.json({
        success: true,
        message: resultado.mensaje,
        cita: citaActualizada,
        detalles: {
          estadoLlegada: resultado.estado,
          minutosRetraso: resultado.minutosRetraso,
          advertencia: resultado.estado === 'LLEGADA_TARDIA' 
            ? `Paciente llegó ${resultado.minutosRetraso} minutos tarde`
            : null
        }
      });
    } catch (error: unknown) {
      console.error('Error al marcar llegada:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al marcar la llegada',
      });
    }
  }

  /**
   * Valida si una cita puede reagendarse y muestra advertencias
   * Útil para que Keila vea el impacto antes de confirmar la reagendación
   */
  async validarReagendacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cita = await this.repository.obtenerPorId(id);
      if (!cita) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      const reagendarUseCase = new ReagendarPromocionUseCase();
      const validacion = reagendarUseCase.validarMantienePromocion(
        cita.reagendaciones,
        cita.esPromocion
      );

      res.json({
        success: true,
        cita: {
          id: cita.id,
          esPromocion: cita.esPromocion,
          reagendaciones: cita.reagendaciones,
          costoActual: cita.costoConsulta,
        },
        validacion: {
          puedeReagendar: validacion.puedeReagendar,
          mantienePromocion: validacion.mantienePromocion,
          advertencia: validacion.advertencia
        },
      });
    } catch (error: unknown) {
      console.error('Error al validar reagendación:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al validar la reagendación',
      });
    }
  }

  async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo || motivo.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'El motivo de cancelación es obligatorio',
        });
        return;
      }

      const cita = await this.repository.obtenerPorId(id);
      if (!cita) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      const citaActualizada = await this.repository.actualizar(id, {
        estado: 'Cancelada',
        motivoCancelacion: motivo,
      });

      await this.auditoriaRepository.registrar({
        entidad: 'cita',
        entidadId: id,
        accion: 'cancelar',
        usuarioId: req.user?.id,
        usuarioNombre: req.user?.username,
        detalles: { motivo },
      });

      res.json({
        success: true,
        message: 'Cita cancelada exitosamente',
        cita: citaActualizada,
      });
    } catch (error: unknown) {
      console.error('Error al cancelar cita:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al cancelar la cita',
      });
    }
  }

  private generarSlots(inicio: string, fin: string, intervalo: number): string[] {
    const slots: string[] = [];
    const [inicioH, inicioM] = inicio.split(':').map(Number);
    const [finH, finM] = fin.split(':').map(Number);

    let hora = inicioH;
    let minuto = inicioM;

    while (hora < finH || (hora === finH && minuto < finM)) {
      slots.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
      minuto += intervalo;
      if (minuto >= 60) {
        minuto -= 60;
        hora += 1;
      }
    }

    return slots;
  }
}
