/**
 * Script de prueba: Sistema de Autenticación
 * Prueba login, registro y permisos
 */

const API_BASE = 'http://localhost:3001/api';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAuth() {
  log('\n========================================', colors.cyan);
  log('🔐 PRUEBAS SISTEMA DE AUTENTICACIÓN', colors.cyan);
  log('========================================\n', colors.cyan);

  let token = '';
  let usuarioId = '';

  try {
    // 1. Login con usuario Admin
    log('1️⃣  Login con usuario Admin...', colors.blue);
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginRes.json();
    if (loginRes.ok) {
      token = loginData.token;
      log('✅ Login exitoso', colors.green);
      log(`   Usuario: ${loginData.usuario.nombreCompleto}`, colors.green);
      log(`   Rol: ${loginData.usuario.rol}`, colors.green);
      log(`   Token: ${token.substring(0, 30)}...`, colors.green);
    } else {
      log('❌ Error en login', colors.red);
      log(JSON.stringify(loginData, null, 2), colors.red);
      return;
    }

    // 2. Obtener información del usuario autenticado
    log('\n2️⃣  Obtener información del usuario (/auth/me)...', colors.blue);
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const meData = await meRes.json();
    if (meRes.ok) {
      log('✅ Información obtenida', colors.green);
      log(`   ID: ${meData.id}`, colors.green);
      log(`   Email: ${meData.email}`, colors.green);
      log(`   Rol: ${meData.rol}`, colors.green);
    } else {
      log('❌ Error al obtener usuario', colors.red);
    }

    // 3. Listar roles disponibles
    log('\n3️⃣  Listar roles disponibles...', colors.blue);
    const rolesRes = await fetch(`${API_BASE}/auth/roles`);
    const rolesData = await rolesRes.json();
    
    if (rolesRes.ok) {
      log('✅ Roles obtenidos:', colors.green);
      rolesData.roles.forEach(rol => {
        log(`   • ${rol.nombre} (${rol.rol})`, colors.green);
        log(`     ${rol.descripcion}`, colors.green);
      });
    } else {
      log('❌ Error al listar roles', colors.red);
    }

    // 4. Registrar nuevo usuario (Recepción)
    log('\n4️⃣  Registrar nuevo usuario de Recepción...', colors.blue);
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: 'recepcion1',
        password: 'recep123',
        email: 'recepcion1@crm.com',
        nombreCompleto: 'María García',
        telefono: '1234567890',
        rol: 'Recepcion',
        sucursalId: 'suc_001'
      })
    });

    const registerData = await registerRes.json();
    if (registerRes.ok) {
      usuarioId = registerData.usuario.id;
      log('✅ Usuario registrado', colors.green);
      log(`   ID: ${registerData.usuario.id}`, colors.green);
      log(`   Username: ${registerData.usuario.username}`, colors.green);
      log(`   Rol: ${registerData.usuario.rol}`, colors.green);
      log(`   Permisos:`, colors.green);
      registerData.usuario.permisos.forEach(p => {
        log(`     - ${p.modulo}: ${p.acciones.join(', ')}`, colors.green);
      });
    } else {
      log('❌ Error al registrar usuario', colors.red);
      log(JSON.stringify(registerData, null, 2), colors.red);
    }

    // 5. Login con nuevo usuario
    log('\n5️⃣  Login con usuario de Recepción...', colors.blue);
    const loginRecepRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'recepcion1',
        password: 'recep123'
      })
    });

    const loginRecepData = await loginRecepRes.json();
    if (loginRecepRes.ok) {
      log('✅ Login exitoso', colors.green);
      log(`   Token: ${loginRecepData.token.substring(0, 30)}...`, colors.green);
    } else {
      log('❌ Error en login', colors.red);
    }

    // 6. Intentar acceder sin token
    log('\n6️⃣  Intentar acceder sin token (/auth/me)...', colors.blue);
    const noAuthRes = await fetch(`${API_BASE}/auth/me`);
    const noAuthData = await noAuthRes.json();
    
    if (!noAuthRes.ok && noAuthRes.status === 401) {
      log('✅ Correctamente bloqueado (401)', colors.green);
      log(`   Error: ${noAuthData.error}`, colors.green);
    } else {
      log('❌ No se bloqueó correctamente', colors.red);
    }

    // 7. Cambiar contraseña
    log('\n7️⃣  Cambiar contraseña del usuario admin...', colors.blue);
    const changePassRes = await fetch(`${API_BASE}/auth/cambiar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: 'admin123',
        passwordNuevo: 'admin456'
      })
    });

    const changePassData = await changePassRes.json();
    if (changePassRes.ok) {
      log('✅ Contraseña cambiada', colors.green);
      
      // Intentar login con nueva contraseña
      log('   Probando login con nueva contraseña...', colors.yellow);
      const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin456'
        })
      });
      
      if (newLoginRes.ok) {
        log('   ✅ Login con nueva contraseña exitoso', colors.green);
        
        // Restaurar contraseña original
        const newToken = (await newLoginRes.json()).token;
        await fetch(`${API_BASE}/auth/cambiar-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          body: JSON.stringify({
            passwordActual: 'admin456',
            passwordNuevo: 'admin123'
          })
        });
        log('   🔄 Contraseña restaurada a admin123', colors.yellow);
      } else {
        log('   ❌ Login con nueva contraseña falló', colors.red);
      }
    } else {
      log('❌ Error al cambiar contraseña', colors.red);
    }

    // 8. Suspender usuario
    if (usuarioId) {
      log('\n8️⃣  Suspender usuario de Recepción...', colors.blue);
      const suspenderRes = await fetch(`${API_BASE}/auth/usuarios/${usuarioId}/suspender`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const suspenderData = await suspenderRes.json();
      if (suspenderRes.ok) {
        log('✅ Usuario suspendido', colors.green);
        log(`   Estado: ${suspenderData.usuario.estado}`, colors.green);
      } else {
        log('❌ Error al suspender', colors.red);
      }

      // Intentar login con usuario suspendido
      log('   Intentando login con usuario suspendido...', colors.yellow);
      const suspLoginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'recepcion1',
          password: 'recep123'
        })
      });

      if (!suspLoginRes.ok) {
        log('   ✅ Login bloqueado correctamente', colors.green);
      } else {
        log('   ❌ Usuario suspendido pudo hacer login', colors.red);
      }

      // Activar usuario
      log('\n9️⃣  Activar usuario de Recepción...', colors.blue);
      const activarRes = await fetch(`${API_BASE}/auth/usuarios/${usuarioId}/activar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const activarData = await activarRes.json();
      if (activarRes.ok) {
        log('✅ Usuario activado', colors.green);
        log(`   Estado: ${activarData.usuario.estado}`, colors.green);
      } else {
        log('❌ Error al activar', colors.red);
      }
    }

    log('\n========================================', colors.cyan);
    log('✅ TODAS LAS PRUEBAS COMPLETADAS', colors.green);
    log('========================================\n', colors.cyan);

  } catch (error) {
    log('\n❌ ERROR EN LAS PRUEBAS:', colors.red);
    log(error.message, colors.red);
    console.error(error);
  }
}

// Ejecutar pruebas
testAuth();
