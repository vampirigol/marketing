# Expediente del paciente

## Descripción

El **expediente** es la ficha detallada de un paciente: datos personales, contacto, historial de citas y pagos. Se abre desde **Pacientes** al hacer clic en el icono de ojo (Ver). La ruta es `/pacientes/[id]`, donde `[id]` es el identificador del paciente.

**Acceso:** Pacientes → listado → Ver (icono ojo) en la fila del paciente.

---

## Pantalla principal

*(Ilustración: captura de pantalla del expediente – incorporar cuando se disponga.)*

### Encabezado
- Botón **Volver** (regresa al listado de Pacientes).
- **Nombre del paciente** y texto "Expediente #[No. Afiliación]".
- Botón **Editar Paciente** (abre el mismo modal de edición que en el listado).

### Aviso de sucursal
- Si el paciente pertenece a otra sucursal distinta a la seleccionada en el menú, se muestra un aviso en amarillo indicando la sucursal del paciente y la sucursal actual (modo demo o consulta cruzada).

### Columna izquierda (bloques)

#### 1. Información personal
- Nombre completo, fecha de nacimiento, edad, sexo.
- No. Afiliación, tipo de afiliación (ej. Titular).

#### 2. Información de contacto
- Teléfono, WhatsApp, email.
- Dirección completa (calle, colonia, ciudad, estado, código postal).

#### 3. Historial de citas
- Listado de citas recientes: servicio, doctor, sucursal, fecha, hora, estado (Confirmada, Pendiente, Completada, Cancelada).
- Botón **Ver todas** (si está implementado) para listado completo.
- En cada cita, botón **Ver** (ojo) para abrir el detalle de la cita (según implementación).

### Columna derecha (resumen)
- **Resumen de pagos** o actividad reciente: concepto, fecha, monto, método de pago, referencia.
- Tarjetas o indicadores adicionales (estado del paciente, última visita, etc.) según la implementación.

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **Volver** | Navega a `/pacientes` (listado). |
| **Editar Paciente** | Abre el modal de edición con los datos del paciente; al guardar se actualizan nombre, contacto, dirección, etc. |
| **Ver todas** (citas) | Muestra el historial completo de citas del paciente (o redirige a Citas filtrado por paciente, si está implementado). |
| **Ver** (en cada cita) | Abre el detalle de esa cita (modal o ruta a Citas). |

---

## Flujos típicos

1. **Consultar datos del paciente:** Entrar al expediente desde Pacientes → revisar información personal y contacto.
2. **Revisar historial:** Ver el bloque "Historial de Citas" y, si aplica, "Ver todas" para listado completo.
3. **Editar datos:** Clic en "Editar Paciente", modificar campos y guardar.
4. **Revisar pagos:** Consultar el resumen de pagos en la columna derecha.

---

## Relación con otros módulos

- **Pacientes:** El expediente es la vista de detalle de un paciente; se accede desde el listado.
- **Citas:** Las citas del historial son las mismas que en Citas; desde el expediente se puede ir al detalle o agendar nueva cita (si hay botón o enlace).
- **Finanzas:** Los pagos mostrados pueden coincidir con abonos registrados en Finanzas.
- **Doctores:** Desde el portal Doctores el médico puede ver órdenes de laboratorio y datos del paciente; el expediente en Pacientes es la vista de administración/recepción.

---

[Volver al índice de módulos](README.md) | [Pacientes](pacientes.md) | [Visión general](../01-VISION-GENERAL.md)
