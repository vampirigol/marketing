import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import DoctorHomeScreen from './src/screens/DoctorHomeScreen';
import DoctorAgendaScreen from './src/screens/DoctorAgendaScreen';
import DoctorLoginScreen from './src/screens/DoctorLoginScreen';
import DoctorProfileScreen from './src/screens/DoctorProfileScreen';
import PublicAppointmentScreen from './src/screens/PublicAppointmentScreen';
import PublicHomeScreen from './src/screens/PublicHomeScreen';
import BranchPortalScreen from './src/screens/BranchPortalScreen';
import SplashScreen from './src/screens/SplashScreen';

export type RootStackParamList = {
  DoctorLogin: undefined;
  DoctorHome: undefined;
  DoctorAgenda: undefined;
  DoctorProfile: undefined;
  PublicHome: undefined;
  PublicAppointment: undefined;
  BranchPortal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="DoctorLogin"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: styles.header,
        }}
      >
        <Stack.Screen
          name="DoctorLogin"
          component={DoctorLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DoctorHome"
          component={DoctorHomeScreen}
          options={{ title: 'Doctores' }}
        />
        <Stack.Screen
          name="DoctorAgenda"
          component={DoctorAgendaScreen}
          options={{ title: 'Agenda del dia' }}
        />
        <Stack.Screen
          name="DoctorProfile"
          component={DoctorProfileScreen}
          options={{ title: 'Perfil del doctor' }}
        />
        <Stack.Screen
          name="PublicHome"
          component={PublicHomeScreen}
          options={{ title: 'Publico' }}
        />
        <Stack.Screen
          name="PublicAppointment"
          component={PublicAppointmentScreen}
          options={{ title: 'Agendar cita' }}
        />
        <Stack.Screen
          name="BranchPortal"
          component={BranchPortalScreen}
          options={{ title: 'Portal Sucursal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
  },
});
