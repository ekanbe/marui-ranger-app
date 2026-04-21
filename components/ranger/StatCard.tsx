import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Accent, Colors, Ink, Radius } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  sub?: string;
  subTone?: 'emerald' | 'amber' | 'red' | 'ink';
  style?: ViewStyle;
};

export function StatCard({ label, value, sub, subTone = 'ink', style }: Props) {
  const subColor = subTone === 'emerald' ? Accent.emerald
                 : subTone === 'amber'   ? Accent.amber
                 : subTone === 'red'     ? Accent.red
                 : Ink[500];
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {sub ? <Text style={[styles.sub, { color: subColor }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    color: Ink[500],
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: { fontSize: 22, fontWeight: '700', color: Ink[900] },
  sub: { fontSize: 11, marginTop: 4 },
});
