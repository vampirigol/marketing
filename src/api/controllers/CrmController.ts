import { Request, Response } from 'express';
import { SolicitudContacto } from '../../core/entities/SolicitudContacto';
import { solicitudContactoRepository } from '../../infrastructure/database/repositories/SolicitudContactoRepository';

export class CrmController {
  async obtenerLeads(req: Request, res: Response): Promise<void> {
    const { sucursal } = req.query;
    const solicitudes = sucursal
      ? await solicitudContactoRepository.obtenerPorSucursal(String(sucursal))
      : await solicitudContactoRepository.obtenerTodas();

    const leads = solicitudes.map((solicitud) => mapSolicitudToLead(solicitud));

    res.json({ success: true, leads, total: leads.length });
  }

  async actualizarLead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resultado } = req.body as { status?: string; resultado?: string };

      if (!status) {
        res.status(400).json({ success: false, error: 'status es requerido' });
        return;
      }

      const estado = mapStatusToEstado(status, resultado);
      const actualizado = await solicitudContactoRepository.actualizar(id, {
        estado,
        crmStatus: status,
        crmResultado: resultado,
      });

      res.json({ success: true, lead: mapSolicitudToLead(actualizado) });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
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
      ...(resultado ? { CRM_Resultado: resultado } : {}),
    },
  };
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

function mapOrigenToCanal(origen: string) {
  switch (origen) {
    case 'WhatsApp':
      return 'whatsapp';
    case 'Facebook':
      return 'facebook';
    case 'Instagram':
      return 'instagram';
    case 'Telefono':
      return 'email';
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
    case 'open':
      return 'En_Contacto';
    case 'qualified':
      if (resultado === 'Perdido' || resultado === 'No show') return 'Cancelada';
      return 'Resuelta';
    default:
      return 'En_Contacto';
  }
}
