import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MobileOperationScreen } from './src/screens/MobileOperationScreen';
import { clearStoredAuthToken, loadStoredAuthToken } from './src/api/client';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const useMobileExperience = shouldUseMobileExperience();

  useEffect(() => {
    let active = true;
    loadStoredAuthToken()
      .then((token) => {
        if (active && token) {
          setAuthenticated(true);
        }
      })
      .finally(() => {
        if (active) {
          setBootstrapped(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await clearStoredAuthToken();
    setAuthenticated(false);
  }

  if (!bootstrapped) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {authenticated ? (
        useMobileExperience ? <MobileOperationScreen onLoggedOut={logout} /> : <HomeScreen onLoggedOut={logout} />
      ) : (
        <LoginScreen onAuthenticated={() => setAuthenticated(true)} />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

function shouldUseMobileExperience() {
  const appArea = process.env.EXPO_PUBLIC_APP_AREA;
  if (appArea === 'mobile') return true;
  if (appArea === 'web') return false;
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(userAgent);
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrowViewport = window.innerWidth <= 768;

  return mobileUserAgent || (coarsePointer && narrowViewport);
}
