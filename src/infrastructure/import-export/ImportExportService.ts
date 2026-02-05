/**
 * Servicio: Importación/Exportación de Datos
 * Maneja CSV y Excel para pacientes, citas, etc.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Paciente } from '../core/entities/Paciente';

export interface DatosExportacion {
  nombreArchivo: string;
  datos: any[];
  columnas?: string[];
  formato: 'csv' | 'excel';
}

export interface ResultadoImportacion {
  exitosos: number;
  fallidos: number;
  errores: { fila: number; error: string }[];
  datos: any[];
}

export class ImportExportService {
  /**
   * Exportar datos a CSV
   */
  exportarCSV(datos: any[], columnas?: string[]): string {
    // Si se especifican columnas, filtrar solo esas
    let datosExportar = datos;
    if (columnas && columnas.length > 0) {
      datosExportar = datos.map(item => {
        const filtered: any = {};
        columnas.forEach(col => {
          filtered[col] = item[col];
        });
        return filtered;
      });
    }

    // Generar CSV usando papaparse
    const csv = Papa.unparse(datosExportar, {
      header: true,
      delimiter: ',',
      newline: '\n'
    });

    return csv;
  }

  /**
   * Exportar datos a Excel
   */
  exportarExcel(datos: any[], nombreHoja: string = 'Datos', columnas?: string[]): Buffer {
    // Si se especifican columnas, filtrar solo esas
    let datosExportar = datos;
    if (columnas && columnas.length > 0) {
      datosExportar = datos.map(item => {
        const filtered: any = {};
        columnas.forEach(col => {
          filtered[col] = item[col];
        });
        return filtered;
      });
    }

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosExportar);

    // Ajustar ancho de columnas
    const cols = Object.keys(datosExportar[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = cols;

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }

  /**
   * Importar desde CSV
   */
  importarCSV(contenidoCSV: string): ResultadoImportacion {
    const resultado: ResultadoImportacion = {
      exitosos: 0,
      fallidos: 0,
      errores: [],
      datos: []
    };

    try {
      const parseResult = Papa.parse(contenidoCSV, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach(error => {
          resultado.errores.push({
            fila: error.row !== undefined ? error.row : -1,
            error: error.message
          });
          resultado.fallidos++;
        });
      }

      resultado.datos = parseResult.data as any[];
      resultado.exitosos = resultado.datos.length;

      return resultado;
    } catch (error: any) {
      resultado.errores.push({
        fila: -1,
        error: `Error al parsear CSV: ${error.message}`
      });
      resultado.fallidos++;
      return resultado;
    }
  }

  /**
   * Importar desde Excel
   */
  importarExcel(buffer: Buffer, nombreHoja?: string): ResultadoImportacion {
    const resultado: ResultadoImportacion = {
      exitosos: 0,
      fallidos: 0,
      errores: [],
      datos: []
    };

    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Usar la primera hoja si no se especifica nombre
      const sheetName = nombreHoja || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        resultado.errores.push({
          fila: -1,
          error: `Hoja "${sheetName}" no encontrada`
        });
        resultado.fallidos++;
        return resultado;
      }

      // Convertir hoja a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: null
      });

      resultado.datos = data;
      resultado.exitosos = data.length;

      return resultado;
    } catch (error: any) {
      resultado.errores.push({
        fila: -1,
        error: `Error al parsear Excel: ${error.message}`
      });
      resultado.fallidos++;
      return resultado;
    }
  }

  /**
   * Validar y transformar datos importados de pacientes
   */
  validarDatosPacientes(datos: any[]): ResultadoImportacion {
    const resultado: ResultadoImportacion = {
      exitosos: 0,
      fallidos: 0,
      errores: [],
      datos: []
    };

    datos.forEach((fila, index) => {
      try {
        // Validar campos requeridos
        if (!fila.nombreCompleto || !fila.telefono) {
          throw new Error('Campos requeridos: nombreCompleto, telefono');
        }

        // Transformar a estructura Paciente
        const paciente: Partial<Paciente> = {
          id: `pac_imp_${Date.now()}_${index}`,
          nombreCompleto: String(fila.nombreCompleto).trim(),
          telefono: String(fila.telefono).trim(),
          email: fila.email ? String(fila.email).trim() : undefined,
          genero: fila.genero || undefined,
          fechaNacimiento: fila.fechaNacimiento ? new Date(fila.fechaNacimiento) : undefined,
          direccion: fila.direccion || undefined,
          ciudad: fila.ciudad || undefined,
          estado: fila.estado || undefined,
          origen: fila.origen || 'Importación',
          notas: fila.notas || undefined,
          sucursalId: fila.sucursalId || undefined,
          fechaRegistro: new Date(),
          ultimaActualizacion: new Date()
        };

        resultado.datos.push(paciente);
        resultado.exitosos++;
      } catch (error: any) {
        resultado.errores.push({
          fila: index + 2, // +2 porque row 1 es header y empezamos en 0
          error: error.message
        });
        resultado.fallidos++;
      }
    });

    return resultado;
  }

  /**
   * Generar plantilla CSV de pacientes
   */
  generarPlantillaPacientes(): string {
    const plantilla = [
      {
        nombreCompleto: 'Juan Pérez',
        telefono: '5551234567',
        email: 'juan@example.com',
        genero: 'Masculino',
        fechaNacimiento: '1990-01-15',
        direccion: 'Calle Principal 123',
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        origen: 'WhatsApp',
        notas: 'Cliente preferente',
        sucursalId: 'SUC_001'
      },
      {
        nombreCompleto: 'María García',
        telefono: '5559876543',
        email: 'maria@example.com',
        genero: 'Femenino',
        fechaNacimiento: '1985-05-20',
        direccion: 'Av. Reforma 456',
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        origen: 'Facebook',
        notas: '',
        sucursalId: 'SUC_002'
      }
    ];

    return this.exportarCSV(plantilla);
  }

  /**
   * Generar plantilla Excel de pacientes
   */
  generarPlantillaPacientesExcel(): Buffer {
    const plantilla = [
      {
        nombreCompleto: 'Juan Pérez',
        telefono: '5551234567',
        email: 'juan@example.com',
        genero: 'Masculino',
        fechaNacimiento: '1990-01-15',
        direccion: 'Calle Principal 123',
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        origen: 'WhatsApp',
        notas: 'Cliente preferente',
        sucursalId: 'SUC_001'
      }
    ];

    return this.exportarExcel(plantilla, 'Plantilla Pacientes');
  }
}
