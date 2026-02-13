# Módulo Keila IA (Matrix)

## Descripción

Contact center unificado: **bandeja de conversaciones** (Inbox) por WhatsApp, Facebook, Instagram y otros canales; **vista Kanban** de leads por etapa; **cola de contacto** (solicitudes pendientes y vencidas); **estadísticas** de contactos; y **perfil del paciente** en contexto. Permite responder mensajes, asignar conversaciones, cambiar prioridad, etiquetas, agendar cita desde la conversación y conectar redes sociales (OAuth).

**Arquitectura Multi-Sucursal WhatsApp:** Cada sucursal tiene su **propio número y credenciales de WhatsApp**. Cuando llega un webhook de Meta, el sistema lee `metadata.phone_number_id`, busca en la base de datos qué sucursal (Branch) tiene ese ID y enruta el mensaje **solo a los agentes asignados a esa sucursal**. No hay un único Inbox global: las conversaciones se muestran según la sucursal del número que recibió el mensaje. Ver [07 - Diagramas - Multi-Sucursal](../07-DIAGRAMAS-DE-FLUJO.md).

**Ruta:** Keila IA → `/matrix`

---

## Pantalla principal

### Alternancia de vista
- **Inbox** (bandeja de conversaciones) o **Kanban** (embudo de leads).
- Selector de tema claro/oscuro (opcional).
- Búsqueda global y enlace a **Configuración** (redes, automatizaciones).

### Inbox
- **Lista de conversaciones:** nombre o canalId, canal (WhatsApp, Facebook, Instagram), último mensaje, fecha, estado (activa, pendiente, etc.), etiquetas, asignado a.
- **Filtro por estado:** Todas, Pendientes, Asignadas, etc.
- **Panel de chat:** historial de mensajes y caja para escribir; envío de plantillas si está habilitado.
- **Panel de detalle (ChatDetailsPanel):** datos del contacto, prioridad, etiquetas, asignación; botones para cambiar prioridad, agregar/quitar etiquetas, agendar cita, ver perfil del paciente.
- **Perfil del paciente:** si la conversación está vinculada a un paciente, se muestra resumen (historial, citas).

### Kanban
- Columnas por estado del lead (new, in-progress, open, qualified, etc.).
- Tarjetas con lead (nombre, canal, etiquetas, SLA).
- Arrastrar y soltar para cambiar etapa; acciones rápidas (confirmar, marcar llegada, no asistencia, reagendar) según estado.
- Carga bajo demanda (infinite scroll) por columna.

### Cola de contacto
- **Pendientes:** solicitudes de contacto no asignadas o por atender; tiempo transcurrido (SLA en minutos).
- **Vencidas:** solicitudes que superaron el tiempo de respuesta.
- Acciones: asignar, abrir conversación, agendar cita.

### Estadísticas (contactos)
- Total, Pendientes, Asignadas, En contacto, Resueltas, Canceladas; tiempo promedio de resolución.

---

## Botones y acciones (Inbox)

| Acción | Descripción |
|--------|-------------|
| **Enviar mensaje** | Escribir en la caja y enviar; el mensaje se envía por el canal de la conversación. |
| **Enviar plantilla** | Si está habilitado, elegir plantilla predefinida y enviar. |
| **Cambiar prioridad** | En el panel de detalle; subir o bajar prioridad de la conversación. |
| **Agregar / quitar etiqueta** | Gestionar etiquetas del contacto o conversación. |
| **Agendar cita** | Abre modal para crear cita vinculada al contacto/paciente. |
| **Ver perfil** | Abre el perfil del paciente (historial, citas) si existe vinculación. |
| **Asignar a** | Asignar la conversación a un usuario/agente. |

---

## Botones y acciones (Kanban)

- Igual que en el módulo **CRM**: Confirmar, Marcar llegada, No asistencia, Reagendar, Enviar recordatorio (según configuración). Ver [CRM](crm.md).

---

## Conexión de canales (Facebook / Instagram)

- Si se devuelve de OAuth con `facebook_conectado=1` o `instagram_conectado=1`, el sistema marca el canal como conectado (localStorage).
- La configuración de apps Meta y webhooks se gestiona desde **Configuración** o scripts de backend (ver documentación técnica).

---

## Flujos típicos

1. **Responder conversación:** Inbox → elegir conversación → escribir y enviar (o enviar plantilla).
2. **Agendar cita desde chat:** En el panel de detalle, "Agendar cita"; completar modal; la cita queda vinculada al lead/contacto.
3. **Mover lead en Kanban:** Arrastrar tarjeta a otra columna o usar acción rápida (Confirmar, Marcar llegada, etc.).
4. **Atender cola:** Revisar Pendientes y Vencidas; asignar o abrir conversación y responder.
5. **Cambiar prioridad o etiquetas:** En el panel de detalle de la conversación activa.

---

## Cuidados Espirituales (Servicios Adicionales)

En el **sidebar del Chat o del Perfil del paciente** hay una sección **Servicios Adicionales** con la card **Cuidados Espirituales**:

| Elemento | Descripción |
|----------|-------------|
| **Card** | Fondo violeta claro (bg-purple-50), borde violeta. Título "Cuidados Espirituales". |
| **Botón "Marcar Asistencia"** | Registra que el paciente asistió a Cuidados Espirituales. Actualiza el KPI de atendidos. Si ya asistió, el botón puede mostrarse como "Asistencia Registrada" (estilo verde). |
| **Agendar cita (Cuidados Espirituales)** | Si el servicio requiere cita, se usa el mismo componente de calendario con **tipo de cita** `SPIRITUAL` (`appointment_type = 'SPIRITUAL'`). En el calendario general estas citas se pueden filtrar o mostrar en color violeta. |

Ver [04 - Procesos - Cuidados Espirituales](../04-PROCESOS-DE-NEGOCIO.md) y [07 - Diagramas - Cuidados Espirituales](../07-DIAGRAMAS-DE-FLUJO.md#12-cuidados-espirituales-asistencia-y-agendamiento).

---

## Relación con otros módulos

- **CRM:** Misma lógica de embudo y acciones sobre leads; CRM es por sucursal, Matrix es la bandeja de conversaciones y kanban unificado.
- **Citas:** Agendar cita desde Matrix crea la cita en el sistema; Marcar llegada/No asistencia actualizan la cita.
- **Pacientes:** El perfil del paciente en Matrix muestra datos del expediente y citas.
- **Recepción:** La Lista de Recuperación (No Asistió) puede alimentarse desde inasistencias; Reagendar usa el mismo flujo de citas.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
