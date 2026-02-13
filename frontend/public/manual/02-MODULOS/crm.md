# Módulo CRM

## Descripción

Gestión del embudo de leads por sucursal: kanban por etapas (pendientes, en contacto, confirmadas, cierre), filtros por canal y fecha, estadísticas de confirmación/asistencia/no-show, y acciones rápidas (confirmar, marcar llegada, no asistencia, reagendar). Integrado con Citas y Recepción.

**Ruta:** CRM → `/crm`

---

## Pantalla principal

*(Ilustración: captura de pantalla del CRM – embudo y kanban – incorporar cuando se disponga.)*

### Encabezado
- Título "CRM · Embudos por Sucursal" y badge con el nombre del embudo (sucursal) activo.
- Descripción: "Selecciona una sucursal para ver etapas, procesos y desempeño del pipeline."

### Botones del encabezado
| Botón | Acción |
|-------|--------|
| **Nueva Cita** | Abre el modal para crear una cita (paciente, fecha, hora, etc.). Al guardar, actualiza el listado del embudo. |
| **Automatizaciones CRM** | Navega a `/automatizaciones` para configurar reglas del embudo. |
| **Selector de embudo** | Desplegable con las sucursales/embudos. Cambia el embudo activo y guarda la selección en el navegador. |

### KPIs (tres tarjetas)
- **Confirmación:** % de confirmación y texto "X confirmadas · Y pendientes".
- **Asistencia:** % de asistencia y "X atendidas · Y en cierre".
- **No-show:** % no-show y "X no-show · Y leads".

### Barra de filtros
| Filtro | Comportamiento |
|--------|----------------|
| **Nombre o teléfono** | Búsqueda en tiempo real sobre los leads del embudo. |
| **Todos los canales** | Desplegable: Todos, WhatsApp, Facebook, Instagram, TikTok, YouTube, Email, Web / Fan page. |
| **Desde / Hasta** | Fechas para filtrar por fecha de creación del lead. |
| **Limpiar** | Aparece si hay algún filtro activo; restablece búsqueda, canal y fechas. |

### Kanban
- Columnas por etapa del lead (según configuración del embudo: ej. pendientes, en contacto, confirmadas, cierre).
- Cada tarjeta muestra lead (nombre, teléfono, canal, etiquetas, SLA si aplica).
- **Arrastrar y soltar:** mueve el lead de una columna a otra y actualiza el estado en el backend.
- **Acción primaria** (en la tarjeta): según estado, puede ser "Confirmar", "Marcar llegada", "No asistencia", "Reagendar", etc.
- **Acción secundaria:** en algunos estados, "No asistencia" o "Enviar recordatorio" (si el embudo es de sucursal y hay cita vinculada).

---

## Botones y acciones (en tarjetas del Kanban)

| Acción | Cuándo aparece | Qué hace |
|--------|----------------|----------|
| **Confirmar** | Lead con cita pendiente de confirmación. | Cambia estado a "confirmada" (open). |
| **Marcar llegada** | Lead con cita confirmada. | Marca la cita como llegada en el backend (y opcionalmente en Citas), cambia lead a cierre con resultado "Atendida". |
| **No asistencia** | Lead con cita que no llegó. | Registra no asistencia en la cita (si hay CitaId), cambia lead a cierre con resultado "No show". |
| **Reagendar** | En cierre o similar. | Vuelve el lead a "en progreso" (in-progress) para reagendar cita. |
| **Enviar recordatorio** | Según configuración del embudo (sucursal). | Llama al servicio de citas para enviar recordatorio de la cita vinculada. |

---

## Estados del lead (columnas del Kanban)

El pipeline del Contact Center mapea el estado del lead a estas columnas visuales:

| Columna | Significado | KPI / Acción |
|---------|-------------|--------------|
| **Leads WhatsApp** | Entrada inicial (lead por canal). | Asignar, contactar. |
| **Agendado** | Tiene cita futura en appointments. | Confirmar, recordatorios. |
| **Confirmado** | Confirmación manual o vía bot. | Incrementa KPI CONFIRMED_COUNT. |
| **Pagado/Cerrado** | Cierre ganado o pago recibido. | Incrementa KPI REVENUE. |
| **Remarketing** | Leads antiguos para recuperar. | Recontactar, ofertas. |
| **No Asistió** | Cita pasada sin confirmar o sin llegada (automático por cron *MarkNoShowsScheduler* o manual). | Lista de Recuperación, Reagendar. |

Estados equivalentes en sistema (según implementación): **Pendientes / new**, **En contacto / in-progress**, **Confirmadas / open**, **Cierre / qualified** (resultado: Atendida, No show, RESCHEDULED, etc.). Ver [04 - Procesos - Pipeline Contact Center](../04-PROCESOS-DE-NEGOCIO.md) y [07 - Diagramas - Pipeline](../07-DIAGRAMAS-DE-FLUJO.md).

---

## Flujos típicos

1. **Cambiar de sucursal:** seleccionar otro embudo en el desplegable; el kanban y los KPIs se actualizan.
2. **Crear cita desde CRM:** clic en "Nueva Cita", completar modal y guardar; el lead puede aparecer en la columna correspondiente.
3. **Confirmar cita:** localizar lead en "En contacto", clic en "Confirmar"; pasa a "Confirmadas".
4. **Registrar llegada:** en "Confirmadas", clic en "Marcar llegada"; la cita se marca llegada y el lead pasa a "Cierre" como Atendida.
5. **Registrar no asistencia:** clic en "No asistencia"; el lead pasa a "Cierre" como No show y la cita se actualiza.
6. **Reagendar:** desde una tarjeta en cierre, usar "Reagendar" para volver el lead a en progreso y agendar nueva cita.
7. **Filtrar:** usar búsqueda, canal o rango de fechas y, si aplica, "Limpiar" para restablecer.

---

## Relación con otros módulos

- **Citas:** Nueva Cita y marcar llegada/no asistencia usan el API de citas; los estados del lead se alinean con el flujo de la cita.
- **Recepción:** Marcar llegada en Recepción no actualiza automáticamente el CRM; el CRM tiene su propia acción "Marcar llegada" sobre el lead/cita vinculada.
- **Keila IA (Matrix):** Los leads pueden provenir de conversaciones de Matrix; el CRM es la vista de embudo por sucursal.
- **Automatizaciones:** El enlace "Automatizaciones CRM" lleva a la configuración de reglas que afectan leads y etapas.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
