export type Locale = 'es' | 'en';

export const translations = {
  es: {
    // Navegación
    nav: {
      inicio: 'Inicio',
      agenda: 'Agenda',
      citas: 'Citas',
      pacientes: 'Pacientes',
      mensajes: 'Mensajes',
      perfil: 'Perfil',
      config: 'Config',
    },
    // Agenda
    agenda: {
      titulo: 'Agenda del día',
      diaria: 'Diaria',
      semanal: 'Semanal',
      mensual: 'Mensual',
      actualizar: 'Actualizar',
      sinCitas: 'Sin citas para este día',
      cargando: 'Cargando citas...',
      verPaciente: 'Ver paciente',
      notaClinica: 'Nota clínica',
      telemedicina: 'Telemedicina',
      confirmar: 'Confirmar',
      reagendar: 'Reagendar',
      cancelar: 'Cancelar',
    },
    // Citas
    citas: {
      titulo: 'Citas de la semana',
      sinCitas: 'Sin citas programadas',
      cargando: 'Cargando citas...',
    },
    // Pacientes
    pacientes: {
      titulo: 'Pacientes recientes',
      sinPacientes: 'Sin pacientes recientes',
      verFicha: 'Ver ficha',
    },
    // Mensajes
    mensajes: {
      titulo: 'Conversaciones',
      buscar: 'Buscar',
      todos: 'Todos',
      sinConversaciones: 'Sin conversaciones activas',
      escribeMensaje: 'Escribe un mensaje',
      enviar: 'Enviar',
      volver: 'Volver',
    },
    // Perfil
    perfil: {
      titulo: 'Perfil',
      actualizarFoto: 'Actualizar foto (URL)',
      guardarFoto: 'Guardar foto',
      cambiarPassword: 'Cambiar contraseña',
      actual: 'Actual',
      nueva: 'Nueva',
      confirmar: 'Confirmar',
      actualizarPassword: 'Actualizar contraseña',
      cerrarSesion: 'Cerrar sesión',
    },
    // Configuración
    config: {
      titulo: 'Configuración',
      notificaciones: 'Notificaciones',
      tema: 'Tema',
      claro: 'Claro',
      oscuro: 'Oscuro',
      idioma: 'Idioma',
      tamanoTexto: 'Tamaño de texto',
      pequeno: 'Pequeño',
      normal: 'Normal',
      grande: 'Grande',
      altoContraste: 'Alto contraste',
      bloqueos: 'Bloqueos de agenda',
      fechaEspecifica: 'Fecha específica',
      semanal: 'Semanal',
      personal: 'Personal',
      vacaciones: 'Vacaciones',
      comida: 'Comida',
      urgencia: 'Urgencia',
      otro: 'Otro',
      motivo: 'Motivo (opcional)',
      guardarBloqueo: 'Guardar bloqueo',
      sinBloqueos: 'Sin bloqueos registrados',
      eliminar: 'Eliminar',
    },
    // KPIs
    kpi: {
      total: 'Total',
      confirmadas: 'Confirmadas',
      atendidas: 'Atendidas',
      canceladas: 'Canceladas',
    },
    // General
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
      modoOffline: 'Trabajando offline (datos locales)',
    },
  },
  en: {
    // Navigation
    nav: {
      inicio: 'Home',
      agenda: 'Schedule',
      citas: 'Appointments',
      pacientes: 'Patients',
      mensajes: 'Messages',
      perfil: 'Profile',
      config: 'Settings',
    },
    // Schedule
    agenda: {
      titulo: "Today's Schedule",
      diaria: 'Daily',
      semanal: 'Weekly',
      mensual: 'Monthly',
      actualizar: 'Refresh',
      sinCitas: 'No appointments for this day',
      cargando: 'Loading appointments...',
      verPaciente: 'View patient',
      notaClinica: 'Clinical note',
      telemedicina: 'Telemedicine',
      confirmar: 'Confirm',
      reagendar: 'Reschedule',
      cancelar: 'Cancel',
    },
    // Appointments
    citas: {
      titulo: "Week's appointments",
      sinCitas: 'No scheduled appointments',
      cargando: 'Loading appointments...',
    },
    // Patients
    pacientes: {
      titulo: 'Recent patients',
      sinPacientes: 'No recent patients',
      verFicha: 'View record',
    },
    // Messages
    mensajes: {
      titulo: 'Conversations',
      buscar: 'Search',
      todos: 'All',
      sinConversaciones: 'No active conversations',
      escribeMensaje: 'Type a message',
      enviar: 'Send',
      volver: 'Back',
    },
    // Profile
    perfil: {
      titulo: 'Profile',
      actualizarFoto: 'Update photo (URL)',
      guardarFoto: 'Save photo',
      cambiarPassword: 'Change password',
      actual: 'Current',
      nueva: 'New',
      confirmar: 'Confirm',
      actualizarPassword: 'Update password',
      cerrarSesion: 'Sign out',
    },
    // Settings
    config: {
      titulo: 'Settings',
      notificaciones: 'Notifications',
      tema: 'Theme',
      claro: 'Light',
      oscuro: 'Dark',
      idioma: 'Language',
      tamanoTexto: 'Text size',
      pequeno: 'Small',
      normal: 'Normal',
      grande: 'Large',
      altoContraste: 'High contrast',
      bloqueos: 'Schedule blocks',
      fechaEspecifica: 'Specific date',
      semanal: 'Weekly',
      personal: 'Personal',
      vacaciones: 'Vacation',
      comida: 'Lunch',
      urgencia: 'Emergency',
      otro: 'Other',
      motivo: 'Reason (optional)',
      guardarBloqueo: 'Save block',
      sinBloqueos: 'No blocks registered',
      eliminar: 'Delete',
    },
    // KPIs
    kpi: {
      total: 'Total',
      confirmadas: 'Confirmed',
      atendidas: 'Attended',
      canceladas: 'Cancelled',
    },
    // General
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
      modoOffline: 'Working offline (local data)',
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
