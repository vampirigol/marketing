# Diccionario de Datos - Sistema CRM RCA

## Entidades Principales

### 1. PACIENTE

| Campo | Tipo | Obligatorio | Descripción | Validación |
|-------|------|-------------|-------------|------------|
| id | string | Sí | Identificador único | UUID |
| nombreCompleto | string | Sí | Nombre completo del paciente | Min 3 caracteres |
| telefono | string | Sí | Teléfono principal | 10 dígitos |
| whatsapp | string | No | WhatsApp (si es diferente) | 10 dígitos |
| email | string | No | Correo electrónico | Formato email válido |
| fechaNacimiento | Date | Sí | Fecha de nacimiento | Fecha válida |
| edad | number | Sí | Edad calculada | Auto-calculada |
| sexo | enum | Sí | Sexo biológico | M, F, Otro |
| **noAfiliacion** | **string** | **Sí** | **Número de afiliación** | **CRÍTICO: No puede estar vacío** |
| tipoAfiliacion | enum | Sí | Tipo de afiliación | IMSS, ISSSTE, Particular, Seguro |
| ciudad | string | Sí | Ciudad de residencia | - |
| estado | string | Sí | Estado | - |
| origenLead | enum | Sí | Canal de origen | WhatsApp, Facebook, Instagram, Llamada, Presencial, Referido |
| activo | boolean | Sí | Estado activo | Default: true |

### 2. CITA

| Campo | Tipo | Obligatorio | Descripción | Validación |
|-------|------|-------------|-------------|------------|
| id | string | Sí | Identificador único | UUID |
| pacienteId | string | Sí | ID del paciente | FK a Paciente |
| sucursalId | string | Sí | ID de la sucursal | FK a Sucursal |
| fechaCita | Date | Sí | Fecha de la cita | Debe ser futura |
| horaCita | string | Sí | Hora de la cita | Formato HH:mm |
| tipoConsulta | enum | Sí | Tipo de consulta | Primera_Vez, Subsecuente, Urgencia |
| estado | enum | Sí | Estado actual | Agendada, Confirmada, En_Consulta, Atendida, Cancelada, No_Asistio |
| **esPromocion** | **boolean** | **Sí** | **Es cita promocional** | **Afecta reagendaciones** |
| **reagendaciones** | **number** | **Sí** | **Contador de reagendaciones** | **Max 1 si es promoción** |
| costoConsulta | number | Sí | Costo de la consulta | > 0 |
| montoAbonado | number | Sí | Monto abonado | >= 0 |
| saldoPendiente | number | Sí | Saldo pendiente | Auto-calculado |

### 3. ABONO

| Campo | Tipo | Obligatorio | Descripción | Validación |
|-------|------|-------------|-------------|------------|
| id | string | Sí | Identificador único | UUID |
| citaId | string | Sí | ID de la cita | FK a Cita |
| pacienteId | string | Sí | ID del paciente | FK a Paciente |
| monto | number | Sí | Monto del abono | > 0 |
| metodoPago | enum | Sí | Método de pago | Efectivo, Tarjeta, Transferencia, Mixto |
| folioRecibo | string | Sí | Folio del recibo | Auto-generado |
| estado | enum | Sí | Estado del abono | Aplicado, Pendiente, Cancelado |
| fechaPago | Date | Sí | Fecha del pago | Fecha válida |
| registradoPor | string | Sí | Usuario que registró | FK a Usuario |

### 4. USUARIO

| Campo | Tipo | Obligatorio | Descripción | Validación |
|-------|------|-------------|-------------|------------|
| id | string | Sí | Identificador único | UUID |
| nombreCompleto | string | Sí | Nombre completo | Min 3 caracteres |
| email | string | Sí | Correo electrónico | Email válido, único |
| password | string | Sí | Contraseña hasheada | Bcrypt hash |
| rol | enum | Sí | Rol del usuario | Admin, Finanzas, Contact_Center, Recepcion, Medico |
| permisos | array | Sí | Permisos asignados | Array de strings |
| activo | boolean | Sí | Estado activo | Default: true |

### 5. SUCURSAL

| Campo | Tipo | Obligatorio | Descripción | Validación |
|-------|------|-------------|-------------|------------|
| id | string | Sí | Identificador único | UUID |
| codigo | string | Sí | Código de sucursal | Formato: RCA-XXX |
| nombre | string | Sí | Nombre de la sucursal | - |
| zonaHoraria | string | Sí | Zona horaria | IANA timezone |
| horarioApertura | string | Sí | Hora de apertura | Formato HH:mm |
| horarioCierre | string | Sí | Hora de cierre | Formato HH:mm |
| activa | boolean | Sí | Sucursal activa | Default: true |

## Reglas de Negocio Críticas

### 1. No_Afiliacion Obligatorio
```
REGLA: El campo No_Afiliacion NO puede estar vacío nunca
MOTIVO: Causa errores en los reportes de Antonio y Yaretzi
VALIDACIÓN: TypeScript no compila si está vacío
IMPLEMENTACIÓN: Validación en constructor de PacienteEntity
```

### 2. Reagendación de Promociones
```
REGLA: Las citas promocionales solo pueden reagendarse UNA vez
MOTIVO: Política de la clínica para controlar costos
VALIDACIÓN: Campo reagendaciones <= 1 si esPromocion === true
IMPLEMENTACIÓN: Validación en CitaEntity.reagendar()
```

### 3. Cálculo de Cortes de Caja
```
REGLA: La suma de abonos debe coincidir con el total del corte
MOTIVO: Integridad financiera
VALIDACIÓN: Verificación matemática en CalcularCorteUseCase
IMPLEMENTACIÓN: Error si diferencia > 0.01
```

### 4. Métodos de Pago Mixtos
```
REGLA: Si metodoPago === 'Mixto', debe existir montosDesglosados
VALIDACIÓN: La suma del desglose debe coincidir con el monto total
IMPLEMENTACIÓN: Validación en constructor de AbonoEntity
```

## Estados y Transiciones

### Estados de Cita
```
Agendada → Confirmada (marcar llegada)
Confirmada → En_Consulta (iniciar atención)
En_Consulta → Atendida (finalizar atención)
Agendada/Confirmada → Cancelada (cancelar cita)
Agendada → No_Asistio (no se presentó)
```

### Estados de Abono
```
Pendiente → Aplicado (aplicar pago)
Aplicado → Cancelado (cancelar por error)
```

## Códigos y Formatos

### Folio de Recibo
```
Formato: [CODIGO_SUCURSAL]-[AAMMDD]-[NNNN]
Ejemplo: RCA-260203-0001
```

### ID de Entidades
```
Formato: [prefijo]-[timestamp]-[random]
Ejemplos:
  - pac-1707123456-a1b2c3d4e
  - cit-1707123456-x9y8z7w6v
```

## Índices Recomendados

```sql
-- Pacientes
CREATE INDEX idx_paciente_telefono ON pacientes(telefono);
CREATE INDEX idx_paciente_afiliacion ON pacientes(no_afiliacion);

-- Citas
CREATE INDEX idx_cita_fecha ON citas(fecha_cita);
CREATE INDEX idx_cita_paciente ON citas(paciente_id);
CREATE INDEX idx_cita_sucursal ON citas(sucursal_id);
CREATE INDEX idx_cita_estado ON citas(estado);

-- Abonos
CREATE INDEX idx_abono_fecha ON abonos(fecha_pago);
CREATE INDEX idx_abono_sucursal ON abonos(sucursal_id);
CREATE INDEX idx_abono_estado ON abonos(estado);
```

## Notas Técnicas

1. **Timestamps**: Todos los timestamps se almacenan en UTC y se convierten a la zona horaria de la sucursal al mostrar
2. **Soft Delete**: Las entidades no se eliminan físicamente, se marcan como `activo: false`
3. **Auditoría**: Todos los cambios deben registrar usuario y fecha
4. **Validación**: TypeScript fuerza la validación en tiempo de compilación
