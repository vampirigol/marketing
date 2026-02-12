# 🚀 Railway Setup - Guía Rápida Visual

## ✅ Lo que Ya Está Hecho

```
┌──────────────────────────────────────────────────┐
│ ✅ Git Repository Inicializado                   │
│    - Commit inicial completo                     │
│    - Branch: main                                │
│    - package-lock.json incluido                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ✅ Railway CLI Configurado                       │
│    - Instalado via Homebrew                      │
│    - Autenticado: vampirigol@gmail.com          │
│    - Proyecto: unique-transformation             │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ✅ Backend Desplegándose                         │
│    URL: crm-rca-production.up.railway.app       │
│    Estado: Building...                           │
│    Último commit: Add ES modules support         │
└──────────────────────────────────────────────────┘
```

---

## 🎯 Verifica el Deploy AHORA

Abre una terminal y ejecuta:

```bash
# Ver logs en tiempo real
railway logs

# Deberías ver algo como:
# "Server started on port 3001"
# "Database connected"
```

---

## ⚡ PASOS CRÍTICOS (Hazlos AHORA)

### 1️⃣ Vincular PostgreSQL (MUY IMPORTANTE)

**Ve al Dashboard:** https://railway.app/project/unique-transformation

```
1. Clic en servicio "CRM RCA"
2. Tab "Variables"
3. Busca el botón "+ New Variable"
4. Selecciona "Add Reference"
5. Selecciona "Postgres" → "DATABASE_URL"
6. Clic "Add"
```

Esto hará que Railway redeploy automáticamente.

---

### 2️⃣ Verificar Health Check

Una vez que el deploy termine (2-3 minutos):

```bash
curl https://crm-rca-production.up.railway.app/health
```

**✅ Respuesta correcta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T...",
  "environment": "production",
  "service": "RCA CRM System"
}
```

---

### 3️⃣ Crear Servicio Frontend

**Desde Railway UI:**

1. Ve a https://railway.app/project/unique-transformation
2. Clic en **"+ New"**
3. Selecciona **"GitHub Repo"**
4. Conecta tu repositorio
5. **IMPORTANTE:** Configura Root Directory

```
Settings → General
- Service Name: Frontend CRM
- Root Directory: frontend
- Watch Paths: frontend/**
```

6. Agregar variables:

```
Variables → + New Variable
- NEXT_PUBLIC_API_URL: https://crm-rca-production.up.railway.app
- NODE_ENV: production
```

7. Generar dominio:

```
Settings → Networking → Generate Domain
```

---

## 🔍 Comandos de Monitoreo

### Terminal 1: Ver logs del backend
```bash
railway logs --service "CRM RCA"
```

### Terminal 2: Ver estado
```bash
watch -n 5 'railway status'
```

### Terminal 3: Test health check
```bash
while true; do curl -s https://crm-rca-production.up.railway.app/health | jq; sleep 10; done
```

---

## 📊 Estado Actual de Servicios

```
┌─────────────────────────────────────────────┐
│ Backend (CRM RCA)                           │
│ ┌─────────────────────────────────────────┐ │
│ │ ✅ Servicio creado                       │ │
│ │ ✅ Dominio: crm-rca-production...       │ │
│ │ ⚠️  Deploy en progreso                  │ │
│ │ ❌ PostgreSQL NO vinculado aún         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PostgreSQL (Postgres)                       │
│ ┌─────────────────────────────────────────┐ │
│ │ ✅ Servicio existente                    │ │
│ │ ⚠️  NO vinculado al backend            │ │
│ │ ❌ Schema NO inicializado              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Frontend                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ ❌ Servicio NO creado                   │ │
│ │ ⏸️  Esperando creación                  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ⏱️ Timeline de Lo Que Sigue

**Ahora (0-5 min):**
- ✅ Deploy del backend completándose
- ⏳ Ver logs: `railway logs`

**En 5 min:**
- 🔗 Vincular PostgreSQL al backend
- ✅ Verificar health check

**En 10 min:**
- 🆕 Crear servicio Frontend
- ⚙️ Configurar variables del Frontend

**En 15 min:**
- 📊 Inicializar schema de base de datos
- 🧪 Probar API endpoints

**En 20 min:**
- 🎉 **¡Todo funcionando!**
- 🌐 Frontend y Backend en vivo

---

## 🛠️ Si Algo Sale Mal

### El build sigue fallando
```bash
# Ver logs completos
railway logs --tail 100

# Si ves errores de módulos
# Asegúrate de que "type": "module" está en package.json
```

### El servicio no inicia
```bash
# Verifica que el puerto es correcto
railway variables | grep PORT

# Debe ser: PORT=3001
```

### No puedes ver los logs
```bash
# Revincula el proyecto
railway link

# Selecciona el servicio
railway service
```

---

## 📱 Abre Estos Enlaces AHORA

1. **Dashboard:** https://railway.app/project/unique-transformation
2. **Build Logs:** (mira la terminal donde ejecutaste `railway up`)
3. **Este Archivo:** Para referencia rápida

---

## ✨ Archivos de Ayuda Creados

1. **`RESUMEN_RAILWAY.md`** ← Este archivo (guía rápida)
2. **`RAILWAY_SETUP.md`** - Guía completa detallada
3. **`CONFIGURACION_ACTUAL_RAILWAY.md`** - Estado y siguientes pasos
4. **`railway-setup.sh`** - Script interactivo

---

## 🎯 Tu Siguiente Acción (EN 2 MINUTOS)

1. Abre el dashboard de Railway
2. Ve al servicio "CRM RCA"
3. **Vincula PostgreSQL** (Variables → Add Reference → DATABASE_URL)
4. Espera el redeploy automático
5. Prueba: `curl https://crm-rca-production.up.railway.app/health`

---

## 📞 Comandos Útiles de Railway

```bash
# Ver todo
railway status

# Logs en vivo
railway logs

# Ver variables
railway variables

# Abrir dashboard
railway open

# Conectar a la BD
railway connect Postgres

# Cambiar de servicio
railway service
```

---

## 🚀 Cuando Todo Esté Listo

Tu app estará aquí:
- **Backend:** https://crm-rca-production.up.railway.app
- **Frontend:** https://[tu-dominio-generado].up.railway.app
- **API:** https://crm-rca-production.up.railway.app/api
- **Health:** https://crm-rca-production.up.railway.app/health

---

**¿Listo? ¡Ve al dashboard y vincula PostgreSQL!** 🎉
