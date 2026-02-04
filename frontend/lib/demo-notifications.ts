export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'cita' | 'mensaje' | 'pago' | 'alerta';
  read: boolean;
}

export const demoNotifications: DemoNotification[] = [
  {
    id: 'n1',
    title: 'Recordatorio de cita',
    message: 'Cita con María González mañana a las 10:00 AM.',
    time: 'Hace 5 min',
    type: 'cita',
    read: false,
  },
  {
    id: 'n2',
    title: 'Nuevo mensaje',
    message: 'WhatsApp: “¿Tienen horario disponible?”',
    time: 'Hace 20 min',
    type: 'mensaje',
    read: false,
  },
  {
    id: 'n3',
    title: 'Pago registrado',
    message: 'Pago confirmado de $850.00 MXN.',
    time: 'Hace 2 h',
    type: 'pago',
    read: true,
  },
  {
    id: 'n4',
    title: 'Alerta de seguimiento',
    message: 'Lead sin contacto en 24h (Juan Pérez).',
    time: 'Hace 4 h',
    type: 'alerta',
    read: false,
  },
];
