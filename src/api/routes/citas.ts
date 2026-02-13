import { Router } from 'express';
import { CitaController } from '../controllers/CitaController';
import { autenticar } from '../middleware/auth';
import { requiereRol, requierePermiso } from '../middleware/authorization';

const router = Router();
const controller = new CitaController();

/**
 * @route POST /api/citas
 * @desc Crear una nueva cita
 * @access Privado (Recepción, Contact_Center, Admin)
 */
router.post('/', autenticar, requierePermiso('citas', 'crear'), (req, res) => controller.crear(req, res));

/**
 * @route GET /api/citas
 * @desc Listado paginado de citas (vista lista)
 * @query page, pageSize, search, estado, sucursalId, fechaInicio, fechaFin, sortField, sortDirection
 * @access Privado
 */
router.get('/', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.listar(req, res));

/**
 * @route POST /api/citas/publica
 * @desc Crear cita publica (mobile)
 * @access Publico
 */
router.post('/publica', (req, res) => controller.crearPublica(req, res));

/**
 * @route GET /api/citas/publica/disponibilidad/:sucursalId
 * @desc Disponibilidad publica por sucursal
 * @access Publico
 */
router.get('/publica/disponibilidad/:sucursalId', (req, res) =>
  controller.obtenerDisponibilidadPublica(req, res)
);

/**
 * @route POST /api/citas/publica/reservar-slot
 * @desc Reserva temporal de slot (slot holding) para evitar doble reserva
 * @access Publico
 */
router.post('/publica/reservar-slot', (req, res) => controller.reservarSlot(req, res));

/**
 * @route GET /api/citas/doctor
 * @desc Obtener citas por doctor y fecha
 * @query fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @query medico - Nombre del doctor
 * @access Privado (Medico, Supervisor, Admin)
 */
router.get('/doctor', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerPorDoctorYFecha(req, res)
);

/**
 * @route GET /api/citas/doctor/rango
 * @desc Obtener citas por doctor y rango de fechas
 * @query fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @query fechaFin - Fecha fin (YYYY-MM-DD)
 * @query medico - Nombre del doctor
 * @access Privado (Medico, Supervisor, Admin)
 */
router.get('/doctor/rango', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerPorDoctorYRango(req, res)
);

/**
 * @route GET /api/citas/doctor-rango
 * @desc Alias: mismo que /doctor/rango (citas por doctor y rango de fechas)
 */
router.get('/doctor-rango', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerPorDoctorYRango(req, res)
);

/**
 * @route GET /api/citas/rango
 * @desc Obtener citas por rango de fechas (todas las sucursales o una específica)
 * @query fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @query fechaFin - Fecha fin (YYYY-MM-DD)
 * @query sucursalId - Opcional: filtrar por sucursal
 * @access Privado
 */
router.get('/rango', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerPorRango(req, res)
);

/**
 * @route GET /api/citas/confirmar/:token
 * @desc Confirmar cita por token (enlace público)
 * @access Público
 */
router.get('/confirmar/:token', (req, res) => controller.confirmarPorToken(req, res));

/**
 * @route POST /api/citas/lista-espera
 * @desc Crear solicitud en lista de espera (público o con auth)
 * @access Público
 */
router.post('/lista-espera', (req, res) => controller.listaEsperaCrear(req, res));

/**
 * @route GET /api/citas/lista-espera
 * @desc Listar solicitudes de lista de espera
 * @access Privado
 */
router.get('/lista-espera', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.listaEsperaListar(req, res)
);

/**
 * @route PUT /api/citas/lista-espera/:id/asignar
 * @desc Asignar cita a una solicitud de lista de espera
 * @access Privado
 */
router.put('/lista-espera/:id/asignar', autenticar, requierePermiso('citas', 'actualizar'), (req, res) =>
  controller.listaEsperaAsignar(req, res)
);

/**
 * @route GET /api/citas/plantillas-mensajes
 * @desc Listar plantillas de mensajes para citas
 * @access Privado
 */
router.get('/plantillas-mensajes', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.plantillasListar(req, res)
);

/**
 * @route PUT /api/citas/plantillas-mensajes/:tipo
 * @desc Actualizar plantilla por tipo (nueva_cita, confirmacion_cita, recordatorio_cita, aviso_retraso)
 * @access Privado
 */
router.put('/plantillas-mensajes/:tipo', autenticar, requierePermiso('citas', 'actualizar'), (req, res) =>
  controller.plantillasActualizar(req, res)
);

/**
 * @route GET /api/citas/:id
 * @desc Obtener cita por ID
 * @access Privado
 */
router.get('/:id', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.obtenerPorId(req, res));

/**
 * @route GET /api/citas/paciente/:pacienteId
 * @desc Obtener todas las citas de un paciente
 * @access Privado
 */
router.get('/paciente/:pacienteId', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.obtenerPorPaciente(req, res));

/**
 * @route GET /api/citas/sucursal/:sucursalId
 * @desc Obtener citas por sucursal y fecha
 * @query fecha - Fecha en formato ISO (YYYY-MM-DD)
 * @access Privado
 */
router.get('/sucursal/:sucursalId', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerPorSucursalYFecha(req, res)
);

/**
 * @route GET /api/citas/disponibilidad/:sucursalId
 * @desc Obtener horarios disponibles para una sucursal
 * @query fecha, doctorId, inicio, fin, intervaloMin, maxEmpalmes
 * @access Privado
 */
router.get('/disponibilidad/:sucursalId', autenticar, (req, res) => controller.obtenerDisponibilidad(req, res));

/**
 * @route GET /api/citas/stats/kpi
 * @desc KPI de citas (confirmación, asistencia, no-show)
 * @query sucursalId?, fechaInicio?, fechaFin?
 * @access Privado
 */
router.get('/stats/kpi', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerKpi(req, res)
);

/**
 * @route GET /api/citas/stats/ocupacion
 * @desc Analytics de ocupación por sucursal/doctor/fecha (datos reales)
 * @query sucursalId?, fechaInicio?, fechaFin?, medicoAsignado?
 * @access Privado
 */
router.get('/stats/ocupacion', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerOcupacion(req, res)
);

/**
 * @route GET /api/citas/alertas/riesgo
 * @desc Alertas de riesgo de no-show
 * @query sucursalId?
 * @access Privado
 */
router.get('/alertas/riesgo', autenticar, requierePermiso('citas', 'leer'), (req, res) =>
  controller.obtenerAlertasRiesgo(req, res)
);

/**
 * @route PUT /api/citas/:id
 * @desc Actualizar una cita (editar)
 * @body { fechaCita, horaCita, especialidad, medicoAsignado, notas, sinHorario }
 * @access Privado (Recepción, Contact_Center, Supervisor, Admin)
 */
router.put('/:id', autenticar, requierePermiso('citas', 'actualizar'), (req, res) => controller.actualizar(req, res));

/**
 * @route PUT /api/citas/:id/reagendar
 * @desc Reagendar una cita (valida regla de 1 reagendamiento para promociones)
 * @body { nuevaFecha, nuevaHora, motivo, precioRegular }
 * @access Privado (Recepción, Contact_Center, Supervisor, Admin)
 */
router.put('/:id/reagendar', autenticar, requierePermiso('citas', 'actualizar'), (req, res) => controller.reagendar(req, res));

/**
 * @route GET /api/citas/:id/validar-reagendacion
 * @desc Valida si una cita puede reagendarse y si mantiene su promoción
 * @access Privado (Contact Center, Recepción)
 */
router.get('/:id/validar-reagendacion', autenticar, requierePermiso('citas', 'leer'), (req, res) => controller.validarReagendacion(req, res));

/**
 * @route PUT /api/citas/:id/llegada
 * @desc Marcar llegada del paciente
 * @access Privado (Recepción)
 */
router.put('/:id/llegada', autenticar, requiereRol(['Recepcion', 'Admin']), (req, res) => controller.marcarLlegada(req, res));

/**
 * @route POST /api/citas/:id/enviar-recordatorio
 * @desc Enviar recordatorio manual al paciente (desde embudo CRM)
 * @access Privado (Recepcion, Admin, Contact_Center)
 */
router.post('/:id/enviar-recordatorio', autenticar, requiereRol(['Recepcion', 'Admin', 'Contact_Center']), (req, res) =>
  controller.enviarRecordatorio(req, res)
);

/**
 * @route PUT /api/citas/:id/no-asistencia
 * @desc Marcar cita como no asistencia (sincronización con CRM)
 * @access Privado (Recepcion, Admin)
 */
router.put('/:id/no-asistencia', autenticar, requiereRol(['Recepcion', 'Admin', 'Contact_Center']), (req, res) =>
  controller.marcarNoAsistencia(req, res)
);

/**
 * @route PUT /api/citas/:id/cancelar
 * @desc Cancelar una cita
 * @body { motivo }
 * @access Privado (Supervisor, Admin)
 */
router.put('/:id/cancelar', autenticar, requiereRol(['Supervisor', 'Admin', 'Medico']), (req, res) =>
  controller.cancelar(req, res)
);

export default router;
