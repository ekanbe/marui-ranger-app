import { Image } from 'expo-image';
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
      {/* 薄いブランドウォーターマーク（右下） */}
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.watermark}
        contentFit="cover"
      />
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
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    borderRadius: 20,
    opacity: 0.06,
  },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', color: Ink[900], textAlign: 'center' },
  msg: { fontSize: 12, color: Ink[500], textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
