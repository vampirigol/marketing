import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t, Locale, setLocale, getLocale } from '../lib/i18n.service';

type Theme = 'light' | 'dark';
type TextSize = 'small' | 'normal' | 'large';

export default function PreferencesScreen() {
  const [theme, setTheme] = useState<Theme>('light');
  const [locale, setLocaleState] = useState<Locale>('es');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void cargarPreferencias();
  }, []);

  const cargarPreferencias = async () => {
    try {
      const [tema, idioma, tamano, contraste] = await Promise.all([
        AsyncStorage.getItem('theme'),
        getLocale(),
        AsyncStorage.getItem('textSize'),
        AsyncStorage.getItem('highContrast'),
      ]);

      if (tema === 'dark' || tema === 'light') setTheme(tema);
      setLocaleState(idioma);
      if (tamano === 'small' || tamano === 'normal' || tamano === 'large') {
        setTextSize(tamano);
      }
      if (contraste) setHighContrast(contraste === 'true');
    } catch {
      // noop
    }
  };

  const guardarTema = async (nuevoTema: Theme) => {
    try {
      setLoading(true);
      setTheme(nuevoTema);
      await AsyncStorage.setItem('theme', nuevoTema);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const guardarIdioma = async (nuevoIdioma: Locale) => {
    try {
      setLoading(true);
      setLocaleState(nuevoIdioma);
      await setLocale(nuevoIdioma);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const guardarTamano = async (nuevoTamano: TextSize) => {
    try {
      setLoading(true);
      setTextSize(nuevoTamano);
      await AsyncStorage.setItem('textSize', nuevoTamano);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const guardarContraste = async (nuevoContraste: boolean) => {
    try {
      setLoading(true);
      setHighContrast(nuevoContraste);
      await AsyncStorage.setItem('highContrast', nuevoContraste.toString());
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const baseSize =
    textSize === 'small' ? 12 : textSize === 'large' ? 18 : 14;

  const styles = getStyles(isDark, baseSize, highContrast);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(locale, 'config.titulo')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t(locale, 'config.tema')}</Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[
              styles.optionButton,
              theme === 'light' && styles.optionButtonActive,
            ]}
            onPress={() => guardarTema('light')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                theme === 'light' && styles.optionTextActive,
              ]}
            >
              {t(locale, 'config.claro')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.optionButton,
              theme === 'dark' && styles.optionButtonActive,
            ]}
            onPress={() => guardarTema('dark')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                theme === 'dark' && styles.optionTextActive,
              ]}
            >
              {t(locale, 'config.oscuro')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t(locale, 'config.idioma')}</Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[
              styles.optionButton,
              locale === 'es' && styles.optionButtonActive,
            ]}
            onPress={() => guardarIdioma('es')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                locale === 'es' && styles.optionTextActive,
              ]}
            >
              ES
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.optionButton,
              locale === 'en' && styles.optionButtonActive,
            ]}
            onPress={() => guardarIdioma('en')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                locale === 'en' && styles.optionTextActive,
              ]}
            >
              EN
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t(locale, 'config.tamanoTexto')}
        </Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[
              styles.optionButton,
              textSize === 'small' && styles.optionButtonActive,
            ]}
            onPress={() => guardarTamano('small')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                textSize === 'small' && styles.optionTextActive,
              ]}
            >
              {t(locale, 'config.pequeno')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.optionButton,
              textSize === 'normal' && styles.optionButtonActive,
            ]}
            onPress={() => guardarTamano('normal')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                textSize === 'normal' && styles.optionTextActive,
              ]}
            >
              {t(locale, 'config.normal')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.optionButton,
              textSize === 'large' && styles.optionButtonActive,
            ]}
            onPress={() => guardarTamano('large')}
            disabled={loading}
          >
            <Text
              style={[
                styles.optionText,
                textSize === 'large' && styles.optionTextActive,
              ]}
            >
              {t(locale, 'config.grande')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>
            {t(locale, 'config.altoContraste')}
          </Text>
          <Switch
            value={highContrast}
            onValueChange={guardarContraste}
            disabled={loading}
            trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
            thumbColor={highContrast ? '#fff' : '#f3f4f6'}
          />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Los cambios se aplicarán al reiniciar la aplicación.
        </Text>
      </View>
    </ScrollView>
  );
}

function getStyles(isDark: boolean, baseSize: number, highContrast: boolean) {
  const bg = isDark ? '#0f172a' : '#f1f5f9';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#64748b';
  const border = isDark ? '#475569' : '#e2e8f0';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: baseSize + 10,
      fontWeight: highContrast ? 'bold' : '600',
      color: text,
    },
    section: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: highContrast ? 2 : 1,
      borderColor: border,
    },
    sectionTitle: {
      fontSize: baseSize + 2,
      fontWeight: highContrast ? 'bold' : '600',
      color: text,
      marginBottom: 12,
    },
    optionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    optionButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: highContrast ? 2 : 1,
      borderColor: border,
      backgroundColor: isDark ? '#334155' : '#f1f5f9',
      alignItems: 'center',
    },
    optionButtonActive: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
    },
    optionText: {
      fontSize: baseSize,
      fontWeight: highContrast ? 'bold' : '500',
      color: textSecondary,
    },
    optionTextActive: {
      color: '#ffffff',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    info: {
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    infoText: {
      fontSize: baseSize - 2,
      color: textSecondary,
      textAlign: 'center',
    },
  });
}
