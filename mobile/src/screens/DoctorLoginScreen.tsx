import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import { guardarToken, login, obtenerUsuarioActual } from '../lib/auth.service';
import { API_BASE_URL } from '../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorLogin'>;

export default function DoctorLoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const logoUri = `${API_BASE_URL}/assets/logo-adventistas.png`;

  useEffect(() => {
    let isMounted = true;
    const verificarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          const usuario = await obtenerUsuarioActual();
          if (isMounted) {
            if (usuario.rol === 'Medico') {
              navigation.replace('DoctorHome');
              return;
            }
            if (usuario.rol === 'Recepcion' || usuario.rol === 'Admin') {
              navigation.replace('BranchPortal');
              return;
            }
            navigation.replace('DoctorHome');
            return;
          }
        }
      } catch {
        // Si falla, se queda en login.
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    void verificarSesion();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  const onSubmit = async () => {
    if (!username || !password) {
      setError('Usuario y password son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await login({ username, password });
      await guardarToken(response.token);
      if (response.usuario.rol === 'Medico') {
        navigation.replace('DoctorHome');
        return;
      }
      if (response.usuario.rol === 'Recepcion' || response.usuario.rol === 'Admin') {
        navigation.replace('BranchPortal');
        return;
      }
      setError('Esta cuenta no tiene acceso a la app');
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.error || 'Error al iniciar sesion';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Verificando sesion...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesion para continuar</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={styles.googleButton}
          onPress={() => Alert.alert('Google', 'Funcionalidad en preparacion')}
        >
          <Text style={styles.googleButtonText}>Ingresar con Google</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesion</Text>
          )}
        </Pressable>

        <View style={styles.linksRow}>
          <Pressable
            style={styles.linkButton}
            onPress={() => Alert.alert('Recuperacion', 'Funcionalidad en preparacion')}
          >
            <Text style={styles.linkText}>¿Olvidaste la contraseña?</Text>
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => Alert.alert('Registro', 'Funcionalidad en preparacion')}
          >
            <Text style={styles.linkText}>Crear una cuenta</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.publicButton}
          onPress={() => navigation.navigate('PublicHome')}
        >
          <Text style={styles.publicButtonText}>Agendar cita</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7fb',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.08)',
      },
      ios: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButton: {
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  googleButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  publicButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
  },
  publicButtonText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
