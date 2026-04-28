import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Accent, Brand, Radius, Shadow } from '@/constants/theme';

type Tone = 'navy' | 'emerald' | 'ember' | 'gold';

type Props = PropsWithChildren<{
  label?: string;
  value?: string;
  sub?: string;
  tone?: Tone;
  style?: ViewStyle;
}>;

const TONE: Record<Tone, { bg: string; accent: string; labelColor: string }> = {
  navy:    { bg: Brand.navy,          accent: Accent.emeraldLight, labelColor: 'rgba(255,255,255,0.7)' },
  emerald: { bg: Accent.emeraldDark,  accent: '#A7F3D0',           labelColor: 'rgba(255,255,255,0.75)' },
  ember:   { bg: Brand.navy,          accent: Accent.emeraldLight, labelColor: 'rgba(255,255,255,0.7)' },
  gold:    { bg: Brand.goldDark,      accent: '#FDE68A',           labelColor: 'rgba(255,255,255,0.8)' },
};

export function HeroCard({ label, value, sub, tone = 'navy', style, children }: Props) {
  const t = TONE[tone];
  return (
    <View style={[styles.hero, { backgroundColor: t.bg }, style]}>
      {/* 背景装飾（角の発光） */}
      <View style={[styles.glow, { backgroundColor: t.accent, opacity: 0.15 }]} />
      {label ? <Text style={[styles.label, { color: t.labelColor }]}>{label}</Text> : null}
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {sub ? <Text style={[styles.sub, { color: t.labelColor }]}>{sub}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.hero,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  value: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -1,
  },
  sub: {
    fontSize: 12,
    marginTop: 8,
  },
});
