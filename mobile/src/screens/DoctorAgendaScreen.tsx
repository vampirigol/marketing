import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import { citasService } from '../lib/citas.service';
import { obtenerUsuarioActual } from '../lib/auth.service';
import { getDoctorProfile } from '../lib/doctor-profile.service';
import { OfflineCache } from '../lib/offline-cache.service';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorAgenda'>;

type CitaItem = {
  id: string;
  horaCita: string;
  duracionMinutos?: number;
  especialidad: string;
  estado: string;
  fecha?: string;
  fechaCita?: string;
  pacienteNombre?: string;
  pacienteTelefono?: string;
  telemedicinaLink?: string;
  preconsulta?: {
    motivo?: string;
    sintomas?: string;
    notas?: string;
  };
  documentos?: Array<{ nombre?: string; url: string }>;
};

export default function DoctorAgendaScreen({ navigation }: Props) {
  const [fecha, setFecha] = useState('');
  const [medico, setMedico] = useState('');
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduleWidth, setScheduleWidth] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accent, setAccent] = useState('#2563eb');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [mostrarSelectorMes, setMostrarSelectorMes] = useState(false);
  const [selectorAnio, setSelectorAnio] = useState(new Date().getFullYear());

  const HOUR_START = 8;
  const HOUR_END = 18;
  const HOUR_HEIGHT = 80;

  useEffect(() => {
    let isMounted = true;
    const cargarMedico = async () => {
      try {
        const usuario = await obtenerUsuarioActual();
        if (isMounted) {
          setMedico(usuario.nombreCompleto || usuario.username);
          if (!fecha) {
            setFecha(formatearFecha(new Date()));
          }
        }
      } catch {
        if (isMounted) {
          navigation.replace('DoctorLogin');
        }
      }
    };

    void cargarMedico();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    const cargarTema = async () => {
      const perfil = await getDoctorProfile();
      if (isMounted) {
        setTheme(perfil.theme || 'light');
        setAccent(perfil.accentColor || '#2563eb');
      }
    };
    void cargarTema();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!fecha || !medico) return;
    void buscarCitas();
  }, [fecha, medico, viewMode]);

  useEffect(() => {
    blurActiveElement();
  }, [mostrarSelectorMes]);

  const daySwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 10,
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) < 30) return;
        const base = fecha || formatearFecha(new Date());
        const next = sumarDias(base, gesture.dx > 0 ? -1 : 1);
        setFecha(next);
      },
    })
  ).current;
  const daySwipeTimeline = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 30 && Math.abs(gesture.dy) < 15,
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) < 40) return;
        const base = fecha || formatearFecha(new Date());
        const next = sumarDias(base, gesture.dx > 0 ? -1 : 1);
        setFecha(next);
      },
    })
  ).current;

  const buscarCitas = async () => {
    const cacheKey = `${medico}_${viewMode}_${fecha}`;
    try {
      setLoading(true);
      setError('');
      let data: CitaItem[] = [];
      if (viewMode === 'daily') {
        data = await citasService.obtenerPorDoctorYFecha({
          medico,
          fecha,
        });
      } else if (viewMode === 'weekly') {
        const { inicio, fin } = rangoSemana(fecha);
        data = await citasService.obtenerPorDoctorYRango({
          medico,
          fechaInicio: inicio,
          fechaFin: fin,
        });
      } else {
        const { inicio, fin } = rangoMes(fecha);
        data = await citasService.obtenerPorDoctorYRango({
          medico,
          fechaInicio: inicio,
          fechaFin: fin,
        });
      }

      const normalizadas = (data || []).map((cita) => {
        const fechaStr =
          cita.fecha ||
          (cita.fechaCita ? String(cita.fechaCita).slice(0, 10) : '');
        return { ...cita, fecha: fechaStr } as CitaItem;
      });
      setCitas(normalizadas);
      
      // Guardar en caché para offline
      await OfflineCache.set('agenda', cacheKey, normalizadas);
    } catch (err) {
      // Intentar cargar desde caché si hay error
      const cached = await OfflineCache.get<CitaItem[]>('agenda', cacheKey);
      if (cached) {
        setCitas(cached);
        setError('Modo offline (datos locales)');
      } else {
        setError('No se pudieron cargar las citas');
      }
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = useMemo(() => obtenerSemana(fecha), [fecha]);
  const headerFecha = fecha ? formatearTitulo(fecha) : 'Agenda del dia';
  const mesAnio = useMemo(() => obtenerMesAnio(fecha), [fecha]);
  const horas = Array.from({ length: HOUR_END - HOUR_START + 1 }).map(
    (_, i) => HOUR_START + i
  );

  const eventos = useMemo(() => {
    return citas
      .map((cita) => {
        if (!cita.horaCita || cita.horaCita === '00:00') return null;
        const [h, m] = cita.horaCita.split(':').map(Number);
        const offset = (h + m / 60 - HOUR_START) * HOUR_HEIGHT;
        if (offset < 0 || h >= HOUR_END + 1) return null;
        const duracion = cita.duracionMinutos && cita.duracionMinutos > 0 ? cita.duracionMinutos : 60;
        const height = Math.max((duracion / 60) * HOUR_HEIGHT, 48);
        return { ...cita, top: offset, height };
      })
      .filter(Boolean) as Array<CitaItem & { top: number; height: number }>;
  }, [citas]);

  const semanaAgrupada = useMemo(() => agruparPorDia(citas), [citas]);

  const palette = getThemePalette(theme);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.text }]}>{headerFecha}</Text>
          <Text style={styles.subtitle}>{medico || 'Doctor'}</Text>
        </View>
        <Pressable style={[styles.refreshButton, { backgroundColor: accent }]} onPress={buscarCitas}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.refreshText}>Actualizar</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.viewRow}>
        <Pressable
          style={[
            styles.viewChip,
            viewMode === 'daily' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => setViewMode('daily')}
        >
          <Text
            style={[
              styles.viewText,
              viewMode === 'daily' && styles.viewTextActive,
            ]}
          >
            Diario
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.viewChip,
            viewMode === 'weekly' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => setViewMode('weekly')}
        >
          <Text
            style={[
              styles.viewText,
              viewMode === 'weekly' && styles.viewTextActive,
            ]}
          >
            Semanal
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.viewChip,
            viewMode === 'monthly' && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => setViewMode('monthly')}
        >
          <Text
            style={[
              styles.viewText,
              viewMode === 'monthly' && styles.viewTextActive,
            ]}
          >
            Mensual
          </Text>
        </Pressable>
      </View>

      <View style={styles.monthPickerRow}>
        <Pressable
          style={styles.monthPickerButton}
          onPress={() => {
            setFecha(cambiarMes(fecha, -1));
          }}
        >
          <Text style={styles.monthPickerButtonText}>‹</Text>
        </Pressable>
        <Pressable
          style={styles.monthPickerCenter}
          onPress={() => {
            setSelectorAnio(mesAnio.anio);
            setMostrarSelectorMes(true);
          }}
        >
          <Text style={styles.monthPickerTitle}>{`${mesAnio.mes} ${mesAnio.anio}`}</Text>
          <Text style={styles.monthPickerSubtitle}>Seleccionar mes</Text>
        </Pressable>
        <Pressable
          style={styles.monthPickerButton}
          onPress={() => {
            setFecha(cambiarMes(fecha, 1));
          }}
        >
          <Text style={styles.monthPickerButtonText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow} {...daySwipe.panHandlers}>
        {diasSemana.map((dia) => (
          <Pressable
            key={dia.value}
            style={[
              styles.dayChip,
              dia.value === fecha && styles.dayChipActive,
              dia.value === fecha && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={() => setFecha(dia.value)}
          >
            <Text
              style={[
                styles.dayLabel,
                dia.value === fecha && styles.dayLabelActive,
              ]}
            >
              {dia.label}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                dia.value === fecha && styles.dayNumberActive,
              ]}
            >
              {dia.day}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {viewMode === 'daily' ? (
        <ScrollView
          style={[styles.timeline, { backgroundColor: palette.card }]}
          {...daySwipeTimeline.panHandlers}
        >
          <View style={styles.timelineRow}>
            <View style={styles.hoursColumn}>
              {horas.map((hour) => (
                <View key={hour} style={styles.hourCell}>
                  <Text style={styles.hourText}>{`${hour}:00`}</Text>
                </View>
              ))}
            </View>
            <View
              style={styles.scheduleColumn}
              onLayout={(event) =>
                setScheduleWidth(event.nativeEvent.layout.width)
              }
            >
              {horas.map((hour) => (
                <View key={`line-${hour}`} style={styles.hourLine} />
              ))}
              {eventos.map((cita) => (
                <View
                  key={cita.id}
                  style={[
                    styles.eventCard,
                    {
                      top: cita.top,
                      height: cita.height,
                      width: scheduleWidth ? scheduleWidth - 16 : '100%',
                      backgroundColor: getEstadoStyle(cita.estado).bg,
                      borderColor: getEstadoStyle(cita.estado).border,
                    },
                  ]}
                >
                  <Text style={styles.eventTime}>{cita.horaCita}</Text>
                  <Text style={styles.eventName}>
                    {cita.pacienteNombre || 'Paciente'}
                  </Text>
                  <Text style={styles.eventMeta}>{cita.especialidad}</Text>
                  {cita.telemedicinaLink ||
                  cita.preconsulta?.motivo ||
                  cita.preconsulta?.sintomas ||
                  (cita.documentos && cita.documentos.length > 0) ? (
                    <Text style={styles.eventTelemed}>
                      {cita.telemedicinaLink ? 'Telemedicina' : 'Preconsulta'}
                      {cita.documentos && cita.documentos.length > 0
                        ? ` · Docs: ${cita.documentos.length}`
                        : ''}
                    </Text>
                  ) : null}
                  <Text style={styles.eventState}>
                    {formatearEstado(cita.estado)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {!loading && eventos.length === 0 ? (
            <Text style={styles.empty}>Sin citas</Text>
          ) : null}
        </ScrollView>
      ) : null}

      {viewMode === 'weekly' ? (
        <ScrollView style={[styles.timeline, { backgroundColor: palette.card }]}>
          <View style={styles.weekGrid}>
            {diasSemana.map((dia) => {
              const citasDia = semanaAgrupada[dia.value] || [];
              return (
                <View key={`week-${dia.value}`} style={styles.weekDayCard}>
                  <View style={styles.weekDayHeader}>
                    <View style={[styles.weekDot, { backgroundColor: accent }]} />
                    <Text style={styles.weekDayTitle}>
                      {dia.label} {dia.day}
                    </Text>
                    <Text style={styles.weekCount}>{citasDia.length}</Text>
                  </View>
                  {citasDia.length === 0 ? (
                    <Text style={styles.weekEmpty}>Sin citas</Text>
                  ) : (
                    citasDia.slice(0, 3).map((cita, index) => (
                      <View key={`${cita.id}-${index}`} style={styles.weekCard}>
                        <Text style={styles.weekTime}>{cita.horaCita}</Text>
                        <Text style={styles.weekName}>
                          {cita.pacienteNombre || 'Paciente'}
                        </Text>
                        <Text style={styles.weekMeta}>{cita.especialidad}</Text>
                        {cita.telemedicinaLink ||
                        cita.preconsulta?.motivo ||
                        cita.preconsulta?.sintomas ||
                        (cita.documentos && cita.documentos.length > 0) ? (
                          <Text style={styles.weekTelemed}>
                            {cita.telemedicinaLink ? 'Telemedicina' : 'Preconsulta'}
                            {cita.documentos && cita.documentos.length > 0
                              ? ` · Docs: ${cita.documentos.length}`
                              : ''}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  )}
                  {citasDia.length > 3 ? (
                    <Text style={styles.weekMore}>+{citasDia.length - 3} mas</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {viewMode === 'monthly' ? (
        <ScrollView style={[styles.timeline, { backgroundColor: palette.card }]}>
          <View style={styles.monthHeaderRow}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.monthHeaderText}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {obtenerMesConOffset(fecha).map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.monthCellEmpty} />;
              }
              const count = semanaAgrupada[day.value]?.length || 0;
              return (
                <Pressable
                  key={day.value}
                  style={[
                    styles.monthCell,
                    day.value === fecha && { borderColor: accent },
                  ]}
                  onPress={() => setFecha(day.value)}
                >
                  <Text style={styles.monthDay}>{day.label}</Text>
                  {count > 0 ? (
                    <View style={[styles.monthBadge, { backgroundColor: accent }]}>
                      <Text style={styles.monthBadgeText}>{count}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      <Modal animationType="fade" transparent visible={mostrarSelectorMes}>
        <View style={styles.monthModalBackdrop}>
          <View style={styles.monthModalCard}>
            <Text style={styles.monthModalTitle}>Seleccionar mes</Text>
            <View style={styles.monthYearRow}>
              <Pressable
                style={styles.monthYearButton}
                onPress={() => setSelectorAnio((prev) => prev - 1)}
              >
                <Text style={styles.monthYearButtonText}>−</Text>
              </Pressable>
              <Text style={styles.monthYearText}>{selectorAnio}</Text>
              <Pressable
                style={styles.monthYearButton}
                onPress={() => setSelectorAnio((prev) => prev + 1)}
              >
                <Text style={styles.monthYearButtonText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.monthGrid}>
              {MESES.map((mes, index) => (
                <Pressable
                  key={mes}
                  style={[
                    styles.monthChip,
                    mesAnio.indiceMes === index && selectorAnio === mesAnio.anio && styles.monthChipActive,
                  ]}
                  onPress={() => {
                    setFecha(actualizarMesAnio(fecha, index, selectorAnio));
                    setMostrarSelectorMes(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthChipText,
                      mesAnio.indiceMes === index && selectorAnio === mesAnio.anio && styles.monthChipTextActive,
                    ]}
                  >
                    {mes}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.monthModalClose} onPress={() => setMostrarSelectorMes(false)}>
              <Text style={styles.monthModalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const formatearFecha = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const obtenerSemana = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());

  const labels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label,
      day: String(date.getDate()).padStart(2, '0'),
      value: formatearFecha(date),
    };
  });
};

const obtenerMes = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const dias: Array<{ label: string; value: string }> = [];
  for (let day = 1; day <= last.getDate(); day++) {
    const date = new Date(base.getFullYear(), base.getMonth(), day);
    dias.push({ label: String(day), value: formatearFecha(date) });
  }
  return dias;
};

const obtenerMesConOffset = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const startDay = first.getDay(); // domingo=0
  const days = obtenerMes(fecha);
  const prefix = Array.from({ length: startDay }).map(() => null);
  return [...prefix, ...days];
};

const rangoSemana = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { inicio: formatearFecha(start), fin: formatearFecha(end) };
};

const rangoMes = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { inicio: formatearFecha(start), fin: formatearFecha(end) };
};

const formatearTitulo = (fecha: string) => {
  const date = parseLocalDate(fecha);
  const month = date.toLocaleString('es-MX', { month: 'long' });
  return `${month.charAt(0).toUpperCase() + month.slice(1)}, ${date.getFullYear()}`;
};

const parseLocalDate = (fecha?: string) => {
  if (!fecha) return new Date();
  const [yyyy, mm, dd] = fecha.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const sumarDias = (fecha: string, delta: number) => {
  const base = parseLocalDate(fecha);
  base.setDate(base.getDate() + delta);
  return formatearFecha(base);
};

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const obtenerMesAnio = (fecha: string) => {
  const base = parseLocalDate(fecha);
  const indiceMes = base.getMonth();
  return { mes: MESES[indiceMes], anio: base.getFullYear(), indiceMes };
};

const actualizarMesAnio = (fecha: string, mes: number, anio: number) => {
  const base = parseLocalDate(fecha);
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const dia = Math.min(base.getDate(), ultimoDia);
  return formatearFecha(new Date(anio, mes, dia));
};

const cambiarMes = (fecha: string, delta: number) => {
  const base = parseLocalDate(fecha);
  const anio = base.getFullYear();
  const mes = base.getMonth();
  const nuevo = new Date(anio, mes + delta, 1);
  return actualizarMesAnio(fecha, nuevo.getMonth(), nuevo.getFullYear());
};

const formatearEstado = (estado: string) =>
  estado.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const getEstadoStyle = (estado: string) => {
  switch (estado) {
    case 'Confirmada':
      return { bg: '#dcfce7', border: '#86efac' };
    case 'Agendada':
      return { bg: '#dbeafe', border: '#bfdbfe' };
    case 'En_Consulta':
    case 'En_Atencion':
      return { bg: '#fef9c3', border: '#fde047' };
    case 'No_Asistio':
    case 'Cancelada':
      return { bg: '#fee2e2', border: '#fecaca' };
    case 'Reagendada':
      return { bg: '#ede9fe', border: '#c4b5fd' };
    default:
      return { bg: '#e5e7eb', border: '#d1d5db' };
  }
};

const getThemePalette = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      bg: '#0f172a',
      card: '#111827',
      text: '#f9fafb',
    };
  }
  return {
    bg: '#f6f7fb',
    card: '#ffffff',
    text: '#111827',
  };
};

const blurActiveElement = () => {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  const active = document.activeElement as HTMLElement | null;
  active?.blur?.();
};

const agruparPorDia = (citas: CitaItem[]) => {
  const grouped: Record<string, CitaItem[]> = {};
  citas.forEach((cita) => {
    const key = cita.fecha || (cita.fechaCita ? String(cita.fechaCita).slice(0, 10) : '');
    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cita);
  });
  return grouped;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f6f7fb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    color: '#4b5563',
  },
  refreshButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  refreshText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayChip: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: 44,
  },
  dayChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dayLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  dayLabelActive: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  dayNumberActive: {
    color: '#ffffff',
  },
  error: {
    color: '#dc2626',
    marginBottom: 8,
  },
  timeline: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  viewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  viewChip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  viewTextActive: {
    color: '#ffffff',
  },
  timelineRow: {
    flexDirection: 'row',
  },
  hoursColumn: {
    width: 52,
  },
  hourCell: {
    height: 80,
    justifyContent: 'flex-start',
  },
  hourText: {
    fontSize: 11,
    color: '#6b7280',
  },
  scheduleColumn: {
    flex: 1,
    position: 'relative',
    paddingLeft: 12,
  },
  hourLine: {
    height: 80,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
  },
  eventCard: {
    position: 'absolute',
    left: 0,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  eventTime: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  eventName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  eventMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  eventTelemed: {
    fontSize: 10,
    color: '#0f766e',
    marginTop: 2,
    fontWeight: '600',
  },
  eventState: {
    fontSize: 10,
    color: '#374151',
    marginTop: 4,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 16,
    paddingBottom: 12,
  },
  weekGrid: {
    gap: 10,
  },
  weekDayCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weekDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekDayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  weekCount: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  weekCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
  },
  weekTime: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
  },
  weekName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  weekMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  weekTelemed: {
    fontSize: 10,
    color: '#0f766e',
    marginTop: 2,
    fontWeight: '600',
  },
  weekEmpty: {
    color: '#9ca3af',
    fontSize: 11,
  },
  weekMore: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '600',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  monthHeaderText: {
    width: 36,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: 36,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  monthCellEmpty: {
    width: 36,
    height: 44,
  },
  monthDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  monthBadge: {
    marginTop: 2,
    minWidth: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  monthBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
  },
  monthPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  monthPickerButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  monthPickerButtonText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },
  monthPickerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthPickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  monthPickerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  monthModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  monthModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  monthModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  monthYearButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  monthChip: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  monthChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  monthChipTextActive: {
    color: '#ffffff',
  },
  monthModalClose: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  monthModalCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});
