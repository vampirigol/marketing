# Módulo Mensajero

## Descripción

Envío de mensajes y plantillas a pacientes o contactos por los canales configurados (WhatsApp, etc.). Sirve para recordatorios manuales, campañas o comunicaciones masivas dirigidas. Complementa las automatizaciones y al contact center (Keila IA).

**Ruta:** Mensajero → `/mensajero`

---

## Pantalla principal

- Selector de **destinatarios** (lista, filtro por paciente/sucursal, importación) o selección de **plantilla**.
- **Editor de mensaje** o vista previa de la plantilla (texto, variables si aplica).
- **Canal** de envío (si hay varios configurados).
- Botón **Enviar** y posible historial de envíos recientes.

*(El detalle de campos y botones puede variar según la implementación actual; aquí se describe el propósito del módulo.)*

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **Seleccionar destinatarios** | Elegir uno o varios pacientes/contactos para enviar el mensaje. |
| **Elegir plantilla** | Si hay plantillas configuradas, seleccionar una y rellenar variables (nombre, fecha, etc.). |
| **Enviar** | Envía el mensaje o la plantilla por el canal seleccionado. |
| **Historial** | Ver envíos recientes (si está disponible). |

---

## Flujos típicos

- Enviar recordatorio manual a un paciente o grupo.
- Enviar campaña con plantilla a una lista filtrada.
- Probar una plantilla antes de usarla en automatizaciones.

---

## Relación con otros módulos

- **Keila IA:** Las conversaciones se responden en tiempo real en Matrix; el Mensajero es para envíos iniciados por el usuario (no por mensaje entrante).
- **Citas / Automatizaciones:** Los recordatorios automáticos los envían los schedulers; el Mensajero es para envíos bajo demanda.
- **Configuración:** Las plantillas pueden configurarse en Configuración o en el backend.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
