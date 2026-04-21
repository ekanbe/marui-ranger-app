import { StyleSheet, View, ViewStyle } from 'react-native';
import { Brand } from '@/constants/theme';

export function ProgressBar({ progress, height = 8, trackColor = 'rgba(255,255,255,0.2)', style }: {
  progress: number;
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
}) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={[{ height, backgroundColor: trackColor, borderRadius: height / 2, overflow: 'hidden' }, style]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: Brand.gold,
    borderRadius: 999,
  },
});
