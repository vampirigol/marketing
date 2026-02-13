# Módulo Pacientes

## Descripción

Listado y gestión de pacientes: datos personales, contacto, No. Afiliación, ubicación, última cita, estado (Activo/Inactivo). Permite buscar, crear, editar y abrir el expediente de cada paciente. Incluye KPIs (total, nuevos en el mes, con citas hoy, pendientes) y filtros por sucursal y búsqueda.

**Ruta:** Pacientes → `/pacientes`

---

## Pantalla principal

### Encabezado
- Título "Pacientes" y subtítulo "Gestión completa de pacientes · [Sucursal actual]".
- Botón **Nuevo Paciente** (abre modal de alta).

### KPIs (cuatro tarjetas)
| KPI | Descripción |
|-----|-------------|
| **Total Pacientes** | Cantidad de pacientes que cumplen el filtro actual (sucursal + búsqueda). |
| **Nuevos (Este Mes)** | Pacientes con fecha de registro en el mes actual. |
| **Con Citas Hoy** | Pacientes distintos con al menos una cita hoy en la sucursal seleccionada. |
| **Pendientes** | Citas de hoy en estado Pendiente_Confirmacion o Agendada. |

### Búsqueda y filtros
| Elemento | Acción |
|----------|--------|
| **Buscar** | Campo de búsqueda por nombre, teléfono, email o No. Afiliación. Filtra la tabla en tiempo real. |
| **Filtros** | Botón para ampliar criterios (por implementar o ampliar). |
| **Exportar** | Exportar listado (por implementar). |
| **Importar** | Importar pacientes (por implementar). |

### Tabla de pacientes
Columnas: **Paciente** (avatar con iniciales y nombre), **Contacto** (teléfono, email), **No. Afiliación**, **Edad**, **Ubicación** (ciudad), **Última Cita** (fecha), **Estado** (Activo/Inactivo), **Acciones**.

### Acciones por fila
| Botón | Acción |
|-------|--------|
| **Ojo (Ver)** | Navega al **expediente** del paciente: `/pacientes/[id]`. En el expediente se ven datos personales, contacto, historial de citas y pagos. Ver [Expediente del paciente](expediente-paciente.md). |
| **Lápiz (Editar)** | Abre el modal de edición con los datos del paciente seleccionado. |

### Paginación
- Texto "Mostrando X–Y de Z pacientes" y botones Anterior, números de página, Siguiente.

### Modal de paciente (crear/editar)
- Se abre con **Nuevo Paciente** (paciente vacío) o con **Editar** (paciente seleccionado).
- Campos típicos: nombre, teléfono, email, No. Afiliación, edad, ciudad, etc. (según componente PacienteModal).
- **Guardar** y **Cerrar/Cancelar**.

---

## Flujos típicos

1. **Crear paciente:** Clic en "Nuevo Paciente", completar formulario en el modal, Guardar.
2. **Buscar paciente:** Escribir en la caja de búsqueda (nombre, teléfono, email o No. Afiliación); la tabla se filtra al instante.
3. **Ver expediente:** Clic en el icono de ojo; se abre la página del paciente con historial, citas, etc.
4. **Editar paciente:** Clic en el icono de lápiz; en el modal ajustar datos y Guardar.
5. **Cambiar sucursal:** La sucursal actual (del menú lateral) afecta "Con Citas Hoy" y "Pendientes"; el listado de pacientes puede filtrarse por ciudad/sucursal según implementación.

---

## Relación con otros módulos

- **Citas / Calendario:** Al agendar una cita se selecciona o crea paciente; el expediente muestra historial de citas.
- **Recepción:** Las citas del día muestran el nombre del paciente; desde Pacientes se puede ver el mismo paciente y su historial.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
