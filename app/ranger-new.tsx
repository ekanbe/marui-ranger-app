import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { rankLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const RANKS = ['bronze', 'silver', 'gold', 'platinum'] as const;

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + '!';
}

export default function RangerNewScreen() {
  const { session } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [rangerCode, setRangerCode] = useState('');
  const [rank, setRank] = useState<typeof RANKS[number]>('bronze');
  const [goal, setGoal] = useState('500000');
  const [password, setPassword] = useState(generatePassword());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);

  async function submit() {
    if (!session) {
      setError('セッションが無効です');
      return;
    }
    if (!displayName.trim() || !email.trim() || !rangerCode.trim() || !password.trim()) {
      setError('すべての項目を入力してください');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-ranger', {
        body: {
          email: email.trim(),
          password,
          display_name: displayName.trim(),
          ranger_code: rangerCode.trim(),
          current_rank: rank,
          monthly_goal_jpy: Number(goal) || 0,
        },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      setSuccess({ email: email.trim(), password });
    } catch (e: any) {
      setError(e?.message ?? '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  function copyCreds() {
    if (!success) return;
    const text = `メール: ${success.email}\nパスワード: ${success.password}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      const msg = 'コピーしました';
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('ログイン情報', text);
    }
  }

  if (success) {
    return (
      <Screen back>
        <Text style={styles.title}>レンジャー追加完了</Text>
        <Text style={styles.sub}>初回ログイン情報を本人に伝えてください</Text>

        <Card variant="elevated" padding={20} style={{ marginTop: 20 }}>
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>メールアドレス</Text>
            <Text style={styles.credValue} selectable>{success.email}</Text>
          </View>
          <View style={styles.credDivider} />
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>初期パスワード</Text>
            <Text style={styles.credValue} selectable>{success.password}</Text>
          </View>
        </Card>

        <View style={{ marginTop: 16 }}>
          <Button label="📋 ログイン情報をコピー" variant="secondary" size="lg" fullWidth onPress={copyCreds} />
        </View>

        <Text style={styles.note}>
          ※ 本人はこのメール/パスワードでログインし、マイページから自由に変更できます
        </Text>

        <View style={{ marginTop: 24 }}>
          <Button
            label="一覧に戻る"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(tabs)/rangers')}
          />
        </View>
      </Screen>
    );
  }

  const canSubmit = !submitting
    && displayName.trim().length > 0
    && email.trim().length > 0
    && rangerCode.trim().length > 0
    && password.trim().length >= 8;

  return (
    <Screen back>
      <Text style={styles.title}>レンジャーを追加</Text>
      <Text style={styles.sub}>基本情報を入力して招待します</Text>

      <SectionTitle title="基本情報" style={{ marginTop: 20 }} />

      <View style={styles.field}>
        <Text style={styles.label}>表示名 <Text style={styles.req}>*</Text></Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="例：田中 太郎"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>メールアドレス <Text style={styles.req}>*</Text></Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="tanaka@marui-bussan.com"
          placeholderTextColor={Ink[400]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>レンジャーコード <Text style={styles.req}>*</Text></Text>
        <TextInput
          value={rangerCode}
          onChangeText={setRangerCode}
          placeholder="例：R-0007"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <SectionTitle title="ランク・目標" style={{ marginTop: 20 }} />

      <View style={styles.field}>
        <Text style={styles.label}>初期ランク</Text>
        <View style={styles.chipRow}>
          {RANKS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRank(r)}
              style={[styles.chip, rank === r && styles.chipActive]}
            >
              <Text style={[styles.chipText, rank === r && styles.chipTextActive]}>{rankLabel(r)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>月間目標（円）</Text>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="500000"
          placeholderTextColor={Ink[400]}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <SectionTitle title="初回ログインパスワード" caption="自動生成済み・必要なら変更可" style={{ marginTop: 20 }} />

      <View style={styles.field}>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={Ink[400]}
            style={[styles.input, { flex: 1, minWidth: 0 }]}
          />
          <Pressable onPress={() => setPassword(generatePassword())} style={styles.regenBtn}>
            <Text style={styles.regenText}>🔄 再生成</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 24 }}>
        <Button
          label="レンジャーを追加"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
          onPress={submit}
        />
      </View>

      <Text style={styles.note}>
        ※ 追加後、メールアドレスと初期パスワードを本人にお渡しください。{'\n'}
        ※ 本人は初回ログイン後、自由にパスワード変更できます。
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
  req: { color: '#EF4444', fontWeight: '900' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Ink[900],
  },

  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regenBtn: {
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: Ink[100],
    borderRadius: Radius.sm,
  },
  regenText: { fontSize: 12, fontWeight: '700', color: Ink[900] },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
  },
  chipActive: { backgroundColor: Brand.navy, borderColor: Brand.navy },
  chipText: { fontSize: 12, color: Ink[700], fontWeight: '700' },
  chipTextActive: { color: '#fff' },

  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 14,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: Radius.sm,
    textAlign: 'center',
  },
  note: { fontSize: 11, color: Ink[500], marginTop: 14, lineHeight: 17 },

  credRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 6 },
  credLabel: { fontSize: 12, color: Ink[500], fontWeight: '700' },
  credValue: { fontSize: 14, color: Ink[900], fontWeight: '700', textAlign: 'right', flex: 1 },
  credDivider: { height: 1, backgroundColor: Ink[100], marginVertical: 8 },
});
