# ✅ Sistema Demo LISTO para Despliegue

## 📦 Archivos Generados

Los siguientes archivos están listos para subir a cPanel:

1. **backend-demo.tar.gz** (44 MB)
   - Backend compilado con datos de ejemplo
   - Todas las dependencias incluidas
   - Configuración para demo

2. **frontend-demo.tar.gz** (109 MB)
   - Frontend compilado y optimizado
   - Build de producción de Next.js
   - Todas las dependencias incluidas

---

## 🚀 Pasos para Desplegar en cPanel

### Método 1: Despliegue Simplificado (Recomendado)

#### 1. Subir Archivos
- Ve al File Manager de cPanel
- Sube `backend-demo.tar.gz` a `/home/usuario/`
- Descomprime: Click derecho → Extract
- Renombra la carpeta a `api`

- Sube `frontend-demo.tar.gz` a `/home/usuario/public_html/`
- Descomprime: Click derecho → Extract

#### 2. Configurar Aplicación Node.js para Backend

En cPanel → Setup Node.js App → Create Application:

```
Node.js Version: 18.x o superior
Application Mode: Production
Application Root: /home/usuario/api
Application URL: api.tu-dominio.com (o un subdominio)
Application Startup File: dist/index.js
```

Variables de Entorno:
```
NODE_ENV=production
PORT=3001
USE_MEMORY_DB=true
```

Guardar y presionar "Run NPM Install" (ya no es necesario, pero reinicia la app)

#### 3. Configurar Aplicación Node.js para Frontend

Setup Node.js App → Create Application:

```
Node.js Version: 18.x o superior
Application Mode: Production  
Application Root: /home/usuario/public_html
Application URL: tu-dominio.com
Application Startup File: node_modules/next/dist/bin/next
```

Argumentos de inicio:
```
start -p 3000
```

Variables de Entorno:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

Guardar y presionar "Run NPM Install" (reinicia la app)

#### 4. Configurar Proxy

Crea o edita `/home/usuario/public_html/.htaccess`:

```apache
RewriteEngine On

# Proxy para API (redirige /api/* al puerto 3001)
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Proxy para frontend (puerto 3000)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

### Método 2: Con Subdominios Separados

Si prefieres:
- **Frontend**: https://demo.tu-dominio.com (puerto 3000)
- **API Backend**: https://api.tu-dominio.com (puerto 3001)

1. Crea subdominios en cPanel
2. Configura aplicaciones Node.js en cada subdominio
3. Actualiza la variable `NEXT_PUBLIC_API_URL` a `https://api.tu-dominio.com`

---

## ✅ Verificación

Una vez desplegado, verifica:

1. **Backend**: https://tu-dominio.com/api/health
   - Debe responder: `{"status":"ok"}`

2. **Frontend**: https://tu-dominio.com
   - Debe cargar la página principal

3. **Matrix View**: https://tu-dominio.com/matrix
   - Debe mostrar leads con kanban

4. **Agendar Cita**: 
   - Click en cualquier lead → "Agendar Cita"
   - Completa el flujo de 3 pasos

---

## 🎯 Funcionalidades Demo Disponibles

✅ Sistema de Leads con drag & drop
✅ Matriz 3x5 con visualización de estados  
✅ Catálogo de 8 sucursales
✅ 12 especialidades médicas
✅ 24 doctores
✅ 20 servicios con promociones
✅ Disponibilidad de horarios simulada (8AM-6PM)
✅ Agendamiento de citas completo
✅ Dashboard con métricas
✅ WhatsApp/Facebook/Instagram (simulados)
✅ Notificaciones en consola del servidor

---

## ⚠️ Importante

### Este es un SISTEMA DE DEMOSTRACIÓN:

❌ **Datos solo en memoria** (se pierden al reiniciar)
❌ **Sin base de datos PostgreSQL**
❌ **APIs de redes sociales simuladas**
❌ **Horarios aleatorios** (no reales)

### Para Producción Real se Necesita:

✅ Base de datos PostgreSQL
✅ Conexión real a WhatsApp Business API
✅ Conexión real a Facebook/Instagram APIs
✅ Sistema de autenticación completo
✅ Respaldos y persistencia de datos

---

## 🛠️ Solución de Problemas

### Error: "Cannot connect to API"
```bash
# Verifica que el backend esté corriendo:
cd ~/api
pm2 logs

# Reinicia si es necesario:
pm2 restart all
```

### Error: "Port already in use"
- Cambia los puertos en las configuraciones de Node.js App
- Actualiza el `.htaccess` con los nuevos puertos

### Frontend no carga
```bash
cd ~/public_html
pm2 logs

# Verifica que el build existe:
ls -la .next/
```

---

## 📞 Comandos Útiles en Terminal SSH

```bash
# Ver logs en tiempo real
pm2 logs

# Estado de aplicaciones
pm2 list

# Reiniciar todo
pm2 restart all

# Detener todo
pm2 stop all

# Ver uso de memoria
pm2 monit
```

---

## 🎨 Para Mostrar al Cliente

**Mensaje sugerido:**

> "Este es un sistema de demostración completamente funcional que muestra todas las capacidades del CRM:
> 
> ✅ Gestión de leads desde múltiples canales
> ✅ Sistema inteligente de priorización (Matriz 3x5)
> ✅ Agendamiento de citas médicas completo
> ✅ Catálogo de servicios y doctores
> ✅ Simulación de comunicación por WhatsApp/Redes Sociales
> 
> Los datos son de ejemplo para demostración. En la versión de producción:
> - Se conectará a sus bases de datos reales
> - Integrará WhatsApp Business con su cuenta
> - Conectará Facebook e Instagram oficiales
> - Guardará toda la información de forma persistente
> - Incluirá autenticación y permisos por rol"

---

## 📊 Rutas Principales para Demostrar

1. **Dashboard**: `/dashboard` - Métricas y KPIs
2. **Matrix Keila**: `/matrix` - Gestión inteligente de leads
3. **Citas**: `/citas` - Calendario de citas médicas
4. **Contacto/Agente**: `/contacto` - Formulario de agendar citas
5. **Pacientes**: `/pacientes` - Base de datos de pacientes
6. **Automatizaciones**: `/automatizaciones` - Campañas y recordatorios
7. **Finanzas**: `/finanzas` - Control de pagos y abonos

---

¡El sistema demo está completamente listo para subir a cPanel y mostrar al cliente! 🚀
