export type DiagramaItem = {
  id: number;
  title: string;
  shortDescription: string;
  mermaid: string;
  enPocasPalabras: string;
};

export const DIAGRAMAS: DiagramaItem[] = [
  {
    id: 1,
    title: 'Flujo general: del lead a la conversión',
    shortDescription: 'Desde la persona interesada hasta lead convertido',
    mermaid: `flowchart LR
  A[Persona interesada] --> B[Llega por WhatsApp / Redes / Teléfono]
  B --> C[Asesor la contacta]
  C --> D[Conversación en Keila IA]
  D --> E[Se agenda una cita]
  E --> F[Paciente recibe recordatorios]
  F --> G[Asiste el día de la cita]
  G --> H[Recepción marca llegada]
  H --> I[Pasa a consultorio]
  I --> J[Se atiende y finaliza]
  J --> K[Lead convertido]`,
    enPocasPalabras:
      'La persona entra por algún canal → el asesor la contacta y habla con ella → se agenda una cita → el paciente recibe recordatorios → asiste → en Recepción se marca llegada, se pasa a consultorio y se finaliza → el lead queda convertido.',
  },
  {
    id: 2,
    title: 'Ciclo de vida del lead (con ramas)',
    shortDescription: 'Qué puede pasar con un lead hasta convertirse o perderse',
    mermaid: `flowchart TD
  Start[Lead nuevo entra al sistema] --> Asignar[Se asigna un asesor]
  Asignar --> Contactar[Asesor contacta al lead]
  Contactar --> Respuesta{¿Responde?}
  Respuesta -->|Sí| Interesado[Lead interesado]
  Respuesta -->|No| SinRespuesta[Sin respuesta 24h]
  SinRespuesta --> Reintento[Reintentos automáticos]
  Reintento --> Respuesta
  Interesado --> Agenda[Se agenda cita]
  Agenda --> Confirmar[Recordatorio y confirmación]
  Confirmar --> DíaCita[Llega el día de la cita]
  DíaCita --> Asiste{¿Asiste?}
  Asiste -->|Sí| Llegada[Recepción marca llegada]
  Llegada --> Consultorio[Pasa a consultorio]
  Consultorio --> Atendido[Se finaliza la atención]
  Atendido --> Convertido[Lead convertido]
  Asiste -->|No| Inasistencia[Se registra inasistencia]
  Inasistencia --> Protocolo[Protocolo 7 días]
  Protocolo --> Convertido
  Protocolo --> Perdido[Lead perdido / remarketing]`,
    enPocasPalabras:
      'Al lead se le asigna asesor y se le contacta. Si no responde, hay reintentos. Si responde, se agenda cita; el día de la cita puede asistir (y se convierte) o no asistir (inasistencia y protocolo de 7 días, que puede terminar en convertido o perdido).',
  },
  {
    id: 3,
    title: 'Día a día en Recepción',
    shortDescription: 'Desde que el paciente llega hasta que sale del consultorio',
    mermaid: `flowchart TB
  R1[Recepción abre la pantalla y ve las citas del día]
  R1 --> R2[El paciente llega a la clínica]
  R2 --> R3[Recepción hace clic en Marcar llegada]
  R3 --> R4[La cita pasa a la columna En espera]
  R4 --> R5[Cuando hay consultorio libre, clic en Pasar a consultorio]
  R5 --> R6[La cita queda en estado Atendiendo]
  R6 --> R7{Al terminar la consulta}
  R7 -->|Paciente atendido| R8[Recepción hace clic en Finalizar]
  R7 -->|Paciente no vino| R9[Recepción hace clic en Inasistencia y elige motivo]
  R8 --> R10[Estado final: Completada]
  R9 --> R11[Estado final: Inasistencia]`,
    enPocasPalabras:
      'Recepción ve las citas del día, marca llegada cuando el paciente llega, lo pasa a consultorio cuando corresponde, y al terminar hace "Finalizar" (Completada) o "Inasistencia" según el caso.',
  },
  {
    id: 4,
    title: 'Ciclo de vida de una cita',
    shortDescription: 'Desde que se agenda hasta completada o inasistencia',
    mermaid: `flowchart TB
  C1[Se agenda la cita en Citas o Calendario]
  C1 --> C2[Estado Agendada o Pendiente]
  C2 --> C3[El sistema envia recordatorios automaticos]
  C3 --> C4[Paciente confirma o se da por confirmada]
  C4 --> C5[Llega el dia de la cita]
  C5 --> C6{Llega a tiempo}
  C6 -->|Si| C7[Recepcion marca llegada - En espera]
  C7 --> C8[Recepcion pasa a consultorio - Atendiendo]
  C8 --> C9[Recepcion finaliza - Completada]
  C6 -->|No pasa la hora| C10[Cita pasa a lista de espera]
  C10 --> C11[Al cierre del dia se marca inasistencia]
  C5 --> C12[Recepcion registra Inasistencia manual]
  C11 --> C13[Protocolo 7 dias de seguimiento]
  C12 --> C13`,
    enPocasPalabras:
      'Se agenda → recordatorios → día de la cita. Si llega a tiempo, pasa por En espera → Atendiendo → Completada. Si no llega o no viene, se registra inasistencia y corre el protocolo de 7 días.',
  },
  {
    id: 5,
    title: 'Qué pasa cuando el paciente no asiste (protocolo 7 días)',
    shortDescription: 'Seguimiento automático tras una inasistencia',
    mermaid: `flowchart LR
  A[Se registra inasistencia] --> B[Sistema inicia protocolo]
  B --> C[Día 1 a 7: mensajes y recordatorios]
  C --> D{¿El paciente reagenda o responde?}
  D -->|Sí| E[Nueva cita o seguimiento]
  D -->|No| F[Tras 7 días sin respuesta]
  F --> G[Lead marcado perdido / remarketing]
  E --> H[Vuelve al flujo normal de citas]`,
    enPocasPalabras:
      'Si el paciente no asiste, el sistema intenta contactarlo durante 7 días. Si reagenda o responde, se sigue el flujo normal. Si no, el lead se considera perdido y puede usarse para remarketing.',
  },
  {
    id: 6,
    title: 'Open Ticket: de solicitud a cita',
    shortDescription: 'Solicitud sin fecha: convertir, cancelar o dejar expirar',
    mermaid: `flowchart LR
  A[Open Ticket: solicitud sin fecha] --> B{¿Qué hace el usuario?}
  B -->|Convertir a cita| C[Asigna fecha, hora, doctor y sucursal]
  C --> D[Cita creada. Ticket cerrado]
  B -->|Cancelar| E[Ticket cerrado sin cita]
  B -->|No hace nada| F[Al vencer, sistema cierra el ticket]
  F --> E`,
    enPocasPalabras:
      'Un Open Ticket es una solicitud de cita sin fecha. Se puede convertir en cita (asignando día y hora), cancelar o dejar que expire; en todos los casos el ticket se cierra.',
  },
  {
    id: 7,
    title: 'Lista de espera automática',
    shortDescription: 'Cuando pasó la hora de la cita y el paciente no ha llegado',
    mermaid: `flowchart LR
  A[Cita confirmada, pasó la hora] --> B[¿Pasaron 15 min sin llegada?]
  B -->|Sí| C[Cita pasa a Lista de espera]
  C --> D[Si llega después, Recepción puede marcar llegada]
  C --> E[Si no llega: al cierre del día]
  E --> F[Se marca inasistencia]
  F --> G[Protocolo 7 días]`,
    enPocasPalabras:
      'Si a los 15 minutos no hay llegada, la cita pasa a lista de espera. Si el paciente llega después, se puede marcar llegada; si no, al cierre del día se registra inasistencia y se aplica el protocolo de 7 días.',
  },
  {
    id: 8,
    title: 'Arquitectura Multi-Sucursal WhatsApp',
    shortDescription: 'Enrutamiento de webhooks por número de celular y sucursal',
    mermaid: `flowchart LR
  A[Webhook Meta llega] --> B[Leer metadata.phone_number_id]
  B --> C[Buscar Branch con ese phoneNumberId en DB]
  C --> D{Sucursal encontrada}
  D -->|Sí| E[Enrutar mensaje a agentes de esa Sucursal]
  D -->|No| F[Registro o alerta: número no configurado]
  E --> G[Conversación en Inbox de esa sucursal]`,
    enPocasPalabras:
      'Cada sucursal tiene su propia configuración de WhatsApp (phoneNumberId, accessToken, wabaId). Cuando llega un webhook, el sistema identifica la sucursal por phone_number_id y solo los agentes de esa sucursal ven la conversación.',
  },
  {
    id: 9,
    title: 'Pipeline Contact Center: columnas del Kanban',
    shortDescription: 'Máquina de estados del lead (Leads → Agendado → Confirmado → Cierre)',
    mermaid: `flowchart LR
  L[Leads WhatsApp] --> A[Agendado]
  A --> C[Confirmado]
  C --> P[Pagado / Cerrado]
  A --> NC[No Confirmado]
  NC --> NA[No Asistió]
  NA --> R[Remarketing]
  R --> L
  P --> KPI1[KPI: REVENUE]
  C --> KPI2[KPI: CONFIRMED_COUNT]`,
    enPocasPalabras:
      'El lead entra en Leads WhatsApp; si se agenda pasa a Agendado. Al confirmar (manual o bot) va a Confirmado (incrementa KPI). Pagado/Cerrado incrementa ingresos. No confirmados que pasan la fecha van a No Asistió (cron) y luego a Remarketing.',
  },
  {
    id: 10,
    title: 'Cron: No Confirmado → No Asistió',
    shortDescription: 'Tarea programada que marca no-show y añade a recuperación',
    mermaid: `flowchart TD
  J[Cron cada hora: markNoShows] --> Q[Buscar citas: fecha pasada + status UNCONFIRMED]
  Q --> F{¿Hay citas?}
  F -->|Sí| U[Para cada cita: updateLeadStatus a NO_SHOW]
  U --> R[addToRecoveryList leadId]
  R --> M[Lead en columna No Asistió y lista de recuperación]
  F -->|No| Z[Fin]`,
    enPocasPalabras:
      'Cada hora el sistema busca citas ya pasadas que no fueron confirmadas, actualiza el estado del lead a No Asistió y lo añade a la lista de recuperación para que Recepción pueda contactar y reagendar.',
  },
  {
    id: 11,
    title: 'Reagendar desde lista No Asistió',
    shortDescription: 'Flujo en Recepción: lista de recuperación → modal → RESCHEDULED',
    mermaid: `flowchart LR
  A[Lista de Recuperación - No Asistió] --> B[Data Grid: Nombre, Última cita fallida, Teléfono]
  B --> C[Recepción hace clic en Reagendar]
  C --> D[Se abre Modal de Calendario]
  D --> E[Datos del paciente pre-llenados]
  E --> F[Recepción asigna nueva fecha/hora y guarda]
  F --> G[Estado NO_SHOW → RESCHEDULED]
  G --> H[Lead se mueve en el Kanban]`,
    enPocasPalabras:
      'En el módulo Recepción, la lista de recuperación muestra quienes no asistieron. Al clic en Reagendar se abre el mismo modal de citas con datos pre-llenados; al guardar el lead pasa a reagendado y se actualiza el Kanban.',
  },
  {
    id: 12,
    title: 'Cuidados Espirituales: asistencia y agendamiento',
    shortDescription: 'Servicio adicional: marcar asistencia y citas tipo SPIRITUAL',
    mermaid: `flowchart TD
  S[Sidebar Chat/Perfil: Servicios Adicionales] --> C[Card Cuidados Espirituales]
  C --> B[Botón Marcar Asistencia]
  B --> M[markAsAttended SPIRITUAL_CARE]
  M --> K[KPI atendidos Cuidados Espirituales]
  C --> AG[Agendar cita tipo SPIRITUAL]
  AG --> CAL[Modal Calendario appointment_type = SPIRITUAL]
  CAL --> V[En calendario general: color violeta]`,
    enPocasPalabras:
      'En el perfil del paciente o chat hay una sección Cuidados Espirituales: botón para marcar asistencia (actualiza KPI) y opción de agendar cita especial; en el calendario estas citas se distinguen por tipo (ej. color violeta).',
  },
  {
    id: 13,
    title: 'Encuesta de calidad post-venta',
    shortDescription: 'Envío automático al cerrar ganado o registrar pago',
    mermaid: `flowchart LR
  U[updateStatus leadId, newStatus] --> T{newStatus = CLOSED_WON o PAYMENT_RECEIVED?}
  T -->|Sí| S[SurveyService.sendQualitySurvey leadId]
  S --> V[Verificar canal activo: WhatsApp o Instagram]
  V --> W[Seleccionar plantilla encuesta_calidad_v1]
  W --> X[Enviar mensaje con link al formulario]
  T -->|No| Z[Fin sin encuesta]`,
    enPocasPalabras:
      'Cuando el lead pasa a Pagado/Cerrado ganado, el sistema dispara automáticamente el envío de la encuesta de calidad por el canal por el que se contactó (WhatsApp o Instagram), usando la plantilla configurada.',
  },
];

export function getDiagramaById(id: number): DiagramaItem | undefined {
  return DIAGRAMAS.find((d) => d.id === id);
}
