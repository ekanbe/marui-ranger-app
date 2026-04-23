import { router } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Ink } from '@/constants/theme';

type Props = {
  scroll?: boolean;
  padded?: boolean;
  background?: 'default' | 'alt' | 'white';
  back?: boolean;
  style?: ViewStyle;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  background = 'alt',
  back = false,
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

  const content = (
    <>
      {back ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>戻る</Text>
        </Pressable>
      ) : null}
      {children}
    </>
  );

  const body = scroll ? (
    <ScrollView contentContainerStyle={bodyStyle} showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  ) : (
    <View style={[bodyStyle, { flex: 1 }]}>{content}</View>
  );
  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: bg }]}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { paddingBottom: 96 },
  bodyPadded: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 96 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 10,
    marginBottom: 8,
  },
  backArrow: { fontSize: 28, color: Ink[700], fontWeight: '300', lineHeight: 28, marginRight: 2 },
  backLabel: { fontSize: 13, color: Ink[700], fontWeight: '700' },
});
