import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { setAuthToken } from './src/api/client';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  function logout() {
    setAuthToken(null);
    setAuthenticated(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {authenticated ? <HomeScreen onLoggedOut={logout} /> : <LoginScreen onAuthenticated={() => setAuthenticated(true)} />}
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
