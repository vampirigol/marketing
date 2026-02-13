# 03 – Automatizaciones y flujos

Este documento describe las **tareas programadas (schedulers)** y las **reglas de automatización** del sistema, para que se entienda qué hace el sistema en segundo plano y bajo qué condiciones.

---

## Parte 1: Schedulers (tareas programadas)

Los schedulers son procesos que se ejecutan solos a intervalos o a una hora fija. El backend los inicia al arrancar.

### 1. WaitListScheduler (lista de espera)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Mueve citas a *lista de espera* cuando el paciente no llega a tiempo. |
| **Cada cuánto** | Cada 15 minutos. |
| **Proceso** | 1) Busca citas Agendadas o Confirmadas cuya hora ya pasó hace más de 15 min. 2) Las cambia a estado *En_Lista_Espera*. 3) Puede notificar al paciente y al contact center. 4) Las deja listas para remarketing. |
| **Configuración típica** | Tolerancia 15 min, notificar paciente y contact center. |

---

### 2. AutoClosureScheduler (cierre del día)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Cierra las listas de espera al final del día y convierte a inasistencias. |
| **Cuándo** | Diario a las 23:00 (configurable). |
| **Proceso** | 1) Toma todas las citas en *En_Lista_Espera* del día. 2) Las marca como inasistencia. 3) Crea registro en inasistencias. 4) Inicia protocolo de 7 días. 5) Puede generar reporte y notificar a gerencia. |

---

### 3. InasistenciaScheduler (protocolo inasistencias)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Ejecuta el protocolo de remarketing de 7 días para quienes no asistieron. |
| **Cuándo** | Protocolo 7 días: diario 00:00. Verificación de próximas: cada 6 h. Remarketing automático: diario 09:00. |
| **Proceso** | Identifica inasistencias por días transcurridos, ejecuta mensajes/recordatorios del protocolo, marca "perdido" tras 7 días sin respuesta, genera alertas. |

---

### 4. ReminderScheduler (recordatorios de citas)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Envía recordatorios automáticos de citas. |
| **Cada cuánto** | Verificación cada minuto. |
| **Proceso** | Confirmación al agendar; recordatorio 24 h antes (ej. 10:00); recordatorio el día de la cita (ej. 2 h antes); verificación 15 min después de la hora. |

---

### 5. TimeZoneScheduler (zonas horarias)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Gestiona zonas horarias de sucursales y sincroniza horarios. |
| **Cuándo** | Verificación cada 6 h; sincronización diaria 00:00. |
| **Proceso** | Verifica zonas, detecta DST, valida horarios de operación, sincroniza entre sucursales. |

---

### 6. CalendarioRecordatorioScheduler

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Recordatorios para eventos de calendario (según configuración). |
| **Cada cuánto** | Cada minuto. |

---

### 7. CitasRecordatorioScheduler

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Envía recordatorios programados de citas (tabla recordatorios_citas). |
| **Cada cuánto** | Cada minuto. |

---

### 8. ExpiracionOpenTicketsScheduler

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Cierra o expira open tickets que llevan demasiado tiempo abiertos. |
| **Cuándo** | Diario (ej. 00:01). |

---

### 9. MarkNoShowsScheduler (No Confirmado → No Asistió)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Marca como *No Asistió* a los leads con cita ya pasada que no fueron confirmadas y los añade a la lista de recuperación. |
| **Cada cuánto** | Cada hora. |
| **Proceso** | 1) Busca citas con `date < hoy` y `status = UNCONFIRMED`. 2) Para cada cita, actualiza el estado del lead a NO_SHOW. 3) Añade el lead a la lista de recuperación. 4) En el Kanban el lead aparece en la columna "No Asistió". Recepción puede usar la Lista de Recuperación para reagendar. |

---

### 10. AutomationScheduler (reglas de automatización)

| Aspecto | Detalle |
|---------|---------|
| **Qué hace** | Evalúa y ejecuta las reglas de automatización (ver lista más abajo). |
| **Cada cuánto** | Cada minuto. |
| **Proceso** | Lee reglas activas, evalúa condiciones sobre leads/citas, ejecuta acciones (asignar, etiquetar, notificar, cambiar estado, etc.). |

---

## Parte 2: Reglas de automatización (resumen)

Las reglas se guardan en el sistema (ej. desde Configuración o seed inicial). Cada regla tiene **condiciones** (cuándo se dispara) y **acciones** (qué hace). Resumen de las reglas típicas del sistema:

| # | Nombre | Cuándo se dispara | Qué hace |
|---|--------|--------------------|----------|
| 1 | Lead nuevo → Contacto inicial | Estado *new*, mensajería dentro de 7 días | Asigna asesor, etiqueta "Lead", notifica SLA 2 h |
| 2 | Prospecto sin respuesta 24 h | Prospecto, >24 h en estado, mensajería 7 días | Notifica reintento, etiqueta "Reintento" |
| 3 | Cita pendiente → Confirmación | Cita pendiente, mensajería 7 días | Notifica confirmación, etiqueta "Confirmación" |
| 4 | Confirmación 24 h antes | Confirmada, >24 h en estado | Envía recordatorio 24 h |
| 5 | Recordatorio día de la cita | Confirmada, mensajería 7 días | Recordatorio mismo día |
| 6 | No show (15 min) | Confirmada, >1 h (demo), mensajería 7 días | Mueve a cierre, etiqueta "No show", notifica |
| 7 | Inasistencia → 7 días seguimiento | Etiqueta "No show", >7 días | Etiqueta "Perdido", notifica cierre |
| 8 | Cita atendida → subsecuente | Estado cierre (qualified) | Etiqueta "Atendida", notifica sugerir subsecuente |
| 9 | Segmentación automática | Etiqueta "Atendida" | Etiqueta "Atendido 1 vez" (segmento) |
| 10 | Lead sin cita 14 días | Prospecto, >14 días, mensajería 7 días | Etiqueta "Remarketing", notifica campaña |
| 11 | SLA vencido por etapa | Tiempo en estado > SLA (ej. 6 h) | Notifica supervisor, reasigna |
| 12 | Reasignación inteligente | >6 h sin respuesta | Reasigna asesor, notifica |
| 13 | Bloqueo conversación 7 días | Canal redes sociales, >7 días sin respuesta | Bloquea conversación |

*(La lista exacta puede variar según la configuración de tu instancia; en Configuración > Automatizaciones se pueden ver y editar.)*

---

## Parte 3: Encuesta de calidad post-venta

Cuando un lead pasa a **Pagado/Cerrado ganado** (CLOSED_WON o PAYMENT_RECEIVED), el sistema dispara automáticamente el envío de la **encuesta de calidad**:

| Aspecto | Detalle |
|---------|---------|
| **Disparador** | Al actualizar el estado del lead a CLOSED_WON o PAYMENT_RECEIVED (en el servicio de actualización de estado). |
| **Qué hace** | SurveyService verifica el canal activo (WhatsApp o Instagram), selecciona la plantilla `encuesta_calidad_v1` (es_MX) y envía el mensaje con el link al formulario por ese canal. |
| **Configuración** | La plantilla debe estar aprobada en Meta (WhatsApp/Instagram) y el link del formulario configurado en el sistema. |

---

## Qué significa para el usuario

- **Recepción / Citas:** Los recordatorios (24 h y día de cita) se envían solos; la lista de espera y el cierre del día también son automáticos.
- **CRM / Keila IA:** Las reglas asignan leads, etiquetan, notifican SLA y reasignan; el protocolo de inasistencias y el remarketing se ejecutan por schedulers.
- **Configuración:** Desde ahí se activan/desactivan reglas y se ajustan condiciones y acciones (si el perfil lo permite).

Para los flujos completos de negocio (cita de punta a punta, lead a cita, inasistencia y 7 días), ver [04 - Procesos de negocio](04-PROCESOS-DE-NEGOCIO.md).
