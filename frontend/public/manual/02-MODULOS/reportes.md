# Módulo Reportes

## Descripción

**Análisis y estadísticas** del sistema: reportes de ocupación (citas por período, doctor, sucursal), KPIs de citas (confirmación, asistencia, no-show), y opciones de exportación o gráficos. Los datos pueden ser reales o demo según la configuración y el origen de datos.

**Ruta:** Reportes → `/reportes`

---

## Pantalla principal

- **Selector de tipo de reporte** o de **período** (ej. último mes, último trimestre).
- **Componente ReportesOcupacion:** tablas o gráficos por doctor, por sucursal, por estado (Agendada, Confirmada, Finalizada, etc.); totales y porcentajes.
- **Accesos rápidos** a Citas, Calendario o Recepción (iconos o enlaces).
- Opción de **exportar** (PDF, Excel) si está implementada.

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **Cambiar período** | Filtra los datos del reporte por rango de fechas. |
| **Cambiar sucursal / doctor** | Filtra por sucursal o médico. |
| **Exportar** | Descarga el reporte en el formato disponible. |
| **Ir a Citas / Calendario / Recepción** | Navegación rápida a los módulos operativos. |

---

## Flujos típicos

- Revisar ocupación y tasas de confirmación/asistencia/no-show por período.
- Comparar sucursales o doctores.
- Exportar reporte para gerencia o auditoría.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
