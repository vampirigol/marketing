# Brigadas Médicas – Modelo de datos y KPIs (según Informe Registro Brigada Médica 2025)

Referencia: informe tipo “INFORME REGISTRO BRIGADA MEDICA 2025” (ej. Brigada Ciudad Juárez).

## 1. Concepto de brigada

- **Brigada**: evento de atención médica en una **fecha/lugar** concretos (ej. “Brigada 2025 - Ciudad Juárez”).
- Los datos y KPIs deben poder **filtrarse por brigada** (y opcionalmente por rango de fechas).

## 2. Datos por registro de atención (cada fila del informe)

Cada fila representa **una atención** en la brigada:

| Campo | Descripción |
|-------|-------------|
| FECHA | Fecha del servicio |
| HORA | Hora del servicio |
| UBICACIÓN | Lugar donde se realizó |
| BRIGADA | Identificador o nombre de la brigada |
| MEDICO | Médico o profesional que atendió |
| **Paciente** | |
| PX / Paciente | Identificador o nombre del paciente |
| EDAD | Edad |
| SEXO | Sexo |
| DOMICILIO | Domicilio |
| CÓDIGO POSTAL | Código postal |
| LOCALIDAD | Localidad |
| COLONIA | Colonia |
| TIPO DE SANGRE | Tipo de sangre |
| **Signos vitales** | |
| PESO | Peso |
| ALTURA | Altura |
| IMC | Índice de masa corporal |
| TA | Tensión arterial |
| TEMP | Temperatura |
| FC | Frecuencia cardíaca |
| FR | Frecuencia respiratoria |
| GLU | Glucosa |
| **Atención** | |
| SERVICIO | Tipo de servicio |
| DIAGNÓSTICO | Diagnóstico |
| RECETA | Receta |
| MEDICAMENTOS ENTREGADOS | Medicamentos entregados |
| OBSERVACIONES | Observaciones |

## 3. Conteos por especialidad (para KPIs por brigada)

### Dentista (Odontología)

- CONSULTAS  
- EXTRACCIONES  
- RESINAS  
- PROFILAXIS  
- ENDODONCIA  

### Oftalmólogo

- PACIENTES  
- LENTES ENTREGADOS  
- VALORACIONES  

### Fisioterapeuta

- TERAPIAS  

### Nutriólogo

- CONSULTAS  

### Psicólogo

- PACIENTES  

### Espirituales (Cuidados espirituales)

- PACIENTES  

### Medicina integral

- PACIENTES (P_INTEGRAL)

## 4. Resumen por especialidad (columnas tipo P_*)

- P_INTEGRAL – Pacientes medicina integral  
- P_OFTALMOLOGIA – Pacientes oftalmología  
- P_FISIOTERAPIA – Pacientes fisioterapia  
- P_NUTRIOLOGIA – Pacientes nutrición  
- P_PSICOLOGIA – Pacientes psicología  
- P_ESPIRITUALES – Pacientes cuidados espirituales  

## 5. KPI principal

- **TOTAL ATENDIDOS**: total de pacientes atendidos en la brigada (o en el período seleccionado).

## 6. KPIs sugeridos en la sección Brigadas Médicas

1. **Total atendidos** (por brigada).  
2. **Por especialidad (pacientes)**: Medicina integral, Oftalmología, Fisioterapia, Nutrición, Psicología, Espirituales.  
3. **Odontología (desglose)**: Consultas, Extracciones, Resinas, Profilaxis, Endodoncia.  
4. **Oftalmología (desglose)**: Pacientes, Lentes entregados, Valoraciones.  
5. **Fisioterapia**: Número de terapias.  
6. **Nutrición**: Número de consultas.  
7. **Demográficos**: Rango de edad, distribución por sexo (si se registra).  
8. **Ubicación**: Localidades/colonias con más atenciones (opcional).

## 7. Selector principal en la UI

- **Brigada**: lista de brigadas (ej. “Brigada 2025 - Ciudad Juárez”). Al elegir una, todos los KPIs y tablas se filtran por esa brigada.
- Opcional: filtro por **rango de fechas** para una misma brigada o para varias.

## 8. Próximos pasos (backend)

- Tabla `brigadas` (id, nombre, ubicacion, fecha_inicio, fecha_fin, ciudad, estado, activa).  
- Tabla `brigada_atenciones` (o equivalente) con los campos del registro de atención anteriores.  
- Vistas o consultas que calculen los conteos por brigada (total atendidos, por especialidad, dentista, oftalmología, etc.) para alimentar los KPIs y reportes.
