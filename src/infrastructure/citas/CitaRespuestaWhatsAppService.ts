/**
 * Procesa respuestas de WhatsApp para confirmar/cancelar citas
 * Cuando el paciente responde SI/NO al recordatorio
 */

import { PacienteRepositoryPostgres } from '../database/repositories/PacienteRepository';
import { CitaRepositoryPostgres } from '../database/repositories/CitaRepository';
import Database from '../database/Database';

function normalizarTelefono(tel: string): string {
  return tel.replace(/\D/g, '').replace(/^52/, ''); // Quitar código México
}

export class CitaRespuestaWhatsAppService {
  private pacienteRepo = new PacienteRepositoryPostgres();
  private citaRepo = new CitaRepositoryPostgres();

  async procesarRespuesta(telefonoWhatsApp: string, texto: string): Promise<{
    accion: 'confirmada' | 'cancelada' | 'ninguna';
    citaId?: string;
    mensaje?: string;
  }> {
    const textoNorm = (texto || '').trim().toUpperCase().replace(/Í/g, 'I');
    const esConfirmar = /^(SI|SÍ|OK|CONFIRMO|CONFIRMAR)$/i.test(textoNorm) || textoNorm === '1';
    const esCancelar = /^(NO|CANCELO|CANCELAR)$/i.test(textoNorm) || textoNorm === '2';

    if (!esConfirmar && !esCancelar) {
      return { accion: 'ninguna' };
    }

    const telNorm = normalizarTelefono(telefonoWhatsApp);

    const paciente = await this.pacienteRepo.obtenerPorTelefono(telNorm);
    if (!paciente) {
      const pacienteWhatsapp = await this.buscarPacientePorTelefonoAlternativo(telNorm);
      if (!pacienteWhatsapp) return { accion: 'ninguna' };
      return this.procesarConPaciente(pacienteWhatsapp.id, esConfirmar);
    }

    return this.procesarConPaciente(paciente.id, esConfirmar);
  }

  private async buscarPacientePorTelefonoAlternativo(telNorm: string): Promise<{ id: string } | null> {
    const pool = Database.getInstance().getPool();
    const suffix = telNorm.slice(-10);
    const result = await pool.query(
      `SELECT id FROM pacientes WHERE 
        REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '+', '') LIKE $1 
        OR REPLACE(REPLACE(REPLACE(COALESCE(whatsapp, ''), ' ', ''), '-', ''), '+', '') LIKE $1
        LIMIT 1`,
      [`%${suffix}`]
    );
    return result.rows[0] || null;
  }

  private async procesarConPaciente(
    pacienteId: string,
    esConfirmar: boolean
  ): Promise<{ accion: 'confirmada' | 'cancelada' | 'ninguna'; citaId?: string; mensaje?: string }> {
    const pool = Database.getInstance().getPool();
    const hoy = new Date().toISOString().slice(0, 10);

    const result = await pool.query(
      `SELECT id FROM citas 
       WHERE paciente_id = $1 
         AND fecha_cita >= $2::date 
         AND estado IN ('Agendada', 'Confirmada')
       ORDER BY fecha_cita ASC, hora_cita ASC 
       LIMIT 1`,
      [pacienteId, hoy]
    );

    const cita = result.rows[0];
    if (!cita) return { accion: 'ninguna' };

    if (esConfirmar) {
      await this.citaRepo.actualizar(cita.id, { estado: 'Confirmada' });
      return { accion: 'confirmada', citaId: cita.id, mensaje: 'Cita confirmada. ¡Te esperamos!' };
    } else {
      await this.citaRepo.actualizar(cita.id, {
        estado: 'Cancelada',
        motivoCancelacion: 'Cancelada por paciente vía WhatsApp',
      });
      return { accion: 'cancelada', citaId: cita.id, mensaje: 'Cita cancelada. ¿Deseas reagendar? Contáctanos.' };
    }
  }
}
