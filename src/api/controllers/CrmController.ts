import { Request, Response } from 'express';
import { SolicitudContacto } from '../../core/entities/SolicitudContacto';
import { solicitudContactoRepository } from '../../infrastructure/database/repositories/SolicitudContactoRepository';
import { PacienteRepositoryPostgres } from '../../infrastructure/database/repositories/PacienteRepository';
import { CitaRepositoryPostgres } from '../../infrastructure/database/repositories/CitaRepository';

export class CrmController {
  private pacienteRepository = new PacienteRepositoryPostgres();
  private citaRepository = new CitaRepositoryPostgres();

  async obtenerLeads(req: Request, res: Response): Promise<void> {
    const { sucursal } = req.query;
    let solicitudes;
    if (sucursal) {
      const valor = String(sucursal);
      const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
      solicitudes = esUuid
        ? await solicitudContactoRepository.obtenerPorSucursal(valor)
        : await solicitudContactoRepository.obtenerPorSucursalNombre(valor);
    } else {
      // Contact Center: solo leads aún no convertidos (sin cita creada)
      solicitudes = await solicitudContactoRepository.obtenerPendientesConversion();
    }
    const leads = solicitudes.map((solicitud) => mapSolicitudToLead(solicitud));
    res.json({ success: true, leads, total: leads.length });
  }

  async actualizarLead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resultado, citaId, sucursalId, sucursalNombre } = req.body as {
        status?: string;
        resultado?: string;
        citaId?: string;
        sucursalId?: string;
        sucursalNombre?: string;
      };

      if (!status) {
        res.status(400).json({ success: false, error: 'status es requerido' });
        return;
      }

      if (id.startsWith('cita-')) {
        res.status(400).json({
          success: false,
          error: 'Los leads de Citas Locales no se actualizan por este endpoint. Use el módulo de Citas.',
        });
        return;
      }

      const estado = mapStatusToEstado(status, resultado);
      const updateData: Parameters<typeof solicitudContactoRepository.actualizar>[1] = {
        estado,
        crmStatus: status,
        crmResultado: resultado,
      };
      if (citaId !== undefined) updateData.citaId = citaId;
      if (sucursalId !== undefined) updateData.sucursalId = sucursalId;
      if (sucursalNombre !== undefined) updateData.sucursalNombre = sucursalNombre;

      const actualizado = await solicitudContactoRepository.actualizar(id, updateData);

      res.json({ success: true, lead: mapSolicitudToLead(actualizado) });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * Sincroniza solicitudes de contacto (CRM) a citas. Idempotente: omite solicitudes
   * ya sincronizadas (notas con CITA_SYNC:) y evita duplicados (notas con CRM:solicitudId).
   * Debe invocarse desde el módulo CRM o con un botón explícito, no al abrir la agenda.
   */
  async sincronizarCitas(req: Request, res: Response): Promise<void> {
    try {
      const solicitudes = await solicitudContactoRepository.obtenerTodas();
      const hoy = new Date();
      const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechasDestino = [
        fechaHoy,
        getNextWeekday(1), // lunes siguiente
        getNextWeekday(2), // martes siguiente
      ];
      const horarios = generarHorarios('09:00', '17:00', 30);

      let creadas = 0;
      let omitidas = 0;
      const errores = 0;
      let index = 0;

      for (const solicitud of solicitudes) {
        if (solicitud.notas?.includes('CITA_SYNC:')) {
          omitidas += 1;
          continue;
        }

        let paciente = solicitud.pacienteId
          ? await this.pacienteRepository.obtenerPorId(solicitud.pacienteId)
          : null;

        if (!paciente && solicitud.telefono) {
          paciente = await this.pacienteRepository.obtenerPorTelefono(solicitud.telefono);
        }

        if (!paciente) {
          const fechaNacimiento = new Date(hoy.getFullYear() - 30, 0, 1);
          paciente = await this.pacienteRepository.crear({
            id: 'temp',
            nombreCompleto: solicitud.nombreCompleto,
            telefono: solicitud.telefono,
            whatsapp: solicitud.whatsapp,
            email: solicitud.email,
            fechaNacimiento,
            edad: 30,
            sexo: 'Otro',
            noAfiliacion: `CRM-${solicitud.id.slice(0, 8)}`,
            tipoAfiliacion: 'Particular',
            ciudad: solicitud.sucursalNombre || 'Guadalajara',
            estado: 'Jalisco',
            origenLead: mapOrigenLead(solicitud.origen),
            fechaRegistro: new Date(),
            ultimaActualizacion: new Date(),
            activo: true,
          });
        }

        if (!solicitud.pacienteId && paciente?.id) {
          await solicitudContactoRepository.actualizar(solicitud.id, {
            pacienteId: paciente.id,
          });
        }

        const citasPrevias = await this.citaRepository.obtenerPorPaciente(paciente.id);
        const yaExiste = citasPrevias.some((cita) =>
          String(cita.notas || '').includes(`CRM:${solicitud.id}`)
        );

        if (yaExiste) {
          omitidas += 1;
          continue;
        }

        const fechaCita = fechasDestino[index % fechasDestino.length];
        const horaCita = horarios[index % horarios.length];
        const medicoAsignado = obtenerDoctorPorSucursal(solicitud.sucursalNombre);

        await this.citaRepository.crear({
          id: 'temp',
          pacienteId: paciente.id,
          sucursalId: solicitud.sucursalId,
          fechaCita,
          horaCita,
          duracionMinutos: 30,
          tipoConsulta: 'Primera_Vez',
          especialidad: solicitud.motivo || 'Medicina General',
          medicoAsignado,
          estado: 'Agendada',
          esPromocion: false,
          fechaPromocion: undefined,
          reagendaciones: 0,
          costoConsulta: 500,
          montoAbonado: 0,
          saldoPendiente: 500,
          creadoPor: req.user?.username || 'crm-sync',
          fechaCreacion: new Date(),
          ultimaActualizacion: new Date(),
          notas: `Creada desde CRM · CRM:${solicitud.id} · [SIN_HORARIO]`,
        });

        await solicitudContactoRepository.actualizar(solicitud.id, {
          notas: `${solicitud.notas ? `${solicitud.notas} ` : ''}CITA_SYNC:${fechaCita.toISOString()}`,
        });

        creadas += 1;
        index += 1;
      }

      res.json({
        success: true,
        total: solicitudes.length,
        creadas,
        omitidas,
        errores,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}

/** Mapa sucursal -> doctor por defecto (debe coincidir con nombre en usuarios/rol Medico) */
const DOCTORES_POR_SUCURSAL: Record<string, string> = {
  'Ciudad Obregón': 'Aslysh Aboyte',
  'Ciudad Juárez': 'Edni González',
  'Guadalajara': 'Dra. Tirsa Abisag Espinoza',
  'Loreto Héroes': 'Gregorio Pérez',
  'Loreto Centro': 'Nancy Grijalva',
  'Clínica Adventista Virtual': 'Yamila Arredondo',
  'Valle de la Trinidad': 'Dra. Tirsa Abisag Espinoza',
};

function obtenerDoctorPorSucursal(sucursalNombre?: string): string | undefined {
  if (!sucursalNombre) return undefined;
  return DOCTORES_POR_SUCURSAL[sucursalNombre] ?? DOCTORES_POR_SUCURSAL['Ciudad Obregón'];
}

function getNextWeekday(dayIndex: number): Date {
  const today = new Date();
  const result = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentDay = result.getDay();
  const target = dayIndex % 7;
  let diff = target - currentDay;
  if (diff <= 0) diff += 7;
  diff += 7; // forzar semana siguiente
  result.setDate(result.getDate() + diff);
  return result;
}

function generarHorarios(inicio: string, fin: string, intervaloMin: number): string[] {
  const [inicioH, inicioM] = inicio.split(':').map(Number);
  const [finH, finM] = fin.split(':').map(Number);
  const horarios: string[] = [];
  let hora = inicioH;
  let minuto = inicioM;

  while (hora < finH || (hora === finH && minuto <= finM)) {
    horarios.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
    minuto += intervaloMin;
    if (minuto >= 60) {
      minuto -= 60;
      hora += 1;
    }
  }

  return horarios;
}

function mapSolicitudToLead(solicitud: SolicitudContacto) {
  const status = solicitud.crmStatus || mapEstadoToStatus(solicitud.estado);
  const canal = mapOrigenToCanal(solicitud.origen);
  const resultado = solicitud.crmResultado || mapEstadoToResultado(solicitud.estado);

  return {
    id: solicitud.id,
    nombre: solicitud.nombreCompleto,
    email: solicitud.email,
    telefono: solicitud.telefono,
    fechaCreacion: solicitud.fechaCreacion,
    fechaActualizacion: solicitud.ultimaActualizacion,
    status,
    canal,
    etiquetas: [solicitud.motivo, solicitud.estado],
    customFields: {
      Sucursal: solicitud.sucursalNombre,
      Servicio: solicitud.motivo,
      Origen: solicitud.origen,
      Intentos: solicitud.intentosContacto,
      ...(solicitud.noAfiliacion ? { NoAfiliacion: solicitud.noAfiliacion } : {}),
      ...(solicitud.citaId ? { CitaId: solicitud.citaId } : {}),
      ...(resultado ? { CRM_Resultado: resultado } : {}),
    },
  };
}

function mapOrigenLead(origen?: string): 'WhatsApp' | 'Facebook' | 'Instagram' | 'Llamada' | 'Presencial' | 'Referido' {
  switch (origen) {
    case 'WhatsApp':
    case 'Facebook':
    case 'Instagram':
      return origen;
    case 'Telefono':
      return 'Llamada';
    case 'Web':
      return 'Referido';
    default:
      return 'Referido';
  }
}

function mapEstadoToStatus(estado: string) {
  switch (estado) {
    case 'Pendiente':
      return 'new';
    case 'Asignada':
      return 'reviewing';
    case 'En_Contacto':
      return 'in-progress';
    case 'Resuelta':
      return 'qualified';
    case 'Cancelada':
      return 'qualified';
    default:
      return 'reviewing';
  }
}

function mapEstadoToResultado(estado: string) {
  switch (estado) {
    case 'Resuelta':
      return 'Atendida';
    case 'Cancelada':
      return 'Perdido';
    default:
      return undefined;
  }
}

function mapOrigenToCanal(origen: string): string {
  switch (origen) {
    case 'WhatsApp':
      return 'whatsapp';
    case 'Facebook':
      return 'facebook';
    case 'Instagram':
      return 'instagram';
    case 'Telefono':
      return 'email';
    case 'TikTok':
      return 'tiktok';
    case 'YouTube':
      return 'youtube';
    case 'Email':
      return 'email';
    case 'Web':
      return 'fan-page';
    default:
      return 'whatsapp';
  }
}

function mapStatusToEstado(status: string, resultado?: string) {
  switch (status) {
    case 'new':
      return 'Pendiente';
    case 'reviewing':
      return 'Asignada';
    case 'in-progress':
      return 'En_Contacto';
    case 'agendados-mobile':
      return 'En_Contacto';
    case 'citas-locales':
      return 'En_Contacto';
    case 'open':
      return 'En_Contacto';
    case 'qualified':
      if (resultado === 'Perdido' || resultado === 'No show') return 'Cancelada';
      return 'Resuelta';
    default:
      return 'En_Contacto';
  }
}
