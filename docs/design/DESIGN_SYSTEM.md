# 🎨 Sistema de Diseño - CRM Red de Clínicas Adventistas (RCA)

## 📋 Inspiración y Referencias

Este diseño se inspira en:
- **Bitrix24**: Sistema de Contact Center unificado y gestión de conversaciones
- **Salesforce Health Cloud**: Dashboard médico y gestión de pacientes
- **Zoho CRM**: Simplicidad y flujos automatizados
- **HubSpot**: UX intuitiva y onboarding

## 🎯 Principios de Diseño

### 1. Claridad Visual
- Interfaz limpia y organizada
- Jerarquía visual clara
- Sin elementos que distraigan la tarea principal

### 2. Eficiencia Operativa
- Máximo 3 clics para cualquier acción crítica
- Atajos de teclado para operaciones frecuentes
- Acciones rápidas siempre visibles

### 3. Contexto del Usuario
- Dashboard personalizado por rol (Keila, Antonio, Yaretzi, Recepción)
- Información relevante en el momento correcto
- Notificaciones inteligentes, no intrusivas

### 4. Escalabilidad
- Diseño que funciona desde 1 hasta 100 sucursales
- Responsive (Desktop, Tablet, Mobile)
- Dark mode y accesibilidad (WCAG 2.1 AA)

## 🎨 Paleta de Colores

### Colores Principales
```css
/* Identidad RCA - Adventista */
--primary-blue: #0052A5;        /* Azul principal adventista */
--primary-blue-dark: #003D7A;   /* Azul oscuro */
--primary-blue-light: #E6F2FF;  /* Azul claro para fondos */

/* Sistema de Estados */
--success-green: #10B981;       /* Confirmada, Atendida */
--warning-orange: #F59E0B;      /* Pendiente, En espera */
--danger-red: #EF4444;          /* Cancelada, Inasistencia */
--info-blue: #3B82F6;           /* Información general */

/* Neutrales */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Especiales */
--promotion-purple: #8B5CF6;    /* Promociones */
--spiritual-gold: #F59E0B;      /* Almas Ganadas */
--matrix-green: #10B981;        /* Matrix Keila activa */
```

### Uso de Colores por Estado de Cita

| Estado | Color | Uso |
|--------|-------|-----|
| Agendada | `info-blue` | Calendario, tarjetas |
| Confirmada | `success-green` | Confirmación, checkmarks |
| En Consulta | `warning-orange` | Badges, indicadores |
| Atendida | `success-green` | Completado |
| Cancelada | `danger-red` | Alertas, mensajes |
| No Asistió | `danger-red` | Reportes, estadísticas |
| Promoción | `promotion-purple` | Tags especiales |

## 📐 Tipografía

### Familias de Fuente
```css
/* Principal - Sans-serif moderna */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Datos numéricos y códigos */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Títulos especiales */
--font-display: 'Poppins', sans-serif;
```

### Escala Tipográfica
```css
--text-xs: 0.75rem;    /* 12px - Labels pequeños */
--text-sm: 0.875rem;   /* 14px - Body text secundario */
--text-base: 1rem;     /* 16px - Body text principal */
--text-lg: 1.125rem;   /* 18px - Subtítulos */
--text-xl: 1.25rem;    /* 20px - Títulos de sección */
--text-2xl: 1.5rem;    /* 24px - Títulos de página */
--text-3xl: 1.875rem;  /* 30px - Títulos principales */
--text-4xl: 2.25rem;   /* 36px - Hero text */
```

### Pesos
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 📏 Espaciado

Sistema basado en múltiplos de 4px:

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## 🔲 Componentes Base

### Botones

#### Primario
```
Uso: Acciones principales (Guardar, Agendar Cita, Confirmar)
Color: primary-blue
Hover: primary-blue-dark
Alto: 40px
Padding: 12px 24px
Border-radius: 8px
```

#### Secundario
```
Uso: Acciones secundarias (Cancelar, Volver)
Color: gray-600
Hover: gray-700
Border: 1px solid gray-300
```

#### Peligro
```
Uso: Acciones destructivas (Eliminar, Marcar Perdido)
Color: danger-red
Hover: más oscuro
```

#### Iconos
```
Tamaño: 40px × 40px
Solo icono, sin texto
Uso: Acciones rápidas en tablas
```

### Tarjetas (Cards)

```css
background: white
border-radius: 12px
box-shadow: 0 1px 3px rgba(0,0,0,0.1)
padding: 24px
```

### Badges (Etiquetas de Estado)

```css
height: 24px
padding: 4px 12px
border-radius: 12px (pill)
font-size: text-xs
font-weight: medium
```

### Inputs

```css
height: 40px
border: 1px solid gray-300
border-radius: 8px
padding: 8px 12px
focus: border-color primary-blue, shadow
```

## 📱 Breakpoints Responsive

```css
--mobile: 320px - 767px
--tablet: 768px - 1023px
--desktop: 1024px - 1439px
--desktop-xl: 1440px+
```

## 🎭 Iconografía

### Librería Recomendada
- **Heroicons** (by Tailwind): Consistente, moderna, 2 estilos (outline/solid)
- **Lucide Icons**: Alternativa con más opciones

### Tamaños Estándar
```css
--icon-xs: 16px
--icon-sm: 20px
--icon-md: 24px
--icon-lg: 32px
--icon-xl: 48px
```

## 🌗 Dark Mode

```css
/* Dark Mode Variables */
--dark-bg-primary: #111827;
--dark-bg-secondary: #1F2937;
--dark-bg-tertiary: #374151;
--dark-text-primary: #F9FAFB;
--dark-text-secondary: #D1D5DB;
```

## ✨ Animaciones y Transiciones

```css
/* Transiciones suaves */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Animaciones de carga */
--loading-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
--loading-spin: spin 1s linear infinite;
```

## 📊 Gráficos y Visualizaciones

### Librería Recomendada
- **Chart.js**: Fácil de usar, personalizable
- **Recharts**: Para React, declarativa

### Colores para Gráficos
```javascript
const chartColors = {
  primary: ['#0052A5', '#3B82F6', '#60A5FA', '#93C5FD'],
  success: ['#10B981', '#34D399', '#6EE7B7'],
  warning: ['#F59E0B', '#FBBF24', '#FCD34D'],
  danger: ['#EF4444', '#F87171', '#FCA5A5']
};
```

## 🔔 Notificaciones

### Tipos
1. **Success**: Fondo verde claro, borde verde, icono checkmark
2. **Warning**: Fondo amarillo claro, borde amarillo, icono alerta
3. **Error**: Fondo rojo claro, borde rojo, icono X
4. **Info**: Fondo azul claro, borde azul, icono información

### Posicionamiento
```
Desktop: Top-right, stack vertical
Mobile: Bottom, fullwidth
Duración: 5 segundos (configurable)
```

## 📋 Estados de Carga

### Skeleton Screens
Usar placeholders animados mientras carga el contenido

### Spinners
Solo para acciones puntuales (guardar, enviar)

### Progress Bars
Para procesos largos (importación, generación de reportes)

## ♿ Accesibilidad

### Contraste
- Texto sobre fondo blanco: Mínimo 4.5:1
- Texto grande: Mínimo 3:1

### Navegación por Teclado
- Tab para navegar
- Enter para activar
- Esc para cerrar modales
- Flechas para navegar listas

### Screen Readers
- Labels descriptivos
- ARIA labels donde sea necesario
- Estructura semántica HTML5

## 🎯 Siguiente Paso

Ver los diseños específicos de cada módulo:
- [Dashboard Principal](./DASHBOARD_DESIGN.md)
- [Matrix Keila (Contact Center)](./MATRIX_DESIGN.md)
- [Módulo de Citas](./CITAS_DESIGN.md)
- [Módulo Financiero](./FINANZAS_DESIGN.md)
- [Módulo de Pacientes](./PACIENTES_DESIGN.md)
