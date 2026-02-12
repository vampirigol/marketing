import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicHome'>;

export default function PublicHomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portal Publico</Text>
      <Text style={styles.subtitle}>Agendar, recetas y estudios</Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => navigation.navigate('PublicAppointment')}
      >
        <Text style={styles.primaryButtonText}>Agendar cita</Text>
      </Pressable>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('DoctorLogin')}
      >
        <Text style={styles.secondaryButtonText}>Iniciar sesion</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recetas</Text>
        <Text style={styles.cardBody}>
          Acceso rapido a recetas activas y vencidas.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estudios</Text>
        <Text style={styles.cardBody}>
          Resultados, adjuntos y seguimiento clinico.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f6f7fb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#4b5563',
  },
});
