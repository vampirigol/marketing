# CRM RCA - Frontend

Frontend de Next.js 14 para el sistema CRM de Red de Clínicas Adventistas.

## 🚀 Inicio Rápido

### Instalar dependencias

```bash
npm install
```

### Configurar variables de entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## 📦 Estructura del Proyecto

```
frontend/
├── app/                    # App Router de Next.js 14
│   ├── dashboard/         # Dashboard principal
│   ├── pacientes/         # Gestión de pacientes
│   ├── citas/             # Calendario de citas
│   ├── matrix/            # Contact Center
│   ├── finanzas/          # Módulo financiero
│   └── reportes/          # Reportes y analytics
├── components/
│   ├── ui/                # Componentes base (Button, Card, Input)
│   └── layout/            # Layout (Sidebar, TopBar)
├── lib/                   # Utilidades y servicios
│   ├── api.ts            # Configuración de Axios
│   ├── *.service.ts      # Servicios por módulo
│   └── utils.ts          # Funciones helper
└── types/                 # TypeScript types
```

## 🎨 Sistema de Diseño

### Colores Principales

- **Primary**: `#0052A5` (Azul Adventista)
- **Success**: `#10B981` (Verde)
- **Warning**: `#F59E0B` (Naranja)
- **Danger**: `#EF4444` (Rojo)

### Componentes UI

```tsx
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// Uso
<Button variant="primary">Guardar</Button>
<Card hover>...</Card>
<Input label="Nombre" error="Campo requerido" />
<Badge variant="success">Confirmada</Badge>
```

## 📡 Servicios API

```tsx
import pacientesService from '@/lib/pacientes.service';
import citasService from '@/lib/citas.service';
import abonosService from '@/lib/abonos.service';

// Ejemplo
const pacientes = await pacientesService.buscar('Juan');
const citas = await citasService.obtenerPorSucursalYFecha('id', '2026-02-03');
```

## 🛠️ Scripts Disponibles

```bash
npm run dev        # Desarrollo (puerto 3001)
npm run build      # Compilar para producción
npm start          # Servidor de producción
npm run lint       # ESLint
npm run type-check # TypeScript validation
```

## 🔗 Integración con Backend

El frontend se conecta al backend en `http://localhost:3000/api`

Asegúrate de que el backend esté corriendo antes de iniciar el frontend.

## 📚 Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide Icons** - Iconografía
- **date-fns** - Manejo de fechas
