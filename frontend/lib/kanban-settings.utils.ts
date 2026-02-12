import { KanbanBoardSettings, KanbanColumnConfig } from '@/types/matrix';

export const DEFAULT_COLUMN_CONFIGS: KanbanColumnConfig[] = [
  { id: 'new', titulo: 'Leads Nuevos', color: 'purple', icono: '🆕', enabled: true },
  { id: 'reviewing', titulo: 'En Revisión', color: 'orange', icono: '👀', enabled: true },
  { id: 'rejected', titulo: 'Rechazados', color: 'red', icono: '❌', enabled: true },
  { id: 'qualified', titulo: 'Calificados', color: 'green', icono: '✅', enabled: true },
  { id: 'open', titulo: 'Abiertos', color: 'blue', icono: '📂', enabled: true },
  { id: 'in-progress', titulo: 'En Progreso', color: 'indigo', icono: '⚡', enabled: true },
  { id: 'open-deal', titulo: 'Negociación', color: 'yellow', icono: '💰', enabled: true },
  { id: 'citas-locales', titulo: 'Citas Locales', color: 'teal', icono: '📋', enabled: true },
];

export const DEFAULT_BOARD_SETTINGS: KanbanBoardSettings = {
  hideEmptyColumns: false,
  columns: DEFAULT_COLUMN_CONFIGS,
};

const STORAGE_KEY = 'matrix.kanbanBoardSettings';

export function getKanbanBoardSettings(options?: {
  storageKey?: string;
  defaultColumns?: KanbanColumnConfig[];
}): KanbanBoardSettings {
  const storageKey = options?.storageKey ?? STORAGE_KEY;
  const defaultColumns = options?.defaultColumns ?? DEFAULT_COLUMN_CONFIGS;
  const defaultSettings: KanbanBoardSettings = {
    hideEmptyColumns: false,
    columns: defaultColumns,
  };
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<KanbanBoardSettings>;
    return {
      hideEmptyColumns: parsed.hideEmptyColumns ?? defaultSettings.hideEmptyColumns,
      columns: parsed.columns ?? defaultColumns,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveKanbanBoardSettings(settings: KanbanBoardSettings, storageKey: string = STORAGE_KEY): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}
