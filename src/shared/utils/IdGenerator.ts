/**
 * Utilidad para generación de IDs únicos
 */
export class IdGenerator {
  /**
   * Genera un ID único con prefijo
   * @param prefix Prefijo del ID (ej: 'pac', 'cit', 'abn')
   */
  static generate(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Genera un folio de recibo
   * @param sucursalCodigo Código de la sucursal (ej: 'RCA-001')
   */
  static generateFolioRecibo(sucursalCodigo: string): string {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `${sucursalCodigo}-${año}${mes}${dia}-${random}`;
  }

  /**
   * Valida formato de ID
   * @param id ID a validar
   * @param prefix Prefijo esperado
   */
  static isValid(id: string, prefix?: string): boolean {
    if (!id || typeof id !== 'string') return false;

    const parts = id.split('-');
    if (parts.length !== 3) return false;

    if (prefix && parts[0] !== prefix) return false;

    return true;
  }
}
