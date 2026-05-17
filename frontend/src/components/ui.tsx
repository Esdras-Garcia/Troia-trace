import { PropsWithChildren } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export const colors = {
  background: '#10131c',
  sidebar: '#0b0e15',
  card: '#181c27',
  cardSoft: '#1f2430',
  border: '#303747',
  text: '#f4f6fb',
  muted: '#9099aa',
  primary: '#f06a35',
  accent: '#2bb6d6',
  success: '#31c484',
  warning: '#e6c75c',
  danger: '#e25555',
};

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({
  children,
  tone = 'primary',
  style,
}: PropsWithChildren<{ tone?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'; style?: StyleProp<ViewStyle> }>) {
  return (
    <View style={[styles.badge, toneStyle(tone).badge, style]}>
      <Text style={[styles.badgeText, toneStyle(tone).text]}>{children}</Text>
    </View>
  );
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  style,
  textStyle,
}: PropsWithChildren<{
  onPress?: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'ghost' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}>) {
  return (
    <Pressable style={[styles.button, buttonStyle(variant), style]} onPress={onPress}>
      <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextSecondary, textStyle]}>{children}</Text>
    </Pressable>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  style,
}: {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      style={[styles.input, style]}
    />
  );
}

export function Progress({ value, color = colors.primary }: { value: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function StatCard({
  title,
  value,
  unit,
  change,
  description,
  tone,
}: {
  title: string;
  value: string;
  unit?: string;
  change: string;
  description: string;
  tone: string;
}) {
  const toneColor = tone === 'accent' ? colors.accent : tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.primary;

  return (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${toneColor}22` }]} />
        <Badge tone={tone === 'warning' ? 'accent' : 'success'}>{change}</Badge>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.statDescription}>{description}</Text>
    </Card>
  );
}

function toneStyle(tone: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted') {
  const map = {
    primary: colors.primary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    muted: colors.muted,
  };
  return {
    badge: { backgroundColor: `${map[tone]}18`, borderColor: `${map[tone]}55` },
    text: { color: map[tone] },
  };
}

function buttonStyle(variant: 'primary' | 'ghost' | 'outline') {
  if (variant === 'ghost') {
    return { backgroundColor: 'transparent', borderColor: 'transparent' };
  }

  if (variant === 'outline') {
    return { backgroundColor: 'transparent', borderColor: colors.border };
  }

  return { backgroundColor: colors.primary, borderColor: colors.primary };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: `${colors.border}bb`,
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    gap: 5,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#fff8f4',
    fontSize: 14,
    fontWeight: '900',
  },
  buttonTextSecondary: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: `${colors.border}bb`,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  progressTrack: {
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  statCard: {
    flex: 1,
    minWidth: 220,
  },
  statHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statIcon: {
    borderRadius: 8,
    height: 38,
    width: 38,
  },
  statTitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  statValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
  },
  statValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  statUnit: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  statDescription: {
    color: `${colors.muted}cc`,
    fontSize: 12,
    marginTop: 8,
  },
});
