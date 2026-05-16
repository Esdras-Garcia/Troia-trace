import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiHealth, getApiHealth } from '../api/client';

type RequestState =
  | { status: 'loading' }
  | { status: 'success'; data: ApiHealth }
  | { status: 'error'; message: string };

export function HomeScreen() {
  const [state, setState] = useState<RequestState>({ status: 'loading' });

  async function loadHealth() {
    setState({ status: 'loading' });

    try {
      const data = await getApiHealth();
      setState({ status: 'success', data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({ status: 'error', message });
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Hackathon</Text>
        <Text style={styles.subtitle}>Aplicativo mobile conectado a API Java e PostgreSQL.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Status da API</Text>

        {state.status === 'loading' && (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.body}>Consultando backend...</Text>
          </View>
        )}

        {state.status === 'success' && (
          <View style={styles.stack}>
            <Text style={styles.statusOk}>{state.data.status}</Text>
            <Text style={styles.body}>Servico: {state.data.service}</Text>
            <Text style={styles.body}>Atualizado em: {new Date(state.data.timestamp).toLocaleString()}</Text>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.stack}>
            <Text style={styles.statusError}>OFFLINE</Text>
            <Text style={styles.body}>{state.message}</Text>
          </View>
        )}

        <Pressable style={styles.button} onPress={loadHealth}>
          <Text style={styles.buttonText}>Atualizar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 8,
    marginTop: 24,
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  panelTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stack: {
    gap: 8,
  },
  body: {
    color: '#334155',
    fontSize: 15,
  },
  statusOk: {
    color: '#15803d',
    fontSize: 20,
    fontWeight: '800',
  },
  statusError: {
    color: '#b91c1c',
    fontSize: 20,
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
