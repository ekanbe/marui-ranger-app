import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Ink, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
  }

  void Ink;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          {/* ブランドロゴ */}
          <View style={{ marginTop: 40 }}>
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                contentFit="cover"
              />
            </View>
            <Text style={styles.title}>RANGER</Text>
            <Text style={styles.subtitle}>MARUI BUSSAN</Text>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@marui-bussan.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>パスワード</Text>
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Text style={styles.toggleText}>{showPassword ? '隠す' : '表示'}</Text>
                </Pressable>
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                style={styles.input}
              />
              {showPassword && password.length > 0 ? (
                <Text style={styles.charCount}>{password.length} 文字入力中</Text>
              ) : null}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (loading || !email || !password) && styles.buttonDisabled,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={signIn}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color={Brand.navy} />
              ) : (
                <Text style={[styles.buttonText, (!email || !password) && styles.buttonTextDisabled]}>ログイン →</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footer}>v1.9 · MARUI BUSSAN</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.navyDeep },
  flex: { flex: 1 },

  inner: { flex: 1, padding: 32, justifyContent: 'space-between' },

  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,118,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#C9A876',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  title: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: 8 },
  subtitle: { color: 'rgba(201,168,118,0.8)', fontSize: 11, letterSpacing: 6, marginTop: 4, fontWeight: '700' },

  form: { gap: 18 },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  toggleText: { color: Brand.gold, fontSize: 11, fontWeight: '800' },
  charCount: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'right', marginTop: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Radius.sm, padding: 10,
  },
  errorIcon: { fontSize: 14 },
  errorText: { color: '#FCA5A5', fontSize: 12, flex: 1 },

  button: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  buttonText: { color: Brand.navyDark, fontWeight: '900', fontSize: 15, letterSpacing: 2 },
  buttonTextDisabled: { color: 'rgba(255,255,255,0.5)' },

  footer: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', letterSpacing: 2 },
});
