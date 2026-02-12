import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CachedData<T = any> {
  timestamp: number;
  data: T;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export class OfflineCache {
  private static getKey(prefix: string, id: string): string {
    return `offline_${prefix}_${id}`;
  }

  static async set(prefix: string, id: string, data: any): Promise<void> {
    try {
      const cached: CachedData = {
        timestamp: Date.now(),
        data,
      };
      await AsyncStorage.setItem(this.getKey(prefix, id), JSON.stringify(cached));
    } catch (error) {
      console.warn('Error guardando en caché:', error);
    }
  }

  static async get<T = any>(prefix: string, id: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(this.getKey(prefix, id));
      if (!raw) return null;

      const cached: CachedData<T> = JSON.parse(raw);
      const age = Date.now() - cached.timestamp;

      if (age > CACHE_DURATION) {
        await this.remove(prefix, id);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn('Error leyendo caché:', error);
      return null;
    }
  }

  static async remove(prefix: string, id: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(prefix, id));
    } catch (error) {
      console.warn('Error eliminando caché:', error);
    }
  }

  static async clear(prefix?: string): Promise<void> {
    try {
      if (!prefix) {
        const keys = await AsyncStorage.getAllKeys();
        const offlineKeys = keys.filter((key) => key.startsWith('offline_'));
        await AsyncStorage.multiRemove(offlineKeys);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const prefixKeys = keys.filter((key) => key.startsWith(`offline_${prefix}_`));
        await AsyncStorage.multiRemove(prefixKeys);
      }
    } catch (error) {
      console.warn('Error limpiando caché:', error);
    }
  }
}
