# Módulo Configuración

## Descripción

Ajustes del sistema; según la implementación puede incluir **promociones** (códigos, descuentos, vigencia, sucursales), parámetros por sucursal, plantillas de mensajes, integraciones (Meta/WhatsApp), reglas de automatización, usuarios y permisos. Acceso típico para administradores.

**Ruta:** Configuración → `/configuracion`

---

## Pantalla principal (ejemplo: Promociones)

- **Pestañas:** Activas, Programadas, Historial (para promociones).
- **Listado de promociones:** nombre, código, descripción, tipo (descuento %, descuento fijo, precio especial), valor, servicios, vigencia (inicio–fin), estado (Activa, Programada, Vencida, Pausada), usos (actual/máximo), sucursales, condiciones.
- **Botones:** Nueva promoción, Editar, Ver, Pausar/Activar, Eliminar (según permisos).

### Modal de promoción (crear/editar)
- **Nombre**, **código**, **descripción**.
- **Tipo:** descuento porcentaje, descuento fijo, precio especial.
- **Valor:** número (% o monto).
- **Servicios:** lista de servicios a los que aplica.
- **Vigencia:** fecha inicio y fecha fin.
- **Usos máximos** (opcional).
- **Sucursales:** Todas o selección.
- **Condiciones** (texto libre).
- **Estado:** Activa, Programada, Pausada.
- Guardar y Cancelar.

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **Nueva promoción** | Abre modal para crear promoción. |
| **Editar** | Abre modal con la promoción seleccionada para modificar. |
| **Ver** | Solo lectura del detalle (si está disponible). |
| **Pausar / Activar** | Cambia el estado de la promoción. |
| **Eliminar** | Elimina la promoción (puede requerir confirmación). |

---

## Otras secciones posibles

- **General:** nombre de la organización, zona horaria, idioma.
- **Notificaciones:** activar/desactivar canales, plantillas.
- **Integraciones:** conexión Meta (Facebook/Instagram), **WhatsApp Business por sucursal**: cada sucursal (Branch) tiene su propia configuración de WhatsApp (phoneNumberId, accessToken, wabaId) en lugar de una configuración global única; URLs de webhooks y verificación. El webhook enrutará los mensajes según el `phone_number_id` recibido. Ver [07 - Diagramas - Multi-Sucursal](../07-DIAGRAMAS-DE-FLUJO.md).
- **Automatizaciones:** enlace a la página de reglas de automatización (embudo, contact center).
- **Usuarios y roles:** alta y edición de usuarios, asignación de roles y permisos.

*(La disponibilidad de cada sección depende de la implementación actual.)*

---

## Flujos típicos

- Crear o editar una promoción para usarla al agendar o reagendar citas.
- Revisar promociones programadas o vencidas.
- Configurar integraciones y webhooks (documentación técnica o scripts en el backend).
- Gestionar usuarios y permisos (si está en este módulo).

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
