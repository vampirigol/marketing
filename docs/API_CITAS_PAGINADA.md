// API de ejemplo para paginación de citas
// Este endpoint debe implementarse en el backend (Node.js/Express, Next.js API route, etc.)

/**
 * GET /api/citas
 * Query params:
 *   - page: número de página (1 por defecto)
 *   - pageSize: cantidad de resultados por página (20 por defecto)
 *   - search: texto de búsqueda (opcional)
 *   - estado: filtro de estado (opcional)
 *   - sortField: campo de ordenamiento (fecha, paciente, doctor, estado)
 *   - sortDirection: asc | desc
 *
 * Respuesta:
 * {
 *   data: [ ...citas... ],
 *   total: número total de citas,
 *   page: número de página actual,
 *   pageSize: tamaño de página
 * }
 */

// Ejemplo de interfaz TypeScript para la respuesta:
export interface CitaPaginadaResponse {
  data: Cita[];
  total: number;
  page: number;
  pageSize: number;
}

// La lógica real debe implementarse en el backend, usando la base de datos.
