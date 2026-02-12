# Proceso CRM y Embudo de Ventas – Contact Center

## Flujo implementado

### 1. Entrada del lead
- **Canales:** redes sociales (Instagram, Facebook, TikTok, YouTube, WhatsApp), llamada por publicidad, correo (hola@clinicasadventistas.org), formulario (www.clinicasadventistas.org).
- Al recibir el mensaje/solicitud:
  - Se crea una **solicitud de contacto** (lead) en etapa **Lead**.
  - Se asigna automáticamente el **número de afiliado** (formato RCA-YYYY-NNNNN, sin duplicados).
  - Se notifica al usuario de contact center (si está configurado el servicio de notificaciones).

### 2. Contact Center
- Todos los mensajes se reciben en el **centro de Contact Center** (embudo "Contact Center").
- En la conversación se recaban: lugar desde el que escribe, servicio/especialidad, si desea agendar, etc.
- **Solo se muestran leads aún no convertidos** (sin cita creada). Los ya convertidos dejan de aparecer aquí.

### 3. Conversión (Convertir a Paciente)
- Cuando el lead confirma que desea ser agendado y los datos están completos, se hace clic en **Convertir**.
- Se crea el **paciente** en backend y la **cita** en backend (sucursal, doctor, fecha y hora elegidos).
- La cita se refleja en:
  - **Recepción** (por sucursal y fecha)
  - **Embudo de la sucursal** seleccionada (ej. Ciudad Juárez)
  - **Calendario de citas**
- Se envía la **notificación por WhatsApp** (confirmación de cita) desde el backend.
- La ficha del lead se **actualiza** en backend con:
  - `cita_id` = id de la cita creada
  - `sucursal_id` y `sucursal_nombre` = sucursal elegida en el modal
  - `crm_status` = citas-locales

### 4. Después de la conversión
- La ficha **sale del embudo de Contact Center** (ya no se lista al no tener `cita_id` nulo).
- Pasa a estar **solo en el embudo de la sucursal** seleccionada (ej. Sucursal Ciudad Juárez).
- La recepcionista de esa sucursal puede seguir la comunicación con ese contacto agendado.

### 5. Opciones en la tarjeta (embudo de sucursal)
Para cada tarjeta en **Citas Locales** o **Confirmada**:
- **Confirmar cita** (etapas previas)
- **Asistencia** (marca como “Marcar llegada” → Atendida)
- **No asistencia** (marca como No show)

---

## Mejoras sugeridas al proceso

1. **Unificar origen del lead con el canal**
   - Hoy las solicitudes pueden crearse por formulario/web o por integración. Unificar con los canales (WhatsApp, Instagram, etc.) y etiquetar bien el origen (TikTok, YouTube, email, web) para reportes y SLA por canal.

2. **Notificación “nuevo lead” a Contact Center**
   - El caso de uso ya llama a `notificarAgentesSucursal`. Asegurar que el **NotificationService** envíe realmente a los usuarios de contact center (push, email o integración con el centro de mensajería) para que no dependan solo de refrescar la vista.

3. **SLA por etapa**
   - Definir tiempos máximos por etapa (Lead → Prospecto → Cita pendiente) y alertas o colores en la tarjeta cuando se acerque o se incumpla el SLA (ya hay base en automatizaciones).

4. **Sincronización conversaciones ↔ solicitudes**
   - Si los leads también entran por Matrix/Keila (conversaciones), valorar crear o vincular una **solicitud de contacto** desde el webhook cuando llegue un mensaje nuevo, para que todo aparezca en el mismo embudo y con el mismo número de afiliado.

5. **Recordatorios desde la sucursal**
   - En el embudo de sucursal, permitir “Enviar recordatorio” desde la tarjeta (WhatsApp/SMS) para confirmar cita o recordar asistencia, sin salir del CRM.

6. **Filtros y búsqueda en embudo**
   - Añadir filtro por fecha de creación, canal, sucursal (en Contact Center) y búsqueda por nombre/teléfono para localizar leads y tarjetas rápido.

7. **Cierre de ciclo en Citas**
   - Para tarjetas con `CitaId`, al marcar **Asistencia** o **No asistencia**, opcionalmente actualizar el **estado de la cita** en el módulo Citas (Llegó, No_Asistio) vía API para mantener un solo estado de verdad.

8. **No. de afiliado en conversión**
   - Si el lead ya tenía número de afiliado asignado al crearse, el modal “Convertir” lo muestra y se reutiliza al crear el paciente, evitando duplicados y manteniendo trazabilidad.

---

## Archivos clave

| Área | Archivo |
|------|---------|
| Backend – leads CRM | `src/api/controllers/CrmController.ts` |
| Backend – solicitudes | `src/infrastructure/database/repositories/SolicitudContactoRepository.ts` |
| Backend – migración cita_id / no_afiliacion | `src/infrastructure/database/migrations/030_solicitudes_cita_id_no_afiliacion.sql` |
| Backend – crear solicitud (no. afiliado) | `src/api/controllers/ContactoController.ts`, `SolicitarContactoAgente.ts` |
| Frontend – conversión | `frontend/lib/conversion.service.ts` |
| Frontend – modal convertir | `frontend/components/matrix/ConversionModal.tsx` |
| Frontend – embudos y acciones | `frontend/lib/crm-funnels.service.ts` |
| Frontend – página CRM | `frontend/app/crm/page.tsx` |
| Frontend – tarjeta (Confirmar / Asistencia / No asistencia) | `frontend/components/matrix/LeadCard.tsx` |
