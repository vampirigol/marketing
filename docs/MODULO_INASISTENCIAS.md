# Sistema de Gestión de Inasistencias y Remarketing

## 📋 Descripción General

Sistema completo para gestionar pacientes que no asisten a sus citas, clasificarlos por motivos, ejecutar campañas de recuperación y marcar como perdidos según protocolo de 7 días.

## ✅ Características Implementadas

### 1. Lista de Inasistencia Automática ✅

- **Registro automático** cuando una cita tiene estado `No_Asistio`
- **Protocolo de 7 días** iniciado automáticamente al registrar
- **Seguimiento en tiempo real** del estado de cada inasistencia

### 2. Catálogo de Motivos de Inasistencia ✅

| Motivo | Descripción | Remarketing | Días Espera | Prioridad |
|--------|-------------|-------------|-------------|-----------|
| **Económico** | Sin recursos suficientes | ✅ Sí | 2 días | Alta |
| **Transporte** | Problemas de movilidad | ✅ Sí | 1 día | Alta |
| **Salud** | Impedimento de salud | ✅ Sí | 3 días | Media |
| **Olvido** | Olvidó la cita | ✅ Sí | 1 día | Alta |
| **Competencia** | Atendido en otra clínica | ❌ No | 0 días | Baja |
| **No_Responde** | Sin respuesta a contactos | ✅ Sí | 2 días | Media |
| **Raza_Brava** | Paciente conflictivo | ❌ No | 0 días | Baja |
| **Otro** | Motivo no especificado | ✅ Sí | 2 días | Media |

### 3. Sistema de Remarketing ✅

**Campañas Automáticas:**
- ✅ Mensajes personalizados por motivo
- ✅ Plantillas específicas para cada situación
- ✅ Multi-canal (WhatsApp, Facebook, Instagram)
- ✅ Priorización inteligente
- ✅ Ejecución automática diaria (09:00 AM)

**Características:**
- 📊 Estadísticas en tiempo real
- 🎯 Segmentación por motivo y prioridad
- 📈 Tasa de recuperación
- 🚀 Límite de 50 contactos por día (configurable)

### 4. Protocolo "7 días sin respuesta → PERDIDO" ✅

**Funcionamiento:**
1. Al registrar inasistencia → `fechaLimiteRespuesta = fechaInasistencia + 7 días`
2. Scheduler diario (00:00) verifica todas las inasistencias
3. Si `fechaActual > fechaLimiteRespuesta` → Marca como PERDIDO
4. Estado cambia a `Perdido` automáticamente
5. Se remueve de lista de remarketing

**Alertas:**
- 🔔 **2 días antes**: Alerta al equipo Contact Center
- ⚠️ **Al vencimiento**: Marca automáticamente como perdido
- 📊 **Reportes**: Estadísticas de pacientes perdidos

### 5. Bloqueo Automático de Marketing ("Raza Brava") ✅

**Activación automática cuando:**
- Se asigna motivo `Raza_Brava`
- Usuario marca manualmente como bloqueado

**Efectos del bloqueo:**
- 🚫 **NO** se envían mensajes de remarketing
- 🚫 **NO** aparece en listas de contacto
- ⚠️ Alerta visible en sistema
- 📝 Requiere aprobación de supervisor para reagendar

**Características:**
- Registro del motivo de bloqueo
- Fecha de bloqueo
- Estado permanente hasta revisión manual
- Consulta de lista completa de bloqueados

### 6. Flujo de Reagendación desde Inasistencia ✅

**Proceso:**
1. Seleccionar inasistencia pendiente
2. Verificar que no esté bloqueada
3. Crear nueva cita
4. Vincular nueva cita con inasistencia
5. Estado cambia a `Reagendada`
6. Se remueve de remarketing
7. Se registra en historial del paciente

**Validaciones:**
- ✅ No reagendar si está bloqueado
- ✅ No reagendar si ya fue marcado como perdido
- ✅ No permitir duplicados
- ✅ Registrar en historial

## 🏗️ Arquitectura

### Entidades

```typescript
// Entidad principal
interface Inasistencia {
  id: string;
  citaId: string;
  pacienteId: string;
  sucursalId: string;
  
  // Tracking
  fechaCitaPerdida: Date;
  estadoSeguimiento: EstadoSeguimiento;
  
  // Motivo
  motivo?: MotivoInasistencia;
  motivoDetalle?: string;
  
  // Contacto
  intentosContacto: number;
  ultimoIntentoContacto?: Date;
  proximoIntentoContacto?: Date;
  notasContacto: string[];
  
  // Remarketing
  enListaRemarketing: boolean;
  campaignRemarketing?: string;
  
  // Protocolo 7 días
  fechaLimiteRespuesta: Date;
  marcadoComoPerdido: boolean;
  
  // Bloqueo
  bloqueadoMarketing: boolean;
  motivoBloqueo?: string;
  
  // Reagendación
  nuevaCitaId?: string;
}
```

### Casos de Uso

1. **RegistrarInasistencia** - Registra nueva inasistencia
2. **AsignarMotivoInasistencia** - Asigna motivo y ejecuta acciones
3. **RegistrarIntentoContacto** - Registra intentos de contacto
4. **ReagendarDesdeInasistencia** - Reagenda paciente recuperado
5. **ProcesarProtocolo7Dias** - Ejecuta protocolo automático

### Servicios

- **RemarketingService** - Gestiona campañas de recuperación
- **InasistenciaScheduler** - Automatización de tareas

### Repositorio

- **InasistenciaRepository** - Acceso a datos
  - Filtros por estado, sucursal, fechas
  - Listas especializadas (remarketing, bloqueados, perdidos)
  - Estadísticas completas

## 📡 API Endpoints

### Gestión de Inasistencias

```http
POST /api/inasistencias
# Registrar nueva inasistencia

GET /api/inasistencias/:id
# Obtener inasistencia por ID

POST /api/inasistencias/:id/motivo
# Asignar motivo

POST /api/inasistencias/:id/contacto
# Registrar intento de contacto

POST /api/inasistencias/:id/reagendar
# Reagendar desde inasistencia

GET /api/inasistencias/paciente/:pacienteId
# Historial del paciente
```

### Listas y Filtros

```http
GET /api/inasistencias/lista/pendientes?sucursalId=xxx
# Pendientes de seguimiento

GET /api/inasistencias/lista/remarketing?sucursalId=xxx
# Lista de remarketing

GET /api/inasistencias/lista/bloqueados
# Pacientes bloqueados

GET /api/inasistencias/lista/proximas-vencer?dias=2
# Próximas a vencer (alertas)
```

### Remarketing

```http
POST /api/inasistencias/remarketing/ejecutar
# Ejecutar campaña de remarketing
Body: { inasistencias: string[], canal: 'WhatsApp' }
```

### Protocolo y Reportes

```http
POST /api/inasistencias/protocolo-7dias
# Ejecutar protocolo manualmente

GET /api/inasistencias/stats/general?sucursalId=xxx&fechaInicio=xxx&fechaFin=xxx
# Estadísticas generales

GET /api/inasistencias/reporte/perdidos?sucursalId=xxx
# Reporte de perdidos

GET /api/inasistencias/catalogo/motivos
# Catálogo de motivos
```

## ⚙️ Schedulers Automáticos

### 1. Protocolo 7 Días
- **Frecuencia**: Diario a las 00:00
- **Función**: Marca como perdidos los que cumplan 7 días
- **Output**: Log con detalles de procesamiento

### 2. Verificación Próximas a Vencer
- **Frecuencia**: Cada 6 horas (00:00, 06:00, 12:00, 18:00)
- **Función**: Alerta de inasistencias próximas a vencer
- **Output**: Notificaciones al equipo

### 3. Remarketing Automático
- **Frecuencia**: Diario a las 09:00 AM
- **Función**: Envía mensajes a lista de remarketing
- **Límite**: 50 contactos por día
- **Output**: Reporte de envíos exitosos/fallidos

## 💾 Base de Datos

### Tabla: inasistencias

```sql
CREATE TABLE inasistencias (
  id UUID PRIMARY KEY,
  cita_id UUID REFERENCES citas(id),
  paciente_id UUID REFERENCES pacientes(id),
  sucursal_id UUID REFERENCES sucursales(id),
  
  fecha_cita_perdida DATE NOT NULL,
  hora_cita_perdida TIME NOT NULL,
  
  motivo VARCHAR(20),
  motivo_detalle TEXT,
  estado_seguimiento VARCHAR(20) NOT NULL,
  
  intentos_contacto INTEGER DEFAULT 0,
  ultimo_intento_contacto TIMESTAMP,
  proximo_intento_contacto TIMESTAMP,
  notas_contacto TEXT[],
  
  en_lista_remarketing BOOLEAN DEFAULT false,
  fecha_ingreso_remarketing TIMESTAMP,
  campaign_remarketing VARCHAR(100),
  
  fecha_limite_respuesta TIMESTAMP NOT NULL,
  marcado_como_perdido BOOLEAN DEFAULT false,
  fecha_marcado_perdido TIMESTAMP,
  
  bloqueado_marketing BOOLEAN DEFAULT false,
  motivo_bloqueo TEXT,
  fecha_bloqueo TIMESTAMP,
  
  nueva_cita_id UUID REFERENCES citas(id),
  fecha_reagendacion TIMESTAMP,
  
  creado_por VARCHAR(100) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_cita_inasistencia UNIQUE (cita_id)
);
```

**Índices optimizados para:**
- Búsquedas por paciente
- Filtros por estado
- Lista de remarketing
- Bloqueados
- Perdidos
- Fechas límite
- Próximos contactos

## 📊 Ejemplos de Uso

### 1. Registrar Inasistencia

```typescript
POST /api/inasistencias
{
  "citaId": "cita-123",
  "pacienteId": "paciente-456",
  "sucursalId": "sucursal-789",
  "fechaCitaPerdida": "2026-02-03",
  "horaCitaPerdida": "10:00",
  "creadoPor": "Sistema"
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "✅ Inasistencia registrada. Protocolo de 7 días iniciado."
}
```

### 2. Asignar Motivo

```typescript
POST /api/inasistencias/inasistencia-123/motivo
{
  "motivo": "Economico",
  "motivoDetalle": "No cuenta con efectivo esta semana",
  "asignadoPor": "Keila"
}

Response:
{
  "success": true,
  "data": { ... },
  "acciones": [
    "Motivo asignado: Economico",
    "✅ Agregado a lista de remarketing con campaña: RECOVERY_Economico",
    "📅 Próximo intento programado en 2 días"
  ]
}
```

### 3. Registrar Contacto

```typescript
POST /api/inasistencias/inasistencia-123/contacto
{
  "nota": "Se contactó vía WhatsApp",
  "exitoso": true,
  "respuestaPaciente": "Solicita reagendar para la próxima semana",
  "realizadoPor": "Keila"
}

Response:
{
  "success": true,
  "data": { ... },
  "totalIntentos": 1,
  "proximoIntento": null
}
```

### 4. Reagendar

```typescript
POST /api/inasistencias/inasistencia-123/reagendar
{
  "nuevaCitaId": "cita-789",
  "fechaNuevaCita": "2026-02-10",
  "horaNuevaCita": "14:00",
  "notasReagendacion": "Paciente confirmó disponibilidad",
  "realizadoPor": "Keila"
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "✅ Paciente recuperado exitosamente. Nueva cita: cita-789"
}
```

### 5. Ejecutar Remarketing

```typescript
POST /api/inasistencias/remarketing/ejecutar
{
  "inasistencias": ["inasist-1", "inasist-2", "inasist-3"],
  "canal": "WhatsApp"
}

Response:
{
  "success": true,
  "resultados": [ ... ],
  "resumen": {
    "total": 3,
    "exitosos": 2,
    "fallidos": 1
  },
  "message": "✅ Campaña ejecutada: 2 exitosos, 1 fallidos"
}
```

## 📈 Estadísticas y Reportes

### Dashboard de Inasistencias

```typescript
GET /api/inasistencias/stats/general

Response:
{
  "total": 150,
  "porMotivo": [
    { "motivo": "Economico", "cantidad": 45 },
    { "motivo": "Olvido", "cantidad": 30 },
    { "motivo": "Transporte", "cantidad": 25 }
  ],
  "porEstado": [
    { "estado": "En_Seguimiento", "cantidad": 60 },
    { "estado": "Reagendada", "cantidad": 40 },
    { "estado": "Perdido", "cantidad": 30 },
    { "estado": "Bloqueado", "cantidad": 5 }
  ],
  "enRemarketing": 35,
  "bloqueados": 5,
  "perdidos": 30,
  "recuperados": 40,
  "tasaRecuperacion": 26.67
}
```

### Reporte de Perdidos

```typescript
GET /api/inasistencias/reporte/perdidos

Response:
{
  "total": 30,
  "porMotivo": [
    { "motivo": "No_Responde", "cantidad": 15 },
    { "motivo": "Competencia", "cantidad": 8 }
  ],
  "porMes": [
    { "mes": "2026-01", "cantidad": 12 },
    { "mes": "2026-02", "cantidad": 18 }
  ]
}
```

## 🚀 Integración con el Sistema

### En src/index.ts

```typescript
import { InasistenciaScheduler } from './infrastructure/scheduling/InasistenciaScheduler';
import { InMemoryInasistenciaRepository } from './infrastructure/database/repositories/InasistenciaRepository';
import { RemarketingService } from './infrastructure/remarketing/RemarketingService';

// Inicializar scheduler
const inasistenciaRepo = new InMemoryInasistenciaRepository();
const remarketingService = new RemarketingService(...);
const inasistenciaScheduler = new InasistenciaScheduler(
  inasistenciaRepo,
  remarketingService
);

// Iniciar schedulers automáticos
inasistenciaScheduler.start();
```

## ⚠️ Consideraciones Importantes

### 1. Bloqueos ("Raza Brava")
- **NUNCA** enviar marketing a bloqueados
- Requerir aprobación de supervisor para reagendar
- Mantener registro permanente del motivo

### 2. Protocolo 7 Días
- Es **AUTOMÁTICO** y se ejecuta diariamente
- No es reversible una vez marcado como perdido
- Alertas 2 días antes del vencimiento

### 3. Remarketing
- Respetar límite diario (50 contactos)
- Verificar horarios apropiados (09:00 - 20:00)
- Personalizar mensajes según motivo
- No saturar al paciente (respetar días de espera)

### 4. Privacidad y GDPR
- Registrar todos los intentos de contacto
- Permitir opt-out del remarketing
- Respetar solicitudes de bloqueo

## 🔧 Configuración

### Variables de Entorno

```env
# Remarketing
REMARKETING_ENABLED=true
REMARKETING_DAILY_LIMIT=50
REMARKETING_HOUR=09:00

# Protocolo 7 días
PROTOCOL_7DAYS_ENABLED=true
PROTOCOL_7DAYS_HOUR=00:00

# Alertas
ALERTS_ENABLED=true
ALERTS_DAYS_THRESHOLD=2
```

## 📝 TODO / Mejoras Futuras

- [ ] Dashboard visual de inasistencias
- [ ] Notificaciones push al equipo
- [ ] Integración con calendario para reagendación
- [ ] Análisis predictivo de inasistencias
- [ ] Reportes exportables (PDF/Excel)
- [ ] Chatbot para respuestas automáticas
- [ ] A/B testing de mensajes de remarketing

## 🎯 Métricas de Éxito

- **Tasa de Recuperación**: > 25%
- **Tiempo de Respuesta**: < 48 horas
- **Tasa de Bloqueo**: < 5%
- **Pacientes Perdidos**: < 20%

---

**Implementado por**: Sistema CRM RCA  
**Fecha**: Febrero 2026  
**Estado**: ✅ Completamente funcional
