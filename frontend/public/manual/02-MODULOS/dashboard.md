# Módulo Dashboard

## Descripción

Vista general del sistema: KPIs del día, embudo de atención (leads → prospectos → citas → atendidos → seguimiento), listas inteligentes (Inasistencia, En espera, Reagendamiento, Remarketing), automatizaciones activas y reglas clave. Sirve para tener una foto rápida del negocio y del contact center (Keila).

**Ruta:** Dashboard → `/dashboard`

---

## Pantalla principal

### Encabezado
- Título "Dashboard" y subtítulo "Vista general del sistema - Keila (Contact Center)".
- Texto "Última actualización: hace X minutos" (información de referencia).

### KPIs (cuatro tarjetas)
| KPI | Descripción | Nota |
|-----|-------------|------|
| **Nuevos Leads** | Cantidad de leads nuevos (ej. vs ayer, % cambio). | Indicador con flecha verde/roja. |
| **Citas Hoy** | Total de citas del día en todas las sucursales. | |
| **Conversaciones** | Conversaciones activas (contact center). | |
| **Confirmadas** | Citas confirmadas y tasa de confirmación (ej. 75%). | |

### Embudo de atención (demo)
- Barras horizontales por etapa: Leads → Prospectos → Citas → Atendidos → Seguimiento.
- Cada etapa muestra valor numérico y nota (ej. "WhatsApp + redes", "Agendadas", "Check-in").
- Texto indicando que las reglas demo están activas (confirmaciones, recordatorios, re-agendos).

### Listas inteligentes
Tarjetas con conteo y descripción:
- **Inasistencia:** no llegaron al cierre.
- **En espera:** 15 min sin check-in.
- **Reagendamiento:** con promo disponible.
- **Remarketing:** sin respuesta 7 días.

### Automatizaciones activas
Cuatro tarjetas con canal y estado "Activo":
- Confirmación T-24h (WhatsApp).
- Recordatorio T-3h (SMS).
- Reactivación T+7d (Email).
- Check-in T+15m (Recepción).

### Reglas clave
- Promoción con 1 re-agendo (segunda vez sin promoción).
- Empalmes permitidos (hasta 3 citas por hora/doctor).
- Tolerancia de llegada (15 min antes de lista de espera).
- Nota: "Demo: los cambios se reflejan en agenda y recepción."

### Columna derecha
- **Total Profit:** valor y gráfico de barras (demo).
- **Total / Nuevos / Activos:** pacientes (Total, Nuevos este mes, Activos hoy).
- **Próximas Citas:** lista con nombre, especialidad, hora, ingreso; algunas con etiqueta "Promo".
- **Día Más Activo:** gráfico circular (ej. "Mar" = martes).
- **Tasa de Retorno:** gauge (ej. 68% retorno) y botón "Show Details".
- **AI Assistant:** caja de texto "Ask me anything..." con botón de envío (demo).

---

## Botones y acciones

| Elemento | Acción |
|----------|--------|
| **1M** (en Total Profit) | Cambia escala o período del gráfico (demo). |
| **Show Details** (Tasa de Retorno) | Muestra detalle del indicador (por implementar). |
| **Botón en AI Assistant** | Envía la pregunta al asistente (demo). |

El Dashboard es principalmente **de consulta**; las acciones operativas se realizan en Recepción, Citas, CRM y Keila IA.

---

## Flujos típicos

- Revisar KPIs del día y embudo.
- Ver listas inteligentes para priorizar seguimiento (inasistencias, en espera, remarketing).
- Revisar automatizaciones y reglas activas.
- Ir a Citas o Recepción desde "Próximas Citas" o desde el menú lateral.

---

[Volver al índice de módulos](README.md) | [Visión general](../01-VISION-GENERAL.md)
