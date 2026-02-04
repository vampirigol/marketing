/**
 * Validador de Reagendación - Regla de Promoción (Mismo Mes)
 *
 * Valida que una cita con promoción solo pueda reagendarse una vez
 * dentro del MISMO MES de la cita original.
 * En la segunda reagendación (aunque sea del mismo mes), se pierde la promoción.
 */

import { CitaEntity } from '../entities/Cita';

export class ValidadorReagendacionPromocion {
  /**
   * Valida si una cita puede reagendarse manteniendo su promoción
   * y si la nueva fecha respeta la regla de "mismo mes"
   */
  static validar(
    cita: CitaEntity,
    nuevaFecha: Date
  ): {
    puedeReagendar: boolean;
    mantienePromocion: boolean;
    mensaje: string;
    advertencias: string[];
  } {
    const advertencias: string[] = [];
    let mantienePromocion = true;
    let mensaje = '';

    // 1. Validar que la cita existe
    if (!cita) {
      return {
        puedeReagendar: false,
        mantienePromocion: false,
        mensaje: 'Cita no encontrada',
        advertencias: [],
      };
    }

    // 2. Validar que la cita no esté cancelada o ya atendida
    if (cita.estado === 'Cancelada' || cita.estado === 'Atendida') {
      return {
        puedeReagendar: false,
        mantienePromocion: false,
        mensaje: `No se puede reagendar una cita ${cita.estado}`,
        advertencias: [],
      };
    }

    // 3. Si NO es promoción, no hay restricción
    if (!cita.esPromocion) {
      return {
        puedeReagendar: true,
        mantienePromocion: false,
        mensaje: 'Cita sin promoción - puede reagendarse sin restricción',
        advertencias: [],
      };
    }

    // 4. Validaciones específicas para citas con PROMOCIÓN
    // 4a. Primera reagendación: se mantiene la promoción PERO debe ser en el mismo mes
    if (cita.reagendaciones === 0) {
      // Validar "mismo mes"
      const mesOriginal = cita.fechaCita.getMonth();
      const anoOriginal = cita.fechaCita.getFullYear();
      const mesNuevo = nuevaFecha.getMonth();
      const anoNuevo = nuevaFecha.getFullYear();

      if (mesOriginal !== mesNuevo || anoOriginal !== anoNuevo) {
        advertencias.push(
          `⚠️ ADVERTENCIA: La promoción solo aplica para reagendaciones en el MISMO MES.\n` +
          `Mes original: ${this.nombreMes(mesOriginal)} ${anoOriginal}\n` +
          `Mes nuevo: ${this.nombreMes(mesNuevo)} ${anoNuevo}`
        );

        // Si intenta reagendar fuera del mes, se pierde la promoción automáticamente
        mantienePromocion = false;
        mensaje =
          '⚠️ ATENCIÓN: Se intenta reagendar fuera del mes de la promoción original.\n' +
          'La promoción se perderá automáticamente y se cobrará precio regular.';
      } else {
        // Mismo mes - mantiene promoción
        mantienePromocion = true;
        mensaje = '✅ Esta es la primera reagendación. Dentro del mismo mes, la promoción se mantiene.';
      }
    }

    // 4b. Segunda reagendación o más: SIEMPRE se pierde la promoción
    if (cita.reagendaciones >= 1) {
      mantienePromocion = false;
      mensaje =
        '⚠️ REGLA DE ORO: Esta cita ya ha sido reagendada una vez.\n' +
        'En la segunda reagendación (y posteriores), la promoción se pierde automáticamente.\n' +
        'El nuevo precio será el regular.';
      advertencias.push(
        `Esta cita ha sido reagendada ${cita.reagendaciones} vez${cita.reagendaciones > 1 ? 'es' : ''}.`
      );
    }

    return {
      puedeReagendar: true,
      mantienePromocion,
      mensaje,
      advertencias,
    };
  }

  /**
   * Helper: Retorna el nombre del mes en español
   */
  private static nombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes] || '';
  }
}
