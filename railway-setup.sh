#!/bin/bash

# Script de configuración automática de Railway para CRM RCA
# Este script te ayudará a configurar todo el proyecto paso a paso

echo "🚀 Configuración de Railway para CRM RCA"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Vincular o crear proyecto
echo -e "${BLUE}Paso 1: Vinculando proyecto Railway...${NC}"
echo "Selecciona tu proyecto 'unique-transformation' cuando se te pregunte"
railway link

echo ""
echo -e "${GREEN}✅ Proyecto vinculado${NC}"
echo ""

# Paso 2: Listar servicios actuales
echo -e "${BLUE}Paso 2: Servicios actuales en Railway...${NC}"
railway status

echo ""
read -p "Presiona Enter para continuar..."

# Paso 3: Instrucciones para crear servicios
echo ""
echo -e "${YELLOW}Paso 3: Crear servicios necesarios${NC}"
echo "Necesitas tener 3 servicios en Railway:"
echo ""
echo "1️⃣  PostgreSQL (ya lo tienes ✅)"
echo "2️⃣  Backend (CRM RCA)"
echo "3️⃣  Frontend"
echo ""
echo "Para crear los servicios:"
echo "1. Ve a https://railway.app/project/unique-transformation"
echo "2. Haz clic en '+ New Service'"
echo "3. Selecciona 'GitHub Repo'"
echo "4. Selecciona este repositorio"
echo "5. Para el Frontend, configura Root Directory: 'frontend'"
echo ""
read -p "¿Ya creaste los servicios? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${GREEN}✅ Servicios creados${NC}"
else
    echo -e "${YELLOW}Por favor crea los servicios y vuelve a ejecutar este script${NC}"
    exit 0
fi

# Paso 4: Variables de entorno Backend
echo ""
echo -e "${BLUE}Paso 4: Configurar variables de entorno del Backend${NC}"
echo ""
echo "Ejecuta estos comandos para configurar el backend:"
echo ""
echo -e "${YELLOW}# Selecciona el servicio Backend${NC}"
echo "railway service"
echo ""
echo -e "${YELLOW}# Configura las variables esenciales${NC}"
cat << 'EOF'
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set JWT_EXPIRATION=24h
railway variables set BCRYPT_ROUNDS=10

# Vincula la base de datos (esto se hace automáticamente en la UI)
# DATABASE_URL se configura automáticamente al vincular PostgreSQL
EOF

echo ""
read -p "Presiona Enter para continuar..."

# Paso 5: Variables de entorno Frontend
echo ""
echo -e "${BLUE}Paso 5: Configurar variables del Frontend${NC}"
echo ""
echo "Ejecuta estos comandos para configurar el frontend:"
echo ""
echo -e "${YELLOW}# Selecciona el servicio Frontend${NC}"
echo "railway service"
echo ""
echo -e "${YELLOW}# Configura la URL del backend${NC}"
echo 'railway variables set NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app'
echo ""
echo "⚠️  IMPORTANTE: Reemplaza 'tu-backend.up.railway.app' con el dominio real de tu backend"
echo ""
read -p "Presiona Enter para continuar..."

# Paso 6: Generar dominios
echo ""
echo -e "${BLUE}Paso 6: Generar dominios públicos${NC}"
echo ""
echo "Para cada servicio (Backend y Frontend):"
echo "1. Selecciona el servicio: railway service"
echo "2. Genera dominio: railway domain"
echo ""
echo "O desde la UI:"
echo "Settings → Networking → Generate Domain"
echo ""
read -p "¿Ya generaste los dominios? (y/n) " -n 1 -r
echo ""

# Paso 7: Deploy
echo ""
echo -e "${BLUE}Paso 7: Hacer deploy${NC}"
echo ""
echo "Railway hace deploy automático cuando detecta cambios en GitHub"
echo "Si quieres forzar un redeploy:"
echo ""
echo "railway up"
echo ""
read -p "¿Quieres hacer deploy ahora? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Desplegando..."
    railway up
fi

# Resumen final
echo ""
echo -e "${GREEN}========================================"
echo "✅ Configuración completada"
echo "========================================${NC}"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Verifica que los servicios estén corriendo:"
echo "   railway status"
echo ""
echo "2. Ve los logs en tiempo real:"
echo "   railway logs"
echo ""
echo "3. Abre tu proyecto en el navegador:"
echo "   railway open"
echo ""
echo "4. Inicializa la base de datos:"
echo "   railway run psql \$DATABASE_URL -f src/infrastructure/database/schema.sql"
echo ""
echo "5. Verifica el health check del backend:"
echo "   curl https://tu-backend.up.railway.app/health"
echo ""
echo -e "${BLUE}📚 Consulta RAILWAY_SETUP.md para más detalles${NC}"
echo ""
