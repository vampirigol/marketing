# 06 – Páginas y rutas adicionales

Rutas que no aparecen en el menú lateral pero son parte del sistema: acceso (login, perfil), portal doctores, página de automatizaciones y flujos públicos para pacientes.

---

## Login (`/login`)

- **Qué es:** Pantalla de inicio de sesión para el personal del CRM.
- **Cuándo se usa:** Al abrir el sistema sin sesión o al cerrar sesión.
- **Campos:** Usuario (o email) y contraseña.
- **Acciones:** Iniciar sesión (valida credenciales y redirige al dashboard o home). Si existe "¿Olvidaste tu contraseña?", seguir el enlace y el flujo que indique la pantalla (depende de la implementación).
- **Nota:** Las credenciales las asigna el administrador. Tras login correcto se guarda el token y los datos del usuario (nombre, rol) para el menú y permisos.
- **Recuperar contraseña:** En la pantalla actual de login no hay enlace "¿Olvidé mi contraseña?". Si no recuerdas la contraseña, debes contactar al **administrador del sistema** o al responsable de TI para que la restablezca o te envíe instrucciones. Si en el futuro se implementa recuperación por correo, el flujo aparecerá en esta misma pantalla (enlace y paso a paso).

---

## Perfil (`/perfil`)

- **Qué es:** Perfil del usuario que tiene sesión iniciada.
- **Acceso:** Menú lateral → clic en el nombre del usuario → "Ver perfil".
- **Contenido típico:** Nombre, correo, rol, cambio de contraseña, avatar/foto (si está implementado).
- **Acciones:** Editar datos, subir foto, cambiar contraseña, guardar.

---

## Automatizaciones (`/automatizaciones`)

- **Qué es:** Página de configuración de las **reglas de automatización** del embudo (leads, citas, SLA, reasignación, etc.).
- **Acceso:** Desde el módulo CRM → botón "Automatizaciones CRM".
- **Contenido:** Listado de reglas (nombre, condiciones, acciones, activa/inactiva); crear, editar, activar/desactivar y eliminar reglas.
- **Relación:** Las reglas descritas en [03 - Automatizaciones y flujos](03-AUTOMATIZACIONES-Y-FLUJOS.md) se gestionan desde esta pantalla (o desde Configuración, según implementación).

---

## Doctores (`/doctores`)

- **Qué es:** Portal o vista orientada a **médicos**: agenda del doctor, citas del día, estadísticas, posible vista móvil.
- **Acceso:** Desde la página de inicio (/) en el bloque "Doctores - Acceso a la versión móvil web".
- **Contenido:** Según implementación: agenda personal, listado de citas, dashboard de desempeño, acceso desde móvil.
- **Usuarios:** Médicos que tienen usuario en el sistema y acceden con su rol.

---

## Reservar (`/reservar`) – Público

- **Qué es:** Página **pública** para que los pacientes soliciten o reserven una cita (sin iniciar sesión en el CRM).
- **Cuándo se usa:** Enlaces desde web de la clínica, redes o mensajes.
- **Flujo típico:** Elegir sucursal, servicio, fecha y ver disponibilidad; elegir slot; datos del paciente (nombre, teléfono, etc.); enviar solicitud. Puede crear solicitud de lista de espera o cita según configuración.
- **Resultado:** Mensaje de confirmación; la solicitud/cita queda pendiente de confirmación o asignación en el CRM/Citas.

---

## Confirmar cita (`/confirmar-cita`) – Público

- **Qué es:** Página **pública** para que el paciente **confirme** su cita mediante un enlace con token (enviado por SMS/WhatsApp/email).
- **Cuándo se usa:** El sistema envía un enlace "Confirmar cita" al paciente; al hacer clic llega a esta ruta con el token en la URL.
- **Flujo:** Se valida el token; se muestra la cita (fecha, hora, sucursal); el paciente confirma o indica que no asistirá. Al confirmar, la cita pasa a estado Confirmada en el sistema.
- **Sin token o inválido:** Mensaje de error y enlace para volver al inicio.

---

## Contacto (`/contacto`)

- **Qué es:** Página de **solicitud de contacto** o formulario para que un visitante o paciente solicite que lo contacten (ej. para agendar, información).
- **Contenido:** Formulario (nombre, teléfono, email, mensaje, sucursal de interés); envío; mensaje de confirmación.
- **Relación:** Las solicitudes pueden alimentar la **cola de contacto** en Keila IA (Matrix) como pendientes o vencidas.

---

## Resumen de rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Público | Página de inicio con enlaces a módulos y Manual. |
| `/login` | Público | Inicio de sesión del personal. |
| `/perfil` | Autenticado | Perfil del usuario (acceso desde menú). |
| `/automatizaciones` | Autenticado | Configuración de reglas de automatización (enlace desde CRM). |
| `/doctores` | Autenticado | Portal/vista para médicos. |
| `/reservar` | Público | Reserva o solicitud de cita por pacientes. |
| `/confirmar-cita` | Público | Confirmación de cita por token. |
| `/contacto` | Público | Solicitud de contacto. |

---

[Volver al índice](00-INDICE-Y-GUIA.md) | [Visión general](01-VISION-GENERAL.md) | [Glosario](05-GLOSARIO-Y-REFERENCIA.md)
