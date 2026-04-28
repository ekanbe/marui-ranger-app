import { StyleSheet, View, ViewStyle } from 'react-native';
import { Accent, Brand, Ink } from '@/constants/theme';

type Tone = 'navy' | 'gold' | 'emerald' | 'ember' | 'amber';

type Props = {
  progress: number;
  height?: number;
  tone?: Tone;
  trackColor?: string;
  style?: ViewStyle;
};

const TONE_COLOR: Record<Tone, string> = {
  navy:    Brand.navy,
  gold:    Brand.gold,
  emerald: Accent.emerald,
  ember:   Brand.navy,
  amber:   Accent.amber,
};

export function Progress({ progress, height = 8, tone = 'gold', trackColor, style }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  const track = trackColor ?? 'rgba(255,255,255,0.2)';
  const fill = TONE_COLOR[tone];

  return (
    <View style={[{ height, backgroundColor: track, borderRadius: height / 2, overflow: 'hidden' }, style]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, height, backgroundColor: fill }]} />
    </View>
  );
}

type RingProps = {
  progress: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function ProgressRing({
  progress,
  size = 88,
  thickness = 8,
  color = Brand.gold,
  trackColor = Ink[200],
  children,
  style,
}: RingProps) {
  // SVGが無い環境向けの軽量な円形インジケータ（擬似的に実装）
  // 実用上は外側リング + 内側コンテンツで達成率を表現
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: trackColor,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        style,
      ]}
    >
      {/* 進捗表示はテキストで補う（round/ring はSVGが必要なため省略） */}
      <View
        style={{
          position: 'absolute',
          top: -thickness,
          left: -thickness,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: pct > 0.25 ? color : 'transparent',
          borderBottomColor: pct > 0.5 ? color : 'transparent',
          borderLeftColor: pct > 0.75 ? color : 'transparent',
          transform: [{ rotate: `${pct * 360 - 90}deg` }],
        }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { borderRadius: 999 },
});
