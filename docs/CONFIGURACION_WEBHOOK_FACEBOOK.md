# Configuración del webhook de Facebook Messenger

Para que los mensajes de Facebook empiecen a llegar al CRM/Matrix, Facebook debe poder llamar a tu backend. En desarrollo local (localhost) Facebook **no puede** acceder a tu máquina, por eso se usa un túnel público.

---

## ⚠️ Importante: Ngrok Free NO funciona con Facebook

Según la [documentación oficial de ngrok](https://ngrok.com/docs/integrations/webhooks/facebook-messenger-webhooks): *"This integration requires an ngrok Pro or Enterprise license because Facebook validates your ngrok domain and certificate."*

Con **Ngrok gratuito** (dominios `*.ngrok-free.dev`), Meta suele devolver: *"No se pudo validar la URL de devolución de llamada o el token de verificación"* porque:

1. Facebook valida dominio y certificado SSL.
2. Ngrok free puede mostrar una página intermedia ante algunas peticiones.
3. La integración oficial de Facebook con ngrok requiere plan Pro/Enterprise.

### Solución recomendada: Cloudflare Tunnel (cloudflared) — gratuito

**Cloudflare Tunnel** es gratuito, no muestra páginas intermedias y ofrece HTTPS válido que Facebook acepta.

---

## 1. Opción A: Cloudflare Tunnel (recomendado para desarrollo)

El **backend** corre en el puerto **3001**. Cloudflare Tunnel lo expone con HTTPS válido.

### Instalación de cloudflared

- **macOS (Homebrew):** `brew install cloudflared`
- **Descarga:** [https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

### Iniciar el túnel (sin cuenta Cloudflare)

```bash
cloudflared tunnel --url http://localhost:3001
```

cloudflared mostrará una URL como `https://xxxx-xxxx-xxxx.trycloudflare.com`. **Usa esa URL** como base para el Callback en Meta.

**⚠️ Crítico:** El túnel debe apuntar al **Backend (puerto 3001)**, no al Frontend (3000). Si apuntas a 3000, Facebook recibirá la app Next.js en lugar de la API y la verificación fallará.

**Callback URL para Facebook:**
```
https://TU-URL.trycloudflare.com/api/matrix/webhooks/facebook
```

Con **ngrok** (ej: `unoffered-overstrongly-fermin.ngrok-free.dev`):
- **Webhook unificado (recomendado):** `https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger`
- Ruta legacy: `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/matrix/webhooks/facebook`

Ver **docs/META_APPS_URLS.md** para todas las URLs completas de Meta.

---

## 2. Opción B: Ngrok Pro (si ya tienes licencia)

Si tienes **ngrok Pro o Enterprise**, necesitas un **dominio propio** de ngrok (ej: `miapp.ngrok.app`), no el subdominio aleatorio `.ngrok-free.dev`. Consulta [ngrok Facebook Messenger](https://ngrok.com/docs/integrations/webhooks/facebook-messenger-webhooks).

---

## 3. Opción C: Ngrok Free (solo para pruebas)

El plan gratuito de ngrok **no es compatible** con la validación de Facebook. Si usas `ngrok http 3001` con dominio gratuito, la verificación suele fallar. Reserva esta opción solo para pruebas locales o curl.

---

## 4. URL de devolución de llamada (Callback URL)

En la sección **“Configurar webhooks”** de Meta (Facebook Developers), la **URL de devolución de llamada** debe ser la de tu backend, no la del frontend.

En este proyecto hay dos rutas que pueden recibir el webhook de Facebook:

| Ruta | Uso recomendado |
|------|------------------|
| `https://TU-URL/api/webhooks/facebook` | Webhook genérico (verificación de firma con `META_APP_SECRET`) |
| `https://TU-URL/api/matrix/webhooks/facebook` | Integración con Matrix/CRM (solicitudes y conversaciones) |

**Recomendación:** Usa la ruta de **Matrix** para que los mensajes aparezcan en el inbox del CRM:

```
https://TU-URL/api/matrix/webhooks/facebook
```

- Con **Cloudflare Tunnel**: sustituye `TU-URL` por la URL que muestra cloudflared (ej: `xxxx.trycloudflare.com`).
- Con **ngrok**: `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/matrix/webhooks/facebook`

Ver **docs/META_APPS_URLS.md** para todas las URLs de Meta con ngrok.

---

## 5. Token de verificación

Facebook envía un **GET** al configurar el webhook y espera que devuelvas el `hub.challenge` solo si el token coincide.

**Token generado para este proyecto** (cópialo tal cual en `.env` y en Meta):

```
rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c
```

1. En tu archivo **`.env`** agrega o actualiza:

   ```env
   FACEBOOK_VERIFY_TOKEN=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c
   ```

2. En Meta Developers, en la misma pantalla de webhooks donde pusiste la URL, en **“Token de verificación”** ingresa **exactamente** el mismo valor: `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c`

Si no coinciden, la verificación falla y Facebook no suscribirá el webhook.

### Si Meta dice "No se pudo validar la URL de devolución de llamada o el token de verificación"

1. **¿Usas Ngrok free?**  
   Si usas `*.ngrok-free.dev`, es muy probable que falle. Cambia a **Cloudflare Tunnel** (ver sección 1): `cloudflared tunnel --url http://localhost:3001`.

2. **Token en tu `.env` real**  
   El token debe estar en tu archivo **`.env`** (no solo en `.env.example`). Si no existe, créalo en la raíz del proyecto y agrega:
   ```env
   FACEBOOK_VERIFY_TOKEN=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c
   ```
   Después de cambiar `.env`, **reinicia el backend** (el servidor no recarga las variables solo).

3. **Backend y túnel en marcha**  
   - Backend corriendo en el puerto **3001**.  
   - Cloudflared o Ngrok apuntando a 3001.  
   - La URL de la captura debe ser exactamente la que muestra el túnel.

4. **Probar la verificación desde tu máquina**  
   Sustituye `TU-URL` por tu URL real (Cloudflare o Ngrok):
   ```bash
   curl -v "https://TU-URL/api/matrix/webhooks/facebook?hub.mode=subscribe&hub.verify_token=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c&hub.challenge=test123"
   ```
   La respuesta debe ser exactamente `test123` (y HTTP 200).

5. **Revisar logs del backend**  
   Al pulsar "Verificar y guardar" en Meta, en la terminal del backend deberían aparecer líneas como `[Facebook Webhook] Verificación GET:` y si falla, `Verificación fallida`. Eso indica si el GET está llegando y por qué no pasa.

---

## 6. Pasos en Meta (Facebook Developers)

1. Ir a [developers.facebook.com](https://developers.facebook.com) → tu **App**.
2. En el menú, **Productos** → **Messenger** (o **Facebook** según la app).
3. En **Configuración** → **Webhooks** → **Configurar** (o “Agregar suscripción”).
4. **URL de devolución de llamada:**  
   `https://TU-URL/api/matrix/webhooks/facebook` (usa la URL de Cloudflare Tunnel o Ngrok Pro)
5. **Token de verificación:** `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c` (el mismo que en `FACEBOOK_VERIFY_TOKEN` en `.env`).
6. Pulsar **Verificar y guardar**.
7. Suscribir los campos que necesites (por ejemplo **messages**, **messaging_postbacks**, **message_reads**, **message_deliveries**).

---

## 7. Prueba manual ANTES de Facebook

Antes de hacer clic en "Verificar y guardar" en Meta, prueba que el backend responda correctamente:

1. Asegúrate de que el **backend** esté corriendo en el puerto 3001.
2. Asegúrate de que **cloudflared** esté activo: `cloudflared tunnel --url http://localhost:3001`
3. Copia la URL que muestra cloudflared (ej: `https://cabinet-homes-retailers-sacred.trycloudflare.com`).
4. Abre en el navegador esta URL completa (sustituye `TU-URL` por tu URL real):

   ```
   https://TU-URL.trycloudflare.com/api/matrix/webhooks/facebook?hub.mode=subscribe&hub.verify_token=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c&hub.challenge=1234567890
   ```

5. **Resultado esperado:** Debes ver solo el número `1234567890` en la página (texto plano).

| Si ves... | Problema |
|-----------|----------|
| `1234567890` | ✅ Funciona. Usa esa URL en Facebook. |
| `Cannot GET` o 404 | El túnel apunta al puerto equivocado (debe ser 3001) o la ruta no existe. |
| `Forbidden` o 403 | El token en `.env` no coincide. Verifica `FACEBOOK_VERIFY_TOKEN`. |
| Página en blanco / error | Backend no está corriendo o el túnel está cerrado. |

---

## 8. Resumen rápido (con Cloudflare Tunnel)

| Dónde | Valor |
|-------|--------|
| Puerto del backend | `3001` (verifica `PORT=3001` en `.env`) |
| Comando túnel | `cloudflared tunnel --url http://localhost:3001` ← **debe apuntar al backend** |
| Callback URL | `https://<tu-url>.trycloudflare.com/api/matrix/webhooks/facebook` |
| Token de verificación | `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c` (en `.env` como `FACEBOOK_VERIFY_TOKEN`) |

---

## 9. Producción

En producción no uses Ngrok. La **URL de devolución de llamada** será la de tu servidor real, por ejemplo:

```
https://api.tudominio.com/api/matrix/webhooks/facebook
```

Asegúrate de que en el servidor estén definidas las variables de entorno (`FACEBOOK_VERIFY_TOKEN`, `FACEBOOK_PAGE_ACCESS_TOKEN`, etc.) y que el puerto 443 (HTTPS) esté accesible desde internet.

---

## 10. Suscribir la Página a webhooks (Meta Config API)

Después de verificar el webhook en el App Dashboard, debes **suscribir cada Página** a los eventos de mensajería para que Meta envíe los webhooks. Esto se hace por API.

### Permisos requeridos (App Review)

Tu app debe tener estos permisos según [Meta Permissions](https://developers.facebook.com/docs/permissions):

| Permiso | Uso |
|---------|-----|
| `pages_show_list` | Listar páginas que gestiona el usuario |
| `pages_messaging` | Enviar y recibir mensajes en Messenger |
| `pages_manage_metadata` | Suscribir webhooks a la página |
| `instagram_manage_messages` | Para Instagram Direct (opcional) |

### Endpoint para suscribir una Página

```bash
POST /api/meta-config/suscribir-pagina
Content-Type: application/json

{
  "pageId": "TU_PAGE_ID",
  "pageAccessToken": "TU_PAGE_ACCESS_TOKEN",
  "subscribedFields": ["messages", "message_deliveries", "message_reads", "messaging_postbacks"]
}
```

- `pageId`: ID de la Página de Facebook (no el App ID).
- `pageAccessToken`: Token de página (Page Access Token), obtenido al conectar la Página en el App Dashboard o mediante el flujo de Facebook Login para empresas.
- `subscribedFields`: Campos a suscribir; los indicados son los recomendados para Keila IA.

### Obtener Page Access Token

1. En [developers.facebook.com](https://developers.facebook.com) → tu App → **Messenger** → **Configuración**.
2. En "Tokens de acceso", genera un token para la página.
3. O usa un User Access Token con los permisos indicados y obtén el token de página con `GET /me/accounts`.

### Verificar suscripciones

```bash
GET /api/meta-config/suscripciones-pagina?pageId=TU_PAGE_ID&pageAccessToken=TU_TOKEN
```

### Script automático

Con el backend en ejecución y `FACEBOOK_PAGE_ID` y `FACEBOOK_PAGE_ACCESS_TOKEN` en `.env`:

```bash
npm run meta:suscribir
```

**Importante:** `FACEBOOK_PAGE_ID` debe ser el ID de la **Página de Facebook**, no el App ID. Puedes obtenerlo en la configuración de la Página o con `GET https://graph.facebook.com/me/accounts?access_token=TU_TOKEN`.

### ⚠️ Error: "Object with ID '...' does not exist, cannot be loaded due to missing permissions"

Este error suele deberse a uno de estos casos:

| Causa | Solución |
|-------|----------|
| **ID incorrecto** | `FACEBOOK_PAGE_ID` debe ser el **ID de la Página** de Facebook (tu fan page), NO el App ID. Son distintos. |
| **Token incorrecto** | Necesitas un **Page Access Token**, no un User Access Token. Lo generas en Meta Developers → tu App → **Messenger** → **Configuración** → "Tokens de acceso". |
| **Página no conectada** | La Página debe estar **vinculada** a tu App en Messenger. En Meta Developers → Messenger → Configuración → "Agregar o eliminar páginas". |
| **Permisos faltantes** | La app debe tener `pages_manage_metadata` y `pages_messaging`. Si la app está en modo desarrollo, pide esos permisos en Meta Developers → App Review. |

**Cómo obtener el Page ID y Page Access Token correctos:**

1. Ve a [developers.facebook.com](https://developers.facebook.com) → tu **App**.
2. En el menú, **Productos** → **Messenger** → **Configuración**.
3. En "Tokens de acceso", selecciona tu **Página** en el desplegable (no "Generar token de prueba").
4. Genera el token. **Copia ese token** → `FACEBOOK_PAGE_ACCESS_TOKEN`.
5. El **Page ID** aparece en la misma sección o en la URL de la página. Si no lo ves, usa el **Graph API Explorer**:
   - En [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer) selecciona tu App.
   - Pide: `me/accounts?fields=id,name,access_token`.
   - Ejecuta. La respuesta mostrará cada página con su `id` (Page ID) y `access_token` (Page Access Token).

**Diferencias:** App ID = ID de tu app (ej. 123456789). Page ID = ID de tu fan page (otro número). El token que generas desde "Tokens de acceso" en Messenger es el de la página.

**Verificar token y Page ID antes de suscribir:**

```bash
npm run meta:verificar
```

Este script valida tu `FACEBOOK_PAGE_ACCESS_TOKEN` y muestra el Page ID correcto para poner en `.env`.

### Probar el flujo (sin enviar mensaje real desde Facebook)

```bash
npm run meta:test-webhook
```

Este script simula un webhook y debería crear una conversación en Keila IA. Si la ves en la bandeja de entrada, el flujo funciona.

---

## 11. Instagram Direct

Los mensajes de **Instagram Direct** llegan si:

1. La cuenta de Instagram está **vinculada** a la Página de Facebook en Meta Business Suite.
2. El webhook de **Instagram** está configurado en el App Dashboard (producto Instagram → Webhooks).

### Configuración del webhook de Instagram (igual que Facebook)

| Dónde | Valor |
|-------|-------|
| **Callback URL** | `https://TU-URL/api/matrix/webhooks/instagram` |
| **Token de verificación** | `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c` (el mismo que Facebook) |

- Con **ngrok**: `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/matrix/webhooks/instagram`
- Con **Cloudflare**: sustituye `TU-URL` por la URL que muestra cloudflared.
- El **Token de verificación** lo defines tú (no lo da Instagram). Este proyecto usa el mismo que Facebook, configurado en `.env` como `INSTAGRAM_VERIFY_TOKEN`.
- El token largo que da Meta (empieza por `EAA...`) es el **Access Token**, no el de verificación. Ese va en `INSTAGRAM_PAGE_ACCESS_TOKEN` para enviar mensajes por API.

### Prueba manual antes de configurar en Meta

```
https://TU-URL/api/matrix/webhooks/instagram?hub.mode=subscribe&hub.verify_token=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c&hub.challenge=1234567890
```

Debes ver solo `1234567890` en la respuesta.

---

## 12. Mensajes en Keila IA (Matrix)

Los mensajes de Facebook e Instagram se guardan automáticamente en:

- `conversaciones_matrix`: una conversación por canal + `canal_id` (PSID del usuario).
- `mensajes_matrix`: cada mensaje entrante.

El frontend de Matrix (Keila IA) los muestra al hacer GET a `/api/matrix/conversaciones`. También se emite un evento WebSocket `matrix:conversacion:actualizada` cuando llega un mensaje nuevo, para actualizar la lista en tiempo real.

---

## 13. Login OAuth para conectar canales (Catálogo de canales)

Desde el Matrix, al hacer clic en el botón **+** (más) junto a los filtros de canal, se abre el **Catálogo de canales**. Al hacer clic en **Conectar** en Facebook o Instagram, se inicia el flujo OAuth de Meta para autorizar páginas y obtener tokens.

### Configuración requerida

1. **En `.env`** (backend):
   ```env
   META_APP_ID=tu-app-id
   META_APP_SECRET=tu-app-secret
   # URL base pública del backend (ngrok, cloudflare, etc.)
   META_OAUTH_REDIRECT_BASE=https://unoffered-overstrongly-fermin.ngrok-free.dev
   ```

2. **En Meta Developers** → tu App → **Productos** → **Facebook Login** → **Configuración**:
   - **Valid OAuth Redirect URIs**: agrega la URL del callback:
     ```
     https://TU-URL/api/auth/facebook/callback
     ```
   - Ejemplo con ngrok: `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook/callback`

3. **Frontend**: Si usas túnel para el backend, configura `NEXT_PUBLIC_API_URL` con la URL pública para que el botón Conectar redirija correctamente:
   ```env
   NEXT_PUBLIC_API_URL=https://unoffered-overstrongly-fermin.ngrok-free.dev/api
   ```

### Flujo

1. Usuario hace clic en **Conectar** en Facebook o Instagram en el Catálogo de canales.
2. El frontend obtiene la URL OAuth desde `GET /api/auth/facebook/url` (usa `META_OAUTH_REDIRECT_BASE` para ngrok/túneles).
3. Redirige a `GET /api/auth/facebook` → Facebook OAuth.
4. Usuario autoriza la app en Meta.
5. Meta redirige a `GET /api/auth/facebook/callback?code=...`
6. El backend intercambia el código por tokens y muestra una página con el `FACEBOOK_PAGE_ACCESS_TOKEN` para copiar al `.env`.
7. Usuario copia el token en su `.env` y reinicia el backend.
