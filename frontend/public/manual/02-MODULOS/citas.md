# Módulo Citas

## Descripción

Gestión completa de citas: vistas por día, semana, mes o lista; agendar, reagendar, ver disponibilidad por sucursal y doctor; filtros por estado, médico y sucursal; lista de espera; gestión de horarios y ausencias; reportes de ocupación y dashboard por doctor. Es el centro operativo del agendamiento.

**Ruta:** Citas → `/citas`

---

## Pantalla principal

*(Ilustración: captura de pantalla de Citas – vista día o lista – incorporar cuando se disponga.)*

### Encabezado y selectores
- Selector de **sucursal** (para usuarios admin puede haber "Todas las sucursales").
- Selector de **vista:** Día, Semana, Mes, Lista.
- **Fecha seleccionada** y navegación (hoy, anterior, siguiente).
- **Mini calendario** para saltar a una fecha.
- Selector de **doctores** (vista multi-doctor o filtro por médico).

### Botones de acción
| Botón | Acción |
|-------|--------|
| **Nueva cita / Agendar** | Abre modal para crear cita (paciente, fecha, hora, doctor, sucursal, tipo de consulta, promoción si aplica). |
| **Gestión de horarios** | Abre panel para configurar horarios de atención por doctor/sucursal. |
| **Gestión de ausencias** | Abre panel para bloques de ausencia (vacaciones, permisos). |
| **Reportes de ocupación** | Abre reportes por período, doctor, sucursal. |
| **Dashboard doctor** | Vista de estadísticas y citas por doctor seleccionado. |
| **Lista de espera** | Muestra solicitudes pendientes de asignación a slot. |

### Vistas
- **Día:** columnas por doctor o por hora; bloques de citas; clic en slot vacío para agendar.
- **Semana:** matriz semana × recursos; arrastrar y soltar para reagendar (si está habilitado).
- **Mes:** cuadrícula del mes con indicador de carga por día.
- **Lista:** tabla paginada con filtros (estado, búsqueda, fecha inicio/fin, médico), orden y paginación.

### Filtros (vista Lista y otras)
- **Búsqueda** por paciente, teléfono, etc.
- **Estado:** Todas, Agendada, Confirmada, En consulta, Atendida, No asistió, Cancelada, etc.
- **Médico asignado** y **Sucursal** (si el rol lo permite).

### KPIs y alertas
- Total citas, confirmadas, atendidas, no-show; tasas de confirmación, asistencia y no-show.
- Alertas: pendientes de confirmación, riesgo no-show.

### Sidebar día
- Al seleccionar un día puede abrirse un panel con resumen del día (citas, pendientes, completadas) y acceso rápido a acciones.

---

## Botones y acciones en citas (tarjeta o fila)

| Acción | Descripción |
|--------|-------------|
| **Ver / Editar** | Abre el detalle de la cita o modal de edición (cambiar hora, doctor, notas, estado). |
| **Reagendar** | Abre flujo de reagendamiento (nueva fecha/hora, motivo); puede aplicar regla de promoción (1 reagendo). |
| **Marcar llegada** | Registra hora de llegada (también disponible en Recepción). |
| **Cancelar** | Cambia estado a Cancelada. |
| **Enviar recordatorio** | Dispara envío de recordatorio por canal configurado. |

---

## Lista de espera

- Muestra **solicitudes** de cita aún no asignadas a un slot (por ejemplo desde reservar o desde contact center).
- Acciones: **Asignar a slot** (elegir fecha/hora/doctor y crear la cita), ver detalle de la solicitud.

---

## Open Tickets (tickets abiertos)

Los **Open Tickets** son solicitudes de cita en estado "abierto" (aún no convertidas en cita fija): el paciente tiene un ticket con vigencia (días restantes) y puede convertirse en cita o cancelarse.

- **Dónde aparecen:** En Citas (o en vistas relacionadas) como tarjetas o listado de tickets activos por paciente.
- **Acciones típicas:**
  - **Convertir a cita:** Abre un modal para asignar fecha, hora, doctor y sucursal; al confirmar se crea la cita y el ticket se cierra.
  - **Encuesta de satisfacción:** Tras la atención, se puede enviar o registrar una encuesta de satisfacción vinculada al ticket/cita.
  - **Cancelar:** Cerrar el ticket con motivo (sin crear cita).
- Un scheduler (**ExpiracionOpenTicketsScheduler**) cierra automáticamente los tickets vencidos (ej. diario a las 00:01). Ver [03 - Automatizaciones y flujos](../03-AUTOMATIZACIONES-Y-FLUJOS.md).

---

## Estados de la cita

Agendada, Pendiente_Confirmacion, Confirmada, Reagendada, Llegó, En_Atencion, En_Espera, Finalizada, Cancelada, Inasistencia, Perdido, En_Lista_Espera (según sistema). Ver [05 - Glosario](../05-GLOSARIO-Y-REFERENCIA.md).

---

## Flujos típicos

1. **Agendar cita:** Clic en "Nueva cita" o en un slot vacío; elegir paciente (o crear), sucursal, doctor, fecha, hora, tipo de consulta; guardar.
2. **Reagendar:** Desde la cita, "Reagendar"; elegir nueva fecha/hora y motivo; confirmar (puede aplicar promoción según reglas).
3. **Ver disponibilidad:** En el modal de agendar o en "Gestión de horarios" se consulta disponibilidad por sucursal, doctor y fecha.
4. **Lista de espera:** Abrir "Lista de espera", elegir solicitud y "Asignar a slot"; completar datos y crear la cita.
5. **Reportes:** Abrir "Reportes de ocupación" y elegir período, sucursal y/o doctor.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
