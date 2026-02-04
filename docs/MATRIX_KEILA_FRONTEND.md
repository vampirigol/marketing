# 💬 Matrix Keila - Centro de Mando para Contact Center

## 📋 Descripción General

Matrix Keila es el centro de mando unificado para el Contact Center de la Red de Clínicas Adventistas (RCA). Inspirado en **Bitrix24 Open Channels**, unifica todos los canales de comunicación (WhatsApp, Facebook Messenger, Instagram Direct) en una sola bandeja de entrada.

## 🏗️ Arquitectura del Frontend

### Layout Principal (3 Columnas)

```
┌──────────────────────────────────────────────────────────────────┐
│  MATRIX KEILA - Contact Center                                   │
├─────────────┬──────────────────────────┬──────────────────────────┤
│   INBOX     │   CONVERSACIÓN ACTIVA    │   PERFIL DEL PACIENTE    │
│  (300px)    │      (Flex-grow)         │       (360px)            │
├─────────────┼──────────────────────────┼──────────────────────────┤
│             │                          │                          │
│ 🟢 Activas  │  María González          │  📋 DATOS BÁSICOS        │
│ • WhatsApp  │  WhatsApp • Hace 2min    │  ┌──────────────────┐    │
│   [23]      │  ──────────────────────  │  │ María González   │    │
│ • Facebook  │                          │  │ 📞 555-1234      │    │
│   [8]       │  [👤 María] Hola...      │  │ 📧 maria@...     │    │
│ • Instagram │            10:23 AM      │  │ 🎂 32 años       │    │
│   [5]       │                          │  └──────────────────┘    │
│             │  [👨 Keila] ¡Claro!      │                          │
│ ⏰ Pendiente│            10:24 AM      │  📊 HISTORIAL            │
│   [12]      │                          │  • 2 citas previas       │
│             │  ┌─────────────────────┐ │  • Última: 15-Ene-26     │
│ ✅ Cerradas │  │ Escribe mensaje...  │ │                          │
│   [145]     │  │ [📎] [😊] [Enviar]│ │  ⚡ ACCIONES RÁPIDAS      │
│             │  └─────────────────────┘ │  [📅 Agendar Cita]       │
│             │                          │  [📝 Ver Historial]      │
└─────────────┴──────────────────────────┴──────────────────────────┘
```

## 📦 Componentes Creados

### 1. `/frontend/types/matrix.ts`
Define todas las interfaces TypeScript para el sistema Matrix:

```typescript
export interface Conversacion {
  id: string;
  canal: 'whatsapp' | 'facebook' | 'instagram';
  nombreContacto: string;
  telefono?: string;
  ultimoMensaje: string;
  fechaUltimoMensaje: Date;
  estado: 'activa' | 'pendiente' | 'cerrada';
  mensajesNoLeidos: number;
  etiquetas: string[];
  pacienteId?: string;
  enLinea: boolean;
  mensajes?: Mensaje[];
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'audio' | 'documento';
  esDeKeila: boolean;
  estado: 'enviado' | 'entregado' | 'leido';
  fechaHora: Date;
}
```

### 2. `/frontend/components/matrix/MatrixInbox.tsx`
Panel izquierdo con lista de conversaciones.

**Características:**
- Búsqueda en tiempo real
- Filtros por estado (Activas, Pendientes, Cerradas)
- Agrupación automática por estado
- Indicadores visuales:
  - 🟢 Punto verde para usuarios en línea
  - Badge con contador de mensajes no leídos
  - Border izquierdo azul para conversaciones activas
- Iconos de canal: [WA] [FB] [IG]
- Tiempo relativo ("2min", "1h", "3d")
- Estadísticas rápidas en footer

### 3. `/frontend/components/matrix/ConversationView.tsx`
Panel central con la conversación activa.

**Características:**
- Header con información del contacto y estado en línea
- Burbujas de chat estilo WhatsApp
- Mensajes del paciente (izquierda, fondo gris)
- Mensajes de Keila (derecha, fondo azul)
- Indicadores de estado: ✓ (enviado) ✓✓ (leído)
- Input de mensaje con:
  - Textarea autoexpandible
  - Botones: 📎 Adjuntar, 😊 Emoji, 🎤 Audio
  - Enter para enviar, Shift+Enter para nueva línea
- Indicador de "escribiendo..." animado
- Auto-scroll al último mensaje

### 4. `/frontend/components/matrix/PatientProfile.tsx`
Panel derecho con perfil del paciente vinculado.

**Características:**
- Datos básicos del paciente
- Avatar con iniciales
- Acciones rápidas:
  - 📅 Agendar Cita
  - 📝 Ver Historial Completo
  - 💰 Registrar Pago
- Historial de citas (últimas 3)
- Etiquetas: 🎁 Promoción, ✅ Recurrente, ⭐ VIP
- Información médica:
  - ⚠️ Alergias (con badge rojo)
  - Padecimientos crónicos
- Sistema de notas rápidas

### 5. `/frontend/app/matrix/page.tsx`
Página principal que integra los 3 componentes.

**Características:**
- Layout responsivo de 3 columnas
- Header con estadísticas en tiempo real:
  - Activas: 3
  - Pendientes: 2
  - Sin Leer: 5
- Modo demo con conversaciones simuladas
- Gestión de estado local con React hooks
- Simulación de envío de mensajes con cambio de estado (enviado → entregado → leído)
- Advertencia visible de modo demo

### 6. `/frontend/lib/matrix.service.ts`
Servicio completo de API para Matrix.

**Funciones implementadas:**
- `obtenerConversaciones(filtros?)` - Lista con filtros opcionales
- `obtenerConversacion(id)` - Una conversación con mensajes
- `enviarMensaje(conversacionId, contenido)` - Enviar mensaje
- `marcarComoLeido(conversacionId)` - Marcar como leído
- `cambiarEstadoConversacion(id, estado)` - Cambiar estado
- `agregarEtiqueta(id, etiqueta)` - Agregar etiqueta
- `vincularPaciente(conversacionId, pacienteId)` - Vincular paciente
- `buscarConversaciones(query)` - Búsqueda de texto
- `obtenerEstadisticasMatrix()` - Estadísticas del contact center
- `cerrarConversacion(id)` / `reabrirConversacion(id)` - Gestión de estado

## 🎨 Sistema de Diseño

### Colores por Canal
```css
/* WhatsApp */
--whatsapp-green: #25D366;

/* Facebook */
--facebook-blue: #1877F2;

/* Instagram */
--instagram-gradient: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF);
```

### Estados de Conversación
- **Activa**: 🟢 Border verde, fondo azul claro si no leída
- **Pendiente**: ⏰ Border naranja
- **Cerrada**: ✅ Fondo gris claro, opacity 70%

### Indicadores de Mensaje (Keila)
- ✓ Gris: Enviado
- ✓✓ Gris: Entregado
- ✓✓ Azul: Leído por el paciente

## 🔌 Integración con Backend

### Endpoints Necesarios (TODO)

```typescript
// Conversaciones
GET    /api/matrix/conversaciones
GET    /api/matrix/conversaciones/:id
PUT    /api/matrix/conversaciones/:id/estado
PUT    /api/matrix/conversaciones/:id/leer
POST   /api/matrix/conversaciones/:id/cerrar
PUT    /api/matrix/conversaciones/:id/reabrir

// Mensajes
POST   /api/matrix/conversaciones/:id/mensajes
GET    /api/matrix/conversaciones/:id/mensajes

// Etiquetas
POST   /api/matrix/conversaciones/:id/etiquetas
DELETE /api/matrix/conversaciones/:id/etiquetas/:etiqueta

// Pacientes
PUT    /api/matrix/conversaciones/:id/paciente

// Estadísticas
GET    /api/matrix/estadisticas
GET    /api/matrix/conversaciones/sin-leer/count

// Búsqueda
GET    /api/matrix/conversaciones/buscar?q=...
```

## 🚀 Uso

### Iniciar el Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### Navegar a Matrix

Opciones:
1. Click en "💬 Matrix Keila" en el sidebar
2. Navegar directamente a: `http://localhost:3000/matrix`

### Modo Demo Actual

El sistema actualmente muestra **5 conversaciones simuladas**:

1. **María González** (WhatsApp) - Activa, 1 mensaje no leído
   - Interesada en promoción
   - Paciente ID: PAC-001

2. **Pedro López** (WhatsApp) - Activa, 2 mensajes no leídos
   - Buscando horario para mañana
   - Paciente ID: PAC-002

3. **Ana Martínez** (Instagram) - Activa, conversación en progreso
   - Preguntando sobre promoción
   - Paciente ID: PAC-003

4. **Juan Rodríguez** (Facebook) - Pendiente
   - Consultó precio, esperando respuesta

5. **Laura Fernández** (WhatsApp) - Cerrada
   - Cita confirmada exitosamente
   - Paciente ID: PAC-004

## 📱 Funcionalidades Implementadas

### ✅ Completado

- [x] Layout de 3 columnas responsivo
- [x] Lista de conversaciones con filtros
- [x] Búsqueda en tiempo real
- [x] Vista de conversación con burbujas de chat
- [x] Envío de mensajes con simulación de estados
- [x] Perfil de paciente con datos básicos
- [x] Historial de citas
- [x] Sistema de etiquetas
- [x] Indicadores visuales (en línea, no leídos)
- [x] Estadísticas en header
- [x] Servicio completo de API
- [x] Integración con tipos TypeScript
- [x] Sistema de notas rápidas
- [x] Acciones rápidas (agendar, historial, pago)
- [x] Animaciones y transiciones

### ⏳ Pendiente

- [ ] Conectar con WhatsApp Business API real
- [ ] Conectar con Facebook Messenger API
- [ ] Conectar con Instagram Direct API
- [ ] WebSocket para mensajes en tiempo real
- [ ] Notificaciones push
- [ ] Sistema de plantillas de respuesta rápida
- [ ] Adjuntar archivos (imágenes, documentos)
- [ ] Mensajes de audio
- [ ] Historial completo de conversaciones
- [ ] Exportar conversaciones
- [ ] Asignación de conversaciones a diferentes agentes
- [ ] Métricas avanzadas (tiempo de respuesta, satisfacción)
- [ ] Bot de respuestas automáticas
- [ ] Modo oscuro

## 🎯 Reglas de Negocio

### Estados de Conversación

1. **Activa**: Conversación en curso con intercambio reciente
2. **Pendiente**: Esperando respuesta del paciente (>15 min sin respuesta)
3. **Cerrada**: Conversación finalizada (cita agendada o cancelada)

### Etiquetas Automáticas

- 🎁 **Promoción**: Detectar palabras clave (promo, descuento, oferta)
- 🆕 **Nueva**: Primera conversación del contacto
- ⚠️ **Urgente**: Palabras como "urgente", "hoy", "dolor"
- ✅ **Confirmada**: Cita agendada exitosamente
- 🔁 **Reagendar**: Paciente quiere cambiar cita

### Vinculación con Pacientes

- Búsqueda automática por teléfono
- Vinculación manual si no existe
- Creación de nuevo paciente desde conversación
- Sincronización bidireccional con base de datos

## 🔧 Próximos Pasos Técnicos

### 1. Backend - Matrix Controller

Crear `/src/api/controllers/MatrixController.ts`:

```typescript
export class MatrixController {
  async obtenerConversaciones(req, res) {
    // TODO: Integrar con WhatsApp Business API
    // TODO: Integrar con Facebook Graph API
    // TODO: Integrar con Instagram Graph API
  }
  
  async enviarMensaje(req, res) {
    const { conversacionId, contenido } = req.body;
    // TODO: Detectar canal y enviar por API correspondiente
  }
}
```

### 2. WebSocket para Tiempo Real

```typescript
// Socket.io para mensajes en tiempo real
io.on('connection', (socket) => {
  socket.on('mensaje:nuevo', (data) => {
    // Broadcast a todos los clientes de Keila
    io.emit('mensaje:recibido', data);
  });
});
```

### 3. WhatsApp Business API Integration

```typescript
// Ejemplo con Twilio o WhatsApp Cloud API
import { WhatsAppAPI } from 'whatsapp-cloud-api';

const wa = new WhatsAppAPI({
  phoneNumberId: process.env.WA_PHONE_ID,
  token: process.env.WA_TOKEN
});

await wa.sendMessage({
  to: '+525551234567',
  text: 'Hola, tu cita está confirmada...'
});
```

## 📊 Métricas de Éxito

### KPIs del Contact Center

- **Tiempo de primera respuesta**: < 2 minutos
- **Tiempo de resolución**: < 10 minutos
- **Tasa de conversión**: > 60% (lead → cita agendada)
- **Satisfacción del paciente**: > 4.5/5
- **Conversaciones por hora**: 8-12 (por agente)

### Estadísticas Disponibles

```typescript
{
  activas: 23,
  pendientes: 12,
  cerradasHoy: 45,
  tiempoRespuestaPromedio: 3.5, // minutos
  whatsappCount: 28,
  facebookCount: 5,
  instagramCount: 7
}
```

## 💡 Tips para Keila

1. **Responder en < 2 min**: Los leads calientes se pierden rápido
2. **Usar etiquetas**: Organizar conversaciones por prioridad
3. **Vincular pacientes**: Siempre asociar conversación con expediente
4. **Cerrar conversaciones**: Marcar como cerrada al agendar cita
5. **Usar plantillas**: Crear respuestas rápidas para preguntas frecuentes
6. **Revisar pendientes**: Cada hora verificar conversaciones sin respuesta

## 🎓 Capacitación Keila

### Flujo Típico de Conversación

1. **Lead entrante**: Notificación de nuevo mensaje
2. **Saludar**: "¡Hola! Soy Keila del Contact Center RCA"
3. **Identificar necesidad**: ¿Primera vez? ¿Reagendar? ¿Promoción?
4. **Buscar/crear paciente**: Vincular con sistema
5. **Verificar No_Afiliacion**: CRÍTICO antes de agendar
6. **Agendar cita**: Usar botón "Agendar Cita" del perfil
7. **Confirmar**: Enviar resumen (fecha, hora, sucursal, costo)
8. **Cerrar conversación**: Marcar como cerrada
9. **Recordatorio**: Sistema enviará WhatsApp 24h antes

---

## 📝 Notas de Implementación

- **Fecha de creación**: 3 de febrero de 2026
- **Versión**: 1.0.0
- **Estado**: MVP completo con datos simulados
- **Próxima fase**: Integración con APIs reales de WhatsApp, Facebook e Instagram

**Desarrollado por**: GitHub Copilot  
**Modelo**: Claude Sonnet 4.5  
**Framework**: Next.js 14 + TypeScript + TailwindCSS
