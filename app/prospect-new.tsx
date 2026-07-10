import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { AutoGrowTextInput } from '@/components/ui/AutoGrowTextInput';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

/**
 * 新規開拓顧客（プロスペクト）の登録
 *
 * 既存顧客はVIPS経由でのみ登録される（手動登録は廃止済み）。
 * この画面は「レンジャーが自分で開拓中の新規客」専用:
 *   acquired_by_ranger_id = 自分（不可逆・新規判定フラグ）
 *   status = 'prospect' / sales_phase = 'credit_check' から開始
 * 成約してVIPSに店舗コードが発番されたら、顧客編集画面で
 * VIPS店舗コードを入力すると売上が自動で紐づき始める。
 */
export default function ProspectNewScreen() {
  const { session } = useAuth();

  const [name, setName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameEmpty = name.trim().length === 0;

  async function submit() {
    if (!session) return;
    if (nameEmpty) {
      setError('会社名（得意先名）を入力してください');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
      if (!tenant) throw new Error('tenant_id が取得できません');

      const { error: insErr } = await supabase.from('customers').insert({
        tenant_id: tenant.id,
        name: name.trim(),
        branch_name: branchName.trim() || null,
        business_type: businessType.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        note: note.trim() || null,
        status: 'prospect',
        sales_phase: 'credit_check',
        acquired_by_ranger_id: session.user.id,
        acquired_at: new Date().toISOString(),
        assigned_ranger_id: session.user.id,
      });
      if (insErr) throw insErr;

      const msg = '新規開拓顧客を登録しました（フェーズ: 与信）';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(msg);
      } else {
        Alert.alert('完了', msg);
      }
      router.back();
    } catch (e: any) {
      setError(e?.message ?? '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen back>
      <Text style={styles.title}>新規開拓の顧客を登録</Text>
      <Text style={styles.lead}>
        自分で開拓中の新規客を登録します。フェーズは「与信」から始まり、成約後にVIPS店舗コードを紐づけると売上が自動で反映されます
      </Text>

      <SectionTitle title="基本情報" />

      <View style={styles.field}>
        <Text style={styles.label}>会社名（得意先名）*</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="例: ○○フードサービス"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>店舗名（任意）</Text>
        <TextInput
          value={branchName}
          onChangeText={setBranchName}
          placeholder="例: 高崎本店"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>業態（任意）</Text>
        <TextInput
          value={businessType}
          onChangeText={setBusinessType}
          placeholder="例: カフェ / 居酒屋 / ホテル"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>電話番号（任意）</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="例: 027-000-0000"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>住所（任意）</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="例: 群馬県高崎市…"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>メモ（任意）</Text>
        <AutoGrowTextInput
          value={note}
          onChangeText={setNote}
          placeholder="きっかけ・紹介元・温度感など"
          placeholderTextColor={Ink[400]}
          style={styles.input}
          minHeight={70}
        />
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button
          label="新規開拓顧客を登録"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={submitting || nameEmpty}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  lead: { fontSize: 11, color: Ink[500], marginTop: 6, marginBottom: 18, lineHeight: 16 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
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
  multiline: { minHeight: 70, textAlignVertical: 'top' },

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
