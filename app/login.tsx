import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Ink, Radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <View>
            <Text style={styles.title}>RANGER</Text>
            <Text style={styles.subtitle}>MARUI BUSSAN</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@marui-bussan.com"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.35)"
                secureTextEntry
                style={styles.input}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signIn}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color={Brand.navy} />
              ) : (
                <Text style={styles.buttonText}>ログイン</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>v1.0.0 · クリエイティブインフラ</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.navy },
  flex: { flex: 1 },
  inner: { flex: 1, padding: 32, justifyContent: 'space-between' },

  title: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 6, marginTop: 40 },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: 4, marginTop: 4 },

  form: { gap: 16 },
  field: { gap: 6 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  error: { color: '#F87171', fontSize: 12 },

  button: {
    backgroundColor: '#C9A876',
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Brand.navy, fontWeight: '800', fontSize: 15, letterSpacing: 2 },

  footer: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center', letterSpacing: 2 },
});

// Ink は将来拡張用（現状は未使用だが import を残しても問題ない）
void Ink;
