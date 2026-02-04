/**
 * Script: Inicializar usuario Admin
 * Crea un usuario administrador con contraseña hasheada
 */

import bcrypt from 'bcrypt';

async function generarPasswordHash() {
  // Password por defecto: admin123
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('🔐 Usuario Administrador Inicial');
  console.log('================================');
  console.log('Username:', 'admin');
  console.log('Password:', password);
  console.log('');
  console.log('Hash generado:');
  console.log(hash);
  console.log('');
  console.log('📝 Actualiza este hash en UsuarioSistemaRepository.ts');
  console.log('   en el método crearUsuarioInicial()');
}

generarPasswordHash().catch(console.error);
