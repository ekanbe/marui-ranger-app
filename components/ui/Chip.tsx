import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Brand, Ink } from '@/constants/theme';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
  leading?: React.ReactNode;
  style?: ViewStyle;
};

export function Chip({ label, active, onPress, count, leading, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.active : styles.inactive,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {leading ? <View style={{ marginRight: 4 }}>{leading}</View> : null}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{label}</Text>
      {count != null ? (
        <View style={[styles.countBox, active ? styles.countBoxActive : styles.countBoxInactive]}>
          <Text style={[styles.count, active ? styles.countActive : styles.countInactive]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 6,
  },
  inactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[200] },
  active:   { backgroundColor: Brand.navy, borderWidth: 1, borderColor: Brand.navy },
  label: { fontSize: 12, fontWeight: '700' },
  labelInactive: { color: Ink[700] },
  labelActive:   { color: '#fff' },
  countBox: { paddingHorizontal: 6, borderRadius: 999, minWidth: 18, alignItems: 'center' },
  countBoxInactive: { backgroundColor: Ink[100] },
  countBoxActive:   { backgroundColor: 'rgba(255,255,255,0.22)' },
  count: { fontSize: 10, fontWeight: '800' },
  countInactive: { color: Ink[700] },
  countActive:   { color: '#fff' },
});
