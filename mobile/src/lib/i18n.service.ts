import AsyncStorage from '@react-native-async-storage/async-storage';

export type Locale = 'es' | 'en';

export const translations = {
  es: {
    // Navegación Doctor
    doctorHome: {
      titulo: 'Inicio',
      agenda: 'Mi Agenda',
      quickView: 'Vista Rápida',
      schedule: 'Horario',
      profile: 'Mi Perfil',
      preferences: 'Preferencias',
    },
    // Agenda
    agenda: {
      titulo: 'Agenda',
      diaria: 'Diaria',
      semanal: 'Semanal',
      mensual: 'Mensual',
      actualizar: 'Actualizar',
      sinCitas: 'Sin citas',
      cargando: 'Cargando...',
    },
    // Portal Público
    publicHome: {
      titulo: 'Red de Clínicas Adventistas',
      agendarCita: 'Agendar cita',
      verRecetas: 'Ver mis recetas',
      verEstudios: 'Ver mis estudios',
      iniciarSesion: 'Iniciar sesión',
    },
    // Agendar cita
    appointment: {
      titulo: 'Agendar cita',
      paso: 'Paso',
      de: 'de',
      sucursal: 'Sucursal',
      especialidad: 'Especialidad',
      servicio: 'Servicio',
      doctor: 'Doctor',
      fecha: 'Fecha',
      horario: 'Horario',
      nombre: 'Nombre del paciente',
      correo: 'Correo',
      telefono: 'Teléfono',
      preconsulta: 'Preconsulta',
      documentos: 'Documentos previos',
      confirmacion: 'Confirmación',
      continuar: 'Continuar',
      atras: 'Atrás',
      buscarHorarios: 'Buscar horarios',
      agendarCita: 'Agendar cita',
      citaAgendada: 'Cita agendada correctamente',
      confirmarCita: 'Confirmar cita',
      horariosDisponibles: 'Horarios disponibles',
      motivo: 'Motivo de consulta (opcional)',
      sintomas: 'Síntomas principales (opcional)',
      notas: 'Notas adicionales (opcional)',
      docsHelper: 'Agrega links de resultados o documentos (uno por línea)',
      resumen: 'Resumen de la cita',
      verificar: 'Verifica que la información sea correcta',
    },
    // Login
    login: {
      titulo: 'Iniciar sesión',
      usuario: 'Usuario',
      password: 'Contraseña',
      ingresar: 'Iniciar sesión',
      ingresando: 'Ingresando...',
    },
    // Configuración
    config: {
      titulo: 'Configuración',
      tema: 'Tema',
      claro: 'Claro',
      oscuro: 'Oscuro',
      idioma: 'Idioma',
      tamanoTexto: 'Tamaño de texto',
      pequeno: 'Pequeño',
      normal: 'Normal',
      grande: 'Grande',
      altoContraste: 'Alto contraste',
    },
    // Common
    common: {
      guardar: 'Guardar',
      cancelar: 'Cancelar',
      aceptar: 'Aceptar',
      continuar: 'Continuar',
      atras: 'Atrás',
      cargando: 'Cargando...',
      error: 'Error',
      exito: 'Éxito',
      offline: 'Sin conexión',
      modoOffline: 'Modo offline (datos locales)',
      volver: 'Volver',
    },
  },
  en: {
    // Doctor Navigation
    doctorHome: {
      titulo: 'Home',
      agenda: 'My Schedule',
      quickView: 'Quick View',
      schedule: 'Schedule',
      profile: 'My Profile',
      preferences: 'Preferences',
    },
    // Schedule
    agenda: {
      titulo: 'Schedule',
      diaria: 'Daily',
      semanal: 'Weekly',
      mensual: 'Monthly',
      actualizar: 'Refresh',
      sinCitas: 'No appointments',
      cargando: 'Loading...',
    },
    // Public Portal
    publicHome: {
      titulo: 'Adventist Clinics Network',
      agendarCita: 'Book appointment',
      verRecetas: 'View prescriptions',
      verEstudios: 'View studies',
      iniciarSesion: 'Sign in',
    },
    // Book appointment
    appointment: {
      titulo: 'Book appointment',
      paso: 'Step',
      de: 'of',
      sucursal: 'Branch',
      especialidad: 'Specialty',
      servicio: 'Service',
      doctor: 'Doctor',
      fecha: 'Date',
      horario: 'Schedule',
      nombre: 'Patient name',
      correo: 'Email',
      telefono: 'Phone',
      preconsulta: 'Pre-consultation',
      documentos: 'Prior documents',
      confirmacion: 'Confirmation',
      continuar: 'Continue',
      atras: 'Back',
      buscarHorarios: 'Search times',
      agendarCita: 'Book appointment',
      citaAgendada: 'Appointment booked successfully',
      confirmarCita: 'Confirm appointment',
      horariosDisponibles: 'Available times',
      motivo: 'Reason for consultation (optional)',
      sintomas: 'Main symptoms (optional)',
      notas: 'Additional notes (optional)',
      docsHelper: 'Add links to results or documents (one per line)',
      resumen: 'Appointment summary',
      verificar: 'Verify that the information is correct',
    },
    // Login
    login: {
      titulo: 'Sign in',
      usuario: 'Username',
      password: 'Password',
      ingresar: 'Sign in',
      ingresando: 'Signing in...',
    },
    // Settings
    config: {
      titulo: 'Settings',
      tema: 'Theme',
      claro: 'Light',
      oscuro: 'Dark',
      idioma: 'Language',
      tamanoTexto: 'Text size',
      pequeno: 'Small',
      normal: 'Normal',
      grande: 'Large',
      altoContraste: 'High contrast',
    },
    // Common
    common: {
      guardar: 'Save',
      cancelar: 'Cancel',
      aceptar: 'Accept',
      continuar: 'Continue',
      atras: 'Back',
      cargando: 'Loading...',
      error: 'Error',
      exito: 'Success',
      offline: 'Offline',
      modoOffline: 'Offline mode (local data)',
      volver: 'Back',
    },
  },
};

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  for (const k of keys) {
    value = value?.[k];
    if (!value) return key;
  }
  return value || key;
}

export async function getLocale(): Promise<Locale> {
  try {
    const saved = await AsyncStorage.getItem('locale');
    if (saved === 'en' || saved === 'es') return saved;
    return 'es';
  } catch {
    return 'es';
  }
}

export async function setLocale(locale: Locale): Promise<void> {
  try {
    await AsyncStorage.setItem('locale', locale);
  } catch {
    // noop
  }
}
