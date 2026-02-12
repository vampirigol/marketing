# Análisis y levantamiento de funcionamiento – Sección de Citas

## 1. Alcance

- **Frontend:** `frontend/app/citas/page.tsx`, componentes en `frontend/components/citas/`, modal `AgendarCitaModal` en `frontend/components/matrix/`, servicios en `frontend/lib/citas.service.ts`.
- **Backend:** rutas en `src/api/routes/citas.ts`, `CitaController`, `CitaRepository`, catálogo y disponibilidad.

---

## 2. Flujo lógico esperado (cómo debería funcionar)

### 2.1 Agenda de Citas (vistas Día / Semana / Mes)

1. **Carga de citas**
   - Usuario abre `/citas`.
   - Según rol: Admin sin filtro → traer citas de **todas las sucursales** en el rango de fechas (GET `/api/citas/rango`). Admin con sucursal elegida o no-Admin → traer citas por sucursal(es) y por cada día del rango (GET `/api/citas/sucursal/:sucursalId?fecha=YYYY-MM-DD`).
   - Rango depende de la vista: **Día** = un día; **Semana** = lunes–domingo de esa semana; **Mes** = del 1 al último día del mes.
   - Backend devuelve citas con `fecha_cita` (DATE), `medico_asignado`, `sucursal_id`, etc. Frontend mapea a tipo `Cita` y rellena nombres de paciente (llamando a `/api/pacientes/:id`) y de sucursal.

2. **Filtros**
   - **Sucursal (solo Admin):** “Todas las sucursales” = sin filtrar por sucursal en la petición; una sucursal elegida = solo esa en la petición.
   - **Doctor (panel derecho):** Si hay doctores seleccionados, en frontend se filtran las citas ya cargadas por `medicoAsignado` (comparando con nombres de `DOCTORES`).
   - **Búsqueda, estado, tipo, etc.:** Se aplican en frontend sobre las citas ya cargadas.

3. **Visualización**
   - Las citas se muestran en calendario (día/semana/mes) según la vista.
   - Mini-calendario marca “hoy”, “seleccionado” y “días con citas”.
   - Al hacer clic en una cita se abre el detalle (modal).

4. **Acciones**
   - Nueva cita → abre modal de agendar.
   - Confirmar / Cancelar / Marcar llegada → llamadas a PUT del backend; luego se vuelve a cargar la agenda.

### 2.2 Vista Lista

1. Debería mostrar **las mismas citas reales** que el calendario (misma fuente de verdad: backend).
2. Con **paginación** (página, tamaño, orden y filtros) para no cargar todo de golpe.
3. Campos mostrados: fecha, paciente, doctor, especialidad, estado, sucursal, etc., coherentes con el tipo `Cita` del sistema.

### 2.3 Agendar nueva cita

1. **Paso 1 – Catálogo:** Sucursal → Especialidad → Doctor → Servicio (con promociones). Datos del catálogo desde GET `/api/catalogo` (o con `sucursalId`).
2. **Paso 2 – Fecha y hora:** Selector de fecha (input tipo date) y de hora. Las horas disponibles vienen de GET `/api/citas/disponibilidad/:sucursalId?fecha=YYYY-MM-DD&doctorId=...` (slots con `disponible`, `cupoDisponible`, `capacidad`). La **fecha** debe construirse en **hora local** (día correcto) para no cambiar de día al enviar al backend.
3. **Paso 3 – Datos del paciente:** Si no viene de un paciente existente, se piden nombre, apellidos, teléfono, email, edad, religión, no. afiliación. Se crea paciente con POST `/api/pacientes` si aplica.
4. **Confirmación:** POST `/api/citas` con `pacienteId`, `sucursalId`, `fechaCita`, `horaCita`, `especialidad`, `medicoAsignado`, etc. Backend debe guardar la **fecha de la cita** como **día de calendario** correcto (sin que la zona horaria del servidor cambie el día).
5. Tras crear, se emite evento / BroadcastChannel para refrescar agenda y se muestra mensaje de éxito.

### 2.4 Lista de espera

- Listar solicitudes: GET `/api/citas/lista-espera`.
- Asignar cita a una solicitud: PUT `/api/citas/lista-espera/:id/asignar` con `citaId` y opcionalmente `pacienteId`. La cita recién creada se vincula a la solicitud.

### 2.5 Reagendar / Cancelar / Marcar llegada

- Reagendar: PUT `/api/citas/:id/reagendar` (validación de promoción en backend).
- Cancelar: PUT `/api/citas/:id/cancelar`.
- Marcar llegada: PUT `/api/citas/:id/llegada`.

---

## 3. Qué no funciona correctamente (y cómo debería ser)

### 3.1 Vista Lista usa datos mock en lugar del backend

**Qué pasa:**  
En vista “Lista”, la página hace `fetch('/api/citas?page=...&pageSize=...')`, que es la **ruta de Next.js** `frontend/app/api/citas/route.ts`. Esa ruta **no** llama al backend: mantiene un array en memoria (`citasMock`) y devuelve datos falsos (paciente 1, 2, 3…, doctor 1, 2, 3…).

**Consecuencia:**  
En Lista no se ven las citas reales de la base de datos. Es una vista desconectada del resto del sistema.

**Cómo debería ser:**  
- Opción A: El backend expone un endpoint de **listado paginado de citas** (por ejemplo GET `/api/citas?page=&pageSize=&search=&estado=&sucursalId=&fechaDesde=&fechaHasta=&sort=...`) y el frontend llama a ese endpoint (con el cliente que ya usa `api` y auth).  
- Opción B: Si se quiere evitar un nuevo endpoint, la vista Lista podría reutilizar las mismas citas ya cargadas para el rango actual (vista día/semana/mes) y paginar/filtrar en frontend, dejando claro que “Lista” es sobre el mismo rango que el calendario.

---

### 3.2 Filtro “Médico” en CitasFilters no coincide con datos reales

**Qué pasa:**  
`CitasFilters` recibe `sucursales` desde la página (API real) pero **no** recibe la lista de médicos. Usa por defecto `MEDICOS = ['Dr. López', 'Dra. Ramírez', ...]`, que son datos estáticos y **no** coinciden con los nombres que vienen del catálogo / BD (ej. “Alejandro Vargas”, “Edni González”, etc.).  
Las citas reales tienen `medicoAsignado` con el nombre que devuelve el catálogo. Si el usuario filtra por “Dr. López”, nunca coincidirá con esas citas.

**Consecuencia:**  
El filtro por médico en el panel de filtros es inútil o confuso: o no filtra nada útil o deja la lista vacía.

**Cómo debería ser:**  
- Pasar a `CitasFilters` la lista de médicos **reales** (por ejemplo desde el catálogo o desde `GET /api/catalogo` → `doctores`, o una lista derivada de las citas/doctores del sistema).  
- O bien quitar el filtro “Médico” del panel de filtros y dejar solo el “Seleccionar Doctores” del panel derecho, que sí usa `DOCTORES` y filtra por `medicoAsignado` comparando con `d.nombre`.

---

### 3.3 Doble fuente de verdad para “doctores”

**Qué pasa:**  
- **DoctorSelector** (panel derecho) usa `DOCTORES` de `doctores-data.ts` (lista estática).  
- **CatalogoForm** (agendar cita) usa doctores del **catálogo** (API).  
- Las citas en BD guardan `medico_asignado` con el nombre que vino del catálogo al crear la cita.

Si los nombres del catálogo no coinciden exactamente con `DOCTORES[].nombre` (ej. “Dr. Alejandro Vargas” vs “Alejandro Vargas”), el filtro por doctor en la agenda puede ocultar citas que sí corresponden a ese doctor.

**Cómo debería ser:**  
- Una única fuente de verdad para “nombre de doctor” en citas: o siempre catálogo, o siempre la misma lista que usa el filtro.  
- Si el filtro usa `DOCTORES`, al agendar la cita el nombre enviado en `medicoAsignado` debería ser exactamente el mismo que en `DOCTORES` (o el backend debería normalizar).  
- Idealmente, lista de doctores para filtros y para agendar debería venir del mismo origen (ej. catálogo o endpoint de doctores).

---

### 3.4 Sincronización CRM al cargar la página

**Qué pasa:**  
En un `useEffect` al montar la página se llama a `citasService.sincronizarCitasDesdeCrm()` una vez (y se guarda en `localStorage` que ya se hizo). Eso puede modificar o crear citas en BD según el estado del CRM.

**Riesgo:**  
Si la lógica de “sync” no es idempotente o está mal alineada con la agenda, puede generar citas duplicadas o estados raros. No se ha revisado la implementación concreta de `sync-citas` en este análisis.

**Cómo debería ser:**  
- Definir claramente qué hace “sincronizar citas desde CRM” (solo lectura, creación de citas desde leads, etc.) y ejecutarlo en momentos controlados (ej. al abrir CRM o con un botón), no necesariamente en cada carga de la agenda.  
- Revisar que no duplique citas ni sobrescriba datos de forma inesperada.

---

### 3.5 KPI y alertas con una sola sucursal

**Qué pasa:**  
`cargarKpi` y `cargarAlertasRiesgo` usan `sucursalIdsConsulta[0]` cuando hay varias sucursales (ej. “Todas las sucursales”). Es decir, los KPI y las alertas de riesgo se calculan **solo para la primera sucursal** de la lista, no para todas.

**Consecuencia:**  
Con “Todas las sucursales” seleccionado, las cifras de confirmación, asistencia, no-show y alertas no representan el total global.

**Cómo debería ser:**  
- Si el filtro es “Todas las sucursales”, KPI y alertas deberían calcularse **sin** filtrar por sucursal (todas).  
- Backend ya soporta `sucursalId` opcional en esos endpoints; el frontend debería no enviar `sucursalId` cuando se elige “Todas”.

---

### 3.6 Fechas (resumen de lo ya corregido)

- **Frontend – Disponibilidad:** La fecha del día seleccionado se construye en hora local `(y, m-1, d, hora, minuto)` para no guardar el día anterior.  
- **Frontend – Mostrar citas:** Las fechas que vienen del backend como `YYYY-MM-DD` se parsean como fecha local para que el día no cambie por UTC.  
- **Backend – Crear cita:** La fecha recibida se normaliza al día en UTC antes de guardar, para que el día en BD sea el correcto.

Sin esos ajustes, las citas de “días posteriores” se guardaban o mostraban en el día equivocado. Con las correcciones aplicadas, el comportamiento esperado es el descrito en 2.3.

---

## 4. Resumen de hallazgos

| # | Área | Problema | Severidad | Acción recomendada |
|---|------|----------|-----------|--------------------|
| 1 | Vista Lista | Usa `/api/citas` de Next.js (mock), no backend real | Alta | Implementar listado paginado en backend y consumirlo, o reutilizar citas del rango actual |
| 2 | CitasFilters | Filtro “Médico” con lista estática que no coincide con BD | Media | Pasar médicos reales (catálogo/API) o quitar filtro y usar solo DoctorSelector |
| 3 | Doctores | Doble fuente (doctores-data vs catálogo) puede desalinear filtro y citas | Media | Unificar criterio de nombre de doctor y origen de la lista |
| 4 | Sync CRM | Ejecución automática al cargar agenda | Baja | Revisar lógica y momento de ejecución |
| 5 | KPI / Alertas | Con “Todas las sucursales” solo se usa la primera sucursal | Media | No enviar sucursal cuando el filtro es “todas” |

---

## 5. Flujo de datos resumido (estado actual)

```
[Usuario] → Vista Día/Semana/Mes
  → cargarCitas()
    → si Admin sin sucursal: GET /api/citas/rango?fechaInicio=&fechaFin=
    → si Admin con sucursal o no-Admin: GET /api/citas/sucursal/:id?fecha= (por cada día)
  → Respuesta: citas con paciente_id, sucursal_id, fecha_cita, medico_asignado, etc.
  → Frontend: GET /api/pacientes/:id por cada paciente, mapCitaBackend(), setCitas()
  → Filtros (sucursal, doctor, búsqueda, estado) en frontend → citasFiltradas → citasFiltradasCompleto
  → CalendarView (VistaDia / VistaSemanaEnhanced / VistaMes) o VistaLista

[Usuario] → Vista Lista
  → fetch('/api/citas?page=...')  ← Next.js mock, NO backend
  → citasPaginadas (datos falsos) → VistaLista

[Usuario] → Nueva Cita
  → CatalogoForm → DisponibilidadForm → DatosPacienteForm (si aplica)
  → POST /api/citas (fecha correcta en local + normalizada en backend)
  → Evento citaAgendada → cargarCitas() en página
```

---

## 6. Conclusión

- **Vistas Día / Semana / Mes:** La lógica de carga, filtros por sucursal y por doctor (panel derecho), y la construcción/visualización de fechas, con las correcciones ya hechas, están alineadas con el flujo esperado. Lo que sigue pendiente es el filtro “Médico” en CitasFilters y la coherencia doctores/catálogo.
- **Vista Lista:** No refleja la realidad del sistema porque depende de un mock. Es el punto más importante a corregir para que la sección de citas sea coherente de extremo a extremo.
- **KPI y alertas:** Deben calcularse para “todas las sucursales” cuando el usuario tiene ese filtro, no solo para la primera sucursal.

Este documento sirve como **levantamiento de funcionamiento lógico** de la sección de citas y como guía para las correcciones recomendadas.
