# 🚀 Guía de Despliegue en Railway

## 📋 Pasos para configurar Railway

### 1. Crear Servicios en Railway

Tu proyecto necesita **3 servicios**:

#### a) Servicio PostgreSQL
- Ya lo tienes creado ✅
- Railway automáticamente crea las variables: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

#### b) Servicio Backend (CRM RCA)
1. En Railway, clic en "+ New"
2. Selecciona "GitHub Repo"
3. Conecta este repositorio
4. Railway detectará automáticamente el `railway.json` y el `Dockerfile`

#### c) Servicio Frontend
1. En Railway, clic en "+ New"  
2. Selecciona "GitHub Repo"
3. Usa el mismo repositorio pero configura el **Root Directory** como `frontend`

---

## ⚙️ Configurar Variables de Entorno

### Variables del Backend (Servicio CRM RCA)

```bash
# Base de datos (Railway las crea automáticamente al vincular PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Servidor
NODE_ENV=production
PORT=3001
API_URL=${{CRM_RCA.RAILWAY_PUBLIC_DOMAIN}}

# JWT
JWT_SECRET=tu-secreto-super-seguro-generado-aleatoriamente-aqui
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# WhatsApp Business API
META_APP_ID=tu-app-id
META_APP_SECRET=tu-app-secret
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_BUSINESS_ACCOUNT_ID=tu-whatsapp-business-id
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_ACCESS_TOKEN=tu-access-token-permanente
WHATSAPP_VERIFY_TOKEN=tu-token-de-verificacion
WHATSAPP_API_VERSION=v18.0

# Facebook Messenger API
FACEBOOK_API_URL=https://graph.facebook.com
FACEBOOK_PAGE_ID=tu-facebook-page-id
FACEBOOK_PAGE_ACCESS_TOKEN=tu-facebook-page-token
FACEBOOK_VERIFY_TOKEN=tu-facebook-webhook-verify-token
FACEBOOK_API_VERSION=v18.0

# Instagram API
INSTAGRAM_API_URL=https://graph.facebook.com
INSTAGRAM_BUSINESS_ACCOUNT_ID=tu-instagram-business-id
INSTAGRAM_ACCESS_TOKEN=tu-instagram-token
INSTAGRAM_API_VERSION=v18.0
```

### Variables del Frontend

```bash
NEXT_PUBLIC_API_URL=${{CRM_RCA.RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
```

---

## 🔗 Vincular PostgreSQL con el Backend

1. Ve al servicio **CRM RCA** (Backend)
2. En la pestaña "Settings", ve a "Service Variables"
3. Clic en "+ Variable Reference"
4. Selecciona el servicio **Postgres**
5. Agrega estas referencias:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}`

---

## 🎯 Configuración de Build

### Backend
Railway usará el `railway.json` que ya creé:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Frontend
1. En Settings del servicio Frontend
2. Configura:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`

---

## 🌐 Exponer los Servicios

### Backend
1. Ve al servicio CRM RCA
2. En "Settings" → "Networking"
3. Clic en "Generate Domain"
4. Copia la URL (algo como: `crm-rca-production.up.railway.app`)

### Frontend
1. Ve al servicio Frontend
2. En "Settings" → "Networking"
3. Clic en "Generate Domain"
4. Esta será tu URL pública

---

## 🗄️ Inicializar la Base de Datos

Después del primer deploy del backend, necesitas crear las tablas:

1. Ve al servicio **Postgres**
2. Abre la pestaña "Connect"
3. Clic en "Query"
4. Ejecuta el script de creación de tablas (deberías tener un archivo `schema.sql`)

O conéctate vía CLI:
```bash
railway link
railway run psql $DATABASE_URL -f scripts/init-db.sql
```

---

## 🔄 Deploy Automático

Railway hace deploy automático cuando:
- Haces push a la rama principal de GitHub
- Cambias variables de entorno
- Reinicias manualmente el servicio

---

## 📝 Checklist Final

- [ ] PostgreSQL corriendo y conectado
- [ ] Variables de entorno del Backend configuradas
- [ ] Variables de entorno del Frontend configuradas
- [ ] Backend conectado a PostgreSQL
- [ ] Frontend apuntando a la URL del Backend
- [ ] Dominios públicos generados para Backend y Frontend
- [ ] Base de datos inicializada con tablas
- [ ] Healthcheck `/health` del backend respondiendo

---

## 🐛 Solución de Problemas

### Build falló
- Revisa los logs en Railway: "View Logs"
- Asegúrate de que todas las dependencias estén en `package.json`
- Verifica que el script de build esté correcto

### Backend no se conecta a la BD
- Verifica que la variable `DATABASE_URL` esté vinculada correctamente
- Comprueba los logs del servicio

### Frontend no puede conectar al Backend
- Asegúrate de que `NEXT_PUBLIC_API_URL` apunte al dominio correcto del backend
- Verifica que el backend tenga CORS habilitado

### Variables de entorno no se aplican
- Después de cambiar variables, Railway hace redeploy automático
- Espera unos minutos para que el servicio se reinicie

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará en vivo y podrás acceder desde:
- **Frontend**: `https://tu-frontend.up.railway.app`
- **Backend API**: `https://tu-backend.up.railway.app/api`
- **Health Check**: `https://tu-backend.up.railway.app/health`

---

## 📞 Comandos Railway CLI útiles

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link

# Ver variables
railway variables

# Ver logs en tiempo real
railway logs

# Abrir en el navegador
railway open
```
