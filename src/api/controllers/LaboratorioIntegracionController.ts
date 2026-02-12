import { Request, Response } from "express";
import { LaboratorioIntegracionRepositoryPostgres } from "../../infrastructure/database/repositories/LaboratorioIntegracionRepository";
import { OrdenLaboratorioRepositoryPostgres } from "../../infrastructure/database/repositories/OrdenLaboratorioRepository";
import { NotificacionRepositoryPostgres } from "../../infrastructure/database/repositories/NotificacionRepository";

export class LaboratorioIntegracionController {
  constructor(
    private integracionRepo: LaboratorioIntegracionRepositoryPostgres,
    private ordenRepo: OrdenLaboratorioRepositoryPostgres,
    private notificacionRepo: NotificacionRepositoryPostgres
  ) {}

  obtenerIntegraciones = async (req: Request, res: Response): Promise<void> => {
    try {
      const integraciones = await this.integracionRepo.obtenerIntegraciones();
      res.json({ integraciones });
    } catch (error: any) {
      console.error("Error al obtener integraciones:", error);
      res.status(500).json({ error: "Error al obtener integraciones" });
    }
  };

  enviarOrdenLaboratorio = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;
      const { laboratorioId } = req.body;

      // Obtener la orden
      const orden = await this.ordenRepo.obtenerPorId(ordenId);
      if (!orden) {
        res.status(404).json({ error: "Orden no encontrada" });
        return;
      }

      // Obtener la integración
      const integracion = await this.integracionRepo.obtenerIntegraciones();
      const laboratorio = integracion.find((l) => l.id === laboratorioId);

      if (!laboratorio) {
        res.status(404).json({ error: "Laboratorio no encontrado" });
        return;
      }

      // Simulación de envío (en producción aquí iría la integración real)
      const estado: "Enviado" | "Error" = "Enviado";
      let respuesta: any = {};
      let error: string | undefined;

      if (laboratorio.tipoIntegracion === "API") {
        // Simulación de llamada API
        respuesta = {
          success: true,
          idExterno: `EXT-${Date.now()}`,
          folioExterno: `LAB-${laboratorio.codigo}-${Math.floor(Math.random() * 100000)}`,
          mensaje: "Orden recibida y procesada correctamente",
          estudios: orden.estudios.map((e) => ({
            estudioId: e.estudioId,
            estado: "Pendiente",
          })),
        };
      } else if (laboratorio.tipoIntegracion === "Email") {
        // Simulación de envío por email
        respuesta = {
          emailEnviado: true,
          destinatario: laboratorio.emailContacto,
          asunto: `Nueva Orden: ${orden.folio}`,
        };
      } else {
        // Manual - solo registrar
        respuesta = {
          manual: true,
          mensaje: "Orden registrada para procesamiento manual",
        };
      }

      // Crear registro de envío
      const envio = await this.integracionRepo.crearEnvio({
        ordenId: orden.id,
        integracionId: laboratorio.id,
        estado,
        idExterno: respuesta.idExterno,
        folioExterno: respuesta.folioExterno,
        respuestaJson: respuesta,
        mensajeError: error,
      });

      // Actualizar estado de la orden
      await this.ordenRepo.actualizarEstado(ordenId, "En_Proceso");

      // Crear notificación
      await this.notificacionRepo.crear({
        usuarioId: orden.doctorId,
        tipo: "Alerta_Sistema",
        titulo: "Orden enviada al laboratorio",
        mensaje: `La orden ${orden.folio} ha sido enviada a ${laboratorio.nombre}`,
        data: { ordenId: orden.id, laboratorioNombre: laboratorio.nombre },
        canal: "App",
      });

      res.json({
        mensaje: "Orden enviada correctamente",
        envio,
        laboratorio: {
          nombre: laboratorio.nombre,
          codigo: laboratorio.codigo,
        },
      });
    } catch (error: any) {
      console.error("Error al enviar orden:", error);
      res.status(500).json({ error: "Error al enviar orden" });
    }
  };

  simularResultados = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;
      const { resultadosUrl, observaciones } = req.body;

      // Obtener la orden
      const orden = await this.ordenRepo.obtenerPorId(ordenId);
      if (!orden) {
        res.status(404).json({ error: "Orden no encontrada" });
        return;
      }

      // Registrar resultados
      const mockUrl = resultadosUrl || `https://resultados.lab.com/orden/${orden.folio}.pdf`;
      await this.ordenRepo.registrarResultados(
        ordenId,
        mockUrl,
        observaciones || "Resultados procesados y disponibles para consulta"
      );

      // Obtener envíos de esta orden
      const envios = await this.integracionRepo.obtenerEnviosPorOrden(ordenId);
      if (envios.length > 0) {
        await this.integracionRepo.registrarResultadosRecibidos(envios[0].id);
      }

      // Crear notificación para el doctor
      await this.notificacionRepo.crear({
        usuarioId: orden.doctorId,
        tipo: "Resultados_Laboratorio",
        titulo: "Resultados de laboratorio disponibles",
        mensaje: `Los resultados de la orden ${orden.folio} ya están disponibles`,
        data: { ordenId: orden.id, resultadosUrl: mockUrl },
        canal: "App",
      });

      res.json({
        mensaje: "Resultados registrados correctamente",
        orden: {
          folio: orden.folio,
          estado: "Completada",
          resultadosUrl: mockUrl,
        },
      });
    } catch (error: any) {
      console.error("Error al simular resultados:", error);
      res.status(500).json({ error: "Error al simular resultados" });
    }
  };

  obtenerEnviosOrden = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;

      const envios = await this.integracionRepo.obtenerEnviosPorOrden(ordenId);

      res.json({ envios });
    } catch (error: any) {
      console.error("Error al obtener envíos:", error);
      res.status(500).json({ error: "Error al obtener envíos" });
    }
  };
}
