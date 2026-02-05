# 📅 Módulo de Citas - Sistema de Agenda Médica

## 📋 Descripción General

Sistema completo de gestión de citas médicas con calendario interactivo de 3 vistas (Día, Semana, Mes), filtros avanzados por sucursal, médico, tipo de consulta y estado. Incluye modal de detalle con acciones rápidas (confirmar, marcar llegada, cancelar).

## 🏗️ Arquitectura de Componentes

### Estructura de Archivos

```
frontend/
├── app/
│   └── citas/
│       └── page.tsx                 # Página principal con estado y demo
├── components/
│   └── citas/
│       ├── CalendarView.tsx         # Vista de calendario (3 modos)
│       ├── CitaCard.tsx             # Tarjeta de cita individual
│       ├── CitaModal.tsx            # Modal de detalle completo
│       └── CitasFilters.tsx         # Panel de filtros avanzados
└── types/
    └── index.ts                     # Tipos actualizados con campos de cita
```

## 📦 Componentes Creados

### 1. `/app/citas/page.tsx` - Página Principal

**Responsabilidades:**
- Gestión de estado global de citas
- Generación de datos demo (8-12 citas/día por 7 días)
- Aplicación de filtros en tiempo real
- Cálculo de estadísticas
- Coordinación entre componentes

**Estado:**
```typescript
const [vista, setVista] = useState<'dia' | 'semana' | 'mes'>('dia');
const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
const [modalAbierto, setModalAbierto] = useState(false);
const [filters, setFilters] = useState<CitasFilterState>({ soloPromociones: false });
const [citas, setCitas] = useState<Cita[]>([]);
```

**Estadísticas Calculadas:**
- Total de citas
- Citas confirmadas (con %)
- Citas pendientes por confirmar
- Promociones activas
- Saldo pendiente total

**Características:**
- ✅ Generación automática de citas demo
- ✅ Filtrado multidimensional
- ✅ 5 KPIs visuales con gradientes
- ✅ Advertencia de modo demo
- ✅ Selector de vista (Día/Semana/Mes)
- ✅ Contador de resultados filtrados

### 2. `/components/citas/CalendarView.tsx` - Vista de Calendario

**3 Modos de Visualización:**

#### Vista Día (Timeline)
```
┌─────────────────────────────────────────┐
│  ← Hoy  Martes 3 de Febrero 2026  →    │
├──────┬──────────────────────────────────┤
│ 08:00│                                  │
│      │ ┌──────────────────────────────┐ │
├──────┤ │ 08:30 María González       │ │
│ 09:00│ │ Primera Vez • Dr. López    │ │
│      │ │ [Confirmada] 🎁 Promo      │ │
├──────┤ └──────────────────────────────┘ │
│ 10:00│ ┌───────┐ ┌────────────────────┐ │
│      │ │ Pedro │ │ Ana Martínez       │ │
└──────┴─┴───────┴─┴────────────────────┴─┘
```

**Características:**
- Slots de 30 minutos (8:00 AM - 8:00 PM)
- Línea roja indicadora de hora actual
- Fondo azul claro en hora actual
- Soporte para múltiples citas empalmadas
- CitaCard completa con todos los detalles

#### Vista Semana (Grid)
```
┌────┬───┬───┬───┬───┬───┬───┬───┐
│    │Lun│Mar│Mié│Jue│Vie│Sáb│Dom│
│    │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │
├────┼───┼───┼───┼───┼───┼───┼───┤
│08:00│ ✓ │✓✓ │ ✓ │   │ ✓ │   │   │
│09:00│✓✓ │ ✓ │✓✓✓│ ✓ │✓✓ │ ✓ │   │
│10:00│ ✓ │ ✓ │✓✓ │✓✓ │ ✓ │   │   │
└────┴───┴───┴───┴───┴───┴───┴───┘
```

**Características:**
- Grid de 7 días x 13 horas
- Header con día de la semana y número
- Resaltado de día actual
- Vista compacta de citas
- Scroll horizontal y vertical

#### Vista Mes (Calendario)
```
┌─────────────── Febrero 2026 ───────────────┐
│ Dom │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │     │     │  1  │  2   │
│     │     │     │     │     │ 8   │ 4    │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  3  │  4  │  5  │  6  │  7  │  8  │  9   │
│ 12  │ 15  │ 18  │ 14  │ 16  │  9  │  2   │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Número grande: Día del mes
Número pequeño: Cantidad de citas
Badges de colores: Estados de citas
```

**Características:**
- Vista mensual completa
- Indicadores de cantidad de citas
- Click en día para ver detalle
- Resaltado de día actual y seleccionado
- Muestra primeras 2 citas + contador

### 3. `/components/citas/CitaCard.tsx` - Tarjeta de Cita

**Variantes por Vista:**

#### Vista Completa (Día / Lista):
```
┌──────────────────────────────────────┐
│ 09:30  [🎁 Promo]     [Confirmada]  │
│                                      │
│ 👤 María González                    │
│ 🏷️ Primera Vez • Medicina General   │
│ 👨‍⚕️ Dr. López                        │
│ ─────────────────────────────────────│
│ 📍 Guadalajara           💰 $250     │
└──────────────────────────────────────┘
```

#### Vista Compacta (Semana):
```
┌──────────────┐
│ 09:30        │
│ Primera Vez  │
└──────────────┘
```

**Características:**
- Color de border según estado (verde=confirmada, azul=agendada, etc.)
- Badge de promoción 🎁
- Iconos descriptivos (User, Tag, MapPin, DollarSign)
- Indicador de saldo pendiente (naranja)
- Hover para shadow
- Click para abrir modal

**Código de Colores por Estado:**

| Estado | Color | Border |
|--------|-------|--------|
| Agendada | Azul claro | `border-blue-200` |
| Confirmada | Verde claro | `border-green-200` |
| Llegó | Morado claro | `border-purple-200` |
| En_Atencion | Naranja claro | `border-orange-200` |
| Finalizada | Gris claro | `border-gray-200` |
| Cancelada | Rojo claro | `border-red-200` |
| No_Asistio | Rojo claro | `border-red-200` |

### 4. `/components/citas/CitaModal.tsx` - Modal de Detalle

**Layout del Modal:**

```
┌────────────────────────────────────────────────────────┐
│ 📅 Detalle de Cita                              [X]   │
│ [Confirmada] [🎁 Promoción] [1 reagendación]          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  FECHA Y HORA                  UBICACIÓN              │
│  📅 Martes 3 de Febrero 2026  📍 Guadalajara         │
│  🕐 09:30 (45 min)            Consultorio General     │
│                                                        │
│  ┌─────────────────── INFORMACIÓN DEL PACIENTE ─────┐│
│  │ 👤 María González      📞 555-1234              ││
│  │ 📧 maria@email.com    📄 RCA-2024-0123         ││
│  └──────────────────────────────────────────────────┘│
│                                                        │
│  TIPO DE CONSULTA           INFORMACIÓN DE PAGO       │
│  🏷️ Primera Vez            Costo:        $250        │
│  👨‍⚕️ Dr. López               Abonado:       $250        │
│                             Pendiente:    $0          │
│                                                        │
│  ⚠️ HISTORIAL DE REAGENDACIONES                       │
│  Esta cita ha sido reagendada 1 vez.                  │
│  La promoción se mantiene en la primera reagendación. │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [✓ Confirmar Cita]  [✏️ Editar]  [🗑️ Cancelar]  [Cerrar]│
└────────────────────────────────────────────────────────┘
```

**Acciones Disponibles:**

1. **Confirmar Cita** (estado: Agendada)
   - Cambia estado a "Confirmada"
   - Botón verde con ícono CheckCircle2

2. **Marcar Llegada** (estado: Confirmada)
   - Cambia estado a "Llegó"
   - Botón morado con ícono User

3. **Editar** (cualquier estado excepto finalizadas/canceladas)
   - Abre formulario de edición
   - Botón secundario con ícono Edit

4. **Cancelar Cita** (cualquier estado excepto finalizadas/canceladas)
   - Muestra formulario de motivo
   - Requiere justificación
   - Botón rojo con ícono Trash2

**Características:**
- Header con gradiente azul
- Badge de estado con ícono dinámico
- Secciones claramente definidas
- Alertas contextuales (reagendaciones, cancelación)
- Formulario inline para cancelación
- Responsive y accesible

### 5. `/components/citas/CitasFilters.tsx` - Filtros Avanzados

**Panel de Filtros:**

```
┌──────────────────────────────────────────────────┐
│ 🔍 [Buscar paciente, teléfono...]  [⚙️ Filtros] │
└──────────────────────────────────────────────────┘

Expandido:
┌──────────────────────────────────────────────────┐
│ [Sucursal ▼]  [Médico ▼]  [Tipo ▼]  [Estado ▼] │
│                                                  │
│ ☑ Solo Promociones 🎁                           │
└──────────────────────────────────────────────────┘
```

**Filtros Disponibles:**

1. **Búsqueda General**
   - Busca en: nombre paciente, teléfono, No. Afiliación
   - Búsqueda en tiempo real
   - Ícono de lupa

2. **Sucursal**
   - Dropdown con todas las sucursales
   - Opción "Todas las sucursales"
   - Valores: Guadalajara, Ciudad Juárez, Ciudad Obregón, Loreto Héroes

3. **Médico**
   - Dropdown con médicos asignados
   - Opción "Todos los médicos"
   - Valores: Dr. López, Dra. Ramírez, Dr. González, etc.

4. **Tipo de Consulta**
   - Dropdown con tipos
   - Opción "Todos los tipos"
   - Valores: Primera Vez, Subsecuente, Urgencia, Control, Especialidad

5. **Estado**
   - Dropdown con 7 estados
   - Opción "Todos los estados"
   - Valores: Agendada, Confirmada, Llegó, En Atención, Finalizada, Cancelada, No Asistió

6. **Solo Promociones**
   - Checkbox toggle
   - Filtra citas con esPromocion = true
   - Badge 🎁 en las citas

**Características:**
- Panel colapsable/expandible
- Indicador visual de filtros activos (punto azul)
- Botón "Limpiar" aparece cuando hay filtros
- Layout responsive (grid 4 columnas)
- Persistencia de estado local

## 🎨 Sistema de Diseño

### Paleta de Colores

```css
/* Estados de Citas */
--cita-agendada: #DBEAFE;     /* blue-100 */
--cita-confirmada: #D1FAE5;   /* green-100 */
--cita-llego: #E9D5FF;        /* purple-100 */
--cita-atencion: #FED7AA;     /* orange-100 */
--cita-finalizada: #F3F4F6;   /* gray-100 */
--cita-cancelada: #FEE2E2;    /* red-100 */

/* Gradientes de KPIs */
--kpi-total: linear-gradient(135deg, #3B82F6, #2563EB);
--kpi-confirmadas: linear-gradient(135deg, #10B981, #059669);
--kpi-pendientes: linear-gradient(135deg, #F59E0B, #D97706);
--kpi-promociones: linear-gradient(135deg, #8B5CF6, #7C3AED);
--kpi-saldo: linear-gradient(135deg, #EF4444, #DC2626);
```

### Iconografía

- **📅 Calendar**: Calendario general
- **🕐 Clock**: Hora de cita
- **👤 User**: Paciente
- **👨‍⚕️ User**: Médico
- **📍 MapPin**: Sucursal/ubicación
- **🏷️ Tag**: Tipo de consulta
- **💰 DollarSign**: Información de pago
- **✅ CheckCircle2**: Confirmada
- **❌ XCircle**: Cancelada
- **⚠️ AlertCircle**: Advertencia
- **🎁 Badge**: Promoción
- **🔁 History**: Reagendaciones

## 🚀 Uso y Navegación

### Acceso al Módulo

1. **Desde Sidebar**:
   - Click en "📅 Citas" en el menú lateral
   - Ruta: `/citas`

2. **Desde Dashboard**:
   - Click en widget "Citas del Día"
   - Accesos rápidos a acciones

### Flujo de Trabajo Típico

#### Escenario 1: Revisar Agenda del Día

1. Abrir módulo de citas
2. Seleccionar vista "Día"
3. Navegar con botones ← Hoy →
4. Ver citas en timeline
5. Click en cita para ver detalle

#### Escenario 2: Confirmar Citas Pendientes

1. Aplicar filtro "Estado: Agendada"
2. Ver solo citas no confirmadas
3. Click en cada cita
4. Botón "✓ Confirmar Cita"
5. Estado cambia a "Confirmada"

#### Escenario 3: Buscar Cita de un Paciente

1. Escribir nombre en búsqueda
2. Resultados filtrados en tiempo real
3. Click en la cita encontrada
4. Ver historial completo

#### Escenario 4: Ver Carga por Médico

1. Seleccionar "Vista: Semana"
2. Filtrar por "Médico: Dr. López"
3. Ver distribución semanal
4. Identificar días con sobrecarga

#### Escenario 5: Marcar Llegada de Paciente

1. Vista del día actual
2. Buscar paciente confirmado
3. Click en cita
4. Botón "Marcar Llegada"
5. Estado cambia a "Llegó"

#### Escenario 6: Cancelar Cita

1. Abrir detalle de cita
2. Click en "🗑️ Cancelar Cita"
3. Escribir motivo de cancelación
4. Confirmar cancelación
5. Estado cambia a "Cancelada"

## 📊 Datos Demo

### Características de la Generación

El sistema genera automáticamente:

- **7 días** de citas (hoy + 6 días siguientes)
- **8-12 citas por día** (aleatoriamente)
- **Horarios**: 8:00 AM - 6:00 PM (slots de 30 min)
- **Estados variados**: distribución aleatoria
- **30% promociones** (esPromocion = true)
- **20% con reagendaciones** (1-2 veces)
- **30% con saldo pendiente**

### Datos Generados

```typescript
// Ejemplo de cita demo
{
  id: 'cita-1-5',
  pacienteId: 'pac-42',
  pacienteNombre: 'María González',
  pacienteTelefono: '555-3847',
  pacienteEmail: 'paciente@email.com',
  pacienteNoAfiliacion: 'RCA-2024-3847',
  sucursalId: 'suc-1',
  sucursalNombre: 'Guadalajara',
  fechaCita: new Date('2026-02-04'),
  horaCita: '09:30',
  duracionMinutos: 45,
  tipoConsulta: 'Primera Vez',
  especialidad: 'Medicina General',
  medicoAsignado: 'Dr. López',
  estado: 'Confirmada',
  esPromocion: true,
  reagendaciones: 0,
  costoConsulta: 250,
  montoAbonado: 250,
  saldoPendiente: 0,
  fechaCreacion: new Date(),
  ultimaActualizacion: new Date()
}
```

### Estadísticas Típicas (7 días)

- **Total citas**: ~70 citas
- **Confirmadas**: ~40-50% (28-35 citas)
- **Pendientes**: ~20-30% (14-21 citas)
- **Promociones**: ~21 citas ($5,250 MXN)
- **Saldo pendiente**: $3,500 - $7,000 MXN

## 🔧 Integración con Backend

### Endpoints Necesarios (Pendiente)

```typescript
// Citas
GET    /api/citas                    // Listar con filtros
GET    /api/citas/:id                // Detalle
POST   /api/citas                    // Crear
PUT    /api/citas/:id                // Actualizar
DELETE /api/citas/:id                // Eliminar

// Acciones de estado
PUT    /api/citas/:id/confirmar      // Confirmar cita
PUT    /api/citas/:id/llegada        // Marcar llegada
PUT    /api/citas/:id/cancelar       // Cancelar con motivo
PUT    /api/citas/:id/reagendar      // Reagendar (usa caso de uso)

// Estadísticas
GET    /api/citas/estadisticas       // KPIs del día/período
GET    /api/citas/disponibilidad     // Slots disponibles

// Filtros
GET    /api/citas?sucursalId=suc-1&estado=Confirmada&fecha=2026-02-03
GET    /api/citas?medicoAsignado=Dr.%20López&vista=semana
GET    /api/citas?busqueda=María&soloPromociones=true
```

### Servicio de API (A crear)

```typescript
// /frontend/lib/citas.service.ts
export async function obtenerCitas(filtros: CitasFilterState): Promise<Cita[]> {
  const params = new URLSearchParams();
  if (filtros.sucursalId) params.append('sucursalId', filtros.sucursalId);
  // ... más filtros
  
  const response = await api.get<Cita[]>(`/citas?${params}`);
  return response.data.map(c => ({
    ...c,
    fechaCita: new Date(c.fechaCita)
  }));
}

export async function confirmarCita(citaId: string): Promise<void> {
  await api.put(`/citas/${citaId}/confirmar`, {});
}

export async function marcarLlegada(citaId: string): Promise<void> {
  await api.put(`/citas/${citaId}/llegada`, {});
}

export async function cancelarCita(citaId: string, motivo: string): Promise<void> {
  await api.put(`/citas/${citaId}/cancelar`, { motivo });
}
```

## ⚡ Próximas Mejoras

### Funcionalidades Pendientes

- [ ] **Arrastrar y soltar** para reagendar
- [ ] **Vista de médico individual** (solo sus citas)
- [ ] **Overbooking visual** (N citas empalmadas)
- [ ] **Notificaciones en tiempo real** (WebSocket)
- [ ] **Exportar a PDF/Excel**
- [ ] **Imprimir agenda del día**
- [ ] **Vista de recursos** (consultorios disponibles)
- [ ] **Repetir citas** (citas recurrentes)
- [ ] **Lista de espera** automática
- [ ] **Recordatorios automáticos** (24h antes)

### Optimizaciones

- [ ] Virtualización para listas largas (react-window)
- [ ] Cache de citas por fecha
- [ ] Lazy loading de meses pasados
- [ ] Optimistic UI updates
- [ ] Skeleton loaders

### Integraciones

- [ ] Google Calendar sync
- [ ] Outlook Calendar sync
- [ ] WhatsApp recordatorios
- [ ] Email recordatorios
- [ ] SMS confirmaciones

## 📱 Responsive Design

### Breakpoints

- **Mobile** (< 768px): Vista de lista, filtros colapsados
- **Tablet** (768px - 1024px): Vista semana simplificada
- **Desktop** (> 1024px): Todas las vistas disponibles

### Adaptaciones Móviles

- Modal de cita en fullscreen
- Filtros en bottom sheet
- Calendario mes con scroll táctil
- Botones de acción más grandes
- Navegación por swipe

## 🎓 Tips para Usuarios

### Para Recepción

1. **Vista recomendada**: Día (ver todas las llegadas)
2. **Filtro útil**: Estado = "Confirmada" (listas para llegada)
3. **Acción frecuente**: Marcar llegada cuando paciente entra
4. **Recordar**: Validar No_Afiliacion antes de registrar

### Para Contact Center (Keila)

1. **Vista recomendada**: Semana (disponibilidad general)
2. **Filtro útil**: Solo Promociones (dar seguimiento)
3. **Acción frecuente**: Confirmar citas agendadas
4. **Recordar**: Segunda reagendación pierde promoción

### Para Finanzas (Antonio/Yaretzi)

1. **Vista recomendada**: Mes (visión general)
2. **Filtro útil**: Estado = "Finalizada" + Saldo Pendiente
3. **Estadística clave**: Saldo pendiente total
4. **Recordar**: Registrar abonos desde el modal

### Para Médicos

1. **Vista recomendada**: Día (su agenda diaria)
2. **Filtro útil**: Médico = "Su nombre"
3. **Acción frecuente**: Ver notas y alergias del paciente
4. **Recordar**: Marcar "En Atención" al iniciar consulta

## 🐛 Troubleshooting

### La cita no aparece en el calendario

**Causa**: Filtros activos o fecha incorrecta  
**Solución**: Click en "Limpiar" filtros, verificar fecha seleccionada

### No puedo confirmar una cita

**Causa**: Estado no es "Agendada"  
**Solución**: Solo citas agendadas pueden confirmarse

### Los horarios no coinciden

**Causa**: Zona horaria de sucursal  
**Solución**: Verificar zona horaria en configuración de sucursal

### El modal no se cierra

**Causa**: Formulario de cancelación activo  
**Solución**: Click en "Cancelar" del formulario primero

---

## 📝 Notas de Implementación

- **Fecha de creación**: 3 de febrero de 2026
- **Versión**: 1.0.0 (MVP con datos demo)
- **Estado**: ✅ Frontend completo, Backend pendiente
- **Próxima fase**: Integración con API real y casos de uso

**Desarrollado por**: GitHub Copilot  
**Modelo**: Claude Sonnet 4.5  
**Framework**: Next.js 14 + TypeScript + TailwindCSS  
**Inspiración**: Calendly, Acuity Scheduling, Zocdoc
