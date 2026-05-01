import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const BUSINESS_TYPES = ['中華', 'カフェ', 'ドリンク', 'スイーツ', '和食', '居酒屋', 'その他'];

const PAIN_OPTIONS: { key: string; label: string }[] = [
  { key: 'labor_shortage', label: '人手不足' },
  { key: 'low_avg_spend', label: '客単価が伸びない' },
  { key: 'new_menu', label: '新メニュー導入' },
  { key: 'weak_takeout', label: 'テイクアウトが弱い' },
  { key: 'cost_ratio', label: '原価率を守りたい' },
  { key: 'differentiation', label: '他店との差別化' },
];

export default function NewCustomerScreen() {
  const { session } = useAuth();

  const [name, setName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [pains, setPains] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePain(key: string) {
    setPains((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  async function submit() {
    if (!session || !name.trim()) return;
    setSubmitting(true);
    setError(null);

    const now = new Date();
    const code = `C-${now.getTime().toString().slice(-8)}`;

    const { data: customer, error: err } = await supabase
      .from('customers')
      .insert({
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_code: code,
        name: name.trim(),
        branch_name: branchName.trim() || null,
        address: address.trim() || null,
        business_type: businessType || null,
        assigned_ranger_id: session.user.id,
        acquired_by_ranger_id: session.user.id,
        acquired_at: now.toISOString(),
        sales_phase: 'credit_check',
        status: 'active',
      })
      .select('id')
      .single();

    if (err || !customer) {
      setError(err?.message ?? 'customers insert 失敗');
      setSubmitting(false);
      return;
    }

    await supabase.from('customer_ranger_assignments').insert({
      customer_id: customer.id,
      ranger_id: session.user.id,
      role: 'primary',
      valid_from: now.toISOString(),
      reason: '新規登録',
      created_by: session.user.id,
    });

    if (pains.length > 0) {
      await supabase.from('customer_attributes').insert(
        pains.map((p) => ({
          customer_id: customer.id,
          attribute_key: 'pain_point',
          attribute_value: p,
        }))
      );
    }

    await supabase.rpc('fn_generate_recommendations', { p_customer_id: customer.id });

    setSubmitting(false);
    const msg = `🎉 ${name} を登録しました`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('完了', msg);
    }
    router.back();
  }

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Screen back>
      <Text style={styles.title}>新規顧客登録</Text>
      <Text style={styles.sub}>担当店舗として登録します</Text>

      <View style={styles.field}>
        <Text style={styles.label}>店舗名 <Text style={styles.required}>*</Text></Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="例：鼎泰豊"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>支店名</Text>
        <TextInput
          value={branchName}
          onChangeText={setBranchName}
          placeholder="例：東京駅八重洲口店"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>住所</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="例：東京都千代田区"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <SectionTitle title="業種" caption="1つ選択" />
      <View style={styles.chipRow}>
        {BUSINESS_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setBusinessType(businessType === t ? '' : t)}
            style={[styles.chip, businessType === t && styles.chipActive]}
          >
            <Text style={[styles.chipText, businessType === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle title="この店舗の悲鳴" caption="複数選択可・推薦商品の生成に使われます" />
      <View style={styles.chipRow}>
        {PAIN_OPTIONS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => togglePain(p.key)}
            style={[styles.painChip, pains.includes(p.key) && styles.painChipActive]}
          >
            <Text style={[styles.painChipText, pains.includes(p.key) && styles.painChipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 24 }}>
        <Button
          label="顧客を登録"
          variant="cta"
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
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 20 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
  required: { color: '#EF4444', fontWeight: '900' },
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

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
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

  painChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
  },
  painChipActive: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: Accent.red,
  },
  painChipText: { fontSize: 12, color: Ink[700], fontWeight: '700' },
  painChipTextActive: { color: '#DC2626', fontWeight: '800' },

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
