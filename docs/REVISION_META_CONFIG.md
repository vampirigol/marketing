# Revisión de configuración Meta (Facebook / Instagram)

Basado en las capturas de pantalla de Meta Developers y el `.env` del proyecto.

---

## ✅ Lo que está correcto

| Elemento | Estado |
|----------|--------|
| **App ID** | 1559338168608938 ✓ |
| **App Secret** | 6062acd6e388178fb05a016d4af5ab35 ✓ |
| **Facebook Page ID** | 622745130911420 ✓ |
| **Instagram Business Account ID** | 17841472278727563 ✓ |
| **Webhook URL** | `https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger` ✓ |
| **Token de verificación** | `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c` ✓ |
| **Variables en .env** | Configuradas correctamente ✓ |

---

## ❌ Acciones pendientes en Meta Developers

### 1. Generar token de acceso para la página (CRÍTICO)

En **Tokens de acceso**, la página "Red de Clínicas Adventistas" (622745130911420) muestra **"-"** en la columna Tokens.

**Qué hacer:**
1. Entra en **Productos** → **Messenger** → **Configuración**.
2. En la sección **Tokens de acceso** → **Páginas**.
3. Haz clic en **Generar token** junto a "Red de Clínicas Adventistas".
4. Copia el token generado.
5. Actualiza `FACEBOOK_PAGE_ACCESS_TOKEN` en tu `.env` con ese token.
6. Repite para Instagram si aparece en la misma sección (o usa el token de la página si IG está vinculado).

---

### 2. Suscribir campos del webhook (CRÍTICO)

La página muestra **"0 campos"** suscritos para webhooks. Sin esto, Meta no envía mensajes a tu backend.

**Qué hacer:**
1. En la sección **Webhooks** → **Páginas**.
2. Haz clic en **Suscribirte** (o "Editar suscripciones").
3. Selecciona al menos:
   - `messages` (mensajes entrantes)
   - `messaging_postbacks` (respuestas a botones)
   - `message_deliveries` (confirmaciones de entrega)
   - `message_reads` (confirmaciones de lectura)
   - `messaging_seen` (para Instagram)
4. Guarda los cambios.

---

### 3. Verificar y guardar el webhook

Si aún no lo has hecho:
1. Comprueba que la **URL de devolución de llamada** sea exactamente:  
   `https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger`
2. Verifica que el **Token de verificación** sea:  
   `rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c`
3. Haz clic en **Verificar y guardar**.

---

### 4. Revisión de la app (pages_messaging)

Para uso en producción con usuarios reales, hay que:
1. Completar el proceso de **Revisión de apps**.
2. Solicitar el permiso **`pages_messaging`**.
3. Pulsar **Solicitar permiso** en la sección correspondiente.

En **modo desarrollo**, la app puede funcionar con usuarios de prueba sin completar la revisión.

---

## 🔧 Problema local: puerto 3001 en uso

El terminal muestra `EADDRINUSE` en el puerto 3001: otro proceso está usando ese puerto.

**Solución:**
```bash
# Liberar el puerto 3001
lsof -ti:3001 | xargs kill -9

# Reiniciar el backend
npm run dev
```

---

## Resumen de pasos

1. Generar token de acceso para la página "Red de Clínicas Adventistas".
2. Actualizar `FACEBOOK_PAGE_ACCESS_TOKEN` en `.env` con el nuevo token.
3. Suscribir campos del webhook (messages, messaging_postbacks, etc.).
4. Hacer clic en "Verificar y guardar" en la configuración del webhook.
5. Liberar el puerto 3001 y reiniciar el backend.
6. Comprobar que ngrok esté activo apuntando al puerto 3001.
7. Probar el webhook con:
   ```bash
   curl "https://unoffered-overstrongly-fermin.ngrok-free.dev/webhooks/messenger?hub.mode=subscribe&hub.verify_token=rca-fb-verify-8f3a2c9e1d4b7f6e5a0c8d2b1e9f4a7c&hub.challenge=test123"
   ```
   La respuesta debe ser: `test123`
