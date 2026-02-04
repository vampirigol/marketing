# Arquitectura del Sistema CRM RCA

## 📐 Patrón de Arquitectura: Clean Architecture

Este sistema implementa **Clean Architecture** (también conocida como Hexagonal Architecture o Ports and Adapters), propuesta por Robert C. Martin (Uncle Bob).

### Principios Fundamentales

1. **Independencia de Frameworks**: La lógica de negocio no depende de Express, PostgreSQL, o WhatsApp API
2. **Testeable**: Las reglas de negocio se pueden probar sin UI, BD o servidor web
3. **Independencia de UI**: La UI puede cambiar sin afectar el negocio
4. **Independencia de BD**: Puedes cambiar de PostgreSQL a MongoDB sin cambiar reglas
5. **Independencia de Agentes Externos**: Las reglas no saben nada de WhatsApp o Facebook

## 🎯 Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                     │
│  (API REST, Controllers, Routes - Express, WhatsApp API)    │
│                     src/api/                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                        │
│            (Use Cases - Casos de Uso)                        │
│                 src/core/use-cases/                          │
│  • ReagendarPromocion  • MarcarLlegada  • CalcularCorte     │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DOMINIO                           │
│             (Entities - Reglas de Negocio)                   │
│                  src/core/entities/                          │
│    • Paciente  • Cita  • Abono  • Usuario  • Sucursal       │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                 CAPA DE INFRAESTRUCTURA                      │
│  (Database, External APIs, Auth - Implementaciones)          │
│                 src/infrastructure/                          │
│  • PostgreSQL  • WhatsApp API  • JWT Auth                   │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Estructura Detallada

### 1. Core (Núcleo del Sistema)

#### `src/core/entities/`
**Propósito**: Definir las entidades de negocio con sus reglas

**Ejemplos**:
- `Paciente.ts`: Validación de No_Afiliacion obligatorio
- `Cita.ts`: Lógica de reagendación y estados
- `Abono.ts`: Validación de montos y métodos de pago

**Características**:
- ✅ Sin dependencias externas
- ✅ Reglas de negocio puras
- ✅ Fácilmente testeable
- ✅ TypeScript garantiza contratos

#### `src/core/use-cases/`
**Propósito**: Implementar casos de uso específicos del negocio

**Ejemplos**:
- `ReagendarPromocion.ts`: Regla de 1 reagendación máxima
- `MarcarLlegada.ts`: Registro de llegada en recepción
- `CalcularCorte.ts`: Cálculos financieros precisos

**Características**:
- ✅ Orquesta la lógica de negocio
- ✅ Independiente de la BD
- ✅ Independiente de la UI
- ✅ Usa interfaces (Ports) para infraestructura

### 2. API (Capa de Presentación)

#### `src/api/`
**Propósito**: Exponer funcionalidad vía REST API

**Estructura futura**:
```
src/api/
├── controllers/
│   ├── PacienteController.ts
│   ├── CitaController.ts
│   └── AbonoController.ts
├── routes/
│   ├── pacientes.routes.ts
│   ├── citas.routes.ts
│   └── abonos.routes.ts
└── middleware/
    ├── auth.middleware.ts
    └── validation.middleware.ts
```

### 3. Infrastructure (Infraestructura)

#### `src/infrastructure/database/`
**Propósito**: Implementar persistencia de datos

**Estructura futura**:
```
database/
├── repositories/        # Implementación de repositorios
│   ├── PacienteRepository.ts
│   ├── CitaRepository.ts
│   └── AbonoRepository.ts
├── models/             # Modelos de PostgreSQL
│   ├── PacienteModel.ts
│   └── CitaModel.ts
└── migrations/         # Migraciones de BD
    └── 001_create_tables.sql
```

#### `src/infrastructure/matrix/`
**Propósito**: Integración con Meta Business API (WhatsApp, FB, IG)

**Estructura futura**:
```
matrix/
├── WhatsAppService.ts    # Envío de mensajes WhatsApp
├── FacebookService.ts    # Integración Facebook
└── InstagramService.ts   # Integración Instagram
```

#### `src/infrastructure/auth/`
**Propósito**: Autenticación y autorización

**Estructura futura**:
```
auth/
├── JWTService.ts        # Generación y validación JWT
├── PasswordService.ts   # Hash de contraseñas
└── PermissionService.ts # Control de permisos
```

### 4. Shared (Utilidades Compartidas)

#### `src/shared/utils/`
**Propósito**: Funciones auxiliares reutilizables

**Implementado**:
- `DateUtils.ts`: Manejo de fechas y zonas horarias
- `IdGenerator.ts`: Generación de IDs únicos

**Futuro**:
- `PDFGenerator.ts`: Generación de recibos PDF
- `Validator.ts`: Validaciones comunes
- `Logger.ts`: Sistema de logs

### 5. Web (Frontend - Futuro)

#### `src/web/`
**Propósito**: Interfaz de usuario (Next.js)

**Estructura futura**:
```
web/
├── components/         # Componentes React reutilizables
│   ├── Calendar.tsx
│   ├── PatientForm.tsx
│   └── PaymentForm.tsx
├── views/             # Vistas por rol
│   ├── ContactCenter/
│   ├── Finanzas/
│   └── Recepcion/
└── store/            # Estado global (Zustand/Redux)
    ├── citasStore.ts
    └── pacientesStore.ts
```

## 🔄 Flujo de Datos

### Ejemplo: Crear una Cita

```typescript
1. REQUEST (API Layer)
   POST /api/citas
   Body: { pacienteId, fechaCita, horaCita, ... }
   ↓
2. CONTROLLER
   CitaController.crear()
   - Valida datos de entrada
   - Extrae usuario del JWT
   ↓
3. USE CASE
   CrearCitaUseCase.ejecutar(dto)
   - Valida reglas de negocio
   - Verifica No_Afiliacion del paciente
   - Verifica disponibilidad
   ↓
4. ENTITY
   new CitaEntity(data)
   - Aplica reglas de dominio
   - Calcula costo según tipo
   ↓
5. REPOSITORY (Infrastructure)
   CitaRepository.save(cita)
   - Persiste en PostgreSQL
   ↓
6. EXTERNAL SERVICE
   WhatsAppService.enviarConfirmacion(cita)
   - Envía mensaje de confirmación
   ↓
7. RESPONSE
   Return cita creada
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test de entidad (sin dependencias)
test('PacienteEntity: debe lanzar error si No_Afiliacion vacío', () => {
  expect(() => {
    new PacienteEntity({ noAfiliacion: '' })
  }).toThrow('No_Afiliacion es obligatorio');
});
```

### Integration Tests
```typescript
// Test de caso de uso (con mocks)
test('ReagendarPromocion: debe rechazar segunda reagendación', async () => {
  const mockCita = { esPromocion: true, reagendaciones: 1 };
  const useCase = new ReagendarPromocionUseCase();
  
  await expect(useCase.ejecutar({ citaId: '123' }))
    .rejects
    .toThrow('solo pueden reagendarse UNA vez');
});
```

## 🎨 Ventajas de esta Arquitectura

### Para el Desarrollo
✅ **Cambios aislados**: Cambiar WhatsApp por Telegram no afecta el core
✅ **Testing fácil**: No necesitas base de datos para testear reglas
✅ **Desarrollo paralelo**: Equipos pueden trabajar en capas diferentes

### Para el Negocio
✅ **Escalabilidad**: Agregar sucursales no rompe el sistema
✅ **Mantenibilidad**: Cambios son predecibles y seguros
✅ **Flexibilidad**: Fácil agregar nuevos canales (Telegram, SMS)

### Para Antonio y Yaretzi (Finanzas)
✅ **Reportes confiables**: Validaciones garantizan datos correctos
✅ **No_Afiliacion siempre presente**: TypeScript lo garantiza
✅ **Cálculos verificados**: Lógica en el core, no en SQL

### Para Keila (Contact Center)
✅ **Reglas claras**: No puede reagendar promociones 2 veces
✅ **Mensajes automáticos**: Integración transparente con WhatsApp
✅ **Acceso multi-sucursal**: Controlado por permisos

## 📚 Referencias

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/)
- [Node.js Design Patterns](https://www.nodejsdesignpatterns.com/)

## 🚀 Próximos Pasos

1. Implementar Repositories (PostgreSQL)
2. Crear Controllers REST
3. Integrar Meta Business API
4. Implementar autenticación JWT
5. Crear migraciones de BD
6. Desarrollar frontend con Next.js
