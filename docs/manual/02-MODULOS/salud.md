# Módulo Salud

## Descripción

**Indicadores de salud del sistema:** estado de la API, conexión a base de datos, servicios externos (notificaciones, mensajería), estado de los schedulers (activos, con errores). Útil para soporte técnico y administradores.

**Ruta:** Salud → `/salud`

---

## Pantalla principal

- Llamada al endpoint de salud del backend (ej. `/api/health` o `/health`).
- **Estado por componente:** API, Base de datos, Notificaciones, Schedulers (Running, Error, etc.).
- Mensajes de **error** o **advertencia** si algún componente falla o está degradado.

---

## Botones y acciones

- No hay acciones de usuario típicas; es una pantalla de **consulta**.
- Si el backend ofrece acciones de mantenimiento (reiniciar scheduler, etc.), podrían aparecer aquí (depende de la implementación).

---

## Flujos típicos

- Verificar que todos los servicios estén en verde antes de reportar un fallo.
- Identificar qué componente (BD, notificaciones, scheduler) está fallando para informar a soporte.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
