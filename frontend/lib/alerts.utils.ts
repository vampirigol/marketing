import { AlertSettings, Lead } from '@/types/matrix';

export interface ContextualAlert {
  id: 'hot-lead' | 'stalled-deal' | 'price-opportunity';
  label: string;
  severity: 'high' | 'medium' | 'info';
  description: string;
}

export const defaultAlertSettings: AlertSettings = {
  hotLeadHours: 24,
  stalledDealDays: 7,
  pricePageViews: 3,
};

const STORAGE_KEY = 'matrix.alertSettings';

export function getAlertSettings(): AlertSettings {
  if (typeof window === 'undefined') return defaultAlertSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAlertSettings;
    const parsed = JSON.parse(raw) as Partial<AlertSettings>;
    return {
      hotLeadHours: parsed.hotLeadHours ?? defaultAlertSettings.hotLeadHours,
      stalledDealDays: parsed.stalledDealDays ?? defaultAlertSettings.stalledDealDays,
      pricePageViews: parsed.pricePageViews ?? defaultAlertSettings.pricePageViews,
    };
  } catch {
    return defaultAlertSettings;
  }
}

export function saveAlertSettings(settings: AlertSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function evaluarAlertasContextuales(
  lead: Lead,
  settings: AlertSettings = defaultAlertSettings
): ContextualAlert[] {
  const alerts: ContextualAlert[] = [];

  const lastContact = lead.fechaUltimoContacto ?? lead.fechaActualizacion ?? lead.fechaCreacion;
  const hoursSinceContact = (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60);

  if (lead.status !== 'rejected' && hoursSinceContact >= settings.hotLeadHours) {
    alerts.push({
      id: 'hot-lead',
      label: '🔥 Lead caliente',
      severity: 'high',
      description: `No contactado en ${Math.floor(hoursSinceContact)}h`,
    });
  }

  const lastStatus = lead.fechaUltimoEstado ?? lead.fechaActualizacion ?? lead.fechaCreacion;
  const daysInDeal = (Date.now() - new Date(lastStatus).getTime()) / (1000 * 60 * 60 * 24);

  if (lead.status === 'open-deal' && daysInDeal >= settings.stalledDealDays) {
    alerts.push({
      id: 'stalled-deal',
      label: '⏳ Deal estancado',
      severity: 'medium',
      description: `Negociación ${Math.floor(daysInDeal)} días`,
    });
  }

  if ((lead.visitasPaginaPrecios ?? 0) >= settings.pricePageViews) {
    alerts.push({
      id: 'price-opportunity',
      label: '🎯 Oportunidad',
      severity: 'info',
      description: `Vio precios ${lead.visitasPaginaPrecios}x`,
    });
  }

  return alerts;
}
