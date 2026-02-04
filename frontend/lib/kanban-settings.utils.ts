import { KanbanBoardSettings, KanbanColumnConfig } from '@/types/matrix';

export const DEFAULT_COLUMN_CONFIGS: KanbanColumnConfig[] = [
  { id: 'new', titulo: 'Leads Nuevos', color: 'purple', icono: '🆕', enabled: true },
  { id: 'reviewing', titulo: 'En Revisión', color: 'orange', icono: '👀', enabled: true },
  { id: 'rejected', titulo: 'Rechazados', color: 'red', icono: '❌', enabled: true },
  { id: 'qualified', titulo: 'Calificados', color: 'green', icono: '✅', enabled: true },
  { id: 'open', titulo: 'Abiertos', color: 'blue', icono: '📂', enabled: true },
  { id: 'in-progress', titulo: 'En Progreso', color: 'indigo', icono: '⚡', enabled: true },
  { id: 'open-deal', titulo: 'Negociación', color: 'yellow', icono: '💰', enabled: true },
];

export const DEFAULT_BOARD_SETTINGS: KanbanBoardSettings = {
  hideEmptyColumns: false,
  columns: DEFAULT_COLUMN_CONFIGS,
};

const STORAGE_KEY = 'matrix.kanbanBoardSettings';

export function getKanbanBoardSettings(): KanbanBoardSettings {
  if (typeof window === 'undefined') return DEFAULT_BOARD_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BOARD_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<KanbanBoardSettings>;
    return {
      hideEmptyColumns: parsed.hideEmptyColumns ?? DEFAULT_BOARD_SETTINGS.hideEmptyColumns,
      columns: parsed.columns ?? DEFAULT_COLUMN_CONFIGS,
    };
  } catch {
    return DEFAULT_BOARD_SETTINGS;
  }
}

export function saveKanbanBoardSettings(settings: KanbanBoardSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
