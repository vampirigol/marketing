# Análisis Exhaustivo: Sistema de Citas Médicas y Agendamiento Eficiente

**Fecha:** 10 de febrero de 2026  
**Objetivo:** Investigación sobre mejores prácticas en sistemas de citas médicas y análisis del sistema RCA actual, con recomendaciones para implementar un agendamiento más eficiente.

---

## PARTE 1: INVESTIGACIÓN – MEJORES PRÁCTICAS EN SISTEMAS DE CITAS MÉDICAS

### 1.1 Estrategias Clave de la Industria (2024-2025)

| Estrategia | Impacto | Fuentes |
|------------|---------|---------|
| **Agendamiento 24/7** | Aumento de ingresos 30-45% al permitir reservas en cualquier momento | Keironsalud, Doctoralia PRO |
| **Recordatorios automáticos (SMS/WhatsApp/Email)** | Reducción de ausencias 40-65%, ahorro 2-5 h/semana en tareas manuales | Recordarapp, Doctoralia PRO |
| **Confirmación automática con respuesta del paciente** | ~39% de confirmaciones hechas por el paciente desde el mensaje | Doctoralia PRO |
| **Reserva online / autoservicio** | Menos llamadas, menos errores administrativos, mayor satisfacción | Trabem, RCSanitaria |
| **Prevención de doble reserva** | Invariante: (recurso, rango_tiempo) = máximo 1 reserva confirmada | Medium/Airbnb/Calendly |
| **Slot holding temporal** | Bloqueo del slot mientras el paciente completa el checkout | Schedise, Easy Appointment |
| **Overbooking inteligente** | Modelos predictivos de no-show para optimizar ocupación | Springer, AJMC |

### 1.2 Reducción de No-Show y Absentismo

- **Machine Learning / Analytics predictivos**: predecir probabilidad de no-show por paciente y por slot.
- **Técnicas de scheduling**:
  - Pacientes con mayor probabilidad de asistir en slots de mismo día.
  - Pacientes con mayor riesgo de no-show en días futuros.
  - Overbooking marginal según probabilidades (evitando sobrecarga).
- **Resultados típicos**: mejora de ocupación, reducción de tiempo ocioso, mayor número de pacientes atendidos.

### 1.3 Gestión de Slots y Prevención de Conflictos

- **Fuente única de verdad**: un solo sistema (o sincronización en tiempo real) para calendarios.
- **Detección de conflictos en tiempo real** antes de confirmar la reserva.
- **Remoción inmediata del slot** cuando se reserva; si el recurso es compartido, bloqueo en todos los calendarios.
- **Integración con calendarios**: Google Calendar, Outlook, Apple Calendar para evitar entradas manuales desincronizadas.

### 1.4 Recordatorios y Confirmación

- **Momentos típicos**: 24-48 h antes, día de la cita (2-3 h antes).
- **Contenido recomendado**: fecha, hora, sucursal, instrucciones de preparación, enlace de videoconsulta si aplica.
- **Acciones desde el mensaje**: confirmar, cancelar, reprogramar (reduce fricción).
- **Mensajes personalizables** según tipo de cita y especialidad.

### 1.5 Otras Mejoras Identificadas

- **Triage y segmentación**: citas urgentes vs. programadas, tiempos de consulta variables.
- **Telemedicina**: integración de videoconsultas en el flujo de agendamiento.
- **Buffer entre citas**: tiempo de transición para evitar retrasos en cascada.
- **Análisis de datos**: KPIs de ocupación, no-show, tiempos de espera para mejora continua.

---

## PARTE 2: ANÁLISIS DEL SISTEMA RCA ACTUAL

### 2.1 Lo que ya está implementado

| Componente | Estado | Detalle |
|------------|--------|---------|
| Agenda día/semana/mes | ✅ | Carga desde BD, filtros sucursal/doctor, parseo de fechas en local |
| Vista Lista paginada | ✅ | Backend real con filtros (estado, médico, sucursal, rango, búsqueda) |
| Crear cita | ✅ | Catálogo real, disponibilidad real, validación de bloqueos |
| Verificación disponibilidad | ✅ | `verificarDisponibilidad` previo a crear/reagendar |
| Bloqueos de doctor | ✅ | `BloqueoDoctorRepository`, considerados en disponibilidad |
| Lista de espera | ✅ | Crear solicitud, asignar cita |
| Confirmación por token | ✅ | Enlace público `confirmarPorToken` |
| Plantillas de mensajes | ✅ | `nueva_cita`, `confirmacion_cita`, `recordatorio_cita`, `aviso_retraso` |
| ReminderScheduler | ✅ | Recordatorios 24h y día de cita (en memoria) |
| KPI y alertas | ✅ | Tasas confirmación/asistencia/no-show, pendientes, riesgo |
| Reagendar con regla promoción | ✅ | Límite de reagendaciones para mantener promoción |
| Disponibilidad pública | ✅ | Para formularios de reserva sin auth |

### 2.2 Lo que falta o está parcialmente implementado

| Área | Estado | Brecha |
|------|--------|--------|
| Recordatorios persistentes | ⚠️ | ReminderScheduler en memoria; no persiste entre reinicios. CrearCita indica "programar recordatorios" pero no invoca servicio real de notificaciones |
| Integración WhatsApp/Email | ⚠️ | Plantillas existen; falta integración efectiva con WhatsApp Business API para enviar en creación/recordatorio |
| Slot holding | ❌ | No hay bloqueo temporal del slot durante el flujo de reserva |
| Overbooking inteligente | ❌ | No hay modelo predictivo de no-show; solo capacidad fija por slot |
| Reserva 24/7 autoservicio | ⚠️ | Existe `crearCitaPublica` y disponibilidad pública; falta portal dedicado y UX de autoservicio |
| Sincronización calendarios | ❌ | No hay integración con Google/Outlook |
| Buffer entre citas | ⚠️ | `duracionMinutos` por cita existe; no hay buffer explícito ni validación de solapamiento por duración |
| Validación solapamiento por duración | ⚠️ | Disponibilidad usa slots fijos (intervalo). No valida solapamiento si `duracionMinutos` > intervalo |
| Recordatorios para CITAS (vs. calendario) | ⚠️ | CalendarioRecordatorioScheduler es para eventos; ReminderScheduler es para citas pero no está conectado al flujo de CrearCita |
| Respuesta del paciente desde mensaje | ❌ | Confirmar por enlace sí existe; cancelar/reagendar desde WhatsApp no está automatizado |

---

## PARTE 3: RECOMENDACIONES DE IMPLEMENTACIÓN

### 3.1 Prioridad ALTA – Alto impacto, esfuerzo moderado

#### A. Recordatorios persistentes para citas

- **Problema:** ReminderScheduler en memoria se pierde al reiniciar.
- **Solución:**
  - Crear tabla `recordatorios_citas` (cita_id, tipo, fecha_ejecucion, ejecutado, canal).
  - Job cron que consulte pendientes y ejecute (WhatsApp/Email/SMS según plantillas).
  - Invocar desde `CrearCita` al crear la cita y desde `Reagendar` al cambiar fecha.
  - Al cancelar, marcar recordatorios como cancelados.

#### B. Integración efectiva WhatsApp para confirmaciones y recordatorios

- **Problema:** Plantillas existen pero el flujo no las usa de forma automatizada.
- **Solución:**
  - Conectar `CrearCita` con `NotificationService` para enviar plantilla `nueva_cita` tras crear.
  - Conectar recordatorios con plantilla `recordatorio_cita` vía WhatsApp Business API.
  - Usar `tokenConfirmacion` en el mensaje para enlace de confirmación.

#### C. Slot holding (bloqueo temporal)

- **Problema:** Dos usuarios pueden elegir el mismo slot simultáneamente.
- **Solución:**
  - Tabla `slots_reservados_temporal` (sucursal_id, fecha, hora, medico_id, session_id, expira_en).
  - Al seleccionar slot: INSERT con expiración 5-10 min.
  - Al crear cita: verificar que el slot sigue reservado para esa sesión y liberar.
  - Job que borre registros expirados.

#### D. Validación de solapamiento por duración

- **Problema:** Si una cita dura 45 min y otra comienza 30 min después, puede haber solapamiento.
- **Solución:**
  - En `verificarDisponibilidad` y en `obtenerDisponibilidad`: considerar `duracionMinutos` de cada cita existente y no ofrecer slots que se solapen.
  - Ejemplo: cita 10:00, 45 min → bloquea hasta 10:45. Slot 10:30 no disponible para ese doctor.

### 3.2 Prioridad MEDIA – Buen impacto, esfuerzo variable

#### E. Portal de reserva 24/7 para pacientes

- **Estado actual:** `crearCitaPublica` y `obtenerDisponibilidadPublica` existen.
- **Mejora:** Página pública `/reservar` (o similar) con:
  - Selector sucursal → fecha → slot disponible → formulario datos paciente.
  - Mensaje de confirmación con enlace para confirmar/cancelar/reagendar.
  - Posible integración con WhatsApp para confirmación en un solo click.

#### F. Respuesta del paciente desde WhatsApp

- **Problema:** Confirmar por enlace web funciona; desde WhatsApp no hay flujo automatizado.
- **Solución:**
  - Botones rápidos en mensaje: "Confirmar" / "Cancelar" / "Reprogramar".
  - Webhook que procese respuestas y actualice estado de la cita.
  - Para reprogramar: enviar enlace al calendario o flujo de selección de nuevo slot.

#### G. Buffer entre citas configurable

- **Solución:**
  - Campo `buffer_minutos` por doctor o por sucursal (o global).
  - Al calcular disponibilidad: después de una cita de 30 min con buffer 5, el siguiente slot disponible es +35 min.
  - Evita retrasos en cascada.

#### H. Sincronización con calendarios externos

- **Solución:**
  - Integración Google Calendar / Outlook vía OAuth.
  - Al crear/reagendar/cancelar cita: crear/actualizar/eliminar evento.
  - Sincronización bidireccional opcional (eventos externos → bloqueos en RCA).

### 3.3 Prioridad BAJA – Innovación, mayor esfuerzo

#### I. Overbooking inteligente

- **Enfoque:**
  - Modelo ML que prediga probabilidad de no-show por paciente y por contexto (día, hora, antigüedad, historial).
  - Parámetro `maxEmpalmes` dinámico: si probabilidad de no-show es alta, permitir 1 slot extra.
  - Dashboard con métricas para ajustar umbrales.

#### J. Analytics predictivos de ocupación

- **Enfoque:**
  - Reportes de ocupación por doctor/sucursal/hora/día.
  - Identificación de horas valle para ofrecer promociones.
  - Proyección de demanda para planificación de recursos.

#### K. Triage y priorización

- **Enfoque:**
  - Tipo de consulta (Urgencia vs. Subsecuente) influye en prioridad de asignación.
  - Slots reservados para urgencias mismo día.
  - Lista de espera con prioridad por antigüedad o severidad.

---

## PARTE 4: ROADMAP SUGERIDO

| Fase | Plazo | Entregables |
|------|-------|-------------|
| **Fase 1** | 2-4 semanas | Recordatorios persistentes + integración WhatsApp efectiva |
| **Fase 2** | 2-3 semanas | Slot holding + validación solapamiento por duración |
| **Fase 3** | 2-4 semanas | Portal reserva 24/7 mejorado + respuestas desde WhatsApp |
| **Fase 4** | 3-6 semanas | Buffer configurable + sincronización calendarios (opcional) |
| **Fase 5** | 6+ semanas | Overbooking predictivo + analytics (si hay datos históricos suficientes) |

---

## PARTE 5: RESUMEN EJECUTIVO

El sistema RCA de citas tiene una base sólida: disponibilidad real, bloqueos, lista de espera, confirmación por enlace, plantillas y KPI. Las mejoras más impactantes son:

1. **Recordatorios persistentes** conectados a WhatsApp para reducir no-show (40-65% según industria).
2. **Slot holding** para evitar doble reserva en momentos de alta concurrencia.
3. **Validación de solapamiento** por duración real de la consulta.
4. **Portal de reserva 24/7** aprovechando la API pública existente.
5. **Respuesta del paciente desde WhatsApp** para confirmar/cancelar/reprogramar sin fricción.

La implementación por fases permite obtener beneficios rápidos (Fase 1-2) y luego avanzar hacia funcionalidades más avanzadas (overbooking, analytics).

---

## Referencias

- Keironsalud, Trabem, RCSanitaria, Revista Médica: optimización de agenda y gestión de citas.
- Doctoralia PRO, Recordarapp, Agendapro: recordatorios y confirmaciones.
- Springer, AJMC, IDEAS/RePEc: modelos de no-show y overbooking.
- Medium, Schedise, Skiplino: prevención de doble reserva y gestión de slots.
