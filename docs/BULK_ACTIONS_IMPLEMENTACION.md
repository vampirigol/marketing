# Bulk Actions - Acciones Masivas Implementadas

## 📋 Resumen

Se ha implementado un sistema completo de acciones masivas (Bulk Actions) que permite a los usuarios:
- ✅ Seleccionar múltiples leads con checkboxes
- ✅ Mover todos a otra columna
- ✅ Asignar vendedor en lote
- ✅ Agregar etiqueta masiva
- ✅ Exportar seleccionados a CSV
- ✅ Eliminar en lote (con confirmación)

## 🏗️ Arquitectura Implementada

### 1. **Servicio de Bulk Actions** (`frontend/lib/bulk-actions.service.ts`)

Proporciona funciones para ejecutar operaciones masivas:

```typescript
// Mover múltiples leads
moverLeadsMasiva(leads: Lead[], targetStatus: LeadStatus)

// Asignar vendedor
asignarVendedorMasiva(leads: Lead[], vendedorId, vendedorNombre, vendedorAvatar)

// Agregar etiqueta
agregarEtiquetaMasiva(leads: Lead[], etiqueta: string)

// Exportar a CSV
exportarLeadsCSV(leads: Lead[], nombreArchivo: string)

// Eliminar
eliminarLeadsMasiva(leads: Lead[])

// Obtener vendedores disponibles
obtenerVendedoresDisponibles()
```

### 2. **Componente LeadCard Mejorado** (`frontend/components/matrix/LeadCard.tsx`)

- ✅ Checkbox de selección visible en cada lead
- ✅ Indicador visual de selección (aro azul + checkmark)
- ✅ Multi-selección con Cmd/Ctrl o Shift
- ✅ Ajuste de espacios para acomodar checkbox

```tsx
// Checkbox interactivo
<input
  type="checkbox"
  checked={isSelected}
  onChange={() => {}}
  className="w-4 h-4 cursor-pointer accent-blue-500"
/>
```

### 3. **Barra de Acciones Masivas** (`frontend/components/matrix/BulkActionsBar.tsx`)

Componente flotante en la parte inferior con:

**Botones de Acción:**
- 🔄 **Mover** - Dropdown con todas las columnas disponibles
- 👥 **Vendedor** - Dropdown con vendedores disponibles
- 🏷️ **Etiqueta** - Input para agregar nueva etiqueta
- 📥 **Exportar** - Descarga CSV directamente
- 🗑️ **Eliminar** - Con modal de confirmación

**Características:**
- Contador de leads seleccionados
- Estados de carga durante operaciones
- Confirmación para operaciones destructivas
- Notificaciones de éxito después de cada acción
- Botón X para cerrar la barra

### 4. **Contexto Drag Mejorado** (`frontend/contexts/DragContext.tsx`)

Enhancements:
- `selectedLeads: Set<string>` - Mantiene IDs de leads seleccionados
- `toggleLeadSelection()` - Alterna selección individual
- `getSelectedLeadsArray()` - Convierte Set a array de Lead objects
- `isLeadSelected()` - Verifica si un lead está seleccionado

### 5. **Integración en MatrixKanbanView** (`frontend/components/matrix/MatrixKanbanView.tsx`)

```tsx
// Hook para obtener leads seleccionados
const selectedLeadsArray = useMemo(() => {
  return Array.from(selectedLeads).map(id => 
    allLeads.find(lead => lead.id === id)
  ).filter(Boolean) as Lead[];
}, [selectedLeads, allLeads]);

// Mostrar barra solo cuando hay selección
{selectedLeadsArray.length > 0 && (
  <BulkActionsBar
    selectedLeads={selectedLeadsArray}
    onAction={handleBulkAction}
    onClearSelection={clearSelection}
    columnConfigs={COLUMN_CONFIGS}
  />
)}
```

## 🎯 Flujos de Uso

### Flujo 1: Seleccionar Leads
1. Usuario hace clic en checkbox de lead (o Cmd+Click para multi-selección)
2. Lead se resalta con borde azul y checkmark
3. Contador en barra de acciones aumenta
4. BulkActionsBar aparece automáticamente

### Flujo 2: Mover Múltiples Leads
1. Usuario click en botón "Mover"
2. Dropdown muestra columnas disponibles
3. Selecciona columna de destino
4. Sistema actualiza estado de todos los leads
5. Notificación de éxito

### Flujo 3: Asignar Vendedor
1. Usuario click en botón "Vendedor"
2. Dropdown muestra lista de vendedores
3. Selecciona vendedor
4. Se asigna a todos los leads seleccionados
5. Notificación de éxito

### Flujo 4: Agregar Etiqueta
1. Usuario click en botón "Etiqueta"
2. Input aparece para nombre de etiqueta
3. Escribe etiqueta y presiona Enter o click Agregar
4. Etiqueta se agrega a todos los leads
5. Notificación de éxito

### Flujo 5: Exportar a CSV
1. Usuario click en botón "Exportar"
2. Se genera archivo CSV con:
   - ID, Nombre, Email, Teléfono, Canal
   - Valor, Estado, Vendedor, Etiquetas, Fecha
3. Archivo se descarga automáticamente
4. Notificación de éxito

### Flujo 6: Eliminar Leads
1. Usuario click en botón "Eliminar"
2. Modal de confirmación aparece
3. Muestra cantidad de leads a eliminar
4. Advertencia: "Esta acción no se puede deshacer"
5. Si confirma: elimina todos los leads
6. Si cancela: cierra modal
7. Notificación de éxito/error

## 🎨 Interfaz Visual

### Checkbox en LeadCard
```
[✓] Nombre del Lead    [Acciones...]
```

### BulkActionsBar
```
┌─────────────────────────────────────────────────────────┐
│ 5 leads seleccionados                                   │
│ [Mover ▼] [Vendedor ▼] [Etiqueta ▼] [Exportar] [Eliminar] [X] │
└─────────────────────────────────────────────────────────┘
```

### Estados Visuales
- **Normal**: Borde gris, sin selección
- **Seleccionado**: Borde azul, ring azul claro, aro azul con ✓
- **Hovering**: Sombra y tooltip

## 📊 Datos y Campos

### CSV Export Headers
```
ID, Nombre, Email, Teléfono, Canal, Valor, Estado, Vendedor, Etiquetas, Fecha
```

### Vendedores Disponibles (Simulados)
```typescript
[
  { id: '1', nombre: 'Lucía Paredes', avatar: '🧑‍💼' },
  { id: '2', nombre: 'Carlos Mendez', avatar: '👨‍💼' },
  { id: '3', nombre: 'Ana García', avatar: '👩‍💼' },
  { id: '4', nombre: 'Roberto Silva', avatar: '👨‍💻' },
]
```

## 🔄 Flujo de Datos

```
LeadCard (checkbox)
    ↓
toggleLeadSelection() → DragContext.selectedLeads (Set<string>)
    ↓
MatrixKanbanView (obtiene selectedLeadsArray)
    ↓
BulkActionsBar (muestra acciones)
    ↓
bulk-actions.service (ejecuta operación)
    ↓
Notificación de éxito/error
```

## ⚙️ Configuración Técnica

### TypeScript Types
```typescript
interface BulkActionData {
  [key: string]: unknown;
}

interface BulkActionResult {
  success: boolean;
  message: string;
  affectedCount: number;
  errors?: string[];
}
```

### Estados de Carga
- `isLoading`: true mientras se ejecuta operación
- Botones deshabilitados durante carga
- Mensajes claros de progreso

### Notificaciones
- Automáticas después de cada acción (3 segundos)
- Estilos: ✓ verde para éxito, ✗ rojo para error
- Posicionadas en bottom-32 para no ocluir barra

## 🚀 Performance

- ✅ Selección basada en Set (O(1) lookup)
- ✅ Memoización de arrays con useMemo
- ✅ Callbacks optimizados con useCallback
- ✅ CSV generation en cliente (sin servidor)
- ✅ Dropdowns cierran automáticamente después de acción

## 🔐 Consideraciones de Seguridad

- ✅ Confirmación requerida antes de eliminar
- ✅ Validación de entrada en nombres de etiqueta
- ✅ No hay modificación de leads sin confirmación
- ✅ Límites en cantidad de caracteres (etiquetas)

## 📱 Responsividad

- ✅ Barra se ajusta en pantallas pequeñas
- ✅ Botones ocultan texto en mobile (solo icono)
- ✅ Dropdowns se posicionan correctamente
- ✅ Touch-friendly checkbox (tamaño suficiente)

## 🎯 Próximos Pasos (Opcionales)

1. **Backend Integration**: Conectar a API real en lugar de simulaciones
2. **Persistencia**: Guardar etiquetas creadas en BD
3. **Historial**: Registrar acciones masivas realizadas
4. **Permisos**: Validar que usuario puede ejecutar cada acción
5. **Drag & Drop Integration**: Permitir arrastrar múltiples seleccionados
6. **Keyboard Shortcuts**: Ctrl+A para seleccionar todos en columna
7. **Undo/Redo**: Deshacer últimas acciones masivas

## 📝 Archivos Modificados

1. `frontend/lib/bulk-actions.service.ts` - **NUEVO**
2. `frontend/components/matrix/BulkActionsBar.tsx` - **NUEVO**
3. `frontend/components/matrix/LeadCard.tsx` - Modificado
4. `frontend/components/matrix/MatrixKanbanView.tsx` - Modificado
5. `frontend/contexts/DragContext.tsx` - Modificado

## ✅ Validación

- ✓ Sin errores TypeScript
- ✓ Todos los componentes compilan
- ✓ Hot reload funciona correctamente
- ✓ No hay warnings no críticos
