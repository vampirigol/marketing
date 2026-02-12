# Qué falta de integración

Resumen de lo que aún falta para que todo el flujo de agendamiento y notificaciones funcione de punta a punta en entorno real.

---

## 1. WhatsApp Business API (envío real de mensajes)

**Estado:** El código llama a `NotificationService` y `WhatsAppService`, pero sin credenciales los mensajes solo se **simulan** en consola.

**Falta:**

| Paso | Acción |
|------|--------|
| 1 | En `.env` configurar: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `META_APP_ID`, `META_APP_SECRET` (ver `docs/CONFIGURACION_NOTIFICACIONES.md`) |
| 2 | Crear app en Meta Developers, agregar producto WhatsApp, verificar número y generar token permanente |
| 3 | (Opcional) Agregar números de prueba en Meta para poder enviar a teléfonos reales |

Sin esto: confirmaciones y recordatorios no se envían por WhatsApp; solo se registran en BD y se simulan en logs.

---

## 2. Webhook de WhatsApp (respuestas SI/NO del paciente)

**Estado:** `CitaRespuestaWhatsAppService` y `WebhookController` ya procesan respuestas SI/NO.

**Falta:**

| Paso | Acción |
|------|--------|
| 1 | En Meta Developers → WhatsApp → Webhooks: configurar **URL de devolución de llamada** (en producción: `https://tu-dominio.com/api/webhooks/whatsapp`) |
| 2 | En desarrollo: exponer el backend con **ngrok** y usar esa URL en el webhook |
| 3 | Definir y guardar en `.env` el **Token de verificación** (`WHATSAPP_VERIFY_TOKEN`) e indicarlo en la configuración del webhook |
| 4 | Suscribir el webhook a: `messages`, `message_status`, `account_alerts` |

Sin esto: el paciente no puede confirmar/cancelar respondiendo al mensaje; solo puede usar el enlace de confirmación (si se incluye en el mensaje).

---

## 3. Enlace de confirmación en mensajes

**Estado:** Existe `GET /api/citas/confirmar/:token` y la cita tiene `tokenConfirmacion`. El frontend tiene ruta `/confirmar-cita`.

**Falta:**

- Incluir en el texto de **confirmación de cita** y en **recordatorios** la URL para confirmar con un clic, por ejemplo:  
  `Confirmar asistencia: https://tu-dominio.com/confirmar-cita?token=XXX`  
- Pasar `tokenConfirmacion` (y base URL) al armar el mensaje en `NotificationService` / `WhatsAppService` (o en plantillas) y usarlos en el cuerpo del mensaje.

Sin esto: el paciente puede confirmar solo respondiendo SI/NO por WhatsApp (si el webhook está configurado) o por otro canal; no tiene un enlace directo en el mensaje.

---

## 4. Frontend – Reporte de ocupación con API real

**Estado:** Existe el endpoint `GET /api/citas/stats/ocupacion` (datos reales por sucursal/doctor/fecha y por hora). El componente `ReportesOcupacion.tsx` usa **datos locales** (citas en memoria y `doctores-data` / `horarios-data`).

**Falta:**

- En `ReportesOcupacion` (o en la página que lo use): llamar a `GET /api/citas/stats/ocupacion` con `sucursalId`, `fechaInicio`, `fechaFin`, `medicoAsignado` según filtros del usuario.
- Sustituir o complementar la lógica actual de ocupación con la respuesta de ese endpoint.

Sin esto: el reporte de ocupación no refleja los mismos datos que el backend/BD.

---

## 5. Buffer configurable por especialidad

**Estado:** Existe la columna `buffer_minutos` en `config_consultas` (migración 029). En el controlador de disponibilidad se usa un buffer **fijo de 5 minutos**.

**Falta (opcional):**

- Al calcular disponibilidad, leer `buffer_minutos` desde `ConfigConsultasRepository` (por especialidad/tipo de consulta o por defecto) y usarlo en lugar del 5 fijo.

Sin esto: el buffer sigue siendo 5 min para todos los casos; no se usa la config por especialidad.

---

## 6. No implementado (fuera del alcance actual)

| Integración | Estado | Nota |
|-------------|--------|------|
| **Google Calendar / Outlook** | No implementado | Sincronización bidireccional de citas con calendarios externos |
| **Overbooking inteligente** | No implementado | Modelo predictivo de no-show; hoy solo capacidad fija por slot |
| **Email/SMS** | Parcial | Estructura lista; falta configurar SMTP/SMS y usarlos en recordatorios |

---

## Resumen rápido

| # | Integración | Prioridad | Esfuerzo |
|---|-------------|-----------|----------|
| 1 | Credenciales WhatsApp en `.env` y verificación de envío | Alta | Bajo (config) |
| 2 | Webhook WhatsApp (URL + verify token + suscripciones) | Alta | Bajo (config + ngrok en dev) |
| 3 | Incluir enlace de confirmación en mensajes | Media | Bajo (código) |
| 4 | Reporte ocupación frontend → API `/stats/ocupacion` | Media | Bajo (código) |
| 5 | Buffer desde `config_consultas` | Baja | Bajo (código) |

Con 1 y 2 resueltos, confirmaciones, recordatorios y respuestas SI/NO por WhatsApp funcionan de extremo a extremo en entorno real.
