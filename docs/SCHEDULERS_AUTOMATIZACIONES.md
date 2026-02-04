# Sistema de Schedulers y Automatizaciones - RCA CRM

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Schedulers Implementados](#schedulers-implementados)
3. [Configuración](#configuración)
4. [Uso y Ejecución](#uso-y-ejecución)
5. [Endpoints de Administración](#endpoints-de-administración)

## 🎯 Descripción General

El sistema de schedulers automatiza procesos críticos del CRM, eliminando la necesidad de intervención manual constante. Todos los schedulers están coordinados por el **SchedulerManager** que gestiona su ciclo de vida y monitoreo.

### Arquitectura

```
SchedulerManager (Coordinador Central)
│
├── WaitListScheduler          (Cada 15 min)
├── AutoClosureScheduler       (Diario 23:00)
├── InasistenciaScheduler      (Múltiples horarios)
├── ReminderScheduler          (Cada minuto)
└── TimeZoneScheduler          (Cada 6 horas)
```

## ⏰ Schedulers Implementados

### 1. WaitListScheduler
**Archivo**: `src/infrastructure/scheduling/WaitListScheduler.ts`

**Función**: Mueve automáticamente citas a lista de espera cuando los pacientes no llegan a tiempo.

**Frecuencia**: Cada 15 minutos

**Proceso**:
1. Busca todas las citas "Agendadas" o "Confirmadas"
2. Verifica si pasaron más de 15 minutos desde la hora programada
3. Cambia el estado a "En_Lista_Espera"
4. Notifica al paciente y contact center
5. Agrega a lista de remarketing

**Configuración**:
```typescript
waitList: {
  minutosTolerancia: 15,
  intervaloVerificacion: '*/15 * * * *',
  notificarPaciente: true,
  notificarContactCenter: true
}
```

### 2. AutoClosureScheduler
**Archivo**: `src/infrastructure/scheduling/AutoClosureScheduler.ts`

**Función**: Cierra automáticamente las listas de espera al final del día y convierte las citas a inasistencias.

**Frecuencia**: Diario a las 23:00 (configurable)

**Proceso**:
1. Obtiene todas las citas en "En_Lista_Espera" del día
2. Convierte cada una a estado "Inasistencia"
3. Crea registro en tabla de inasistencias
4. Inicia protocolo de 7 días
5. Genera reporte diario
6. Notifica a gerencia

**Configuración**:
```typescript
autoClosure: {
  horaCierre: '23:00',
  generarReporte: true,
  notificarGerencia: true,
  iniciarProtocolo7Dias: true
}
```

### 3. InasistenciaScheduler
**Archivo**: `src/infrastructure/scheduling/InasistenciaScheduler.ts`

**Función**: Ejecuta el protocolo de remarketing de 7 días para pacientes que no asistieron.

**Frecuencia**: Múltiple
- **Protocolo 7 días**: Diario 00:00
- **Verificación próximas**: Cada 6 horas
- **Remarketing auto**: Diario 09:00

**Proceso**:
1. Identifica inasistencias según días transcurridos
2. Ejecuta acciones del protocolo (mensajes, recordatorios)
3. Marca pacientes como "perdidos" después de 7 días sin respuesta
4. Genera alertas para casos próximos a vencer

### 4. ReminderScheduler
**Archivo**: `src/infrastructure/scheduling/ReminderScheduler.ts`

**Función**: Envía recordatorios automáticos de citas programadas.

**Frecuencia**: Verificación cada minuto

**Proceso**:
1. Confirmación inmediata al agendar
2. Recordatorio 24 horas antes (10:00 AM)
3. Recordatorio día de la cita (2 horas antes)
4. Verificación 15 min después de hora programada

**Configuración**:
```typescript
// Se programa automáticamente al crear una cita
await reminderScheduler.programarRecordatoriosCita(cita, paciente, datos);
```

### 5. TimeZoneScheduler
**Archivo**: `src/infrastructure/scheduling/TimeZoneScheduler.ts`

**Función**: Gestiona zonas horarias de sucursales y sincroniza horarios.

**Frecuencia**: 
- **Verificación**: Cada 6 horas
- **Sincronización**: Diario 00:00

**Proceso**:
1. Verifica zonas horarias de todas las sucursales
2. Detecta horarios de verano (DST)
3. Valida horarios de operación
4. Sincroniza horarios entre sucursales
5. Notifica problemas detectados

**Configuración**:
```typescript
timeZone: {
  verificacionInterval: '0 */6 * * *',
  autoAjustarDST: true,
  notificarCambios: true,
  sincronizarAutomaticamente: true
}
```

## 🔧 Configuración

### Configuración Global

Edita la configuración en `src/index.ts`:

```typescript
const schedulerManager = crearSchedulerManager(
  citaRepo,
  inasistenciaRepo,
  sucursalRepo,
  remarketingService,
  {
    waitList: { /* config */ },
    autoClosure: { /* config */ },
    timeZone: { /* config */ },
    habilitarTodos: true,
    modoMantenimiento: false
  }
);
```

### Variables de Entorno

```bash
# .env
DEFAULT_TIMEZONE=America/Mexico_City
SCHEDULER_ENABLED=true
WAIT_LIST_TOLERANCE_MINUTES=15
AUTO_CLOSURE_TIME=23:00
```

## 🚀 Uso y Ejecución

### Iniciar el Sistema

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### Ejecuciones Manuales

```typescript
// Ejecutar verificación manual de lista de espera
await schedulerManager.ejecutarVerificacionManual('waitlist');

// Ejecutar cierre manual
await schedulerManager.ejecutarVerificacionManual('autoclosure');

// Ejecutar verificación de zonas horarias
await schedulerManager.ejecutarVerificacionManual('timezone');
```

### Modo Mantenimiento

```typescript
// Activar modo mantenimiento (detiene todos los schedulers)
schedulerManager.setModoMantenimiento(true);

// Desactivar modo mantenimiento (reinicia schedulers)
schedulerManager.setModoMantenimiento(false);
```

### Reiniciar Schedulers

```typescript
// Reiniciar todos los schedulers
await schedulerManager.reiniciar();

// Detener todos
schedulerManager.stop();

// Iniciar todos
schedulerManager.start();
```

## 📊 Monitoreo y Estadísticas

### Obtener Estado

```typescript
// Estado de todos los schedulers
const estados = schedulerManager.getEstado();

// Estado de un scheduler específico
const estado = schedulerManager.getEstadoScheduler('WaitList');

// Estadísticas generales
const stats = schedulerManager.getEstadisticas();
// {
//   totalSchedulers: 5,
//   activos: 5,
//   detenidos: 0,
//   conErrores: 0,
//   totalEjecuciones: 150,
//   totalErrores: 0
// }
```

### Verificar Salud del Sistema

```typescript
const salud = await schedulerManager.verificarSalud();
// {
//   estado: 'healthy', // 'healthy' | 'degraded' | 'unhealthy'
//   schedulers: [
//     { nombre: 'WaitList', estado: 'running', mensaje: 'OK' },
//     { nombre: 'AutoClosure', estado: 'running', mensaje: 'OK' },
//     ...
//   ]
// }
```

### Imprimir Resumen

```typescript
// Imprime resumen detallado en consola
schedulerManager.imprimirResumen();
```

## 🔍 Endpoints de Administración

### GET /api/schedulers/status
Obtiene el estado de todos los schedulers

**Respuesta**:
```json
{
  "success": true,
  "schedulers": [
    {
      "nombre": "WaitList",
      "activo": true,
      "ultimaEjecucion": "2026-02-03T10:00:00Z",
      "totalEjecuciones": 50,
      "totalErrores": 0,
      "estado": "running"
    }
  ]
}
```

### GET /api/schedulers/health
Verifica la salud del sistema de schedulers

**Respuesta**:
```json
{
  "success": true,
  "estado": "healthy",
  "schedulers": [...]
}
```

### POST /api/schedulers/:name/execute
Ejecuta manualmente un scheduler

**Parámetros**: `name` = `waitlist` | `autoclosure` | `timezone`

**Respuesta**:
```json
{
  "success": true,
  "message": "Verificación ejecutada correctamente"
}
```

### POST /api/schedulers/maintenance
Activa/desactiva modo mantenimiento

**Body**:
```json
{
  "enable": true
}
```

## 📝 Logs y Debugging

### Formato de Logs

Los schedulers generan logs estructurados:

```
[2026-02-03T10:00:00Z] 🔄 Verificando citas para lista de espera...
   📋 15 citas para verificar
   ⚠️  Cita cita-001 → Lista de Espera (20 min retraso)
   ✓ Paciente notificado
   ✅ Verificación completada: 3 movidas, 12 sin cambios
```

### Niveles de Log

- ✅ Éxito
- ⚠️  Advertencia
- ❌ Error
- 🔄 Proceso en curso
- 📋 Información
- 📊 Estadísticas

## 🛠️ Troubleshooting

### El scheduler no se ejecuta

1. Verificar que el servidor esté corriendo
2. Revisar logs para errores
3. Verificar configuración de cron expressions
4. Verificar que no esté en modo mantenimiento

### Errores en ejecución

1. Revisar logs detallados
2. Verificar conexión a base de datos
3. Verificar permisos y credenciales
4. Ejecutar verificación manual para debugging

### Performance

- Los schedulers están optimizados para ejecutarse en segundo plano
- No bloquean el servidor principal
- Usan procesamiento asíncrono
- Limpian datos antiguos automáticamente

## 📚 Recursos Adicionales

- [Documentación de node-cron](https://github.com/node-cron/node-cron)
- [Expresiones Cron](https://crontab.guru/)
- [date-fns-tz](https://date-fns.org/v2.29.3/docs/Time-Zones)

## 🚧 Próximas Mejoras

- [ ] Dashboard web para monitoreo
- [ ] Alertas por email/Slack
- [ ] Métricas con Prometheus
- [ ] Persistencia de estado en Redis
- [ ] Logs centralizados (Winston/Morgan)
- [ ] Tests automatizados
- [ ] Documentación OpenAPI

---

**Versión**: 1.0.0  
**Última actualización**: 3 de febrero de 2026
