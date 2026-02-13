# Lista de errores en el sistema CRM RCA

Documento generado a partir de la verificación de TypeScript (`tsc --noEmit`) y ESLint en backend y frontend.

---

## 1. Errores de compilación TypeScript — Backend (24 errores)

### `src/api/controllers/WebhookController.ts`
| Línea | Error |
|-------|--------|
| 14, 35 | **Duplicate identifier**: `Request`, `Response`, `crypto` (identificadores duplicados, probablemente conflicto con tipos globales o re-declaración) |
| 65 | **Property 'rawBody' does not exist on type 'Request'** — Express Request no tiene `rawBody` por defecto |
| 135 | **Property 'instance' is private** — Acceso a `Database.instance` (privado) |
| 135 | **Constructor of 'Database' is private** — Uso incorrecto del singleton |
| 300 | **Property 'citaRespuestaService' does not exist on type 'WebhookController'** |
| 302 | **Property 'whatsappService' does not exist on type 'WebhookController'** |
| 329, 368 | **Property 'sender' does not exist on type 'MetaMessagingEvent'** |
| 330, 369 | **Property 'message' does not exist on type 'MetaMessagingEvent'** |
| 337, 376 | **Property 'conversacionRepo' does not exist on type 'WebhookController'** |
| 406 | **Cannot find name 'MetaStatusEvent'** — Tipo no definido o no importado |
| 435 | **Expected 1 arguments, but got 0** — Llamada a función con argumentos incorrectos |

### `src/api/routes/webhooks.ts`
| Línea | Error |
|-------|--------|
| 33, 56, 79 | **Property 'verificarWebhook' does not exist on type 'WebhookController'. Did you mean 'verifyWebhook'?** — Nombre en español vs inglés |
| 44 | **Property 'recibirWebhookWhatsApp' does not exist on type 'WebhookController'** |

---

## 2. Errores de compilación TypeScript — Frontend (17 errores)

### Servicio de citas — métodos inexistentes en `citas.service`
Varias páginas llaman métodos que **no existen** en `frontend/lib/citas.service.ts`:

| Archivo | Línea | Método inexistente |
|---------|--------|---------------------|
| `app/calendario/page.tsx` | 105 | `obtenerPorRango` |
| `app/citas/page.tsx` | 269 | `obtenerPorRango` |
| `app/confirmar-cita/page.tsx` | 36 | `confirmarPorToken` |
| `app/crm/page.tsx` | 174 | `marcarNoAsistencia` |
| `app/crm/page.tsx` | 369 | `enviarRecordatorio` |
| `app/reservar/page.tsx` | 72 | `crearCitaPublica` |
| `app/reservar/page.tsx` | 97 | `crearSolicitudListaEspera` |
| `app/reservar/page.tsx` | 187 | `reservarSlot` |

### Otros errores frontend
| Archivo | Línea | Error |
|---------|--------|--------|
| `app/citas/page.tsx` | 418 | `string \| undefined` no asignable a `string` |
| `app/confirmar-cita/page.tsx` | 37 | Parámetro `data` con tipo `any` implícito |
| `app/matrix/chat/page.tsx` | 194 | Props faltantes: `onBack`, `onCambiarPrioridad`, `onAgregarEtiqueta`, `onQuitarEtiqueta` y 2 más |
| `app/matrix/chat/page.tsx` | 203 | Prop `esPropio` no existe en el tipo `Props` |
| `app/matrix/chat/page.tsx` | 211 | Prop `mostrarPlantillas` no existe en el tipo |
| `app/matrix/page.tsx` | 413 | Tipo de retorno: se espera `{ leads, hasMore, total }` pero se devuelve `Lead[]` |
| `components/citas/DisponibilidadForm.tsx` | 52 | Prop `doctorNombre` no existe en el tipo de parámetros de disponibilidad |
| `components/matrix/ConversionModal.tsx` | 161 | Prop `doctorNombre` no existe en el tipo |
| `components/matrix/ConversionModal.tsx` | 193 | Parámetro `c` con tipo `any` implícito |

---

## 3. Errores ESLint — Backend (14 errores)

| Archivo | Línea | Regla | Descripción |
|---------|--------|--------|-------------|
| `src/api/controllers/MatrixController.ts` | 83, 108 | `@typescript-eslint/no-var-requires` | Uso de `require()` en lugar de `import` |
| `src/api/controllers/WebhookController.ts` | 16–18 | `no-unused-vars` | Imports no usados: `CitaRespuestaWhatsAppService`, `WhatsAppService`, `ConversacionRepositoryPostgres` |
| `src/api/controllers/WebhookController.ts` | 74 | `prefer-const` | `mensaje` no se reasigna; usar `const` |
| `src/api/controllers/WebhookController.ts` | 267, 276 | `no-empty` | Bloque vacío (catch/else) |
| `src/api/middleware/auth.ts` | 12 | `@typescript-eslint/no-namespace` | Uso de namespace en lugar de módulo ES |
| `src/core/entities/UsuarioSistema.ts` | 139 | `no-unused-vars` | `password` asignado pero no usado |
| `src/core/use-cases/AutenticarUsuario.ts` | 175 | `no-unused-vars` | Parámetro `creadoPor` no usado (debe coincidir con `/^_/u` si es intencional) |
| `src/index.ts` | 22 | `no-unused-vars` | `initializeWebSocket` definido pero no usado |
| `src/infrastructure/automation/AutomationEngine.ts` | 40 | `no-unused-vars` | Parámetro `regla` no usado |
| `src/infrastructure/database/repositories/BrigadaRegistroRepository.ts` | 68 | `no-unused-vars` | `_esMarcado` definido pero no usado |

---

## 4. Advertencias ESLint — Backend (143 warnings)

- **@typescript-eslint/no-explicit-any**: uso de `any` en muchos controladores, repositorios, servicios y use cases. Archivos más afectados: `CitaController`, `BrigadaController`, `HistorialClinicoController`, `ContactoController`, `CitaRepository`, `ImportExportService`, `NotificationService`, etc.

---

## 5. Advertencias ESLint — Frontend (6 warnings)

- **@next/next/no-img-element**: uso de `<img>` en lugar de `<Image />` de Next.js en:
  - `app/perfil/page.tsx` (137)
  - `components/expediente/ExpedienteDigitalModal.tsx` (172)
  - `components/layout/Sidebar.tsx` (237)
  - `components/layout/TopBar.tsx` (169)
  - `components/matrix/ConversationView.tsx` (84)
  - `components/matrix/MatrixInbox.tsx` (411)

---

## Resumen por prioridad

| Prioridad | Tipo | Cantidad | Acción sugerida |
|-----------|------|----------|------------------|
| **Alta** | TS Backend (WebhookController + webhooks) | 24 | Corregir para que el backend compile y los webhooks funcionen |
| **Alta** | TS Frontend (citas.service + matrix) | 17 | Añadir métodos al servicio o ajustar páginas; alinear tipos en Matrix |
| **Media** | ESLint errors backend | 14 | Eliminar unused vars, prefer-const, no-empty, namespace → módulo |
| **Baja** | ESLint warnings (any, img) | 149+ | Ir tipando y sustituyendo `<img>` por `<Image />` |

---

## Nota sobre el servicio de citas (frontend)

El archivo `frontend/lib/citas.service.ts` no define:

- `obtenerPorRango`
- `confirmarPorToken`
- `marcarNoAsistencia`
- `enviarRecordatorio`
- `crearCitaPublica`
- `crearSolicitudListaEspera`
- `reservarSlot`

Hay que **implementarlos** en el servicio (llamando al backend correspondiente) y **exponer** los endpoints en el backend si no existen, o **dejar de usarlos** en las páginas si la funcionalidad se ha movido a otra API.
