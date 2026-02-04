import { Lead } from '@/types/matrix';

/**
 * Utilidades memoizadas para formateo y cálculos del Kanban
 * Estas funciones se cachean para evitar recálculos innecesarios
 */

// Cache para formateo de moneda
const currencyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Formateador de moneda con cache
 * Reutiliza instancias de Intl.NumberFormat para mejor performance
 */
export function formatearMoneda(valor: number, compact: boolean = false): string {
  const key = compact ? 'MXN-compact' : 'MXN-full';
  
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        ...(compact && { notation: 'compact', compactDisplay: 'short' }),
      })
    );
  }

  return currencyFormatters.get(key)!.format(valor);
}

/**
 * Formateo de fecha relativa memoizado
 * Cache basado en día para evitar cálculos repetitivos
 */
const fechaCache = new Map<string, string>();

export function formatearFechaRelativa(fecha: Date): string {
  const fechaKey = fecha.toDateString();
  
  if (fechaCache.has(fechaKey)) {
    return fechaCache.get(fechaKey)!;
  }

  const ahora = new Date();
  const diff = ahora.getTime() - fecha.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  let resultado: string;
  if (dias === 0) resultado = 'Hoy';
  else if (dias === 1) resultado = 'Ayer';
  else if (dias < 7) resultado = `hace ${dias}d`;
  else if (dias < 30) resultado = `hace ${Math.floor(dias / 7)}sem`;
  else resultado = `hace ${Math.floor(dias / 30)}m`;

  fechaCache.set(fechaKey, resultado);
  
  // Limpiar cache si tiene más de 100 entradas
  if (fechaCache.size > 100) {
    const firstKey = fechaCache.keys().next().value;
    if (firstKey) {
      fechaCache.delete(firstKey);
    }
  }

  return resultado;
}

/**
 * Obtener iniciales de nombre (memoizado)
 */
const inicialesCache = new Map<string, string>();

export function obtenerIniciales(nombre: string): string {
  if (inicialesCache.has(nombre)) {
    return inicialesCache.get(nombre)!;
  }

  const iniciales = nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  inicialesCache.set(nombre, iniciales);

  if (inicialesCache.size > 500) {
    const firstKey = inicialesCache.keys().next().value;
    if (firstKey) {
      inicialesCache.delete(firstKey);
    }
  }

  return iniciales;
}

/**
 * Colores de estado del Kanban (constante para reutilizar)
 */
export const COLOR_CLASSES = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
  },
} as const;

export type ColorKey = keyof typeof COLOR_CLASSES;

export function obtenerClasesColor(color: string) {
  return COLOR_CLASSES[color as ColorKey] || COLOR_CLASSES.blue;
}

/**
 * Comparador profundo para props de Lead
 * Evita re-renders cuando los datos no han cambiado realmente
 */
export function compararLeads(
  prevLead: Lead,
  nextLead: Lead
): boolean {
  // Comparación rápida de propiedades primitivas
  if (
    prevLead.id !== nextLead.id ||
    prevLead.nombre !== nextLead.nombre ||
    prevLead.email !== nextLead.email ||
    prevLead.telefono !== nextLead.telefono ||
    prevLead.status !== nextLead.status ||
    prevLead.canal !== nextLead.canal ||
    prevLead.valorEstimado !== nextLead.valorEstimado ||
    prevLead.notas !== nextLead.notas ||
    prevLead.conversacionId !== nextLead.conversacionId ||
    prevLead.asignadoA !== nextLead.asignadoA ||
    prevLead.asignadoAvatar !== nextLead.asignadoAvatar ||
    prevLead.estadoVendedor !== nextLead.estadoVendedor ||
    prevLead.conflictoEdicion !== nextLead.conflictoEdicion
  ) {
    return false;
  }

  // Comparar arrays de etiquetas
  if (prevLead.etiquetas?.length !== nextLead.etiquetas?.length) {
    return false;
  }

  if (prevLead.etiquetas) {
    for (let i = 0; i < prevLead.etiquetas.length; i++) {
      if (prevLead.etiquetas[i] !== nextLead.etiquetas[i]) {
        return false;
      }
    }
  }

  if (prevLead.editoresActivos?.length !== nextLead.editoresActivos?.length) {
    return false;
  }

  if (prevLead.editoresActivos && nextLead.editoresActivos) {
    for (let i = 0; i < prevLead.editoresActivos.length; i++) {
      if (prevLead.editoresActivos[i] !== nextLead.editoresActivos[i]) {
        return false;
      }
    }
  }

  // Comparar fechas
  if (prevLead.fechaCreacion?.getTime() !== nextLead.fechaCreacion?.getTime()) {
    return false;
  }

  if (prevLead.fechaActualizacion?.getTime() !== nextLead.fechaActualizacion?.getTime()) {
    return false;
  }

  return true;
}
