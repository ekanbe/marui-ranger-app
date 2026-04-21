import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.body}>{children}</View>
  );
  return <SafeAreaView edges={['top']} style={styles.safe}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.surfaceAlt },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 96 },
});
