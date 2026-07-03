import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const MIN_LENGTH = 8;

export default function PasswordChangeScreen() {
  const { session } = useAuth();
  const email = session?.user.email ?? '';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < MIN_LENGTH;
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const sameAsCurrent =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword;

  const canSubmit =
    !submitting &&
    currentPassword.length > 0 &&
    newPassword.length >= MIN_LENGTH &&
    confirmPassword.length > 0 &&
    !confirmMismatch &&
    !sameAsCurrent;

  async function submit() {
    if (!session || !email) {
      setError('セッションが無効です。再ログインしてください。');
      return;
    }
    setError(null);
    setSubmitting(true);

    // ① 現在のパスワードで再認証
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInErr) {
      setSubmitting(false);
      setError('現在のパスワードが正しくありません');
      return;
    }

    // ② 新しいパスワードに更新
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      setSubmitting(false);
      setError(updateErr.message);
      return;
    }

    setSubmitting(false);

    const msg = '✅ パスワードを変更しました';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('完了', msg);
    }
    router.back();
  }

  return (
    <Screen back>
      <Text style={styles.title}>パスワード変更</Text>
      <Text style={styles.sub}>本人だけが知るパスワードに変更してください</Text>

      <Card variant="muted" padding={14} style={{ marginTop: 12, marginBottom: 4 }}>
        <Text style={styles.warnIcon}>🔐 初期パスワードのままの方へ</Text>
        <Text style={styles.warnText}>
          セキュリティのため、管理者から渡された初期パスワードでログイン中の方は、必ずご自身のパスワードに変更してください。
        </Text>
      </Card>

      {/* アカウント */}
      <SectionTitle title="アカウント" caption="変更不可" style={{ marginTop: 20 }} />
      <Card variant="muted" padding={16}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>メール</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{email || '—'}</Text>
        </View>
      </Card>

      {/* 現在のパスワード */}
      <SectionTitle title="現在のパスワード" style={{ marginTop: 20 }} />
      <View style={styles.inputWrap}>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="現在のパスワード"
          placeholderTextColor={Ink[400]}
          secureTextEntry={!showCurrent}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          style={styles.input}
        />
        <Pressable onPress={() => setShowCurrent((v) => !v)} hitSlop={10} style={styles.toggle}>
          <Text style={styles.toggleText}>{showCurrent ? '隠す' : '表示'}</Text>
        </Pressable>
      </View>

      {/* 新しいパスワード */}
      <SectionTitle
        title="新しいパスワード"
        caption={`${MIN_LENGTH}文字以上、英数字推奨`}
        style={{ marginTop: 20 }}
      />
      <View style={styles.inputWrap}>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="新しいパスワード"
          placeholderTextColor={Ink[400]}
          secureTextEntry={!showNew}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          style={styles.input}
        />
        <Pressable onPress={() => setShowNew((v) => !v)} hitSlop={10} style={styles.toggle}>
          <Text style={styles.toggleText}>{showNew ? '隠す' : '表示'}</Text>
        </Pressable>
      </View>
      {newPasswordTooShort ? (
        <Text style={styles.hint}>{MIN_LENGTH}文字以上にしてください</Text>
      ) : null}
      {sameAsCurrent ? (
        <Text style={styles.hint}>現在と異なるパスワードを設定してください</Text>
      ) : null}

      {/* 確認用 */}
      <SectionTitle title="新しいパスワード（確認）" style={{ marginTop: 20 }} />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="もう一度入力"
        placeholderTextColor={Ink[400]}
        secureTextEntry={!showNew}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        style={styles.input}
      />
      {confirmMismatch ? (
        <Text style={styles.hint}>パスワードが一致しません</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 28 }}>
        <Button
          label="パスワードを変更"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

  warnIcon: { fontSize: 13, fontWeight: '800', color: Ink[900], marginBottom: 4 },
  warnText: { fontSize: 11, color: Ink[600], lineHeight: 16 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 12, color: Ink[500], fontWeight: '700' },
  infoValue: { fontSize: 13, color: Ink[900], fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },

  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    paddingRight: 56,
    fontSize: 15,
    color: Ink[900],
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleText: { color: Brand.gold, fontSize: 11, fontWeight: '800' },

  hint: { fontSize: 11, color: '#DC2626', marginTop: 6, marginLeft: 4 },

  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 14,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: Radius.sm,
    textAlign: 'center',
  },
});
