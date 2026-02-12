import { Request, Response } from "express";
import { OrdenLaboratorioRepositoryPostgres } from "../../infrastructure/database/repositories/OrdenLaboratorioRepository";

interface EstudioOrdenInput {
  estudioId: string | number;
}

export class OrdenLaboratorioController {
  constructor(private ordenRepo: OrdenLaboratorioRepositoryPostgres) {}

  obtenerCatalogoEstudios = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoria } = req.query;

      const estudios = await this.ordenRepo.obtenerCatalogoEstudios(
        categoria as string | undefined
      );

      res.json({ estudios });
    } catch (error: unknown) {
      console.error("Error al obtener catálogo de estudios:", error);
      res.status(500).json({ error: "Error al obtener catálogo de estudios" });
    }
  };

  obtenerCategorias = async (req: Request, res: Response): Promise<void> => {
    try {
      const categorias = await this.ordenRepo.obtenerCategoriasEstudios();
      res.json({ categorias });
    } catch (error: unknown) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  };

  crearOrden = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = req.user;
      if (!usuario) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }
      const {
        pacienteId,
        consultaId,
        diagnosticoPresuntivo,
        indicacionesEspeciales,
        esUrgente,
        laboratorioExterno,
        fechaResultadosEsperados,
        estudios,
      } = req.body;

      if (!pacienteId || !diagnosticoPresuntivo || !estudios || estudios.length === 0) {
        res.status(400).json({
          error: "Faltan datos obligatorios (pacienteId, diagnosticoPresuntivo, estudios)",
        });
        return;
      }

      const orden = await this.ordenRepo.crear({
        pacienteId,
        doctorId: usuario.id,
        consultaId,
        sucursalId: usuario.sucursalId,
        fechaOrden: new Date().toISOString(),
        diagnosticoPresuntivo,
        indicacionesEspeciales,
        esUrgente: esUrgente || false,
        estado: "Pendiente",
        laboratorioExterno,
        fechaResultadosEsperados,
        firmado: false,
        estudios: estudios.map((e: EstudioOrdenInput) => ({
          estudioId: e.estudioId,
          estado: "Pendiente",
        })),
      });

      res.status(201).json({ orden });
    } catch (error: unknown) {
      console.error("Error al crear orden:", error);
      res.status(500).json({ error: "Error al crear orden" });
    }
  };

  obtenerOrdenesPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pacienteId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const ordenes = await this.ordenRepo.obtenerPorPaciente(pacienteId, limit);

      res.json({ ordenes });
    } catch (error: unknown) {
      console.error("Error al obtener órdenes:", error);
      res.status(500).json({ error: "Error al obtener órdenes" });
    }
  };

  obtenerOrden = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;

      const orden = await this.ordenRepo.obtenerPorId(ordenId);

      if (!orden) {
        res.status(404).json({ error: "Orden no encontrada" });
        return;
      }

      res.json({ orden });
    } catch (error: unknown) {
      console.error("Error al obtener orden:", error);
      res.status(500).json({ error: "Error al obtener orden" });
    }
  };

  actualizarEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;
      const { estado } = req.body;

      if (!["Pendiente", "En_Proceso", "Completada", "Cancelada"].includes(estado)) {
        res.status(400).json({ error: "Estado inválido" });
        return;
      }

      await this.ordenRepo.actualizarEstado(ordenId, estado);

      res.json({ mensaje: "Estado actualizado correctamente" });
    } catch (error: unknown) {
      console.error("Error al actualizar estado:", error);
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  };

  registrarResultados = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;
      const { resultadosArchivoUrl, observaciones } = req.body;

      if (!resultadosArchivoUrl) {
        res.status(400).json({ error: "Se requiere la URL del archivo de resultados" });
        return;
      }

      await this.ordenRepo.registrarResultados(ordenId, resultadosArchivoUrl, observaciones);

      res.json({ mensaje: "Resultados registrados correctamente" });
    } catch (error: unknown) {
      console.error("Error al registrar resultados:", error);
      res.status(500).json({ error: "Error al registrar resultados" });
    }
  };

  firmar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ordenId } = req.params;

      await this.ordenRepo.firmar(ordenId);

      res.json({ mensaje: "Orden firmada correctamente" });
    } catch (error: unknown) {
      console.error("Error al firmar orden:", error);
      res.status(500).json({ error: "Error al firmar orden" });
    }
  };
}
