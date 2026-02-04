/**
 * Caso de Uso: Ejecutar Campaña Esporádica
 * Broadcast manual de mensajes a audiencia segmentada
 */

import { CampanaEsporadica, CampanaEsporadicaEntity, AudienciaCampana } from '../entities/CampanaEsporadica';
import { Paciente } from '../entities/Paciente';
import { ICampanaEsporadicaRepository } from '../../infrastructure/database/repositories/CampanaEsporadicaRepository';

export interface IWhatsAppService {
  enviarMensaje(telefono: string, mensaje: string, mediaUrl?: string): Promise<boolean>;
}

export interface IPacienteRepository {
  obtenerTodos(): Promise<Paciente[]>;
  obtenerPorId(id: string): Promise<Paciente | null>;
}

export interface ISegmentarPacientesUseCase {
  filtrarPorSegmento(pacientes: Paciente[], segmento: string): Promise<any[]>;
}

export interface CrearCampanaDTO {
  nombre: string;
  descripcion?: string;
  audiencia: AudienciaCampana;
  mensaje: {
    canal: 'WhatsApp' | 'Facebook' | 'Instagram' | 'SMS' | 'Email';
    contenido: string;
    mediaUrl?: string;
    incluirNombre?: boolean;
  };
  fechaProgramada?: Date;
  creadoPor: string;
  sucursalId?: string;
}

export class EjecutarCampanaEsporadicaUseCase {
  constructor(
    private campanaRepository: ICampanaEsporadicaRepository,
    private pacienteRepository: IPacienteRepository,
    private whatsAppService: IWhatsAppService,
    private segmentarUseCase?: ISegmentarPacientesUseCase
  ) {}

  /**
   * Crear nueva campaña
   */
  async crear(dto: CrearCampanaDTO): Promise<CampanaEsporadica> {
    // Calcular audiencia
    const audiencia = await this.calcularAudiencia(dto.audiencia);

    const campana: CampanaEsporadica = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      audiencia: dto.audiencia,
      totalAudiencia: audiencia.length,
      mensaje: dto.mensaje,
      fechaProgramada: dto.fechaProgramada,
      estado: dto.fechaProgramada ? 'Programada' : 'Borrador',
      progreso: 0,
      estadisticas: {
        totalEnviados: 0,
        totalEntregados: 0,
        totalFallidos: 0,
        totalLeidos: 0,
        totalRespuestas: 0,
        totalConversiones: 0,
        tasaEntrega: 0,
        tasaApertura: 0,
        tasaRespuesta: 0,
        tasaConversion: 0
      },
      creadoPor: dto.creadoPor,
      sucursalId: dto.sucursalId,
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    };

    return await this.campanaRepository.crear(campana);
  }

  /**
   * Calcular audiencia según filtros
   */
  private async calcularAudiencia(audiencia: AudienciaCampana): Promise<Paciente[]> {
    let pacientes = await this.pacienteRepository.obtenerTodos();

    // Filtrar por sucursal
    if (audiencia.sucursalIds && audiencia.sucursalIds.length > 0) {
      pacientes = pacientes.filter(p => 
        audiencia.sucursalIds!.includes(p.sucursalId || '')
      );
    }

    // Filtrar por IDs específicos
    if (audiencia.tipo === 'Personalizada' && audiencia.pacienteIds) {
      pacientes = pacientes.filter(p => 
        audiencia.pacienteIds!.includes(p.id)
      );
    }

    // Filtrar por segmento
    if (audiencia.tipo === 'Segmento' && audiencia.segmento && this.segmentarUseCase) {
      const segmentados = await this.segmentarUseCase.filtrarPorSegmento(
        pacientes,
        audiencia.segmento
      );
      pacientes = segmentados;
    }

    // Aplicar filtros adicionales
    if (audiencia.filtros) {
      const { edad, genero } = audiencia.filtros;
      
      if (edad) {
        const hoy = new Date();
        pacientes = pacientes.filter(p => {
          if (!p.fechaNacimiento) return true;
          const edadPaciente = hoy.getFullYear() - new Date(p.fechaNacimiento).getFullYear();
          if (edad.min && edadPaciente < edad.min) return false;
          if (edad.max && edadPaciente > edad.max) return false;
          return true;
        });
      }

      if (genero) {
        pacientes = pacientes.filter(p => p.genero === genero);
      }
    }

    return pacientes;
  }

  /**
   * Ejecutar campaña (envío inmediato)
   */
  async ejecutar(campanaId: string): Promise<{ 
    exito: boolean; 
    mensaje: string;
    progreso: number;
  }> {
    const campana = await this.campanaRepository.obtenerPorId(campanaId);
    if (!campana) {
      return { exito: false, mensaje: 'Campaña no encontrada', progreso: 0 };
    }

    const entity = new CampanaEsporadicaEntity(campana);
    
    if (!entity.estaListaParaEnviar()) {
      return { 
        exito: false, 
        mensaje: `Campaña no está lista para enviar (estado: ${entity.estado})`,
        progreso: entity.progreso
      };
    }

    // Iniciar campaña
    entity.iniciar();
    await this.campanaRepository.actualizar(campanaId, entity);

    // Obtener audiencia
    const audiencia = await this.calcularAudiencia(campana.audiencia);

    // Enviar mensajes
    let enviados = 0;
    let entregados = 0;
    let fallidos = 0;

    for (const paciente of audiencia) {
      try {
        if (!paciente.telefono) {
          fallidos++;
          continue;
        }

        // Personalizar mensaje
        let mensaje = campana.mensaje.contenido;
        if (campana.mensaje.incluirNombre) {
          mensaje = mensaje.replace('{nombre}', paciente.nombreCompleto);
        }

        // Enviar según canal
        if (campana.mensaje.canal === 'WhatsApp') {
          const exitoEnvio = await this.whatsAppService.enviarMensaje(
            paciente.telefono,
            mensaje,
            campana.mensaje.mediaUrl
          );

          if (exitoEnvio) {
            entregados++;
          } else {
            fallidos++;
          }
        }

        enviados++;

        // Actualizar progreso cada 10 envíos
        if (enviados % 10 === 0) {
          entity.actualizarProgreso(enviados, entregados, fallidos);
          await this.campanaRepository.actualizar(campanaId, entity);
        }

      } catch (error) {
        fallidos++;
      }
    }

    // Completar campaña
    entity.actualizarProgreso(enviados, entregados, fallidos);
    entity.completar();
    await this.campanaRepository.actualizar(campanaId, entity);

    return {
      exito: true,
      mensaje: `Campaña completada: ${entregados} entregados, ${fallidos} fallidos`,
      progreso: 100
    };
  }

  /**
   * Obtener campaña por ID
   */
  async obtenerPorId(id: string): Promise<CampanaEsporadica | null> {
    return await this.campanaRepository.obtenerPorId(id);
  }

  /**
   * Listar todas las campañas
   */
  async listarTodas(): Promise<CampanaEsporadica[]> {
    return await this.campanaRepository.obtenerTodas();
  }

  /**
   * Cancelar campaña
   */
  async cancelar(id: string): Promise<{ exito: boolean; mensaje: string }> {
    const campana = await this.campanaRepository.obtenerPorId(id);
    if (!campana) {
      return { exito: false, mensaje: 'Campaña no encontrada' };
    }

    const entity = new CampanaEsporadicaEntity(campana);
    
    try {
      entity.cancelar();
      await this.campanaRepository.actualizar(id, entity);
      return { exito: true, mensaje: 'Campaña cancelada' };
    } catch (error: any) {
      return { exito: false, mensaje: error.message };
    }
  }

  /**
   * Duplicar campaña
   */
  async duplicar(id: string, creadoPor: string): Promise<CampanaEsporadica | null> {
    const campanaOriginal = await this.campanaRepository.obtenerPorId(id);
    if (!campanaOriginal) return null;

    const nuevaCampana: CampanaEsporadica = {
      ...campanaOriginal,
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nombre: `${campanaOriginal.nombre} (Copia)`,
      estado: 'Borrador',
      progreso: 0,
      fechaProgramada: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      estadisticas: {
        totalEnviados: 0,
        totalEntregados: 0,
        totalFallidos: 0,
        totalLeidos: 0,
        totalRespuestas: 0,
        totalConversiones: 0,
        tasaEntrega: 0,
        tasaApertura: 0,
        tasaRespuesta: 0,
        tasaConversion: 0
      },
      creadoPor,
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    };

    return await this.campanaRepository.crear(nuevaCampana);
  }
}
