import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ink } from '@/constants/theme';

type Props = {
  title: string;
  caption?: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function SectionTitle({ title, caption, action, onAction, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, marginTop: 4 },
  title: { fontSize: 15, fontWeight: '800', color: Ink[900], letterSpacing: -0.2 },
  caption: { fontSize: 11, color: Ink[500], marginTop: 2 },
  action: { fontSize: 12, color: Ink[900], fontWeight: '700' },
});
