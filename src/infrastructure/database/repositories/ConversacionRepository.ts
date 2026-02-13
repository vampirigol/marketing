import { Pool } from 'pg';
import Database from '../Database';

export interface ConversacionResumen {
  id: string;
  canal: 'WhatsApp' | 'Facebook' | 'Instagram';
  canalId: string;
  pacienteId?: string;
  sucursalId?: string;
  nombreContacto: string;
  ultimoMensaje?: string;
  fechaUltimoMensaje?: Date;
  mensajesNoLeidos: number;
  estado: 'Activa' | 'Pendiente' | 'Cerrada';
  prioridad: 'Urgente' | 'Alta' | 'Normal' | 'Baja';
  etiquetas: string[];
  asignadoA?: string;
  fechaCreacion: Date;
  fechaCierre?: Date;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  esPaciente: boolean;
  usuarioId?: string;
  contenido: string;
  tipoMensaje: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video' | 'sistema';
  fechaEnvio: Date;
  leido: boolean;
  fechaLectura?: Date;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamano?: number;
  audioDuracion?: number;
  estadoEntrega?: 'enviando' | 'enviado' | 'entregado' | 'leido' | 'fallido';
}

export interface PlantillaRespuesta {
  id: string;
  usuarioId?: string;
  nombre: string;
  contenido: string;
  etiquetas: string[];
  esGlobal: boolean;
  activa: boolean;
  usoCount: number;
  creadoPor?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

export interface ConversacionRepository {
  obtenerTodas(filtros: {
    canal?: string;
    estado?: string;
    prioridad?: string;
    busqueda?: string;
    asignadoA?: string;
    /** Si se pasa, solo se devuelven conversaciones de estas sucursales o sin sucursal (FB/IG). Contact_Center/Admin no pasan este filtro. */
    sucursalIds?: string[];
  }): Promise<ConversacionResumen[]>;
  obtenerPorId(id: string): Promise<ConversacionResumen | null>;
  obtenerMensajes(conversacionId: string): Promise<Mensaje[]>;
  enviarMensaje(mensaje: Omit<Mensaje, 'id' | 'fechaEnvio' | 'leido'>): Promise<Mensaje>;
  marcarComoLeida(conversacionId: string): Promise<void>;
  actualizarEstado(id: string, estado: string): Promise<void>;
  actualizarPrioridad(id: string, prioridad: string): Promise<void>;
  agregarEtiqueta(id: string, etiqueta: string): Promise<void>;
  quitarEtiqueta(id: string, etiqueta: string): Promise<void>;
  asignar(id: string, usuarioId: string): Promise<void>;
  actualizarNombreContacto(conversacionId: string, nombreContacto: string): Promise<void>;
  vincularPaciente(id: string, pacienteId: string): Promise<void>;
  obtenerPlantillas(usuarioId?: string): Promise<PlantillaRespuesta[]>;
  crearPlantilla(plantilla: Omit<PlantillaRespuesta, 'id' | 'usoCount' | 'fechaCreacion' | 'ultimaActualizacion'>): Promise<PlantillaRespuesta>;
  usarPlantilla(id: string): Promise<void>;
  /** Crea/actualiza conversación y agrega mensaje entrante (desde webhook FB/IG/WA). Retorna { conversacionId, mensaje }. Para WhatsApp multi-sucursal, pasar sucursalId. */
  asegurarConversacionYMensaje(params: {
    canal: 'Facebook' | 'Instagram' | 'WhatsApp';
    canalId: string;
    contenido: string;
    tipoMensaje?: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video' | 'sistema';
    archivoUrl?: string;
    nombreContacto?: string;
    /** Obligatorio para canal WhatsApp cuando hay multi-sucursal (enrutamiento por phone_number_id). */
    sucursalId?: string;
  }): Promise<{ conversacionId: string; mensaje: Mensaje }>;
}

export class ConversacionRepositoryPostgres implements ConversacionRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async obtenerTodas(filtros: {
    canal?: string;
    estado?: string;
    prioridad?: string;
    busqueda?: string;
    asignadoA?: string;
    sucursalIds?: string[];
  }): Promise<ConversacionResumen[]> {
    let query = `
      SELECT 
        c.id, c.canal, c.canal_id, c.paciente_id,
        COALESCE(p.nombre_completo, c.nombre_contacto, c.canal_id) as nombre_contacto,
        c.ultimo_mensaje, c.ultimo_mensaje_fecha, c.mensajes_no_leidos,
        c.estado, c.prioridad, c.etiquetas, c.asignado_a,
        c.fecha_creacion, c.fecha_cierre
      FROM conversaciones_matrix c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (filtros.sucursalIds !== undefined) {
      if (filtros.sucursalIds.length > 0) {
        query += ` AND (c.sucursal_id IS NULL OR c.sucursal_id = ANY($${paramIndex}::uuid[]))`;
        values.push(filtros.sucursalIds);
        paramIndex++;
      } else {
        query += ` AND c.sucursal_id IS NULL`;
      }
    }

    if (filtros.canal) {
      query += ` AND c.canal = $${paramIndex}`;
      values.push(filtros.canal);
      paramIndex++;
    }
    if (filtros.estado) {
      query += ` AND c.estado = $${paramIndex}`;
      values.push(filtros.estado);
      paramIndex++;
    }
    if (filtros.prioridad) {
      query += ` AND c.prioridad = $${paramIndex}`;
      values.push(filtros.prioridad);
      paramIndex++;
    }
    if (filtros.asignadoA) {
      query += ` AND c.asignado_a = $${paramIndex}`;
      values.push(filtros.asignadoA);
      paramIndex++;
    }
    if (filtros.busqueda) {
      query += ` AND (LOWER(COALESCE(p.nombre_completo, c.nombre_contacto, c.canal_id)) LIKE $${paramIndex} OR LOWER(c.ultimo_mensaje) LIKE $${paramIndex})`;
      values.push(`%${filtros.busqueda.toLowerCase()}%`);
      paramIndex++;
    }

    query += ' ORDER BY c.ultimo_mensaje_fecha DESC NULLS LAST';

    const result = await this.pool.query(query, values);
    return result.rows.map((row) => ({
      id: row.id,
      canal: row.canal,
      canalId: row.canal_id,
      pacienteId: row.paciente_id,
      nombreContacto: row.nombre_contacto,
      ultimoMensaje: row.ultimo_mensaje,
      fechaUltimoMensaje: row.ultimo_mensaje_fecha,
      mensajesNoLeidos: parseInt(row.mensajes_no_leidos),
      estado: row.estado,
      prioridad: row.prioridad,
      etiquetas: row.etiquetas || [],
      asignadoA: row.asignado_a,
      fechaCreacion: row.fecha_creacion,
      fechaCierre: row.fecha_cierre,
    }));
  }

  async obtenerPorId(id: string): Promise<ConversacionResumen | null> {
    const query = `
      SELECT 
        c.id, c.canal, c.canal_id, c.paciente_id, c.sucursal_id,
        COALESCE(p.nombre_completo, c.nombre_contacto, c.canal_id) as nombre_contacto,
        c.ultimo_mensaje, c.ultimo_mensaje_fecha, c.mensajes_no_leidos,
        c.estado, c.prioridad, c.etiquetas, c.asignado_a,
        c.fecha_creacion, c.fecha_cierre
      FROM conversaciones_matrix c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.id = $1
    `;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      canal: row.canal,
      canalId: row.canal_id,
      pacienteId: row.paciente_id,
      sucursalId: row.sucursal_id,
      nombreContacto: row.nombre_contacto,
      ultimoMensaje: row.ultimo_mensaje,
      fechaUltimoMensaje: row.ultimo_mensaje_fecha,
      mensajesNoLeidos: parseInt(row.mensajes_no_leidos),
      estado: row.estado,
      prioridad: row.prioridad,
      etiquetas: row.etiquetas || [],
      asignadoA: row.asignado_a,
      fechaCreacion: row.fecha_creacion,
      fechaCierre: row.fecha_cierre,
    };
  }

  async obtenerMensajes(conversacionId: string): Promise<Mensaje[]> {
    const query = `
      SELECT id, conversacion_id, es_paciente, usuario_id, contenido, tipo_mensaje, fecha_envio, leido, fecha_lectura,
             archivo_url, archivo_nombre, archivo_tipo, archivo_tamano, audio_duracion, estado_entrega
      FROM mensajes_matrix
      WHERE conversacion_id = $1
      ORDER BY fecha_envio ASC
    `;
    const result = await this.pool.query(query, [conversacionId]);
    return result.rows.map((row) => ({
      id: row.id,
      conversacionId: row.conversacion_id,
      esPaciente: row.es_paciente,
      usuarioId: row.usuario_id,
      contenido: row.contenido,
      tipoMensaje: row.tipo_mensaje,
      fechaEnvio: row.fecha_envio,
      leido: row.leido,
      fechaLectura: row.fecha_lectura,
      archivoUrl: row.archivo_url,
      archivoNombre: row.archivo_nombre,
      archivoTipo: row.archivo_tipo,
      archivoTamano: row.archivo_tamano,
      audioDuracion: row.audio_duracion,
      estadoEntrega: row.estado_entrega,
    }));
  }

  async enviarMensaje(mensaje: Omit<Mensaje, 'id' | 'fechaEnvio' | 'leido'>): Promise<Mensaje> {
    const query = `
      INSERT INTO mensajes_matrix (conversacion_id, es_paciente, usuario_id, contenido, tipo_mensaje,
                                    archivo_url, archivo_nombre, archivo_tipo, archivo_tamano, audio_duracion, estado_entrega)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      mensaje.conversacionId,
      mensaje.esPaciente,
      mensaje.usuarioId,
      mensaje.contenido,
      mensaje.tipoMensaje,
      mensaje.archivoUrl || null,
      mensaje.archivoNombre || null,
      mensaje.archivoTipo || null,
      mensaje.archivoTamano || null,
      mensaje.audioDuracion || null,
      mensaje.estadoEntrega || 'enviado',
    ];
    const result = await this.pool.query(query, values);
    const row = result.rows[0];

    // Actualizar ultimo_mensaje de la conversación
    await this.pool.query(
      `UPDATE conversaciones_matrix SET ultimo_mensaje = $1, ultimo_mensaje_fecha = NOW() WHERE id = $2`,
      [mensaje.contenido, mensaje.conversacionId]
    );

    return {
      id: row.id,
      conversacionId: row.conversacion_id,
      esPaciente: row.es_paciente,
      usuarioId: row.usuario_id,
      contenido: row.contenido,
      tipoMensaje: row.tipo_mensaje,
      fechaEnvio: row.fecha_envio,
      leido: row.leido,
      fechaLectura: row.fecha_lectura,
      archivoUrl: row.archivo_url,
      archivoNombre: row.archivo_nombre,
      archivoTipo: row.archivo_tipo,
      archivoTamano: row.archivo_tamano,
      audioDuracion: row.audio_duracion,
      estadoEntrega: row.estado_entrega,
    };
  }

  async marcarComoLeida(conversacionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET mensajes_no_leidos = 0 WHERE id = $1`,
      [conversacionId]
    );
    await this.pool.query(
      `UPDATE mensajes_matrix SET leido = true, fecha_lectura = NOW() WHERE conversacion_id = $1 AND leido = false`,
      [conversacionId]
    );
  }

  async actualizarEstado(id: string, estado: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET estado = $1 WHERE id = $2`,
      [estado, id]
    );
  }

  async actualizarPrioridad(id: string, prioridad: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET prioridad = $1 WHERE id = $2`,
      [prioridad, id]
    );
  }

  async agregarEtiqueta(id: string, etiqueta: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET etiquetas = array_append(etiquetas, $1) WHERE id = $2 AND NOT ($1 = ANY(etiquetas))`,
      [etiqueta, id]
    );
  }

  async quitarEtiqueta(id: string, etiqueta: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET etiquetas = array_remove(etiquetas, $1) WHERE id = $2`,
      [etiqueta, id]
    );
  }

  async asignar(id: string, usuarioId: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET asignado_a = $1 WHERE id = $2`,
      [usuarioId, id]
    );
  }

  async actualizarNombreContacto(conversacionId: string, nombreContacto: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET nombre_contacto = $1 WHERE id = $2`,
      [nombreContacto, conversacionId]
    );
  }

  async vincularPaciente(id: string, pacienteId: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversaciones_matrix SET paciente_id = $1 WHERE id = $2`,
      [pacienteId, id]
    );
  }

  async obtenerPlantillas(usuarioId?: string): Promise<PlantillaRespuesta[]> {
    const query = usuarioId
      ? `SELECT * FROM plantillas_respuesta WHERE (usuario_id = $1 OR es_global = true) AND activa = true ORDER BY nombre ASC`
      : `SELECT * FROM plantillas_respuesta WHERE es_global = true AND activa = true ORDER BY nombre ASC`;
    const values = usuarioId ? [usuarioId] : [];
    const result = await this.pool.query(query, values);
    return result.rows.map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      nombre: row.nombre,
      contenido: row.contenido,
      etiquetas: row.etiquetas || [],
      esGlobal: row.es_global,
      activa: row.activa,
      usoCount: parseInt(row.uso_count),
      creadoPor: row.creado_por,
      fechaCreacion: row.fecha_creacion,
      ultimaActualizacion: row.ultima_actualizacion,
    }));
  }

  async crearPlantilla(plantilla: Omit<PlantillaRespuesta, 'id' | 'usoCount' | 'fechaCreacion' | 'ultimaActualizacion'>): Promise<PlantillaRespuesta> {
    const query = `
      INSERT INTO plantillas_respuesta (usuario_id, nombre, contenido, etiquetas, es_global, activa, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      plantilla.usuarioId,
      plantilla.nombre,
      plantilla.contenido,
      plantilla.etiquetas,
      plantilla.esGlobal,
      plantilla.activa,
      plantilla.creadoPor,
    ];
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      nombre: row.nombre,
      contenido: row.contenido,
      etiquetas: row.etiquetas || [],
      esGlobal: row.es_global,
      activa: row.activa,
      usoCount: parseInt(row.uso_count),
      creadoPor: row.creado_por,
      fechaCreacion: row.fecha_creacion,
      ultimaActualizacion: row.ultima_actualizacion,
    };
  }

  async usarPlantilla(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE plantillas_respuesta SET uso_count = uso_count + 1, ultima_actualizacion = NOW() WHERE id = $1`,
      [id]
    );
  }

  async asegurarConversacionYMensaje(params: {
    canal: 'Facebook' | 'Instagram' | 'WhatsApp';
    canalId: string;
    contenido: string;
    tipoMensaje?: 'texto' | 'imagen' | 'audio' | 'archivo' | 'video' | 'sistema';
    archivoUrl?: string;
    nombreContacto?: string;
    sucursalId?: string;
  }): Promise<{ conversacionId: string; mensaje: Mensaje }> {
    const { canal, canalId, contenido, tipoMensaje = 'texto', archivoUrl, nombreContacto, sucursalId } = params;
    const client = await this.pool.connect();

    try {
      // 1. Insertar o obtener conversación (UPSERT). WhatsApp multi-sucursal usa (canal, canal_id, sucursal_id); FB/IG usan (canal, canal_id).
      const isWhatsAppConSucursal = canal === 'WhatsApp' && sucursalId;
      let upsert;
      if (isWhatsAppConSucursal) {
        upsert = await client.query(
          `INSERT INTO conversaciones_matrix (canal, canal_id, nombre_contacto, sucursal_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (canal, canal_id, sucursal_id) WHERE (canal = 'WhatsApp' AND sucursal_id IS NOT NULL) DO UPDATE SET
             nombre_contacto = COALESCE(EXCLUDED.nombre_contacto, conversaciones_matrix.nombre_contacto)
           RETURNING id`,
          [canal, canalId, nombreContacto || null, sucursalId]
        );
      } else {
        upsert = await client.query(
          `INSERT INTO conversaciones_matrix (canal, canal_id, nombre_contacto, sucursal_id)
           VALUES ($1, $2, $3, NULL)
           ON CONFLICT (canal, canal_id) WHERE (canal <> 'WhatsApp' OR conversaciones_matrix.sucursal_id IS NULL) DO UPDATE SET
             nombre_contacto = COALESCE(EXCLUDED.nombre_contacto, conversaciones_matrix.nombre_contacto),
             canal = EXCLUDED.canal
           RETURNING id`,
          [canal, canalId, nombreContacto || null]
        );
      }
      const conversacionId = upsert.rows[0].id;

      // 2. Actualizar último mensaje y contador de no leídos
      await client.query(
        `UPDATE conversaciones_matrix
         SET ultimo_mensaje = $1, ultimo_mensaje_fecha = NOW(), mensajes_no_leidos = mensajes_no_leidos + 1
         WHERE id = $2`,
        [contenido.substring(0, 500), conversacionId]
      );

      // 3. Insertar mensaje entrante
      const msgResult = await client.query(
        `INSERT INTO mensajes_matrix (conversacion_id, es_paciente, contenido, tipo_mensaje, archivo_url)
         VALUES ($1, true, $2, $3, $4)
         RETURNING id, conversacion_id, es_paciente, usuario_id, contenido, tipo_mensaje, fecha_envio, leido, fecha_lectura,
                  archivo_url, archivo_nombre, archivo_tipo, archivo_tamano, audio_duracion, estado_entrega`,
        [conversacionId, contenido, tipoMensaje, archivoUrl || null]
      );
      const row = msgResult.rows[0];
      const mensaje: Mensaje = {
        id: row.id,
        conversacionId: row.conversacion_id,
        esPaciente: row.es_paciente,
        usuarioId: row.usuario_id,
        contenido: row.contenido,
        tipoMensaje: row.tipo_mensaje,
        fechaEnvio: row.fecha_envio,
        leido: row.leido,
        fechaLectura: row.fecha_lectura,
        archivoUrl: row.archivo_url,
        archivoNombre: row.archivo_nombre,
        archivoTipo: row.archivo_tipo,
        archivoTamano: row.archivo_tamano,
        audioDuracion: row.audio_duracion,
        estadoEntrega: row.estado_entrega,
      };

      return { conversacionId, mensaje };
    } finally {
      client.release();
    }
  }
}
