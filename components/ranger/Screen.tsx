import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

type Props = {
  scroll?: boolean;
  padded?: boolean;
  background?: 'default' | 'alt' | 'white';
  style?: ViewStyle;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  background = 'alt',
  style,
}: PropsWithChildren<Props>) {
  const bg =
    background === 'white' ? '#FFFFFF' :
    background === 'default' ? Colors.light.background :
    Colors.light.surfaceAlt;

  const bodyStyle = [
    padded ? styles.bodyPadded : styles.body,
    style,
  ];

  const body = scroll ? (
    <ScrollView contentContainerStyle={bodyStyle} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[bodyStyle, { flex: 1 }]}>{children}</View>
  );
  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: bg }]}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { paddingBottom: 96 },
  bodyPadded: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 96 },
});
