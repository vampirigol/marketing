// Sistema de caché offline para agenda y datos críticos
import React from 'react';

export interface CachedData {
  timestamp: number;
  data: any;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export class OfflineCache {
  private static getKey(prefix: string, id: string): string {
    return `offline_${prefix}_${id}`;
  }

  static set(prefix: string, id: string, data: any): void {
    try {
      const cached: CachedData = {
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(this.getKey(prefix, id), JSON.stringify(cached));
    } catch (error) {
      console.warn('Error guardando en caché:', error);
    }
  }

  static get<T = any>(prefix: string, id: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(prefix, id));
      if (!raw) return null;

      const cached: CachedData = JSON.parse(raw);
      const age = Date.now() - cached.timestamp;

      if (age > CACHE_DURATION) {
        this.remove(prefix, id);
        return null;
      }

      return cached.data as T;
    } catch (error) {
      console.warn('Error leyendo caché:', error);
      return null;
    }
  }

  static remove(prefix: string, id: string): void {
    try {
      localStorage.removeItem(this.getKey(prefix, id));
    } catch (error) {
      console.warn('Error eliminando caché:', error);
    }
  }

  static clear(prefix?: string): void {
    try {
      if (!prefix) {
        // Limpiar todo el caché offline
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith('offline_')) {
            localStorage.removeItem(key);
          }
        });
      } else {
        // Limpiar caché específico
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(`offline_${prefix}_`)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Error limpiando caché:', error);
    }
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }
}

// Hook para detectar estado online/offline
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = React.useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
