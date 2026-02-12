import { Request, Response } from 'express';
import Database from '../../infrastructure/database/Database';

type TareaEstado = 'pendiente' | 'recibida' | 'en_progreso' | 'terminada';
type TareaPrioridad = 'alta' | 'media' | 'baja';
type NoticiaTipo = 'general' | 'local';

interface PortalComentario {
  id: string;
  autor: string;
  mensaje: string;
  fecha: string;
}

interface PortalEvidencia {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'archivo';
  dataUri?: string;
  url?: string;
  fecha: string;
}

interface PortalTarea {
  id: string;
  sucursalId: string;
  titulo: string;
  descripcion: string;
  prioridad: TareaPrioridad;
  estado: TareaEstado;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaRecibida?: string;
  fechaInicio?: string;
  fechaFin?: string;
  comentarios: PortalComentario[];
  evidencias: PortalEvidencia[];
}

interface PortalNoticia {
  id: string;
  titulo: string;
  contenido: string;
  fechaPublicacion: string;
  tipo: NoticiaTipo;
  sucursalId?: string;
}

const pool = Database.getInstance().getPool();

interface NoticiaRow {
  id: string;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  tipo: NoticiaTipo;
  sucursal_id?: string | null;
}

interface TareaRow {
  id: string;
  sucursal_id: string;
  titulo: string;
  descripcion: string;
  prioridad: TareaPrioridad;
  estado: TareaEstado;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_recibida?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

const mapNoticia = (row: NoticiaRow): PortalNoticia => ({
  id: row.id,
  titulo: row.titulo,
  contenido: row.contenido,
  fechaPublicacion: row.fecha_publicacion,
  tipo: row.tipo,
  sucursalId: row.sucursal_id || undefined,
});

const mapTarea = (row: TareaRow, comentarios: PortalComentario[], evidencias: PortalEvidencia[]): PortalTarea => ({
  id: row.id,
  sucursalId: row.sucursal_id,
  titulo: row.titulo,
  descripcion: row.descripcion,
  prioridad: row.prioridad,
  estado: row.estado,
  fechaCreacion: row.fecha_creacion,
  fechaActualizacion: row.fecha_actualizacion,
  fechaRecibida: row.fecha_recibida || undefined,
  fechaInicio: row.fecha_inicio || undefined,
  fechaFin: row.fecha_fin || undefined,
  comentarios,
  evidencias,
});

const cargarComentarios = async (tareaIds: string[]): Promise<Record<string, PortalComentario[]>> => {
  if (!tareaIds.length) return {};
  const result = await pool.query(
    `SELECT id, tarea_id, autor_nombre, mensaje, fecha
     FROM portal_tarea_comentarios
     WHERE tarea_id = ANY($1::uuid[])
     ORDER BY fecha DESC`,
    [tareaIds]
  );
  const map: Record<string, PortalComentario[]> = {};
  result.rows.forEach((row) => {
    if (!map[row.tarea_id]) map[row.tarea_id] = [];
    map[row.tarea_id].push({
      id: row.id,
      autor: row.autor_nombre,
      mensaje: row.mensaje,
      fecha: row.fecha,
    });
  });
  return map;
};

const cargarEvidencias = async (tareaIds: string[]): Promise<Record<string, PortalEvidencia[]>> => {
  if (!tareaIds.length) return {};
  const result = await pool.query(
    `SELECT id, tarea_id, nombre, tipo, data_uri, url, fecha
     FROM portal_tarea_evidencias
     WHERE tarea_id = ANY($1::uuid[])
     ORDER BY fecha DESC`,
    [tareaIds]
  );
  const map: Record<string, PortalEvidencia[]> = {};
  result.rows.forEach((row) => {
    if (!map[row.tarea_id]) map[row.tarea_id] = [];
    map[row.tarea_id].push({
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      dataUri: row.data_uri || undefined,
      url: row.url || undefined,
      fecha: row.fecha,
    });
  });
  return map;
};

export class PortalSucursalController {
  crearNoticia = (req: Request, res: Response): void => {
    const { titulo, contenido, tipo, sucursalId } = req.body || {};
    if (!titulo || !contenido || !tipo) {
      res.status(400).json({ success: false, message: 'titulo, contenido y tipo son requeridos' });
      return;
    }
    if (tipo === 'local' && !sucursalId) {
      res.status(400).json({ success: false, message: 'sucursalId requerido para noticia local' });
      return;
    }
    (async () => {
      const response = await pool.query(
        `INSERT INTO portal_noticias (titulo, contenido, tipo, sucursal_id, publicado_por)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          titulo,
          contenido,
          tipo === 'local' ? 'local' : 'general',
          tipo === 'local' ? String(sucursalId) : null,
          req.user?.id || null,
        ]
      );
      const noticia = mapNoticia(response.rows[0]);
      res.json({ success: true, noticia });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al crear noticia' });
    });
  };

  crearTarea = (req: Request, res: Response): void => {
    const { titulo, descripcion, prioridad, sucursalId } = req.body || {};
    if (!titulo || !descripcion || !sucursalId) {
      res.status(400).json({ success: false, message: 'titulo, descripcion y sucursalId son requeridos' });
      return;
    }
    (async () => {
      const response = await pool.query(
        `INSERT INTO portal_tareas (
          sucursal_id, titulo, descripcion, prioridad, estado, creado_por
        ) VALUES ($1, $2, $3, $4, 'pendiente', $5)
        RETURNING *`,
        [
          String(sucursalId),
          titulo,
          descripcion,
          prioridad === 'alta' || prioridad === 'baja' ? prioridad : 'media',
          req.user?.id || null,
        ]
      );
      const tarea = mapTarea(response.rows[0], [], []);
      res.json({ success: true, tarea });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al crear tarea' });
    });
  };

  obtenerNoticias = (req: Request, res: Response): void => {
    const sucursalId = req.user?.sucursalId || (req.query.sucursalId as string | undefined);
    if (!sucursalId) {
      res.status(400).json({ success: false, message: 'sucursalId requerido' });
      return;
    }
    (async () => {
      const result = await pool.query(
        `SELECT * FROM portal_noticias
         WHERE tipo = 'general' OR sucursal_id = $1
         ORDER BY fecha_publicacion DESC`,
        [sucursalId]
      );
      const noticias = result.rows.map(mapNoticia);
      res.json({ success: true, noticias });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al obtener noticias' });
    });
  };

  obtenerTareas = (req: Request, res: Response): void => {
    const sucursalId = req.user?.sucursalId || (req.query.sucursalId as string | undefined);
    if (!sucursalId) {
      res.status(400).json({ success: false, message: 'sucursalId requerido' });
      return;
    }
    (async () => {
      const tareasResp = await pool.query(
        `SELECT * FROM portal_tareas WHERE sucursal_id = $1 ORDER BY fecha_creacion DESC`,
        [sucursalId]
      );
      const tareaIds = tareasResp.rows.map((row) => row.id);
      const comentariosMap = await cargarComentarios(tareaIds);
      const evidenciasMap = await cargarEvidencias(tareaIds);
      const tareas = tareasResp.rows.map((row) =>
        mapTarea(row, comentariosMap[row.id] || [], evidenciasMap[row.id] || [])
      );
      res.json({ success: true, tareas });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al obtener tareas' });
    });
  };

  recibirTarea = (req: Request, res: Response): void => {
    this.actualizarEstado(req, res, 'recibida');
  };

  iniciarTarea = (req: Request, res: Response): void => {
    this.actualizarEstado(req, res, 'en_progreso');
  };

  terminarTarea = (req: Request, res: Response): void => {
    this.actualizarEstado(req, res, 'terminada');
  };

  agregarComentario = (req: Request, res: Response): void => {
    (async () => {
      const tarea = await this.obtenerTarea(req, res);
      if (!tarea) return;
      const mensaje = String(req.body?.mensaje || '').trim();
      if (!mensaje) {
        res.status(400).json({ success: false, message: 'mensaje requerido' });
        return;
      }
      await pool.query(
        `INSERT INTO portal_tarea_comentarios (tarea_id, autor_id, autor_nombre, mensaje)
         VALUES ($1, $2, $3, $4)`,
        [tarea.id, req.user?.id || null, req.user?.username || 'sucursal', mensaje]
      );
      const actualizado = await this.obtenerTarea(req, res);
      if (actualizado) res.json({ success: true, tarea: actualizado });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al agregar comentario' });
    });
  };

  agregarEvidencia = (req: Request, res: Response): void => {
    (async () => {
      const tarea = await this.obtenerTarea(req, res);
      if (!tarea) return;
      const nombre = String(req.body?.nombre || '').trim();
      const tipo = req.body?.tipo === 'archivo' ? 'archivo' : 'imagen';
      const dataUri = req.body?.dataUri ? String(req.body.dataUri) : undefined;
      const url = req.body?.url ? String(req.body.url) : undefined;
      if (!nombre || (!dataUri && !url)) {
        res.status(400).json({ success: false, message: 'nombre y dataUri/url requeridos' });
        return;
      }
      await pool.query(
        `INSERT INTO portal_tarea_evidencias (tarea_id, nombre, tipo, data_uri, url)
         VALUES ($1, $2, $3, $4, $5)`,
        [tarea.id, nombre, tipo, dataUri || null, url || null]
      );
      const actualizado = await this.obtenerTarea(req, res);
      if (actualizado) res.json({ success: true, tarea: actualizado });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al agregar evidencia' });
    });
  };

  private actualizarEstado(req: Request, res: Response, estado: TareaEstado): void {
    (async () => {
      const tarea = await this.obtenerTarea(req, res);
      if (!tarea) return;
      const updateFields: string[] = ['estado = $1', 'fecha_actualizacion = NOW()'];
      const values: (TareaEstado | string)[] = [estado];
      const idx = 2;
      if (estado === 'recibida') {
        updateFields.push(`fecha_recibida = NOW()`);
      }
      if (estado === 'en_progreso') {
        updateFields.push(`fecha_inicio = NOW()`);
      }
      if (estado === 'terminada') {
        updateFields.push(`fecha_fin = NOW()`);
      }
      values.push(tarea.id);
      await pool.query(
        `UPDATE portal_tareas SET ${updateFields.join(', ')} WHERE id = $${idx}`,
        values
      );
      const actualizado = await this.obtenerTarea(req, res);
      if (actualizado) res.json({ success: true, tarea: actualizado });
    })().catch((error) => {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al actualizar tarea' });
    });
  }

  private async obtenerTarea(req: Request, res: Response): Promise<PortalTarea | null> {
    const sucursalId = req.user?.sucursalId || (req.query.sucursalId as string | undefined);
    if (!sucursalId) {
      res.status(400).json({ success: false, message: 'sucursalId requerido' });
      return null;
    }
    const result = await pool.query(
      `SELECT * FROM portal_tareas WHERE id = $1 AND sucursal_id = $2 LIMIT 1`,
      [req.params.id, sucursalId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'tarea no encontrada' });
      return null;
    }
    const tareaRow = result.rows[0];
    const comentariosMap = await cargarComentarios([tareaRow.id]);
    const evidenciasMap = await cargarEvidencias([tareaRow.id]);
    return mapTarea(
      tareaRow,
      comentariosMap[tareaRow.id] || [],
      evidenciasMap[tareaRow.id] || []
    );
  }
}

export default new PortalSucursalController();
