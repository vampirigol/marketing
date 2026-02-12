import AsyncStorage from '@react-native-async-storage/async-storage';

export type DoctorTheme = 'light' | 'dark';

export interface DoctorProfile {
  especialidad: string;
  sucursal: string;
  consultorio: string;
  horario: {
    inicio: string;
    fin: string;
  };
  bloquesNoDisponibles: Array<{ inicio: string; fin: string }>;
  notificaciones: {
    recordatorios: boolean;
    cambiosAgenda: boolean;
    nuevosPacientes: boolean;
  };
  theme: DoctorTheme;
  accentColor: string;
  fotoUrl?: string;
}

const STORAGE_KEY = 'doctor_profile_v1';

const DEFAULT_PROFILE: DoctorProfile = {
  especialidad: 'Medicina Integral',
  sucursal: 'Valle de la Trinidad',
  consultorio: 'Consultorio 1',
  horario: { inicio: '08:00', fin: '18:00' },
  bloquesNoDisponibles: [{ inicio: '13:00', fin: '14:00' }],
  notificaciones: {
    recordatorios: true,
    cambiosAgenda: true,
    nuevosPacientes: true,
  },
  theme: 'light',
  accentColor: '#2563eb',
  fotoUrl: '',
};

export const getDoctorProfile = async (): Promise<DoctorProfile> => {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_PROFILE;
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(saved) } as DoctorProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveDoctorProfile = async (profile: DoctorProfile): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};
