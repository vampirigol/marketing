# Estructura de Datos para Agendar Cita

## 📋 Flujo Completo de Agendamiento

### Paso 1️⃣: Catálogo (Sucursal, Especialidad/Doctor, Servicio)

**Componente:** `CatalogoForm.tsx`

```typescript
interface DatosCatalogo {
  // Sucursal
  sucursalId: string;
  sucursalNombre?: string;
  
  // Especialidad
  especialidadId: string;
  especialidadNombre?: string;
  
  // Doctor
  doctorId: string;
  doctorNombre?: string;
  
  // Servicio (con promociones)
  servicioId: string;
  servicioNombre?: string;
  precioServicio?: number;
  promocionAplicada?: boolean;
  precioPromocion?: number;
}
```

**Orden de selección:**
1. ✅ **Sucursal** - Elige ubicación física
2. ✅ **Especialidad** - Filtra doctores por especialidad
3. ✅ **Doctor** - Selecciona médico específico dentro de la especialidad
4. ✅ **Servicio** - Elige el tipo de consulta/tratamiento (incluye promociones activas)

---

### Paso 2️⃣: Disponibilidad (Fecha y Hora)

**Componente:** `DisponibilidadForm.tsx`

```typescript
interface DatosDisponibilidad {
  fecha: Date;      // Fecha seleccionada
  hora: string;     // Hora seleccionada (formato HH:mm)
}
```

**Características:**
- ✅ Visualización de disponibilidad abierta por hora
- ✅ Soporta **n citas empalmadas** (capacidad de empalmes configurable por doctor)
- ✅ Muestra cupo disponible por slot de tiempo
- ✅ Indica claramente slots llenos vs disponibles

---

### Paso 3️⃣: Datos del Paciente

**Componente:** `DatosPacienteForm.tsx`

```typescript
interface DatosPaciente {
  // OBLIGATORIOS
  noAfiliacion: string;        // ⚠️ CRÍTICO: RCA-2024-0001
  nombre: string;              // Nombre del paciente
  apellidoPaterno: string;     // Apellido paterno
  telefono: string;            // Teléfono de contacto
  edad: number;                // Edad en años
  
  // OPCIONALES
  apellidoMaterno?: string;    // Apellido materno (opcional)
  email?: string;              // Correo electrónico (opcional)
  religion?: string;           // Religión (opcional)
}
```

#### Campos Obligatorios (*)
1. ✅ **No. Afiliación** ⚠️ CRÍTICO
   - Formato: `RCA-YYYY-NNNN`
   - Ejemplo: `RCA-2024-0001`
   - Necesario para reportes financieros y auditoría

2. ✅ **Nombre**
   - Solo el primer nombre

3. ✅ **Apellido Paterno**
   - Primer apellido

4. ✅ **Teléfono**
   - Formato: 10 dígitos
   - Ejemplo: `5551234567`

5. ✅ **Edad**
   - Número entero (0-120)

#### Campos Opcionales

1. **Apellido Materno**
   - Segundo apellido
   - Puede quedar vacío

2. **Correo Electrónico**
   - Formato: `usuario@dominio.com`
   - Validado si se proporciona
   - Puede quedar vacío

3. **Religión**
   - Opciones:
     - No especificada (default)
     - Adventista
     - Cristiana
     - Católica
     - Otra

---

## 🔄 Datos Finales Enviados al Backend

```typescript
interface CitaCompleta {
  // De Catálogo
  sucursalId: string;
  sucursalNombre?: string;
  especialidadId: string;
  especialidadNombre?: string;
  doctorId: string;
  doctorNombre?: string;
  servicioId: string;
  servicioNombre?: string;
  precioServicio?: number;
  promocionAplicada?: boolean;
  precioPromocion?: number;
  
  // De Disponibilidad
  fecha: Date;
  hora: string;
  
  // De Paciente (Nuevo o Existente)
  pacienteId: string;
  pacienteNombre: string;
  
  // Si es paciente nuevo, incluye:
  datosPaciente?: {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    telefono: string;
    email?: string;
    edad: number;
    noAfiliacion: string;
    religion?: string;
  };
  
  // Metadatos de la cita
  estado: 'Agendada';
  motivoCancelacion: null;
  reagendaciones: 0;
  notasInternas: string;
  tiempoCargaPaciente: number;
}
```

---

## 📊 Ejemplo de Flujo Completo

### Escenario: Paciente Nuevo Agenda Cita

```json
{
  // Paso 1: Catálogo
  "sucursalId": "suc-01",
  "sucursalNombre": "Sucursal Centro",
  "especialidadId": "esp-med-gral",
  "especialidadNombre": "Medicina General",
  "doctorId": "doc-lopez-123",
  "doctorNombre": "Dr. López",
  "servicioId": "serv-consulta-gral",
  "servicioNombre": "Consulta General",
  "precioServicio": 100,
  "promocionAplicada": true,
  "precioPromocion": 50,
  
  // Paso 2: Disponibilidad
  "fecha": "2026-02-10T00:00:00.000Z",
  "hora": "10:00",
  
  // Paso 3: Datos Paciente
  "pacienteId": "nuevo",
  "pacienteNombre": "Juan Pérez García",
  "datosPaciente": {
    "noAfiliacion": "RCA-2024-0123",
    "nombre": "Juan",
    "apellidoPaterno": "Pérez",
    "apellidoMaterno": "García",
    "telefono": "5551234567",
    "email": "juan.perez@example.com",
    "edad": 32,
    "religion": "Católica"
  },
  
  // Metadatos
  "estado": "Agendada",
  "motivoCancelacion": null,
  "reagendaciones": 0,
  "notasInternas": "",
  "tiempoCargaPaciente": 0
}
```

### Escenario: Paciente Existente Agenda Cita

```json
{
  // Paso 1: Catálogo
  "sucursalId": "suc-01",
  "sucursalNombre": "Sucursal Centro",
  "especialidadId": "esp-odonto",
  "especialidadNombre": "Odontología",
  "doctorId": "doc-martinez-456",
  "doctorNombre": "Dra. Martínez",
  "servicioId": "serv-limpieza",
  "servicioNombre": "Limpieza Dental",
  "precioServicio": 400,
  "promocionAplicada": false,
  
  // Paso 2: Disponibilidad
  "fecha": "2026-02-15T00:00:00.000Z",
  "hora": "14:00",
  
  // Paso 3: Paciente Existente
  "pacienteId": "pac-existing-789",
  "pacienteNombre": "María González López",
  // Sin datosPaciente porque ya está registrado
  
  // Metadatos
  "estado": "Agendada",
  "motivoCancelacion": null,
  "reagendaciones": 0,
  "notasInternas": "",
  "tiempoCargaPaciente": 0
}
```

---

## ⚙️ Configuración de Empalmes

### Capacidad de Citas Empalmadas

El sistema soporta múltiples citas en el mismo horario según la configuración del doctor:

```typescript
interface Doctor {
  id: string;
  nombre: string;
  especialidadId: string;
  sucursalId: string;
  horario: {
    inicio: string;      // "08:00"
    fin: string;         // "18:00"
    intervaloMin: number; // 30 minutos
  };
  capacidadEmpalmes: number; // 3 = hasta 3 citas simultáneas
}
```

**Ejemplo de Visualización de Slots:**

```
Hora     | Capacidad | Disponible | Estado
---------|-----------|------------|-------------
09:00    | 3/3       | 3          | ✅ Disponible
09:30    | 2/3       | 1          | ⚠️ Casi lleno
10:00    | 0/3       | 0          | ❌ Lleno
10:30    | 3/3       | 3          | ✅ Disponible
```

---

## 🎯 Validaciones Implementadas

### Catálogo
- ✅ Sucursal seleccionada
- ✅ Especialidad seleccionada
- ✅ Doctor seleccionado
- ✅ Servicio seleccionado

### Disponibilidad
- ✅ Fecha seleccionada
- ✅ Hora seleccionada
- ✅ Slot con cupo disponible

### Datos Paciente
- ✅ No. Afiliación obligatorio
- ✅ Nombre obligatorio
- ✅ Apellido Paterno obligatorio
- ✅ Teléfono obligatorio (10 dígitos)
- ✅ Edad obligatoria (0-120)
- ✅ Email opcional pero validado si se proporciona
- ✅ Apellido Materno opcional
- ✅ Religión opcional

---

## 🚀 Endpoints API Requeridos

### 1. Obtener Catálogo
```
GET /api/catalogo
Response: {
  sucursales: [...],
  especialidades: [...],
  doctores: [...],
  servicios: [...],
  promociones: [...]
}
```

### 2. Obtener Disponibilidad
```
GET /api/disponibilidad?sucursalId={id}&doctorId={id}&fecha={YYYY-MM-DD}
Response: {
  slots: [
    { hora: "09:00", disponible: true, cupoDisponible: 3, capacidad: 3 },
    ...
  ]
}
```

### 3. Crear Cita
```
POST /api/citas
Body: CitaCompleta (ver estructura arriba)
Response: {
  success: true,
  citaId: "cita-123",
  mensaje: "Cita agendada exitosamente"
}
```

### 4. Validar No. Afiliación
```
GET /api/pacientes/validar-afiliacion?noAfiliacion={RCA-2024-0001}
Response: {
  existe: true/false,
  paciente?: {...}
}
```

---

## 📝 Notas Importantes

1. **No. Afiliación es CRÍTICO**
   - Requerido para reportes financieros
   - Cumplimiento de regulaciones de auditoría
   - No se puede crear cita sin este dato

2. **Campos Opcionales Mínimos**
   - Solo Apellido Materno y Email son opcionales
   - Resto de campos son obligatorios para operación del sistema

3. **Promociones**
   - Se aplican automáticamente si están activas
   - Se muestra precio original y precio promocional
   - Badge visual "🎁 Promo" en la interfaz

4. **Empalmes**
   - Configurables por doctor
   - Sistema valida cupo disponible
   - Evita sobrecupo automáticamente
