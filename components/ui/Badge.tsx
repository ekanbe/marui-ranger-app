import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Accent, Brand, Ink, RankColor } from '@/constants/theme';

type Tone =
  | 'neutral'
  | 'navy'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'blue'
  | 'violet'
  | 'ember'
  | 'coral'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze';

type Props = {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
};

const TONE: Record<Tone, { bg: string; fg: string }> = {
  neutral:  { bg: Ink[100],                  fg: Ink[700] },
  navy:     { bg: 'rgba(30,58,95,0.1)',      fg: Brand.navy },
  emerald:  { bg: 'rgba(16,185,129,0.12)',   fg: Accent.emeraldDark },
  amber:    { bg: 'rgba(245,158,11,0.14)',   fg: '#B45309' },
  red:      { bg: 'rgba(239,68,68,0.12)',    fg: '#B91C1C' },
  blue:     { bg: 'rgba(59,130,246,0.12)',   fg: '#1D4ED8' },
  violet:   { bg: 'rgba(139,92,246,0.12)',   fg: '#6D28D9' },
  // ember/coral は非推奨。下記は互換のため残すが新規使用禁止
  ember:    { bg: 'rgba(30,58,95,0.1)',      fg: Brand.navy },
  coral:    { bg: 'rgba(239,68,68,0.12)',    fg: '#B91C1C' },
  platinum: { bg: RankColor.platinumBg,      fg: RankColor.platinum },
  gold:     { bg: RankColor.goldBg,          fg: RankColor.gold },
  silver:   { bg: RankColor.silverBg,        fg: RankColor.silver },
  bronze:   { bg: RankColor.bronzeBg,        fg: RankColor.bronze },
};

export function Badge({ label, tone = 'neutral', size = 'sm', dot, style }: Props) {
  const t = TONE[tone];
  const sStyle = size === 'md' ? styles.md : styles.sm;
  return (
    <View style={[styles.base, sStyle, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.text, size === 'md' ? styles.textMd : styles.textSm, { color: t.fg }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  md: { paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontWeight: '700', letterSpacing: 0.3 },
  textSm: { fontSize: 10 },
  textMd: { fontSize: 11 },
});
