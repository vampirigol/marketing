/**
 * Ejemplo: Demo Sistema de Inasistencias y Remarketing
 * Demuestra el flujo completo del sistema
 */

import { InMemoryInasistenciaRepository } from '../src/infrastructure/database/repositories/InasistenciaRepository';
import { RegistrarInasistencia } from '../src/core/use-cases/RegistrarInasistencia';
import { AsignarMotivoInasistencia } from '../src/core/use-cases/AsignarMotivoInasistencia';
import { RegistrarIntentoContacto } from '../src/core/use-cases/RegistrarIntentoContacto';
import { ReagendarDesdeInasistencia } from '../src/core/use-cases/ReagendarDesdeInasistencia';
import { ProcesarProtocolo7Dias } from '../src/core/use-cases/ProcesarProtocolo7Dias';
import { RemarketingService } from '../src/infrastructure/remarketing/RemarketingService';
import { WhatsAppService } from '../src/infrastructure/messaging/WhatsAppService';
import { FacebookService } from '../src/infrastructure/messaging/FacebookService';
import { InstagramService } from '../src/infrastructure/messaging/InstagramService';

async function demoInasistencias() {
  console.log('🏥 ===== DEMO: Sistema de Inasistencias y Remarketing =====\n');

  // Inicializar repositorio y servicios
  const repo = new InMemoryInasistenciaRepository();
  const whatsapp = new WhatsAppService();
  const facebook = new FacebookService();
  const instagram = new InstagramService();
  const remarketing = new RemarketingService(repo, whatsapp, facebook, instagram);

  // ========================================
  // 1. REGISTRAR INASISTENCIA
  // ========================================
  console.log('📝 1. Registrando inasistencia...');
  const registrarUseCase = new RegistrarInasistencia(repo);
  const resultadoRegistro = await registrarUseCase.execute({
    citaId: 'cita-001',
    pacienteId: 'paciente-001',
    sucursalId: 'sucursal-001',
    fechaCitaPerdida: new Date('2026-02-03'),
    horaCitaPerdida: '10:00',
    creadoPor: 'Sistema'
  });

  if (resultadoRegistro.success && resultadoRegistro.inasistencia) {
    console.log('✅ Inasistencia registrada:', resultadoRegistro.inasistencia.id);
    console.log(`   • Fecha límite (7 días): ${resultadoRegistro.inasistencia.fechaLimiteRespuesta.toISOString()}`);
    console.log(`   • Estado: ${resultadoRegistro.inasistencia.estadoSeguimiento}\n`);
  }

  // ========================================
  // 2. ASIGNAR MOTIVO
  // ========================================
  console.log('🏷️  2. Asignando motivo "Económico"...');
  const asignarMotivoUseCase = new AsignarMotivoInasistencia(repo);
  const resultadoMotivo = await asignarMotivoUseCase.execute({
    inasistenciaId: resultadoRegistro.inasistencia!.id,
    motivo: 'Economico',
    motivoDetalle: 'Paciente sin recursos esta semana',
    asignadoPor: 'Keila'
  });

  if (resultadoMotivo.success) {
    console.log('✅ Motivo asignado');
    console.log('   Acciones ejecutadas:');
    resultadoMotivo.acciones.forEach(a => console.log(`   • ${a}`));
    console.log();
  }

  // ========================================
  // 3. REGISTRAR INTENTO DE CONTACTO
  // ========================================
  console.log('📞 3. Registrando intento de contacto...');
  const registrarContactoUseCase = new RegistrarIntentoContacto(repo);
  const resultadoContacto = await registrarContactoUseCase.execute({
    inasistenciaId: resultadoRegistro.inasistencia!.id,
    nota: 'Se contactó vía WhatsApp, respondió que necesita tiempo',
    exitoso: true,
    respuestaPaciente: 'Puede reagendar en 1 semana',
    realizadoPor: 'Keila'
  });

  if (resultadoContacto.success) {
    console.log('✅ Contacto registrado');
    console.log(`   • Total intentos: ${resultadoContacto.totalIntentos}`);
    console.log(`   • Estado: ${resultadoContacto.inasistencia?.estadoSeguimiento}\n`);
  }

  // ========================================
  // 4. OBTENER LISTA DE REMARKETING
  // ========================================
  console.log('📋 4. Obteniendo lista de remarketing...');
  const listaRemarketing = await remarketing.obtenerListaRemarketing();
  console.log(`✅ ${listaRemarketing.length} pacientes en lista de remarketing`);
  
  if (listaRemarketing.length > 0) {
    console.log('   Pacientes:');
    listaRemarketing.forEach(i => {
      const config = i.obtenerConfigMotivo();
      console.log(`   • Paciente ${i.pacienteId} - Motivo: ${i.motivo} - Prioridad: ${config?.prioridad}`);
    });
    console.log();
  }

  // ========================================
  // 5. EJECUTAR CAMPAÑA DE REMARKETING
  // ========================================
  console.log('📢 5. Ejecutando campaña de remarketing...');
  const idsRemarketing = listaRemarketing.map(i => i.id);
  const resultadosRemarketing = await remarketing.ejecutarCampana(idsRemarketing, 'WhatsApp');
  
  const exitosos = resultadosRemarketing.filter(r => r.enviado).length;
  const fallidos = resultadosRemarketing.filter(r => !r.enviado).length;
  
  console.log(`✅ Campaña ejecutada:`);
  console.log(`   • Exitosos: ${exitosos}`);
  console.log(`   • Fallidos: ${fallidos}\n`);

  // ========================================
  // 6. REAGENDAR PACIENTE
  // ========================================
  console.log('📅 6. Reagendando paciente recuperado...');
  const reagendarUseCase = new ReagendarDesdeInasistencia(repo);
  const resultadoReagendar = await reagendarUseCase.execute({
    inasistenciaId: resultadoRegistro.inasistencia!.id,
    nuevaCitaId: 'cita-002',
    fechaNuevaCita: new Date('2026-02-10'),
    horaNuevaCita: '14:00',
    notasReagendacion: 'Paciente confirmó disponibilidad para la próxima semana',
    realizadoPor: 'Keila'
  });

  if (resultadoReagendar.success) {
    console.log(`✅ ${resultadoReagendar.mensaje}`);
    console.log(`   • Estado: ${resultadoReagendar.inasistencia?.estadoSeguimiento}`);
    console.log(`   • Nueva cita: ${resultadoReagendar.inasistencia?.nuevaCitaId}\n`);
  }

  // ========================================
  // 7. PROTOCOLO 7 DÍAS (Simulación)
  // ========================================
  console.log('⏰ 7. Simulando protocolo de 7 días...');
  
  // Crear una inasistencia con fecha antigua (ya vencida)
  const inasistenciaVencida = await registrarUseCase.execute({
    citaId: 'cita-003',
    pacienteId: 'paciente-002',
    sucursalId: 'sucursal-001',
    fechaCitaPerdida: new Date('2026-01-20'), // Hace 14 días
    horaCitaPerdida: '11:00',
    creadoPor: 'Sistema'
  });

  if (inasistenciaVencida.success) {
    console.log(`✅ Inasistencia vencida creada: ${inasistenciaVencida.inasistencia?.id}`);
    
    // Ejecutar protocolo
    const protocoloUseCase = new ProcesarProtocolo7Dias(repo);
    const resultadoProtocolo = await protocoloUseCase.execute();
    
    console.log('✅ Protocolo ejecutado:');
    console.log(`   • Procesados: ${resultadoProtocolo.procesados}`);
    console.log(`   • Marcados como perdidos: ${resultadoProtocolo.marcadosPerdidos}`);
    console.log(`   • Alertas próximas: ${resultadoProtocolo.alertasProximas}\n`);
  }

  // ========================================
  // 8. BLOQUEO "RAZA BRAVA"
  // ========================================
  console.log('🚫 8. Simulando bloqueo de paciente "raza brava"...');
  
  const inasistenciaBrava = await registrarUseCase.execute({
    citaId: 'cita-004',
    pacienteId: 'paciente-003',
    sucursalId: 'sucursal-001',
    fechaCitaPerdida: new Date('2026-02-03'),
    horaCitaPerdida: '15:00',
    creadoPor: 'Sistema'
  });

  if (inasistenciaBrava.success && inasistenciaBrava.inasistencia) {
    const resultadoBrava = await asignarMotivoUseCase.execute({
      inasistenciaId: inasistenciaBrava.inasistencia.id,
      motivo: 'Raza_Brava',
      motivoDetalle: 'Paciente fue grosero y amenazante con el personal',
      asignadoPor: 'Supervisor'
    });

    if (resultadoBrava.success && resultadoBrava.inasistencia) {
      console.log('✅ Paciente bloqueado');
      console.log(`   • Bloqueado marketing: ${resultadoBrava.inasistencia.bloqueadoMarketing}`);
      console.log(`   • Estado: ${resultadoBrava.inasistencia.estadoSeguimiento}`);
      console.log(`   • En remarketing: ${resultadoBrava.inasistencia.enListaRemarketing}\n`);
    }
  }

  // ========================================
  // 9. ESTADÍSTICAS FINALES
  // ========================================
  console.log('📊 9. Estadísticas generales...');
  const stats = await repo.obtenerEstadisticas();
  
  console.log(`✅ Estadísticas:
   • Total inasistencias: ${stats.total}
   • En remarketing: ${stats.enRemarketing}
   • Bloqueados: ${stats.bloqueados}
   • Perdidos: ${stats.perdidos}
   • Recuperados: ${stats.recuperados}
   • Tasa de recuperación: ${stats.tasaRecuperacion.toFixed(2)}%
  `);

  console.log('\n📋 Por motivo:');
  stats.porMotivo.forEach(m => {
    console.log(`   • ${m.motivo}: ${m.cantidad}`);
  });

  console.log('\n📋 Por estado:');
  stats.porEstado.forEach(e => {
    console.log(`   • ${e.estado}: ${e.cantidad}`);
  });

  console.log('\n✅ ===== DEMO COMPLETADO =====');
}

// Ejecutar demo
demoInasistencias().catch(console.error);
