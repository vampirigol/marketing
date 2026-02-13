# Módulo Doctores (portal)

## Descripción

**Portal o vista para médicos:** agenda del día, citas asignadas, estadísticas y posible uso en móvil. Acceso desde la página de inicio del sistema (bloque "Doctores - Acceso a la versión móvil web"). No aparece en el menú lateral; está pensado para el rol médico.

**Ruta:** Doctores → `/doctores`

---

## Pantalla principal

- Según implementación: **agenda del doctor** (citas del día o de la semana), **listado de citas** con estado, **dashboard** con indicadores (pacientes atendidos, pendientes, etc.).
- Diseño adaptable a **móvil** para consulta rápida en consultorio.

### Laboratorio (órdenes)

Desde el portal Doctores el médico puede gestionar **órdenes de laboratorio** del paciente:

- **Crear orden:** Botón o acción "Orden de laboratorio" (desde una cita o desde la ficha del paciente); abre modal para crear la orden (paciente, estudio, indicaciones).
- **Ver órdenes:** "Ver órdenes de laboratorio" abre un listado de órdenes del paciente; desde ahí se pueden consultar resultados o adjuntos si están disponibles.
- Las órdenes y resultados se vinculan al paciente y pueden verse también en el **expediente** (Pacientes) según implementación. Ver [Glosario - Laboratorio](../05-GLOSARIO-Y-REFERENCIA.md).

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **Ver citas / Agenda** | Listado o vista de citas del día/semana. |
| **Orden de laboratorio** | Crea una orden de laboratorio para el paciente (desde cita o desde ficha). |
| **Ver órdenes de laboratorio** | Listado de órdenes del paciente; consultar resultados o archivos adjuntos. |
| **Ver detalle de cita/paciente** | Abre detalle de la cita o datos del paciente. |
| *(Otros según pantalla)* | Filtrar por fecha, marcar asistencia, etc. |

---

## Flujos típicos

- El médico abre el portal (en escritorio o móvil), revisa su agenda del día y las citas pendientes.
- Consulta datos del paciente o el historial desde la ficha de la cita (si está disponible).

---

## Relación con otros módulos

- **Citas:** Las citas que ve el doctor son las mismas que en Citas y Recepción; el portal es una vista filtrada por médico.
- **Recepción:** Recepción marca llegada y pasa a consultorio; el doctor puede ver en su portal la lista actualizada.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
