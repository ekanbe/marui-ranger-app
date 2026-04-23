import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ink, Radius } from '@/constants/theme';

type Props = {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  trailing?: React.ReactNode;
  tone?: 'default' | 'warn';
  onPress?: () => void;
  style?: ViewStyle;
};

export function ListRow({ leading, title, subtitle, meta, trailing, tone = 'default', onPress, style }: Props) {
  const content = (
    <View
      style={[
        styles.row,
        tone === 'warn' && styles.warn,
        style,
      ]}
    >
      {leading ? <View style={{ marginRight: 12 }}>{leading}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  warn: { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.04)' },
  title: { fontSize: 14, fontWeight: '700', color: Ink[900] },
  subtitle: { fontSize: 11, color: Ink[500], marginTop: 2 },
  meta: { fontSize: 10, color: Ink[400], marginTop: 2 },
});
