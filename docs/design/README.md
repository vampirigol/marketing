# 📚 Índice de Documentación de Diseño

## 🎨 Sistema CRM - Red de Clínicas Adventistas (RCA)

Este documento sirve como índice principal para toda la documentación de diseño del sistema.

---

## 📋 Documentos de Diseño

### 1. 🎨 [Sistema de Diseño](./DESIGN_SYSTEM.md)
**Fundamentos visuales del sistema**

- Paleta de colores
- Tipografía
- Espaciado y grid
- Componentes base (botones, inputs, cards)
- Iconografía
- Dark mode
- Animaciones
- Accesibilidad

**Estado:** ✅ Completado

---

### 2. 📊 [Dashboard Principal](./DASHBOARD_DESIGN.md)
**Vista principal personalizada por rol**

#### Dashboards por Rol:
- 🎧 **Keila (Contact Center)**
  - KPIs de conversaciones
  - Matrix de chat activo
  - Citas del día
  - Acciones rápidas

- 💰 **Antonio / Yaretzi (Finanzas)**
  - KPIs financieros
  - Gráficos de ingresos
  - Cortes pendientes
  - Análisis de pagos

- 🏥 **Recepción**
  - Sala de espera
  - Citas próximas
  - Control de llegadas
  - Registro rápido de abonos

**Estado:** ✅ Completado

---

### 3. 💬 [Matrix Keila - Contact Center](./MATRIX_DESIGN.md)
**Sistema unificado de comunicación multicanal**

#### Características principales:
- **Bandeja unificada**
  - WhatsApp Business
  - Facebook Messenger
  - Instagram Direct
  
- **Panel de conversaciones**
  - Vista de chat en tiempo real
  - Respuestas rápidas (templates)
  - Indicadores de estado
  
- **Perfil del paciente**
  - Datos básicos
  - Historial de citas
  - Segmentación automática
  - Acciones rápidas

- **Automatizaciones**
  - Bot de respuestas
  - Recordatorios automáticos
  - Detección de palabras clave
  - Priorización inteligente

**Estado:** ✅ Completado

---

### 4. 📅 [Módulo de Citas y Calendario](./CITAS_DESIGN.md)
**Sistema avanzado de agendamiento médico**

#### Vistas incluidas:
- **Vista Día** (Timeline detallado)
- **Vista Semana** (Grid semanal)
- **Vista Mes** (Calendario mensual)
- **Vista Agenda** (Lista ordenada)

#### Funcionalidades:
- **Agendar cita** (3 pasos)
  - Selección de paciente
  - Detalles de la cita
  - Confirmación y precio
  
- **Reagendar cita**
  - Control de promociones
  - Límite de reagendaciones
  - Notificaciones automáticas
  
- **Estados de cita**
  - Confirmada, Pendiente, En consulta
  - Atendida, Cancelada, No asistió
  - Alertas y recordatorios

- **Gestión de overbooking** (N citas simultáneas)
- **Zonas horarias** por sucursal
- **Configuración de disponibilidad** por médico

**Estado:** ✅ Completado

---

### 5. 💰 [Módulo Financiero - Abonos y Cortes](./FINANZAS_DESIGN.md)
**Sistema especializado para control financiero**

#### Componentes principales:
- **Registro de Abonos**
  - Búsqueda de cita
  - Métodos de pago (Efectivo, Tarjeta, Transferencia, Mixto)
  - Generación automática de recibos
  - Envío por WhatsApp/Email
  
- **Corte de Caja**
  - Resumen por método de pago
  - Desglose de transacciones
  - Conciliación automática
  - Detección de inconsistencias
  
- **Reportes Financieros**
  - Comparativos mensuales
  - Análisis por sucursal
  - ROI de promociones
  - Tendencias y proyecciones
  
- **Recibo (PDF/Impresión)**
  - Formato profesional
  - QR code de validación
  - Todos los datos requeridos
  
- **Auditoría**
  - Historial de cambios
  - Trazabilidad completa
  - Firma digital

**Estado:** ✅ Completado

---

## 🎯 Flujos de Usuario Principales

### 1. Flujo: Agendar Cita (Keila)
```
1. Matrix Keila: Paciente contacta por WhatsApp
2. Keila verifica disponibilidad en Calendario
3. Selecciona horario y aplica promoción
4. Sistema valida No_Afiliacion del paciente
5. Confirma cita y envía recordatorios automáticos
```

### 2. Flujo: Llegada y Atención (Recepción)
```
1. Paciente llega a recepción
2. Recepcionista busca cita del día
3. Marca "Llegada" (hora registrada)
4. Paciente espera en sala
5. Se inicia consulta (marca "En consulta")
6. Finaliza consulta (marca "Atendida")
7. Registra abono/pago
8. Sistema genera recibo automático
```

### 3. Flujo: Corte de Caja (Antonio/Yaretzi)
```
1. Al final del día, accede a "Corte de Caja"
2. Selecciona sucursal y fecha
3. Sistema genera resumen automático
4. Revisa conciliación y detecta inconsistencias
5. Corrige discrepancias si las hay
6. Aprueba corte
7. Genera PDF y envía a gerencia
```

### 4. Flujo: Reagendar Promoción
```
1. Paciente solicita reagendar (WhatsApp/Llamada)
2. Sistema verifica: ¿Cuántas reagendaciones?
   - Si 0: Permite reagendar, mantiene promoción
   - Si 1+: Permite reagendar, QUITA promoción
3. Actualiza precio automáticamente
4. Notifica al paciente del cambio
5. Envía nuevos recordatorios
```

---

## 🎨 Componentes Reutilizables Clave

### Componentes de Datos
- **KPI Card** - Tarjeta de indicador
- **Data Table** - Tabla de datos con acciones
- **Patient Card** - Tarjeta de paciente
- **Appointment Card** - Tarjeta de cita
- **Transaction Row** - Fila de transacción

### Componentes de Entrada
- **Search Bar** - Barra de búsqueda global
- **Date Picker** - Selector de fecha
- **Time Picker** - Selector de hora
- **Multi-select** - Selector múltiple
- **Form Wizard** - Formulario por pasos

### Componentes de Navegación
- **Sidebar** - Menú lateral
- **Breadcrumbs** - Migas de pan
- **Tabs** - Pestañas
- **Pagination** - Paginación

### Componentes de Retroalimentación
- **Badge** - Etiqueta de estado
- **Alert** - Alerta/notificación
- **Toast** - Notificación temporal
- **Modal** - Ventana modal
- **Skeleton** - Placeholder de carga

### Componentes de Visualización
- **Chart** - Gráficos (línea, barra, dona)
- **Timeline** - Línea de tiempo
- **Calendar** - Calendario
- **Progress Bar** - Barra de progreso
- **Avatar** - Foto de perfil

---

## 📱 Responsive Design

### Breakpoints
```
Mobile:     320px - 767px
Tablet:     768px - 1023px
Desktop:    1024px - 1439px
Desktop XL: 1440px+
```

### Adaptaciones por Dispositivo

#### Mobile
- Sidebar colapsado (solo iconos)
- Stack vertical de KPIs
- Tablas convertidas a cards
- Bottom navigation bar
- Swipe gestures

#### Tablet
- Sidebar colapsable
- Grid 2×2 para KPIs
- Scroll horizontal en tablas
- Touch-friendly (botones más grandes)

#### Desktop
- Layout completo
- Sidebar siempre visible
- Todo en una vista
- Hover effects
- Atajos de teclado

---

## ♿ Accesibilidad (WCAG 2.1 AA)

### Implementado
- ✅ Contraste de colores adecuado
- ✅ Navegación por teclado
- ✅ Labels descriptivos
- ✅ ARIA labels
- ✅ Estructura semántica HTML5
- ✅ Focus visible
- ✅ Mensajes de error claros

### Por implementar
- ⏳ Screen reader testing completo
- ⏳ Subtítulos en videos
- ⏳ Alternativas textuales para gráficos

---

## 🎨 Paleta de Colores Rápida

### Identidad RCA
```css
--primary-blue: #0052A5;        /* Azul adventista */
--primary-blue-dark: #003D7A;
--primary-blue-light: #E6F2FF;
```

### Estados
```css
--success-green: #10B981;       /* Confirmada, Atendida */
--warning-orange: #F59E0B;      /* Pendiente, Espera */
--danger-red: #EF4444;          /* Cancelada, Inasistencia */
--info-blue: #3B82F6;           /* Info general */
```

### Especiales
```css
--promotion-purple: #8B5CF6;    /* Promociones */
--spiritual-gold: #F59E0B;      /* Almas Ganadas */
--matrix-green: #10B981;        /* Matrix activa */
```

---

## 📐 Espaciado Rápido

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px   ← Base
--space-6: 24px
--space-8: 32px
--space-12: 48px
```

---

## 🔤 Tipografía Rápida

### Fuentes
```css
--font-primary: 'Inter'     /* UI general */
--font-mono: 'JetBrains Mono'  /* Códigos, números */
--font-display: 'Poppins'   /* Títulos especiales */
```

### Tamaños
```css
--text-xs: 12px    /* Labels pequeños */
--text-sm: 14px    /* Body secundario */
--text-base: 16px  /* Body principal */
--text-lg: 18px    /* Subtítulos */
--text-xl: 20px    /* Títulos sección */
--text-2xl: 24px   /* Títulos página */
```

---

## 🎯 Próximos Pasos de Implementación

### Fase 1: Fundamentos (Semanas 1-2)
- [ ] Configurar sistema de diseño (CSS/Tailwind)
- [ ] Crear componentes base
- [ ] Implementar layout principal
- [ ] Configurar routing

### Fase 2: Módulos Core (Semanas 3-6)
- [ ] Dashboard (versión básica)
- [ ] Módulo de Pacientes
- [ ] Módulo de Citas (básico)
- [ ] Autenticación y roles

### Fase 3: Matrix Keila (Semanas 7-9)
- [ ] Integración WhatsApp API
- [ ] Chat en tiempo real
- [ ] Bot de respuestas automáticas
- [ ] Notificaciones

### Fase 4: Finanzas (Semanas 10-12)
- [ ] Registro de abonos
- [ ] Cortes de caja
- [ ] Reportes financieros
- [ ] Generación de PDFs

### Fase 5: Avanzado (Semanas 13-16)
- [ ] Reagendaciones inteligentes
- [ ] Zonas horarias
- [ ] Analytics y BI
- [ ] Optimizaciones

---

## 📚 Referencias y Recursos

### Inspiración de Diseño
- **Bitrix24** - Contact Center y Matrix
- **Salesforce Health Cloud** - Dashboard médico
- **Zoho CRM** - Simplicidad y flujos
- **HubSpot** - UX intuitiva

### Herramientas Recomendadas
- **Figma** - Diseño UI/UX
- **Tailwind CSS** - Framework CSS
- **Heroicons** - Iconos
- **Chart.js** - Gráficos
- **React/Next.js** - Frontend
- **TypeScript** - Tipado

### Documentación Técnica
- [Material Design](https://material.io)
- [Human Interface Guidelines (Apple)](https://developer.apple.com/design/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev](https://web.dev)

---

## ✅ Checklist de Diseño Completo

### Fundamentos
- [x] Sistema de colores definido
- [x] Tipografía establecida
- [x] Espaciado y grid
- [x] Componentes base documentados

### Módulos Principales
- [x] Dashboard por roles diseñado
- [x] Matrix Keila especificado
- [x] Módulo de Citas completo
- [x] Módulo Financiero detallado

### Responsive
- [x] Breakpoints definidos
- [x] Adaptaciones mobile
- [x] Adaptaciones tablet
- [x] Desktop layout

### Accesibilidad
- [x] Contraste validado
- [x] Navegación por teclado
- [x] ARIA labels planeados
- [ ] Testing con lectores de pantalla (pendiente)

### Documentación
- [x] Índice principal
- [x] Guías por módulo
- [x] Flujos de usuario
- [x] Componentes documentados

---

## 🚀 ¿Listo para Implementar?

Con este diseño completo, el equipo de desarrollo tiene:

✅ **Especificaciones visuales claras**
✅ **Flujos de usuario definidos**
✅ **Componentes reutilizables identificados**
✅ **Responsive design planificado**
✅ **Accesibilidad considerada**

### Siguientes Pasos:
1. Revisar diseños con stakeholders (Keila, Antonio, Yaretzi)
2. Crear prototipos interactivos en Figma (opcional)
3. Comenzar implementación por fases
4. Iterar basándose en feedback de usuarios

---

**Diseñado para: Red de Clínicas Adventistas (RCA)**  
**Fecha: Febrero 2026**  
**Estado: ✅ Diseño Completo - Listo para Desarrollo**
