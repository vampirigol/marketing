/**
 * Rutas: Solicitudes de Contacto
 * Define los endpoints para gestión de solicitudes de contacto con agentes
 */

import { Router } from 'express';
import { ContactoController } from '../controllers/ContactoController';

const router = Router();
const controller = new ContactoController();

/**
 * @route POST /api/contactos
 * @desc Crear nueva solicitud de contacto
 * @body { nombreCompleto, telefono, email?, whatsapp?, sucursalId, sucursalNombre, motivo, motivoDetalle?, preferenciaContacto, origen? }
 * @access Público
 */
router.post('/', (req, res) => controller.crear(req, res));

/**
 * @route GET /api/contactos/:id
 * @desc Obtener solicitud por ID
 * @access Privado
 */
router.get('/:id', (req, res) => controller.obtenerPorId(req, res));

/**
 * @route GET /api/contactos
 * @desc Listar solicitudes con filtros opcionales
 * @query { estado?, sucursalId?, agenteId? }
 * @access Privado
 */
router.get('/', (req, res) => controller.listar(req, res));

/**
 * @route GET /api/contactos/sucursal/:sucursalId
 * @desc Obtener solicitudes de una sucursal
 * @access Privado
 */
router.get('/sucursal/:sucursalId', (req, res) => controller.obtenerPorSucursal(req, res));

/**
 * @route GET /api/contactos/pendientes
 * @desc Obtener solicitudes pendientes
 * @query { sucursalId? }
 * @access Privado
 */
router.get('/lista/pendientes', (req, res) => controller.obtenerPendientes(req, res));

/**
 * @route GET /api/contactos/vencidas
 * @desc Obtener solicitudes vencidas (más de 2 horas sin respuesta)
 * @access Privado
 */
router.get('/lista/vencidas', (req, res) => controller.obtenerVencidas(req, res));

/**
 * @route POST /api/contactos/:id/asignar
 * @desc Asignar agente a solicitud
 * @body { agenteId, agenteNombre }
 * @access Privado (Solo Supervisores/Admin)
 */
router.post('/:id/asignar', (req, res) => controller.asignarAgente(req, res));

/**
 * @route POST /api/contactos/:id/iniciar-contacto
 * @desc Marcar que el agente inició contacto
 * @body { notas? }
 * @access Privado (Solo Agentes)
 */
router.post('/:id/iniciar-contacto', (req, res) => controller.iniciarContacto(req, res));

/**
 * @route POST /api/contactos/:id/resolver
 * @desc Resolver solicitud
 * @body { resolucion }
 * @access Privado (Solo Agentes)
 */
router.post('/:id/resolver', (req, res) => controller.resolver(req, res));

/**
 * @route GET /api/contactos/stats/general
 * @desc Obtener estadísticas de solicitudes
 * @query { sucursalId? }
 * @access Privado
 */
router.get('/stats/general', (req, res) => controller.obtenerEstadisticas(req, res));

/**
 * @route GET /api/contactos/catalogo/motivos
 * @desc Obtener catálogo de motivos de contacto
 * @access Público
 */
router.get('/catalogo/motivos', (req, res) => controller.obtenerCatalogoMotivos(req, res));

export default router;
