import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Ink, Radius, Shadow } from '@/constants/theme';

type Variant = 'surface' | 'elevated' | 'outline' | 'muted' | 'hero';

type Props = PropsWithChildren<{
  variant?: Variant;
  padding?: number;
  radius?: keyof typeof Radius;
  style?: ViewStyle | ViewStyle[];
}>;

export function Card({ variant = 'surface', padding = 16, radius = 'lg', style, children }: Props) {
  const vStyle = variantStyle(variant);
  return (
    <View style={[vStyle, { borderRadius: Radius[radius], padding }, style as ViewStyle]}>
      {children}
    </View>
  );
}

function variantStyle(v: Variant): ViewStyle {
  switch (v) {
    case 'elevated':
      return { backgroundColor: Colors.light.surface, ...Shadow.md };
    case 'outline':
      return { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Ink[200] };
    case 'muted':
      return { backgroundColor: Ink[100] };
    case 'hero':
      return { backgroundColor: Colors.light.surface, ...Shadow.lg, borderWidth: 1, borderColor: Ink[100] };
    case 'surface':
    default:
      return { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Ink[100] };
  }
}

export const CardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: Ink[100], marginVertical: 12 },
});
