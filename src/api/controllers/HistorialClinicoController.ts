import { Request, Response } from 'express';
import { HistorialClinicoRepositoryPostgres } from '../../infrastructure/database/repositories/HistorialClinicoRepository';

export class HistorialClinicoController {
  constructor(private historialRepo: HistorialClinicoRepositoryPostgres) {}

  // ============================================
  // CONSULTAS MÉDICAS
  // ============================================

  crearConsulta = async (req: Request, res: Response) => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const consulta = await this.historialRepo.crearConsulta({
        ...req.body,
        doctorId,
      });

      return res.status(201).json({ consulta });
    } catch (error) {
      console.error('Error creando consulta:', error);
      return res.status(500).json({ error: 'Error al crear consulta médica' });
    }
  };

  obtenerConsultasPaciente = async (req: Request, res: Response) => {
    try {
      const { pacienteId } = req.params;
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 50;

      const consultas = await this.historialRepo.obtenerConsultasPaciente(pacienteId, limite);
      return res.json({ consultas, total: consultas.length });
    } catch (error) {
      console.error('Error obteniendo consultas:', error);
      return res.status(500).json({ error: 'Error al obtener historial de consultas' });
    }
  };

  obtenerConsulta = async (req: Request, res: Response) => {
    try {
      const { consultaId } = req.params;
      const consulta = await this.historialRepo.obtenerConsultaPorId(consultaId);

      if (!consulta) {
        return res.status(404).json({ error: 'Consulta no encontrada' });
      }

      return res.json({ consulta });
    } catch (error) {
      console.error('Error obteniendo consulta:', error);
      return res.status(500).json({ error: 'Error al obtener consulta' });
    }
  };

  actualizarConsulta = async (req: Request, res: Response) => {
    try {
      const { consultaId } = req.params;
      await this.historialRepo.actualizarConsulta(consultaId, req.body);
      return res.json({ success: true });
    } catch (error) {
      console.error('Error actualizando consulta:', error);
      return res.status(500).json({ error: 'Error al actualizar consulta' });
    }
  };

  // ============================================
  // SIGNOS VITALES
  // ============================================

  registrarSignosVitales = async (req: Request, res: Response) => {
    try {
      const registradoPor = req.user?.id;

      const signos = await this.historialRepo.registrarSignosVitales({
        ...req.body,
        registradoPor,
      });

      return res.status(201).json({ signos });
    } catch (error) {
      console.error('Error registrando signos vitales:', error);
      return res.status(500).json({ error: 'Error al registrar signos vitales' });
    }
  };

  obtenerSignosVitalesPaciente = async (req: Request, res: Response) => {
    try {
      const { pacienteId } = req.params;
      const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 20;

      const signos = await this.historialRepo.obtenerSignosVitalesPaciente(pacienteId, limite);
      return res.json({ signos, total: signos.length });
    } catch (error) {
      console.error('Error obteniendo signos vitales:', error);
      return res.status(500).json({ error: 'Error al obtener signos vitales' });
    }
  };

  // ============================================
  // ANTECEDENTES MÉDICOS
  // ============================================

  agregarAntecedente = async (req: Request, res: Response) => {
    try {
      const registradoPor = req.user?.id;

      const antecedente = await this.historialRepo.agregarAntecedente({
        ...req.body,
        registradoPor,
      });

      return res.status(201).json({ antecedente });
    } catch (error) {
      console.error('Error agregando antecedente:', error);
      return res.status(500).json({ error: 'Error al agregar antecedente médico' });
    }
  };

  obtenerAntecedentesPaciente = async (req: Request, res: Response) => {
    try {
      const { pacienteId } = req.params;
      const antecedentes = await this.historialRepo.obtenerAntecedentesPaciente(pacienteId);
      return res.json({ antecedentes, total: antecedentes.length });
    } catch (error) {
      console.error('Error obteniendo antecedentes:', error);
      return res.status(500).json({ error: 'Error al obtener antecedentes médicos' });
    }
  };

  // ============================================
  // MEDICAMENTOS ACTUALES
  // ============================================

  agregarMedicamento = async (req: Request, res: Response) => {
    try {
      const registradoPor = req.user?.id;

      const medicamento = await this.historialRepo.agregarMedicamento({
        ...req.body,
        registradoPor,
      });

      return res.status(201).json({ medicamento });
    } catch (error) {
      console.error('Error agregando medicamento:', error);
      return res.status(500).json({ error: 'Error al agregar medicamento' });
    }
  };

  obtenerMedicamentosPaciente = async (req: Request, res: Response) => {
    try {
      const { pacienteId } = req.params;
      const soloActivos = req.query.soloActivos !== 'false';

      const medicamentos = await this.historialRepo.obtenerMedicamentosPaciente(
        pacienteId,
        soloActivos
      );

      return res.json({ medicamentos, total: medicamentos.length });
    } catch (error) {
      console.error('Error obteniendo medicamentos:', error);
      return res.status(500).json({ error: 'Error al obtener medicamentos' });
    }
  };

  // ============================================
  // RESUMEN COMPLETO DEL PACIENTE
  // ============================================

  obtenerHistorialCompleto = async (req: Request, res: Response) => {
    try {
      const { pacienteId } = req.params;

      const [consultas, signos, antecedentes, medicamentos] = await Promise.all([
        this.historialRepo.obtenerConsultasPaciente(pacienteId, 10),
        this.historialRepo.obtenerSignosVitalesPaciente(pacienteId, 5),
        this.historialRepo.obtenerAntecedentesPaciente(pacienteId),
        this.historialRepo.obtenerMedicamentosPaciente(pacienteId, true),
      ]);

      return res.json({
        consultas,
        signosVitales: signos,
        antecedentes,
        medicamentos,
      });
    } catch (error) {
      console.error('Error obteniendo historial completo:', error);
      return res.status(500).json({ error: 'Error al obtener historial clínico completo' });
    }
  };
}
