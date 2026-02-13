# 05 – Glosario y referencia

Términos y estados usados en el manual y en el sistema.

---

## Estados de la cita (backend / sistema)

| Código / valor | Significado | Dónde se usa |
|----------------|-------------|--------------|
| Agendada | Cita creada, pendiente de confirmación o llegada | Citas, Calendario, Recepción (como "Pendiente") |
| Confirmada | Confirmada por paciente o proceso | Recepción (como "En Espera" antes de llegar), recordatorios |
| En_Consulta | Paciente en consultorio | Recepción ("Atendiendo") |
| Atendida | Cita finalizada correctamente | Recepción ("Completada") |
| No_Asistio | No llegó o se registró inasistencia | Recepción ("Inasistencia"), inasistencias, protocolo 7 días |
| Cancelada | Cita cancelada | Citas, reportes |
| En_Lista_Espera | Pasó la hora y no llegó; movida por scheduler | Lista de espera, cierre del día |

---

## Estados de la cita en pantalla (Recepción)

| En pantalla | Equivale a (backend) |
|-------------|----------------------|
| Pendiente | Agendada |
| En Espera | Confirmada (llegó, esperando consultorio) |
| Atendiendo | En_Consulta |
| Completada | Atendida |
| Inasistencia | No_Asistio o Cancelada (según contexto) |

---

## Estados del lead (CRM / embudo)

*(Pueden variar según configuración del embudo.)*

| Estado típico | Significado |
|---------------|-------------|
| new / pendiente | Lead nuevo, sin contacto |
| reviewing / en contacto | En proceso de contacto o negociación |
| in-progress | Cita agendada o en curso |
| open | Confirmada / abierta |
| qualified / convertida | Cita atendida o lead convertido |
| Perdido | Sin respuesta tras protocolo (ej. 7 días) o cierre negativo |

---

## Etiquetas frecuentes (leads / contactos)

- **Lead:** contacto nuevo en embudo.
- **Reintento:** sin respuesta 24 h, se reintenta.
- **Confirmación:** cita pendiente de confirmar.
- **No show:** no llegó a la cita.
- **Perdido:** inasistencia sin respuesta 7 días o cierre.
- **Atendida:** cita ya atendida.
- **Remarketing:** lead sin cita 14 días o para campaña.
- **Reagendar:** pendiente de reagendar.

---

## Open Ticket

- **Qué es:** Solicitud de cita en estado "abierto" (ticket con vigencia en días). Se puede **convertir a cita** (asignar slot), enviar **encuesta de satisfacción** o **cancelar**.
- **Dónde se usa:** En el módulo Citas (tarjetas o listado de tickets); un scheduler cierra los tickets vencidos automáticamente. Ver [Citas - Open Tickets](02-MODULOS/citas.md#open-tickets-tickets-abiertos).

---

## Laboratorio (órdenes)

- **Qué es:** Órdenes de laboratorio para pacientes (estudios, resultados). No hay un módulo "Laboratorio" en el menú; la gestión se hace desde el **portal Doctores**.
- **Desde Doctores:** Crear orden de laboratorio (paciente, estudio, etc.), ver lista de órdenes por paciente, adjuntar o consultar resultados (según implementación).

---

## Schedulers (nombres técnicos)

- **WaitListScheduler:** lista de espera automática (cada 15 min).
- **AutoClosureScheduler:** cierre del día (23:00).
- **InasistenciaScheduler:** protocolo 7 días e inasistencias.
- **ReminderScheduler:** recordatorios de cita.
- **TimeZoneScheduler:** zonas horarias.
- **CalendarioRecordatorioScheduler:** recordatorios de calendario.
- **CitasRecordatorioScheduler:** recordatorios de citas (tabla).
- **ExpiracionOpenTicketsScheduler:** expiración de open tickets.
- **AutomationScheduler:** reglas de automatización (cada minuto).

---

## Módulos y rutas

| Módulo / Página | Ruta |
|-----------------|------|
| Inicio | `/` |
| Login | `/login` |
| Perfil | `/perfil` |
| Dashboard | `/dashboard` |
| CRM | `/crm` |
| Recepción | `/recepcion` |
| Pacientes | `/pacientes` |
| Citas | `/citas` |
| Calendario | `/calendario` |
| Keila IA | `/matrix` |
| Mensajero | `/mensajero` |
| Brigadas Médicas | `/brigadas-medicas` |
| Finanzas | `/finanzas` |
| Reportes | `/reportes` |
| Salud | `/salud` |
| Auditoría | `/auditoria` |
| Configuración | `/configuracion` |
| Automatizaciones | `/automatizaciones` |
| Doctores (portal) | `/doctores` |
| Manual CRM | `/manual` |
| Reservar (público) | `/reservar` |
| Confirmar cita (público) | `/confirmar-cita` |
| Contacto | `/contacto` |

---

## Sucursal actual

Sucursal seleccionada en el menú lateral. Afecta a Recepción, Citas, Calendario y otros módulos que filtran por sucursal. Se guarda en el navegador hasta que el usuario la cambie.

---

*Para más detalle de pantallas y botones, ver [02 - Módulos](02-MODULOS/). Para automatizaciones, [03](03-AUTOMATIZACIONES-Y-FLUJOS.md). Para flujos de negocio, [04](04-PROCESOS-DE-NEGOCIO.md).*
