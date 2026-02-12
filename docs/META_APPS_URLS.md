# URLs para configurar en Meta Developers (Facebook / Instagram)

Usa estas URLs exactas en tu App de Meta cuando tu backend esté expuesto con ngrok.

## Base URL (ngrok)

```
https://unoffered-overstrongly-fermin.ngrok-free.dev
```

## Variables de entorno (.env)

```env
# Backend - URL base para OAuth y webhooks
META_OAUTH_REDIRECT_BASE=https://unoffered-overstrongly-fermin.ngrok-free.dev
```

```env
# Frontend (frontend/.env.local) - opcional cuando usas ngrok
NEXT_PUBLIC_API_URL=https://unoffered-overstrongly-fermin.ngrok-free.dev/api
NEXT_PUBLIC_WEBSOCKET_URL=https://unoffered-overstrongly-fermin.ngrok-free.dev
```

---

## 1. Facebook Login (OAuth)

**Configuración:** Meta Developers → Productos → Facebook Login → Configurar

| Campo | Valor |
|-------|-------|
| **Valid OAuth Redirect URIs** | `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook/callback` |
| **URI de redireccionamiento para comprobar** | `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook/callback` |

---

## 2. Webhook unificado (Facebook Messenger + Instagram)

**Configuración:** Meta Developers → Productos → Messenger / Instagram → Configuración → Webhooks

| Campo | Valor |
|-------|-------|
| **URL de devolución de llamada** | `https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger` |
| **Token de verificación** | `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c` |

Esta URL recibe mensajes de **Facebook Messenger** e **Instagram** en un solo endpoint.

---

## 3. Rutas alternativas (Matrix)

Si prefieres usar rutas separadas:
- Facebook: `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/matrix/webhooks/facebook`
- Instagram: `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/matrix/webhooks/instagram`

---

## 4. Instagram OAuth

Facebook e Instagram usan el **mismo flujo OAuth** de Meta. La URL de callback es la misma que Facebook Login:

```
https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook/callback
```

No necesitas configurar una URL adicional para Instagram en Facebook Login.

---

## Resumen rápido

| Producto | URL completa |
|----------|--------------|
| OAuth callback (Facebook + Instagram) | `https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook/callback` |
| **Webhook Messenger + Instagram** | `https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger` |

---

## Probar las URLs

```bash
# OAuth callback (debe devolver HTML o redirección)
curl -I "https://unoffered-overstrongly-fermin.ngrok-free.dev/api/auth/facebook"

# Webhook Messenger (debe devolver el challenge)
curl "https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger?hub.mode=subscribe&hub.verify_token=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c&hub.challenge=test123"
```
