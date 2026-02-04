# Simulación de Kanban de Leads desde Conversaciones

## Descripción General

Se ha implementado una simulación del sistema de Kanban de Leads que utiliza las conversaciones del inbox de mensajería (WhatsApp, Facebook, Instagram) como fuente de datos. Esta simulación permite visualizar y gestionar leads sin necesidad de tener una base de datos backend activa.

## Características Implementadas

### 1. Conversión Automática de Conversaciones a Leads

El sistema convierte automáticamente cada conversación del inbox en un lead, mapeando:

- **Nombre del contacto** → Nombre del lead
- **Teléfono** → Teléfono del lead
- **Canal** (WhatsApp/Facebook/Instagram) → Canal del lead
- **Estado de conversación** → Status en el kanban
- **Etiquetas** → Etiquetas del lead
- **Último mensaje** → Notas del lead

### 2. Mapeo de Estados

Las conversaciones se distribuyen en las columnas del kanban según:

| Estado de Conversación | Etiqueta | Status en Kanban |
|------------------------|----------|------------------|
| Activa | - | `new` (Leads Nuevos) |
| Pendiente | - | `reviewing` (En Revisión) |
| Cerrada | - | `qualified` (Calificados) |
| Activa | Promoción | `qualified` (Calificados) |
| Activa | Urgente | `in-progress` (En Progreso) |
| Activa | Negociación | `open-deal` (Negociación) |

### 3. Datos Simulados

Se incluyen **12 conversaciones simuladas** que representan diferentes escenarios:

1. **María González** - WhatsApp, Nueva, Promoción
2. **Pedro López** - WhatsApp, Urgente
3. **Ana Martínez** - Instagram, Promoción
4. **Carlos Ramírez** - Facebook, Ortodoncia
5. **Laura Hernández** - WhatsApp, Negociación
6. **Roberto Silva** - Instagram, Seguimiento
7. **Sofia Torres** - WhatsApp, Implantes
8. **Miguel Ángel Ruiz** - Facebook, Emergencia
9. **Valentina Castro** - Instagram, Seguros
10. **Diego Morales** - WhatsApp, Confirmada
11. **Camila Vargas** - Facebook, Ubicación
12. **Fernando Jiménez** - Instagram, Paquete

### 4. Valor Estimado

Cada lead tiene un valor estimado basado en su canal de origen:

- **WhatsApp**: $2,500 MXN (±$500 variación)
- **Facebook**: $2,000 MXN (±$500 variación)
- **Instagram**: $3,000 MXN (±$500 variación)

### 5. Paginación y Filtros

La simulación soporta:

- **Paginación**: Carga de leads en páginas de 20 elementos
- **Filtro por status**: Filtrar leads por columna/estado
- **Filtro por canal**: WhatsApp, Facebook, Instagram
- **Búsqueda**: Por nombre, email o teléfono

## Archivos Modificados

### 1. `/frontend/lib/matrix.service.ts`

**Nuevas funciones agregadas:**

```typescript
// Generar leads desde conversaciones
function generarLeadsDesdeConversaciones(conversaciones: Conversacion[]): Lead[]

// Obtener leads simulados con paginación
async function obtenerLeadsSimulados(params: ObtenerLeadsParams): Promise<ObtenerLeadsResponse>

// Obtener conversaciones simuladas
function obtenerConversacionesSimuladas(): Promise<Conversacion[]>
```

### 2. `/frontend/app/matrix/page.tsx`

**Cambios realizados:**

- Actualizada función `handleLoadMoreLeads` para usar `obtenerLeadsSimulados()`
- Actualizada función `cargarConversaciones` para usar `obtenerConversacionesSimuladas()`
- Eliminados datos hardcodeados antiguos

## Cómo Usar la Simulación

### Acceso al Kanban

1. Navegar a **http://localhost:3001/matrix**
2. Cambiar a la vista **Kanban** usando el botón de toggle superior
3. Los leads se cargarán automáticamente desde las conversaciones simuladas

### Interacción con Leads

- **Arrastrar y soltar**: Mover leads entre columnas
- **Búsqueda**: Filtrar por nombre, email o teléfono
- **Filtro de canal**: Seleccionar WhatsApp, Facebook o Instagram
- **Ver conversación**: Click en el botón de mensaje para ver la conversación original
- **Scroll infinito**: Cargar más leads al hacer scroll en cada columna

### Estadísticas Visibles

El dashboard muestra:

- **Total de Leads**: Cantidad total de leads cargados
- **Valor Total**: Suma de valores estimados de todos los leads
- **Nuevos Hoy**: Leads creados en la fecha actual
- **Calificados**: Leads en status "qualified"
- **Deals Activos**: Leads en negociación

## Ventajas de la Simulación

1. **Desarrollo Sin Backend**: Permite desarrollar y probar el frontend sin API
2. **Demostración**: Ideal para presentaciones y demos del sistema
3. **Testing**: Facilita pruebas de UI y UX
4. **Datos Realistas**: Conversaciones y leads simulados con datos coherentes
5. **Fácil Modificación**: Agregar o modificar conversaciones simuladas es simple

## Próximos Pasos

Para conectar con un backend real:

1. Reemplazar `obtenerLeadsSimulados()` con llamadas a la API real
2. Implementar endpoints en el backend:
   - `GET /api/matrix/leads` - Obtener leads con paginación
   - `POST /api/matrix/leads` - Crear nuevo lead
   - `PATCH /api/matrix/leads/:id/status` - Actualizar status de lead
   - `GET /api/matrix/conversaciones` - Obtener conversaciones reales

3. Actualizar `handleLoadMoreLeads` en `matrix/page.tsx`:

```typescript
const handleLoadMoreLeads = useCallback(async (options) => {
  // Cambiar esto:
  const response = await obtenerLeadsSimulados(options);
  
  // Por esto:
  const response = await obtenerLeadsPaginados(options);
  
  return {
    leads: response.leads,
    hasMore: response.hasMore,
    total: response.total,
  };
}, []);
```

## Personalización de Datos Simulados

Para agregar más conversaciones simuladas, editar la función `obtenerConversacionesSimuladas()` en `/frontend/lib/matrix.service.ts`:

```typescript
const conversacionesDemo: Conversacion[] = [
  // ... conversaciones existentes
  {
    id: '13',
    canal: 'whatsapp',
    nombreContacto: 'Nuevo Contacto',
    telefono: '+52 555-0000-0000',
    avatar: '👤',
    ultimoMensaje: 'Mensaje de ejemplo',
    fechaUltimoMensaje: new Date(Date.now() - 30 * 60000),
    estado: 'activa',
    mensajesNoLeidos: 1,
    etiquetas: ['Nueva'],
    enLinea: true
  }
];
```

## Notas Técnicas

- Las conversaciones generan emails automáticamente usando el patrón: `nombre.apellido@example.com`
- Los IDs de leads usan el prefijo `lead-` + ID de conversación
- La conversión es unidireccional: conversaciones → leads (no se persisten cambios)
- Para demostración de drag & drop, los movimientos se simulan en memoria
