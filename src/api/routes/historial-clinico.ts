import { Router } from 'express';
import { HistorialClinicoController } from '../controllers/HistorialClinicoController';
import { HistorialClinicoRepositoryPostgres } from '../../infrastructure/database/repositories/HistorialClinicoRepository';
import Database from '../../infrastructure/database/Database';
import { autenticar } from '../middleware/auth';
import { requiereRol } from '../middleware/authorization';

const router = Router();
const pool = Database.getInstance().getPool();
const historialRepo = new HistorialClinicoRepositoryPostgres(pool);
const historialController = new HistorialClinicoController(historialRepo);

// Todas las rutas requieren autenticación
router.use(autenticar);

// ============================================
// CONSULTAS MÉDICAS
// ============================================

// Crear nueva consulta médica
router.post(
  '/consultas',
  requiereRol('Medico', 'Admin'),
  historialController.crearConsulta
);

// Obtener consultas de un paciente
router.get(
  '/paciente/:pacienteId/consultas',
  requiereRol('Medico', 'Admin', 'Recepcion'),
  historialController.obtenerConsultasPaciente
);

// Obtener una consulta específica
router.get(
  '/consultas/:consultaId',
  requiereRol('Medico', 'Admin', 'Recepcion'),
  historialController.obtenerConsulta
);

// Actualizar consulta
router.put(
  '/consultas/:consultaId',
  requiereRol('Medico', 'Admin'),
  historialController.actualizarConsulta
);

// ============================================
// SIGNOS VITALES
// ============================================

// Registrar signos vitales
router.post(
  '/signos-vitales',
  requiereRol('Medico', 'Admin', 'Recepcion'),
  historialController.registrarSignosVitales
);

// Obtener signos vitales de un paciente
router.get(
  '/paciente/:pacienteId/signos-vitales',
  requiereRol('Medico', 'Admin', 'Recepcion'),
  historialController.obtenerSignosVitalesPaciente
);

// ============================================
// ANTECEDENTES MÉDICOS
// ============================================

// Agregar antecedente médico
router.post(
  '/antecedentes',
  requiereRol('Medico', 'Admin'),
  historialController.agregarAntecedente
);

// Obtener antecedentes de un paciente
router.get(
  '/paciente/:pacienteId/antecedentes',
  requiereRol('Medico', 'Admin', 'Recepcion'),
  historialController.obtenerAntecedentesPaciente
);

// ============================================
// MEDICAMENTOS ACTUALES
// ============================================

// Agregar medicamento
router.post(
  '/medicamentos',
  requiereRol('Medico', 'Admin'),
  historialController.agregarMedicamento
);

// Obtener medicamentos de un paciente
router.get(
  '/paciente/:pacienteId/medicamentos',
  requiereRol('Medico', 'Admin', 'Recepcion'),
  historialController.obtenerMedicamentosPaciente
);

// ============================================
// RESUMEN COMPLETO
// ============================================

// Obtener historial clínico completo del paciente
router.get(
  '/paciente/:pacienteId/completo',
  requiereRol('Medico', 'Admin'),
  historialController.obtenerHistorialCompleto
);

export default router;
