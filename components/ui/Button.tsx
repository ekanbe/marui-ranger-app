import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Brand, Ink, Radius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  leading,
  trailing,
  style,
}: Props) {
  const sSize = sizeStyle(size);
  const v = variantStyle(variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sSize.container,
        v.container,
        fullWidth && { alignSelf: 'stretch' },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.4 },
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.labelColor} />
      ) : (
        <View style={styles.row}>
          {leading ? <View style={{ marginRight: 6 }}>{leading}</View> : null}
          <Text style={[sSize.label, { color: v.labelColor }]}>{label}</Text>
          {trailing ? <View style={{ marginLeft: 6 }}>{trailing}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

function sizeStyle(s: Size) {
  switch (s) {
    case 'sm':
      return {
        container: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.sm },
        label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
      };
    case 'lg':
      return {
        container: { paddingVertical: 16, paddingHorizontal: 22, borderRadius: Radius.md },
        label: { fontSize: 15, fontWeight: '800' as const, letterSpacing: 1.2 },
      };
    case 'md':
    default:
      return {
        container: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: Radius.sm },
        label: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.8 },
      };
  }
}

function variantStyle(v: Variant) {
  switch (v) {
    case 'secondary':
      return { container: { backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[200] }, labelColor: Ink[900] };
    case 'ghost':
      return { container: { backgroundColor: 'transparent' }, labelColor: Brand.navy };
    case 'danger':
      return { container: { backgroundColor: '#EF4444' }, labelColor: '#fff' };
    case 'cta':
      // 旧: Appetite.ember。新ルール：primary と同じ navy（一貫性を優先）
      return { container: { backgroundColor: Brand.navy }, labelColor: '#fff' };
    case 'primary':
    default:
      return { container: { backgroundColor: Brand.navy }, labelColor: '#fff' };
  }
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
