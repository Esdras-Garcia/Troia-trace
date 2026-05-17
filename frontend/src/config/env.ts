import { NativeModules, Platform } from 'react-native';

function extractHost(value?: string | null) {
  return value?.match(/^[a-z][a-z0-9+.-]*:\/\/([^/:]+)/i)?.[1] ?? '';
}

function readExpoHost() {
  const sourceCode = NativeModules.SourceCode as { scriptURL?: string } | undefined;
  return extractHost(sourceCode?.scriptURL);
}

function resolveApiUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || '8085';
  if (Platform.OS === 'web') return `http://localhost:${port}`;

  const configuredHost = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (configuredHost) return `http://${configuredHost}:${port}`;

  const expoHost = readExpoHost();
  if (expoHost) return `http://${expoHost}:${port}`;

  if (Platform.OS === 'android') return `http://10.0.2.2:${port}`;
  return `http://localhost:${port}`;
}

export const env = {
  apiUrl: resolveApiUrl(),
};
