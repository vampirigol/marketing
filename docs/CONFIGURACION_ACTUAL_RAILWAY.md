# 🎯 Configuración Final de Railway - CRM RCA

## ✅ Estado Actual

### Backend (CRM RCA)
- ✅ Servicio creado y vinculado
- ✅ Variables de entorno configuradas
- ✅ Dominio público: https://crm-rca-production.up.railway.app
- ✅ Deploy en proceso
- ✅ Git repository inicializado

### PostgreSQL
- ✅ Servicio creado (postgres-volume)
- ⚠️ Pendiente: Vincular con el backend

### Frontend
- ⚠️ Pendiente: Crear servicio
- ⚠️ Pendiente: Configurar variables
- ⚠️ Pendiente: Deploy

---

## 📋 Próximos Pasos

### 1. Vincular PostgreSQL al Backend

Ve a Railway Dashboard:
1. Abre: https://railway.app/project/unique-transformation
2. Haz clic en el servicio **CRM RCA**
3. Ve a **Variables**
4. Haz clic en **+ New Variable** → **Add Reference**
5. Selecciona **Postgres** → **DATABASE_URL**
6. Guarda

Esto conectará automáticamente tu backend a la base de datos.

---

### 2. Crear Servicio Frontend

#### Opción A: Desde la UI de Railway

1. En tu proyecto, clic en **+ New**
2. Selecciona **GitHub Repo**
3. Selecciona el repositorio de este proyecto
4. En **Settings** → **Service**:
   - **Root Directory**: `frontend`
   - **Watch Paths**: `frontend/**`

#### Opción B: Desde Railway CLI

```bash
# Cambiar al servicio frontend (si ya existe)
railway service

# O crear nuevo servicio desde la UI y luego vincularlo
```

---

### 3. Configurar Variables del Frontend

Una vez creado el servicio Frontend, ejecuta:

```bash
# Selecciona el servicio Frontend
railway service

# Configura la URL del backend
railway variables set NEXT_PUBLIC_API_URL=https://crm-rca-production.up.railway.app

# Configura el ambiente
railway variables set NODE_ENV=production

# Genera dominio público
railway domain
```

---

### 4. Inicializar Base de Datos

Una vez que el backend esté conectado a PostgreSQL, inicializa las tablas:

```bash
# Ejecutar script de schema
railway run --service "CRM RCA" -- psql $DATABASE_URL -f src/infrastructure/database/schema.sql

# O conectar directamente
railway connect Postgres
# Luego pegar el contenido de src/infrastructure/database/schema.sql
```

---

### 5. Verificar Deploy del Backend

```bash
# Ver logs en tiempo real
railway logs

# Verificar health check
curl https://crm-rca-production.up.railway.app/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T...",
  "environment": "production",
  "service": "RCA CRM System"
}
```

---

### 6. Crear Servicio Frontend (Detallado)

Si el frontend no está creado, sigue estos pasos:

1. **En Railway Dashboard**:
   - Proyecto: `unique-transformation`
   - Clic en **+ New**
   - Selecciona **GitHub Repo**
   - Autoriza y selecciona el repositorio

2. **Configurar el Servicio**:
   ```
   Settings → General
   - Service Name: Frontend
   - Root Directory: frontend
   
   Settings → Deploy
   - Build Command: (auto-detectado por Nixpacks)
   - Start Command: npm start
   
   Settings → Networking
   - Generate Domain
   ```

3. **Variables de Entorno**:
   ```bash
   NEXT_PUBLIC_API_URL=https://crm-rca-production.up.railway.app
   NODE_ENV=production
   ```

---

## 🔍 Comandos Útiles

### Verificar estado
```bash
railway status
```

### Ver logs en tiempo real
```bash
railway logs
```

### Ver variables configuradas
```bash
railway variables
```

### Abrir en navegador
```bash
railway open
```

### Conectar a PostgreSQL
```bash
railway connect Postgres
```

### Cambiar de servicio
```bash
railway service
# Selecciona el servicio que quieres usar
```

### Ver dominios
```bash
railway domain
```

---

## 🐛 Solución de Problemas

### El build falló

1. **Ver logs detallados**:
   ```bash
   railway logs --service "CRM RCA"
   ```

2. **Verificar que railway.json existe**:
   ```bash
   cat railway.json
   ```

3. **Verificar package.json**:
   - Asegúrate de que `build` y `start` scripts estén definidos

### Backend no se conecta a la base de datos

1. **Verificar que DATABASE_URL está configurada**:
   ```bash
   railway variables | grep DATABASE_URL
   ```

2. **Vincular manualmente en la UI**:
   - Service → Variables → + New Variable → Add Reference → Postgres

### Frontend no puede conectar al Backend

1. **Verificar NEXT_PUBLIC_API_URL**:
   ```bash
   # Cambiar a servicio Frontend
   railway service
   railway variables | grep NEXT_PUBLIC_API_URL
   ```

2. **Debe apuntar al dominio correcto del backend**:
   ```
   https://crm-rca-production.up.railway.app
   ```

---

## 📊 Variables de Entorno Completas

### Backend (CRM RCA)
```bash
# Ya configuradas ✅
NODE_ENV=production
PORT=3001
JWT_SECRET=3q4LaP0yRUhio8JsIb/IwS4I9pRRJO+k6aurlu7SVAE=
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# Pendientes (configurar desde Railway UI)
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Reference

# APIs Externas (Configurar cuando tengas las credenciales)
META_APP_ID=
META_APP_SECRET=
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_API_VERSION=v18.0

FACEBOOK_API_URL=https://graph.facebook.com
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_VERIFY_TOKEN=
FACEBOOK_API_VERSION=v18.0

INSTAGRAM_API_URL=https://graph.facebook.com
INSTAGRAM_BUSINESS_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_API_VERSION=v18.0
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=https://crm-rca-production.up.railway.app
NODE_ENV=production
```

---

## 🎉 Checklist Final

- [x] Git inicializado y commit inicial hecho
- [x] Railway CLI instalado y autenticado
- [x] Proyecto vinculado a Railway
- [x] Servicio Backend creado
- [x] Variables de entorno del Backend configuradas
- [x] Dominio del Backend generado
- [x] Deploy del Backend iniciado
- [ ] PostgreSQL vinculado al Backend (hazlo desde la UI)
- [ ] Servicio Frontend creado
- [ ] Variables del Frontend configuradas
- [ ] Dominio del Frontend generado
- [ ] Base de datos inicializada con schema
- [ ] Health check del backend respondiendo
- [ ] Frontend conectado y funcionando

---

## 🔗 Enlaces Importantes

- **Railway Dashboard**: https://railway.app/project/unique-transformation
- **Backend URL**: https://crm-rca-production.up.railway.app
- **Backend Health**: https://crm-rca-production.up.railway.app/health
- **Build Logs**: Ver en Railway Dashboard o con `railway logs`

---

## 📞 Comandos de Referencia Rápida

```bash
# Ver estado
railway status

# Logs
railway logs

# Variables
railway variables

# Deploy
railway up

# Abrir dashboard
railway open

# Conectar a DB
railway connect Postgres

# Cambiar servicio
railway service
```

---

## 🚀 Una vez completado todo

Tu aplicación estará disponible en:
- **Frontend**: https://tu-frontend-url.up.railway.app
- **Backend API**: https://crm-rca-production.up.railway.app/api
- **Health Check**: https://crm-rca-production.up.railway.app/health

¡Y podrás ver actualizaciones en tiempo real cada vez que hagas push a tu repositorio!
