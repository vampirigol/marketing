// Prueba de diagnóstico para la simulación de leads
// Abre la consola del navegador y ejecuta esto

async function testLeadsSimulation() {
  console.log('🧪 Iniciando prueba de leads simulados...\n');

  try {
    // Importar funciones
    const { obtenerLeadsSimulados, obtenerConversacionesSimuladas, generarLeadsDesdeConversaciones } = await import('/frontend/lib/matrix.service');

    // 1. Probar obtener conversaciones
    console.log('1️⃣ Probando obtenerConversacionesSimuladas()...');
    const conversaciones = await obtenerConversacionesSimuladas();
    console.log(`✅ Se obtuvieron ${conversaciones.length} conversaciones`);
    console.log(conversaciones.map(c => ({ nombre: c.nombreContacto, canal: c.canal, etiquetas: c.etiquetas })));

    // 2. Probar generar leads
    console.log('\n2️⃣ Probando generarLeadsDesdeConversaciones()...');
    const leads = generarLeadsDesdeConversaciones(conversaciones);
    console.log(`✅ Se generaron ${leads.length} leads`);
    console.log('Distribución por status:');
    const porStatus = leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    console.log(porStatus);

    // 3. Probar obtenerLeadsSimulados
    console.log('\n3️⃣ Probando obtenerLeadsSimulados()...');
    const response = await obtenerLeadsSimulados({ page: 1, limit: 20 });
    console.log(`✅ Se obtuvieron ${response.leads.length} leads paginados`);
    console.log(`Total: ${response.total}, hasMore: ${response.hasMore}`);

    // 4. Probar con filtro de status
    console.log('\n4️⃣ Probando con filtro status="qualified"...');
    const qualified = await obtenerLeadsSimulados({ status: 'qualified', page: 1, limit: 20 });
    console.log(`✅ Se obtuvieron ${qualified.leads.length} leads calificados`);
    console.log(qualified.leads.map(l => ({ nombre: l.nombre, etiquetas: l.etiquetas })));

    console.log('\n✅ Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar
testLeadsSimulation();
