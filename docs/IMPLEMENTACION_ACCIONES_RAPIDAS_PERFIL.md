# Implementación de Acciones Rápidas del Perfil del Paciente

## 📋 Resumen

Se ha implementado completamente la funcionalidad de **Acciones Rápidas** en el perfil del paciente, permitiendo:

1. ✅ **Agendar Cita** - Modal completo con selección de servicio y horario
2. ✅ **Ver Historial Completo** - Visualización detallada de todas las citas del paciente
3. ✅ **Registrar Pago** - Formulario completo para registro de pagos

## 🎯 Componentes Creados

### 1. AgendarCitaModal
**Ubicación:** `frontend/components/matrix/AgendarCitaModal.tsx`

**Características:**
- Integración con formularios existentes (CatalogoForm, DisponibilidadForm, DatosPacienteForm)
- Flujo de 2-3 pasos según el contexto (si el paciente ya está registrado)
- Barra de progreso visual
- Manejo completo del estado del formulario
- Validación de datos antes de confirmar
- Cierre con limpieza de estado

**Flujo:**
1. Paso 1: Seleccionar sucursal, especialidad, doctor y servicio
2. Paso 2: Elegir fecha y hora disponible
3. Paso 3: (Opcional) Datos del paciente si no está registrado
4. Confirmación y creación de la cita

### 2. HistorialPacienteModal
**Ubicación:** `frontend/components/matrix/HistorialPacienteModal.tsx`

**Características:**
- Visualización completa del historial de citas
- Estadísticas resumidas (total, finalizadas, próximas, total gastado)
- Filtrado por estado de cita
- Búsqueda por servicio, doctor o especialidad
- Tarjetas informativas con:
  - Estado de la cita con badge colorizado
  - Fecha y hora
  - Médico y especialidad
  - Monto pagado
  - Notas adicionales
- Indicador de citas promocionales
- Diseño responsive y scrollable

**Estados de Cita Soportados:**
- Agendada
- Confirmada
- Llegó
- En Atención
- Finalizada
- Cancelada
- No Asistió

### 3. RegistrarPagoModal
**Ubicación:** `frontend/components/matrix/RegistrarPagoModal.tsx`

**Características:**
- Formulario completo de registro de pagos
- Selección de concepto:
  - Consulta
  - Tratamiento
  - Medicamento
  - Estudio
  - Otro (con campo personalizable)
- Métodos de pago soportados:
  - Efectivo
  - Tarjeta
  - Transferencia
- Campo de referencia obligatorio para tarjeta/transferencia
- Input monetario con validación
- Área de notas opcionales
- Resumen visual del pago antes de confirmar
- Validaciones completas:
  - Monto mayor a 0
  - Concepto especificado
  - Referencia para pagos electrónicos
- Estados de guardado con loading

## 🔄 Integración con PatientProfile

### Cambios en PatientProfile.tsx

**Antes:**
```typescript
interface PatientProfileProps {
  pacienteId?: string;
  onAgendarCita: () => void;
  onVerHistorial: () => void;
  onRegistrarPago: () => void;
}
```

**Después:**
```typescript
interface PatientProfileProps {
  pacienteId?: string;
  // Sin props adicionales - manejo interno de modales
}
```

**Implementación:**
- Se agregaron 3 estados locales para controlar los modales:
  - `modalAgendarCita`
  - `modalHistorial`
  - `modalRegistrarPago`
- Los botones de acciones rápidas ahora abren los modales directamente
- Los modales se renderizan dentro del componente PatientProfile
- Se pasó la información necesaria del paciente a cada modal

## 🎨 Diseño y UX

### Acciones Rápidas (Diseño según mockup)
```
⚡ ACCIONES RÁPIDAS
┌─────────────────────────────────┐
│ 📅 Agendar Cita                 │  ← Botón primario azul
├─────────────────────────────────┤
│ 🕐 Ver Historial Completo       │  ← Botón secundario
├─────────────────────────────────┤
│ 💵 Registrar Pago               │  ← Botón secundario
└─────────────────────────────────┘
```

### Colores y Badges
- **Promoción**: Morado (`bg-purple-100 text-purple-700`)
- **Agendada**: Azul (`bg-blue-100 text-blue-700`)
- **Confirmada**: Verde (`bg-green-100 text-green-700`)
- **Finalizada**: Gris (`bg-gray-100 text-gray-700`)
- **Cancelada**: Rojo (`bg-red-100 text-red-700`)

### Iconos Lucide
- `Calendar` - Agendar cita / Fechas
- `Clock` - Historial / Horarios
- `DollarSign` - Pagos / Montos
- `User` - Paciente llegó
- `CheckCircle2` - Confirmaciones / Éxito
- `XCircle` - Cancelaciones
- `AlertCircle` - Alertas / No asistió

## 🔌 Integración con APIs (Preparada)

Todos los modales están preparados para integración con APIs reales:

### AgendarCitaModal
```typescript
// TODO: Implementar llamada a API real
const response = await fetch('http://localhost:3000/api/citas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(citaData),
});
```

### HistorialPacienteModal
```typescript
// TODO: Implementar llamada a API real
const response = await fetch(`http://localhost:3000/api/citas/paciente/${pacienteId}`);
const data = await response.json();
```

### RegistrarPagoModal
```typescript
// TODO: Implementar llamada a API real
const response = await fetch('http://localhost:3000/api/pagos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pagoData)
});
```

## 📊 Tipos y Interfaces

### Tipo Cita (actualizado)
```typescript
export interface Cita {
  id: string;
  pacienteId: string;
  pacienteNombre?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  sucursalId: string;
  sucursalNombre?: string;
  fechaCita: Date;
  horaCita: string;
  duracionMinutos: number;
  tipoConsulta: string;
  especialidad: string;
  medicoAsignado?: string;
  estado: 'Agendada' | 'Confirmada' | 'Llegó' | 'En_Atencion' | 'Finalizada' | 'Cancelada' | 'No_Asistio';
  esPromocion: boolean;
  costoConsulta: number;
  montoAbonado: number;
  saldoPendiente: number;
  metodoPago?: string;
  reagendaciones: number;
  notas?: string;
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}
```

## ✅ Testing y Validación

### Todos los archivos sin errores de TypeScript:
- ✅ PatientProfile.tsx
- ✅ AgendarCitaModal.tsx
- ✅ HistorialPacienteModal.tsx
- ✅ RegistrarPagoModal.tsx
- ✅ page.tsx (Matrix)

### Validaciones Implementadas:
- ✅ Campos obligatorios en todos los formularios
- ✅ Validación de montos (mayor a 0)
- ✅ Validación de referencias para pagos electrónicos
- ✅ Prevención de envíos duplicados con estados de loading
- ✅ Manejo de errores con mensajes al usuario

## 🚀 Próximos Pasos (Opcionales)

1. **Conectar con APIs reales** - Reemplazar datos de ejemplo con llamadas a backend
2. **Agregar confirmaciones** - Dialogs de confirmación antes de acciones críticas
3. **Implementar impresión** - Generar recibos de pago en PDF
4. **Notificaciones** - Enviar SMS/Email de confirmación al agendar citas
5. **Exportar historial** - Permitir descargar historial en Excel/PDF
6. **Agregar filtros avanzados** - Rango de fechas, múltiples estados
7. **Métricas y analytics** - Tracking de conversión de acciones

## 📝 Notas Técnicas

- Todos los modales usan el patrón de overlay con fondo semi-transparente
- Los estados se limpian al cerrar los modales para evitar datos obsoletos
- Se usa TypeScript estricto con tipos bien definidos
- Los componentes son completamente reutilizables
- Se sigue el design system existente del proyecto
- Compatibilidad con datos de ejemplo para desarrollo sin backend

## 🎯 Resultado Final

Los tres botones de **Acciones Rápidas** ahora son completamente funcionales:

1. ✅ **Agendar Cita** - Abre modal con flujo completo de agendamiento
2. ✅ **Ver Historial Completo** - Muestra todas las citas con filtros y búsqueda
3. ✅ **Registrar Pago** - Permite registrar pagos con todos los métodos

La implementación está lista para pruebas de usuario y posterior integración con el backend real.
