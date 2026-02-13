# 01 – Visión general del sistema

*Manual CRM RCA – Versión 1.0 – Febrero 2026.*

---

## Qué es el CRM RCA

El **CRM RCA** (Red de Clínicas Adventistas) es la plataforma integral para la gestión clínica: pacientes, citas, recepción, contact center (Keila IA), finanzas, brigadas médicas, reportes y automatizaciones. Centraliza la operación de la red de clínicas en un solo sistema.

### Principales capacidades

- **Gestión de pacientes:** expedientes, historial clínico, datos de contacto.
- **Citas y calendario:** agendar, reagendar, disponibilidad por sucursal y doctor, lista de espera.
- **Recepción:** marcar llegada, pasar a consultorio, completar cita, registrar inasistencia.
- **Contact center (Keila IA / Matrix):** conversaciones por WhatsApp, Facebook, Instagram; embudo de leads; conversión a cita.
- **Automatizaciones:** recordatorios de citas, lista de espera automática, protocolo de inasistencias, reglas de negocio.
- **Finanzas:** abonos, cortes de caja, reportes de ingresos.
- **Brigadas médicas:** registro de atenciones y reportes.
- **Auditoría y configuración:** trazabilidad de acciones y ajustes del sistema.

---

## Acceso al sistema

- **URL:** la que haya configurado tu organización (ej. `https://tu-dominio.com` o `http://localhost:3000` en desarrollo).
- **Login:** en `/login` se ingresa con usuario y contraseña. Las credenciales las asigna el administrador. Si no tienes sesión, al intentar abrir una ruta protegida te redirigirán al login.
- Tras iniciar sesión se muestra el **menú lateral** y la pantalla principal según el módulo seleccionado.
- **Perfil:** desde el menú lateral (clic en tu nombre) puedes ir a "Ver perfil" (`/perfil`) para ver o editar tus datos y cambiar contraseña (si está habilitado).

---

## Menú principal (barra lateral)

El menú lateral incluye, en este orden:

| Orden | Nombre en menú | Ruta | Uso principal |
|-------|----------------|------|----------------|
| 1 | Dashboard | `/dashboard` | Vista general, KPIs, accesos rápidos |
| 2 | CRM | `/crm` | Embudo de leads, kanban por estado |
| 3 | Recepción | `/recepcion` | Llegadas y estados de citas del día |
| 4 | Pacientes | `/pacientes` | Listado y expedientes de pacientes |
| 5 | Citas | `/citas` | Gestión de citas y agendamiento |
| 6 | Calendario | `/calendario` | Vista de agenda por semana/mes |
| 7 | Keila IA | `/matrix` | Contact center y conversaciones |
| 8 | Mensajero | `/mensajero` | Envío de mensajes/plantillas |
| 9 | Brigadas Médicas | `/brigadas-medicas` | Brigadas y atenciones |
| 10 | Finanzas | `/finanzas` | Abonos y cortes |
| 11 | Reportes | `/reportes` | Análisis y estadísticas |
| 12 | Salud | `/salud` | Estado del sistema |
| 13 | Auditoría | `/auditoria` | Registro de acciones |
| 14 | Configuración | `/configuracion` | Ajustes del sistema |
| 15 | Manual CRM | `/manual` | Este manual y documentación |

Debajo del menú aparecen:

- **Sucursal:** selector de sucursal (ej. Guadalajara). Afecta a recepción, citas y otros módulos que filtran por sucursal.
- **Usuario:** nombre y rol; al hacer clic se puede ir a *Ver perfil* o *Cerrar sesión*.

---

## Roles y perfiles

El sistema puede distinguir distintos roles (por ejemplo administrador, recepción, médico, contact center, finanzas). Los permisos y las pantallas visibles pueden variar según el rol asignado a tu usuario. Si no ves un módulo o una acción, puede deberse a restricciones de tu perfil; en ese caso contacta al administrador.

---

## Sucursal actual

Varios módulos (Recepción, Citas, Calendario, etc.) dependen de la **sucursal seleccionada** en el menú. La sucursal se guarda en el navegador (localStorage) y se mantiene entre sesiones hasta que la cambies. Siempre verifica que tengas seleccionada la sucursal correcta antes de operar.

---

## Requisitos del sistema

- **Navegador:** Chrome, Firefox, Edge o Safari actualizados (recomendado para compatibilidad).
- **JavaScript:** debe estar activado (el sistema es una aplicación web).
- **Cookies:** se usan para la sesión (login) y preferencias (ej. sucursal actual).
- **Conexión:** se necesita internet para acceder al sistema y a la API del backend.
- **Dispositivo:** uso en escritorio o tablet; en móvil algunas pantallas (Citas, Calendario, Matrix) pueden adaptarse según implementación.

---

## Problemas frecuentes

| Situación | Qué hacer |
|-----------|------------|
| No carga la página o sale error de conexión | Comprobar internet; si persiste, verificar que el servidor (frontend/backend) esté en marcha. |
| "No autorizado" o redirección al login | La sesión expiró; volver a iniciar sesión. |
| No veo un módulo del menú | Puede ser restricción por rol; contactar al administrador para permisos. |
| La sucursal no es la correcta | Cambiar la sucursal en el selector del menú lateral (debajo de los módulos). |
| Un botón no hace nada o da error | Recargar la página (F5); si sigue, anotar el mensaje de error y reportar a soporte. |
| Los datos no se actualizan | Recargar la página o salir y volver a entrar al módulo. |

---

## Soporte

- Para **acceso, permisos o credenciales:** contactar al administrador del sistema o al responsable de TI de la organización.
- Para **errores técnicos o dudas de uso:** usar el canal que haya definido tu organización (correo, ticket, teléfono). Si tienes este manual en una copia local o en la app, la versión puede variar; en caso de duda, consultar con el equipo que mantiene el CRM.

---

## Siguiente paso

- Para el uso día a día de una pantalla concreta, ve a **[02 - Módulos](02-MODULOS/)** y abre el documento del módulo que te interese (por ejemplo [Recepción](02-MODULOS/recepcion.md) o [Citas](02-MODULOS/citas.md)).
