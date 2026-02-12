import { Lead, CanalType } from '@/types/matrix';

interface LeadPrediction {
  probabilidad: number; // 0-100
  insight: string;
  mejorMomento: string;
  siguienteAccion: string;
  razones: string[];
}

const statusBaseScore: Partial<Record<Lead['status'], number>> = {
  new: 0.45,
  reviewing: 0.55,
  rejected: 0.1,
  qualified: 0.7,
  open: 0.5,
  'in-progress': 0.62,
  'open-deal': 0.78,
  'agendados-mobile': 0.6,
  'citas-locales': 0.65,
};

const canalBoost: Partial<Record<CanalType, number>> = {
  whatsapp: 0.07,
  tiktok: 0.06,
  instagram: 0.05,
  youtube: 0.04,
  'fan-page': 0.03,
  facebook: 0.02,
  email: 0.01,
  'google-ads': 0.04,
};

export function obtenerPrediccionLead(lead: Lead): LeadPrediction {
  let score = statusBaseScore[lead.status] ?? 0.5;
  const razones: string[] = [];

  score += canalBoost[lead.canal] ?? 0;
  razones.push(`Canal ${lead.canal}`);

  if (lead.valorEstimado) {
    if (lead.valorEstimado >= 10000) {
      score += 0.08;
      razones.push('Valor alto');
    } else if (lead.valorEstimado >= 5000) {
      score += 0.05;
      razones.push('Valor medio-alto');
    } else if (lead.valorEstimado >= 1000) {
      score += 0.02;
      razones.push('Valor medio');
    }
  }

  if (lead.asignadoA) {
    score += 0.02;
    razones.push('Asignado a vendedor');
  }

  if (lead.etiquetas?.includes('Urgente')) {
    score += 0.05;
    razones.push('Etiqueta urgente');
  }

  if (lead.etiquetas?.includes('Promoción')) {
    score -= 0.02;
    razones.push('Promoción activa');
  }

  const diasDesdeCreacion = Math.floor(
    (Date.now() - new Date(lead.fechaCreacion).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diasDesdeCreacion <= 2) {
    score += 0.03;
    razones.push('Lead reciente');
  } else if (diasDesdeCreacion > 14) {
    score -= 0.05;
    razones.push('Lead antiguo');
  }

  score = Math.max(0.05, Math.min(0.95, score));
  const probabilidad = Math.round(score * 100);

  const mejorMomento =
    lead.canal === 'instagram'
      ? '5:00–7:00 pm'
      : lead.canal === 'tiktok'
      ? '6:00–8:00 pm'
      : lead.canal === 'youtube'
      ? '3:00–5:00 pm'
      : '10:00–12:00 pm';

  let siguienteAccion = 'Enviar caso de éxito por mensaje directo';
  if (lead.status === 'new') siguienteAccion = 'Enviar mensaje de bienvenida';
  if (lead.status === 'reviewing') siguienteAccion = 'Programar llamada de descubrimiento';
  if (lead.status === 'qualified') siguienteAccion = 'Enviar propuesta personalizada';
  if (lead.status === 'open-deal') siguienteAccion = 'Compartir comparativa y cerrar objeciones';

  return {
    probabilidad,
    insight: `Este lead tiene ${probabilidad}% prob. de convertir` ,
    mejorMomento,
    siguienteAccion,
    razones,
  };
}
