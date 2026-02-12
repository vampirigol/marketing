# 🧪 Pruebas E2E - Sistema de Mensajería Avanzada

## 📋 Checklist de Pruebas

### 1. **Upload de Archivos** ✅

#### Prueba 1.1: Upload de Imagen
```bash
# Preparar archivo de prueba
echo "Test image" > test.jpg

# Subir imagen
curl -X POST http://localhost:3001/api/upload/mensaje \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "archivo=@test.jpg"

# Respuesta esperada:
# {
#   "success": true,
#   "archivo": {
#     "nombre": "test.jpg",
#     "nombreGuardado": "uuid.jpg",
#     "tipo": "image/jpeg",
#     "tamano": 12345,
#     "url": "http://localhost:3001/uploads/images/uuid.jpg"
#   }
# }
```

#### Prueba 1.2: Validación de Tamaño
```bash
# Crear archivo grande (>10MB)
dd if=/dev/zero of=large.bin bs=1M count=11

# Intentar subir (debe fallar)
curl -X POST http://localhost:3001/api/upload/mensaje \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "archivo=@large.bin"

# Respuesta esperada:
# { "error": "File too large" }
```

#### Prueba 1.3: Validación de Tipo
```bash
# Crear archivo no permitido
echo "exec" > test.exe

# Intentar subir (debe fallar)
curl -X POST http://localhost:3001/api/upload/mensaje \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "archivo=@test.exe"

# Respuesta esperada:
# { "error": "Tipo de archivo no permitido..." }
```

### 2. **WebSocket** 🔌

#### Prueba 2.1: Conexión
```javascript
// En el navegador o Node.js
const io = require('socket.io-client');

const socket = io('http://localhost:3001', {
  auth: { token: 'TU_TOKEN' }
});

socket.on('connect', () => {
  console.log('✅ Conectado:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado');
});

// Resultado esperado: Conexión exitosa
```

#### Prueba 2.2: Unirse a Conversación
```javascript
// Unirse a sala
socket.emit('conversacion:unirse', 'CONVERSATION_ID');

// Escuchar nuevos mensajes
socket.on('mensaje:nuevo', (data) => {
  console.log('📩 Nuevo mensaje:', data);
});

// Resultado esperado: Sin errores
```

#### Prueba 2.3: Indicador de Escritura
```javascript
// Enviar indicador de escritura
socket.emit('conversacion:escribiendo', {
  conversacionId: 'CONVERSATION_ID'
});

// En otro cliente, debería recibir:
socket.on('conversacion:escritura', (data) => {
  console.log('✍️ Usuario escribiendo:', data.usuario);
});

// Resultado esperado: Evento recibido en otros clientes
```

### 3. **Envío de Mensajes** 💬

#### Prueba 3.1: Mensaje de Texto
```bash
curl -X POST http://localhost:3001/api/matrix/conversaciones/CONV_ID/mensajes \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contenido": "Hola, este es un mensaje de prueba",
    "tipo": "texto"
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "mensaje": { ... }
# }
```

#### Prueba 3.2: Mensaje con Imagen
```bash
# 1. Subir imagen primero
UPLOAD_RESPONSE=$(curl -X POST http://localhost:3001/api/upload/mensaje \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "archivo=@image.jpg")

# 2. Extraer URL
IMAGE_URL=$(echo $UPLOAD_RESPONSE | jq -r '.archivo.url')

# 3. Enviar mensaje con imagen
curl -X POST http://localhost:3001/api/matrix/conversaciones/CONV_ID/mensajes \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"contenido\": \"Aquí está la imagen\",
    \"tipo\": \"imagen\",
    \"archivoUrl\": \"$IMAGE_URL\",
    \"archivoNombre\": \"image.jpg\",
    \"archivoTipo\": \"image/jpeg\",
    \"archivoTamano\": 150000
  }"

# Resultado esperado: Mensaje enviado y recibido via WebSocket
```

#### Prueba 3.3: Mensaje de Audio
```bash
# Similar a Prueba 3.2, pero con archivo de audio
# El sistema debe detectar tipo "audio" automáticamente
```

### 4. **Gestión de Conversaciones** 📊

#### Prueba 4.1: Cambiar Prioridad
```bash
curl -X PUT http://localhost:3001/api/matrix/conversaciones/CONV_ID/prioridad \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "prioridad": "Urgente" }'

# Respuesta esperada:
# { "success": true, "message": "Prioridad actualizada correctamente" }

# WebSocket debe emitir:
# conversacion:actualizada { conversacionId, cambios: { prioridad: "Urgente" } }
```

#### Prueba 4.2: Agregar Etiqueta
```bash
curl -X POST http://localhost:3001/api/matrix/conversaciones/CONV_ID/etiquetas \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "etiqueta": "Urgente" }'

# Respuesta esperada:
# { "success": true, "message": "Etiqueta agregada correctamente" }
```

#### Prueba 4.3: Quitar Etiqueta
```bash
curl -X DELETE http://localhost:3001/api/matrix/conversaciones/CONV_ID/etiquetas/Urgente \
  -H "Authorization: Bearer TU_TOKEN"

# Respuesta esperada:
# { "success": true, "message": "Etiqueta eliminada correctamente" }
```

#### Prueba 4.4: Escalar a Recepción
```bash
curl -X PUT http://localhost:3001/api/matrix/conversaciones/CONV_ID/asignar \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "usuarioId": "RECEPCION_USER_ID" }'

# Respuesta esperada:
# { "success": true, "message": "Conversación asignada correctamente" }
```

#### Prueba 4.5: Archivar Conversación
```bash
curl -X PUT http://localhost:3001/api/matrix/conversaciones/CONV_ID/estado \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "estado": "Cerrada" }'

# Respuesta esperada:
# { "success": true, "message": "Estado actualizado correctamente" }
```

### 5. **Plantillas de Respuesta** ⚡

#### Prueba 5.1: Obtener Plantillas
```bash
curl -X GET http://localhost:3001/api/matrix/plantillas \
  -H "Authorization: Bearer TU_TOKEN"

# Respuesta esperada:
# {
#   "success": true,
#   "plantillas": [ ... ]
# }
```

#### Prueba 5.2: Crear Plantilla
```bash
curl -X POST http://localhost:3001/api/matrix/plantillas \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Saludo",
    "contenido": "¡Hola! ¿En qué puedo ayudarte hoy?",
    "etiquetas": ["saludo", "bienvenida"],
    "esGlobal": false
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "plantilla": { ... }
# }
```

### 6. **UI Frontend** 🎨

#### Prueba 6.1: Navegación
- [ ] Abrir `/matrix/chat?id=CONV_ID`
- [ ] Verificar que carga la conversación
- [ ] Verificar que carga los mensajes históricos

#### Prueba 6.2: Header de Conversación
- [ ] Botón de prioridad muestra opciones
- [ ] Cambiar prioridad actualiza UI
- [ ] Botón de etiquetas funciona
- [ ] Agregar etiqueta actualiza lista
- [ ] Quitar etiqueta funciona
- [ ] Menú de opciones se abre
- [ ] Botón escalar muestra confirmación
- [ ] Botón archivar muestra confirmación

#### Prueba 6.3: Input de Mensajes
- [ ] Escribir texto y presionar Enter envía
- [ ] Botón de adjuntar abre selector de archivos
- [ ] Seleccionar imagen muestra preview
- [ ] Seleccionar archivo muestra nombre y tamaño
- [ ] Botón de plantillas abre modal
- [ ] Seleccionar plantilla inserta texto
- [ ] Botón de micrófono inicia grabación
- [ ] Grabación muestra temporizador
- [ ] Detener grabación envía audio

#### Prueba 6.4: Burbujas de Mensajes
- [ ] Mensajes de texto se muestran correctamente
- [ ] Imágenes se muestran con preview
- [ ] Audio muestra reproductor
- [ ] Play/Pause de audio funciona
- [ ] Archivos muestran icono y botón de descarga
- [ ] Estados de entrega se muestran (✓, ✓✓, ✓✓ azul)
- [ ] Mensajes propios alineados a la derecha
- [ ] Mensajes recibidos alineados a la izquierda

#### Prueba 6.5: WebSocket en Tiempo Real
- [ ] Nuevo mensaje aparece automáticamente
- [ ] Cambio de prioridad se refleja en header
- [ ] Agregar etiqueta actualiza UI
- [ ] Indicador "escribiendo..." aparece cuando otro usuario escribe

### 7. **Flujo Completo E2E** 🔄

#### Escenario 1: Conversación con Imagen
1. Usuario abre conversación
2. Selecciona una imagen del dispositivo
3. Preview de imagen aparece
4. Escribe un mensaje de texto adicional
5. Presiona enviar
6. Loading spinner aparece
7. Imagen se sube al servidor
8. Mensaje con imagen se envía
9. WebSocket notifica a todos los clientes
10. Mensaje aparece en UI con imagen renderizada
11. Estado cambia a "entregado" ✓✓
12. Cuando el receptor lo lee, cambia a ✓✓ azul

#### Escenario 2: Escalamiento de Conversación
1. Doctor abre conversación urgente
2. Click en botón de prioridad
3. Selecciona "Urgente"
4. UI actualiza inmediatamente
5. Click en menú de opciones
6. Selecciona "Escalar a Recepción"
7. Confirmación aparece
8. Acepta confirmación
9. API actualiza asignación
10. WebSocket notifica a recepción
11. Notificación aparece en panel de recepción
12. Conversación aparece en lista de recepción

#### Escenario 3: Respuesta Rápida
1. Usuario abre conversación
2. Click en botón de plantillas ⚡
3. Modal de plantillas aparece
4. Busca "saludo"
5. Resultados filtrados aparecen
6. Click en plantilla "Bienvenida"
7. Modal se cierra
8. Texto se inserta en input
9. Usuario puede editar o enviar directamente
10. Presiona enviar
11. Mensaje se envía
12. Contador de uso de plantilla incrementa

## 🎯 Criterios de Éxito

- ✅ Todos los uploads funcionan correctamente
- ✅ WebSocket conecta y emite eventos
- ✅ Mensajes se envían y reciben en tiempo real
- ✅ Estados de entrega se actualizan
- ✅ Prioridad y etiquetas funcionan
- ✅ Escalamiento funciona
- ✅ Plantillas se pueden crear y usar
- ✅ Audio se graba y reproduce
- ✅ UI es responsive y sin errores

## 🐛 Bugs Conocidos

Ninguno reportado hasta ahora.

## 📝 Notas

- Asegurarse de tener un token JWT válido
- El servidor debe estar ejecutándose en `localhost:3001`
- El frontend debe estar en `localhost:3000`
- Verificar que las carpetas `uploads/` existen

## 🚀 Siguiente Nivel

Para producción, considerar:
- Rate limiting en uploads
- Compresión de imágenes adicional
- CDN para archivos estáticos
- Encriptación de archivos sensibles
- Limpieza automática de archivos antiguos
- Métricas de uso de WebSocket
- Logs detallados de eventos
