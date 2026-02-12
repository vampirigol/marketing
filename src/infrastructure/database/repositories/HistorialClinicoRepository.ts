import { Pool } from 'pg';

export interface ConsultaMedica {
  id: string;
  citaId?: string;
  pacienteId: string;
  doctorId: string;
  sucursalId?: string;
  fechaConsulta: string;
  tipoConsulta: 'Primera_Vez' | 'Subsecuente' | 'Urgencia' | 'Telemedicina' | 'Seguimiento';
  especialidad: string;
  motivoConsulta: string;
  signosVitales?: {
    temperatura?: number;
    presionArterial?: string;
    frecuenciaCardiaca?: number;
    frecuenciaRespiratoria?: number;
    saturacionOxigeno?: number;
    peso?: number;
    talla?: number;
    imc?: number;
    glucosa?: number;
  };
  exploracionFisica?: string;
  diagnosticos: Array<{
    codigoCie10?: string;
    nombre: string;
    tipo: 'principal' | 'secundario';
    notas?: string;
  }>;
  planTratamiento?: string;
  indicaciones?: string;
  pronostico?: 'Bueno' | 'Reservado' | 'Grave';
  notasEvolucion?: string;
  notasPrivadas?: string;
  requiereSeguimiento: boolean;
  fechaProximoControl?: string;
  diasIncapacidad: number;
  duracionMinutos?: number;
  archivosAdjuntos?: Array<{ nombre: string; url: string; tipo: string }>;
  firmado: boolean;
  fechaFirma?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface SignosVitales {
  id: string;
  pacienteId: string;
  consultaId?: string;
  fechaRegistro: string;
  temperatura?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  saturacionOxigeno?: number;
  peso?: number;
  talla?: number;
  imc?: number;
  glucosa?: number;
  perimetroAbdominal?: number;
  perimetroCefalico?: number;
  observaciones?: string;
  registradoPor?: string;
  creadoEn: string;
}

export interface AntecedenteMedico {
  id: string;
  pacienteId: string;
  tipoAntecedente:
    | 'Personal_Patologico'
    | 'Personal_No_Patologico'
    | 'Familiar'
    | 'Quirurgico'
    | 'Alergico'
    | 'Traumatico'
    | 'Transfusional'
    | 'Ginecoobstetrico';
  descripcion: string;
  fechaDiagnostico?: string;
  estaActivo: boolean;
  tratamientoActual?: string;
  parentesco?: string;
  notas?: string;
  registradoPor?: string;
  fechaRegistro: string;
  actualizadoEn: string;
}

export interface MedicamentoActual {
  id: string;
  pacienteId: string;
  nombreMedicamento: string;
  dosis: string;
  viaAdministracion:
    | 'Oral'
    | 'Intravenosa'
    | 'Intramuscular'
    | 'Subcutanea'
    | 'Topica'
    | 'Oftalmica'
    | 'Otica'
    | 'Nasal'
    | 'Rectal'
    | 'Otra';
  frecuencia: string;
  fechaInicio: string;
  fechaFin?: string;
  esCronico: boolean;
  indicacion?: string;
  prescritoPor?: string;
  activo: boolean;
  registradoPor?: string;
  fechaRegistro: string;
  actualizadoEn: string;
}

export class HistorialClinicoRepositoryPostgres {
  constructor(private pool: Pool) {}

  // ============================================
  // CONSULTAS MÉDICAS
  // ============================================

  async crearConsulta(consulta: Omit<ConsultaMedica, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<ConsultaMedica> {
    const query = `
      INSERT INTO consultas_medicas (
        cita_id, paciente_id, doctor_id, sucursal_id,
        fecha_consulta, tipo_consulta, especialidad, motivo_consulta,
        signos_vitales, exploracion_fisica, diagnosticos,
        plan_tratamiento, indicaciones, pronostico,
        notas_evolucion, notas_privadas,
        requiere_seguimiento, fecha_proximo_control, dias_incapacidad,
        duracion_minutos, archivos_adjuntos, firmado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `;

    const values = [
      consulta.citaId || null,
      consulta.pacienteId,
      consulta.doctorId,
      consulta.sucursalId || null,
      consulta.fechaConsulta,
      consulta.tipoConsulta,
      consulta.especialidad,
      consulta.motivoConsulta,
      JSON.stringify(consulta.signosVitales || {}),
      consulta.exploracionFisica || null,
      JSON.stringify(consulta.diagnosticos || []),
      consulta.planTratamiento || null,
      consulta.indicaciones || null,
      consulta.pronostico || null,
      consulta.notasEvolucion || null,
      consulta.notasPrivadas || null,
      consulta.requiereSeguimiento,
      consulta.fechaProximoControl || null,
      consulta.diasIncapacidad || 0,
      consulta.duracionMinutos || null,
      JSON.stringify(consulta.archivosAdjuntos || []),
      consulta.firmado || false,
    ];

    const result = await this.pool.query(query, values);
    return this.mapConsultaFromDb(result.rows[0]);
  }

  async obtenerConsultasPaciente(pacienteId: string, limite: number = 50): Promise<ConsultaMedica[]> {
    const query = `
      SELECT * FROM consultas_medicas
      WHERE paciente_id = $1
      ORDER BY fecha_consulta DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [pacienteId, limite]);
    return result.rows.map(this.mapConsultaFromDb);
  }

  async obtenerConsultaPorId(consultaId: string): Promise<ConsultaMedica | null> {
    const query = 'SELECT * FROM consultas_medicas WHERE id = $1';
    const result = await this.pool.query(query, [consultaId]);
    return result.rows.length > 0 ? this.mapConsultaFromDb(result.rows[0]) : null;
  }

  async actualizarConsulta(consultaId: string, datos: Partial<ConsultaMedica>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (datos.exploracionFisica !== undefined) {
      updates.push(`exploracion_fisica = $${paramIndex++}`);
      values.push(datos.exploracionFisica);
    }
    if (datos.diagnosticos !== undefined) {
      updates.push(`diagnosticos = $${paramIndex++}`);
      values.push(JSON.stringify(datos.diagnosticos));
    }
    if (datos.planTratamiento !== undefined) {
      updates.push(`plan_tratamiento = $${paramIndex++}`);
      values.push(datos.planTratamiento);
    }
    if (datos.indicaciones !== undefined) {
      updates.push(`indicaciones = $${paramIndex++}`);
      values.push(datos.indicaciones);
    }
    if (datos.notasEvolucion !== undefined) {
      updates.push(`notas_evolucion = $${paramIndex++}`);
      values.push(datos.notasEvolucion);
    }
    if (datos.pronostico !== undefined) {
      updates.push(`pronostico = $${paramIndex++}`);
      values.push(datos.pronostico);
    }
    if (datos.firmado !== undefined) {
      updates.push(`firmado = $${paramIndex++}`);
      values.push(datos.firmado);
      if (datos.firmado) {
        updates.push(`fecha_firma = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.length === 0) return;

    values.push(consultaId);
    const query = `UPDATE consultas_medicas SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  // ============================================
  // SIGNOS VITALES
  // ============================================

  async registrarSignosVitales(signos: Omit<SignosVitales, 'id' | 'creadoEn'>): Promise<SignosVitales> {
    const query = `
      INSERT INTO signos_vitales_historico (
        paciente_id, consulta_id, fecha_registro,
        temperatura, presion_sistolica, presion_diastolica,
        frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno,
        peso, talla, imc, glucosa,
        perimetro_abdominal, perimetro_cefalico,
        observaciones, registrado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      signos.pacienteId,
      signos.consultaId || null,
      signos.fechaRegistro,
      signos.temperatura || null,
      signos.presionSistolica || null,
      signos.presionDiastolica || null,
      signos.frecuenciaCardiaca || null,
      signos.frecuenciaRespiratoria || null,
      signos.saturacionOxigeno || null,
      signos.peso || null,
      signos.talla || null,
      signos.imc || null,
      signos.glucosa || null,
      signos.perimetroAbdominal || null,
      signos.perimetroCefalico || null,
      signos.observaciones || null,
      signos.registradoPor || null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapSignosFromDb(result.rows[0]);
  }

  async obtenerSignosVitalesPaciente(pacienteId: string, limite: number = 20): Promise<SignosVitales[]> {
    const query = `
      SELECT * FROM signos_vitales_historico
      WHERE paciente_id = $1
      ORDER BY fecha_registro DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [pacienteId, limite]);
    return result.rows.map(this.mapSignosFromDb);
  }

  // ============================================
  // ANTECEDENTES MÉDICOS
  // ============================================

  async agregarAntecedente(antecedente: Omit<AntecedenteMedico, 'id' | 'fechaRegistro' | 'actualizadoEn'>): Promise<AntecedenteMedico> {
    const query = `
      INSERT INTO antecedentes_medicos (
        paciente_id, tipo_antecedente, descripcion,
        fecha_diagnostico, esta_activo, tratamiento_actual,
        parentesco, notas, registrado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      antecedente.pacienteId,
      antecedente.tipoAntecedente,
      antecedente.descripcion,
      antecedente.fechaDiagnostico || null,
      antecedente.estaActivo,
      antecedente.tratamientoActual || null,
      antecedente.parentesco || null,
      antecedente.notas || null,
      antecedente.registradoPor || null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapAntecedenteFromDb(result.rows[0]);
  }

  async obtenerAntecedentesPaciente(pacienteId: string): Promise<AntecedenteMedico[]> {
    const query = `
      SELECT * FROM antecedentes_medicos
      WHERE paciente_id = $1
      ORDER BY fecha_registro DESC
    `;
    const result = await this.pool.query(query, [pacienteId]);
    return result.rows.map(this.mapAntecedenteFromDb);
  }

  // ============================================
  // MEDICAMENTOS ACTUALES
  // ============================================

  async agregarMedicamento(medicamento: Omit<MedicamentoActual, 'id' | 'fechaRegistro' | 'actualizadoEn'>): Promise<MedicamentoActual> {
    const query = `
      INSERT INTO medicamentos_actuales (
        paciente_id, nombre_medicamento, dosis, via_administracion, frecuencia,
        fecha_inicio, fecha_fin, es_cronico, indicacion, prescrito_por,
        activo, registrado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      medicamento.pacienteId,
      medicamento.nombreMedicamento,
      medicamento.dosis,
      medicamento.viaAdministracion,
      medicamento.frecuencia,
      medicamento.fechaInicio,
      medicamento.fechaFin || null,
      medicamento.esCronico,
      medicamento.indicacion || null,
      medicamento.prescritoPor || null,
      medicamento.activo,
      medicamento.registradoPor || null,
    ];

    const result = await this.pool.query(query, values);
    return this.mapMedicamentoFromDb(result.rows[0]);
  }

  async obtenerMedicamentosPaciente(pacienteId: string, soloActivos: boolean = true): Promise<MedicamentoActual[]> {
    const query = soloActivos
      ? 'SELECT * FROM medicamentos_actuales WHERE paciente_id = $1 AND activo = true ORDER BY fecha_registro DESC'
      : 'SELECT * FROM medicamentos_actuales WHERE paciente_id = $1 ORDER BY fecha_registro DESC';
    
    const result = await this.pool.query(query, [pacienteId]);
    return result.rows.map(this.mapMedicamentoFromDb);
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapConsultaFromDb(row: any): ConsultaMedica {
    return {
      id: row.id,
      citaId: row.cita_id,
      pacienteId: row.paciente_id,
      doctorId: row.doctor_id,
      sucursalId: row.sucursal_id,
      fechaConsulta: row.fecha_consulta,
      tipoConsulta: row.tipo_consulta,
      especialidad: row.especialidad,
      motivoConsulta: row.motivo_consulta,
      signosVitales: row.signos_vitales,
      exploracionFisica: row.exploracion_fisica,
      diagnosticos: row.diagnosticos || [],
      planTratamiento: row.plan_tratamiento,
      indicaciones: row.indicaciones,
      pronostico: row.pronostico,
      notasEvolucion: row.notas_evolucion,
      notasPrivadas: row.notas_privadas,
      requiereSeguimiento: row.requiere_seguimiento,
      fechaProximoControl: row.fecha_proximo_control,
      diasIncapacidad: row.dias_incapacidad,
      duracionMinutos: row.duracion_minutos,
      archivosAdjuntos: row.archivos_adjuntos || [],
      firmado: row.firmado,
      fechaFirma: row.fecha_firma,
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en,
    };
  }

  private mapSignosFromDb(row: any): SignosVitales {
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      consultaId: row.consulta_id,
      fechaRegistro: row.fecha_registro,
      temperatura: row.temperatura,
      presionSistolica: row.presion_sistolica,
      presionDiastolica: row.presion_diastolica,
      frecuenciaCardiaca: row.frecuencia_cardiaca,
      frecuenciaRespiratoria: row.frecuencia_respiratoria,
      saturacionOxigeno: row.saturacion_oxigeno,
      peso: row.peso,
      talla: row.talla,
      imc: row.imc,
      glucosa: row.glucosa,
      perimetroAbdominal: row.perimetro_abdominal,
      perimetroCefalico: row.perimetro_cefalico,
      observaciones: row.observaciones,
      registradoPor: row.registrado_por,
      creadoEn: row.creado_en,
    };
  }

  private mapAntecedenteFromDb(row: any): AntecedenteMedico {
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      tipoAntecedente: row.tipo_antecedente,
      descripcion: row.descripcion,
      fechaDiagnostico: row.fecha_diagnostico,
      estaActivo: row.esta_activo,
      tratamientoActual: row.tratamiento_actual,
      parentesco: row.parentesco,
      notas: row.notas,
      registradoPor: row.registrado_por,
      fechaRegistro: row.fecha_registro,
      actualizadoEn: row.actualizado_en,
    };
  }

  private mapMedicamentoFromDb(row: any): MedicamentoActual {
    return {
      id: row.id,
      pacienteId: row.paciente_id,
      nombreMedicamento: row.nombre_medicamento,
      dosis: row.dosis,
      viaAdministracion: row.via_administracion,
      frecuencia: row.frecuencia,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
      esCronico: row.es_cronico,
      indicacion: row.indicacion,
      prescritoPor: row.prescrito_por,
      activo: row.activo,
      registradoPor: row.registrado_por,
      fechaRegistro: row.fecha_registro,
      actualizadoEn: row.actualizado_en,
    };
  }
}
