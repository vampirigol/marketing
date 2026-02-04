# 👨‍💻 Documentación Técnica - Bulk Actions API

## 📚 Tabla de Contenidos
1. [Módulo de Servicios](#módulo-de-servicios)
2. [Componentes](#componentes)
3. [Contexto](#contexto)
4. [Integración](#integración)
5. [Testing](#testing)
6. [Extensión Futura](#extensión-futura)

---

## Módulo de Servicios

### Archivo: `frontend/lib/bulk-actions.service.ts`

#### 1. **moverLeadsMasiva()**

```typescript
export async function moverLeadsMasiva(
  leads: Lead[],
  targetStatus: LeadStatus
): Promise<BulkActionResult>
```

**Descripción**: Mueve múltiples leads a un estado diferente.

**Parámetros**:
- `leads: Lead[]` - Array de leads a mover
- `targetStatus: LeadStatus` - Estado destino ('new' | 'reviewing' | 'rejected' | 'qualified' | 'open' | 'in-progress' | 'open-deal')

**Retorna**: 
```typescript
{
  success: boolean,
  message: string,
  affectedCount: number,
  errors?: string[]
}
```

**Ejemplo**:
```typescript
const resultado = await moverLeadsMasiva(
  [lead1, lead2, lead3],
  'qualified'
);

if (resultado.success) {
  console.log(`${resultado.affectedCount} leads movidos`);
}
```

**Nota**: Actualmente simula la operación con delay. Para producción, implementar:
```typescript
const response = await axios.post('/api/leads/bulk-move', {
  leadIds: leads.map(l => l.id),
  targetStatus
});
```

---

#### 2. **asignarVendedorMasiva()**

```typescript
export async function asignarVendedorMasiva(
  leads: Lead[],
  vendedorId: string,
  vendedorNombre: string,
  vendedorAvatar: string
): Promise<BulkActionResult>
```

**Descripción**: Asigna múltiples leads a un vendedor específico.

**Parámetros**:
- `leads: Lead[]` - Array de leads a asignar
- `vendedorId: string` - ID único del vendedor
- `vendedorNombre: string` - Nombre para mostrar
- `vendedorAvatar: string` - URL/emoji del avatar

**Retorna**: `BulkActionResult`

**Ejemplo**:
```typescript
const resultado = await asignarVendedorMasiva(
  selectedLeads,
  '1',
  'Lucía Paredes',
  '🧑‍💼'
);
```

**Conexión de API (futuro)**:
```typescript
const response = await axios.post('/api/leads/bulk-assign', {
  leadIds: leads.map(l => l.id),
  vendedorId,
  vendedorNombre,
  vendedorAvatar
});
```

---

#### 3. **agregarEtiquetaMasiva()**

```typescript
export async function agregarEtiquetaMasiva(
  leads: Lead[],
  etiqueta: string
): Promise<BulkActionResult>
```

**Descripción**: Agrega la misma etiqueta a múltiples leads.

**Parámetros**:
- `leads: Lead[]` - Array de leads
- `etiqueta: string` - Nombre de la etiqueta a agregar

**Retorna**: `BulkActionResult`

**Validaciones**:
- Etiqueta no vacía (trim() no = '')
- Máximo 50 caracteres (recomendado)
- No duplicados si la etiqueta ya existe

**Ejemplo**:
```typescript
const resultado = await agregarEtiquetaMasiva(
  leads,
  'Follow-up Urgente'
);
```

**Backend (futuro)**:
```typescript
POST /api/leads/bulk-tag
{
  leadIds: string[],
  etiqueta: string
}
```

---

#### 4. **exportarLeadsCSV()**

```typescript
export function exportarLeadsCSV(
  leads: Lead[],
  nombreArchivo = 'leads-export.csv'
): void
```

**Descripción**: Genera y descarga archivo CSV con los leads.

**Parámetros**:
- `leads: Lead[]` - Array de leads a exportar
- `nombreArchivo?: string` - Nombre del archivo (default: 'leads-export.csv')

**Retorna**: `void` (descarga archivo)

**Formato CSV**:
```
ID,Nombre,Email,Teléfono,Canal,Valor,Estado,Vendedor,Etiquetas,Fecha

001,Juan García,juan@email.com,+34123456,WhatsApp,5000,Qualified,Lucía Paredes,"Follow-up;Premium",2026-02-04
002,María López,maria@email.com,+34654321,Facebook,3000,Open,Carlos Mendez,Test,2026-02-01
```

**Características**:
- Escapa comillas dentro de valores
- Maneja valores null/undefined
- Genera Blob en cliente (sin servidor)
- Descarga automática

**Ejemplo**:
```typescript
exportarLeadsCSV(selectedLeads, `reporte-${new Date().toISOString().split('T')[0]}.csv`);
```

**Implementación Interna**:
```typescript
const headers = ['ID', 'Nombre', 'Email', ...];
const rows = leads.map(lead => [
  lead.id,
  lead.nombre,
  lead.email,
  ...
]);

const csvContent = [
  headers.join(','),
  ...rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  )
].join('\n');

const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = nombreArchivo;
link.click();
```

---

#### 5. **eliminarLeadsMasiva()**

```typescript
export async function eliminarLeadsMasiva(
  leads: Lead[]
): Promise<BulkActionResult>
```

**Descripción**: Elimina múltiples leads (operación destructiva).

**Parámetros**:
- `leads: Lead[]` - Array de leads a eliminar

**Retorna**: `BulkActionResult`

**⚠️ ADVERTENCIA**: Esta función requiere confirmación del usuario.

**Ejemplo**:
```typescript
// En componente: pedir confirmación primero
if (window.confirm(`¿Eliminar ${leads.length} leads?`)) {
  const resultado = await eliminarLeadsMasiva(leads);
}
```

**API (futuro)**:
```typescript
DELETE /api/leads/bulk-delete
{
  leadIds: string[]
}
```

---

#### 6. **obtenerVendedoresDisponibles()**

```typescript
export function obtenerVendedoresDisponibles(): Array<{
  id: string;
  nombre: string;
  avatar: string;
}>
```

**Descripción**: Obtiene lista de vendedores disponibles para asignación.

**Retorna**: Array de vendedores

**Formato**:
```typescript
[
  { id: '1', nombre: 'Lucía Paredes', avatar: '🧑‍💼' },
  { id: '2', nombre: 'Carlos Mendez', avatar: '👨‍💼' },
  { id: '3', nombre: 'Ana García', avatar: '👩‍💼' },
  { id: '4', nombre: 'Roberto Silva', avatar: '👨‍💻' }
]
```

**Conexión a BD (futuro)**:
```typescript
export async function obtenerVendedoresDisponibles() {
  const response = await axios.get('/api/vendedores');
  return response.data;
}
```

---

### Interfaz: BulkActionResult

```typescript
export interface BulkActionResult {
  success: boolean;           // ¿Operación exitosa?
  message: string;            // Mensaje para usuario
  affectedCount: number;      // Cantidad de items afectados
  errors?: string[];          // Array de errores (si aplica)
}
```

**Ejemplo de resultado exitoso**:
```typescript
{
  success: true,
  message: "3 leads movidos a 'Calificados'",
  affectedCount: 3
}
```

**Ejemplo de resultado con error**:
```typescript
{
  success: false,
  message: "Error al mover leads",
  affectedCount: 0,
  errors: ["Error: Network timeout", "Error: Invalid status"]
}
```

---

## Componentes

### Componente: BulkActionsBar

**Archivo**: `frontend/components/matrix/BulkActionsBar.tsx`

**Props**:
```typescript
interface BulkActionsBarProps {
  selectedLeads: Lead[];                              // Leads a operar
  onAction: (action: string, data?: BulkActionData) => void;
  onClearSelection: () => void;                       // Limpia selección
  columnConfigs: Array<{                              // Configuración de columnas
    id: LeadStatus;
    titulo: string;
    color: string;
    icono: string;
  }>;
}

interface BulkActionData {
  [key: string]: unknown;                             // Datos flexibles
}
```

**Estados Internos**:
```typescript
const [isLoading, setIsLoading] = useState(false);    // Durante operación
const [showMoveMenu, setShowMoveMenu] = useState(false);
const [showAssignMenu, setShowAssignMenu] = useState(false);
const [showTagMenu, setShowTagMenu] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [showNewTagInput, setShowNewTagInput] = useState(false);
const [newTag, setNewTag] = useState('');
```

**Handlers Principales**:
```typescript
// Mueve todos a una columna
const handleMoveLeads = async (targetStatus: LeadStatus) => { ... }

// Asigna vendedor
const handleAssignVendedor = async (vendedor) => { ... }

// Agrega etiqueta
const handleAddTag = async (tag: string) => { ... }

// Exporta a CSV
const handleExport = () => { ... }

// Elimina con confirmación
const handleDeleteLeads = async () => { ... }
```

**Características UI**:
- Barra flotante fixed bottom-0
- Contador de leads seleccionados
- 5 botones de acción con dropdowns
- Deshabilitación durante operaciones
- Cierre automático después de acciones

---

### Componente: LeadCard (Modificado)

**Cambios Principales**:
```tsx
// Checkbox en posición absoluta
<label className="absolute left-2 top-1/2 -translate-y-1/2">
  <input
    type="checkbox"
    checked={isSelected}
    className="w-4 h-4 cursor-pointer accent-blue-500"
  />
</label>

// Indicador visual de selección
{isSelected && (
  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full">
    ✓
  </div>
)}

// Border color cambia con selección
className={`... ${
  isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
}`}
```

**Props Nuevos**:
```typescript
// Ya existían, se mantienen
viewMode?: 'compact' | 'expanded';
density?: 'comfortable' | 'compact' | 'dense';
```

**Integración con DragContext**:
```typescript
const { isLeadSelected, toggleLeadSelection } = useDragContext();
```

---

### Componente: MatrixKanbanView (Modificado)

**Nuevos Estados**:
```typescript
const [bulkActionNotification, setBulkActionNotification] = useState<{ 
  message: string; 
  type: 'success' | 'error' 
} | null>(null);

const { selectedLeads } = useDragContext();
```

**Nuevos useMemo**:
```typescript
// Obtener todos los leads
const allLeads = useMemo(() => 
  Object.values(columnsState).flatMap(col => col.leads),
  [columnsState]
);

// Convertir Set a Array
const selectedLeadsArray = useMemo(() => {
  return Array.from(selectedLeads)
    .map(id => allLeads.find(lead => lead.id === id))
    .filter(Boolean) as Lead[];
}, [selectedLeads, allLeads]);
```

**Render Condicional**:
```tsx
{selectedLeadsArray.length > 0 && (
  <BulkActionsBar
    selectedLeads={selectedLeadsArray}
    onAction={handleBulkAction}
    onClearSelection={clearSelection}
    columnConfigs={COLUMN_CONFIGS}
  />
)}
```

---

## Contexto

### Archivo: `frontend/contexts/DragContext.tsx`

**Interfaz Extendida**:
```typescript
interface DragContextState {
  selectedLeads: Set<string>;                           // IDs de seleccionados
  toggleLeadSelection: (leadId: string, isMultiSelect: boolean) => void;
  clearSelection: () => void;                           // Limpia todo
  isLeadSelected: (leadId: string) => boolean;          // Verifica uno
  getSelectedLeadsArray: (allLeads: Lead[]) => Lead[]; // Convierte a array
}
```

**Uso en LeadCard**:
```typescript
const { isLeadSelected, toggleLeadSelection } = useDragContext();

// En checkbox click handler
toggleLeadSelection(lead.id, true);  // true = multi-select
```

**Uso en MatrixKanbanView**:
```typescript
const { selectedLeads, clearSelection } = useDragContext();

// Para obtener array de leads seleccionados
const selectedLeadsArray = useMemo(() => {
  return Array.from(selectedLeads)
    .map(id => allLeads.find(lead => lead.id === id))
    .filter(Boolean) as Lead[];
}, [selectedLeads, allLeads]);
```

---

## Integración

### Flujo de Datos

```
┌─────────────────┐
│   LeadCard      │ ← Usuario hace click en checkbox
│   [✓ checkbox]  │
└────────┬────────┘
         │ toggleLeadSelection(leadId, true)
         ↓
┌─────────────────────────┐
│   DragContext           │
│   selectedLeads: Set    │ ← Mantiene {id1, id2, id3}
└────────┬────────────────┘
         │ Hook: useDragContext()
         ↓
┌──────────────────────────────┐
│ MatrixKanbanView             │
│ selectedLeadsArray: Lead[]   │ ← Array derivado del Set
└────────┬─────────────────────┘
         │ selectedLeadsArray.length > 0
         ↓
┌────────────────────────────┐
│ BulkActionsBar aparece     │
│ [Mover] [Vendedor] [...]   │
└────────┬───────────────────┘
         │ onClick → handleBulkAction()
         ↓
┌──────────────────────────────────────┐
│ bulk-actions.service                │
│ moverLeadsMasiva() / exportarLeads() │
└────────┬─────────────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Notificación de éxito/error    │
│ setBulkActionNotification()    │
└────────────────────────────────┘
```

---

## Testing

### Unit Tests (Recomendado)

```typescript
// bulk-actions.service.test.ts

describe('Bulk Actions Service', () => {
  describe('moverLeadsMasiva', () => {
    it('debe mover múltiples leads', async () => {
      const leads = [
        { id: '1', status: 'new' },
        { id: '2', status: 'new' }
      ];
      
      const result = await moverLeadsMasiva(leads, 'qualified');
      
      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
    });

    it('debe retornar error si leads vacío', async () => {
      const result = await moverLeadsMasiva([], 'qualified');
      
      expect(result.success).toBe(false);
    });
  });

  describe('exportarLeadsCSV', () => {
    it('debe generar CSV válido', () => {
      const leads = [
        { 
          id: '1', 
          nombre: 'Test', 
          email: 'test@example.com',
          etiquetas: ['tag1', 'tag2']
        }
      ];
      
      // Mock document.createElement, etc.
      exportarLeadsCSV(leads);
      
      // Verificar que URL.createObjectURL fue llamado
    });
  });

  describe('eliminarLeadsMasiva', () => {
    it('debe confirmar eliminación', async () => {
      const leads = [{ id: '1' }, { id: '2' }];
      
      // Mockear confirmación
      window.confirm = jest.fn(() => true);
      
      const result = await eliminarLeadsMasiva(leads);
      expect(result.affectedCount).toBe(2);
    });
  });
});
```

### Integration Tests

```typescript
// MatrixKanbanView.integration.test.tsx

describe('BulkActions Integration', () => {
  it('debe mostrar BulkActionsBar cuando hay selección', async () => {
    const { getByTestId, getByText } = render(<MatrixKanbanView />);
    
    // Seleccionar un lead
    const checkbox = getByTestId('lead-checkbox-1');
    fireEvent.click(checkbox);
    
    // Verificar que barra aparece
    expect(getByText('1 lead seleccionado')).toBeInTheDocument();
  });

  it('debe mover leads masivamente', async () => {
    const { getByText, getByTestId } = render(<MatrixKanbanView />);
    
    // Seleccionar 3 leads
    fireEvent.click(getByTestId('lead-checkbox-1'));
    fireEvent.click(getByTestId('lead-checkbox-2'));
    fireEvent.click(getByTestId('lead-checkbox-3'));
    
    // Click en Mover
    fireEvent.click(getByText('Mover'));
    
    // Seleccionar columna
    fireEvent.click(getByText('Calificados'));
    
    // Esperar notificación
    await waitFor(() => {
      expect(getByText(/3 leads movidos/)).toBeInTheDocument();
    });
  });
});
```

### Manual Testing Checklist

```markdown
## Selección
- [ ] Click en checkbox selecciona 1 lead
- [ ] Cmd+Click selecciona múltiples
- [ ] Shift+Click selecciona rango
- [ ] Barra aparece al seleccionar
- [ ] Contador actualiza correctamente

## Mover
- [ ] Dropdown muestra todas columnas
- [ ] Seleccionar columna ejecuta acción
- [ ] Notificación muestra resultado
- [ ] Leads se mueven en UI

## Asignar Vendedor
- [ ] Dropdown muestra vendedores
- [ ] Seleccionar asigna a todos
- [ ] Vendedor actualiza en cards
- [ ] Notificación confirma

## Etiqueta
- [ ] Click abre input
- [ ] Enter agrega etiqueta
- [ ] Etiqueta aparece en cards
- [ ] Múltiples etiquetas funcionan

## Exportar
- [ ] CSV se descarga
- [ ] Archivo tiene formato correcto
- [ ] Abre en Excel sin errores
- [ ] Todos los campos presentes

## Eliminar
- [ ] Modal confirma cantidad
- [ ] Botón Eliminar borra
- [ ] Botón Cancelar cancela
- [ ] Notificación confirma
```

---

## Extensión Futura

### V2: Backend Integration

```typescript
// Reemplazar simulaciones con API calls

async function moverLeadsMasiva(leads: Lead[], targetStatus: LeadStatus) {
  const response = await axios.post('/api/leads/bulk-move', {
    leadIds: leads.map(l => l.id),
    targetStatus,
    timestamp: new Date().toISOString()
  });
  
  return response.data as BulkActionResult;
}
```

### V3: Undo/Redo

```typescript
interface BulkActionHistory {
  id: string;
  action: string;
  leads: Lead[];
  timestamp: Date;
  previousState: Record<string, any>;
  nextState: Record<string, any>;
}

// Stack de acciones
const [history, setHistory] = useState<BulkActionHistory[]>([]);

function undo() {
  if (history.length === 0) return;
  const last = history[history.length - 1];
  // Revertir cambios
}
```

### V4: Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedLeads.size > 0) {
      // Confirmar y eliminar
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      // Seleccionar todos en columna actual
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [selectedLeads]);
```

### V5: Batch Progress

```typescript
interface BulkActionProgress {
  total: number;
  processed: number;
  errors: number;
  currentIndex: number;
}

const [progress, setProgress] = useState<BulkActionProgress | null>(null);

// UI: Progress bar en barra de acciones
{progress && (
  <div className="w-32 bg-gray-200 rounded-full">
    <div 
      className="bg-blue-600 h-2 rounded-full"
      style={{ width: `${(progress.processed / progress.total) * 100}%` }}
    />
    <span className="text-xs">{progress.processed}/{progress.total}</span>
  </div>
)}
```

### V6: Permisos Granulares

```typescript
interface BulkActionPermission {
  canMove: boolean;
  canAssignVendor: boolean;
  canAddTag: boolean;
  canExport: boolean;
  canDelete: boolean;
  maxDeleteCount?: number;
}

// En componente
function renderBulkActionsBar() {
  const permissions = getUserPermissions();
  
  return (
    <>
      {permissions.canMove && <MoveButton />}
      {permissions.canAssignVendor && <AssignButton />}
      {permissions.canDelete && <DeleteButton />}
      {/* etc */}
    </>
  );
}
```

---

**Última actualización**: 2026-02-04
**Versión**: 1.0.0
**Autor**: Development Team
