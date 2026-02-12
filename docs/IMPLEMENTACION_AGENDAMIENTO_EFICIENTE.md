# Implementación: Agendamiento Eficiente con Datos Reales

**Fecha:** 10 de febrero de 2026  
**Estado:** Completado

---

## Resumen

Se implementaron todas las prioridades (Alta, Media, Baja) del análisis de agendamiento eficiente, usando **datos reales** de la base de datos, sin mocks ni datos de demostración.

---

## Prioridad ALTA

### 1. Recordatorios persistentes

- **Migración:** `027_create_recordatorios_citas.sql` – tabla `recordatorios_citas`
- **Repositorio:** `RecordatoriosCitasRepository`
- **Scheduler:** `CitasRecordatorioScheduler` – ejecuta cada minuto, lee de BD y envía vía WhatsApp
- **Integración:** Al crear/reagendar cita se insertan recordatorios 24h y 2h antes
- **Cancelación:** Al cancelar cita se eliminan recordatorios pendientes
- **Datos:** Pacientes y citas se obtienen desde la BD

### 2. Integración WhatsApp

- **Crear cita:** Envío de confirmación automática con `NotificationService.enviarConfirmacionCita`
- **Recordatorios:** Ejecutados por `CitasRecordatorioScheduler` usando plantillas existentes
- **Datos:** Paciente real, sucursal real, nombre doctor real

### 3. Slot holding

- **Migración:** `028_create_slots_reservados_temporal.sql` – tabla `slots_reservados_temporal`
- **Repositorio:** `SlotsReservadosRepository` – reservar, liberar, contar reservados, limpiar expirados
- **Endpoint:** `POST /api/citas/publica/reservar-slot` (público)
- **Frontend:** Página `/reservar` reserva slot al elegir hora; envía `sessionId` al confirmar cita
- **Duración:** 10 minutos por reserva

### 4. Validación por duración y solapamiento

- **CitaRepository.verificarDisponibilidad:** Acepta `duracionMinutos`, `bufferMinutos`, `capacidad`
- **Lógica:** Cuenta citas que se solapan considerando duración + buffer
- **Disponibilidad:** `contarCitasSolapadas` considera duración de cada cita existente
- **Slots:** Se restan los slots temporalmente reservados de la capacidad

---

## Prioridad MEDIA

### 5. Portal de reserva 24/7

- **Ruta:** `/reservar` – usa API pública real
- **Flujo:** Sucursal → Fecha → Disponibilidad real → Slot holding al elegir hora → Datos paciente → Crear cita
- **Lista de espera:** Si no hay disponibilidad, opción de registrarse

### 6. Buffer entre citas

- **Migración:** `029_add_buffer_config_consultas.sql` – columna `buffer_minutos` (default 5)
- **Uso:** Buffer de 5 min en validación de solapamiento y cálculo de disponibilidad

### 7. Respuesta del paciente desde WhatsApp

- **Servicio:** `CitaRespuestaWhatsAppService` – procesa SI/NO/SÍ/CONFIRMO/CANCELAR
- **Webhook:** `WebhookController.procesarMensajeWhatsApp` llama al servicio
- **Flujo:** Paciente responde → busca por teléfono → localiza próxima cita → confirma o cancela → envía respuesta por WhatsApp
- **Datos:** Pacientes y citas desde BD; normalización de teléfono (código México, etc.)

---

## Prioridad BAJA

### 8. Analytics de ocupación

- **Endpoint:** `GET /api/citas/stats/ocupacion`
- **Query:** `sucursalId`, `fechaInicio`, `fechaFin`, `medicoAsignado`
- **Respuesta:** Resumen por sucursal/doctor/fecha (total, atendidas, pendientes) y distribución por hora
- **Datos:** Consulta directa a la tabla `citas`

---

## Migraciones

Ejecutar (incluido en `ensureCitasConfirmacionListaEspera` al iniciar el servidor):

1. `027_create_recordatorios_citas.sql`
2. `028_create_slots_reservados_temporal.sql`
3. `029_add_buffer_config_consultas.sql`

---

## Endpoints nuevos

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/citas/publica/reservar-slot` | Público | Reserva temporal de slot |
| GET | `/api/citas/stats/ocupacion` | Privado (auth) | Analytics de ocupación |

---

## Archivos creados/modificados

**Nuevos:**
- `src/infrastructure/database/migrations/027_create_recordatorios_citas.sql`
- `src/infrastructure/database/migrations/028_create_slots_reservados_temporal.sql`
- `src/infrastructure/database/migrations/029_add_buffer_config_consultas.sql`
- `src/infrastructure/database/repositories/RecordatoriosCitasRepository.ts`
- `src/infrastructure/database/repositories/SlotsReservadosRepository.ts`
- `src/infrastructure/scheduling/CitasRecordatorioScheduler.ts`
- `src/infrastructure/citas/CitaRespuestaWhatsAppService.ts`

**Modificados:**
- `src/api/controllers/CitaController.ts` – integración recordatorios, slot holding, validación duración, ocupación
- `src/api/routes/citas.ts` – rutas reservar-slot y stats/ocupacion
- `src/infrastructure/database/repositories/CitaRepository.ts` – `verificarDisponibilidad` con solapamiento
- `src/infrastructure/scheduling/SchedulerManager.ts` – registro `CitasRecordatorioScheduler`
- `src/infrastructure/database/runMigrationCitas.ts` – migraciones 027–029
- `src/api/controllers/WebhookController.ts` – procesamiento de respuestas SI/NO
- `frontend/app/reservar/page.tsx` – slot holding en flujo de reserva
- `frontend/lib/citas.service.ts` – `reservarSlot`, `sessionId` en `crearCitaPublica`
