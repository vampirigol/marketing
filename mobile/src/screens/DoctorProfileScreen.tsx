import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../App';
import {
  DoctorProfile,
  getDoctorProfile,
  saveDoctorProfile,
} from '../lib/doctor-profile.service';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorProfile'>;

export default function DoctorProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const data = await getDoctorProfile();
      if (isMounted) {
        setProfile(data);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const name = profile?.especialidad || 'Doctor';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'DR';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [profile?.especialidad]);

  const onSave = async () => {
    if (!profile) return;
    await saveDoctorProfile(profile);
    Alert.alert('Perfil', 'Perfil guardado');
    navigation.goBack();
  };

  const onPickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso', 'Se requiere acceso a fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri && profile) {
      setProfile({ ...profile, fotoUrl: result.assets[0].uri });
    }
  };
  const addBlock = () => {
    if (!profile) return;
    if (!blockStart || !blockEnd) {
      Alert.alert('Bloque', 'Completa inicio y fin');
      return;
    }
    setProfile({
      ...profile,
      bloquesNoDisponibles: [
        ...profile.bloquesNoDisponibles,
        { inicio: blockStart, fin: blockEnd },
      ],
    });
    setBlockStart('');
    setBlockEnd('');
  };

  const removeBlock = (index: number) => {
    if (!profile) return;
    const updated = profile.bloquesNoDisponibles.filter((_, i) => i !== index);
    setProfile({ ...profile, bloquesNoDisponibles: updated });
  };

  const setAccentColor = (color: string) => {
    if (!profile) return;
    setProfile({ ...profile, accentColor: color });
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const accent = profile.accentColor || '#2563eb';
  const themeBg = profile.theme === 'dark' ? '#0f172a' : '#f6f7fb';
  const cardBg = profile.theme === 'dark' ? '#111827' : '#ffffff';
  const textColor = profile.theme === 'dark' ? '#f9fafb' : '#111827';

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeBg }]}>
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: accent }]}>
          {profile.fotoUrl ? (
            <Image source={{ uri: profile.fotoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Perfil del doctor</Text>
          <Text style={styles.subtitle}>Personaliza tu agenda y preferencias</Text>
        </View>
        <Pressable style={[styles.saveButton, { backgroundColor: accent }]} onPress={onSave}>
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Datos generales</Text>
        <Pressable style={styles.photoButton} onPress={onPickImage}>
          <Text style={styles.photoButtonText}>Cambiar foto de perfil</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Especialidad"
          value={profile.especialidad}
          onChangeText={(value) => setProfile({ ...profile, especialidad: value })}
        />
        <TextInput
          style={styles.input}
          placeholder="Sucursal"
          value={profile.sucursal}
          onChangeText={(value) => setProfile({ ...profile, sucursal: value })}
        />
        <TextInput
          style={styles.input}
          placeholder="Consultorio"
          value={profile.consultorio}
          onChangeText={(value) => setProfile({ ...profile, consultorio: value })}
        />
      </View>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Horario habitual</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Inicio (08:00)"
            value={profile.horario.inicio}
            onChangeText={(value) =>
              setProfile({ ...profile, horario: { ...profile.horario, inicio: value } })
            }
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Fin (18:00)"
            value={profile.horario.fin}
            onChangeText={(value) =>
              setProfile({ ...profile, horario: { ...profile.horario, fin: value } })
            }
          />
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>Bloques no disponibles</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Inicio"
            value={blockStart}
            onChangeText={setBlockStart}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Fin"
            value={blockEnd}
            onChangeText={setBlockEnd}
          />
        </View>
        <Pressable style={styles.addButton} onPress={addBlock}>
          <Text style={styles.addButtonText}>Agregar bloque</Text>
        </Pressable>
        {profile.bloquesNoDisponibles.map((block, index) => (
          <View key={`${block.inicio}-${block.fin}-${index}`} style={styles.blockRow}>
            <Text style={styles.blockText}>
              {block.inicio} - {block.fin}
            </Text>
            <Pressable onPress={() => removeBlock(index)}>
              <Text style={styles.removeText}>Quitar</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Notificaciones</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: textColor }]}>Recordatorios</Text>
          <Switch
            value={profile.notificaciones.recordatorios}
            onValueChange={(value) =>
              setProfile({
                ...profile,
                notificaciones: { ...profile.notificaciones, recordatorios: value },
              })
            }
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: textColor }]}>Cambios de agenda</Text>
          <Switch
            value={profile.notificaciones.cambiosAgenda}
            onValueChange={(value) =>
              setProfile({
                ...profile,
                notificaciones: { ...profile.notificaciones, cambiosAgenda: value },
              })
            }
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: textColor }]}>Nuevos pacientes</Text>
          <Switch
            value={profile.notificaciones.nuevosPacientes}
            onValueChange={(value) =>
              setProfile({
                ...profile,
                notificaciones: { ...profile.notificaciones, nuevosPacientes: value },
              })
            }
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Tema y color</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: textColor }]}>Modo oscuro</Text>
          <Switch
            value={profile.theme === 'dark'}
            onValueChange={(value) => setProfile({ ...profile, theme: value ? 'dark' : 'light' })}
          />
        </View>
        <View style={styles.colorRow}>
          {['#2563eb', '#7c3aed', '#059669', '#f97316', '#0f766e'].map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color, borderColor: color === accent ? '#111827' : 'transparent' },
              ]}
              onPress={() => setAccentColor(color)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#eef2f7',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
  },
  photoButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2f7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
  },
  blockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  blockText: {
    color: '#111827',
    fontSize: 12,
  },
  removeText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 13,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
});
