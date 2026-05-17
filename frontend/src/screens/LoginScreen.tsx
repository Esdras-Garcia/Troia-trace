import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Building2, CheckCircle2, FileCheck, Lock, Mail, Recycle, ShieldCheck } from 'lucide-react-native';

import { login, register, setAuthToken } from '../api/client';
import { Badge, Button, Card, colors, Input } from '../components/ui';

export function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const isRegister = mode === 'register';

  async function submit() {
    if (submitting) {
      return;
    }

    if (isRegister && !name.trim()) {
      setError('Informe o nome da empresa.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = isRegister
        ? await register({ name: name.trim(), email: email.trim(), password })
        : await login({ email: email.trim(), password });
      setAuthToken(response.token);
      onAuthenticated();
    } catch {
      setError(isRegister ? 'Não foi possível cadastrar esta empresa.' : 'E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, !isWide && styles.scrollContentMobile]}>
      <View style={[styles.shell, !isWide && styles.shellMobile]}>
        <View style={[styles.contextPanel, !isWide && styles.contextPanelMobile]}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Recycle color="#fff" size={24} />
            </View>
            <View>
              <Text style={styles.brandTitle}>Troia Trace</Text>
              <Text style={styles.brandSubtitle}>Logística Reversa</Text>
            </View>
          </View>

          {isWide ? (
            <View style={styles.contextBody}>
              <Badge tone="primary">Acesso seguro</Badge>
              <Text style={styles.contextTitle}>Rastreabilidade operacional para comprovações, materiais e parceiros.</Text>
              <View style={styles.contextGrid}>
                <ContextMetric icon={FileCheck} label="Comprovações" value="Lastro" />
                <ContextMetric icon={ShieldCheck} label="Autenticação" value="JWT" />
                <ContextMetric icon={CheckCircle2} label="Senha" value="BCrypt" />
              </View>
            </View>
          ) : null}
        </View>

        <Card style={[styles.authCard, !isWide && styles.authCardMobile]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.title}>{isRegister ? 'Cadastrar empresa' : 'Entrar'}</Text>
              <Text style={styles.subtitle}>{isRegister ? 'Crie o acesso da empresa para usar o painel.' : 'Acesse o painel com o e-mail cadastrado.'}</Text>
            </View>
          </View>

          <View style={styles.segmented}>
            <Button
              variant={isRegister ? 'outline' : 'primary'}
              style={styles.segmentButton}
              onPress={() => switchMode('login')}
            >
              Entrar
            </Button>
            <Button
              variant={isRegister ? 'primary' : 'outline'}
              style={styles.segmentButton}
              onPress={() => switchMode('register')}
            >
              Criar conta
            </Button>
          </View>

          <View style={styles.form}>
            {isRegister ? (
              <Field
                icon={Building2}
                label="Nome da empresa"
                value={name}
                onChangeText={setName}
                placeholder="Nome da empresa"
              />
            ) : null}
            <Field
              icon={Mail}
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="email@empresa.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              icon={Lock}
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button style={styles.submitButton} onPress={submit}>
              {submitting ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
            </Button>
            <Button variant="outline" onPress={() => switchMode(isRegister ? 'login' : 'register')}>
              {isRegister ? 'Já tenho conta' : 'Criar uma conta'}
            </Button>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChangeText,
  placeholder,
  ...inputProps
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <View style={styles.inputIcon}>
          <Icon color={colors.muted} size={17} />
        </View>
        <Input value={value} onChangeText={onChangeText} placeholder={placeholder} style={styles.input} {...inputProps} />
      </View>
    </View>
  );
}

function ContextMetric({ icon: Icon, label, value }: { icon: typeof FileCheck; label: string; value: string }) {
  return (
    <View style={styles.contextMetric}>
      <View style={styles.contextIcon}>
        <Icon color={colors.primary} size={18} />
      </View>
      <View>
        <Text style={styles.contextMetricValue}>{value}</Text>
        <Text style={styles.contextMetricLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollContentMobile: {
    justifyContent: 'flex-start',
    padding: 14,
  },
  shell: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
    maxWidth: 1080,
    width: '100%',
  },
  shellMobile: {
    flexDirection: 'column',
    gap: 14,
  },
  contextPanel: {
    backgroundColor: colors.sidebar,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 500,
    padding: 20,
  },
  contextPanelMobile: {
    minHeight: 0,
    padding: 14,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  contextBody: {
    gap: 20,
  },
  contextTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 36,
    maxWidth: 440,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contextMetric: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 150,
    padding: 12,
  },
  contextIcon: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}18`,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  contextMetricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  contextMetricLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  authCard: {
    flex: 0.92,
    gap: 18,
    justifyContent: 'center',
    maxWidth: 440,
    minHeight: 500,
    padding: 22,
  },
  authCardMobile: {
    maxWidth: '100%',
    minHeight: 0,
    padding: 16,
  },
  cardHeader: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  segmented: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
  },
  segmentButton: {
    flex: 1,
  },
  form: {
    gap: 13,
  },
  field: {
    gap: 7,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  inputShell: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inputIcon: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  input: {
    flex: 1,
  },
  error: {
    backgroundColor: `${colors.danger}16`,
    borderColor: `${colors.danger}55`,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    padding: 10,
  },
  submitButton: {
    marginTop: 2,
  },
});
