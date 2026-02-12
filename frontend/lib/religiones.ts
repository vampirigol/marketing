/**
 * Lista de religiones para formularios (CRM, pacientes, etc.)
 */
export const RELIGIONES = [
  'Católica',
  'Cristiana (otra)',
  'Adventista del Séptimo Día',
  'Bautista',
  'Metodista',
  'Pentecostal',
  'Evangélica',
  'Testigos de Jehová',
  'Mormona (Iglesia de Jesucristo)',
  'Judía',
  'Musulmana',
  'Budista',
  'Hindú',
  'Sin religión',
  'Prefiero no decir',
  'Otra',
] as const;

export type Religion = (typeof RELIGIONES)[number];
