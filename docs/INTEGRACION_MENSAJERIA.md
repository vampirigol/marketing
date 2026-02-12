# 📋 Integración Completa de Mensajería Avanzada

## ✅ Implementación Completada

### 1. **Backend**

#### Migraciones de Base de Datos
- ✅ **Migración 019**: Archivos adjuntos en mensajes
  - Campos: `archivo_url`, `archivo_nombre`, `archivo_tipo`, `archivo_tamano`, `audio_duracion`
  - Estados de entrega: enviando, enviado, entregado, leído, fallido

#### Servicios de Upload
- ✅ `FileUploadService.ts`: Gestión de uploads con multer y sharp
  - Procesamiento automático de imágenes (redimensión)
  - Organización por tipo: images/, videos/, audios/, documents/
  - Validación de tipos y tamaños
  - Límite: 10MB por archivo

#### Socket.io
- ✅ `SocketService.ts`: WebSocket con Socket.io
  - Autenticación con JWT
  - Salas personalizadas por usuario y conversación
  - Eventos: `mensaje:nuevo`, `conversacion:actualizada`, `conversacion:escritura`, `mensaje:leido`
  - Tracking de usuarios conectados

#### API Routes
- ✅ `/api/upload/mensaje` - Upload individual
- ✅ `/api/upload/multiple` - Upload múltiple (hasta 5)
- ✅ `/api/upload/avatar` - Upload de avatar
- ✅ `/uploads/*` - Servidor estático para archivos

#### Matrix Controller
- ✅ Integración completa con Socket.io
- ✅ Emisión de eventos en tiempo real
- ✅ Soporte para archivos adjuntos en mensajes

### 2. **Frontend**

#### Servicios
- ✅ `upload.service.ts`: Cliente para uploads
  - Validación de archivos
  - Upload con progress
  - Manejo de errores

- ✅ `matrix-websocket.service.ts`: Cliente WebSocket
  - Conexión automática
  - Sistema de eventos pub/sub
  - Reconexión automática

- ✅ `matrix.service.ts`: Cliente REST API
  - Métodos completos para conversaciones
  - Gestión de prioridad y etiquetas
  - Escalamiento y archivado

#### Componentes

**ConversationHeader.tsx** ✅
- UI para cambiar prioridad (4 niveles)
- UI para agregar/quitar etiquetas
- Sugerencias de etiquetas
- Botón de escalamiento
- Botón de archivar

**MessageInput.tsx** ✅
- Adjuntar archivos (📎)
- Grabar audio (🎤)
- Respuestas rápidas (⚡)
- Preview de archivos
- Validación automática
- Upload real al servidor
- Loading states

**MessageBubble.tsx** ✅
- Renderizado de imágenes
- Reproductor de audio
- Descarga de archivos
- Reproductor de video
- Estados de entrega (✓, ✓✓, ✓✓ azul)

**PlantillasRespuesta.tsx** ✅
- Modal de respuestas rápidas
- Búsqueda de plantillas
- Crear nuevas plantillas
- Contador de uso

### 3. **Configuración del Servidor**

```typescript
// src/index.ts - ACTUALIZADO
- Servidor HTTP con Socket.io
- Middleware de archivos estáticos (/uploads)
- Inicialización de SocketService
- Health check con estado de WebSocket
```

### 4. **Estructura de Archivos**

```
uploads/
├── images/      # Imágenes (procesadas)
├── videos/      # Videos
├── audios/      # Mensajes de voz
└── documents/   # PDFs, Word, Excel
```

## 🚀 Cómo Usar

### En la Página de Matrix

```typescript
import { useState, useEffect } from "react";
import ConversationHeader from "@/components/matrix/ConversationHeader";
import MessageInput from "@/components/matrix/MessageInput";
import MessageBubble from "@/components/matrix/MessageBubble";
import PlantillasRespuesta from "@/components/matrix/PlantillasRespuesta";
import MatrixWebSocketService from "@/lib/matrix-websocket.service";
import { matrixService } from "@/lib/matrix.service";

export default function MatrixPage() {
  const [conversacionActual, setConversacionActual] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false);
  const token = "..."; // Token de autenticación

  useEffect(() => {
    // Conectar WebSocket
    MatrixWebSocketService.connect(token);

    // Escuchar nuevos mensajes
    MatrixWebSocketService.on("mensaje:nuevo", (data) => {
      if (data.conversacionId === conversacionActual?.id) {
        setMensajes(prev => [...prev, data.mensaje]);
      }
    });

    return () => {
      MatrixWebSocketService.disconnect();
    };
  }, [token, conversacionActual]);

  const handleEnviarMensaje = async (mensaje) => {
    await matrixService.enviarMensaje(
      token,
      conversacionActual.id,
      mensaje
    );
  };

  const handleCambiarPrioridad = async (prioridad) => {
    await matrixService.cambiarPrioridad(
      token,
      conversacionActual.id,
      prioridad
    );
  };

  const handleAgregarEtiqueta = async (etiqueta) => {
    await matrixService.agregarEtiqueta(
      token,
      conversacionActual.id,
      etiqueta
    );
  };

  return (
    <div>
      {conversacionActual && (
        <>
          <ConversationHeader
            conversacion={conversacionActual}
            onBack={() => setConversacionActual(null)}
            onCambiarPrioridad={handleCambiarPrioridad}
            onAgregarEtiqueta={handleAgregarEtiqueta}
            onQuitarEtiqueta={(etiqueta) =>
              matrixService.quitarEtiqueta(token, conversacionActual.id, etiqueta)
            }
            onEscalar={() =>
              matrixService.escalarARecepcion(token, conversacionActual.id)
            }
            onArchivar={() =>
              matrixService.archivarConversacion(token, conversacionActual.id)
            }
          />

          <div className="flex-1 overflow-y-auto p-4">
            {mensajes.map((mensaje) => (
              <MessageBubble key={mensaje.id} mensaje={mensaje} />
            ))}
          </div>

          <MessageInput
            onEnviarMensaje={handleEnviarMensaje}
            onAbrirPlantillas={() => setMostrarPlantillas(true)}
            token={token}
          />

          {mostrarPlantillas && (
            <PlantillasRespuesta
              token={token}
              onSeleccionar={(contenido) => {
                handleEnviarMensaje({ contenido, tipoMensaje: "texto" });
              }}
              onCerrar={() => setMostrarPlantillas(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
```

## 🧪 Testing

### Pruebas Manuales

1. **Upload de Archivos**
   ```bash
   # Subir una imagen
   curl -X POST http://localhost:3001/api/upload/mensaje \
     -H "Authorization: Bearer TOKEN" \
     -F "archivo=@test.jpg"
   ```

2. **WebSocket**
   ```javascript
   // En el navegador
   const socket = io("http://localhost:3001", {
     auth: { token: "TOKEN" }
   });
   
   socket.on("mensaje:nuevo", (data) => {
     console.log("Nuevo mensaje:", data);
   });
   ```

3. **Enviar Mensaje con Archivo**
   ```bash
   curl -X POST http://localhost:3001/api/matrix/conversaciones/ID/mensajes \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "contenido": "Te envío una imagen",
       "tipo": "imagen",
       "archivoUrl": "http://localhost:3001/uploads/images/archivo.jpg",
       "archivoNombre": "test.jpg",
       "archivoTipo": "image/jpeg",
       "archivoTamano": 150000
     }'
   ```

## 📊 Endpoints Disponibles

### Upload
- `POST /api/upload/mensaje` - Subir archivo para mensaje
- `POST /api/upload/multiple` - Subir múltiples archivos
- `POST /api/upload/avatar` - Subir avatar
- `GET /uploads/:type/:filename` - Obtener archivo

### Matrix
- `GET /api/matrix/conversaciones` - Listar conversaciones
- `POST /api/matrix/conversaciones/:id/mensajes` - Enviar mensaje
- `PUT /api/matrix/conversaciones/:id/prioridad` - Cambiar prioridad
- `POST /api/matrix/conversaciones/:id/etiquetas` - Agregar etiqueta
- `DELETE /api/matrix/conversaciones/:id/etiquetas/:etiqueta` - Quitar etiqueta
- `PUT /api/matrix/conversaciones/:id/asignar` - Escalar/Asignar
- `PUT /api/matrix/conversaciones/:id/estado` - Cambiar estado
- `GET /api/matrix/plantillas` - Obtener plantillas
- `POST /api/matrix/plantillas` - Crear plantilla

### WebSocket Events
- `mensaje:nuevo` - Nuevo mensaje recibido
- `conversacion:actualizada` - Conversación modificada
- `conversacion:escritura` - Usuario escribiendo
- `mensaje:leido` - Mensaje leído
- `notificacion:nueva` - Nueva notificación

## ⚠️ Notas Importantes

1. **Variables de Entorno**
   ```env
   UPLOAD_DIR=./uploads
   BASE_URL=http://localhost:3001
   JWT_SECRET=tu_secret_jwt
   FRONTEND_URL=http://localhost:3000
   ```

2. **Límites**
   - Tamaño máximo: 10MB por archivo
   - Archivos múltiples: máximo 5
   - Tipos permitidos: imágenes, videos, audio, PDF, Office

3. **Seguridad**
   - Todos los endpoints requieren autenticación (JWT)
   - Validación de tipos de archivo
   - Procesamiento de imágenes (redimensión automática)

## 🎉 Estado Final

✅ Backend completo con Socket.io  
✅ Upload real de archivos  
✅ Componentes UI completos  
✅ WebSocket funcionando  
✅ API REST completa  
✅ Mensajes de voz  
✅ Plantillas de respuesta  
✅ Gestión de prioridad y etiquetas  
✅ Sistema de escalamiento  

**TODO la funcionalidad de mensajería avanzada está LISTA** 🚀
