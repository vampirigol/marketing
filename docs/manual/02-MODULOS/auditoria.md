# Módulo Auditoría

## Descripción

**Historial de cambios** del sistema: quién realizó qué acción, sobre qué entidad y cuándo. Listado de eventos de auditoría (últimos 50 o según filtros) con fecha, entidad, acción, usuario y detalles. Sirve para trazabilidad y cumplimiento.

**Ruta:** Auditoría → `/auditoria`

---

## Pantalla principal

- Título "Historial de cambios" y subtítulo "Últimos eventos registrados en el sistema".
- **Tabla** con columnas:
  - **Fecha:** fecha y hora del evento (formato local).
  - **Entidad:** recurso afectado (Cita, Paciente, Lead, Abono, etc.).
  - **Acción:** tipo de acción (crear, actualizar, eliminar, marcar llegada, etc.).
  - **Usuario:** nombre del usuario que realizó la acción (o "Sistema" si es automático).
  - **Detalles:** JSON o texto con datos adicionales (IDs, valores anteriores/nuevos, etc.).

---

## Botones y acciones

- La pantalla es de **solo lectura**.
- Si se implementa **paginación** o **filtros** (por usuario, fecha, entidad), permiten acotar el listado.

---

## Flujos típicos

- Revisar quién modificó una cita o un paciente.
- Auditar aprobaciones de cortes o cambios de estado.
- Exportar o filtrar por rango de fechas para un informe (si está disponible).

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
