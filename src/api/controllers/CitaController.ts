import { Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { CitaRepositoryPostgres } from '../../infrastructure/database/repositories/CitaRepository';

/** Quita prefijo Dr./Dra. del nombre para unificar con doctores-data y filtros */
function normalizarNombreMedico(n: string | undefined): string | undefined {
  if (!n || typeof n !== 'string') return n;
  const t = n.replace(/^(Dr\.?|Dra\.?)\s*/i, '').trim();
  return t || n;
}
import { ListaEsperaRepositoryPostgres } from '../../infrastructure/database/repositories/ListaEsperaRepository';
import { PlantillasMensajesCitasRepositoryPostgres } from '../../infrastructure/database/repositories/PlantillasMensajesCitasRepository';
import Database from '../../infrastructure/database/Database';
import { AuditoriaRepositoryPostgres } from '../../infrastructure/database/repositories/AuditoriaRepository';
import { PacienteRepositoryPostgres } from '../../infrastructure/database/repositories/PacienteRepository';
import { ReagendarPromocionUseCase } from '../../core/use-cases/ReagendarPromocion';
import { MarcarLlegadaUseCase } from '../../core/use-cases/MarcarLlegada';
import { solicitudContactoRepository } from '../../infrastructure/database/repositories/SolicitudContactoRepository';
import { SolicitudContactoEntity } from '../../core/entities/SolicitudContacto';
import { SucursalRepositoryPostgres } from '../../infrastructure/database/repositories/SucursalRepository';
import { BloqueoDoctorRepository } from '../../infrastructure/database/repositories/BloqueoDoctorRepository';
import { RecordatoriosCitasRepository } from '../../infrastructure/database/repositories/RecordatoriosCitasRepository';
import { SlotsReservadosRepository } from '../../infrastructure/database/repositories/SlotsReservadosRepository';
import { NotificationService } from '../../infrastructure/notifications/NotificationService';

export class CitaController {
  private repository: CitaRepositoryPostgres;
  private pacienteRepository: PacienteRepositoryPostgres;
  private auditoriaRepository: AuditoriaRepositoryPostgres;
  private bloqueoRepository: BloqueoDoctorRepository;
  private listaEsperaRepository: ListaEsperaRepositoryPostgres;
  private plantillasRepository: PlantillasMensajesCitasRepositoryPostgres;
  private recordatoriosRepo: RecordatoriosCitasRepository;
  private slotsRepo: SlotsReservadosRepository;
  private sucursalRepo: SucursalRepositoryPostgres;
  private notificationService: NotificationService;

  constructor() {
    this.repository = new CitaRepositoryPostgres();
    this.pacienteRepository = new PacienteRepositoryPostgres();
    this.auditoriaRepository = new AuditoriaRepositoryPostgres();
    this.bloqueoRepository = new BloqueoDoctorRepository();
    this.listaEsperaRepository = new ListaEsperaRepositoryPostgres();
    this.plantillasRepository = new PlantillasMensajesCitasRepositoryPostgres();
    this.recordatoriosRepo = new RecordatoriosCitasRepository();
    this.slotsRepo = new SlotsReservadosRepository();
    this.sucursalRepo = new SucursalRepositoryPostgres();
    this.notificationService = new NotificationService();
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

      // Normalizar fecha a día en UTC para evitar que zona horaria del servidor guarde otro día
      const fechaCitaRaw = new Date(citaData.fechaCita);
      const fechaCitaStr = fechaCitaRaw.toISOString().slice(0, 10);
      const fechaCitaNormalizada = new Date(fechaCitaStr + 'T12:00:00.000Z');

      const medicoAsignadoNorm = normalizarNombreMedico(citaData.medicoAsignado);
      const bloqueado = await this.estaBloqueado(
        medicoAsignadoNorm ?? citaData.medicoAsignado,
        fechaCitaStr,
        horaCita
      );
      if (bloqueado) {
        res.status(409).json({
          success: false,
          message: 'El doctor no tiene disponibilidad en ese horario',
        });
        return;
      }

      const duracionEstimada = this.duracionPorTipoConsulta(citaData.tipoConsulta);
      const disponible = await this.repository.verificarDisponibilidad(
        citaData.sucursalId,
        fechaCitaNormalizada,
        horaCita,
        medicoAsignadoNorm ?? citaData.medicoAsignado,
        { duracionMinutos: duracionEstimada, bufferMinutos: 5 }
      );
      if (!disponible) {
        res.status(409).json({
          success: false,
          message: 'El horario seleccionado ya no está disponible',
        });
        return;
      }

      // Usar el caso de uso CrearCita con todas las validaciones
      const { CrearCitaUseCase } = await import('../../core/use-cases/CrearCita');
      const crearCitaUseCase = new CrearCitaUseCase();
      
      const resultado = await crearCitaUseCase.ejecutar({
        pacienteId: citaData.pacienteId,
        sucursalId: citaData.sucursalId,
        fechaCita: fechaCitaNormalizada,
        horaCita,
        tipoConsulta: citaData.tipoConsulta,
        especialidad: citaData.especialidad,
        medicoAsignado: medicoAsignadoNorm ?? citaData.medicoAsignado,
        esPromocion: citaData.esPromocion || false,
        codigoPromocion: citaData.codigoPromocion,
        creadoPor: req.body.usuarioId || 'system',
        notas: notasSinHorario,
      });

      // Token para confirmación por enlace (estilo Bitrix24)
      const tokenConfirmacion = crypto.randomBytes(32).toString('hex');
      const cita = await this.repository.crear({
        ...resultado.cita,
        pacienteId: citaData.pacienteId,
        sucursalId: citaData.sucursalId,
        horaCita,
        duracionMinutos: sinHorario ? 0 : resultado.cita.duracionMinutos,
        notas: notasSinHorario,
        tokenConfirmacion,
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

      // Liberar slot holding si se usó (sessionId en body)
      const sessionId = citaData.sessionId;
      if (sessionId && !sinHorario) {
        try {
          await this.slotsRepo.liberar({
            sucursalId: cita.sucursalId,
            fechaCita: fechaCitaStr,
            horaCita,
            medicoAsignado: medicoAsignadoNorm ?? undefined,
            sessionId,
          });
        } catch (_) {
          /* ignorar */
        }
      }

      // Enviar confirmación WhatsApp (datos reales)
      let confirmacionEnviada = false;
      try {
        const sucursal = await this.sucursalRepo.obtenerPorId(cita.sucursalId);
        const resultadoNotif = await this.notificationService.enviarConfirmacionCita({
          cita,
          paciente,
          tipoNotificacion: 'confirmacion',
          datosAdicionales: {
            sucursalNombre: sucursal?.nombre,
            sucursalDireccion: sucursal?.direccion,
            doctorNombre: cita.medicoAsignado,
          },
        });
        confirmacionEnviada = resultadoNotif.enviado;
      } catch (err) {
        console.warn('No se pudo enviar confirmación WhatsApp:', err);
      }

      // Programar recordatorios persistentes (24h y 2h antes)
      const fechasRec = this.calcularFechasRecordatorios(fechaCitaStr, horaCita);
      if (fechasRec.recordatorio24h && !sinHorario) {
        try {
          await this.recordatoriosRepo.crear({
            citaId: cita.id,
            tipo: 'recordatorio_24h',
            fechaEjecucion: fechasRec.recordatorio24h,
          });
        } catch (_) {
          /* ignorar */
        }
      }
      if (fechasRec.recordatorio2h && !sinHorario) {
        try {
          await this.recordatoriosRepo.crear({
            citaId: cita.id,
            tipo: 'recordatorio_2h',
            fechaEjecucion: fechasRec.recordatorio2h,
          });
        } catch (_) {
          /* ignorar */
        }
      }

      res.status(201).json({
        success: true,
        message: resultado.mensaje,
        cita,
        advertencias: resultado.advertencias,
        confirmacionEnviada,
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

  async crearPublica(req: Request, res: Response): Promise<void> {
    try {
      const { paciente, ...citaData } = req.body;

      if (!paciente) {
        res.status(400).json({
          success: false,
          message: 'Paciente es requerido',
        });
        return;
      }

      if (!paciente.noAfiliacion || !paciente.telefono) {
        res.status(400).json({
          success: false,
          message: 'Paciente requiere noAfiliacion y telefono',
        });
        return;
      }

      const sinHorario = Boolean(citaData.sinHorario);
      const horaCita = sinHorario ? '00:00' : citaData.horaCita;

      let pacienteEntity = await this.pacienteRepository.obtenerPorTelefono(paciente.telefono);
      if (!pacienteEntity) {
        pacienteEntity = await this.pacienteRepository.crear(paciente);
      }

      const medicoAsignadoNorm = normalizarNombreMedico(citaData.medicoAsignado);
      const bloqueado = await this.estaBloqueado(
        medicoAsignadoNorm ?? citaData.medicoAsignado,
        String(citaData.fechaCita).slice(0, 10),
        horaCita
      );
      if (bloqueado) {
        res.status(409).json({
          success: false,
          message: 'El doctor no tiene disponibilidad en ese horario',
        });
        return;
      }

      const disponible = await this.repository.verificarDisponibilidad(
        citaData.sucursalId,
        new Date(citaData.fechaCita),
        horaCita,
        medicoAsignadoNorm ?? citaData.medicoAsignado
      );
      if (!disponible) {
        res.status(409).json({
          success: false,
          message: 'El horario seleccionado ya no está disponible',
        });
        return;
      }

      const { CrearCitaUseCase } = await import('../../core/use-cases/CrearCita');
      const crearCitaUseCase = new CrearCitaUseCase();

      const resultado = await crearCitaUseCase.ejecutar({
        pacienteId: pacienteEntity.id,
        sucursalId: citaData.sucursalId,
        fechaCita: new Date(citaData.fechaCita),
        horaCita,
        tipoConsulta: citaData.tipoConsulta,
        especialidad: citaData.especialidad,
        medicoAsignado: medicoAsignadoNorm ?? citaData.medicoAsignado,
        esPromocion: citaData.esPromocion || false,
        codigoPromocion: citaData.codigoPromocion,
        creadoPor: 'RCA Mobile',
        notas: citaData.notas,
      });

      const tokenConfirmacion = crypto.randomBytes(32).toString('hex');
      const cita = await this.repository.crear({
        ...resultado.cita,
        pacienteId: pacienteEntity.id,
        sucursalId: citaData.sucursalId,
        horaCita,
        duracionMinutos: sinHorario ? 0 : resultado.cita.duracionMinutos,
        notas: citaData.notas,
        telemedicinaLink: citaData.telemedicinaLink,
        preconsulta: citaData.preconsulta,
        documentos: citaData.documentos,
        tokenConfirmacion,
      });

      try {
        const sucursal = await this.sucursalRepo.obtenerPorId(citaData.sucursalId);
        const solicitud = new SolicitudContactoEntity({
          id: uuidv4(),
          pacienteId: pacienteEntity.id,
          nombreCompleto: pacienteEntity.nombreCompleto,
          telefono: pacienteEntity.telefono,
          email: pacienteEntity.email,
          whatsapp: pacienteEntity.whatsapp || pacienteEntity.telefono,
          sucursalId: citaData.sucursalId,
          sucursalNombre: sucursal?.nombre ?? 'Sucursal',
          motivo: 'Consulta_General',
          motivoDetalle: citaData.especialidad,
          preferenciaContacto: pacienteEntity.email ? 'Email' : 'WhatsApp',
          estado: 'Pendiente',
          prioridad: 'Media',
          intentosContacto: 0,
          origen: 'WhatsApp',
          creadoPor: 'RCA Mobile',
          fechaCreacion: new Date(),
          ultimaActualizacion: new Date(),
          crmStatus: 'agendados-mobile',
          crmResultado: undefined,
        });
        await solicitudContactoRepository.crear(solicitud);
      } catch (error) {
        console.warn('No se pudo crear lead CRM para cita mobile:', error);
      }

      // Liberar slot holding si se usó
      const sessionId = citaData.sessionId;
      if (sessionId && !sinHorario) {
        try {
          await this.slotsRepo.liberar({
            sucursalId: citaData.sucursalId,
            fechaCita: String(citaData.fechaCita).slice(0, 10),
            horaCita,
            medicoAsignado: medicoAsignadoNorm ?? undefined,
            sessionId,
          });
        } catch (_) {
          /* ignorar */
        }
      }

      // Enviar confirmación WhatsApp y programar recordatorios
      try {
        const sucursal = await this.sucursalRepo.obtenerPorId(citaData.sucursalId);
        await this.notificationService.enviarConfirmacionCita({
          cita,
          paciente: pacienteEntity,
          tipoNotificacion: 'confirmacion',
          datosAdicionales: {
            sucursalNombre: sucursal?.nombre,
            sucursalDireccion: sucursal?.direccion,
            doctorNombre: cita.medicoAsignado,
          },
        });
      } catch (_) {
        /* ignorar */
      }

      const fechaStr = String(citaData.fechaCita).slice(0, 10);
      const fechasRec = this.calcularFechasRecordatorios(fechaStr, horaCita);
      if (fechasRec.recordatorio24h && !sinHorario) {
        try {
          await this.recordatoriosRepo.crear({
            citaId: cita.id,
            tipo: 'recordatorio_24h',
            fechaEjecucion: fechasRec.recordatorio24h,
          });
        } catch (_) {
          /* ignorar */
        }
      }
      if (fechasRec.recordatorio2h && !sinHorario) {
        try {
          await this.recordatoriosRepo.crear({
            citaId: cita.id,
            tipo: 'recordatorio_2h',
            fechaEjecucion: fechasRec.recordatorio2h,
          });
        } catch (_) {
          /* ignorar */
        }
      }

      res.status(201).json({
        success: true,
        message: resultado.mensaje,
        cita,
        advertencias: resultado.advertencias,
      });
    } catch (error: unknown) {
      console.error('Error al crear cita publica:', error);
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

  async obtenerPorDoctorYFecha(req: Request, res: Response): Promise<void> {
    try {
      const { fecha, medico } = req.query;

      if (!fecha || !medico) {
        res.status(400).json({
          success: false,
          message: 'fecha y medico son requeridos',
        });
        return;
      }

      const citas = await this.repository.obtenerPorDoctorYFecha(
        String(medico),
        String(fecha)
      );

      const citasConPaciente = await Promise.all(
        citas.map(async (cita) => {
          const paciente = await this.pacienteRepository.obtenerPorId(cita.pacienteId);
          return {
            ...cita,
            fecha: cita.fechaCita instanceof Date ? cita.fechaCita.toISOString().slice(0, 10) : cita.fechaCita,
            pacienteNombre: paciente?.nombreCompleto,
            pacienteTelefono: paciente?.telefono,
          };
        })
      );

      res.json({
        success: true,
        count: citasConPaciente.length,
        citas: citasConPaciente,
      });
    } catch (error: unknown) {
      console.error('Error al obtener citas del doctor:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener las citas',
      });
    }
  }

  async obtenerPorDoctorYRango(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, medico } = req.query;

      if (!fechaInicio || !fechaFin || !medico) {
        res.status(400).json({
          success: false,
          message: 'fechaInicio, fechaFin y medico son requeridos',
        });
        return;
      }

      const citas = await this.repository.obtenerPorDoctorYRango(
        String(medico),
        String(fechaInicio),
        String(fechaFin)
      );

      const citasConPaciente = await Promise.all(
        citas.map(async (cita) => {
          const paciente = await this.pacienteRepository.obtenerPorId(cita.pacienteId);
          return {
            ...cita,
            fecha: cita.fechaCita instanceof Date ? cita.fechaCita.toISOString().slice(0, 10) : cita.fechaCita,
            pacienteNombre: paciente?.nombreCompleto,
            pacienteTelefono: paciente?.telefono,
          };
        })
      );

      res.json({
        success: true,
        count: citasConPaciente.length,
        citas: citasConPaciente,
      });
    } catch (error: unknown) {
      console.error('Error al obtener citas del doctor (rango):', error);
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

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        pageSize = '20',
        search,
        estado,
        sucursalId,
        medicoAsignado,
        fechaInicio,
        fechaFin,
        sortField = 'fecha',
        sortDirection = 'desc',
      } = req.query;

      const { citas, total } = await this.repository.listar({
        page: Math.max(1, parseInt(String(page), 10)),
        pageSize: Math.min(100, Math.max(1, parseInt(String(pageSize), 10))),
        search: typeof search === 'string' ? search : undefined,
        estado: typeof estado === 'string' ? estado : undefined,
        sucursalId: typeof sucursalId === 'string' ? sucursalId : undefined,
        medicoAsignado: typeof medicoAsignado === 'string' ? normalizarNombreMedico(medicoAsignado) : undefined,
        fechaInicio: typeof fechaInicio === 'string' ? fechaInicio : undefined,
        fechaFin: typeof fechaFin === 'string' ? fechaFin : undefined,
        sortField: typeof sortField === 'string' ? sortField : 'fecha',
        sortDirection: (sortDirection === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
      });

      res.json({
        success: true,
        citas,
        total,
        page: parseInt(String(page), 10),
        pageSize: parseInt(String(pageSize), 10),
      });
    } catch (error: unknown) {
      console.error('Error al listar citas:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al listar citas',
      });
    }
  }

  async obtenerPorRango(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, sucursalId } = req.query;

      if (!fechaInicio || !fechaFin) {
        res.status(400).json({
          success: false,
          message: 'fechaInicio y fechaFin son requeridos (YYYY-MM-DD)',
        });
        return;
      }

      const citas = await this.repository.obtenerPorRango(
        fechaInicio as string,
        fechaFin as string,
        typeof sucursalId === 'string' ? sucursalId : undefined
      );

      res.json({
        success: true,
        count: citas.length,
        citas,
      });
    } catch (error: unknown) {
      console.error('Error al obtener citas por rango:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener las citas',
      });
    }
  }

  async obtenerDisponibilidad(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const { fecha, doctorId, inicio, fin, intervaloMin, maxEmpalmes } = req.query;

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

      const fechaStr = String(fecha).slice(0, 10);
      const citas = await this.repository.obtenerPorSucursalYFecha(
        sucursalId as string,
        fechaStr
      );

      const doctorIdNorm = doctorId ? (normalizarNombreMedico(String(doctorId)) || String(doctorId)).trim() : null;
      const citasFiltradas = doctorIdNorm
        ? citas.filter((cita) => {
            const cNorm = (normalizarNombreMedico(cita.medicoAsignado) || cita.medicoAsignado || '').trim().toLowerCase();
            const docNorm = doctorIdNorm.toLowerCase();
            return cNorm === docNorm || (cita.medicoAsignado && cita.medicoAsignado.trim().toLowerCase() === docNorm);
          })
        : citas;

      const bloqueos = doctorIdNorm
        ? await this.bloqueoRepository.obtenerParaFecha(doctorIdNorm, fechaStr)
        : [];
      const slotsPromises = this.generarSlots(inicioHorario, finHorario, intervalo).map(async (hora) => {
        const ocupadas = this.contarCitasSolapadas(citasFiltradas, hora, 30, 5);
        let reservados = 0;
        try {
          reservados = await this.slotsRepo.contarReservados({
            sucursalId: sucursalId as string,
            fechaCita: fechaStr,
            horaCita: hora,
            medicoAsignado: doctorIdNorm ?? undefined,
          });
        } catch (_) {
          /* tabla puede no existir; continuar sin slot holding */
        }
        const cupoDisponible = Math.max(capacidad - ocupadas - reservados, 0);
        const bloqueado = this.bloqueaHorario(bloqueos, hora);
        return {
          hora,
          disponible: cupoDisponible > 0 && !bloqueado,
          cupoDisponible: bloqueado ? 0 : cupoDisponible,
          capacidad,
        };
      });
      const slots = await Promise.all(slotsPromises);

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

  async obtenerDisponibilidadPublica(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId } = req.params;
      const { fecha, doctorId, inicio, fin, intervaloMin, maxEmpalmes } = req.query;

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

      const fechaStr = String(fecha).slice(0, 10);
      const citas = await this.repository.obtenerPorSucursalYFecha(
        sucursalId as string,
        fechaStr
      );

      const doctorIdNorm = doctorId ? (normalizarNombreMedico(String(doctorId)) || String(doctorId)).trim() : null;
      const citasFiltradas = doctorIdNorm
        ? citas.filter((cita) => {
            const cNorm = (normalizarNombreMedico(cita.medicoAsignado) || cita.medicoAsignado || '').trim().toLowerCase();
            const docNorm = doctorIdNorm.toLowerCase();
            return cNorm === docNorm || (cita.medicoAsignado && cita.medicoAsignado.trim().toLowerCase() === docNorm);
          })
        : citas;

      const bloqueos = doctorIdNorm
        ? await this.bloqueoRepository.obtenerParaFecha(doctorIdNorm, fechaStr)
        : [];
      const slotsPromisesPub = this.generarSlots(inicioHorario, finHorario, intervalo).map(async (hora) => {
        const ocupadas = this.contarCitasSolapadas(citasFiltradas, hora, 30, 5);
        let reservados = 0;
        try {
          reservados = await this.slotsRepo.contarReservados({
            sucursalId: sucursalId as string,
            fechaCita: fechaStr,
            horaCita: hora,
            medicoAsignado: doctorIdNorm ?? undefined,
          });
        } catch (_) {
          /* tabla puede no existir; continuar sin slot holding */
        }
        const cupoDisponible = Math.max(capacidad - ocupadas - reservados, 0);
        const bloqueado = this.bloqueaHorario(bloqueos, hora);
        return {
          hora,
          disponible: cupoDisponible > 0 && !bloqueado,
          cupoDisponible: bloqueado ? 0 : cupoDisponible,
          capacidad,
        };
      });
      const slots = await Promise.all(slotsPromisesPub);

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
      console.error('Error al obtener disponibilidad publica:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener disponibilidad',
      });
    }
  }

  async obtenerOcupacion(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId, fechaInicio, fechaFin, medicoAsignado } = req.query;
      const pool = Database.getInstance().getPool();

      const conditions: string[] = ["estado NOT IN ('Cancelada')"];
      const values: unknown[] = [];
      let idx = 1;

      if (sucursalId) {
        conditions.push(`sucursal_id = $${idx++}`);
        values.push(sucursalId);
      }
      if (fechaInicio) {
        conditions.push(`fecha_cita >= $${idx++}::date`);
        values.push(fechaInicio);
      }
      if (fechaFin) {
        conditions.push(`fecha_cita <= $${idx++}::date`);
        values.push(fechaFin);
      }
      if (medicoAsignado) {
        conditions.push(`(medico_asignado = $${idx} OR TRIM(REGEXP_REPLACE(COALESCE(medico_asignado, ''), '^(Dr\\.?|Dra\\.?)\\s*', '', 'i')) = $${idx})`);
        values.push(medicoAsignado);
        idx++;
      }

      const whereClause = conditions.join(' AND ');

      const resumen = await pool.query(
        `SELECT 
          sucursal_id,
          medico_asignado,
          fecha_cita,
          COUNT(*)::int AS total_citas,
          COUNT(*) FILTER (WHERE estado = 'Atendida')::int AS atendidas,
          COUNT(*) FILTER (WHERE estado IN ('Agendada', 'Confirmada'))::int AS pendientes
         FROM citas
         WHERE ${whereClause}
         GROUP BY sucursal_id, medico_asignado, fecha_cita
         ORDER BY fecha_cita DESC, medico_asignado
         LIMIT 500`,
        values
      );

      const porHora = await pool.query(
        `SELECT 
          EXTRACT(HOUR FROM hora_cita)::int AS hora,
          COUNT(*)::int AS total
         FROM citas
         WHERE ${whereClause}
         GROUP BY EXTRACT(HOUR FROM hora_cita)
         ORDER BY hora`,
        values
      );

      res.json({
        success: true,
        resumen: resumen.rows,
        porHora: porHora.rows,
      });
    } catch (error: unknown) {
      console.error('Error al obtener ocupación:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener ocupación',
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
        medicoAsignado: normalizarNombreMedico(req.body.medicoAsignado) ?? req.body.medicoAsignado,
        notas,
        telemedicinaLink: req.body.telemedicinaLink,
        preconsulta: req.body.preconsulta,
        documentos: req.body.documentos,
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

      if (req.user?.rol === 'Medico') {
        const medicoNombre = req.user.nombreCompleto || req.user.username;
        if (cita.medicoAsignado !== medicoNombre) {
          res.status(403).json({
            success: false,
            message: 'Solo puedes cancelar citas asignadas a tu perfil',
          });
          return;
        }
      }

      // Validar disponibilidad del nuevo horario
      const disponible = await this.repository.verificarDisponibilidad(
        cita.sucursalId,
        nuevaFecha,
        nuevaHora,
        cita.medicoAsignado
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

      await this.recordatoriosRepo.cancelarPorCita(id);

      const fechaStr = String(nuevaFecha).slice(0, 10);
      const fechasRec = this.calcularFechasRecordatorios(fechaStr, nuevaHora);
      if (fechasRec.recordatorio24h) {
        try {
          await this.recordatoriosRepo.crear({
            citaId: id,
            tipo: 'recordatorio_24h',
            fechaEjecucion: fechasRec.recordatorio24h,
          });
        } catch (_) {
          /* ignorar */
        }
      }
      if (fechasRec.recordatorio2h) {
        try {
          await this.recordatoriosRepo.crear({
            citaId: id,
            tipo: 'recordatorio_2h',
            fechaEjecucion: fechasRec.recordatorio2h,
          });
        } catch (_) {
          /* ignorar */
        }
      }

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
   * POST /api/citas/:id/enviar-recordatorio
   * Envía recordatorio manual (24h o día de la cita) al paciente. Usado desde el embudo CRM.
   */
  async enviarRecordatorio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cita = await this.repository.obtenerPorId(id);
      if (!cita) {
        res.status(404).json({ success: false, message: 'Cita no encontrada' });
        return;
      }
      if (cita.estado === 'Cancelada' || cita.estado === 'No_Asistio' || cita.estado === 'Atendida') {
        res.status(400).json({
          success: false,
          message: 'No se puede enviar recordatorio para una cita cancelada, no asistida o ya atendida',
        });
        return;
      }
      const paciente = await this.pacienteRepository.obtenerPorId(cita.pacienteId);
      if (!paciente) {
        res.status(404).json({ success: false, message: 'Paciente no encontrado' });
        return;
      }
      const sucursal = await this.sucursalRepo.obtenerPorId(cita.sucursalId);
      const notif = {
        cita,
        paciente,
        tipoNotificacion: 'recordatorio_24h' as const,
        datosAdicionales: {
          sucursalNombre: sucursal?.nombre ?? 'Sucursal RCA',
          sucursalDireccion: sucursal?.direccion ?? '',
          doctorNombre: cita.medicoAsignado,
        },
      };
      const ahora = new Date();
      const fechaCita = typeof cita.fechaCita === 'string' ? new Date(cita.fechaCita) : cita.fechaCita;
      const esMismoDia =
        fechaCita.getFullYear() === ahora.getFullYear() &&
        fechaCita.getMonth() === ahora.getMonth() &&
        fechaCita.getDate() === ahora.getDate();
      const resultado = esMismoDia
        ? await this.notificationService.enviarRecordatorioDiaCita(notif)
        : await this.notificationService.enviarRecordatorio24h(notif);
      res.json({
        success: resultado.enviado,
        message: resultado.enviado ? 'Recordatorio enviado' : resultado.error ?? 'Error al enviar',
        canal: resultado.canal,
        error: resultado.error,
      });
    } catch (error: unknown) {
      console.error('Error al enviar recordatorio:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al enviar recordatorio',
      });
    }
  }

  /**
   * PUT /api/citas/:id/no-asistencia
   * Marca la cita como No_Asistio (sincronización con CRM/embudo).
   */
  async marcarNoAsistencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cita = await this.repository.obtenerPorId(id);
      if (!cita) {
        res.status(404).json({ success: false, message: 'Cita no encontrada' });
        return;
      }
      const actualizada = await this.repository.actualizar(id, { estado: 'No_Asistio' });
      await this.auditoriaRepository.registrar({
        entidad: 'cita',
        entidadId: id,
        accion: 'marcar_no_asistencia',
        usuarioId: req.user?.id,
        usuarioNombre: req.user?.username,
        detalles: {},
      });
      res.json({ success: true, message: 'Cita marcada como no asistencia', cita: actualizada });
    } catch (error: unknown) {
      console.error('Error al marcar no asistencia:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al marcar no asistencia',
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

      await this.recordatoriosRepo.cancelarPorCita(id);

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

  private async estaBloqueado(
    medicoAsignado: string | undefined,
    fecha: string,
    hora: string
  ): Promise<boolean> {
    if (!medicoAsignado) return false;
    const bloqueos = await this.bloqueoRepository.obtenerParaFecha(medicoAsignado, fecha);
    return this.bloqueaHorario(bloqueos, hora);
  }

  private bloqueaHorario(bloqueos: any[], hora: string): boolean {
    if (!bloqueos.length) return false;
    const minutoHora = this.horaToMin(hora);
    return bloqueos.some((bloqueo) => {
      const inicio = bloqueo.horaInicio ? this.horaToMin(bloqueo.horaInicio) : null;
      const fin = bloqueo.horaFin ? this.horaToMin(bloqueo.horaFin) : null;
      if (!inicio && !fin) {
        return true;
      }
      if (inicio !== null && fin !== null) {
        return minutoHora >= inicio && minutoHora < fin;
      }
      if (inicio !== null && fin === null) {
        return minutoHora >= inicio;
      }
      if (inicio === null && fin !== null) {
        return minutoHora < fin;
      }
      return false;
    });
  }

  private horaToMin(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  /** Cuenta citas que se solapan con un slot (considerando duración y buffer) */
  private contarCitasSolapadas(
    citas: Array<{ horaCita: string; duracionMinutos?: number }>,
    slotHora: string,
    duracionSlot: number,
    buffer: number
  ): number {
    const toMin = (h: string) => {
      const p = (h || '00:00').toString().split(':');
      return parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
    };
    const slotStart = toMin(slotHora);
    const slotEnd = slotStart + duracionSlot + buffer;

    return citas.filter((c) => {
      if (!c.horaCita || c.horaCita === '00:00') return false;
      const start = toMin(c.horaCita);
      const dur = c.duracionMinutos ?? 30;
      const end = start + dur + buffer;
      return slotStart < end && slotEnd > start;
    }).length;
  }

  private duracionPorTipoConsulta(tipo?: string): number {
    switch (tipo) {
      case 'Primera_Vez': return 45;
      case 'Subsecuente': return 30;
      case 'Urgencia': return 20;
      default: return 30;
    }
  }

  /** Calcula fechas de ejecución para recordatorios 24h y 2h antes */
  private calcularFechasRecordatorios(
    fechaStr: string,
    horaCita: string
  ): { recordatorio24h?: Date; recordatorio2h?: Date } {
    const citaDt = new Date(fechaStr + 'T' + horaCita + ':00');
    const ahora = new Date();
    const result: { recordatorio24h?: Date; recordatorio2h?: Date } = {};

    const rec24 = new Date(citaDt.getTime() - 24 * 60 * 60 * 1000);
    if (rec24 > ahora) result.recordatorio24h = rec24;

    const rec2 = new Date(citaDt.getTime() - 2 * 60 * 60 * 1000);
    if (rec2 > ahora) result.recordatorio2h = rec2;

    return result;
  }

  /** Slot holding: reserva temporal de slot (público) */
  async reservarSlot(req: Request, res: Response): Promise<void> {
    try {
      const { sucursalId, fechaCita, horaCita, sessionId, medicoAsignado } = req.body;
      if (!sucursalId || !fechaCita || !horaCita || !sessionId) {
        res.status(400).json({
          success: false,
          message: 'sucursalId, fechaCita, horaCita y sessionId son requeridos',
        });
        return;
      }

      const disponible = await this.repository.verificarDisponibilidad(
        sucursalId,
        new Date(fechaCita),
        horaCita,
        medicoAsignado
      );
      if (!disponible) {
        res.status(409).json({
          success: false,
          message: 'El horario ya no está disponible',
        });
        return;
      }

      const { id } = await this.slotsRepo.reservar({
        sucursalId,
        fechaCita: String(fechaCita).slice(0, 10),
        horaCita,
        medicoAsignado,
        sessionId,
        duracionMinutos: 10,
      });

      res.status(201).json({
        success: true,
        message: 'Slot reservado por 10 minutos',
        reservaId: id,
      });
    } catch (error: unknown) {
      console.error('Error al reservar slot:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al reservar slot',
      });
    }
  }

  /** Confirmación de cita por enlace (token) - endpoint público */
  async confirmarPorToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) {
        res.status(400).json({ ok: false, error: 'Token requerido' });
        return;
      }
      const cita = await this.repository.confirmarPorToken(token);
      if (!cita) {
        res.status(404).json({ ok: false, error: 'Token no válido o cita ya confirmada/cancelada' });
        return;
      }
      res.json({ ok: true, mensaje: 'Cita confirmada', citaId: cita.id });
    } catch (e) {
      console.error('confirmarPorToken', e);
      res.status(500).json({ ok: false, error: 'Error al confirmar la cita' });
    }
  }

  /** Lista de espera: crear solicitud (puede ser público o con auth) */
  async listaEsperaCrear(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        nombreCompleto: string;
        telefono: string;
        email?: string;
        sucursalId?: string;
        especialidad?: string;
        preferenciaFechaDesde?: string;
        preferenciaFechaHasta?: string;
        notas?: string;
      };
      if (!body.nombreCompleto || !body.telefono) {
        res.status(400).json({ error: 'nombreCompleto y telefono son requeridos' });
        return;
      }
      const solicitud = await this.listaEsperaRepository.crear({
        nombreCompleto: body.nombreCompleto,
        telefono: body.telefono,
        email: body.email,
        sucursalId: body.sucursalId,
        especialidad: body.especialidad,
        preferenciaFechaDesde: body.preferenciaFechaDesde ? new Date(body.preferenciaFechaDesde) : undefined,
        preferenciaFechaHasta: body.preferenciaFechaHasta ? new Date(body.preferenciaFechaHasta) : undefined,
        notas: body.notas,
        estado: 'Pendiente',
      });
      res.status(201).json(solicitud);
    } catch (e) {
      console.error('listaEsperaCrear', e);
      res.status(500).json({ error: 'Error al crear solicitud de lista de espera' });
    }
  }

  /** Lista de espera: listar (con auth) */
  async listaEsperaListar(req: Request, res: Response): Promise<void> {
    try {
      const estado = req.query.estado as string | undefined;
      const sucursalId = req.query.sucursalId as string | undefined;
      const lista = await this.listaEsperaRepository.listar({ estado, sucursalId });
      res.json(lista);
    } catch (e) {
      console.error('listaEsperaListar', e);
      res.status(500).json({ error: 'Error al listar lista de espera' });
    }
  }

  /** Lista de espera: asignar slot (crear cita y vincular) */
  async listaEsperaAsignar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as { citaId: string; pacienteId?: string };
      if (!body.citaId) {
        res.status(400).json({ error: 'citaId es requerido' });
        return;
      }
      const solicitud = await this.listaEsperaRepository.asignarCita(id, body.citaId, body.pacienteId);
      if (!solicitud) {
        res.status(404).json({ error: 'Solicitud no encontrada' });
        return;
      }
      res.json(solicitud);
    } catch (e) {
      console.error('listaEsperaAsignar', e);
      res.status(500).json({ error: 'Error al asignar cita a lista de espera' });
    }
  }

  /** Plantillas de mensajes: listar */
  async plantillasListar(req: Request, res: Response): Promise<void> {
    try {
      const lista = await this.plantillasRepository.listar();
      res.json(lista);
    } catch (e) {
      console.error('plantillasListar', e);
      res.status(500).json({ error: 'Error al listar plantillas' });
    }
  }

  /** Plantillas de mensajes: actualizar por tipo */
  async plantillasActualizar(req: Request, res: Response): Promise<void> {
    try {
      const { tipo } = req.params;
      const body = req.body as { titulo?: string; cuerpoTexto?: string; cuerpoWhatsapp?: string; activo?: boolean };
      const tiposValidos = ['nueva_cita', 'confirmacion_cita', 'recordatorio_cita', 'aviso_retraso'];
      if (!tiposValidos.includes(tipo)) {
        res.status(400).json({ error: 'Tipo de plantilla no válido' });
        return;
      }
      const plantilla = await this.plantillasRepository.actualizar(
        tipo as 'nueva_cita' | 'confirmacion_cita' | 'recordatorio_cita' | 'aviso_retraso',
        body
      );
      res.json(plantilla);
    } catch (e) {
      console.error('plantillasActualizar', e);
      res.status(500).json({ error: 'Error al actualizar plantilla' });
    }
  }
}
