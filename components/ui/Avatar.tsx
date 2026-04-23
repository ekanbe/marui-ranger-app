import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Brand, Ink } from '@/constants/theme';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  name?: string | null;
  imageUrl?: string | null;
  size?: Size;
  tone?: 'navy' | 'gold' | 'ink';
  style?: ViewStyle;
};

const SIZES: Record<Size, { box: number; text: number }> = {
  xs: { box: 28, text: 11 },
  sm: { box: 36, text: 13 },
  md: { box: 44, text: 16 },
  lg: { box: 56, text: 20 },
  xl: { box: 72, text: 26 },
};

const TONES = {
  navy: { bg: Brand.navy, fg: '#fff' },
  gold: { bg: Brand.gold, fg: '#fff' },
  ink:  { bg: Ink[300], fg: Ink[900] },
};

export function Avatar({ name, imageUrl, size = 'md', tone = 'navy', style }: Props) {
  const s = SIZES[size];
  const t = TONES[tone];
  const initial = (name ?? '?').trim().charAt(0) || '?';

  return (
    <View
      style={[
        styles.base,
        { width: s.box, height: s.box, borderRadius: s.box / 2, backgroundColor: imageUrl ? Ink[100] : t.bg },
        style,
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: s.box, height: s.box }} />
      ) : (
        <Text style={[styles.text, { fontSize: s.text, color: t.fg }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { fontWeight: '800' },
});
