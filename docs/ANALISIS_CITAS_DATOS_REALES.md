# Análisis: Citas con datos reales – estado y pendientes

**Fecha:** 10 feb 2026  
**Objetivo:** Revisar qué está funcionando con datos reales y qué falta para que todo el flujo de citas sea coherente de extremo a extremo.

---

## 1. Lo que ya funciona con datos reales

### 1.1 Agenda (vistas Día / Semana / Mes)
- **Carga:** Se usa `citasService.obtenerPorRango()` o `obtenerPorSucursalYFecha()` contra el backend. Las citas vienen de la BD.
- **Pacientes y sucursales:** Se enriquecen con `pacientesService.obtenerPorId()` y nombres de sucursales desde la lista cargada. Todo desde APIs reales.
- **Fechas:** Parseo en hora local (`parseFechaCitaLocal`) y construcción de fecha al agendar en local, para que el día no cambie por UTC. Backend normaliza la fecha al crear la cita.
- **Filtro sucursal (Admin):** “Todas las sucursales” → sin `sucursalId`; una sucursal elegida → solo esa. Coherente con el backend.

### 1.2 Vista Lista
- **Origen de datos:** Ya **no** usa el mock de Next.js (`/api/citas`). Usa `citasService.listarPaginado()` que llama a **GET /api/citas** del backend (listado paginado con JOIN a pacientes y sucursales).
- **Filtros aplicados:** Paginación, búsqueda (paciente, teléfono, médico, especialidad), estado, sucursal, rango del mes de la fecha seleccionada, ordenación. Todo en backend.

### 1.3 Agendar nueva cita
- **Catálogo:** `CatalogoForm` carga GET `/api/catalogo` (o con `sucursalId`). El catálogo del backend mapea sucursales legacy → UUID de BD y devuelve doctores con `nombre` (ej. "Alejandro Vargas", "Edni González").
- **Disponibilidad:** `DisponibilidadForm` usa `citasService.obtenerDisponibilidad()` → **GET /api/citas/disponibilidad/:sucursalId** (slots reales según citas y bloqueos en BD).
- **Creación:** POST `/api/citas` con `medicoAsignado: datosCatalogo.doctorNombre`. El nombre guardado es el que devuelve el catálogo.

### 1.4 Filtros en panel
- **Sucursales:** Se pasan desde la página (API de sucursales o catálogo). Datos reales.
- **Médicos:** Se pasan `DOCTORES.map(d => d.nombre)` a `CitasFilters`. Nombres alineados con los que pueden venir en citas (catálogo y `doctores-data` comparten muchos nombres).

### 1.5 KPI y alertas
- Con “Todas las sucursales” se envía `sucursalId: undefined` al backend. Los endpoints de KPI y alertas aceptan `sucursalId` opcional y devuelven datos globales cuando no se envía.

### 1.6 Otras acciones
- Reagendar, cancelar, marcar llegada: PUT a `/api/citas/:id/...`. Backend real.

---

## 2. Pendientes y mejoras

### 2.1 Filtro “Médico” en Vista Lista (implementado)
- **Comportamiento:** El listado paginado GET `/api/citas` acepta el parámetro opcional `medicoAsignado`. La página de citas pasa `filters.medicoAsignado` a `listarPaginado` cuando la vista es Lista, de modo que al elegir un médico en el panel de filtros la lista también se filtra por ese médico.

### 2.2 Nombres de doctores (resuelto)
- **Normalización en backend:** Al crear o actualizar una cita se aplica `normalizarNombreMedico()` (quita prefijo "Dr./Dra.") y se guarda el nombre sin título. En el listado paginado el filtro por médico normaliza el valor recibido y en la consulta SQL se compara tanto la columna normalizada como la original, para que coincidan datos antiguos con "Dr. X" y nuevos con "X".
- **Disponibilidad:** En `obtenerDisponibilidad` y `obtenerDisponibilidadPublica` se normaliza el `doctorId` del query y se filtra por nombre normalizado, para que citas y bloqueos coincidan con el catálogo o con `doctores-data`.

### 2.3 Catálogo sin auth
- **Actual:** GET `/api/catalogo` no usa middleware `autenticar`. `CatalogoForm` hace `fetch(baseUrl + '/catalogo')` sin token.
- **Implicación:** Si en el futuro el catálogo se restringe a usuarios autenticados, habrá que cambiar el frontend para usar el cliente `api` (con auth) en lugar de `fetch` directo.

### 2.4 Disponibilidad del catálogo (resuelto)
- GET `/api/catalogo/disponibilidad` ya **delega** a la lógica real de citas: la ruta en `src/api/routes/catalogo.ts` construye un `req` con `params.sucursalId` y `query` y llama a `CitaController.obtenerDisponibilidad`, luego adapta la respuesta al formato esperado por el móvil (`disponibilidad`: array `{ hora, disponible, doctor }`).

### 2.5 Sincronización CRM (resuelto)
- **Cambio:** La página de Citas **ya no** ejecuta `sincronizarCitasDesdeCrm()` al cargar. El sync debe invocarse desde el módulo CRM o con un botón explícito.
- **Idempotencia:** POST `/crm/sync-citas` está documentado como idempotente: omite solicitudes con `CITA_SYNC:` en notas y no crea cita duplicada si ya existe una con `CRM:solicitudId` en notas.

### 2.6 Ruta mock de Next.js (resuelto)
- **Eliminado:** `frontend/app/api/citas/route.ts` fue eliminado. La Vista Lista usa solo el backend (GET `/api/citas` con `listarPaginado`).

---

## 3. Resumen de acciones recomendadas

| Prioridad | Acción |
|----------|--------|
| ~~Alta~~ | ~~Filtro por médico en Vista Lista~~ (ya implementado). |
| ~~Media~~ | ~~Catalogo disponibilidad~~ (delega a CitaController). |
| ~~Media~~ | ~~Nombres doctores~~ (normalización Dr./Dra. al guardar y filtrar). |
| ~~Baja~~ | ~~Sync CRM~~ (ya no se ejecuta al abrir Citas; idempotencia documentada). |
| ~~Baja~~ | ~~Mock Next.js~~ (eliminado `frontend/app/api/citas/route.ts`). |
| Baja     | Si el catálogo pasa a ser privado, usar cliente con auth en `CatalogoForm`. |

---

## 4. Flujo de datos actual (resumen)

```
Agenda (Día/Semana/Mes)
  → cargarCitas() → GET /api/citas/rango o GET /api/citas/sucursal/:id?fecha=
  → GET /api/pacientes/:id (por cada paciente)
  → Filtros (sucursal, doctor, estado, búsqueda) en frontend → CalendarView

Vista Lista
  → citasService.listarPaginado() → GET /api/citas?page=&pageSize=&search=&estado=&sucursalId=&medicoAsignado=&fechaInicio=&fechaFin=&sortField=&sortDirection=
  → Backend: JOIN citas + pacientes + sucursales, paginación y filtros (incl. medicoAsignado)
  → VistaLista

Nueva Cita
  → CatalogoForm: GET /api/catalogo (sucursales, doctores, servicios)
  → DisponibilidadForm: GET /api/citas/disponibilidad/:sucursalId (slots reales)
  → DatosPacienteForm → POST /api/pacientes (si nuevo) + POST /api/citas
  → medicoAsignado = nombre del doctor del catálogo
```

Con el filtro por médico en la Vista Lista, el comportamiento es coherente entre calendario y lista para todos los filtros del panel.
