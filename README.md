# 🏥 Sistema CRM para Red de Clínicas RCA

Sistema de gestión integral para clínicas médicas con integración de WhatsApp Business, Facebook e Instagram, desarrollado con TypeScript y Node.js siguiendo principios de Clean Architecture.

## � Estado del Proyecto

✅ **Caso de Uso Crítico Implementado**: [ReagendarPromocion](docs/use-cases/REAGENDAR_PROMOCION.md) - Regla de Oro del sistema

### Última Actualización: 3 de febrero de 2026

**Implementaciones Completadas**:
- ✅ Entidades core (Paciente, Cita, Abono, Usuario, Sucursal)
- ✅ Caso de uso: **ReagendarPromocion** con Regla de Oro
- ✅ Caso de uso: MarcarLlegada
- ✅ Controladores API con validaciones
- ✅ Tests unitarios para casos críticos
- ✅ Documentación técnica completa

**En Progreso**:
- ⏳ Conexión con PostgreSQL
- ⏳ Integración WhatsApp Business API
- ⏳ Frontend para Contact Center (Keila)
- ⏳ Sistema de notificaciones automáticas

---

## 📋 Descripción

Sistema diseñado específicamente para gestionar:
- **Contact Center**: Gestión de citas y comunicación con pacientes (Keila)
- **Finanzas**: Control de abonos, cortes de caja y reportes (Antonio, Yaretzi)
- **Recepción**: Registro de llegadas y atención en clínicas
- **Red de Clínicas**: Soporte para múltiples sucursales con gestión centralizada

## 🎯 Características Principales

### ⭐ Regla de Oro del Sistema

**Reagendación de Promociones** - La funcionalidad más crítica:

| Reagendación | Estado Promoción | Precio |
|--------------|------------------|--------|
| 1ra vez      | ✅ Se mantiene   | Promocional ($250) |
| 2da vez      | ❌ Se pierde     | Regular ($500) |
| 3ra+ vez     | ❌ Sin promoción | Regular ($500) |

> Esta regla protege los ingresos de la clínica y evita abuso de promociones.  
> Ver documentación completa: [REAGENDAR_PROMOCION.md](docs/use-cases/REAGENDAR_PROMOCION.md)

### ✅ Validaciones de Negocio Críticas
- **No_Afiliacion obligatorio**: TypeScript valida que nunca esté vacío (requisito para reportes)
- **Reagendación de promociones**: Límite automático con cambio de precio
- **Control de abonos**: Validación de montos y métodos de pago
- **Cortes de caja precisos**: Cálculos verificados por método de pago
- **Zonas horarias**: Soporte multi-sucursal con diferentes horarios

### 📱 Integraciones
- WhatsApp Business API (Meta)
- Facebook Messenger
- Instagram Direct Messages
- Generación de PDFs para recibos y reportes

### 👥 Roles de Usuario
- **Admin**: Acceso completo al sistema
- **Finanzas** (Antonio/Yaretzi): Reportes y cortes de caja
- **Contact Center** (Keila): Gestión de citas y mensajería
- **Recepción**: Registro de llegadas y pagos
- **Médico**: Consulta de historial y citas asignadas

## 🏗️ Arquitectura

```
src/
├── api/                    # Controladores de rutas (WhatsApp, FB, Web)
├── core/                   # Lógica de negocio
│   ├── entities/          # Definiciones de datos (Paciente, Cita, etc.)
│   └── use-cases/         # Casos de uso (ReagendarPromocion, MarcarLlegada)
├── infrastructure/         # Conexiones externas
│   ├── database/          # PostgreSQL
│   ├── matrix/            # Meta Business API
│   └── auth/              # Autenticación y autorización
├── shared/                # Utilidades compartidas
└── web/                   # Frontend (componentes, vistas, estado)
```

### 🎨 Principios de Clean Architecture
- **Separación de responsabilidades**: Lógica de negocio independiente de infraestructura
- **Testeable**: Core sin dependencias externas
- **Escalable**: Fácil agregar nuevas sucursales o funcionalidades
- **Mantenible**: Código organizado y tipado

## 🚀 Instalación

### Requisitos Previos
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd CRM_RCA
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb rca_crm

# Ejecutar migraciones (próximamente)
npm run migrate
```

5. **Iniciar en modo desarrollo**
```bash
npm run dev
```

## 📦 Scripts Disponibles

```bash
npm run dev        # Inicia servidor en modo desarrollo con hot-reload
npm run build      # Compila TypeScript a JavaScript
npm start          # Inicia servidor en producción
npm test           # Ejecuta tests con Jest
npm test:watch     # Tests en modo watch
npm run lint       # Valida código con ESLint
npm run format     # Formatea código con Prettier
```

## 🗄️ Entidades Principales

### Paciente
- Información personal y contacto
- **No_Afiliacion** (obligatorio)
- Tipo de afiliación (IMSS, ISSSTE, Particular, Seguro)
- Origen del lead (WhatsApp, Facebook, Instagram, etc.)

### Cita
- Información de agendamiento
- Control de estados (Agendada, Confirmada, Atendida, etc.)
- Promociones con límite de reagendación
- Registro de llegadas y tiempos

### Abono
- Registro de pagos
- Múltiples métodos (Efectivo, Tarjeta, Transferencia, Mixto)
- Generación automática de folios
- Control de recibos

### Usuario
- Roles y permisos
- Asignación por sucursal
- Control de accesos

## 💼 Casos de Uso Implementados

### 1. ReagendarPromocion
```typescript
// Las promociones solo pueden reagendarse UNA vez
const resultado = await reagendarPromocionUseCase.ejecutar({
  citaId: 'cit-123',
  nuevaFecha: new Date('2026-02-15'),
  nuevaHora: '14:00',
  usuarioId: 'keila'
});
```

### 2. MarcarLlegada
```typescript
// Registra cuando un paciente llega a recepción
const cita = await marcarLlegadaUseCase.ejecutar({
  citaId: 'cit-123',
  usuarioId: 'recepcion-01',
  sucursalId: 'suc-001'
});
```

### 3. CalcularCorte
```typescript
// Genera corte de caja por sucursal y fecha
const corte = await calcularCorteUseCase.ejecutar({
  sucursalId: 'suc-001',
  fecha: new Date(),
  usuarioId: 'antonio'
});
```

### 4. CrearCita
```typescript
// Valida No_Afiliacion antes de crear cita
const cita = await crearCitaUseCase.ejecutar({
  pacienteId: 'pac-123',
  sucursalId: 'suc-001',
  fechaCita: new Date('2026-02-10'),
  horaCita: '10:00',
  tipoConsulta: 'Primera_Vez',
  especialidad: 'Medicina General',
  esPromocion: true,
  creadoPor: 'keila'
});
```

## 🔐 Seguridad

- Passwords hasheados con bcrypt
- Autenticación JWT
- Control de permisos por rol
- Validación de acceso por sucursal
- Variables sensibles en .env

## 🌍 Zonas Horarias

El sistema maneja correctamente las zonas horarias de cada sucursal:
- Configuración por sucursal
- Manejo con `date-fns-tz`
- Default: America/Mexico_City

## 📊 Próximas Implementaciones

- [ ] Integración completa con Meta Business API
- [ ] Generación de PDFs con PDFKit
- [ ] Migraciones de base de datos
- [ ] Tests unitarios y de integración
- [ ] Dashboard web con Next.js
- [ ] Reportes avanzados
- [ ] Sistema de notificaciones push
- [ ] Backup automático

## 👨‍💻 Desarrollo

### Estructura de Commits
```bash
git commit -m "feat: agregar nueva funcionalidad"
git commit -m "fix: corregir bug en cortes"
git commit -m "docs: actualizar README"
```

### Testing
```bash
# Ejecutar todos los tests
npm test

# Ver cobertura
npm test -- --coverage

# Tests específicos
npm test Paciente
```

## 📞 Soporte

Para preguntas o soporte:
- Email: soporte@marketingpro.com
- Documentación técnica: [docs/](./docs/)

## 📄 Licencia

ISC © MarketingPro

---

**Desarrollado con ❤️ usando TypeScript + Node.js para la Red de Clínicas RCA**
