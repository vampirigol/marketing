/**
 * Utilidades para manejo de fechas y zonas horarias
 */
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'America/Mexico_City';

export class DateUtils {
  /**
   * Convierte una fecha a la zona horaria especificada
   */
  static toTimeZone(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
    return utcToZonedTime(date, timeZone);
  }

  /**
   * Formatea una fecha en la zona horaria especificada
   */
  static formatInTimeZone(
    date: Date,
    formatStr: string = 'yyyy-MM-dd HH:mm:ss',
    timeZone: string = DEFAULT_TIMEZONE
  ): string {
    return formatInTimeZone(date, timeZone, formatStr);
  }

  /**
   * Obtiene el inicio del día en la zona horaria especificada
   */
  static startOfDayInTimeZone(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
    const zonedDate = utcToZonedTime(date, timeZone);
    return startOfDay(zonedDate);
  }

  /**
   * Obtiene el fin del día en la zona horaria especificada
   */
  static endOfDayInTimeZone(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
    const zonedDate = utcToZonedTime(date, timeZone);
    return endOfDay(zonedDate);
  }

  /**
   * Valida si una fecha es válida
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Obtiene la fecha actual en la zona horaria especificada
   */
  static now(timeZone: string = DEFAULT_TIMEZONE): Date {
    return utcToZonedTime(new Date(), timeZone);
  }

  /**
   * Convierte string a fecha
   */
  static parseDate(dateString: string): Date {
    const date = parseISO(dateString);
    if (!this.isValidDate(date)) {
      throw new Error(`Fecha inválida: ${dateString}`);
    }
    return date;
  }
}
