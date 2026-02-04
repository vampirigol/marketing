import { CustomFieldDefinition, CustomFieldsSettings, CustomFieldType } from '@/types/matrix';

export const DEFAULT_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  { id: 'tratamiento_interes', label: 'Tratamiento de interés', type: 'text' },
  { id: 'presupuesto_aprobado', label: 'Presupuesto aprobado', type: 'boolean' },
  { id: 'aseguradora', label: 'Aseguradora', type: 'text' },
  { id: 'referido_por', label: 'Referido por', type: 'text' },
];

export const DEFAULT_CUSTOM_FIELDS_SETTINGS: CustomFieldsSettings = {
  fields: DEFAULT_CUSTOM_FIELDS,
  visibleFieldIds: ['tratamiento_interes', 'presupuesto_aprobado'],
};

const STORAGE_KEY = 'matrix.customFieldsSettings';

export function getCustomFieldsSettings(): CustomFieldsSettings {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_FIELDS_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOM_FIELDS_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<CustomFieldsSettings>;
    return {
      fields: parsed.fields ?? DEFAULT_CUSTOM_FIELDS,
      visibleFieldIds: parsed.visibleFieldIds ?? DEFAULT_CUSTOM_FIELDS_SETTINGS.visibleFieldIds,
    };
  } catch {
    return DEFAULT_CUSTOM_FIELDS_SETTINGS;
  }
}

export function saveCustomFieldsSettings(settings: CustomFieldsSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function formatCustomFieldValue(
  definition: CustomFieldDefinition,
  value: string | number | boolean | undefined
): string {
  if (value === undefined || value === null || value === '') return '';
  if (definition.type === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

export function sanitizeFieldId(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export const CUSTOM_FIELD_TYPES: Array<{ value: CustomFieldType; label: string }> = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'select', label: 'Lista' },
];
