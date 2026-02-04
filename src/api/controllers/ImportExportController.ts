/**
 * Controlador: Importación/Exportación
 * Maneja peticiones HTTP de import/export
 */

import { Request, Response } from 'express';
import { ImportExportService } from '../../infrastructure/import-export/ImportExportService';
import { InMemoryPacienteRepository } from '../../infrastructure/database/repositories/PacienteRepository';
import { InMemoryCitaRepository } from '../../infrastructure/database/repositories/CitaRepository';
import { InMemoryAbonoRepository } from '../../infrastructure/database/repositories/AbonoRepository';
import multer from 'multer';

// Configurar multer para uploads
const upload = multer({ storage: multer.memoryStorage() });

export class ImportExportController {
  private importExportService: ImportExportService;
  private pacienteRepository: InMemoryPacienteRepository;
  private citaRepository: InMemoryCitaRepository;
  private abonoRepository: InMemoryAbonoRepository;

  constructor() {
    this.importExportService = new ImportExportService();
    this.pacienteRepository = new InMemoryPacienteRepository();
    this.citaRepository = new InMemoryCitaRepository();
    this.abonoRepository = new InMemoryAbonoRepository();
  }

  /**
   * GET /api/import-export/exportar/pacientes
   * Exportar pacientes a CSV o Excel
   */
  exportarPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { formato = 'csv', sucursalId } = req.query;

      // Obtener pacientes
      let pacientes = await this.pacienteRepository.obtenerTodos();

      if (sucursalId) {
        pacientes = pacientes.filter(p => p.sucursalId === sucursalId);
      }

      // Preparar datos para exportación
      const datosExportar = pacientes.map(p => ({
        ID: p.id,
        'Nombre Completo': p.nombreCompleto,
        Teléfono: p.telefono,
        Email: p.email || '',
        Género: p.genero || '',
        'Fecha Nacimiento': p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().split('T')[0] : '',
        Dirección: p.direccion || '',
        Ciudad: p.ciudad || '',
        Estado: p.estado || '',
        Origen: p.origen || '',
        'Sucursal ID': p.sucursalId || '',
        'Fecha Registro': new Date(p.fechaRegistro).toISOString().split('T')[0],
        Notas: p.notas || ''
      }));

      if (formato === 'excel') {
        const buffer = this.importExportService.exportarExcel(datosExportar, 'Pacientes');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=pacientes_${Date.now()}.xlsx`);
        res.send(buffer);
      } else {
        const csv = this.importExportService.exportarCSV(datosExportar);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=pacientes_${Date.now()}.csv`);
        res.send('\uFEFF' + csv); // BOM para UTF-8
      }
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al exportar pacientes',
        detalle: error.message
      });
    }
  };

  /**
   * POST /api/import-export/importar/pacientes
   * Importar pacientes desde CSV o Excel
   */
  importarPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se recibió ningún archivo' });
        return;
      }

      const buffer = req.file.buffer;
      const extension = req.file.originalname.split('.').pop()?.toLowerCase();

      let resultadoParseo;

      if (extension === 'csv') {
        const contenidoCSV = buffer.toString('utf-8');
        resultadoParseo = this.importExportService.importarCSV(contenidoCSV);
      } else if (extension === 'xlsx' || extension === 'xls') {
        resultadoParseo = this.importExportService.importarExcel(buffer);
      } else {
        res.status(400).json({ error: 'Formato no soportado. Use CSV o Excel (.xlsx)' });
        return;
      }

      // Validar y transformar datos
      const resultadoValidacion = this.importExportService.validarDatosPacientes(resultadoParseo.datos);

      // Guardar pacientes válidos
      let guardados = 0;
      for (const paciente of resultadoValidacion.datos) {
        try {
          await this.pacienteRepository.crear(paciente as any);
          guardados++;
        } catch (error) {
          resultadoValidacion.errores.push({
            fila: -1,
            error: `Error al guardar paciente: ${(error as Error).message}`
          });
          resultadoValidacion.fallidos++;
          resultadoValidacion.exitosos--;
        }
      }

      res.json({
        mensaje: `Importación completada: ${guardados} pacientes guardados`,
        exitosos: guardados,
        fallidos: resultadoValidacion.fallidos,
        errores: resultadoValidacion.errores
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al importar pacientes',
        detalle: error.message
      });
    }
  };

  /**
   * GET /api/import-export/plantilla/pacientes
   * Descargar plantilla de importación de pacientes
   */
  descargarPlantillaPacientes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { formato = 'csv' } = req.query;

      if (formato === 'excel') {
        const buffer = this.importExportService.generarPlantillaPacientesExcel();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_pacientes.xlsx');
        res.send(buffer);
      } else {
        const csv = this.importExportService.generarPlantillaPacientes();
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_pacientes.csv');
        res.send('\uFEFF' + csv);
      }
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al generar plantilla',
        detalle: error.message
      });
    }
  };

  /**
   * GET /api/import-export/exportar/citas
   * Exportar citas
   */
  exportarCitas = async (req: Request, res: Response): Promise<void> => {
    try {
      const { formato = 'csv', fechaDesde, fechaHasta, sucursalId } = req.query;

      // Obtener citas
      let citas = await this.citaRepository.obtenerTodas();

      // Filtros
      if (fechaDesde) {
        const desde = new Date(fechaDesde as string);
        citas = citas.filter(c => new Date(c.fechaCita) >= desde);
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta as string);
        citas = citas.filter(c => new Date(c.fechaCita) <= hasta);
      }
      if (sucursalId) {
        citas = citas.filter(c => c.sucursalId === sucursalId);
      }

      const datosExportar = citas.map(c => ({
        ID: c.id,
        'Paciente ID': c.pacienteId,
        Fecha: new Date(c.fechaCita).toISOString().split('T')[0],
        Hora: c.horaCita || '',
        Especialidad: c.especialidad || '',
        'Médico': c.medicoAsignado || '',
        Estado: c.estado,
        'Tipo Cita': c.tipoCita || '',
        'Sucursal ID': c.sucursalId || '',
        Notas: c.notas || ''
      }));

      if (formato === 'excel') {
        const buffer = this.importExportService.exportarExcel(datosExportar, 'Citas');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=citas_${Date.now()}.xlsx`);
        res.send(buffer);
      } else {
        const csv = this.importExportService.exportarCSV(datosExportar);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=citas_${Date.now()}.csv`);
        res.send('\uFEFF' + csv);
      }
    } catch (error: any) {
      res.status(500).json({
        error: 'Error al exportar citas',
        detalle: error.message
      });
    }
  };

  /**
   * Obtener middleware de multer
   */
  getUploadMiddleware() {
    return upload.single('file');
  }
}
