# Módulo Recepción

## Descripción

El módulo **Recepción** sirve para gestionar las llegadas de pacientes y el flujo de atención el día de la cita: ver quién está pendiente, marcar llegada, pasar a consultorio y completar o registrar inasistencia. Está pensado para el personal de recepción en cada sucursal.

**Ruta en el menú:** Recepción → `/recepcion`

---

## Pantalla principal

*(Ilustración: captura de pantalla de Recepción – KPIs y lista de citas – incorporar cuando se disponga.)*

Al entrar verás:

1. **Encabezado:** título "Recepción", subtítulo con la sucursal actual y la fecha de hoy.
2. **Selector de sucursal:** desplegable (MapPin) para elegir la sucursal. Solo se muestran las citas del día de esa sucursal.
3. **KPI (tarjetas de resumen):**
   - **Pendientes** (amarillo): citas agendadas aún sin marcar llegada.
   - **En Espera** (azul): llegaron y están esperando a ser pasados a consultorio.
   - **Atendiendo** (morado): ya están en consultorio.
   - **Completadas** (verde): cita finalizada.
   - **Inasistencia** (rojo): no llegaron o se registró inasistencia.
4. **Filtros:** caja de búsqueda y desplegable por estado.
5. **Lista de citas:** tarjetas ordenadas por hora, con datos del paciente, estado y botones de acción.

---

## Botones y acciones

### En el encabezado

| Elemento | Acción |
|----------|--------|
| **Selector de sucursal** | Cambia la sucursal cuyas citas se muestran. La selección se guarda en el navegador. |

### En cada tarjeta de cita

Según el **estado** de la cita aparecen unos u otros botones:

| Botón | Cuándo aparece | Qué hace |
|-------|----------------|----------|
| **Marcar Llegada** | Estado *Pendiente* | Abre el modal para registrar la hora de llegada y opcionalmente notas. Al confirmar, la cita pasa a *En Espera*. |
| **Pasar a Consultorio** | Estado *En Espera* | Cambia la cita a *Atendiendo* (en consultorio). No abre modal. |
| **Finalizar** | Estado *Atendiendo* | Marca la cita como *Completada*. |
| **Inasistencia** | Estado *Pendiente* | Abre el modal para elegir motivo de inasistencia (Trabajo, Enfermedad, Olvido, Sin transporte, Otro) y confirmar. La cita pasa a *Inasistencia*. |

### En el modal "Marcar Llegada"

| Elemento | Descripción |
|----------|-------------|
| **Hora de llegada** | Campo para registrar a qué hora llegó el paciente (se suele usar la hora actual). |
| **Notas** | Opcional. Observaciones para la cita. |
| **Confirmar** | Guarda la llegada y cierra el modal. La cita pasa a *En Espera*. |
| **Cerrar / Cancelar** | Cierra el modal sin guardar. |

### En el modal "Registrar inasistencia"

| Elemento | Descripción |
|----------|-------------|
| **Motivo** | Lista: Trabajo, Enfermedad, Olvido, Sin transporte, Otro. |
| **Confirmar** | Guarda el motivo, marca la cita como *No_Asistio* y cierra el modal. |
| **Cancelar** | Cierra el modal sin registrar inasistencia. |

---

## Filtros y búsqueda

| Filtro | Comportamiento |
|--------|----------------|
| **Buscar por nombre, teléfono o servicio** | Filtra en tiempo real por texto en nombre del paciente, teléfono, servicio o doctor. |
| **Todos los estados** | Muestra todas las citas del día de la sucursal. |
| **Pendientes / En Espera / Atendiendo / Completadas / Inasistencia** | Muestra solo las citas en ese estado. |

---

## Estados de la cita (en Recepción)

| Estado en pantalla | Significado en sistema | Siguiente acción típica |
|--------------------|------------------------|-------------------------|
| **Pendiente** | Agendada, aún no se ha marcado llegada. | Marcar Llegada o Inasistencia. |
| **En Espera** | Llegó; esperando a ser pasado a consultorio. | Pasar a Consultorio. |
| **Atendiendo** | En consultorio con el médico. | Finalizar. |
| **Completada** | Cita terminada. | Ninguna (solo consulta). |
| **Inasistencia** | No asistió; motivo registrado. | Ninguna (solo consulta). |

La franja de color a la izquierda de cada tarjeta indica el estado (amarillo, azul, morado, verde, rojo).

---

## Información extra en cada tarjeta

- **Hora de la cita** y, si aplica, **"Llegó: HH:MM"**.
- **SLA (min):** minutos transcurridos desde la hora de la cita. En verde si ≤15 min, en rojo si >15 min (útil para priorizar). No se muestra en completadas.
- **Paciente:** nombre, teléfono, doctor, consultorio, servicio.
- **Notas:** si se guardaron al marcar llegada o después.

---

## Flujos paso a paso

### Marcar llegada y llevar hasta completada

1. Localizar la cita en estado *Pendiente* (o filtrar por "Pendientes").
2. Clic en **Marcar Llegada**.
3. En el modal, ajustar si hace falta la hora de llegada y añadir notas. Clic en **Confirmar**.
4. La cita pasa a *En Espera*. Cuando el médico pueda, clic en **Pasar a Consultorio**.
5. La cita pasa a *Atendiendo*. Al terminar la consulta, clic en **Finalizar**.
6. La cita queda *Completada*.

### Registrar inasistencia

1. Localizar la cita en estado *Pendiente*.
2. Clic en **Inasistencia**.
3. Elegir el **motivo** (Trabajo, Enfermedad, Olvido, etc.) y clic en **Confirmar**.
4. La cita pasa a *Inasistencia* y queda registrada para reportes y seguimiento (protocolo 7 días, etc.).

### Lista de Recuperación (No Asistió) y Reagendar

Para atacar de forma operativa a quienes **no asistieron** a su cita:

1. **Acceso:** En Recepción (o vista dedicada) está la **Lista de Recuperación**, filtrada por leads/citas en estado *No Asistió*. Los datos provienen del cron *MarkNoShowsScheduler* (citas pasadas no confirmadas) y de inasistencias registradas manualmente.
2. **Data Grid:** Tabla con columnas: **Nombre**, **Última cita fallida**, **Teléfono**, **Reagendar** (botón).
3. **Reagendar:** Al hacer clic en **Reagendar** se abre el **mismo modal de calendario** que en Citas o Keila IA, con los datos del paciente **pre-llenados**. Solo se asigna nueva fecha, hora, doctor y sucursal si aplica. Al guardar:
   - Se crea la nueva cita.
   - El estado del lead pasa de NO_SHOW a RESCHEDULED.
   - El lead se mueve en el Kanban (ej. a Agendado).
4. **Venta de lista:** Esta lista sirve para priorizar contactos y ofertas de reagendamiento (remarketing operativo). Ver [04 - Procesos - Lista de Recuperación](../04-PROCESOS-DE-NEGOCIO.md) y [07 - Diagramas - Reagendar](../07-DIAGRAMAS-DE-FLUJO.md#11-reagendar-desde-lista-no-asistió).

---

## Errores o mensajes frecuentes

- **"No hay pacientes/citas para la sucursal seleccionada con los filtros actuales."**  
  No hay citas del día para la sucursal actual que cumplan el filtro de estado y/o búsqueda. Prueba a cambiar sucursal o quitar filtros.

- Si un botón no hace nada o da error, comprueba que la sucursal sea la correcta y recarga la página. Si persiste, reportar al soporte.

---

## Relación con otros módulos

- Las citas que ves aquí son las mismas que se gestionan en **Citas** y **Calendario**; Recepción solo cambia el estado del día (llegada, consultorio, completada, inasistencia).
- Las inasistencias registradas aquí alimentan el proceso de **inasistencias** y el **protocolo de 7 días** (ver [03 - Automatizaciones](../03-AUTOMATIZACIONES-Y-FLUJOS.md) y [04 - Procesos de negocio](../04-PROCESOS-DE-NEGOCIO.md)).
