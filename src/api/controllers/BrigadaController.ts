import { Request, Response } from 'express';
import { BrigadaRepositoryPostgres } from '../../infrastructure/database/repositories/BrigadaRepository';
import { BrigadaAtencionRepositoryPostgres } from '../../infrastructure/database/repositories/BrigadaAtencionRepository';
import { BrigadaRegistroRepositoryPostgres } from '../../infrastructure/database/repositories/BrigadaRegistroRepository';

export class BrigadaController {
  private repository: BrigadaRepositoryPostgres;
  private atencionRepository: BrigadaAtencionRepositoryPostgres;
  private registroRepository: BrigadaRegistroRepositoryPostgres;

  constructor() {
    this.repository = new BrigadaRepositoryPostgres();
    this.atencionRepository = new BrigadaAtencionRepositoryPostgres();
    this.registroRepository = new BrigadaRegistroRepositoryPostgres();
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const brigadas = await this.repository.listar();
      res.json({
        success: true,
        brigadas,
        total: brigadas.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const brigada = await this.repository.obtenerPorId(id);
      if (!brigada) {
        res.status(404).json({ success: false, error: 'Brigada no encontrada' });
        return;
      }
      res.json({ success: true, brigada });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        nombre?: string;
        ubicacion?: string;
        ciudad?: string;
        estado_brigada?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
        sucursal_id?: string;
        observaciones?: string;
      };
      if (!body.nombre || !body.ciudad || !body.fecha_inicio) {
        res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: nombre, ciudad, fecha_inicio',
        });
        return;
      }
      const brigada = await this.repository.crear({
        nombre: body.nombre,
        ubicacion: body.ubicacion,
        ciudad: body.ciudad,
        estado_brigada: body.estado_brigada as 'planificada' | 'en_curso' | 'finalizada' | undefined,
        fecha_inicio: body.fecha_inicio,
        fecha_fin: body.fecha_fin,
        sucursal_id: body.sucursal_id,
        observaciones: body.observaciones,
      });
      res.status(201).json({ success: true, brigada });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as {
        nombre?: string;
        ubicacion?: string;
        ciudad?: string;
        estado_brigada?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
        sucursal_id?: string | null;
        observaciones?: string | null;
      };
      const brigada = await this.repository.actualizar(id, {
        nombre: body.nombre,
        ubicacion: body.ubicacion,
        ciudad: body.ciudad,
        estado_brigada: body.estado_brigada as 'planificada' | 'en_curso' | 'finalizada' | undefined,
        fecha_inicio: body.fecha_inicio,
        fecha_fin: body.fecha_fin,
        sucursal_id: body.sucursal_id,
        observaciones: body.observaciones,
      });
      if (!brigada) {
        res.status(404).json({ success: false, error: 'Brigada no encontrada' });
        return;
      }
      res.json({ success: true, brigada });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ok = await this.repository.eliminar(id);
      if (!ok) {
        res.status(404).json({ success: false, error: 'Brigada no encontrada' });
        return;
      }
      res.json({ success: true, message: 'Brigada eliminada' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async listarAtenciones(req: Request, res: Response): Promise<void> {
    try {
      const { id: brigadaId } = req.params;
      const fechaDesde = req.query.fecha_desde as string | undefined;
      const fechaHasta = req.query.fecha_hasta as string | undefined;
      const atenciones = await this.atencionRepository.listarPorBrigada(brigadaId, {
        fechaDesde,
        fechaHasta,
      });
      res.json({ success: true, atenciones, total: atenciones.length });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async obtenerResumen(req: Request, res: Response): Promise<void> {
    try {
      const { id: brigadaId } = req.params;
      const fechaDesde = req.query.fecha_desde as string | undefined;
      const fechaHasta = req.query.fecha_hasta as string | undefined;
      const row = await this.atencionRepository.obtenerResumen(brigadaId, {
        fechaDesde,
        fechaHasta,
      });
      const rangoEdad = row.rango_edad?.trim() === '-' || !row.rango_edad ? '—' : row.rango_edad;
      res.json({
        success: true,
        resumen: {
          brigadaId,
          totalAtendidos: parseInt(row.total_atendidos, 10) || 0,
          porEspecialidad: {
            medicinaIntegral: parseInt(row.medicina_integral, 10) || 0,
            oftalmologia: parseInt(row.oftalmologia, 10) || 0,
            fisioterapia: parseInt(row.fisioterapia, 10) || 0,
            nutricion: parseInt(row.nutricion, 10) || 0,
            psicologia: parseInt(row.psicologia, 10) || 0,
            espirituales: parseInt(row.espirituales, 10) || 0,
          },
          odontologia: {
            consultas: parseInt(row.odontologia_consultas, 10) || 0,
            extracciones: parseInt(row.odontologia_extracciones, 10) || 0,
            resinas: parseInt(row.odontologia_resinas, 10) || 0,
            profilaxis: parseInt(row.odontologia_profilaxis, 10) || 0,
            endodoncia: parseInt(row.odontologia_endodoncia, 10) || 0,
          },
          oftalmologiaDesglose: {
            pacientes: parseInt(row.oftalmologia_pacientes, 10) || 0,
            lentesEntregados: parseInt(row.oftalmologia_lentes, 10) || 0,
            valoraciones: parseInt(row.oftalmologia_valoraciones, 10) || 0,
          },
          fisioterapiaTerapias: parseInt(row.fisioterapia_terapias, 10) || 0,
          nutricionConsultas: parseInt(row.nutricion_consultas, 10) || 0,
          rangoEdad,
          porSexo: {
            masculino: parseInt(row.masculino, 10) || 0,
            femenino: parseInt(row.femenino, 10) || 0,
          },
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async crearAtencion(req: Request, res: Response): Promise<void> {
    try {
      const { id: brigadaId } = req.params;
      const body = req.body as Record<string, unknown>;
      if (!body.paciente_nombre || typeof body.paciente_nombre !== 'string') {
        res.status(400).json({ success: false, error: 'paciente_nombre es requerido' });
        return;
      }
      if (!body.fecha || typeof body.fecha !== 'string') {
        res.status(400).json({ success: false, error: 'fecha es requerido' });
        return;
      }
      if (!body.especialidad || typeof body.especialidad !== 'string') {
        res.status(400).json({ success: false, error: 'especialidad es requerido' });
        return;
      }
      const atencion = await this.atencionRepository.crear({
        brigada_id: brigadaId,
        fecha: body.fecha as string,
        hora: body.hora as string | undefined,
        ubicacion: body.ubicacion as string | undefined,
        medico: body.medico as string | undefined,
        paciente_id: body.paciente_id as string | undefined,
        paciente_nombre: body.paciente_nombre as string,
        edad: body.edad != null ? Number(body.edad) : undefined,
        sexo: body.sexo as string | undefined,
        domicilio: body.domicilio as string | undefined,
        codigo_postal: body.codigo_postal as string | undefined,
        localidad: body.localidad as string | undefined,
        colonia: body.colonia as string | undefined,
        tipo_sangre: body.tipo_sangre as string | undefined,
        peso: body.peso != null ? Number(body.peso) : undefined,
        altura: body.altura != null ? Number(body.altura) : undefined,
        imc: body.imc != null ? Number(body.imc) : undefined,
        ta: body.ta as string | undefined,
        temp: body.temp != null ? Number(body.temp) : undefined,
        fc: body.fc != null ? Number(body.fc) : undefined,
        fr: body.fr != null ? Number(body.fr) : undefined,
        glu: body.glu != null ? Number(body.glu) : undefined,
        especialidad: body.especialidad as string,
        servicio: body.servicio as string | undefined,
        lentes_entregados: Boolean(body.lentes_entregados),
        diagnostico: body.diagnostico as string | undefined,
        receta: body.receta as string | undefined,
        medicamentos_entregados: body.medicamentos_entregados as string | undefined,
        observaciones: body.observaciones as string | undefined,
      });
      res.status(201).json({ success: true, atencion });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async actualizarAtencion(req: Request, res: Response): Promise<void> {
    try {
      const { atencionId } = req.params;
      const body = req.body as Record<string, unknown>;
      const atencion = await this.atencionRepository.obtenerPorId(atencionId);
      if (!atencion) {
        res.status(404).json({ success: false, error: 'Atención no encontrada' });
        return;
      }
      const updated = await this.atencionRepository.actualizar(atencionId, {
        fecha: body.fecha as string | undefined,
        hora: body.hora as string | undefined,
        ubicacion: body.ubicacion as string | undefined,
        medico: body.medico as string | undefined,
        paciente_id: body.paciente_id as string | undefined,
        paciente_nombre: (body.paciente_nombre as string) ?? atencion.paciente_nombre,
        edad: body.edad != null ? Number(body.edad) : undefined,
        sexo: body.sexo as string | undefined,
        domicilio: body.domicilio as string | undefined,
        codigo_postal: body.codigo_postal as string | undefined,
        localidad: body.localidad as string | undefined,
        colonia: body.colonia as string | undefined,
        tipo_sangre: body.tipo_sangre as string | undefined,
        peso: body.peso != null ? Number(body.peso) : undefined,
        altura: body.altura != null ? Number(body.altura) : undefined,
        imc: body.imc != null ? Number(body.imc) : undefined,
        ta: body.ta as string | undefined,
        temp: body.temp != null ? Number(body.temp) : undefined,
        fc: body.fc != null ? Number(body.fc) : undefined,
        fr: body.fr != null ? Number(body.fr) : undefined,
        glu: body.glu != null ? Number(body.glu) : undefined,
        especialidad: body.especialidad as string | undefined,
        servicio: body.servicio as string | undefined,
        lentes_entregados: body.lentes_entregados != null ? Boolean(body.lentes_entregados) : undefined,
        diagnostico: body.diagnostico as string | undefined,
        receta: body.receta as string | undefined,
        medicamentos_entregados: body.medicamentos_entregados as string | undefined,
        observaciones: body.observaciones as string | undefined,
      });
      res.json({ success: true, atencion: updated });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async eliminarAtencion(req: Request, res: Response): Promise<void> {
    try {
      const { atencionId } = req.params;
      const ok = await this.atencionRepository.eliminar(atencionId);
      if (!ok) {
        res.status(404).json({ success: false, error: 'Atención no encontrada' });
        return;
      }
      res.json({ success: true, message: 'Atención eliminada' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * Importar brigada + atenciones desde datos de plantilla (JSON).
   * Body: { brigada: { nombre, ubicacion?, ciudad, fecha_inicio, fecha_fin?, estado_brigada? }, atenciones: [...] }
   */
  async importar(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        brigada?: {
          nombre?: string;
          ubicacion?: string;
          ciudad?: string;
          fecha_inicio?: string;
          fecha_fin?: string;
          estado_brigada?: string;
        };
        atenciones?: Array<Record<string, unknown>>;
      };
      if (!body.brigada || !body.brigada.nombre || !body.brigada.ciudad || !body.brigada.fecha_inicio) {
        res.status(400).json({
          success: false,
          error: 'Faltan datos de la brigada: nombre, ciudad y fecha_inicio son requeridos',
        });
        return;
      }
      const brigada = await this.repository.crear({
        nombre: body.brigada.nombre,
        ubicacion: body.brigada.ubicacion,
        ciudad: body.brigada.ciudad,
        fecha_inicio: body.brigada.fecha_inicio,
        fecha_fin: body.brigada.fecha_fin,
        estado_brigada: (body.brigada.estado_brigada as 'planificada' | 'en_curso' | 'finalizada') || 'planificada',
      });
      const atenciones = Array.isArray(body.atenciones) ? body.atenciones : [];
      const errores: { fila: number; mensaje: string }[] = [];
      let insertadas = 0;
      for (let i = 0; i < atenciones.length; i++) {
        const row = atenciones[i];
        const paciente_nombre = row?.paciente_nombre != null ? String(row.paciente_nombre).trim() : '';
        const fecha = row?.fecha != null ? String(row.fecha).trim() : '';
        const especialidad = row?.especialidad != null ? String(row.especialidad).trim() : '';
        if (!paciente_nombre || !fecha || !especialidad) {
          errores.push({ fila: i + 1, mensaje: 'Falta paciente_nombre, fecha o especialidad' });
          continue;
        }
        try {
          await this.atencionRepository.crear({
            brigada_id: brigada.id,
            paciente_nombre,
            fecha,
            hora: row?.hora != null ? String(row.hora) : undefined,
            ubicacion: row?.ubicacion != null ? String(row.ubicacion) : undefined,
            medico: row?.medico != null ? String(row.medico) : undefined,
            edad: row?.edad != null ? Number(row.edad) : undefined,
            sexo: row?.sexo != null ? String(row.sexo) : undefined,
            domicilio: row?.domicilio != null ? String(row.domicilio) : undefined,
            codigo_postal: row?.codigo_postal != null ? String(row.codigo_postal) : undefined,
            localidad: row?.localidad != null ? String(row.localidad) : undefined,
            colonia: row?.colonia != null ? String(row.colonia) : undefined,
            tipo_sangre: row?.tipo_sangre != null ? String(row.tipo_sangre) : undefined,
            peso: row?.peso != null ? Number(row.peso) : undefined,
            altura: row?.altura != null ? Number(row.altura) : undefined,
            imc: row?.imc != null ? Number(row.imc) : undefined,
            ta: row?.ta != null ? String(row.ta) : undefined,
            temp: row?.temp != null ? Number(row.temp) : undefined,
            fc: row?.fc != null ? Number(row.fc) : undefined,
            fr: row?.fr != null ? Number(row.fr) : undefined,
            glu: row?.glu != null ? Number(row.glu) : undefined,
            especialidad,
            servicio: row?.servicio != null ? String(row.servicio) : undefined,
            lentes_entregados: Boolean(row?.lentes_entregados),
            diagnostico: row?.diagnostico != null ? String(row.diagnostico) : undefined,
            receta: row?.receta != null ? String(row.receta) : undefined,
            medicamentos_entregados: row?.medicamentos_entregados != null ? String(row.medicamentos_entregados) : undefined,
            observaciones: row?.observaciones != null ? String(row.observaciones) : undefined,
          });
          insertadas++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al insertar';
          errores.push({ fila: i + 1, mensaje: msg });
        }
      }
      res.status(201).json({
        success: true,
        brigada: {
          id: brigada.id,
          nombre: brigada.nombre,
          ubicacion: brigada.ubicacion,
          ciudad: brigada.ciudad,
          fecha_inicio: brigada.fecha_inicio,
          fecha_fin: brigada.fecha_fin,
          estado_brigada: brigada.estado_brigada,
        },
        totalAtenciones: atenciones.length,
        atencionesInsertadas: insertadas,
        errores: errores.length > 0 ? errores : undefined,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /** Listar registros (plantilla nueva: una fila por persona) */
  async listarRegistros(req: Request, res: Response): Promise<void> {
    try {
      const { id: brigadaId } = req.params;
      const fechaDesde = req.query.fecha_desde as string | undefined;
      const fechaHasta = req.query.fecha_hasta as string | undefined;
      const sucursal = req.query.sucursal as string | undefined;
      const registros = await this.registroRepository.listarPorBrigada(brigadaId, {
        fechaDesde,
        fechaHasta,
        sucursal,
      });
      res.json({ success: true, registros, total: registros.length });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /** Resumen KPIs desde brigada_registros (por servicio: Médico, Dentista, etc.) */
  async obtenerResumenRegistros(req: Request, res: Response): Promise<void> {
    try {
      const { id: brigadaId } = req.params;
      const fechaDesde = req.query.fecha_desde as string | undefined;
      const fechaHasta = req.query.fecha_hasta as string | undefined;
      const sucursal = req.query.sucursal as string | undefined;
      const row = await this.registroRepository.obtenerResumen(brigadaId, {
        fechaDesde,
        fechaHasta,
        sucursal,
      });
      res.json({
        success: true,
        resumen: {
          totalRegistros: parseInt(row.total_registros, 10) || 0,
          medico: parseInt(row.medico, 10) || 0,
          dentista: parseInt(row.dentista, 10) || 0,
          nutricion: parseInt(row.nutricion, 10) || 0,
          psicologia: parseInt(row.psicologia, 10) || 0,
          papaniculao: parseInt(row.papaniculao, 10) || 0,
          antigenoProstatico: parseInt(row.antigeno_prostatico, 10) || 0,
          fisioterapia: parseInt(row.fisioterapia, 10) || 0,
          cuidadosEspirituales: parseInt(row.cuidados_espirituales, 10) || 0,
          examenVista: parseInt(row.examen_vista, 10) || 0,
          corteCabello: parseInt(row.corte_cabello, 10) || 0,
          quiereEstudiarBiblia: parseInt(row.quiere_estudiar_biblia, 10) || 0,
          oracion: parseInt(row.oracion, 10) || 0,
          peticionOracion: parseInt(row.peticion_oracion, 10) || 0,
          porSucursal: (() => {
            try {
              return JSON.parse(row.por_sucursal || '[]');
            } catch {
              return [];
            }
          })(),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * Importar brigada + registros desde plantilla (columnas: SUCURSAL, FECHA, LUGAR, NO., NOMBRE, etc.)
   */
  async importarRegistros(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        brigada?: { nombre?: string; ubicacion?: string; ciudad?: string; fecha_inicio?: string; fecha_fin?: string };
        registros?: Array<Record<string, unknown>>;
      };
      if (!body.brigada || !body.brigada.nombre || !body.brigada.ciudad || !body.brigada.fecha_inicio) {
        res.status(400).json({
          success: false,
          error: 'Faltan datos de la brigada: nombre, ciudad y fecha_inicio son requeridos',
        });
        return;
      }
      const brigada = await this.repository.crear({
        nombre: body.brigada.nombre,
        ubicacion: body.brigada.ubicacion,
        ciudad: body.brigada.ciudad,
        fecha_inicio: body.brigada.fecha_inicio,
        fecha_fin: body.brigada.fecha_fin,
      });
      const registros = Array.isArray(body.registros) ? body.registros : [];
      const errores: { fila: number; mensaje: string }[] = [];
      let insertadas = 0;
      for (let i = 0; i < registros.length; i++) {
        const r = registros[i];
        const nombre = r?.nombre != null ? String(r.nombre).trim() : '';
        const fecha = r?.fecha != null ? String(r.fecha).trim() : '';
        if (!nombre || !fecha) {
          errores.push({ fila: i + 1, mensaje: 'Falta nombre o fecha' });
          continue;
        }
        try {
          await this.registroRepository.crear({
            brigada_id: brigada.id,
            sucursal: r?.sucursal != null ? String(r.sucursal) : undefined,
            fecha,
            lugar: r?.lugar != null ? String(r.lugar) : undefined,
            no: r?.no != null ? String(r.no) : undefined,
            nombre,
            telefono: r?.telefono != null ? String(r.telefono) : undefined,
            direccion: r?.direccion != null ? String(r.direccion) : undefined,
            sexo: r?.sexo != null ? String(r.sexo) : undefined,
            edad: r?.edad != null ? Number(r.edad) : undefined,
            asd: r?.asd != null ? String(r.asd) : undefined,
            no_asd: r?.no_asd != null ? String(r.no_asd) : undefined,
            quiere_estudiar_biblia: r?.quiere_estudiar_biblia != null ? String(r.quiere_estudiar_biblia) : undefined,
            oracion: r?.oracion != null ? String(r.oracion) : undefined,
            medico: r?.medico != null ? String(r.medico) : undefined,
            dentista: r?.dentista != null ? String(r.dentista) : undefined,
            nutricion: r?.nutricion != null ? String(r.nutricion) : undefined,
            psicologia: r?.psicologia != null ? String(r.psicologia) : undefined,
            papaniculao: r?.papaniculao != null ? String(r.papaniculao) : undefined,
            antigeno_prostatico: r?.antigeno_prostatico != null ? String(r.antigeno_prostatico) : undefined,
            fisioterapia: r?.fisioterapia != null ? String(r.fisioterapia) : undefined,
            cuidados_espirituales: r?.cuidados_espirituales != null ? String(r.cuidados_espirituales) : undefined,
            examen_vista: r?.examen_vista != null ? String(r.examen_vista) : undefined,
            corte_cabello: r?.corte_cabello != null ? String(r.corte_cabello) : undefined,
            denominacion: r?.denominacion != null ? String(r.denominacion) : undefined,
            peticion_oracion: r?.peticion_oracion != null ? String(r.peticion_oracion) : undefined,
            quiere_estudiar_biblia_2: r?.quiere_estudiar_biblia_2 != null ? String(r.quiere_estudiar_biblia_2) : undefined,
          });
          insertadas++;
        } catch (err) {
          errores.push({ fila: i + 1, mensaje: err instanceof Error ? err.message : 'Error al insertar' });
        }
      }
      res.status(201).json({
        success: true,
        brigada: {
          id: brigada.id,
          nombre: brigada.nombre,
          ciudad: brigada.ciudad,
          fecha_inicio: brigada.fecha_inicio,
        },
        totalRegistros: registros.length,
        registrosInsertados: insertadas,
        errores: errores.length > 0 ? errores : undefined,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}
