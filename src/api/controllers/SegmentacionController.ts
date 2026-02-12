/**
 * Controlador: Segmentación de Pacientes
 * Maneja peticiones HTTP de segmentación
 */

import { Request, Response } from 'express';
import {
  SegmentarPacientesUseCase,
  SegmentoPaciente,
  ICitaRepository,
  IAbonoRepository,
} from '../../core/use-cases/SegmentarPacientes';
import { InMemoryPacienteRepository } from '../../infrastructure/database/repositories/PacienteRepository';
import { InMemoryCitaRepository } from '../../infrastructure/database/repositories/CitaRepository';
import { InMemoryAbonoRepository } from '../../infrastructure/database/repositories/AbonoRepository';

export class SegmentacionController {
  private segmentarUseCase: SegmentarPacientesUseCase;
  private pacienteRepository: InMemoryPacienteRepository;

  constructor() {
    this.pacienteRepository = new InMemoryPacienteRepository();
    const citaRepository = new InMemoryCitaRepository() as unknown as ICitaRepository;
    const abonoRepository = new InMemoryAbonoRepository() as unknown as IAbonoRepository;

    this.segmentarUseCase = new SegmentarPacientesUseCase(
      citaRepository,
      abonoRepository
    );
  }

  /**
   * GET /api/segmentacion/estadisticas
   * Obtener estadísticas de segmentación
   */
  obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sucursalId } = req.query;

      // Obtener todos los pacientes (o filtrar por sucursal si se proporciona)
      const pacientes = await this.pacienteRepository.obtenerTodos();
      
      const pacientesFiltrados = sucursalId
        ? pacientes.filter(p => (p as { sucursalId?: string }).sucursalId === sucursalId)
        : pacientes;

      const estadisticas = await this.segmentarUseCase.obtenerEstadisticas(pacientesFiltrados);

      res.json(estadisticas);
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al obtener estadísticas de segmentación',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /api/segmentacion/segmento/:tipo
   * Filtrar pacientes por segmento
   */
  filtrarPorSegmento = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tipo } = req.params;
      const { sucursalId } = req.query;

      // Validar tipo de segmento
      const segmentosValidos = ['Nunca atendido', '1 vez', 'Múltiples'];
      if (!segmentosValidos.includes(tipo)) {
        res.status(400).json({
          error: `Segmento inválido. Valores válidos: ${segmentosValidos.join(', ')}`
        });
        return;
      }

      const pacientes = await this.pacienteRepository.obtenerTodos();
      const pacientesFiltrados = sucursalId
        ? pacientes.filter(p => (p as { sucursalId?: string }).sucursalId === sucursalId)
        : pacientes;

      const resultado = await this.segmentarUseCase.filtrarPorSegmento(
        pacientesFiltrados,
        tipo as SegmentoPaciente
      );

      res.json({
        segmento: tipo,
        total: resultado.length,
        pacientes: resultado
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al filtrar por segmento',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /api/segmentacion/alto-valor
   * Obtener pacientes de alto valor
   */
  obtenerAltoValor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sucursalId, umbral } = req.query;
      const umbralValor = umbral ? parseFloat(umbral as string) : 5000;

      const pacientes = await this.pacienteRepository.obtenerTodos();
      const pacientesFiltrados = sucursalId
        ? pacientes.filter(p => (p as { sucursalId?: string }).sucursalId === sucursalId)
        : pacientes;

      const resultado = await this.segmentarUseCase.obtenerPacientesAltoValor(
        pacientesFiltrados,
        umbralValor
      );

      res.json({
        umbral: umbralValor,
        total: resultado.length,
        valorTotal: resultado.reduce((sum, p) => sum + (p.valorVida || 0), 0),
        pacientes: resultado
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al obtener pacientes de alto valor',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /api/segmentacion/riesgo-abandono
   * Obtener pacientes en riesgo de abandono
   */
  obtenerRiesgoAbandono = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sucursalId, meses } = req.query;
      const mesesSinCita = meses ? parseInt(meses as string) : 6;

      const pacientes = await this.pacienteRepository.obtenerTodos();
      const pacientesFiltrados = sucursalId
        ? pacientes.filter(p => (p as { sucursalId?: string }).sucursalId === sucursalId)
        : pacientes;

      const resultado = await this.segmentarUseCase.obtenerPacientesRiesgoAbandono(
        pacientesFiltrados,
        mesesSinCita
      );

      res.json({
        mesesSinCita,
        total: resultado.length,
        pacientes: resultado
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al obtener pacientes en riesgo',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /api/segmentacion/leads-frios
   * Obtener leads fríos (nunca atendidos, registrados hace tiempo)
   */
  obtenerLeadsFrios = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sucursalId, dias } = req.query;
      const diasDesdeRegistro = dias ? parseInt(dias as string) : 30;

      const pacientes = await this.pacienteRepository.obtenerTodos();
      const pacientesFiltrados = sucursalId
        ? pacientes.filter(p => (p as { sucursalId?: string }).sucursalId === sucursalId)
        : pacientes;

      const resultado = await this.segmentarUseCase.obtenerLeadsFrios(
        pacientesFiltrados,
        diasDesdeRegistro
      );

      res.json({
        diasDesdeRegistro,
        total: resultado.length,
        pacientes: resultado
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al obtener leads fríos',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * GET /api/segmentacion/paciente/:id
   * Segmentar un paciente específico
   */
  segmentarPaciente = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const paciente = await this.pacienteRepository.obtenerPorId(id);
      if (!paciente) {
        res.status(404).json({ error: 'Paciente no encontrado' });
        return;
      }

      const pacienteSegmentado = await this.segmentarUseCase.segmentarPaciente(paciente);

      res.json(pacienteSegmentado);
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Error al segmentar paciente',
        detalle: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}
