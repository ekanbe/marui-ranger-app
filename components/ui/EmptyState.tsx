import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ink, Radius } from '@/constants/theme';
import { Button } from './Button';

type Props = {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function EmptyState({ icon = '🔎', title, message, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.msg}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 16 }}>
          <Button label={actionLabel} onPress={onAction} variant="primary" size="md" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    backgroundColor: Ink[50],
    borderWidth: 1,
    borderColor: Ink[100],
    borderStyle: 'dashed',
  },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', color: Ink[900], textAlign: 'center' },
  msg: { fontSize: 12, color: Ink[500], textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
