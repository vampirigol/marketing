# 🚀 Guía de Despliegue en cPanel - Versión DEMO

## ✅ Esta es una versión de DEMOSTRACIÓN con:
- Datos de ejemplo (mock data)
- Base de datos en memoria (no requiere PostgreSQL)
- Simulación de APIs de redes sociales
- Todo funcional para mostrar al cliente

---

## 📋 Pre-requisitos en cPanel

1. **Node.js instalado** (versión 18 o superior)
2. **Acceso a Terminal/SSH**
3. **Dominio o subdominio configurado**

---

## 🔧 Paso 1: Preparar el Código Localmente

### Backend
```bash
# En la raíz del proyecto
npm install
npm run build
```

### Frontend
```bash
# En la carpeta frontend
cd frontend
npm install
npm run build
cd ..
```

---

## 📤 Paso 2: Subir Archivos a cPanel

### Archivos del Backend a subir:
```
📁 tu-dominio.com/
├── 📁 dist/               (código compilado)
├── 📁 node_modules/       (dependencias)
├── package.json
├── package-lock.json
└── .env                   (configurar en el servidor)
```

### Archivos del Frontend a subir:
```
📁 tu-dominio.com/public_html/
├── 📁 .next/              (build de Next.js)
├── 📁 public/
├── 📁 node_modules/
├── package.json
├── package-lock.json
└── next.config.js
```

**IMPORTANTE**: No subas `node_modules`. Instálalos en el servidor.

---

## ⚙️ Paso 3: Configurar en cPanel

### 3.1 Configurar Variables de Entorno

Edita el archivo `.env` en el servidor:

```env
NODE_ENV=production
PORT=3001
USE_MEMORY_DB=true
JWT_SECRET=demo-secret-key-2026
API_URL=https://tu-dominio.com
```

### 3.2 Configurar Aplicación Node.js en cPanel

1. Ve a **"Setup Node.js App"** en cPanel
2. Crea nueva aplicación:
   - **Node.js Version**: 18.x o superior
   - **Application Mode**: Production
   - **Application Root**: `/home/usuario/tu-dominio.com`
   - **Application URL**: tu-dominio.com
   - **Application Startup File**: `dist/index.js`
   - **Environment Variables**: 
     ```
     PORT=3001
     NODE_ENV=production
     USE_MEMORY_DB=true
     ```

3. Instala dependencias:
```bash
cd /home/usuario/tu-dominio.com
npm install --production
```

### 3.3 Configurar Frontend (Next.js)

1. En cPanel, crea otra aplicación Node.js:
   - **Application Root**: `/home/usuario/public_html`
   - **Application Startup File**: `node_modules/next/dist/bin/next`
   - **Application Arguments**: `start -p 3000`
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_API_URL=https://tu-dominio.com:3001
     NODE_ENV=production
     ```

2. Instala dependencias del frontend:
```bash
cd /home/usuario/public_html
npm install --production
```

---

## 🌐 Paso 4: Configurar Proxy/Redirección

### Opción A: Archivo .htaccess para proxy

Crea `.htaccess` en `public_html`:

```apache
RewriteEngine On

# API requests al backend (puerto 3001)
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Todo lo demás al frontend Next.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Opción B: Subdominios separados

- **Frontend**: `https://demo.tu-dominio.com` (puerto 3000)
- **Backend API**: `https://api.tu-dominio.com` (puerto 3001)

---

## 🚀 Paso 5: Iniciar las Aplicaciones

```bash
# Iniciar backend
cd /home/usuario/tu-dominio.com
npm start

# Iniciar frontend (en otra terminal)
cd /home/usuario/public_html
npm start
```

---

## ✅ Verificación

1. **Backend**: Visita `https://tu-dominio.com:3001/health` o `https://api.tu-dominio.com/health`
2. **Frontend**: Visita `https://tu-dominio.com` o `https://demo.tu-dominio.com`
3. **Matrix View**: `https://tu-dominio.com/matrix`
4. **Agendar Citas**: Click en cualquier lead → "Agendar Cita"

---

## 🎯 Funcionalidades de DEMO Disponibles

✅ Sistema de Leads con Kanban (drag & drop)
✅ Matriz 3x5 con estados visuales
✅ Agendar citas con catálogo de servicios
✅ Filtrado de especialidades por sucursal
✅ Disponibilidad de horarios (datos simulados)
✅ Notificaciones (logs en consola)
✅ WhatsApp simulado (sin conexión real)
✅ Facebook/Instagram simulado
✅ Dashboard con métricas de ejemplo
✅ Gestión de pacientes/contactos

---

## ⚠️ Limitaciones de la Demo

- ❌ Datos solo en memoria (se pierden al reiniciar)
- ❌ No hay conexión real a WhatsApp Business API
- ❌ No hay conexión real a Facebook/Instagram
- ❌ No hay base de datos PostgreSQL
- ❌ Horarios de disponibilidad son aleatorios
- ❌ Notificaciones solo en consola del servidor

---

## 🔧 Solución de Problemas

### Error: "Cannot connect to API"
- Verifica que el backend esté corriendo en el puerto 3001
- Revisa las variables de entorno `NEXT_PUBLIC_API_URL`

### Error: "Port already in use"
- Cambia el puerto en el archivo `.env`
- Reinicia la aplicación Node.js en cPanel

### Frontend no carga
- Asegúrate de haber ejecutado `npm run build` antes de subir
- Verifica que `.next` folder exista

### "404 Not Found" en rutas
- Revisa el archivo `.htaccess`
- Verifica que el proxy esté configurado correctamente

---

## 📞 Comandos Útiles

```bash
# Ver logs del backend
pm2 logs

# Reiniciar aplicación
pm2 restart all

# Ver procesos corriendo
pm2 list

# Detener todo
pm2 stop all
```

---

## 🎨 Personalización para el Cliente

Antes de mostrar al cliente, puedes personalizar:

1. **Logo y colores** en `frontend/app/layout.tsx`
2. **Datos de sucursales** en `src/api/controllers/CatalogoController.ts`
3. **Especialidades y servicios** en el mismo archivo
4. **Leads de ejemplo** en `src/infrastructure/inmemory/InMemoryLeadRepository.ts`

---

## ✨ Presentación al Cliente

**Puntos clave a mencionar:**

1. ✅ "Esta es una versión de demostración funcional"
2. ✅ "Los datos son de ejemplo para mostrar el flujo"
3. ✅ "En producción se conectará a bases de datos reales"
4. ✅ "Las APIs de WhatsApp/Facebook se integrarán con sus cuentas reales"
5. ✅ "Todas las funcionalidades mostradas estarán disponibles"

---

¿Necesitas ayuda con algún paso específico? 🚀
