# 🧪 Guía de Prueba: Conversión Express Lead → Paciente

## ⚡ Inicio Rápido

El servidor ya está corriendo en **http://localhost:3001/matrix**

### Pasos para Probar:

1. **Navega a la página del matriz**
   ```
   http://localhost:3001/matrix
   ```

2. **Busca una tarjeta de lead** en cualquier columna (debería haber 12 leads cargados)

3. **Haz hover** sobre la tarjeta
   - Aparecerá un botón azul circular 🔄 en la esquina superior derecha

4. **Haz clic** en el botón 🔄
   - Se abre el modal "Convertir a Paciente"

5. **Completa el formulario**:
   - **Especialidad**: Selecciona una (ej: "Odontología")
   - **Tipo de Consulta**: Selecciona una (ej: "Consulta Inicial")

6. **Haz clic** en "Convertir Ahora"
   - Verás un spinner de carga
   - Estimado: 2-3 segundos

7. **Observa la pantalla de éxito**:
   - ✅ Paciente ID creado
   - 📅 Cita automática agendada (próximos 7 días)
   - 📱 WhatsApp confirmación enviada
   - ⏱️ Tiempo total en ms

8. **Auto-cierre**:
   - El modal se cerrará automáticamente en 3 segundos
   - Puedes hacer clic nuevamente en otro lead para convertir

---

## 🎯 Qué Ocurre Internamente

### Lead Original (Ejemplo):
```
Nombre: María García
Teléfono: +34 912 345 678
Email: maria@example.com
Canal: WhatsApp
Valor: $5,000
```

### Después de Conversión:

**1. Paciente Creado**:
```json
{
  "id": "PAC-1234567890",
  "nombreCompleto": "María García",
  "whatsapp": "+34 912 345 678",
  "email": "maria@example.com",
  "origenLead": "whatsapp-new"
}
```

**2. Cita Auto-Creada**:
```json
{
  "id": "CITA-1234567890",
  "pacienteId": "PAC-1234567890",
  "especialidad": "Odontología",
  "fechaCita": "2024-01-16",
  "horaCita": "10:30",
  "estado": "Agendada"
}
```

**3. WhatsApp Enviado**:
```
Hola María,

Tu cita en Odontología ha sido confirmada:

📅 Fecha: 16/01/2024
⏰ Hora: 10:30 AM
💰 Costo: $250

¡Nos vemos pronto!
```

---

## ✅ Checklist de Validación

- [ ] El botón 🔄 aparece al hacer hover
- [ ] El modal se abre sin errores
- [ ] Los dropdowns de especialidad y tipo funcionan
- [ ] El botón "Convertir Ahora" inicia el proceso
- [ ] El spinner de carga se muestra
- [ ] La pantalla de éxito muestra los detalles
- [ ] El modal se cierra automáticamente en 3s
- [ ] Puedo convertir múltiples leads secuencialmente
- [ ] No hay errores en la consola (F12)
- [ ] El tiempo total es < 1 segundo

---

## 🐛 Troubleshooting

### El botón no aparece
- ✅ Verifica que el servidor esté corriendo: `npm run dev`
- ✅ Abre DevTools (F12) y recarga la página
- ✅ Busca errores en la consola

### El modal no se abre
- ✅ Revisa la consola para errores
- ✅ Asegúrate de que `ConversionModal.tsx` está importado en `LeadCard.tsx`

### Errores en la consola
- Common: "Cannot find module" → Recarga el navegador
- Common: "State update on unmounted component" → Normal, el modal se cierra antes de completar

### El lead no muestra datos
- Verifica que el lead tenga: `nombre`, `email`, `telefono`, `valorEstimado`
- Los 12 leads de demostración tienen todos estos campos

---

## 📊 Métricas Esperadas

| Métrica | Valor |
|---------|-------|
| Tiempo de carga del modal | ~100ms |
| Tiempo de creación de paciente | ~100-200ms |
| Tiempo de creación de cita | ~150-250ms |
| Tiempo de envío de WhatsApp | ~150-250ms |
| **Tiempo Total (Paralelo)** | **~250-450ms** |
| Auto-cierre del modal | **3,000ms** |
| **Tiempo Total (Usuario)** | **~3.2-3.5 segundos** ✅ |

---

## 🚀 Próximas Pruebas

1. **Backend Integration**: Reemplazar mocked responses con API real
2. **Error Testing**: Intentar convertir con datos inválidos
3. **Bulk Conversion**: Convertir 10+ leads secuencialmente
4. **State Updates**: Verificar que el lead se marca como convertido
5. **Notifications**: Activar toasts de éxito

---

## 📝 Notas

- Los datos son **SIMULADOS** por ahora (no se guardan en base de datos real)
- El modal usa `Promise.all()` para paralelizar operaciones
- El auto-cierre es configurable (actualmente 3 segundos)
- El sistema es completamente **Type-Safe** en TypeScript

---

**¿Problemas?** Revisa la consola del navegador (F12) para detalles específicos.
