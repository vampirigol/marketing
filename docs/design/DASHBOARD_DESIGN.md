# 📊 Dashboard Principal - CRM RCA

## 🎯 Objetivo del Dashboard

Proporcionar una vista general del estado del sistema personalizada según el rol del usuario, con acceso rápido a las acciones más frecuentes.

## 🏗️ Estructura del Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px)       │         MAIN CONTENT AREA              │
│  ┌──────────────────┐  │  ┌─────────────────────────────────┐  │
│  │  Logo RCA        │  │  │  TOP BAR (64px)                  │  │
│  │  [🏥 RCA]        │  │  │  ┌────────────┬──────────────┐   │  │
│  └──────────────────┘  │  │  │ Bienvenido │ Notifications│   │  │
│                        │  │  │ [Nombre]   │  [🔔] [👤]  │   │  │
│  📊 Dashboard         │  │  └────────────┴──────────────┘   │  │
│  👥 Pacientes         │  │                                   │  │
│  📅 Citas             │  │  ┌─────────────────────────────┐ │  │
│  💬 Matrix Keila      │  │  │                             │ │  │
│  💰 Finanzas          │  │  │   DASHBOARD CONTENT         │ │  │
│  📈 Reportes          │  │  │   (Dinámico por rol)        │ │  │
│  ⚙️  Configuración    │  │  │                             │ │  │
│                        │  │  │   • KPIs                    │ │  │
│  ─────────────────    │  │  │   • Gráficos                │ │  │
│  Sucursal Actual:     │  │  │   • Acciones rápidas        │ │  │
│  [📍 CDMX Centro]     │  │  │   • Actividad reciente      │ │  │
│                        │  │  │                             │ │  │
│  Usuario:             │  │  └─────────────────────────────┘ │  │
│  [Keila M.]           │  │                                   │  │
│  [Contact Center]     │  │                                   │  │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Dashboard por Rol

### 🎧 DASHBOARD - KEILA (Contact Center)

#### KPIs Principales (4 tarjetas)
```
┌────────────┬────────────┬────────────┬────────────┐
│ 📬 Nuevos  │ ⏰ Citas   │ 💬 Convs.  │ ✅ Confir- │
│  Leads     │   Hoy      │  Activas   │   madas    │
│            │            │            │            │
│   47       │   128      │    23      │   96/128   │
│  +12% ↑   │   Hoy      │   Matrix   │   75%      │
└────────────┴────────────┴────────────┴────────────┘
```

#### Sección: Matrix Keila (Conversaciones Activas)
```
┌─────────────────────────────────────────────────────────┐
│  💬 CONVERSACIONES ACTIVAS                     [Ver →] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [WA] María González                    Hace 2 min     │
│  "Hola, quisiera agendar una cita..."    [Responder]   │
│  ─────────────────────────────────────────────────────  │
│  [IG] @juanperez                        Hace 5 min     │
│  "¿Tienen promoción?"                    [Responder]   │
│  ─────────────────────────────────────────────────────  │
│  [FB] Ana Rodríguez                     Hace 8 min     │
│  "Quiero reagendar mi cita"              [Responder]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Sección: Citas del Día
```
┌─────────────────────────────────────────────────────────┐
│  📅 CITAS DEL DÍA - Todas las Sucursales               │
├─────────────────────────────────────────────────────────┤
│  Línea de tiempo:                                       │
│                                                         │
│  09:00 ──●── Pedro Sánchez [CDMX Centro]               │
│           [✅ Confirmada] [Medicina General]            │
│                                                         │
│  10:00 ──○── Laura Martínez [Guadalajara]              │
│           [⏰ Pendiente] [Odontología] [PROMOCIÓN]      │
│                                                         │
│  10:30 ──●── Carlos López [CDMX Centro]                │
│           [✅ Confirmada] [Pediatría]                   │
│                                                         │
│  11:00 ──⚠── Ana García [Monterrey]                    │
│           [❌ No confirmó] [Ginecología]                │
│           [Enviar recordatorio]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Acciones Rápidas
```
┌──────────────────────────────────────┐
│  ACCIONES RÁPIDAS                    │
├──────────────────────────────────────┤
│  [+ Nueva Cita]  [📋 Reagendar]     │
│  [👤 Nuevo Pac]  [💬 Ver Matrix]    │
└──────────────────────────────────────┘
```

---

### 💰 DASHBOARD - ANTONIO / YARETZI (Finanzas)

#### KPIs Financieros
```
┌────────────┬────────────┬────────────┬────────────┐
│ 💵 Corte   │ 📊 Ingresos│ 🎯 Meta    │ 💳 Abonos  │
│   del Día  │  del Mes   │  Mensual   │   Pend.    │
│            │            │            │            │
│ $45,280    │ $389,450   │ $500,000   │   23       │
│  8 hrs     │  78% ↑     │   78%      │  Revisar   │
└────────────┴────────────┴────────────┴────────────┘
```

#### Gráfico: Ingresos por Sucursal (Mes Actual)
```
┌─────────────────────────────────────────────────────────┐
│  📈 INGRESOS POR SUCURSAL                 [Mes ▼]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CDMX Centro     ████████████████████ $125,000         │
│  Guadalajara     ████████████████ $98,500               │
│  Monterrey       ███████████████ $87,300                │
│  Puebla          ████████████ $78,650                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Tabla: Cortes Pendientes de Revisión
```
┌─────────────────────────────────────────────────────────┐
│  ⏰ CORTES PENDIENTES DE REVISIÓN                       │
├───────────┬──────────┬───────────┬──────────────────────┤
│ Sucursal  │  Fecha   │  Monto    │  Acciones            │
├───────────┼──────────┼───────────┼──────────────────────┤
│ CDMX Cen  │ 02-Feb   │ $12,450   │ [Revisar] [Aprobar]  │
│ Gdl Sur   │ 02-Feb   │ $8,920    │ [Revisar] [Aprobar]  │
│ Monterrey │ 01-Feb   │ $15,300   │ [Revisar] [Aprobar]  │
└───────────┴──────────┴───────────┴──────────────────────┘
```

#### Gráfico: Métodos de Pago (Hoy)
```
┌──────────────────────────────┐
│  MÉTODOS DE PAGO - HOY       │
├──────────────────────────────┤
│                              │
│  🟢 Efectivo   42% ($19k)    │
│  🔵 Tarjeta    38% ($17k)    │
│  🟣 Transfer.  20% ($9k)     │
│                              │
│  [Gráfico de dona]           │
│                              │
└──────────────────────────────┘
```

---

### 🏥 DASHBOARD - RECEPCIÓN (Sucursal)

#### Vista Compacta de Operación Diaria
```
┌────────────┬────────────┬────────────┬────────────┐
│ 👥 Esperan │ 👨‍⚕️ En    │ ✅ Atendi- │ ❌ No     │
│            │  Consulta  │   dos      │  Llegaron  │
│     5      │     3      │    42      │     8      │
└────────────┴────────────┴────────────┴────────────┘
```

#### Lista de Pacientes en Sala de Espera
```
┌─────────────────────────────────────────────────────────┐
│  👥 SALA DE ESPERA                        [Actualizar]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. María Sánchez      09:00  [15 min] 🟢              │
│     Dra. López - Consultorio 2                          │
│     [✅ Marcar en consulta]  [💰 Registrar abono]      │
│  ─────────────────────────────────────────────────────  │
│  2. Pedro Gómez        09:30  [8 min]  🟡              │
│     Dr. Ramírez - Consultorio 1                         │
│     [✅ Marcar en consulta]  [💰 Registrar abono]      │
│  ─────────────────────────────────────────────────────  │
│  3. Ana Martínez       10:00  [Llega ahora] 🔵         │
│     Dra. Torres - Consultorio 3                         │
│     [✅ Marcar llegada]                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Citas Próximas (Siguiente Hora)
```
┌─────────────────────────────────────────────────────────┐
│  ⏰ PRÓXIMAS CITAS (1 hora)                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  10:30  Carlos López       [✅ Confirmada]              │
│  11:00  Laura Hernández    [⏰ Sin confirmar]           │
│  11:15  José Rodríguez     [✅ Confirmada]              │
│  11:30  Patricia Díaz      [⏰ Sin confirmar]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Elementos Visuales Clave

### 1. Header Superior (Top Bar)

```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Buscar paciente, No. Afiliación...]                    │
│                                                             │
│  Sucursal: [📍 CDMX Centro ▼]     [🔔 5]  [👤 Keila M. ▼] │
└─────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Búsqueda global (siempre visible)
- Selector de sucursal (si tiene acceso a múltiples)
- Notificaciones (badge con contador)
- Menú de usuario (perfil, configuración, cerrar sesión)

### 2. Sidebar (Navegación Principal)

```css
Ancho: 240px (expandido) / 64px (colapsado)
Fondo: --gray-900 (dark) / white (light)
Iconos: 24px
Padding: 16px
```

**Ítems de Menú:**
- Dashboard (🏠)
- Pacientes (👥)
- Citas (📅)
- Matrix Keila (💬) - Badge con contador de mensajes no leídos
- Finanzas (💰)
- Reportes (📈)
- Configuración (⚙️)

**Interacción:**
- Hover: Fondo --gray-800
- Activo: Borde izquierdo azul + fondo destacado
- Badge de notificaciones en Matrix

### 3. Tarjetas de KPI

```css
Diseño:
- Fondo: white
- Border-radius: 12px
- Padding: 24px
- Box-shadow: suave

Contenido:
- Icono (32px) - Esquina superior izquierda
- Título (text-sm, gray-600)
- Valor principal (text-3xl, bold)
- Subtítulo / Comparación (text-xs, verde/rojo)
- Mini-gráfico sparkline (opcional)
```

### 4. Tabla de Datos

```css
Header:
- Fondo: --gray-50
- Texto: --gray-700, font-semibold
- Altura: 48px

Filas:
- Hover: --gray-50
- Borde inferior: 1px solid --gray-200
- Altura: 64px
- Padding: 16px

Acciones:
- Botones iconos (edit, delete, más)
- Aparecen en hover
```

### 5. Badges de Estado

```javascript
const estadoBadges = {
  confirmada: {
    color: 'success-green',
    icon: '✓',
    text: 'Confirmada'
  },
  pendiente: {
    color: 'warning-orange',
    icon: '⏰',
    text: 'Pendiente'
  },
  cancelada: {
    color: 'danger-red',
    icon: '✕',
    text: 'Cancelada'
  },
  promocion: {
    color: 'promotion-purple',
    icon: '🎁',
    text: 'Promoción'
  }
};
```

## 📐 Grid System

Dashboard usa un sistema de 12 columnas:

```
Mobile:   1 columna  (1/1)
Tablet:   2 columnas (1/2)
Desktop:  3-4 columnas (1/3, 1/4)
```

**Ejemplo - KPIs:**
- Mobile: Stack vertical (4 tarjetas apiladas)
- Tablet: 2×2 grid
- Desktop: 4 columnas horizontales

## 🔄 Estados Interactivos

### Loading State
```
Skeleton screens para:
- Tarjetas de KPI
- Tablas
- Gráficos

Shimmer animation de izquierda a derecha
```

### Empty State
```
┌─────────────────────────────────┐
│                                 │
│        [📋 Icono grande]        │
│                                 │
│    No hay citas para hoy        │
│                                 │
│   [+ Agendar primera cita]      │
│                                 │
└─────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│        [⚠️ Icono]               │
│                                 │
│   Error al cargar los datos     │
│                                 │
│   [Reintentar]                  │
└─────────────────────────────────┘
```

## 🎯 Interacciones Clave

### 1. Acción Rápida: Agendar Cita
```
Click en [+ Nueva Cita] → Modal slide-in desde derecha
```

### 2. Filtros
```
Dropdown con checkboxes:
- Sucursal
- Estado
- Rango de fechas
- Tipo de consulta
```

### 3. Notificaciones
```
Click en 🔔 → Dropdown con lista
- Mensaje no leído (fondo azul claro)
- Mensaje leído (fondo blanco)
- Acción: Marcar todas como leídas
```

## 📱 Responsive Behavior

### Mobile (< 768px)
- Sidebar: Colapsado, solo iconos
- KPIs: Stack vertical
- Tablas: Card layout con detalles colapsables
- Bottom navigation bar para acciones principales

### Tablet (768px - 1023px)
- Sidebar: Puede colapsarse
- KPIs: 2×2 grid
- Tablas: Scroll horizontal

### Desktop (1024px+)
- Layout completo
- Sidebar siempre visible
- Todo en una vista

## 🎨 Microinteracciones

1. **Hover en tarjetas**: Elevación suave (shadow)
2. **Click en botones**: Escala 0.98, duración 150ms
3. **Toggle switches**: Animación suave de transición
4. **Badges de estado**: Pulse animation cuando cambia
5. **Carga de datos**: Shimmer effect

## 📊 Widgets Adicionales

### Calendario Mini
```
Mostrar en sidebar derecho (opcional)
Vista mensual compacta
Días con citas marcados
Click → Ir a vista de citas del día
```

### Actividad Reciente
```
Feed de últimas acciones:
- "Keila agendó cita para María S."
- "Antonio aprobó corte de CDMX"
- "Nuevo lead desde Instagram"
```

### Clima / Horario
```
Mostrar hora local de la sucursal activa
Útil para Contact Center multi-sucursal
```

## 🚀 Próximos Pasos

1. Ver [Matrix Keila Design](./MATRIX_DESIGN.md)
2. Ver [Módulo de Citas](./CITAS_DESIGN.md)
3. Ver [Módulo Financiero](./FINANZAS_DESIGN.md)
