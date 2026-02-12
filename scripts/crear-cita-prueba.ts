#!/usr/bin/env npx tsx
/**
 * Script para crear una cita de prueba:
 * - Doctor: Daniel Balderas
 * - Fecha: 10 de febrero 2026, 10:00 AM
 * - Verifica el flujo de agendamiento
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function main() {
  console.log('🔄 Creando cita de prueba...\n');

  // 1. Login
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    throw new Error(`Login falló: ${err.error || loginRes.statusText}`);
  }
  const { token } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('✅ Login exitoso');

  // 2. Obtener catálogo para sucursal Ciudad Obregón
  const catalogoRes = await fetch(`${API_URL}/catalogo`);
  if (!catalogoRes.ok) throw new Error('Error obteniendo catálogo');
  const { catalogo } = await catalogoRes.json();
  const sucursal = catalogo.sucursales?.find((s: any) => s.nombre === 'Ciudad Obregón');
  if (!sucursal) throw new Error('Sucursal Ciudad Obregón no encontrada');
  const sucursalId = sucursal.id;
  console.log(`✅ Sucursal: ${sucursal.nombre} (${sucursalId})`);

  // 3. Crear paciente de prueba
  const pacienteRes = await fetch(`${API_URL}/pacientes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombreCompleto: 'Paciente Prueba Agendamiento',
      telefono: '6441234567',
      whatsapp: '6441234567',
      email: 'prueba.agendamiento@test.com',
      fechaNacimiento: '1990-01-15',
      edad: 36,
      sexo: 'M',
      noAfiliacion: `RCA-PRUEBA-${Date.now()}`,
      tipoAfiliacion: 'Particular',
      ciudad: 'Ciudad Obregón',
      estado: 'Sonora',
      origenLead: 'WhatsApp',
    }),
  });
  let pacienteId: string;
  if (pacienteRes.ok) {
    const { paciente } = await pacienteRes.json();
    pacienteId = paciente.id;
    console.log(`✅ Paciente creado: ${paciente.nombreCompleto} (${pacienteId})`);
  } else if (pacienteRes.status === 409) {
    const { paciente } = await pacienteRes.json();
    pacienteId = paciente.id;
    console.log(`✅ Paciente existente: ${paciente.nombreCompleto}`);
  } else {
    throw new Error(`Error creando paciente: ${await pacienteRes.text()}`);
  }

  // 4. Crear cita: Daniel Balderas, 10 feb 2026, 10:00 AM
  const fechaCita = '2026-02-10';
  const horaCita = '10:00';
  const citaRes = await fetch(`${API_URL}/citas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pacienteId,
      sucursalId,
      fechaCita,
      horaCita,
      duracionMinutos: 30,
      tipoConsulta: 'Primera_Vez',
      especialidad: 'Odontología',
      medicoAsignado: 'Daniel Balderas',
      estado: 'Agendada',
      esPromocion: false,
      costoConsulta: 400,
      montoAbonado: 0,
      saldoPendiente: 400,
      creadoPor: 'script-prueba',
      notas: 'Cita de prueba - flujo agendamiento',
    }),
  });

  if (!citaRes.ok) {
    const err = await citaRes.json().catch(() => ({}));
    throw new Error(`Error creando cita: ${err.error || err.message || citaRes.statusText}`);
  }

  const { cita } = await citaRes.json();
  console.log('\n✅ CITA CREADA EXITOSAMENTE');
  console.log('────────────────────────────');
  console.log(`  ID: ${cita.id}`);
  console.log(`  Paciente: Paciente Prueba Agendamiento`);
  console.log(`  Doctor: Daniel Balderas`);
  console.log(`  Fecha: ${fechaCita} a las ${horaCita}`);
  console.log(`  Sucursal: Ciudad Obregón`);
  console.log(`  Estado: ${cita.estado}`);
  console.log('────────────────────────────\n');

  console.log('📋 Verifica en la aplicación:');
  console.log('  1. Módulo Citas: http://localhost:3000/citas');
  console.log('  2. Módulo Doctores (Daniel Balderas): http://localhost:3000/doctores');
  console.log('     - Login: daniel.balderas / medico123\n');
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
