# Módulo Calendario

## Descripción

Vista unificada de **citas** y **eventos de calendario**: por día, semana, mes o vista "Programar". Permite crear y editar eventos (reuniones, bloques), ver citas y saltar a Citas para gestionarlas. Los eventos son configurables (título, fecha/hora, color).

**Ruta:** Calendario → `/calendario`

---

## Pantalla principal

### Selectores
- **Vista:** Día, Semana, Mes, Programar.
- **Tipo de calendario:** Personal o Compañía (afecta qué eventos se cargan).
- **Fecha** y navegación (hoy, anterior, siguiente).
- **Búsqueda:** filtra eventos y citas por título/nombre.

### Contenido según vista
- **Día:** Franjas horarias con bloques de citas y eventos; clic en slot vacío para crear evento.
- **Semana:** Matriz días × horas; citas y eventos con color.
- **Mes:** Cuadrícula del mes con indicadores por día; clic en día para ver detalle o crear.
- **Programar:** Vista extendida (ej. 2 semanas) para planificación.

### Elementos en la grilla
- **Cita:** Muestra paciente o título; color típico azul; clic lleva a Citas con la fecha correspondiente.
- **Evento:** Muestra título y horario; clic abre modal de edición o detalle.

---

## Botones y acciones

| Acción | Descripción |
|--------|-------------|
| **Crear evento** | Botón o clic en slot vacío; abre modal con título, fecha inicio, fecha fin, color. Al guardar se crea el evento en el calendario. |
| **Editar evento** | Clic en un evento; en el modal se puede cambiar título, fechas y color; Guardar actualiza. |
| **Eliminar evento** | Desde el modal de edición; elimina el evento del calendario. |
| **Clic en cita** | Redirige a `/citas?fecha=YYYY-MM-DD` para gestionar la cita en el módulo Citas. |

---

## Filtros

- **Búsqueda:** Filtra en tiempo real por texto en el título del evento o nombre de la cita.
- **Espacios disponibles:** Opción para resaltar o filtrar solo huecos libres (si está implementado).

---

## Flujos típicos

1. **Ver agenda:** Elegir vista (día/semana/mes), tipo de calendario y fecha; revisar citas y eventos.
2. **Crear evento:** Clic en "Nuevo evento" o en un slot vacío; completar título y rango de fechas; guardar.
3. **Editar evento:** Clic en el evento; modificar datos en el modal; guardar.
4. **Ir a una cita:** Clic en la cita; se abre Citas en la fecha de la cita para editar o marcar llegada allí.

---

## Relación con otros módulos

- **Citas:** Las citas se muestran en el calendario; la creación y edición de citas se hace en el módulo Citas. El calendario es vista de lectura/contexto para citas más eventos propios.
- **Recepción:** No modifica el calendario; usa las mismas citas del día por sucursal.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
