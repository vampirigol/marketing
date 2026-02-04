import { generarLeadsDesdeConversaciones, obtenerConversacionesSimuladas } from '@/lib/matrix.service';

/**
 * Script de prueba para validar la simulación de leads desde conversaciones
 * Ejecutar desde terminal: npx ts-node test-leads-simulation.ts
 */

async function testLeadsSimulation() {
  console.log('🧪 Iniciando pruebas de simulación de leads...\n');

  try {
    // Obtener conversaciones simuladas
    console.log('📥 Obteniendo conversaciones simuladas...');
    const conversaciones = await obtenerConversacionesSimuladas();
    console.log(`✅ Se cargaron ${conversaciones.length} conversaciones\n`);

    // Mostrar resumen de conversaciones
    console.log('📊 Resumen de conversaciones por canal:');
    const porCanal = conversaciones.reduce((acc: Record<string, number>, conv) => {
      acc[conv.canal] = (acc[conv.canal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(porCanal).forEach(([canal, count]) => {
      console.log(`  - ${canal.toUpperCase()}: ${count}`);
    });

    // Mostrar resumen de etiquetas
    console.log('\n🏷️  Etiquetas más usadas:');
    const etiquetasCount = conversaciones.reduce((acc: Record<string, number>, conv) => {
      conv.etiquetas.forEach((etiqueta: string) => {
        acc[etiqueta] = (acc[etiqueta] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    Object.entries(etiquetasCount)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .forEach(([etiqueta, count]: [string, number]) => {
        console.log(`  - ${etiqueta}: ${count}`);
      });

    // Generar leads desde conversaciones
    console.log('\n🔄 Generando leads desde conversaciones...');
    const leads = generarLeadsDesdeConversaciones(conversaciones);
    console.log(`✅ Se generaron ${leads.length} leads\n`);

    // Mostrar distribución de leads por status
    console.log('📈 Distribución de leads por status:');
    const porStatus = leads.reduce((acc: Record<string, number>, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(porStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    // Mostrar estadísticas de valores
    console.log('\n💰 Estadísticas de valores estimados:');
    const valores = leads.map(l => l.valorEstimado || 0);
    const valorTotal = valores.reduce((a, b) => a + b, 0);
    const valorPromedio = valorTotal / valores.length;
    const valorMin = Math.min(...valores);
    const valorMax = Math.max(...valores);

    console.log(`  - Total: $${valorTotal.toFixed(2)}`);
    console.log(`  - Promedio: $${valorPromedio.toFixed(2)}`);
    console.log(`  - Mínimo: $${valorMin.toFixed(2)}`);
    console.log(`  - Máximo: $${valorMax.toFixed(2)}`);

    // Mostrar algunos leads de ejemplo
    console.log('\n👥 Ejemplo de leads generados:');
    leads.slice(0, 3).forEach((lead, index) => {
      console.log(`\n  Lead ${index + 1}:`);
      console.log(`    - Nombre: ${lead.nombre}`);
      console.log(`    - Canal: ${lead.canal}`);
      console.log(`    - Status: ${lead.status}`);
      console.log(`    - Valor: $${lead.valorEstimado}`);
      console.log(`    - Etiquetas: ${lead.etiquetas.join(', ') || 'Ninguna'}`);
    });

    console.log('\n\n✅ Pruebas completadas exitosamente!');
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
testLeadsSimulation();
