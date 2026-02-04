# Plan de Implementación: Agenda de Citas (Sucursal/Doctor/Servicio/Fecha/Hora)

## 📋 Resumen Ejecutivo

Se ha implementado la infraestructura completa para agendar citas con:
- ✅ Catálogo de sucursales, especialidades, doctores y servicios
- ✅ Sistema de disponibilidad con overbooking configurable
- ✅ Soporte para citas "sin horario" (subsecuentes flexibles)
- ✅ Validación de promociones y precios
- ✅ Regla de promoción: reagendación solo en mismo mes

## 📁 Archivos Creados

### Backend

#### 1. Controlador de Catálogo
**Archivo**: [src/api/controllers/CatalogoController.ts](src/api/controllers/CatalogoController.ts)

**Funcionalidad**:
- Sucursales: CDMX, Guadalajara, Monterrey (extensible)
- Especialidades: Medicina General, Odontología, Ortopedia, Dermatología
- Doctores: Asignados a sucursales con horarios y capacidad de empalmes (0-3 citas)
- Servicios: Con precios, duración, promociones activas
- Promociones: Códigos vigentes (MES_SALUD_2026, PRIMERA_VEZ_2026)

**Datos de ejemplo**:
```json
{
  "sucursales": [
    { "id": "suc-1", "nombre": "CDMX Centro", "zonaHoraria": "America/Mexico_City" }
  ],
  "especialidades": [
    { "id": "esp-1", "nombre": "Medicina General" }
  ],
  "doctores": [
    {
      "id": "doc-1",
      "nombre": "Dra. Karla López",
      "especialidadId": "esp-1",
      "horario": { "inicio": "08:00", "fin": "18:00", "intervaloMin": 30 },
      "capacidadEmpalmes": 3
    }
  ],
  "servicios": [
    {
      "id": "srv-1",
      "nombre": "Consulta General",
      "precioBase": 500,
      "precioPromocion": 300,
      "duracionMinutos": 45
    }
  ]
}
```

**Ruta**: `GET /api/catalogo`

#### 2. Disponibilidad en CitaController
**Archivo**: [src/api/controllers/CitaController.ts](src/api/controllers/CitaController.ts)

**Nuevos métodos**:
- `obtenerDisponibilidad()`: Genera slots horarios con capacidad
  - Query: `fecha`, `doctorId`, `inicio`, `fin`, `intervaloMin`, `maxEmpalmes`
  - Retorna: Array de slots con estado (disponible/ocupado)
  - Ejemplo: 08:00 disponible (1/3), 08:30 ocupado (3/3)

- `actualizar()`: Permite editar citas (fecha, hora, especialidad, doctor)
  - Soporta flag `sinHorario` para citas subsecuentes flexibles
  - Agrega tag `[SIN_HORARIO]` a las notas

**Ruta**: `GET /api/citas/disponibilidad/:sucursalId?fecha=2026-02-05&doctorId=doc-1&intervaloMin=30&maxEmpalmes=3`

#### 3. Rutas nuevas
**Archivo**: [src/api/routes/catalogo.ts](src/api/routes/catalogo.ts)

**Endpoints**:
- `GET /api/catalogo` - Catálogo completo

**Archivo modificado**: [src/api/routes/citas.ts](src/api/routes/citas.ts)

**Nuevos endpoints**:
- `GET /api/citas/disponibilidad/:sucursalId` - Disponibilidad
- `PUT /api/citas/:id` - Actualizar cita (editar)

#### 4. Validador de Reagendación
**Archivo**: [src/core/validators/ValidadorReagendacionPromocion.ts](src/core/validators/ValidadorReagendacionPromocion.ts)

**Lógica**:
- ✅ Primera reagendación: mantiene promoción SI es en el MISMO MES
- ❌ Fuera del mes: pierde promoción automáticamente
- ❌ Segunda+ reagendación: pierde promoción (REGLA DE ORO)

**Ejemplo**:
```typescript
const cita = new CitaEntity({
  fechaCita: new Date('2026-02-05'), // Feb
  esPromocion: true,
  reagendaciones: 0
});

const validacion = ValidadorReagendacionPromocion.validar(
  cita,
  new Date('2026-03-15') // Marzo
);

// Resultado:
// {
//   puedeReagendar: true,
//   mantienePromocion: false,
//   mensaje: "Se intenta reagendar fuera del mes..."
// }
```

### Frontend

#### 1. Formulario de Catálogo (Paso 1)
**Archivo**: [frontend/components/citas/CatalogoForm.tsx](frontend/components/citas/CatalogoForm.tsx)

**Funcionalidad**:
- Step 1: Seleccionar sucursal
- Step 2: Seleccionar especialidad (filtra docentes)
- Step 3: Seleccionar doctor (con horarios)
- Step 4: Seleccionar servicio (muestra precio + promoción si aplica)
- Checkbox: "Cita sin horario" para subsecuentes flexibles
- Resumen visual del costo

**Características**:
- Carga catálogo desde `/api/catalogo`
- Flujo guiado (wizard)
- Validación en cada paso
- Muestra promociones aplicadas (tachado + precio descuento)

**Retorna**:
```typescript
{
  sucursalId: "suc-1",
  sucursalNombre: "CDMX Centro",
  especialidadId: "esp-2",
  especialidadNombre: "Odontología",
  doctorId: "doc-2",
  doctorNombre: "Dr. Mateo Ruiz",
  servicioId: "srv-2",
  servicioNombre: "Limpieza Dental",
  precioServicio: 250,
  promocionAplicada: true,
  precioPromocion: 250
}
```

#### 2. Formulario de Disponibilidad (Paso 2)
**Archivo**: [frontend/components/citas/DisponibilidadForm.tsx](frontend/components/citas/DisponibilidadForm.tsx)

**Funcionalidad**:
- Selector de fecha (rango: hoy hasta +90 días)
- Grid de horarios disponibles (slots)
- Muestra en verde horarios con cupo (ej: 09:00)
- Muestra en gris horarios ocupados (ej: 09:30 - 3/3)
- Validación en tiempo real

**Características**:
- Carga disponibilidad desde `/api/citas/disponibilidad/:sucursalId`
- Actualiza slots al cambiar fecha
- Muestra info de capacidad (ej: 1/3 = 1 disponible de 3)
- Rango de fechas hasta 90 días

**Retorna**:
```typescript
{
  fecha: Date,
  hora: "14:00"
}
```

#### 3. Formulario de Datos (Paso 3)
**Archivo**: [frontend/components/citas/DatosPacienteForm.tsx](frontend/components/citas/DatosPacienteForm.tsx)

**Campos OBLIGATORIOS**:
- ✅ Nombre
- ✅ Apellido Paterno
- ✅ Apellido Materno
- ✅ Teléfono
- ✅ Correo Electrónico
- ✅ Edad
- ✅ **No. Afiliación** (CRÍTICO - con alerta roja)

**Campos OPCIONALES**:
- Religión

**Características**:
- Validación en tiempo real
- Alerta crítica: "No. Afiliación es obligatorio para reportes"
- Formato de ejemplos (RCA-2024-0001)
- Resumen verde cuando todos los datos son válidos

**Retorna**:
```typescript
{
  nombre: "Juan",
  apellidoPaterno: "Pérez",
  apellidoMaterno: "García",
  telefono: "5551234567",
  email: "juan@example.com",
  edad: 36,
  noAfiliacion: "RCA-2024-0001",
  religion: "Adventista"
}
```

## 🔄 Flujo Completo de Agendamiento

```
┌─────────────────────────────────────────────────────────┐
│ 1. CATÁLOGO (CatalogoForm.tsx)                          │
│   - Sucursal ↓                                          │
│   - Especialidad ↓                                      │
│   - Doctor ↓ (filtra por sucursal + especialidad)      │
│   - Servicio ↓ (muestra precio + promoción)            │
│   - [Checkbox: Sin Horario]                            │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DISPONIBILIDAD (DisponibilidadForm.tsx)             │
│   - Fecha (hoy hasta +90 días)                         │
│   - Horarios en slots (08:00, 08:30, 09:00...)        │
│   - Estados: verde (disponible), gris (ocupado)        │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 3. DATOS PACIENTE (DatosPacienteForm.tsx)              │
│   - Nombre, Apellidos, Teléfono, Email, Edad          │
│   - No. Afiliación (CRÍTICO)                          │
│   - Religión (opcional)                               │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CONFIRMACIÓN Y ENVÍO (Backend)                       │
│   - POST /api/citas                                     │
│   - Validar disponibilidad en servidor                 │
│   - Crear cita con estado "Agendada"                   │
│   - Enviar confirmación por WhatsApp                   │
│   - Programar recordatorios (24h, día de cita)         │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Reglas de Negocio Implementadas

### 1. Catálogo
- ✅ Sucursales con zona horaria
- ✅ Especialidades relacionadas a doctores
- ✅ Doctores con horarios (inicio/fin, intervalo, capacidad)
- ✅ Servicios con precio base y promocional
- ✅ Promociones con fechas de vigencia

### 2. Disponibilidad
- ✅ Genera slots cada `intervaloMin` (default 30 min)
- ✅ Permite `maxEmpalmes` citas por slot (default 3)
- ✅ Valida capacidad disponible
- ✅ Rango: hoy hasta +90 días

### 3. Cita Sin Horario (Subsecuente Flexible)
- ✅ Flag `sinHorario` en request
- ✅ Establece `horaCita = "00:00"`
- ✅ Agrega tag `[SIN_HORARIO]` en notas
- ✅ Paciente entra cuando quiera

### 4. Promoción y Reagendación
- ✅ Primera reagendación: mantiene promoción SI mismo mes
- ✅ Fuera del mes: pierde promoción automáticamente
- ✅ Segunda+ reagendación: pierde promoción (REGLA DE ORO)

## 📊 Datos de Ejemplo

### Catálogo Inicial
```
Sucursales: 3 (CDMX, Guadalajara, Monterrey)
Especialidades: 4 (General, Odontología, Ortopedia, Dermatología)
Doctores: 4 (1-2 por sucursal/especialidad)
Servicios: 4 (precios 500-700, promos 250-350)
Promociones: 2 (MES_SALUD 50%, PRIMERA_VEZ 40%)
```

## 🚀 Próximos Pasos (No Implementados Aún)

### C) Confirmación y Reserva
- [ ] Componente de resumen final
- [ ] Crear paciente si no existe
- [ ] POST `/api/citas` con validaciones
- [ ] Generar confirmación visual

### D) Confirmaciones y Recordatorios
- [ ] WhatsApp real (no simulado)
- [ ] Email de confirmación
- [ ] SMS opcional
- [ ] Recordatorios automáticos (24h, día de cita)

### E) Integraciones
- [ ] Webhooks de Meta para confirmar lectura
- [ ] WebSocket para estado en tiempo real
- [ ] Base de datos real (PostgreSQL)
- [ ] Persistencia de disponibilidad

## ✅ Checklist de Funcionamiento

- [x] Catálogo cargable desde API
- [x] Formulario wizard de 4 pasos
- [x] Disponibilidad por fecha/doctor
- [x] Slots con capacidad visual
- [x] Datos de paciente con validación
- [x] Alerta crítica: No. Afiliación
- [x] Soporte para citas sin horario
- [x] Validador de reagendación (mismo mes)
- [x] Cálculo de precios + promociones
- [x] Rutas API completadas
- [ ] Guardado en BD (pendiente)
- [ ] Confirmación WhatsApp real (pendiente)
- [ ] Recordatorios automáticos (pendiente)

## 🔗 Relaciones

```
CatalogoForm → Sucursal + Especialidad + Doctor
         ↓
DisponibilidadForm → Fecha + Horario (desde /api/citas/disponibilidad)
         ↓
DatosPacienteForm → Nombre, Teléfono, Email, No. Afiliación
         ↓
ConfirmacionForm (pendiente) → Crear cita + enviar confirmación
```

---

**Estado**: 🟡 **80% Completo**  
**Implementación**: 4 de febrero de 2026  
**Desarrollador**: GitHub Copilot + Claude Haiku
