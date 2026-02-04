# 🎯 Vista Kanban para Matrix Keila - Implementación

## 📋 Descripción General

Se ha implementado una vista Kanban completa para el sistema Matrix Keila, permitiendo gestionar leads en diferentes etapas de conversión mientras se mantiene la funcionalidad completa de mensajería multicanal (WhatsApp, Facebook, Instagram).

## 🏗️ Arquitectura de la Solución

### Toggle de Vistas

La página principal de Matrix ahora soporta dos vistas:

1. **Vista Inbox** (Original) - Layout de 3 columnas para gestión de conversaciones
2. **Vista Kanban** (Nueva) - Pipeline de leads con seguimiento de conversión

```
┌──────────────────────────────────────────────────────────────────┐
│  MATRIX KEILA - Contact Center                                   │
│  [Inbox] [Kanban] ← Toggle de vistas                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  VISTA KANBAN:                                                    │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐  │
│  │ 🆕 New  │ 👀 Rev  │ ❌ Rej  │ ✅ Qual │ 📂 Open │ 💰 Deal │  │
│  │  4 L    │  3 L    │  2 L    │  4 L    │  3 L    │  2 L    │  │
│  │ $3.3k   │ $3.2k   │ $3.2k   │ $3.2k   │ $540    │ $425    │  │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤  │
│  │ [Card]  │ [Card]  │ [Card]  │ [Card]  │ [Card]  │ [Card]  │  │
│  │ [Card]  │ [Card]  │ [Card]  │ [Card]  │         │         │  │
│  │ [Card]  │         │         │ [Card]  │         │         │  │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 📦 Componentes Creados

### 1. Tipos TypeScript Extendidos (`/frontend/types/matrix.ts`)

```typescript
export type LeadStatus = 'new' | 'reviewing' | 'rejected' | 'qualified' | 'open' | 'in-progress' | 'open-deal';

export interface Lead {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  avatar?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  status: LeadStatus;
  canal: CanalType; // whatsapp | facebook | instagram
  valorEstimado?: number;
  notas?: string;
  conversacionId?: string; // 🔗 Vinculado a conversaciones
  etiquetas: string[];
  asignadoA?: string;
}
```

**Característica clave:** Cada Lead puede estar vinculado a una `Conversacion` mediante `conversacionId`, permitiendo navegación fluida entre vistas.

### 2. LeadCard (`/frontend/components/matrix/LeadCard.tsx`)

Tarjeta individual de lead con toda la información relevante.

**Características:**
- Avatar con iniciales o imagen
- Información de contacto (teléfono, email)
- Valor estimado con formato de moneda
- Indicador de canal (WA/FB/IG)
- Etiquetas (max 2 visibles + contador)
- Tiempo relativo desde creación
- Botón de acceso rápido a conversación vinculada 💬
- Hover effects y animaciones

**Ejemplo visual:**
```
┌──────────────────────────┐
│ BS  Brooklyn Simmons    •│
│     hace 2d              │
│                          │
│ 📞 (817) 234-9182        │
│ ✉️  brooklyn@gmail.com   │
│                          │
│ 💰 $2,568.24             │
│                          │
│ New lead as of 5/13/24   │
│                          │
│ [WA] [Promoción] [Nueva] │💬
└──────────────────────────┘
```

### 3. KanbanColumn (`/frontend/components/matrix/KanbanColumn.tsx`)

Columna del tablero Kanban con header, lista de leads y footer con estadísticas.

**Características:**
- Header con icono, título y color personalizado
- Contador de leads en badge
- Valor total de la columna
- Botón para agregar lead (opcional)
- Scroll vertical para la lista
- Estado vacío con mensaje
- Sistema de colores configurable:
  - 🆕 New Leads (Púrpura)
  - 👀 Reviewing (Naranja)
  - ❌ Rejected (Rojo)
  - ✅ Qualified (Verde)
  - 📂 Open (Azul)
  - ⚡ In Progress (Índigo)
  - 💰 Open Deal (Amarillo)

### 4. MatrixKanbanView (`/frontend/components/matrix/MatrixKanbanView.tsx`)

Vista principal del Kanban con todas las columnas y controles.

**Características principales:**

#### Header
- Título con estadísticas globales
- Búsqueda en tiempo real (nombre, email, teléfono)
- Filtro por canal (Todos/WhatsApp/Facebook/Instagram)
- Botón de configuración

#### Grid de Columnas
- 7 columnas configurables
- Scroll horizontal fluido
- Ancho fijo por columna (280px)
- Altura dinámica con scroll vertical

#### Footer con Estadísticas
- Total de leads
- Nuevos hoy
- Calificados
- Deals activos
- Valor total del pipeline

## 🔄 Integración con Sistema de Conversaciones

### Flujo de Navegación

1. **Desde Kanban a Conversación:**
   ```typescript
   handleLeadClick(lead) {
     if (lead.conversacionId) {
       // Cambia automáticamente a vista Inbox
       setVistaActual('inbox');
       setConversacionActiva(lead.conversacionId);
     }
   }
   ```

2. **Desde Conversación a Kanban:**
   - Usuario puede alternar libremente con el toggle
   - Estado de conversación se mantiene

3. **Botón Rápido en LeadCard:**
   - Icono 💬 en la tarjeta
   - Abre conversación directamente sin cambiar de vista completa
   - Útil para respuesta rápida

## 🎨 Sistema de Diseño

### Paleta de Colores por Estado

```css
/* New Leads */
.status-new {
  --bg: #F3E8FF;
  --border: #D8B4FE;
  --text: #7C3AED;
}

/* Reviewing */
.status-reviewing {
  --bg: #FFF7ED;
  --border: #FED7AA;
  --text: #EA580C;
}

/* Rejected */
.status-rejected {
  --bg: #FEF2F2;
  --border: #FECACA;
  --text: #DC2626;
}

/* Qualified */
.status-qualified {
  --bg: #F0FDF4;
  --border: #BBF7D0;
  --text: #16A34A;
}

/* Open */
.status-open {
  --bg: #EFF6FF;
  --border: #BFDBFE;
  --text: #2563EB;
}

/* In Progress */
.status-in-progress {
  --bg: #EEF2FF;
  --border: #C7D2FE;
  --text: #4F46E5;
}

/* Open Deal */
.status-open-deal {
  --bg: #FEFCE8;
  --border: #FEF08A;
  --text: #CA8A04;
}
```

### Iconos por Estado

- 🆕 New Leads
- 👀 Reviewing
- ❌ Rejected
- ✅ Qualified
- 📂 Open
- ⚡ In Progress
- 💰 Open Deal

## 📊 Datos Demo Implementados

Se incluyen 11 leads de ejemplo que demuestran:
- Diferentes estados del pipeline
- Múltiples canales (WhatsApp, Facebook, Instagram)
- Rangos variados de valor estimado ($425 - $2,568)
- Algunos vinculados a conversaciones existentes
- Diferentes fechas de creación
- Etiquetas variadas (Promoción, VIP, Urgente, etc.)

## 🚀 Uso

### Cambiar entre vistas

```tsx
// En el header de Matrix Keila
<div className="flex items-center bg-gray-100 rounded-lg p-1">
  <button onClick={() => setVistaActual('inbox')}>
    <MessageSquare /> Inbox
  </button>
  <button onClick={() => setVistaActual('kanban')}>
    <LayoutGrid /> Kanban
  </button>
</div>
```

### Abrir conversación desde Kanban

```tsx
// Click en una tarjeta de lead
<LeadCard 
  lead={lead}
  onClick={() => handleLeadClick(lead)}
  onOpenConversation={(convId) => handleSelectConversacion(convId)}
/>
```

### Buscar y filtrar leads

```tsx
// Búsqueda en tiempo real
<Input
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  placeholder="Buscar por nombre, email o teléfono..."
/>

// Filtro por canal
<select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)}>
  <option value="todos">Todos los canales</option>
  <option value="whatsapp">WhatsApp</option>
  <option value="facebook">Facebook</option>
  <option value="instagram">Instagram</option>
</select>
```

## 🔮 Funcionalidades Futuras (TODO)

### Drag & Drop
```typescript
// Implementar react-beautiful-dnd o dnd-kit
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const onDragEnd = (result) => {
  // Mover lead entre columnas
  // Actualizar estado en backend
  // Registrar actividad en timeline
};
```

### Conversión Automática
```typescript
// Convertir conversación a lead automáticamente
const convertirConversacionALead = async (conversacionId: string) => {
  const conversacion = await obtenerConversacion(conversacionId);
  
  const nuevoLead: Lead = {
    nombre: conversacion.nombreContacto,
    telefono: conversacion.telefono,
    canal: conversacion.canal,
    status: 'new',
    conversacionId: conversacion.id,
    fechaCreacion: new Date(),
    // ...
  };
  
  await crearLead(nuevoLead);
};
```

### Timeline de Actividades
```typescript
interface ActividadLead {
  id: string;
  leadId: string;
  tipo: 'cambio_estado' | 'mensaje' | 'nota' | 'tarea';
  descripcion: string;
  fecha: Date;
  usuario: string;
}
```

### Automatizaciones
- Mover a "Reviewing" después de 3 mensajes
- Marcar como "Rejected" si no hay respuesta en 7 días
- Notificar cuando un lead llega a "Qualified"
- Asignar automáticamente por canal o región

## 📝 Notas Técnicas

### Performance
- Virtualización de listas para +100 leads por columna
- Lazy loading de conversaciones vinculadas
- Memoización de componentes con React.memo
- Optimistic updates para mejor UX

### Responsive Design
- En móviles: Vista de lista vertical
- En tablets: 3-4 columnas visibles
- En desktop: Todas las columnas visibles con scroll horizontal

### Accesibilidad
- Navegación por teclado (Tab, Enter, Escape)
- ARIA labels en todos los elementos interactivos
- Contraste de colores WCAG AA compliant
- Anuncios de cambios de estado para lectores de pantalla

## 🎯 Métricas de Éxito

El dashboard de Kanban permite visualizar:
- **Tasa de conversión:** Qualified / New Leads
- **Tiempo promedio:** Días en cada etapa
- **Valor del pipeline:** Suma de valorEstimado
- **Abandono:** Leads en Rejected
- **Velocidad:** Leads procesados por día

## 🔗 Archivos Modificados/Creados

1. ✅ `/frontend/types/matrix.ts` - Tipos extendidos
2. ✅ `/frontend/components/matrix/LeadCard.tsx` - Componente nuevo
3. ✅ `/frontend/components/matrix/KanbanColumn.tsx` - Componente nuevo
4. ✅ `/frontend/components/matrix/MatrixKanbanView.tsx` - Vista principal
5. ✅ `/frontend/app/matrix/page.tsx` - Integración con toggle

---

**Implementación completada:** 3 de febrero de 2026  
**Status:** ✅ Funcional en modo demo  
**Próximos pasos:** Conectar con APIs reales y agregar drag & drop
