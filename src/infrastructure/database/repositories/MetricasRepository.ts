import { Pool } from 'pg';

export interface KPIDiario {
  fecha: string;
  doctorId: string;
  doctorNombre: string;
  totalCitas: number;
  citasAtendidas: number;
  citasCanceladas: number;
  citasNoShow: number;
  citasPendientes: number;
  citasConfirmadas: number;
  tiempoPromedioMinutos: number;
  horasActivas: number;
  tasaAtencion: number; // porcentaje
  tasaCancelacion: number; // porcentaje
  tasaNoShow: number; // porcentaje
}

export interface AlertaSaturacion {
  fecha: string;
  hora: string;
  doctorId: string;
  doctorNombre: string;
  citasSimultaneas: number;
  capacidadMaxima: number;
  porcentajeSaturacion: number;
  nivel: 'normal' | 'alerta' | 'critico';
}

export class MetricasRepositoryPostgres {
  constructor(private pool: Pool) {}

  async obtenerKPIDiario(
    doctorId: string,
    fecha: string
  ): Promise<KPIDiario | null> {
    try {
      // Obtener información del doctor
      const doctorQuery = await this.pool.query(
        `SELECT id, nombre_completo FROM usuarios WHERE id = $1`,
        [doctorId]
      );

      if (doctorQuery.rows.length === 0) return null;

      const doctor = doctorQuery.rows[0];

      // Obtener métricas de citas
      const citasQuery = await this.pool.query(
        `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 'Atendida') as atendidas,
          COUNT(*) FILTER (WHERE estado = 'Cancelada') as canceladas,
          COUNT(*) FILTER (WHERE estado = 'No_Asistio') as no_show,
          COUNT(*) FILTER (WHERE estado = 'Pendiente') as pendientes,
          COUNT(*) FILTER (WHERE estado = 'Confirmada') as confirmadas,
          AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(hora_salida, hora_llegada + INTERVAL '30 minutes') - hora_llegada
            )) / 60
          ) FILTER (WHERE estado = 'Atendida' AND hora_llegada IS NOT NULL) as tiempo_promedio
        FROM citas
        WHERE doctor_id = $1 
          AND fecha_cita::date = $2::date
        `,
        [doctorId, fecha]
      );

      const metricas = citasQuery.rows[0];
      const total = parseInt(metricas.total || '0', 10);
      const atendidas = parseInt(metricas.atendidas || '0', 10);
      const canceladas = parseInt(metricas.canceladas || '0', 10);
      const noShow = parseInt(metricas.no_show || '0', 10);
      const pendientes = parseInt(metricas.pendientes || '0', 10);
      const confirmadas = parseInt(metricas.confirmadas || '0', 10);
      const tiempoPromedio = parseFloat(metricas.tiempo_promedio || '0');

      // Calcular horas activas
      const horasQuery = await this.pool.query(
        `
        SELECT 
          MIN(hora_cita) as primera,
          MAX(hora_cita) as ultima
        FROM citas
        WHERE doctor_id = $1 
          AND fecha_cita::date = $2::date
          AND estado != 'Cancelada'
        `,
        [doctorId, fecha]
      );

      let horasActivas = 0;
      if (horasQuery.rows[0]?.primera && horasQuery.rows[0]?.ultima) {
        const [h1, m1] = horasQuery.rows[0].primera.split(':').map(Number);
        const [h2, m2] = horasQuery.rows[0].ultima.split(':').map(Number);
        horasActivas = Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
      }

      const tasaAtencion = total > 0 ? (atendidas / total) * 100 : 0;
      const tasaCancelacion = total > 0 ? (canceladas / total) * 100 : 0;
      const tasaNoShow = total > 0 ? (noShow / total) * 100 : 0;

      return {
        fecha,
        doctorId,
        doctorNombre: doctor.nombre_completo || 'Sin nombre',
        totalCitas: total,
        citasAtendidas: atendidas,
        citasCanceladas: canceladas,
        citasNoShow: noShow,
        citasPendientes: pendientes,
        citasConfirmadas: confirmadas,
        tiempoPromedioMinutos: Math.round(tiempoPromedio),
        horasActivas: Math.round(horasActivas * 10) / 10,
        tasaAtencion: Math.round(tasaAtencion * 10) / 10,
        tasaCancelacion: Math.round(tasaCancelacion * 10) / 10,
        tasaNoShow: Math.round(tasaNoShow * 10) / 10,
      };
    } catch (error) {
      console.error('Error obteniendo KPI diario:', error);
      return null;
    }
  }

  async obtenerKPISemanal(
    doctorId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<KPIDiario[]> {
    try {
      const kpis: KPIDiario[] = [];
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      for (
        let fecha = new Date(inicio);
        fecha <= fin;
        fecha.setDate(fecha.getDate() + 1)
      ) {
        const fechaStr = fecha.toISOString().split('T')[0];
        const kpi = await this.obtenerKPIDiario(doctorId, fechaStr);
        if (kpi && kpi.totalCitas > 0) {
          kpis.push(kpi);
        }
      }

      return kpis;
    } catch (error) {
      console.error('Error obteniendo KPI semanal:', error);
      return [];
    }
  }

  async detectarSaturacion(
    doctorId: string,
    fecha: string,
    umbralAlerta: number = 80,
    umbralCritico: number = 100
  ): Promise<AlertaSaturacion[]> {
    try {
      // Obtener configuración de capacidad (asumimos 1 cita simultánea por defecto)
      const configQuery = await this.pool.query(
        `
        SELECT 
          especialidad,
          tipo_consulta,
          max_empalmes
        FROM config_consultas
        WHERE activo = true
        LIMIT 1
        `,
        []
      );

      const capacidadMaxima =
        configQuery.rows[0]?.max_empalmes || 1;

      // Agrupar citas por hora para detectar sobrecupo
      const citasQuery = await this.pool.query(
        `
        SELECT 
          hora_cita,
          COUNT(*) as cantidad
        FROM citas
        WHERE doctor_id = $1
          AND fecha_cita::date = $2::date
          AND estado NOT IN ('Cancelada', 'No_Asistio')
        GROUP BY hora_cita
        HAVING COUNT(*) > 0
        ORDER BY hora_cita
        `,
        [doctorId, fecha]
      );

      const doctorQuery = await this.pool.query(
        `SELECT nombre_completo FROM usuarios WHERE id = $1`,
        [doctorId]
      );
      const doctorNombre = doctorQuery.rows[0]?.nombre_completo || 'Sin nombre';

      const alertas: AlertaSaturacion[] = [];

      for (const row of citasQuery.rows) {
        const cantidad = parseInt(row.cantidad, 10);
        const porcentaje = (cantidad / capacidadMaxima) * 100;
        let nivel: 'normal' | 'alerta' | 'critico' = 'normal';

        if (porcentaje >= umbralCritico) {
          nivel = 'critico';
        } else if (porcentaje >= umbralAlerta) {
          nivel = 'alerta';
        }

        if (nivel !== 'normal') {
          alertas.push({
            fecha,
            hora: row.hora_cita,
            doctorId,
            doctorNombre,
            citasSimultaneas: cantidad,
            capacidadMaxima,
            porcentajeSaturacion: Math.round(porcentaje),
            nivel,
          });
        }
      }

      return alertas;
    } catch (error) {
      console.error('Error detectando saturación:', error);
      return [];
    }
  }

  async obtenerTendenciaSemanal(
    doctorId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<{
    promedioAtendidas: number;
    promedioCanceladas: number;
    promedioNoShow: number;
    promedioTiempo: number;
    tendencia: 'mejorando' | 'estable' | 'empeorando';
  }> {
    try {
      const kpis = await this.obtenerKPISemanal(doctorId, fechaInicio, fechaFin);

      if (kpis.length === 0) {
        return {
          promedioAtendidas: 0,
          promedioCanceladas: 0,
          promedioNoShow: 0,
          promedioTiempo: 0,
          tendencia: 'estable',
        };
      }

      const promedioAtendidas =
        kpis.reduce((sum, k) => sum + k.citasAtendidas, 0) / kpis.length;
      const promedioCanceladas =
        kpis.reduce((sum, k) => sum + k.citasCanceladas, 0) / kpis.length;
      const promedioNoShow =
        kpis.reduce((sum, k) => sum + k.citasNoShow, 0) / kpis.length;
      const promedioTiempo =
        kpis.reduce((sum, k) => sum + k.tiempoPromedioMinutos, 0) / kpis.length;

      // Determinar tendencia comparando primera y segunda mitad
      const mitad = Math.floor(kpis.length / 2);
      const primerasMitad = kpis.slice(0, mitad);
      const segundaMitad = kpis.slice(mitad);

      const tasaPrimera =
        primerasMitad.reduce((sum, k) => sum + k.tasaAtencion, 0) /
        primerasMitad.length;
      const tasaSegunda =
        segundaMitad.reduce((sum, k) => sum + k.tasaAtencion, 0) /
        segundaMitad.length;

      let tendencia: 'mejorando' | 'estable' | 'empeorando' = 'estable';
      if (tasaSegunda > tasaPrimera + 5) tendencia = 'mejorando';
      else if (tasaSegunda < tasaPrimera - 5) tendencia = 'empeorando';

      return {
        promedioAtendidas: Math.round(promedioAtendidas * 10) / 10,
        promedioCanceladas: Math.round(promedioCanceladas * 10) / 10,
        promedioNoShow: Math.round(promedioNoShow * 10) / 10,
        promedioTiempo: Math.round(promedioTiempo),
        tendencia,
      };
    } catch (error) {
      console.error('Error obteniendo tendencia semanal:', error);
      return {
        promedioAtendidas: 0,
        promedioCanceladas: 0,
        promedioNoShow: 0,
        promedioTiempo: 0,
        tendencia: 'estable',
      };
    }
  }
}
