# Caso de Uso: Reagendar Promoción

## 🎯 Objetivo

Implementar la **REGLA DE ORO** del sistema CRM RCA (Punto 15 de la documentación de Gemini):

> **"La 2da vez ya sin promoción"**

Este es el caso de uso más crítico del sistema porque:
- Protege los ingresos de la clínica
- Evita el abuso de promociones
- Automatiza decisiones sin depender de criterio humano
- Afecta todo el flujo operativo: Keila → Recepción → Antonio/Yaretzi

---

## 📋 Regla de Negocio

### Primera Reagendación (Reagendaciones = 0 → 1)
✅ **SE MANTIENE** la promoción  
✅ El cliente sigue pagando precio promocional  
✅ Se incrementa el contador de reagendaciones a 1

### Segunda Reagendación (Reagendaciones = 1 → 2)
⚠️ **SE PIERDE** la promoción automáticamente  
⚠️ El precio cambia a precio regular  
⚠️ Se recalcula el saldo pendiente  
⚠️ Se notifica al usuario (Keila/Recepción)

### Tercera Reagendación o más
❌ Ya no tiene promoción (se perdió en la segunda)  
✅ Puede seguir reagendando con precio regular

---

## 🔧 Implementación

### Endpoint Principal
```http
PUT /api/citas/:id/reagendar
Content-Type: application/json

{
  "nuevaFecha": "2026-02-15",
  "nuevaHora": "10:30",
  "motivo": "Cliente no puede asistir",
  "precioRegular": 500,
  "usuarioId": "keila"
}
```

### Respuesta (Primera Reagendación)
```json
{
  "success": true,
  "message": "✅ Cita reagendada. La promoción se mantiene vigente (1ra reagendación).",
  "cita": {
    "id": "cita-001",
    "fechaCita": "2026-02-15",
    "horaCita": "10:30",
    "esPromocion": true,
    "reagendaciones": 1,
    "costoConsulta": 250
  },
  "detalles": {
    "promocionPerdida": false,
    "precioAnterior": 250,
    "precioNuevo": 250
  }
}
```

### Respuesta (Segunda Reagendación - REGLA DE ORO)
```json
{
  "success": true,
  "message": "⚠️ ATENCIÓN: Esta cita ha perdido la promoción por reagendar más de una vez. El nuevo precio es $500 MXN (precio regular).",
  "cita": {
    "id": "cita-001",
    "fechaCita": "2026-02-16",
    "horaCita": "14:00",
    "esPromocion": false,
    "reagendaciones": 2,
    "costoConsulta": 500
  },
  "detalles": {
    "promocionPerdida": true,
    "precioAnterior": 250,
    "precioNuevo": 500
  }
}
```

---

## 🔍 Endpoint de Validación

Útil para que Keila vea el impacto **ANTES** de confirmar la reagendación:

```http
GET /api/citas/:id/validar-reagendacion
```

### Respuesta
```json
{
  "success": true,
  "cita": {
    "id": "cita-001",
    "esPromocion": true,
    "reagendaciones": 1,
    "costoActual": 250
  },
  "validacion": {
    "puedeReagendar": true,
    "mantienePromocion": false,
    "advertencia": "⚠️ ADVERTENCIA: Al reagendar nuevamente, se perderá la promoción y se cobrará precio regular."
  }
}
```

---

## 💡 Flujo de Usuario

### Escenario: Keila (Contact Center)

1. **Cliente llama para reagendar primera vez**
   ```
   Keila: [Busca cita en sistema]
   Sistema: ✅ "Puede reagendar. Promoción se mantiene"
   Keila: "Don Juan, sin problema, le cambio la cita. Sigue con su descuento"
   ```

2. **Mismo cliente llama para reagendar segunda vez**
   ```
   Keila: [Busca cita en sistema]
   Sistema: ⚠️ "ADVERTENCIA: Perderá la promoción. Precio será $500"
   Keila: "Don Juan, le puedo cambiar la cita pero ya no aplica el descuento.
          Serían $500 en lugar de $250. ¿Está de acuerdo?"
   Cliente: [Decide]
   ```

### Escenario: Recepción

1. **Paciente llega el día de la cita**
   ```
   Recepcionista: [Marca llegada]
   Sistema: Muestra costo actualizado: $500 (promoción perdida)
   Recepcionista: Cobra $500
   ```

### Escenario: Antonio/Yaretzi (Finanzas)

1. **Reporte de corte del día**
   ```
   Sistema: Genera reporte
   Línea: "Juan Pérez - Consulta - $500 (originalmente $250 promoción)"
   Antonio: [Ve el ingreso real vs lo proyectado]
   ```

---

## 🧪 Tests

Ejecutar tests:
```bash
npm test tests/use-cases/ReagendarPromocion.test.ts
```

### Casos de Prueba Implementados

✅ Primera reagendación mantiene promoción  
✅ Segunda reagendación pierde promoción  
✅ Recalcula saldo pendiente al cambiar precio  
✅ Rechaza fechas en el pasado  
✅ Valida formato de hora (HH:mm)  
✅ Rechaza reagendar citas canceladas  
✅ Método de validación previa funciona correctamente

---

## 📊 Impacto en el Sistema

### Base de Datos
```sql
-- Campos afectados en tabla `citas`
UPDATE citas SET
  fechaCita = '2026-02-15',
  horaCita = '10:30',
  reagendaciones = reagendaciones + 1,
  esPromocion = CASE 
    WHEN reagendaciones >= 1 AND esPromocion = true 
    THEN false 
    ELSE esPromocion 
  END,
  costoConsulta = CASE 
    WHEN reagendaciones >= 1 AND esPromocion = true 
    THEN precioRegular 
    ELSE costoConsulta 
  END,
  saldoPendiente = costoConsulta - montoAbonado
WHERE id = 'cita-001';
```

### Notificaciones
- **WhatsApp**: Mensaje automático al paciente informando cambio de fecha
- **WhatsApp (si pierde promoción)**: Mensaje adicional explicando cambio de precio
- **Sistema Interno**: Notificación a Antonio/Yaretzi de cambio de ingreso proyectado

### Auditoría
Cada reagendación debe registrar:
- Usuario que ejecutó la acción
- Timestamp
- Si se perdió la promoción
- Precio anterior vs nuevo
- Motivo de reagendación

---

## 🚀 Próximos Pasos

1. ✅ **Caso de Uso implementado**
2. ✅ **Controller actualizado**
3. ✅ **Rutas actualizadas**
4. ✅ **Tests básicos creados**
5. ⏳ **Pendiente**: Conectar con repositorio real (PostgreSQL)
6. ⏳ **Pendiente**: Implementar notificaciones WhatsApp
7. ⏳ **Pendiente**: Sistema de auditoría
8. ⏳ **Pendiente**: Frontend para Keila con advertencias visuales

---

## 🔗 Referencias

- **Documentación Gemini**: Punto 15 - "Regla de Oro de Re-Agendamiento"
- **Entidad**: `/src/core/entities/Cita.ts`
- **Caso de Uso**: `/src/core/use-cases/ReagendarPromocion.ts`
- **Controller**: `/src/api/controllers/CitaController.ts`
- **Tests**: `/tests/use-cases/ReagendarPromocion.test.ts`

---

## ⚡ Ejemplo de Uso Completo

```typescript
// Frontend de Keila
async function reagendarCita(citaId: string) {
  // 1. Validar primero
  const validacion = await fetch(`/api/citas/${citaId}/validar-reagendacion`);
  const { validacion: info } = await validacion.json();
  
  if (!info.mantienePromocion) {
    // Mostrar advertencia al usuario
    const confirma = confirm(info.advertencia);
    if (!confirma) return;
  }
  
  // 2. Reagendar
  const response = await fetch(`/api/citas/${citaId}/reagendar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nuevaFecha: '2026-02-15',
      nuevaHora: '10:30',
      precioRegular: 500,
      usuarioId: 'keila',
      motivo: 'Cliente no puede asistir'
    })
  });
  
  const resultado = await response.json();
  
  if (resultado.detalles.promocionPerdida) {
    // Informar a Keila que debe avisar al cliente
    alert(`⚠️ Se perdió la promoción. Nuevo precio: $${resultado.detalles.precioNuevo}`);
  }
}
```

---

**Implementado**: 3 de febrero de 2026  
**Desarrollador**: Sistema CRM RCA  
**Status**: ✅ Listo para testing con datos reales
