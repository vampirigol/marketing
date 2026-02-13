# 04 – Procesos de negocio

Este documento describe los **flujos de punta a punta** que atraviesan varios módulos del sistema, para entender cómo encajan Recepción, Citas, CRM, automatizaciones y recordatorios.

---

## Proceso 1: Ciclo de vida de una cita

Desde que se agenda hasta que se cierra (atendida o inasistencia).

```
Agendar (Citas/Calendario o reservar)
    ↓
Estado: Agendada
    ↓
Confirmación (manual o recordatorio automático) → Estado: Confirmada
    ↓
Día de la cita
    ↓
[Recepción] Marcar llegada → Estado: En espera (Confirmada en backend; en pantalla "En Espera")
    ↓
[Recepción] Pasar a consultorio → Estado: En_Consulta (Atendiendo)
    ↓
[Recepción] Finalizar → Estado: Atendida (Completada)
```

**Variante – No llega a tiempo:**

- Tras tolerancia (ej. 15 min), **WaitListScheduler** mueve la cita a *En_Lista_Espera*.
- Al final del día, **AutoClosureScheduler** convierte esas citas en inasistencias e inicia el **protocolo de 7 días** (ver proceso 2).

**Variante – Inasistencia registrada en Recepción:**

- El usuario en Recepción hace clic en **Inasistencia**, elige motivo y confirma.
- La cita pasa a *No_Asistio* y queda registrada para reportes y protocolo de seguimiento.

---

## Proceso 2: Protocolo de inasistencias (7 días)

Para pacientes que no asistieron (por lista de espera al cierre del día o por registro manual en Recepción).

1. **Registro:** La cita queda como inasistencia (estado y/o tabla de inasistencias).
2. **Scheduler (InasistenciaScheduler):** Ejecuta el protocolo según días transcurridos (mensajes, recordatorios, reintentos).
3. **Día 7 sin respuesta:** El sistema puede marcar el lead/paciente como "perdido" o etiquetar para remarketing.
4. **Reglas de automatización:** Por ejemplo "Inasistencia → 7 días de seguimiento" añade etiqueta "Perdido" y notifica.

El detalle de horarios (00:00, cada 6 h, 09:00) y mensajes está en [03 - Automatizaciones y flujos](03-AUTOMATIZACIONES-Y-FLUJOS.md).

---

## Proceso 3: Lead en el CRM hasta conversión

Flujo típico del embudo (CRM / Keila IA).

```
Lead nuevo (canal WhatsApp/Facebook/Instagram o manual)
    ↓
Estado: new / pendiente
    ↓
Regla: asigna asesor, etiqueta "Lead", notifica SLA 2 h
    ↓
Contacto (Keila IA: conversación, mensajes)
    ↓
Estado: reviewing / en contacto
    ↓
Conversión a cita (agendar desde Matrix o Citas)
    ↓
Estado: in-progress / confirmada, etc.
    ↓
[Recepción] Llegada y atención → cita completada
    ↓
Estado: qualified / convertida (lead convertido)
```

**Reglas que intervienen:** Lead nuevo → contacto inicial; prospecto sin respuesta 24 h; cita pendiente → confirmación; recordatorios 24 h y día de cita; no show 15 min; inasistencia 7 días; cita atendida → subsecuente; lead sin cita 14 días → remarketing; SLA vencido; reasignación inteligente; bloqueo 7 días (ver [03](03-AUTOMATIZACIONES-Y-FLUJOS.md)).

---

## Proceso 3b: Open Ticket → Cita

Cuando un paciente tiene un **Open Ticket** (solicitud de cita abierta con vigencia en días):

1. El ticket aparece en Citas (o vista relacionada) hasta que se convierte o expira.
2. **Convertir a cita:** El usuario asigna fecha, hora, doctor y sucursal; al confirmar se crea la cita y el ticket se cierra.
3. **Alternativa:** Cancelar el ticket (sin crear cita) o dejar que el **ExpiracionOpenTicketsScheduler** lo cierre al vencer. Ver [Citas - Open Tickets](02-MODULOS/citas.md#open-tickets-tickets-abiertos) y [03 - Schedulers](03-AUTOMATIZACIONES-Y-FLUJOS.md).

---

## Proceso 4: Lista de espera (automática)

1. Cita en estado Agendada o Confirmada; pasa la hora de la cita y no se ha marcado llegada.
2. **WaitListScheduler** (cada 15 min) detecta que superó la tolerancia (ej. 15 min).
3. La cita pasa a *En_Lista_Espera*; se puede notificar al paciente y al contact center.
4. Si el paciente llega después, en Recepción se puede marcar llegada (si la cita sigue disponible) o reagendar.
5. Si no llega: al cierre del día **AutoClosureScheduler** la convierte en inasistencia y dispara el protocolo de 7 días.

---

## Proceso 5: Recordatorios de cita (automáticos)

1. Al **agendar** la cita, el sistema puede enviar confirmación y programar recordatorios.
2. **ReminderScheduler** o **CitasRecordatorioScheduler** (cada minuto) revisan las citas con recordatorio pendiente.
3. Se envían, según configuración:
   - Recordatorio 24 h antes (ej. 10:00 del día anterior).
   - Recordatorio el día de la cita (ej. 2 h antes).
4. El paciente recibe el mensaje por el canal configurado (WhatsApp, etc.); no requiere acción del usuario en Recepción para el envío.

---

## Proceso 6: Arquitectura Multi-Sucursal WhatsApp

Cada **sucursal** tiene su propia configuración de WhatsApp (phoneNumberId, accessToken, wabaId) en la base de datos (ej. campo `whatsappConfig` en Branch). No hay una configuración global única.

1. **Webhook:** Cuando Meta envía un evento (mensaje entrante), el payload incluye `metadata.phone_number_id`.
2. **Enrutamiento:** El backend busca en la DB qué Branch (sucursal) tiene ese `phone_number_id`.
3. **Asignación:** El mensaje se enruta solo a los agentes asignados a esa sucursal; en Keila IA (Matrix) el Inbox muestra conversaciones según la sucursal del número que recibió el mensaje.

Configuración por sucursal: en **Configuración** (o parámetros por sucursal) se define el número y credenciales de WhatsApp por cada sucursal. Ver [07 - Diagramas - Multi-Sucursal WhatsApp](07-DIAGRAMAS-DE-FLUJO.md#8-arquitectura-multi-sucursal-whatsapp).

---

## Proceso 7: Pipeline Contact Center (columnas del Kanban)

El estado del lead (`lead_status`) se mapea a columnas visuales en el Kanban del Contact Center:

| Columna | Significado | Acción / KPI |
|---------|-------------|--------------|
| **Leads WhatsApp** | Entrada inicial (lead por canal). | Asignar, contactar. |
| **Agendado** | Tiene cita futura en appointments. | Confirmar, recordatorios. |
| **Confirmado** | Confirmación manual o vía bot. | KPI: CONFIRMED_COUNT. |
| **Pagado/Cerrado** | Cierre ganado o pago recibido. | KPI: REVENUE. |
| **Remarketing** | Leads antiguos para recuperar. | Recontactar, ofertas. |
| **No Asistió** | Cita pasada sin confirmar o sin llegada (automático por cron o manual). | Lista de recuperación, Reagendar. |

**Automatización No Confirmado → No Asistió:** El **MarkNoShowsScheduler** (cada hora) busca citas con fecha ya pasada y estado UNCONFIRMED, actualiza el lead a NO_SHOW y lo añade a la lista de recuperación. Ver [03 - MarkNoShowsScheduler](03-AUTOMATIZACIONES-Y-FLUJOS.md) y [07 - Diagramas - Cron No Asistió](07-DIAGRAMAS-DE-FLUJO.md#10-cron-no-confirmado--no-asistió).

---

## Proceso 8: Lista de Recuperación y Reagendar (Recepción)

Panel operativo para recepcionistas que atienden a quienes **no asistieron**:

1. **Lista de Recuperación:** En Recepción (o vista dedicada) una tabla (Data Grid) filtrada por leads/citas en estado No Asistió. Columnas: Nombre, Última cita fallida, Teléfono, botón **Reagendar**.
2. **Reagendar:** Al hacer clic en Reagendar se abre el **mismo modal de calendario** que en Citas/Matrix, con datos del paciente **pre-llenados**. Al guardar la nueva cita, el estado del lead pasa de NO_SHOW a RESCHEDULED y el lead se mueve en el Kanban (ej. a Agendado).
3. **Venta de lista:** La lista de No Asistió sirve para priorizar contactos y ofertas de reagendamiento (remarketing operativo).

Ver [02 - Recepción - Lista de Recuperación](02-MODULOS/recepcion.md) y [07 - Diagramas - Reagendar](07-DIAGRAMAS-DE-FLUJO.md#11-reagendar-desde-lista-no-asistió).

---

## Proceso 9: Cuidados Espirituales

Servicio adicional de la clínica (valor agregado):

1. **UI:** En el **sidebar del Chat o Perfil del paciente** (Keila IA / Matrix) hay una sección **Servicios Adicionales** con una card **Cuidados Espirituales**: botón "Marcar Asistencia" (o "Asistió a cuidados"). Si ya asistió, se muestra "Asistencia Registrada".
2. **KPI:** Al marcar asistencia se incrementa el indicador de atendidos en Cuidados Espirituales.
3. **Agendamiento:** Si el servicio requiere cita, se usa el mismo componente de calendario con `appointment_type = SPIRITUAL`; en el calendario general estas citas se filtran o muestran en color violeta para distinguirlas.

Ver [02 - Keila IA - Cuidados Espirituales](02-MODULOS/keila-matrix.md) y [07 - Diagramas - Cuidados Espirituales](07-DIAGRAMAS-DE-FLUJO.md#12-cuidados-espirituales-asistencia-y-agendamiento).

---

## Proceso 10: Encuesta de calidad post-venta

Al **confirmar pago o cerrado ganado** por el canal abierto (WhatsApp o Instagram), el sistema envía automáticamente la encuesta de calidad:

1. **Disparador:** En el servicio que actualiza el estado del lead, si `newStatus === 'CLOSED_WON'` o `'PAYMENT_RECEIVED'`, se llama a `SurveyService.sendQualitySurvey(leadId)`.
2. **SurveyService:** Determina el canal activo del lead, selecciona la plantilla de mensaje (ej. `encuesta_calidad_v1`, idioma es_MX) y envía por la API de Meta el mensaje con el link al formulario.
3. El paciente recibe el mensaje en el mismo canal por el que fue atendido (WhatsApp o Instagram).

Ver [03 - Encuesta de calidad](03-AUTOMATIZACIONES-Y-FLUJOS.md#parte-3-encuesta-de-calidad-post-venta) y [07 - Diagramas - Encuesta](07-DIAGRAMAS-DE-FLUJO.md#13-encuesta-de-calidad-post-venta).

---

## Resumen de módulos por proceso

| Proceso | Módulos / elementos que intervienen |
|---------|-------------------------------------|
| Ciclo de cita | Citas, Calendario, Recepción, Schedulers (WaitList, AutoClosure, Reminder, CitasRecordatorio) |
| Inasistencias 7 días | Recepción (registro), InasistenciaScheduler, AutoClosureScheduler, reglas de automatización |
| Lead → cita | CRM, Keila IA (Matrix), Citas, Recepción, reglas de automatización |
| Lista de espera | Recepción, Citas, WaitListScheduler, AutoClosureScheduler |
| Recordatorios | Citas (al agendar), ReminderScheduler, CitasRecordatorioScheduler, Mensajero/canales |
| Multi-Sucursal WhatsApp | Backend webhook, Branch/sucursal (whatsappConfig), Keila IA Inbox por sucursal, Configuración |
| Pipeline Kanban (columnas) | CRM, Keila IA (Kanban), MarkNoShowsScheduler, KPIs Contact Center |
| Lista de Recuperación / Reagendar | Recepción (Data Grid No Asistió), modal Citas, Kanban |
| Cuidados Espirituales | Keila IA (sidebar perfil/chat), Calendario (tipo SPIRITUAL), KPI atendidos |
| Encuesta post-venta | Backend (SurveyService), actualización de estado lead, canales WhatsApp/Instagram |

Para detalle de cada botón y pantalla, usar [02 - Módulos](02-MODULOS/); para detalle de cada scheduler y regla, [03 - Automatizaciones y flujos](03-AUTOMATIZACIONES-Y-FLUJOS.md).
