import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Ink, Radius } from '@/constants/theme';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Shimmer({ width = '100%', height = 14, radius = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: Ink[100], opacity },
        style,
      ]}
    />
  );
}

export function ShimmerCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <Shimmer width="40%" height={10} />
      <View style={{ height: 8 }} />
      <Shimmer width="70%" height={22} />
      <View style={{ height: 8 }} />
      <Shimmer width="50%" height={10} />
    </View>
  );
}

export function ShimmerList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Shimmer width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer width="60%" height={12} />
            <Shimmer width="40%" height={10} />
          </View>
          <Shimmer width={60} height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
  },
});
