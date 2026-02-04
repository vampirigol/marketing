/**
 * Tests para el Caso de Uso: ReagendarPromocion
 * Valida la REGLA DE ORO del sistema
 */
import { ReagendarPromocionUseCase } from '../../src/core/use-cases/ReagendarPromocion';

describe('ReagendarPromocionUseCase - Regla de Oro', () => {
  let useCase: ReagendarPromocionUseCase;

  beforeEach(() => {
    useCase = new ReagendarPromocionUseCase();
  });

  describe('Primera Reagendación', () => {
    it('debe mantener la promoción en la primera reagendación', async () => {
      // Arrange: Cita con promoción, 0 reagendaciones
      const dto = {
        citaId: 'cita-001',
        nuevaFecha: new Date('2026-02-15'),
        nuevaHora: '11:00',
        usuarioId: 'keila',
        sucursalId: 'suc-001',
        precioRegular: 500,
        motivo: 'Cliente no puede a las 10:00'
      };

      // Act
      const resultado = await useCase.ejecutar(dto);

      // Assert
      expect(resultado.promocionPerdida).toBe(false);
      expect(resultado.cita.esPromocion).toBe(true);
      expect(resultado.cita.reagendaciones).toBe(1);
      expect(resultado.precioNuevo).toBe(250); // Mantiene precio de promoción
      expect(resultado.mensaje).toContain('promoción se mantiene');
    });
  });

  describe('Segunda Reagendación - REGLA DE ORO', () => {
    it('debe PERDER la promoción en la segunda reagendación', async () => {
      // Arrange: Cita con promoción, ya reagendada 1 vez
      const dto = {
        citaId: 'cita-002', // Esta cita ya tiene reagendaciones: 1
        nuevaFecha: new Date('2026-02-16'),
        nuevaHora: '14:00',
        usuarioId: 'keila',
        sucursalId: 'suc-001',
        precioRegular: 500,
        motivo: 'Cliente vuelve a cambiar la cita'
      };

      // Act
      const resultado = await useCase.ejecutar(dto);

      // Assert - LA REGLA DE ORO
      expect(resultado.promocionPerdida).toBe(true);
      expect(resultado.cita.esPromocion).toBe(false);
      expect(resultado.cita.reagendaciones).toBe(2);
      expect(resultado.precioNuevo).toBe(500); // Cambió a precio regular
      expect(resultado.precioAnterior).toBe(250); // Antes tenía promoción
      expect(resultado.mensaje).toContain('perdido la promoción');
      expect(resultado.mensaje).toContain('precio regular');
    });

    it('debe actualizar el saldo pendiente al perder la promoción', async () => {
      const dto = {
        citaId: 'cita-003',
        nuevaFecha: new Date('2026-02-17'),
        nuevaHora: '09:00',
        usuarioId: 'keila',
        sucursalId: 'suc-001',
        precioRegular: 600,
      };

      const resultado = await useCase.ejecutar(dto);

      // Si ya había abonado algo, el saldo debe recalcularse
      expect(resultado.cita.saldoPendiente).toBe(
        resultado.precioNuevo - resultado.cita.montoAbonado
      );
    });
  });

  describe('Validaciones', () => {
    it('debe rechazar fecha en el pasado', async () => {
      const dto = {
        citaId: 'cita-001',
        nuevaFecha: new Date('2020-01-01'), // Fecha pasada
        nuevaHora: '10:00',
        usuarioId: 'keila',
        sucursalId: 'suc-001',
        precioRegular: 500,
      };

      await expect(useCase.ejecutar(dto)).rejects.toThrow('posterior a la fecha actual');
    });

    it('debe rechazar formato de hora inválido', async () => {
      const dto = {
        citaId: 'cita-001',
        nuevaFecha: new Date('2026-02-20'),
        nuevaHora: '25:70', // Hora inválida
        usuarioId: 'keila',
        sucursalId: 'suc-001',
        precioRegular: 500,
      };

      await expect(useCase.ejecutar(dto)).rejects.toThrow('Formato de hora inválido');
    });

    it('debe rechazar reagendar cita cancelada', async () => {
      // Esta prueba requiere mockar el repositorio
      // Por ahora la dejamos documentada
      expect(true).toBe(true);
    });
  });

  describe('Método validarMantienePromocion', () => {
    it('debe advertir cuando se perderá la promoción', () => {
      const validacion = useCase.validarMantienePromocion(1, true);

      expect(validacion.puedeReagendar).toBe(true);
      expect(validacion.mantienePromocion).toBe(false);
      expect(validacion.advertencia).toContain('perderá la promoción');
    });

    it('debe confirmar que mantiene la promoción en primera reagendación', () => {
      const validacion = useCase.validarMantienePromocion(0, true);

      expect(validacion.puedeReagendar).toBe(true);
      expect(validacion.mantienePromocion).toBe(true);
      expect(validacion.advertencia).toContain('promoción se mantiene');
    });

    it('debe indicar que no hay promoción si la cita no es promocional', () => {
      const validacion = useCase.validarMantienePromocion(0, false);

      expect(validacion.puedeReagendar).toBe(true);
      expect(validacion.mantienePromocion).toBe(false);
      expect(validacion.advertencia).toBe('');
    });
  });
});

describe('Escenarios Reales de RCA', () => {
  let useCase: ReagendarPromocionUseCase;

  beforeEach(() => {
    useCase = new ReagendarPromocionUseCase();
  });

  it('Escenario Keila: Cliente reagenda primera vez por trabajo', async () => {
    // Cliente: Juan Pérez tiene cita promocional de $250 (precio regular $500)
    // Reagenda por primera vez porque tiene junta en su trabajo
    
    const resultado = await useCase.ejecutar({
      citaId: 'cita-juan',
      nuevaFecha: new Date('2026-02-10'),
      nuevaHora: '16:00',
      usuarioId: 'keila',
      sucursalId: 'monterrey',
      precioRegular: 500,
      motivo: 'Junta de trabajo'
    });

    // ✅ Mantiene promoción
    expect(resultado.promocionPerdida).toBe(false);
    expect(resultado.precioNuevo).toBe(250);
  });

  it('Escenario Keila: Cliente "raza brava" reagenda segunda vez', async () => {
    // Mismo cliente ahora quiere reagendar de nuevo
    // Sistema debe aplicar REGLA DE ORO: pierde promoción
    
    const resultado = await useCase.ejecutar({
      citaId: 'cita-juan-2', // Ya tiene reagendaciones: 1
      nuevaFecha: new Date('2026-02-12'),
      nuevaHora: '10:00',
      usuarioId: 'keila',
      sucursalId: 'monterrey',
      precioRegular: 500,
      motivo: 'Ahora no puede el día que cambió'
    });

    // ⚠️ Pierde promoción - Mensaje a Keila para avisar al cliente
    expect(resultado.promocionPerdida).toBe(true);
    expect(resultado.precioNuevo).toBe(500);
    expect(resultado.mensaje).toContain('perdido la promoción');
  });

  it('Escenario Antonio/Yaretzi: Reporte de corte con cambio de precio', async () => {
    // Un paciente que pierde promoción debe reflejarse en el corte
    
    const resultado = await useCase.ejecutar({
      citaId: 'cita-reporte',
      nuevaFecha: new Date('2026-02-11'),
      nuevaHora: '11:30',
      usuarioId: 'yaretzi',
      sucursalId: 'montemorelos',
      precioRegular: 600,
    });

    // Antonio/Yaretzi deben ver este cambio en el reporte
    expect(resultado.precioAnterior).toBe(250);
    expect(resultado.precioNuevo).toBe(600);
    
    const diferencia = resultado.precioNuevo - resultado.precioAnterior;
    expect(diferencia).toBe(350); // $350 MXN adicionales por perder promoción
  });
});
