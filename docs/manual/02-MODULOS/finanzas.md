# Módulo Finanzas

## Descripción

Resumen financiero del día o período: **KPIs** (total del día, tarjeta, efectivo, transferencia), **ingresos por sucursal**, **cortes pendientes** y **actividad reciente** (abonos, aprobación de cortes). Incluye pestañas para **Resumen**, **Abonos** y **Cortes**; registro de abonos y cierre de cortes de caja.

**Ruta:** Finanzas → `/finanzas`

---

## Pantalla principal

### Pestañas
- **Resumen:** KPIs, ingresos por sucursal, cortes pendientes, actividad reciente.
- **Abonos:** Tabla de abonos (fecha, paciente, monto, método de pago, usuario).
- **Cortes:** Tabla de cortes (sucursal, fecha, monto, estado: pendiente/aprobado).

### Selectores
- **Sucursal:** Todas o una sucursal concreta.
- **Período:** Hoy, Ayer, Esta semana, etc. (según implementación).

### KPIs (Resumen)
| KPI | Descripción |
|-----|-------------|
| Total del Día | Suma de ingresos del día (con % de cambio si aplica). |
| Tarjeta | Monto por tarjeta y % del total. |
| Efectivo | Monto en efectivo y % del total. |
| Transferencia | Monto por transferencia y % del total. |

### Ingresos por sucursal
- Lista o gráfico: sucursal, monto, porcentaje del total.

### Cortes pendientes
- Filas: sucursal, fecha, monto, estado "pendiente".
- Acción: **Aprobar corte** o **Ver detalle** (abre modal de cierre).

### Actividad reciente
- Últimos movimientos: hora, usuario, acción (registró abono, aprobó corte), detalle (paciente y monto).

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **Registrar abono** | Abre modal para registrar un abono (paciente, monto, método de pago, concepto). |
| **Nuevo corte** / **Cerrar corte** | Abre modal para cerrar corte de caja (sucursal, fecha, montos por método). |
| **Aprobar corte** | Cambia el estado del corte a aprobado (según permisos). |
| **Descargar** | Exportar reporte o listado (si está disponible). |

---

## Flujos típicos

- Revisar total del día y distribución por método de pago y sucursal.
- Registrar abonos desde recepción o administración.
- Al cierre del turno, cerrar corte de caja; después, aprobar el corte (gerencia/admin).
- Consultar historial de abonos y cortes en las pestañas correspondientes.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
