/**
 * Convierte citas agendadas a leads para la etapa "Citas Locales" del Kanban.
 * Muestra citas de: módulo Citas, CRM, Doctores (no de redes sociales).
 */
import { Lead, CanalType } from '@/types/matrix';
import { citasService } from '@/lib/citas.service';
import { obtenerSucursalesDesdeCatalogo } from '@/lib/sucursales.service';
import { pacientesService } from '@/lib/pacientes.service';

interface CitaBackend {
  id: string;
  pacienteId: string;
  sucursalId: string;
  fechaCita: string;
  horaCita: string;
  duracionMinutos?: number;
  tipoConsulta?: string;
  especialidad?: string;
  medicoAsignado?: string;
  estado?: string;
  costoConsulta?: number;
  montoAbonado?: number;
  saldoPendiente?: number;
  notas?: string;
  sucursalNombre?: string;
}

function mapCitaToLead(cita: CitaBackend, pacienteNombre?: string): Lead {
  const fechaCita = new Date(cita.fechaCita);
  const fechaActualizacion = new Date(cita.fechaCita + 'T' + (cita.horaCita || '00:00'));
  return {
    id: `cita-${cita.id}`,
    nombre: pacienteNombre || 'Paciente',
    telefono: '',
    fechaCreacion: fechaCita,
    fechaActualizacion,
    status: 'citas-locales',
    canal: 'fan-page' as CanalType, // canal local (no redes)
    valorEstimado: cita.costoConsulta ?? 0,
    notas: `${cita.especialidad || ''} · ${cita.medicoAsignado || ''} ${cita.horaCita || ''}`.trim(),
    etiquetas: ['Cita Local', cita.estado || 'Agendada', cita.especialidad || ''].filter(Boolean),
    customFields: {
      CitaId: cita.id,
      PacienteId: cita.pacienteId,
      Sucursal: cita.sucursalNombre || 'Sucursal',
      Servicio: cita.especialidad || '',
      Doctor: cita.medicoAsignado || '',
      EstadoCita: cita.estado || 'Agendada',
      FechaCita: cita.fechaCita,
      HoraCita: cita.horaCita,
    },
  };
}

/**
 * Obtiene citas agendadas en un rango de fechas (todas las sucursales o una específica).
 * Convierte a leads para la columna Citas Locales.
 */
export async function obtenerLeadsCitasLocales(options?: {
  sucursalId?: string;
  sucursalNombre?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}): Promise<Lead[]> {
  const hoy = new Date();
  const inicio = options?.fechaInicio || hoy;
  const fin = options?.fechaFin || new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  let sucursales: Array<{ id: string; nombre: string }> = [];
  try {
    const desdeCatalogo = await obtenerSucursalesDesdeCatalogo();
    sucursales = desdeCatalogo.map((s) => ({ id: s.id, nombre: s.nombre }));
  } catch {
    // Fallback: intentar /sucursales
    try {
      const { obtenerSucursales } = await import('@/lib/sucursales.service');
      const data = await obtenerSucursales(true);
      sucursales = data.map((s) => ({ id: s.id, nombre: s.nombre }));
    } catch {
      return [];
    }
  }

  if (options?.sucursalId) {
    sucursales = sucursales.filter((s) => s.id === options.sucursalId);
  }
  if (options?.sucursalNombre) {
    sucursales = sucursales.filter((s) => s.nombre === options.sucursalNombre);
  }

  const citasAgregadas: CitaBackend[] = [];
  const cursor = new Date(inicio);
  cursor.setHours(0, 0, 0, 0);
  const finDate = new Date(fin);
  finDate.setHours(23, 59, 59, 999);

  while (cursor <= finDate) {
    const fechaStr = cursor.toISOString().split('T')[0];
    for (const suc of sucursales) {
      try {
        const citas = await citasService.obtenerPorSucursalYFecha(suc.id, fechaStr);
        for (const c of citas as CitaBackend[]) {
          citasAgregadas.push({ ...c, sucursalNombre: suc.nombre });
        }
      } catch {
        // Ignorar errores por sucursal/fecha
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const pacienteIds = Array.from(new Set(citasAgregadas.map((c) => c.pacienteId)));
  const pacientesMap = new Map<string, string>();
  await Promise.all(
    pacienteIds.map(async (id) => {
      try {
        const p = await pacientesService.obtenerPorId(id);
        if (p?.nombreCompleto) pacientesMap.set(id, p.nombreCompleto);
      } catch {
        // ignorar
      }
    })
  );

  return citasAgregadas.map((c) => mapCitaToLead(c, pacientesMap.get(c.pacienteId)));
}
