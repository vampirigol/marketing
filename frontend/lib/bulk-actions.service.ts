/**
 * Servicio de Acciones Masivas (Bulk Actions)
 * Maneja operaciones sobre múltiples leads simultáneamente
 */

import { Lead, LeadStatus } from '@/types/matrix';

export interface BulkActionResult {
  success: boolean;
  message: string;
  affectedCount: number;
  errors?: string[];
}

/**
 * Mover múltiples leads a una columna de destino
 */
export async function moverLeadsMasiva(
  leads: Lead[],
  targetStatus: LeadStatus
): Promise<BulkActionResult> {
  try {
    // Simulación local - en producción llamaría a API
    const results = await Promise.all(
      leads.map(_lead => 
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(true), 100);
        })
      )
    );

    const successCount = results.filter(r => r).length;

    return {
      success: true,
      message: `${successCount} leads movidos a "${targetStatus}"`,
      affectedCount: successCount,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al mover leads',
      affectedCount: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Asignar vendedor en lote a múltiples leads
 */
export async function asignarVendedorMasiva(
  leads: Lead[],
  vendedorId: string,
  vendedorNombre: string,
  _vendedorAvatar: string
): Promise<BulkActionResult> {
  try {
    // Simulación local - en producción llamaría a API
    const results = await Promise.all(
      leads.map(_lead => 
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(true), 100);
        })
      )
    );

    const successCount = results.filter(r => r).length;

    return {
      success: true,
      message: `${successCount} leads asignados a ${vendedorNombre}`,
      affectedCount: successCount,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al asignar vendedor',
      affectedCount: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Agregar etiqueta masiva a múltiples leads
 */
export async function agregarEtiquetaMasiva(
  leads: Lead[],
  etiqueta: string
): Promise<BulkActionResult> {
  try {
    // Simulación local - en producción llamaría a API
    const results = await Promise.all(
      leads.map(_lead => 
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(true), 100);
        })
      )
    );

    const successCount = results.filter(r => r).length;

    return {
      success: true,
      message: `Etiqueta "${etiqueta}" agregada a ${successCount} leads`,
      affectedCount: successCount,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al agregar etiqueta',
      affectedCount: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Exportar leads seleccionados a CSV
 */
export function exportarLeadsCSV(leads: Lead[], nombreArchivo = 'leads-export.csv'): void {
  try {
    // Preparar datos para CSV
    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Canal', 'Valor', 'Estado', 'Vendedor', 'Etiquetas', 'Fecha'];
    
    const rows = leads.map(lead => [
      lead.id,
      lead.nombre || '',
      lead.email || '',
      lead.telefono || '',
      lead.canal || '',
      lead.valorEstimado || '',
      lead.status || '',
      lead.asignadoA || '',
      (lead.etiquetas || []).join('; '),
      lead.fechaCreacion?.toISOString().split('T')[0] || '',
    ]);

    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      message: `${leads.length} leads exportados a ${nombreArchivo}`,
      affectedCount: leads.length,
    } as unknown as void;
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    throw new Error('Error al exportar leads');
  }
}

/**
 * Eliminar múltiples leads (requiere confirmación)
 */
export async function eliminarLeadsMasiva(leads: Lead[]): Promise<BulkActionResult> {
  try {
    // Simulación local - en producción llamaría a API
    const results = await Promise.all(
      leads.map(_lead => 
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(true), 100);
        })
      )
    );

    const successCount = results.filter(r => r).length;

    return {
      success: true,
      message: `${successCount} leads eliminados correctamente`,
      affectedCount: successCount,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al eliminar leads',
      affectedCount: 0,
      errors: [String(error)],
    };
  }
}

/**
 * Obtener información para dialogo de asignación de vendedor
 */
export function obtenerVendedoresDisponibles() {
  return [
    { id: '1', nombre: 'Lucía Paredes', avatar: '🧑‍💼' },
    { id: '2', nombre: 'Carlos Mendez', avatar: '👨‍💼' },
    { id: '3', nombre: 'Ana García', avatar: '👩‍💼' },
    { id: '4', nombre: 'Roberto Silva', avatar: '👨‍💻' },
  ];
}
