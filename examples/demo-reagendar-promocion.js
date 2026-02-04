#!/usr/bin/env node
/**
 * Script de demostración: Reagendar Promoción
 * Muestra la Regla de Oro en acción
 * 
 * Uso: node examples/demo-reagendar-promocion.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function separator() {
  console.log('\n' + '='.repeat(80) + '\n');
}

async function demoReagendarPromocion() {
  log('🏥 DEMO: Sistema CRM RCA - Regla de Oro de Reagendación', 'cyan');
  separator();

  // Simular una cita promocional
  const citaId = 'demo-cita-001';
  
  log('📋 ESCENARIO: Cliente "Juan Pérez" tiene cita promocional', 'blue');
  log('   • Precio promocional: $250 MXN');
  log('   • Precio regular: $500 MXN');
  log('   • Reagendaciones actuales: 0');
  separator();

  // ========================================================================
  // PRIMERA REAGENDACIÓN
  // ========================================================================
  log('🔄 PRIMERA REAGENDACIÓN', 'yellow');
  log('   Cliente llama: "No puedo asistir mañana, ¿pueden cambiarme la cita?"');
  
  try {
    // 1. Validar antes de reagendar
    log('\n   [Keila consulta el sistema]', 'cyan');
    const validacion1 = await fetch(`${BASE_URL}/citas/${citaId}/validar-reagendacion`);
    const valid1 = await validacion1.json();
    
    log(`   Sistema: "${valid1.validacion.advertencia}"`, 'green');
    
    // 2. Reagendar
    log('\n   [Keila reagenda la cita]', 'cyan');
    const respuesta1 = await fetch(`${BASE_URL}/citas/${citaId}/reagendar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevaFecha: '2026-02-15',
        nuevaHora: '10:00',
        precioRegular: 500,
        usuarioId: 'keila',
        motivo: 'Cliente tiene junta de trabajo'
      })
    });
    
    const resultado1 = await respuesta1.json();
    
    log('\n   ✅ RESULTADO:', 'green');
    log(`   ${resultado1.message}`, 'green');
    log(`   • Promoción: ${resultado1.cita.esPromocion ? 'Vigente' : 'Perdida'}`);
    log(`   • Precio: $${resultado1.cita.costoConsulta} MXN`);
    log(`   • Reagendaciones: ${resultado1.cita.reagendaciones}`);
    
    log('\n   Keila informa al cliente:', 'blue');
    log('   "Don Juan, sin problema. Su cita queda para el 15 de febrero a las 10:00 AM."');
    log('   "Mantiene su promoción de $250 pesos." ✅', 'green');
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
  }

  separator();

  // ========================================================================
  // SEGUNDA REAGENDACIÓN - REGLA DE ORO
  // ========================================================================
  log('🔄 SEGUNDA REAGENDACIÓN (REGLA DE ORO)', 'yellow');
  log('   Cliente vuelve a llamar: "Ahora me surgió otra cosa, ¿puedo cambiar de nuevo?"');
  
  try {
    // 1. Validar antes de reagendar
    log('\n   [Keila consulta el sistema]', 'cyan');
    const validacion2 = await fetch(`${BASE_URL}/citas/${citaId}/validar-reagendacion`);
    const valid2 = await validacion2.json();
    
    log(`   ⚠️  Sistema: "${valid2.validacion.advertencia}"`, 'yellow');
    
    log('\n   Keila informa al cliente:', 'blue');
    log('   "Don Juan, sí le puedo cambiar la cita, pero el sistema me indica que', 'yellow');
    log('   al reagendar por segunda vez, se pierde la promoción."', 'yellow');
    log('   "El costo pasaría de $250 a $500 pesos (precio regular)."', 'yellow');
    log('   "¿Está de acuerdo?"');
    
    log('\n   Cliente: "Ah, entiendo. Sí, por favor cámbiamela."', 'blue');
    
    // 2. Reagendar (se pierde promoción)
    log('\n   [Keila reagenda la cita]', 'cyan');
    const respuesta2 = await fetch(`${BASE_URL}/citas/${citaId}/reagendar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevaFecha: '2026-02-18',
        nuevaHora: '14:00',
        precioRegular: 500,
        usuarioId: 'keila',
        motivo: 'Cliente tiene otro compromiso'
      })
    });
    
    const resultado2 = await respuesta2.json();
    
    log('\n   ⚠️  RESULTADO (REGLA DE ORO APLICADA):', 'yellow');
    log(`   ${resultado2.message}`, 'yellow');
    log(`   • Promoción: ${resultado2.cita.esPromocion ? 'Vigente' : 'PERDIDA ❌'}`, 'red');
    log(`   • Precio anterior: $${resultado2.detalles.precioAnterior} MXN`);
    log(`   • Precio nuevo: $${resultado2.detalles.precioNuevo} MXN`, 'red');
    log(`   • Diferencia: +$${resultado2.detalles.precioNuevo - resultado2.detalles.precioAnterior} MXN`);
    log(`   • Reagendaciones: ${resultado2.cita.reagendaciones}`);
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
  }

  separator();

  // ========================================================================
  // IMPACTO EN FINANZAS
  // ========================================================================
  log('💰 IMPACTO EN FINANZAS (Antonio / Yaretzi)', 'cyan');
  log('\n   Reporte de Corte del Día:');
  log('   ┌──────────────────────────────────────────────────────────┐');
  log('   │ Paciente: Juan Pérez                                     │');
  log('   │ Cita: 18 Feb 2026 - 14:00                               │');
  log('   │ Concepto: Consulta General                               │');
  log('   │ Precio original (promoción): $250 MXN                    │');
  log('   │ Precio final (sin promoción): $500 MXN                   │', 'green');
  log('   │ Ganancia adicional por regla: +$250 MXN                  │', 'green');
  log('   └──────────────────────────────────────────────────────────┘');
  
  log('\n   📊 Estadísticas del mes:', 'blue');
  log('   • Citas con promoción perdida: 45 citas');
  log('   • Ingreso adicional por regla: $11,250 MXN', 'green');
  log('   • Porcentaje de recuperación: 18.5%', 'green');

  separator();

  log('✅ DEMOSTRACIÓN COMPLETADA', 'green');
  log('\nLa Regla de Oro protege los ingresos de la clínica sin intervención manual.', 'cyan');
  log('Documentación completa: docs/use-cases/REAGENDAR_PROMOCION.md\n');
}

// Ejecutar demo
if (require.main === module) {
  log('\n⚠️  NOTA: Este es un script de demostración', 'yellow');
  log('   Asegúrate de que el servidor esté corriendo en http://localhost:3000\n');
  
  setTimeout(() => {
    demoReagendarPromocion().catch(error => {
      log(`\n❌ Error en la demostración: ${error.message}`, 'red');
      log('   ¿El servidor está corriendo? npm run dev', 'yellow');
      process.exit(1);
    });
  }, 1000);
}

module.exports = { demoReagendarPromocion };
