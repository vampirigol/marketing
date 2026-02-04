# 📖 Guía de Uso - Acciones Masivas (Bulk Actions)

## 🎯 ¿Qué son las Acciones Masivas?

Las Acciones Masivas te permiten realizar operaciones en **múltiples leads al mismo tiempo**, ahorrando tiempo y clicks innecesarios.

En lugar de editar leads uno por uno, ahora puedes:
- ✅ Seleccionar varios leads
- ✅ Aplicar la misma acción a todos
- ✅ Hacerlo en segundos

## 🚀 Comenzando

### Paso 1: Seleccionar Leads

Tienes 3 formas de seleccionar leads:

#### Opción A: Checkbox Individual
```
Click en el checkbox al lado de cada lead
┌──────────────────────┐
│ [ ] Nombre del lead  │  ← Click aquí
│     Info...          │
└──────────────────────┘
```

#### Opción B: Multi-Selección con Cmd/Ctrl
```
Click en 1er lead, luego Cmd+Click en otros
Windows: Ctrl+Click
Mac: Cmd+Click
Linux: Ctrl+Click
```

#### Opción C: Multi-Selección con Shift
```
Click en 1er lead, Shift+Click en último
Selecciona todos entre los dos
```

### Paso 2: Aparecerá la Barra de Acciones

Cuando selecciones el 1er lead, verás esto en la parte inferior:

```
┌─────────────────────────────────────────────────────────────┐
│ 1 lead seleccionado                                        │
│ [Mover ▼] [Vendedor ▼] [Etiqueta ▼] [Exportar] [Eliminar] │
└─────────────────────────────────────────────────────────────┘
```

El contador se actualiza en tiempo real conforme selecciones.

### Paso 3: Elige una Acción

---

## 🔄 ACCIÓN 1: Mover Leads

**¿Para qué?** Cambiar el estado de múltiples leads de una columna a otra.

### Pasos:
1. Selecciona los leads a mover
2. Click en botón **[Mover ▼]**
3. Dropdown aparece con opciones:
   ```
   🆕 Leads Nuevos
   👀 En Revisión
   ❌ Rechazados
   ✅ Calificados
   📂 Abiertos
   ⚡ En Progreso
   💰 Negociación
   ```
4. Haz click en la columna destino
5. ✅ ¡Listo! Notificación confirma: "3 leads movidos exitosamente"

### Ejemplo:
```
Caso: 5 leads están en "En Revisión" y están listos para "Calificados"

Acción:
1. Cmd+Click en los 5 leads
2. Click en [Mover ▼]
3. Click en "✅ Calificados"
4. Barra desaparece automáticamente
5. Los 5 leads ahora están en "Calificados"

Tiempo: 5 segundos vs 2-3 minutos por uno
```

---

## 👥 ACCIÓN 2: Asignar Vendedor

**¿Para qué?** Reasignar múltiples leads a un vendedor diferente.

### Pasos:
1. Selecciona los leads
2. Click en botón **[Vendedor ▼]**
3. Dropdown muestra vendedores disponibles:
   ```
   🧑‍💼 Lucía Paredes
   👨‍💼 Carlos Mendez
   👩‍💼 Ana García
   👨‍💻 Roberto Silva
   ```
4. Haz click en el vendedor
5. ✅ Notificación: "3 leads asignados a Lucía Paredes"

### Ejemplo:
```
Caso: Lucía está de vacaciones, sus 8 leads deben ir a Carlos

Acción:
1. Filtra por vendedor: "Lucía Paredes"
2. Se muestran sus 8 leads
3. Cmd+A o selecciona manualmente
4. Click en [Vendedor ▼]
5. Click en "Carlos Mendez"
6. ✅ Todos asignados a Carlos

Tiempo: 30 segundos vs 5-10 minutos
```

---

## 🏷️ ACCIÓN 3: Agregar Etiqueta

**¿Para qué?** Categorizar múltiples leads con la misma etiqueta para seguimiento, reportes, o automatización.

### Pasos:
1. Selecciona los leads
2. Click en botón **[Etiqueta ▼]**
3. Aparece panel con opción:
   ```
   + Nueva etiqueta
   ```
4. Click en "+ Nueva etiqueta"
5. Input aparece para que escribas el nombre:
   ```
   Nombre de etiqueta... [escribe aquí]
   ```
6. Escribe la etiqueta (ej: "Follow-up Urgente", "Premium", "Test")
7. Click en **[Agregar]** o presiona **Enter**
8. ✅ Notificación: "Etiqueta 'Follow-up Urgente' agregada a 5 leads"

### Ejemplo:
```
Caso: Marcar 10 leads que necesitan seguimiento hoy

Acción:
1. Selecciona los 10 leads
2. Click en [Etiqueta ▼]
3. Click en "+ Nueva etiqueta"
4. Escribe: "Follow-up Hoy"
5. Click [Agregar]
6. Etiquetas aparecen en cada card

Beneficio: Puedes filtrar por etiqueta después
Sistema puede activar automaciones basadas en etiquetas
```

---

## 📥 ACCIÓN 4: Exportar a CSV

**¿Para qué?** Descargar los leads seleccionados en formato Excel/CSV para análisis, reportes, o integración con otros sistemas.

### Pasos:
1. Selecciona los leads a exportar
2. Click en botón **[Exportar]**
3. Archivo se descarga automáticamente:
   ```
   📄 leads-export-2026-02-04.csv
   ```
4. ✅ Notificación: "5 leads exportados a CSV"

### Contenido del CSV:
```
ID, Nombre, Email, Teléfono, Canal, Valor, Estado, Vendedor, Etiquetas, Fecha

001, Juan García, juan@email.com, +34123456, WhatsApp, 5000, Qualified, Lucía Paredes, Follow-up;Premium, 2026-02-04
002, María López, maria@email.com, +34654321, Facebook, 3000, Open, Carlos Mendez, Test, 2026-02-01
...
```

### Uso del archivo:
```
Excel/Sheets:
✓ Abre directamente
✓ Realiza análisis con gráficos
✓ Crea reportes personalizados

Google Sheets:
✓ Importa el CSV
✓ Comparte con equipo
✓ Actualiza en tiempo real

MailChimp / CRM externo:
✓ Copia los emails
✓ Importa a otra plataforma
✓ Sincroniza datos
```

### Ejemplo:
```
Caso: Enviar datos de 20 leads cerrados al gerente

Acción:
1. Filtra estado: "Open Deal"
2. Selecciona los 20 (o Cmd+A si solo hay esos)
3. Click en [Exportar]
4. Se descarga "leads-export-2026-02-04.csv"
5. Abre en Excel
6. Comparte por email

Tiempo: 1 minuto vs 20 minutos de copia manual
```

---

## 🗑️ ACCIÓN 5: Eliminar en Lote

**¿Para qué?** Eliminar múltiples leads de una vez (ej: duplicados, spam, datos incompletos).

### ⚠️ ADVERTENCIA
```
Esta acción NO SE PUEDE DESHACER
Asegúrate de que quieres eliminar antes de confirmar
```

### Pasos:
1. Selecciona los leads a eliminar
2. Click en botón rojo **[Eliminar]**
3. Modal de confirmación aparece:
   ```
   ┌────────────────────────────┐
   │ ¿Eliminar 3 leads?         │
   │                            │
   │ Esta acción no se puede    │
   │ deshacer.                  │
   │                            │
   │ [Eliminar] [Cancelar]      │
   └────────────────────────────┘
   ```
4. Lee el mensaje ⚠️
5. Si estás seguro: Click **[Eliminar]**
6. Si cambias de opinión: Click **[Cancelar]**
7. ✅ Notificación: "3 leads eliminados" (solo si confirmaste)

### Ejemplo:
```
Caso: Encontraste 5 leads duplicados

Acción:
1. Selecciona los 5 leads duplicados
2. Click en [Eliminar]
3. Modal pide confirmación
4. Lees: "¿Eliminar 5 leads?"
5. Click [Eliminar]
6. Modal cierra
7. ✅ "5 leads eliminados"
8. Refresca la página y ya no están

⚠️ OJO: Los 5 leads se BORRAN PARA SIEMPRE
```

---

## 🎮 Atajos y Tips

### Multi-Selección Rápida
```
Mac:
- Cmd+Click: Selecciona/deselecciona individual
- Cmd+A: Selecciona TODOS en la página (si hay input activo)
- Shift+Click: Selecciona rango entre 2 leads

Windows/Linux:
- Ctrl+Click: Igual a Cmd+Click
- Shift+Click: Igual a Shift+Click
```

### Cerrar Barra de Acciones
```
Opción 1: Click en botón [X] al final de la barra
Opción 2: Deselecciona todos los leads (click en checkbox vacío)
Opción 3: Actualiza página (F5)
```

### Notificaciones
```
Aparecen en la parte inferior
Desaparecen automáticamente después de 3 segundos
Puedes seguir trabajando mientras aparecen
```

---

## ✅ Casos de Uso Típicos

### Caso 1: Lunes de Asignación
```
Situación: 25 leads nuevos llegaron el fin de semana

Acción:
1. Abre Matrix Kanban
2. Va a columna "Leads Nuevos" → 25 leads
3. Cmd+A (si solo hay esos 25 en la vista)
   o selecciona manualmente
4. [Mover ▼] → Selecciona "Calificados"
5. Barra se cierra, todos se mueven
6. Ahora asigna por vendedor:
   - 8 a Lucía [Vendedor ▼]
   - 9 a Carlos [Vendedor ▼]
   - 8 a Ana [Vendedor ▼]

Tiempo total: 2 minutos
Sin bulk actions: 30-40 minutos
```

### Caso 2: Limpieza de Duplicados
```
Situación: Detectas leads duplicados

Acción:
1. Identifica los duplicados (mismo email/teléfono)
2. Selecciona los duplicados (mantener 1, eliminar otros)
3. [Eliminar] → Confirma
4. ✓ Limpio

Tiempo: 1 minuto por 5-10 duplicados
```

### Caso 3: Etiquetar para Automatización
```
Situación: Quieres activar un workflow automático

Acción:
1. Filtra leads que cumplen criterio
2. Selecciona todos (Cmd+A o manual)
3. [Etiqueta ▼] → "+ Nueva etiqueta"
4. Escribe: "Auto-Workflow-Premium"
5. Sistema automático detecta etiqueta
6. Workflow se activa para esos leads

Beneficio: Escala tus procesos automáticamente
```

### Caso 4: Reporte Ejecutivo
```
Situación: Necesitas enviar datos al director

Acción:
1. Filtra por criterios (fechas, estado, vendedor)
2. Selecciona relevantes
3. [Exportar]
4. Abre CSV en Excel
5. Haz pivot table / gráficos
6. Comparte por email

Tiempo: 5-10 minutos vs 1 hora
```

---

## 🆘 Troubleshooting

### "No veo la barra de acciones"
```
Solución: Necesitas seleccionar al menos 1 lead
Acción: Click en un checkbox de un lead
```

### "El botón está deshabilitado (gris)"
```
Razón: Sistema está procesando acción anterior
Solución: Espera 2-3 segundos a que termine
```

### "No recuerdo qué va a pasar"
```
Antes de confirmar cualquier acción:
1. Lee el modal si aparece
2. Verifica cantidad de leads seleccionados
3. Para ELIMINAR: ⚠️ Leer 2 veces
```

### "Quiero deshacer una acción"
```
❌ Lamentablemente no hay "Deshacer" todavía
⚠️ Por eso confirmamos antes de eliminar

Alternativa: Revierte la acción manualmente o contacta admin
```

### "CSV no abre en Excel"
```
Solución 1: Double-click en el archivo
Solución 2: Click derecho → "Abrir con" → Excel
Solución 3: Abre Excel → Archivo → Abrir → Selecciona CSV
```

---

## 📞 Soporte

Si algo no funciona:
1. Recarga la página (F5)
2. Verifica internet conectado
3. Prueba navegador diferente
4. Contacta al equipo de soporte

---

## 🎓 Resumen Rápido

| Acción | Botón | Para qué |
|--------|-------|----------|
| **Mover** | [Mover ▼] | Cambiar columna/estado |
| **Asignar** | [Vendedor ▼] | Cambiar dueño del lead |
| **Etiquetar** | [Etiqueta ▼] | Categorizar para seguimiento |
| **Exportar** | [Exportar] | Descargar a Excel/CSV |
| **Eliminar** | [Eliminar] | Borrar leads (⚠️ permanente) |

---

**¡Ya estás listo para usar Acciones Masivas! 🚀**

Si tienes preguntas, consulta a tu administrador del sistema.
