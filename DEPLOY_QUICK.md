# 🚀 Despliegue Rápido - Versión Demo

## Pasos Resumidos para cPanel:

### 1️⃣ Compilar Localmente
```bash
# Backend
npm install
npm run build

# Frontend
cd frontend
npm install
npm run build
cd ..
```

### 2️⃣ Comprimir para Subir
```bash
# Backend
tar -czf backend-demo.tar.gz dist/ package.json package-lock.json .env

# Frontend
cd frontend
tar -czf frontend-demo.tar.gz .next/ public/ package.json package-lock.json next.config.js
cd ..
```

### 3️⃣ En cPanel

**Subir archivos:**
- Descomprime `backend-demo.tar.gz` en `/home/usuario/api/`
- Descomprime `frontend-demo.tar.gz` en `/home/usuario/public_html/`

**Instalar dependencias:**
```bash
cd ~/api && npm install --production
cd ~/public_html && npm install --production
```

**Configurar aplicaciones Node.js:**

**Backend (API):**
- Application Root: `/home/usuario/api`
- Startup File: `dist/index.js`
- Puerto: 3001
- Variables: `NODE_ENV=production`, `USE_MEMORY_DB=true`

**Frontend:**
- Application Root: `/home/usuario/public_html`
- Startup File: `node_modules/next/dist/bin/next`
- Arguments: `start -p 3000`
- Variables: `NEXT_PUBLIC_API_URL=https://tu-dominio.com/api`

### 4️⃣ Configurar .htaccess
En `public_html/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]
```

### 5️⃣ Iniciar
```bash
cd ~/api && npm start &
cd ~/public_html && npm start &
```

¡Listo! Tu demo estará en `https://tu-dominio.com`
