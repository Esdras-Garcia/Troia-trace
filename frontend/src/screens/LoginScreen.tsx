import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BarChart3, Building2, Check, FileCheck, FileText, Lock, Mail, MapPin, Package, Phone, Recycle, Tag } from 'lucide-react-native';

import { login, persistAuthToken, register } from '../api/client';
import { Badge, Button, Card, colors, Input } from '../components/ui';

export function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [plan, setPlan] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const isRegister = mode === 'register';

  async function submit() {
    if (submitting) {
      return;
    }

    if (isRegister) {
      const missingField = [
        [name, 'nome da empresa'],
        [document, 'documento'],
        [email, 'e-mail'],
        [phone, 'telefone'],
        [postalCode, 'CEP'],
        [address, 'endereço'],
        [plan, 'plano'],
      ].find(([value]) => !String(value).trim());

      if (missingField) {
        setError(`Informe o ${missingField[1]}.`);
        return;
      }

      if (!isValidCpfCnpj(document)) {
        setError('Informe um CPF ou CNPJ válido.');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const response = isRegister
        ? await register({
            name: name.trim(),
            document: document.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            plan: plan.trim(),
            password,
          })
        : await login({ email: email.trim(), password });
      await persistAuthToken(response.token);
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

  function changeDocument(value: string) {
    setDocument(formatCpfCnpj(value));
  }

  function changePhone(value: string) {
    setPhone(formatPhone(value));
  }

  async function changePostalCode(value: string) {
    const nextPostalCode = formatPostalCode(value);
    const digits = onlyDigits(nextPostalCode);

    setPostalCode(nextPostalCode);

    if (digits.length !== 8) {
      setLoadingAddress(false);
      return;
    }

    setLoadingAddress(true);
    setError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const result = await response.json() as ViaCepResponse;

      if (!response.ok || result.erro) {
        setError('CEP não encontrado.');
        return;
      }

      setAddress(formatAddressFromViaCep(result, nextPostalCode));
    } catch {
      setError('Não foi possível consultar o CEP agora.');
    } finally {
      setLoadingAddress(false);
    }
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
              <Badge tone="primary">Gestão de logística reversa</Badge>
              <Text style={styles.contextTitle}>Controle comprovações, materiais e parceiros em um painel único.</Text>
              <View style={styles.contextGrid}>
                <ContextMetric icon={FileCheck} label="Auditoria" value="Comprovações" />
                <ContextMetric icon={Package} label="Volumes e status" value="Materiais" />
                <ContextMetric icon={Building2} label="Responsáveis" value="Parceiros" />
                <ContextMetric icon={BarChart3} label="Indicadores" value="Relatórios" />
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
              <>
                <Field
                  icon={Building2}
                  label="Nome da empresa"
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome da empresa"
                  maxLength={120}
                />
                <Field
                  icon={FileText}
                  label="Documento"
                  value={document}
                  onChangeText={changeDocument}
                  placeholder="CNPJ ou CPF"
                  keyboardType="number-pad"
                  maxLength={18}
                />
                <Field
                  icon={Phone}
                  label="Telefone"
                  value={phone}
                  onChangeText={changePhone}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
                <Field
                  icon={MapPin}
                  label="CEP"
                  value={postalCode}
                  onChangeText={changePostalCode}
                  placeholder="00000-000"
                  keyboardType="number-pad"
                  maxLength={9}
                />
                <Field
                  icon={MapPin}
                  label={loadingAddress ? 'Endereço - buscando CEP...' : 'Endereço'}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Rua, número, bairro, cidade - UF"
                  maxLength={220}
                />
                <PlanSelect value={plan} onChange={setPlan} />
              </>
            ) : null}
            <Field
              icon={Mail}
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="email@empresa.com"
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={180}
            />
            <Field
              icon={Lock}
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              maxLength={80}
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

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

function isValidCpfCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

function isValidCpf(digits: string) {
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstDigit = cpfCheckDigit(digits, 9);
  const secondDigit = cpfCheckDigit(digits, 10);

  return digits[9] === String(firstDigit) && digits[10] === String(secondDigit);
}

function cpfCheckDigit(digits: string, size: number) {
  const sum = digits
    .slice(0, size)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (size + 1 - index), 0);
  const rest = (sum * 10) % 11;

  return rest === 10 ? 0 : rest;
}

function isValidCnpj(digits: string) {
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  const firstDigit = cnpjCheckDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = cnpjCheckDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits[12] === String(firstDigit) && digits[13] === String(secondDigit);
}

function cnpjCheckDigit(digits: string, weights: number[]) {
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  const rest = sum % 11;

  return rest < 2 ? 0 : 11 - rest;
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^(\(\d{2}\) \d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/^(\(\d{2}\) \d{5})(\d)/, '$1-$2');
}

function formatPostalCode(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

function formatAddressFromViaCep(result: ViaCepResponse, postalCode: string) {
  const street = result.logradouro?.trim();
  const district = result.bairro?.trim();
  const city = result.localidade?.trim();
  const state = result.uf?.trim();
  const cityState = [city, state].filter(Boolean).join(' - ');

  return [street, district, cityState, `CEP ${postalCode}`].filter(Boolean).join(', ');
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
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  maxLength?: number;
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

const planOptions = ['Essencial', 'Pro', 'Enterprise'];

function PlanSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Plano</Text>
      <View style={styles.planGroup}>
        {planOptions.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              style={[styles.planOption, selected && styles.planOptionSelected]}
              onPress={() => onChange(option)}
            >
              <View style={[styles.planIcon, selected && styles.planIconSelected]}>
                {selected ? <Check color="#fff" size={14} /> : <Tag color={colors.muted} size={14} />}
              </View>
              <Text style={[styles.planText, selected && styles.planTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
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
    alignItems: 'flex-start',
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
    height: 500,
    padding: 20,
  },
  contextPanelMobile: {
    height: 'auto',
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
  planGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planOption: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  planOptionSelected: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  planIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  planIconSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  planTextSelected: {
    color: colors.text,
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
