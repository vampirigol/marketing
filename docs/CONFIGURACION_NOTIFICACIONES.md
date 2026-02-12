# 🚀 Guía de Configuración: Sistema de Notificaciones Multi-Canal

## 📋 Resumen

Esta guía te ayudará a configurar completamente el sistema de notificaciones y comunicaciones de RCA CRM. El sistema integra **WhatsApp Business API**, **Facebook Messenger** e **Instagram Direct** para que Keila pueda gestionar todas las conversaciones con pacientes desde Matrix (Contact Center).

---

## 🎯 Pre-requisitos

### 1. Cuentas Necesarias
- ✅ Cuenta de Facebook Business Manager
- ✅ Número de teléfono empresarial para WhatsApp Business
- ✅ Página de Facebook vinculada a tu negocio
- ✅ Cuenta de Instagram Business vinculada a la página de Facebook
- ✅ Tarjeta de crédito (Meta requiere verificación de identidad)

### 2. Acceso a Plataformas
- 🔗 [Meta Developers Console](https://developers.facebook.com/)
- 🔗 [Facebook Business Manager](https://business.facebook.com/)
- 🔗 [WhatsApp Business Manager](https://business.facebook.com/wa/manage/)

---

## 📱 PASO 1: Configurar WhatsApp Business API

### 1.1 Crear Aplicación en Meta Developers

1. Ve a https://developers.facebook.com/apps/
2. Click en **"Crear aplicación"**
3. Selecciona **"Empresa"** como tipo
4. Nombre de la app: `RCA CRM WhatsApp`
5. Click en **"Crear aplicación"**

### 1.2 Agregar WhatsApp a tu Aplicación

1. En el panel de la app, busca **"WhatsApp"** en productos disponibles
2. Click en **"Configurar"**
3. Selecciona tu cuenta de WhatsApp Business (o crea una nueva)
4. Verifica tu número de teléfono empresarial

### 1.3 Obtener Credenciales

#### a) Phone Number ID
1. Ve a **WhatsApp → Configuración → Números de teléfono**
2. Copia el **Phone Number ID** (ej: `123456789012345`)
3. Guárdalo para `.env` como `WHATSAPP_PHONE_NUMBER_ID`

#### b) Access Token (Temporal → Permanente)
1. Ve a **WhatsApp → Configuración → API**
2. Copia el **Token de acceso temporal** (válido 24 horas)
3. **⚠️ IMPORTANTE**: Genera un token permanente:
   - Ve a **Configuración → Configuración básica**
   - Copia **App ID** y **App Secret**
   - Usa el Graph API Explorer o cURL:
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TOKEN_TEMPORAL"
   ```
4. Guarda el token permanente como `WHATSAPP_ACCESS_TOKEN`

#### c) Business Account ID
1. Ve a **WhatsApp → Configuración → Configuración de WhatsApp Business**
2. Copia el **WhatsApp Business Account ID**
3. Guárdalo como `WHATSAPP_BUSINESS_ACCOUNT_ID`

### 1.4 Configurar Webhook

1. Ve a **WhatsApp → Configuración → Webhooks**
2. Click en **"Editar"**
3. **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/whatsapp`
   - Para desarrollo local: usa [ngrok](https://ngrok.com) o [localtunnel](https://localtunnel.me)
   - Ejemplo con ngrok: `https://abc123.ngrok.io/api/webhooks/whatsapp`
4. **Token de verificación**: crea uno único (ej: `rca-webhook-2024-xyz`)
   - Guárdalo como `WHATSAPP_VERIFY_TOKEN` en `.env`
5. Click en **"Verificar y guardar"**
6. Suscríbete a los siguientes campos:
   - ✅ `messages` (mensajes entrantes)
   - ✅ `message_status` (confirmación de entrega/lectura)
   - ✅ `account_alerts` (alertas de cuenta)

### 1.5 Agregar Números de Prueba

Antes de producción, agrega números de prueba:
1. Ve a **WhatsApp → Configuración → Números de prueba**
2. Agrega tu número personal para pruebas
3. Envía un mensaje de prueba desde el panel

---

## 💬 PASO 2: Configurar Facebook Messenger

### 2.1 Agregar Messenger a la Aplicación

1. En tu app de Meta Developers, busca **"Messenger"**
2. Click en **"Configurar"**
3. Selecciona tu página de Facebook

### 2.2 Obtener Page Access Token

1. Ve a **Messenger → Configuración → Generador de tokens de acceso**
2. Selecciona tu página de Facebook
3. Copia el **Token de acceso de página**
4. Guárdalo como `FACEBOOK_PAGE_ACCESS_TOKEN`

### 2.3 Obtener Page ID

1. Ve a tu página de Facebook
2. **Configuración → Acerca de**
3. Copia el **ID de página**
4. Guárdalo como `FACEBOOK_PAGE_ID`

### 2.4 Configurar Webhook

1. Ve a **Messenger → Configuración → Webhooks**
2. Click en **"Agregar URL de devolución de llamada"**
3. **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/facebook`
4. **Token de verificación**: crea uno único (ej: `rca-fb-webhook-2024`)
   - Guárdalo como `FACEBOOK_VERIFY_TOKEN`
5. Click en **"Verificar y guardar"**
6. Suscríbete a los campos:
   - ✅ `messages` (mensajes entrantes)
   - ✅ `messaging_postbacks` (respuestas de botones)
   - ✅ `message_reads` (confirmación de lectura)
   - ✅ `message_deliveries` (confirmación de entrega)

### 2.5 Solicitar Permisos Avanzados

Para producción, solicita permisos:
1. Ve a **Messenger → Configuración → Revisión de permisos**
2. Solicita: `pages_messaging`, `pages_manage_metadata`
3. Completa el formulario de revisión de Meta

---

## 📸 PASO 3: Configurar Instagram Direct

### 3.1 Vincular Cuenta de Instagram Business

1. Ve a tu página de Facebook → **Configuración**
2. **Instagram → Conectar cuenta**
3. Inicia sesión con tu cuenta de Instagram Business
4. Autoriza la conexión

### 3.2 Agregar Instagram a la Aplicación

1. En tu app de Meta Developers, busca **"Instagram"**
2. Click en **"Configurar"**
3. Vincula tu cuenta de Instagram Business

### 3.3 Obtener Credenciales

#### a) Instagram Business Account ID
1. Ve a **Instagram → Configuración → Información básica**
2. Copia el **ID de cuenta de empresa de Instagram**
3. O usa Graph API Explorer:
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_PAGE_TOKEN"
   ```
   Luego:
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=TU_PAGE_TOKEN"
   ```
4. Guárdalo como `INSTAGRAM_BUSINESS_ACCOUNT_ID`

#### b) Page Access Token
- Usa el mismo token de Facebook: `INSTAGRAM_PAGE_ACCESS_TOKEN` (mismo valor que `FACEBOOK_PAGE_ACCESS_TOKEN`)

### 3.4 Configurar Webhook

1. Ve a **Instagram → Configuración → Webhooks**
2. **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/instagram`
3. **Token de verificación**: crea uno único
   - Guárdalo como `INSTAGRAM_VERIFY_TOKEN`
4. Suscríbete a los campos:
   - ✅ `messages` (mensajes directos)
   - ✅ `message_reactions` (reacciones a mensajes)
   - ✅ `story_mentions` (menciones en historias)

---

## 🔐 PASO 4: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# ===============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===============================================
DATABASE_URL=postgresql://usuario:password@localhost:5432/rca_crm
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rca_crm
DB_USER=postgres
DB_PASSWORD=postgres

# ===============================================
# CONFIGURACIÓN DEL SERVIDOR
# ===============================================
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# ===============================================
# SEGURIDAD Y AUTENTICACIÓN
# ===============================================
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion-xyz123
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# ===============================================
# WHATSAPP BUSINESS API (Meta Cloud API)
# ===============================================
META_APP_ID=123456789012345
META_APP_SECRET=abc123def456ghi789jkl012mno345pq
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_BUSINESS_ACCOUNT_ID=111222333444555
WHATSAPP_PHONE_NUMBER_ID=999888777666555
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO7ZCqS4k... (token permanente)
WHATSAPP_VERIFY_TOKEN=rca-webhook-2024-xyz
WHATSAPP_API_VERSION=v18.0

# ===============================================
# FACEBOOK MESSENGER API
# ===============================================
FACEBOOK_API_URL=https://graph.facebook.com
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_PAGE_ACCESS_TOKEN=EAABsbCS1iHgBO7ZCqS4k... (page token)
FACEBOOK_VERIFY_TOKEN=rca-fb-webhook-2024
FACEBOOK_API_VERSION=v18.0

# ===============================================
# INSTAGRAM DIRECT API
# ===============================================
INSTAGRAM_API_URL=https://graph.facebook.com
INSTAGRAM_BUSINESS_ACCOUNT_ID=987654321098765
INSTAGRAM_PAGE_ACCESS_TOKEN=EAABsbCS1iHgBO7ZCqS4k... (mismo que Facebook)
INSTAGRAM_VERIFY_TOKEN=rca-ig-webhook-2024
INSTAGRAM_API_VERSION=v18.0

# ===============================================
# WEBSOCKET SERVER (Socket.io)
# ===============================================
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# ===============================================
# ZONAS HORARIAS Y UBICACIÓN
# ===============================================
DEFAULT_TIMEZONE=America/Mexico_City
DEFAULT_LOCALE=es-MX
```

---

## 🧪 PASO 5: Probar la Configuración

### 5.1 Instalar Dependencias

```bash
cd /Users/luciodelacruz/Projects/MarketingPro/CRM_RCA
npm install
```

### 5.2 Iniciar el Servidor

```bash
# Terminal 1: API principal
npm run dev

# Terminal 2: Servidor WebSocket
npm run dev:websocket
```

### 5.3 Probar Webhooks con ngrok (Desarrollo Local)

Si estás en desarrollo local, expone tu servidor:

```bash
# Instalar ngrok
brew install ngrok

# Exponer puerto 3000
ngrok http 3000
```

Copia la URL de ngrok (ej: `https://abc123.ngrok.io`) y actualízala en Meta Developers.

### 5.4 Pruebas Individuales

#### Test WhatsApp
```bash
# Verificar webhook
curl "https://tu-dominio.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=rca-webhook-2024-xyz&hub.challenge=test123"

# Debería retornar: test123
```

#### Test Facebook
```bash
curl "https://tu-dominio.com/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=rca-fb-webhook-2024&hub.challenge=test456"
```

#### Test Instagram
```bash
curl "https://tu-dominio.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=rca-ig-webhook-2024&hub.challenge=test789"
```

### 5.5 Enviar Mensaje de Prueba

Crea un archivo `test-notification.ts`:

```typescript
import { NotificationService } from './src/infrastructure/notifications/NotificationService';
import { WhatsAppService } from './src/infrastructure/messaging/WhatsAppService';
import { FacebookService } from './src/infrastructure/messaging/FacebookService';
import { InstagramService } from './src/infrastructure/messaging/InstagramService';
import { ReminderScheduler } from './src/infrastructure/scheduling/ReminderScheduler';

const whatsappService = new WhatsAppService();
const facebookService = new FacebookService();
const instagramService = new InstagramService();
const reminderScheduler = new ReminderScheduler();

const notificationService = new NotificationService(
  whatsappService,
  facebookService,
  instagramService,
  reminderScheduler
);

// Paciente de prueba
const pacientePrueba = {
  id: 'pac-test-001',
  nombre: 'Juan',
  apellido: 'Pérez',
  telefono: '+525512345678', // Número de prueba agregado en WhatsApp Manager
  preferenciaComunicacion: 'whatsapp'
};

// Cita de prueba
const citaPrueba = {
  id: 'cita-test-001',
  pacienteId: 'pac-test-001',
  fechaHora: new Date('2024-06-15T10:00:00'),
  sucursal: 'Clínica Centro',
  costoConsulta: 500
};

// Enviar confirmación
(async () => {
  console.log('🚀 Enviando confirmación de prueba...');
  const resultado = await notificationService.enviarConfirmacionAutomatica(
    pacientePrueba,
    citaPrueba
  );
  console.log('✅ Resultado:', resultado);
})();
```

Ejecutar:
```bash
npx ts-node test-notification.ts
```

---

## 🔍 PASO 6: Verificar Logs

### 6.1 Ver Logs del Servidor

```bash
# Logs en tiempo real
tail -f logs/app.log

# Filtrar solo notificaciones
tail -f logs/app.log | grep WHATSAPP
tail -f logs/app.log | grep FACEBOOK
tail -f logs/app.log | grep INSTAGRAM
```

### 6.2 Ver Logs en Meta Developers

1. Ve a tu app en Meta Developers
2. **Herramientas → Webhooks**
3. Click en **"Ver suscripciones"**
4. Verás intentos de entrega y respuestas

---

## 🚨 Solución de Problemas

### ❌ Error: "Webhook verification failed"
- **Causa**: Token de verificación incorrecto
- **Solución**: Verifica que el token en `.env` coincida exactamente con el configurado en Meta Developers

### ❌ Error: "Invalid access token"
- **Causa**: Token temporal expiró o es inválido
- **Solución**: Genera un token permanente (ver PASO 1.3b)

### ❌ Error: "Phone number not registered"
- **Causa**: Número no agregado a números de prueba
- **Solución**: Agrega el número en WhatsApp Manager → Números de prueba

### ❌ Error: "Webhook not receiving messages"
- **Causa**: URL de webhook incorrecta o servidor no alcanzable
- **Solución**: 
  - Verifica que el servidor esté corriendo
  - Si es desarrollo local, usa ngrok y actualiza la URL
  - Verifica logs del servidor: `tail -f logs/app.log`

### ❌ Error: "Message delivery failed"
- **Causa**: Plantilla no aprobada o formato incorrecto
- **Solución**: 
  - Verifica que las plantillas estén aprobadas en WhatsApp Manager
  - Revisa el formato del mensaje (debe coincidir con la plantilla)

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Facebook Messenger API](https://developers.facebook.com/docs/messenger-platform)
- [Instagram Direct API](https://developers.facebook.com/docs/instagram-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)

### Herramientas Útiles
- [Postman Collection para WhatsApp API](https://www.postman.com/meta/workspace/whatsapp-business-platform)
- [ngrok](https://ngrok.com) - Túnel para desarrollo local
- [Localtunnel](https://localtunnel.me) - Alternativa a ngrok

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Facebook Business Manager creada
- [ ] Aplicación en Meta Developers creada
- [ ] WhatsApp Business API configurada
- [ ] Número de teléfono verificado
- [ ] Token de acceso permanente generado
- [ ] Webhooks de WhatsApp configurados y verificados
- [ ] Facebook Messenger configurado
- [ ] Instagram Business vinculado
- [ ] Variables de entorno en `.env` configuradas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor corriendo sin errores
- [ ] Prueba de envío de mensaje exitosa
- [ ] Webhooks recibiendo eventos correctamente

---

## 🎉 ¡Listo!

Tu sistema de notificaciones multi-canal está configurado. Keila ahora puede:

✅ Enviar confirmaciones automáticas de citas vía WhatsApp  
✅ Enviar recordatorios 24h antes y el día de la cita  
✅ Notificar cambios de precio cuando se pierde promoción  
✅ Recibir mensajes de pacientes en Matrix desde WhatsApp, Facebook e Instagram  
✅ Gestionar todas las conversaciones desde un solo inbox (Matrix)  

**Siguiente paso**: Configurar la base de datos PostgreSQL y los repositorios reales.
