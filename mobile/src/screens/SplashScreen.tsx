import { Image, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../lib/api';

export default function SplashScreen() {
  const logoUri = `${API_BASE_URL}/assets/logo-adventistas.png`;

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <View style={styles.center}>
        <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>Clínicas Adventistas</Text>
      </View>
      <Text style={styles.tagline}>Que tenga un día productivo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b2a5b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1d4ed8',
    opacity: 0.25,
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 140,
    height: 140,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.3,
  },
  tagline: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    color: '#cbd5f5',
  },
});
