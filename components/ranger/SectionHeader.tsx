import { StyleSheet, Text, View } from 'react-native';
import { Brand, Ink } from '@/constants/theme';

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text onPress={onAction} style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '700', color: Ink[900] },
  action: { fontSize: 12, color: Brand.navy, fontWeight: '600' },
});
