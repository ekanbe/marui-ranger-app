import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Accent, Brand, Ink, Radius } from '@/constants/theme';

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 将来：Sentry等にレポート送信
    console.warn('[ErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>予期せぬエラーが発生しました</Text>
          <Text style={styles.message}>{this.state.error?.message ?? '詳細不明'}</Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: undefined })}
            style={styles.button}
          >
            <Text style={styles.buttonText}>再試行</Text>
          </Pressable>
          <Text style={styles.hint}>問題が続く場合は、アプリを一度終了して再度お試しください</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 14,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '800', color: Ink[900], textAlign: 'center' },
  message: { fontSize: 13, color: Accent.red, textAlign: 'center' },
  button: {
    marginTop: 20,
    backgroundColor: Brand.navy,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  hint: { fontSize: 11, color: Ink[500], marginTop: 10, textAlign: 'center' },
});
