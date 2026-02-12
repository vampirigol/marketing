import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../App';
import { limpiarToken, obtenerUsuarioActual, UsuarioAuth } from '../lib/auth.service';
import { citasService } from '../lib/citas.service';
import { DoctorProfile, getDoctorProfile } from '../lib/doctor-profile.service';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorHome'>;

export default function DoctorHomeScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<DoctorProfile | null>(null);
  const [agendaHoy, setAgendaHoy] = useState<any[]>([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cargarUsuario = async () => {
      try {
        const data = await obtenerUsuarioActual();
        if (isMounted) {
          setUsuario(data);
        }
      } catch {
        if (isMounted) {
          navigation.replace('DoctorLogin');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void cargarUsuario();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    const cargarPerfil = async () => {
      const data = await getDoctorProfile();
      if (isMounted) {
        setPerfil(data);
      }
    };
    void cargarPerfil();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!usuario) return;
    void cargarAgendaHoy();
  }, [usuario]);

  const cerrarSesion = async () => {
    await limpiarToken();
    navigation.replace('DoctorLogin');
  };

  const initials = getInitials(usuario?.nombreCompleto || usuario?.username || 'Doctor');
  const theme = perfil?.theme || 'light';
  const accent = perfil?.accentColor || '#2563eb';
  const themePalette = getThemePalette(theme);

  const agendaResumen = useMemo(() => {
    const total = agendaHoy.length;
    const pendientes = agendaHoy.filter((cita) =>
      ['Agendada', 'Pendiente_Confirmacion'].includes(cita.estado)
    ).length;
    return { total, pendientes };
  }, [agendaHoy]);

  const cargarAgendaHoy = async () => {
    if (!usuario) return;
    try {
      setCargandoAgenda(true);
      const fecha = formatearFecha(new Date());
      const data = await citasService.obtenerPorDoctorYFecha({
        medico: usuario.nombreCompleto || usuario.username || 'Doctor',
        fecha,
      });
      setAgendaHoy(data || []);
    } catch {
      setAgendaHoy([]);
    } finally {
      setCargandoAgenda(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themePalette.bg }]}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: themePalette.text }]}>Panel de Doctores</Text>
            {usuario?.nombreCompleto ? (
              <Text style={styles.subtitle}>{usuario.nombreCompleto}</Text>
            ) : null}
            {usuario?.rol ? (
              <Text style={styles.role}>{usuario.rol}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('DoctorProfile')}
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>Perfil</Text>
          </Pressable>
          <Pressable onPress={cerrarSesion} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: themePalette.card }]}>
        <Text style={[styles.cardTitle, { color: themePalette.text }]}>Atajos</Text>
        <View style={styles.shortcutRow}>
          <Pressable
            style={[styles.shortcutButton, { borderColor: accent }]}
            onPress={() => navigation.navigate('DoctorAgenda')}
          >
            <Text style={[styles.shortcutText, { color: accent }]}>Agenda</Text>
          </Pressable>
          <Pressable
            style={[styles.shortcutButton, { borderColor: accent }]}
            onPress={() => Alert.alert('Pacientes', 'Seccion en preparacion')}
          >
            <Text style={[styles.shortcutText, { color: accent }]}>Pacientes</Text>
          </Pressable>
          <Pressable
            style={[styles.shortcutButton, { borderColor: accent }]}
            onPress={() => Alert.alert('Recetas', 'Seccion en preparacion')}
          >
            <Text style={[styles.shortcutText, { color: accent }]}>Recetas</Text>
          </Pressable>
          <Pressable
            style={[styles.shortcutButton, { borderColor: accent }]}
            onPress={() => Alert.alert('Estudios', 'Seccion en preparacion')}
          >
            <Text style={[styles.shortcutText, { color: accent }]}>Estudios</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: themePalette.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: themePalette.text }]}>Agenda</Text>
          <Pressable
            style={styles.cardAction}
            onPress={() => navigation.navigate('DoctorAgenda')}
          >
            <Text style={styles.cardActionText}>Ver agenda</Text>
          </Pressable>
        </View>
        <Text style={styles.cardBody}>
          Lista de citas por dia con detalle de pacientes.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: themePalette.card }]}>
        <Text style={[styles.cardTitle, { color: themePalette.text }]}>Vista rapida</Text>
        <View style={styles.quickRow}>
          <View style={styles.quickBox}>
            <Text style={styles.quickNumber}>{agendaResumen.total}</Text>
            <Text style={styles.quickLabel}>Citas hoy</Text>
          </View>
          <View style={styles.quickBox}>
            <Text style={styles.quickNumber}>{agendaResumen.pendientes}</Text>
            <Text style={styles.quickLabel}>Pendientes</Text>
          </View>
          <View style={styles.quickBox}>
            <Text style={styles.quickNumber}>{agendaHoy.length > 0 ? 1 : 0}</Text>
            <Text style={styles.quickLabel}>Proxima</Text>
          </View>
        </View>
        {cargandoAgenda ? (
          <Text style={styles.cardBody}>Actualizando agenda...</Text>
        ) : (
          agendaHoy.slice(0, 3).map((cita, index) => (
            <Text key={`${cita.id || index}`} style={styles.cardBody}>
              {cita.horaCita} - {cita.pacienteNombre || 'Paciente'} ({cita.estado})
            </Text>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: themePalette.card }]}>
        <Text style={[styles.cardTitle, { color: themePalette.text }]}>Horario habitual</Text>
        <Text style={styles.cardBody}>
          {perfil?.horario?.inicio || '08:00'} - {perfil?.horario?.fin || '18:00'}
        </Text>
        <Text style={[styles.cardTitle, { color: themePalette.text, marginTop: 8 }]}>
          Bloques no disponibles
        </Text>
        {(perfil?.bloquesNoDisponibles || []).map((block, index) => (
          <Text key={`${block.inicio}-${block.fin}-${index}`} style={styles.cardBody}>
            {block.inicio} - {block.fin}
          </Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: themePalette.card }]}>
        <Text style={[styles.cardTitle, { color: themePalette.text }]}>Perfil medico</Text>
        <Text style={styles.cardBody}>Especialidad: {perfil?.especialidad || '-'}</Text>
        <Text style={styles.cardBody}>Sucursal: {perfil?.sucursal || '-'}</Text>
        <Text style={styles.cardBody}>Consultorio: {perfil?.consultorio || '-'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: themePalette.card }]}>
        <Text style={[styles.cardTitle, { color: themePalette.text }]}>Preferencias</Text>
        <Text style={styles.cardBody}>
          Notificaciones: recordatorios ({perfil?.notificaciones?.recordatorios ? 'si' : 'no'}),
          cambios de agenda ({perfil?.notificaciones?.cambiosAgenda ? 'si' : 'no'}),
          nuevos pacientes ({perfil?.notificaciones?.nuevosPacientes ? 'si' : 'no'}).
        </Text>
        <Text style={styles.cardBody}>
          Tema: {perfil?.theme || 'light'} · Color: {perfil?.accentColor || accent}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#4b5563',
  },
  role: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  profileButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#eef2f7',
  },
  profileButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4b5563',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#eef2f7',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardBody: {
    fontSize: 14,
    color: '#4b5563',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickBox: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  quickLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  shortcutButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatearFecha = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
